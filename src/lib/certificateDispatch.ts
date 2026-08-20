import "server-only";

import { appsScriptConfigured, sendCertificate } from "@/lib/appsScript";
import { resolvePlaceholders } from "@/lib/certificatePlaceholders";
import { applyNameCase } from "@/lib/textCase";
import type { Form, FormSubmission } from "@/payload/payload-types";
import config from "@/payload/payload.config";
import { getPayload } from "payload";

/**
 * Recorded on a due submission when the site has no way to send its
 * certificate. Compared against on later runs, so the message is written once
 * rather than on every cron pass.
 */
const NOT_CONFIGURED =
  "Apps Script is not configured (APPS_SCRIPT_URL / APPS_SCRIPT_SECRET)";

/** Fill {{name}}/{{event}} in a member-supplied subject/body template. */
function fillPlaceholders(
  template: string,
  name: string,
  event: string,
): string {
  return template.replaceAll("{{name}}", name).replaceAll("{{event}}", event);
}

export interface DispatchResult {
  attempted: number;
  sent: number;
  failed: number;
  skipped: string[];
}

/**
 * When a submission's certificate is due, or null if it isn't yet (or ever,
 * if nothing is configured to cover it).
 *
 * Immediate-delivery forms are always due - dispatch there is really just the
 * retry path for a send that failed right after submit.
 *
 * Scheduled forms support named batches so different groups can go out at
 * different times (e.g. "Section A at 5pm, Section B at 9pm"). A batch is
 * matched by checking one of the form's own questions against an expected
 * answer - `matchField` is the question's exact label, `matchValue` the
 * answer that puts someone in that group. The first matching batch wins.
 * Anyone matched by no batch falls back to the form's plain `certificateSendAt`.
 */
function dueAt(form: Form, submission: FormSubmission): Date | null {
  if (form.certificateDelivery === "immediate") return new Date(0);

  const answers = (submission.answersByLabel ?? {}) as Record<string, unknown>;

  for (const batch of form.certificateBatches ?? []) {
    if (!batch.matchField || !batch.sendAt) continue;
    if (String(answers[batch.matchField] ?? "") === batch.matchValue) {
      return new Date(batch.sendAt);
    }
  }

  return form.certificateSendAt ? new Date(form.certificateSendAt) : null;
}

/**
 * Send certificates for one form to everyone still marked `pending` whose
 * certificate is due.
 *
 * The PDF is built and mailed by the Apps Script web app (see
 * `scripts/appsScript/certificateSender.gs`); this decides who gets one, when,
 * and records the outcome.
 *
 * Rolling by design: it can be called repeatedly and simply picks up whoever
 * is due now, so someone who submits after their batch's send time still gets
 * theirs on the next pass. Status is per recipient, so a failure retries
 * without re-sending to people who already received one.
 */
export async function dispatchCertificatesForForm(
  formId: number,
  limit = 200,
): Promise<DispatchResult> {
  const result: DispatchResult = {
    attempted: 0,
    sent: 0,
    failed: 0,
    skipped: [],
  };

  const payload = await getPayload({ config });
  const form = await payload.findByID({
    collection: "forms",
    id: formId,
    depth: 0,
  });

  if (!form?.showCertificate) {
    result.skipped.push("form does not issue certificates");
    return result;
  }

  // Missing config used to return here silently, which left every affected
  // submission sitting at `pending` with an empty error - indistinguishable in
  // the admin from one that is simply not due yet. The reason is recorded on
  // the rows it actually blocks instead, so a member can see why.
  const notConfigured = !appsScriptConfigured();
  if (notConfigured) {
    result.skipped.push(NOT_CONFIGURED);
  }

  const pending = await payload.find({
    collection: "form-submissions",
    where: {
      and: [
        { form: { equals: formId } },
        { certificateStatus: { equals: "pending" } },
      ],
    },
    limit,
    depth: 0,
    overrideAccess: true,
  });

  const now = Date.now();

  for (const submission of pending.docs) {
    const due = dueAt(form, submission);
    if (!due || due.getTime() > now) continue; // not due yet - stays pending

    // Due, but there is nothing to send it with. Stay `pending` - this is a
    // deployment problem that will fix itself the moment the env vars land,
    // and flipping to `failed` would imply the recipient needs attention.
    // Written once; later runs see the same message and leave it alone.
    if (notConfigured) {
      if (submission.certificateError !== NOT_CONFIGURED) {
        await payload.update({
          collection: "form-submissions",
          id: submission.id,
          overrideAccess: true,
          data: { certificateError: NOT_CONFIGURED },
        });
      }
      continue;
    }

    const name = submission.submitterName?.trim();
    const email = submission.submitterEmail?.trim();

    if (!name || !email) {
      await payload.update({
        collection: "form-submissions",
        id: submission.id,
        overrideAccess: true,
        data: {
          certificateStatus: "failed",
          certificateError: "Submission has no name or email",
        },
      });
      result.failed += 1;
      continue;
    }

    result.attempted += 1;

    try {
      const certificateName = applyNameCase(name, form.certificateNameCase);
      const emailName = applyNameCase(name, form.certificateEmailNameCase);

      await sendCertificate({
        certificateName,
        emailName,
        email,
        formTitle: form.title,
        // Whatever else this form's template prints - USN, section, anything
        // the member mapped. `name` and `event` are included for templates
        // that predate the mapping and expect the script to fill them.
        placeholders: resolvePlaceholders(form, submission, certificateName),
        templateId: form.certificateTemplateDriveId?.trim() || undefined,
        emailSubject: form.certificateEmailSubject
          ? fillPlaceholders(
              form.certificateEmailSubject,
              emailName,
              form.title,
            )
          : undefined,
        emailBody: form.certificateEmailBody
          ? fillPlaceholders(form.certificateEmailBody, emailName, form.title)
          : undefined,
      });

      await payload.update({
        collection: "form-submissions",
        id: submission.id,
        overrideAccess: true,
        data: {
          certificateStatus: "sent",
          certificateSentAt: new Date().toISOString(),
          certificateError: null,
        },
      });
      result.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[Certificates] Send failed for submission ${submission.id}:`,
        message,
      );
      await payload.update({
        collection: "form-submissions",
        id: submission.id,
        overrideAccess: true,
        data: {
          certificateStatus: "failed",
          certificateError: message.slice(0, 500),
        },
      });
      result.failed += 1;
    }
  }

  return result;
}

/**
 * Every form that issues certificates. Due-checking happens per submission
 * inside `dispatchCertificatesForForm` (batches mean different recipients of
 * the same form can become due at different times), so this just fans out to
 * every candidate form rather than pre-filtering - the per-form pending query
 * is cheap and indexed.
 */
export async function dispatchDueCertificates(): Promise<
  Record<string, DispatchResult>
> {
  const payload = await getPayload({ config });

  const forms = await payload.find({
    collection: "forms",
    where: { showCertificate: { equals: true } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });

  const out: Record<string, DispatchResult> = {};
  for (const form of forms.docs) {
    out[form.slug] = await dispatchCertificatesForForm(form.id);
  }
  return out;
}

/** Re-exported so callers don't need to know which backend does the sending. */
export function certificateSenderConfigured(): boolean {
  return appsScriptConfigured();
}
