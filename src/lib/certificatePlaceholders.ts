import type { Form, FormSubmission } from "@/payload/payload-types";

/**
 * Certificates are designed in Google Slides, and whatever the member wants
 * printed is written there as `{{something}}`. The site reads the deck, finds
 * those markers, and asks the member where each one's value comes from - so
 * adding a new field to a certificate is a Slides edit plus a dropdown, never
 * a code change.
 *
 * Mapping is explicit rather than matching a placeholder against a question's
 * label. Label matching is what `certificateBatches` does, and it means
 * renaming a question silently breaks the certificate - every recipient gets a
 * literal `{{USN}}` printed on theirs, with nothing to warn the member.
 */

/** `{{ Place }}` and `{{Place}}` are the same marker; whitespace is trimmed. */
const PLACEHOLDER_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * Every distinct placeholder in a template, in the order it first appears -
 * which is roughly reading order, so the admin lists them the way the member
 * sees them on the slide.
 */
export function extractPlaceholders(templateText: string): string[] {
  const found: string[] = [];
  for (const match of templateText.matchAll(PLACEHOLDER_RE)) {
    const key = match[1].trim();
    if (key && !found.includes(key)) found.push(key);
  }
  return found;
}

/**
 * Resolve one form's placeholder mappings against one submission.
 *
 * `name` and `event` are always available without mapping: the name comes from
 * whichever question is marked as the person's name, and the event is the
 * form's title. They are the two every certificate uses, and requiring an
 * member to wire them up each time would be busywork.
 *
 * Anything unresolved is deliberately left out of the returned map rather than
 * blanked. The Apps Script clears leftover markers itself, and keeping them
 * absent here is what lets the admin warn about placeholders with no source.
 */
export function resolvePlaceholders(
  form: Form,
  submission: FormSubmission,
  certificateName: string,
): Record<string, string> {
  const answers = (submission.answersByLabel ?? {}) as Record<string, unknown>;
  const values: Record<string, string> = {
    name: certificateName,
    event: form.title,
  };

  // What a member typed against this person, matched case-insensitively for
  // the same reason everything else here is: Slides substitutes that way, so
  // {{Place}} and {{PLACE}} are one marker and it would be a trap for them to
  // behave as two.
  const perPerson = new Map<string, string>();
  for (const entry of submission.certificateValues ?? []) {
    const key = entry.key?.trim().toLowerCase();
    if (key && entry.value) perPerson.set(key, entry.value);
  }

  for (const mapping of form.certificatePlaceholders ?? []) {
    const key = mapping.key?.trim();
    if (!key) continue;

    if (mapping.source === "fixed") {
      if (mapping.fixedValue) values[key] = mapping.fixedValue;
      continue;
    }

    if (mapping.source === "perPerson") {
      // The default is what most people get - nobody placed in a competition
      // except the two or three who did - so an unset value is normal, not a
      // gap. Empty stays empty, and the script blanks the marker.
      const value = perPerson.get(key.toLowerCase()) ?? mapping.defaultValue;
      if (value) values[key] = value;
      continue;
    }

    const label = mapping.questionLabel?.trim();
    if (!label) continue;

    const answer = answers[label];
    if (answer === undefined || answer === null || answer === "") continue;
    values[key] = Array.isArray(answer) ? answer.join(", ") : String(answer);
  }

  return values;
}

/**
 * Placeholders present in the deck that no mapping covers - what the admin
 * warns about, so a missing value is caught while editing the form rather than
 * discovered on fifty printed certificates.
 */
export function unmappedPlaceholders(found: string[], form: Form): string[] {
  // Case-insensitive, because Slides' own replaceAllText is: a deck written
  // with {{NAME}} is filled correctly by a mapping keyed `name`, so warning
  // that it is unmapped would be a lie.
  const covered = new Set(["name", "event"]);
  for (const mapping of form.certificatePlaceholders ?? []) {
    const key = mapping.key?.trim().toLowerCase();
    if (key) covered.add(key);
  }
  return found.filter((key) => !covered.has(key.toLowerCase()));
}
