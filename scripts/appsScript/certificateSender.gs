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
 * 3. Fill in the two constants below.
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
 *      APPS_SCRIPT_SECRET  = the same string as SHARED_SECRET
 *
 * 6. Run `doPost` once manually (or send a test) to trigger Google's
 *    authorisation prompt. It will ask for Drive, Slides and Gmail access.
 *    Nothing sends until that is granted.
 *
 *
 * The website decides *when* to send — immediately on submit, or once the
 * form's scheduled time passes — and tracks who has received one. This script
 * only does the work it is asked to do.
 */

/** Must match APPS_SCRIPT_SECRET on the website. Change it. */
var SHARED_SECRET = 'CHANGE_ME'

/** File id of the Google Slides certificate template containing {{name}}. */
var DEFAULT_TEMPLATE_ID = ''

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

    if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'Unauthorized' })
    }

    var name = (body.name || '').trim()
    var email = (body.email || '').trim()
    if (!name || !email) {
      return jsonResponse({ ok: false, error: 'Missing name or email' })
    }

    var templateId = (body.templateId || DEFAULT_TEMPLATE_ID || '').trim()
    if (!templateId) {
      return jsonResponse({ ok: false, error: 'No certificate template configured' })
    }

    var formTitle = body.formTitle || 'Embed Club'
    var pdf = buildCertificate(templateId, name, formTitle)

    GmailApp.sendEmail(email, 'Your certificate — ' + formTitle, certificateBody(name, formTitle), {
      name: 'Embed Club',
      htmlBody: certificateHtml(name, formTitle),
      attachments: [pdf],
    })

    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

/**
 * Copy the template, swap {{name}}, export as PDF, bin the copy.
 *
 * Working on a copy rather than the template itself is what makes concurrent
 * sends safe — two people submitting at once would otherwise overwrite each
 * other's name in the same deck.
 */
function buildCertificate(templateId, name, formTitle) {
  var copy = null
  try {
    copy = DriveApp.getFileById(templateId).makeCopy('certificate-' + name)
    var deck = SlidesApp.openById(copy.getId())
    deck.replaceAllText('{{name}}', name)
    deck.replaceAllText('{{event}}', formTitle)
    deck.saveAndClose()

    var pdf = DriveApp.getFileById(copy.getId()).getAs(MimeType.PDF)
    pdf.setName('EmbedClub_Certificate_' + name.replace(/[^\w]+/g, '_') + '.pdf')
    return pdf
  } finally {
    // Don't leave a copy per recipient sitting in Drive.
    if (copy) {
      copy.setTrashed(true)
    }
  }
}

function certificateBody(name, formTitle) {
  return 'Hi ' + name + ',\n\nYour certificate for ' + formTitle + ' is attached.\n\n— Embed Club'
}

function certificateHtml(name, formTitle) {
  return (
    '<p>Hi ' +
    name +
    ',</p><p>Your certificate for <strong>' +
    formTitle +
    '</strong> is attached.</p><p>— Embed Club</p>'
  )
}

/**
 * Handy for checking the deployment is alive without sending anything.
 * Visit the /exec URL in a browser.
 */
function doGet() {
  return jsonResponse({
    ok: true,
    service: 'embed-club-certificates',
    templateConfigured: Boolean(DEFAULT_TEMPLATE_ID),
    secretConfigured: SHARED_SECRET !== 'CHANGE_ME' && Boolean(SHARED_SECRET),
  })
}
