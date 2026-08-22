/**
 * Embed Club — certificate sender (Google Apps Script)
 * ====================================================
 *
 * Generates a certificate from a Google Slides template and emails it. Runs as
 * a Web App that the website POSTs to, one recipient per call.
 *
 * Why Apps Script rather than SMTP from the site: GmailApp sends *as the
 * account that deployed this script*, so there is no SMTP host, no app
 * password, and no dependency on whether the pace.edu.in Workspace tenant
 * allows them. Deploy this from embedclub@pace.edu.in and mail comes from the
 * club address with nothing to configure.
 *
 * This file lives in the repo on purpose. It runs on Google's servers, not
 * ours, but it is real infrastructure — keeping it in git means the next
 * committee can find it, read it, and change it.
 *
 * The secret and default template id are NOT written in this file — they are
 * read from Script Properties (Apps Script's equivalent of environment
 * variables). This file gets committed to a public-ish repo; a secret typed
 * directly into it would sit in git history forever, readable by anyone the
 * repo is ever shared with. Script Properties live only inside the Apps
 * Script project, set through the UI, never in source.
 *
 *
 * SETUP
 * -----
 * 1. Build the certificate in Google Slides. Put the literal text {{name}}
 *    where the recipient's name should appear, styled how you want it to look.
 *    Note the presentation's file id from its URL:
 *      docs.google.com/presentation/d/<THIS_PART>/edit
 *
 * 2. script.google.com → New project → paste this file in.
 *
 * 3. Project Settings (gear icon, left sidebar) → Script Properties →
 *    Add script property, twice:
 *      SHARED_SECRET        any long random string — this is the shared
 *                            secret, generate one yourself, don't reuse an
 *                            example
 *      DEFAULT_TEMPLATE_ID   the Slides file id from step 1
 *
 * 4. Deploy → New deployment → type "Web app":
 *      Execute as:       Me (embedclub@pace.edu.in)
 *      Who has access:   Anyone
 *    "Anyone" is safe here because every request must carry SHARED_SECRET;
 *    it means "no Google sign-in required", not "unauthenticated".
 *    Copy the /exec URL it gives you.
 *
 * 5. On the website set:
 *      APPS_SCRIPT_URL     = the /exec URL
 *      APPS_SCRIPT_SECRET  = the exact same string as SHARED_SECRET in step 3
 *
 * 6. Run `doGet` once (visit the /exec URL in a browser) to confirm both
 *    properties are read. It will report secretConfigured/templateConfigured
 *    without revealing either value. Then send a real test through the site
 *    to trigger Google's authorisation prompt (Drive, Slides, Gmail). Nothing
 *    sends until that is granted.
 *
 *
 * The website decides *when* to send — immediately on submit, or once the
 * form's scheduled time passes — and tracks who has received one. This script
 * only does the work it is asked to do for whichever recipient it is given.
 */

function scriptProps() {
  return PropertiesService.getScriptProperties()
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Empty request' })
    }

    var body = JSON.parse(e.postData.contents)
    var props = scriptProps()
    var secret = props.getProperty('SHARED_SECRET')

    if (!secret || body.secret !== secret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' })
    }

    // certificateName / emailName arrive already case-formed by the site
    // (forms.certificateNameCase / certificateEmailNameCase) — this script
    // never decides casing, it just places whichever strings it is given.
    var mode = body.mode || 'email'
    var certificateName = (body.certificateName || '').trim()
    var emailName = (body.emailName || '').trim()
    var email = (body.email || '').trim()
    if (!certificateName || !emailName || (mode !== 'preview' && !email)) {
      return jsonResponse({ ok: false, error: 'Missing certificateName, emailName, or email' })
    }

    var templateId = (body.templateId || props.getProperty('DEFAULT_TEMPLATE_ID') || '').trim()
    if (!templateId) {
      return jsonResponse({ ok: false, error: 'No certificate template configured' })
    }

    var formTitle = body.formTitle || 'Embed Club'
    var pdf = buildCertificate(templateId, certificateName, formTitle, body.placeholders)

    if (mode === 'preview') {
      return jsonResponse({
        ok: true,
        pdfBase64: Utilities.base64Encode(pdf.getBytes()),
        fileName: pdf.getName(),
        mimeType: pdf.getContentType(),
      })
    }

    // emailSubject/emailBody arrive fully resolved ({{name}}/{{event}} already
    // filled in) when the form has a custom message; otherwise fall back to
    // the plain default here.
    var subject = body.emailSubject || 'Your certificate — ' + formTitle
    var textBody = body.emailBody || certificateBody(emailName, formTitle)
    var htmlBody = body.emailBody ? textBody.replace(/\n/g, '<br>') : certificateHtml(emailName, formTitle)

    GmailApp.sendEmail(email, subject, textBody, {
      name: 'Embed Club',
      htmlBody: htmlBody,
      attachments: [pdf],
    })

    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

/**
 * Copy the template, swap {{name}} with the already-case-formed certificate
 * name, export as PDF, bin the copy.
 *
 * Working on a copy rather than the template itself is what makes concurrent
 * sends safe — two people submitting at once would otherwise overwrite each
 * other's name in the same deck.
 */
function buildCertificate(templateId, certificateName, formTitle, placeholders) {
  var copy = null
  try {
    copy = DriveApp.getFileById(templateId).makeCopy('certificate-' + certificateName)
    var deck = SlidesApp.openById(copy.getId())

    // The site resolves every marker for this recipient and sends them as a
    // map, so a form can add {{USN}} or {{Place}} to its template without any
    // change here. name/event are set first as a fallback for older templates
    // and are overwritten if the map carries its own.
    deck.replaceAllText('{{name}}', certificateName)
    deck.replaceAllText('{{event}}', formTitle)

    if (placeholders) {
      Object.keys(placeholders).forEach(function (key) {
        var value = placeholders[key]
        deck.replaceAllText('{{' + key + '}}', value === null || value === undefined ? '' : String(value))
      })
    }

    clearLeftoverMarkers(deck)

    deck.saveAndClose()

    var pdf = DriveApp.getFileById(copy.getId()).getAs(MimeType.PDF)
    pdf.setName('EmbedClub_Certificate_' + certificateName.replace(/[^\w]+/g, '_') + '.pdf')
    return pdf
  } finally {
    // Don't leave a copy per recipient sitting in Drive.
    if (copy) {
      copy.setTrashed(true)
    }
  }
}

/**
 * Blank out any {{marker}} nothing filled in.
 *
 * Left alone they print literally — "{{Place}}" across fifty certificates —
 * which is worse than an empty space. `replaceAllText` matches literal text
 * only (no regex, unlike Docs), so the markers have to be found by reading the
 * deck first and then replaced one by one.
 */
function clearLeftoverMarkers(deck) {
  var pattern = /\{\{[^{}]*\}\}/g
  var slides = deck.getSlides()
  var seen = {}

  for (var i = 0; i < slides.length; i++) {
    var shapes = slides[i].getShapes()
    for (var j = 0; j < shapes.length; j++) {
      var text = shapes[j].getText().asString()
      var match
      // biome-ignore lint: Apps Script targets an old JS runtime; matchAll is unavailable.
      while ((match = pattern.exec(text)) !== null) {
        seen[match[0]] = true
      }
    }
  }

  Object.keys(seen).forEach(function (marker) {
    deck.replaceAllText(marker, '')
  })
}

/** Default plain-text body, used only when a form has no custom message. */
function certificateBody(emailName, formTitle) {
  return (
    'Hi ' + emailName + ',\n\nYour certificate for ' + formTitle + ' is attached.\n\n— Embed Club'
  )
}

/** Default HTML body, used only when a form has no custom message. */
function certificateHtml(emailName, formTitle) {
  return (
    '<p>Hi ' +
    emailName +
    ',</p><p>Your certificate for <strong>' +
    formTitle +
    '</strong> is attached.</p><p>— Embed Club</p>'
  )
}

/**
 * Handy for checking the deployment is alive without sending anything.
 * Visit the /exec URL in a browser. Reports whether each property is SET, not
 * its value — this response is not a secret-safe place.
 */
function doGet() {
  var props = scriptProps()
  return jsonResponse({
    ok: true,
    service: 'embed-club-certificates',
    templateConfigured: Boolean(props.getProperty('DEFAULT_TEMPLATE_ID')),
    secretConfigured: Boolean(props.getProperty('SHARED_SECRET')),
  })
}
