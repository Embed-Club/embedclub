/**
 * Seed the privacy policy, the terms, and the consent line shown on forms.
 *
 *   pnpm tsx scripts/seedLegalPages.ts
 *
 * Writes the Legal Pages global. Re-running overwrites it, so once a member
 * has edited the wording in the admin, do not run this again - edit there.
 *
 * The text below describes what the site actually does today. If any of it stops
 * being true, the fix is to change the site or the wording, not to leave both:
 *
 *   - Members are added by members, never self-registered (members collection)
 *   - Form answers, names and emails are stored in Postgres (formSubmissions)
 *   - Respondent uploads - including payment screenshots - go to Google Drive
 *     (lib/googleDrive, the `imageUpload` field type)
 *   - Responses are mirrored to a Google Sheet (sheetSyncedAt)
 *   - The submitter's IP is used for rate limiting only (forms/actions.ts)
 *   - Certificates are emailed over SMTP (lib/certificateDispatch)
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import { bold, flushExit, heading, link, list, paragraph, richText, text } from './lib/learningSeed'

const CONTACT = 'embedclub@pace.edu.in'

const PRIVACY = richText([
  paragraph([
    text(
      'Embed Club is a student-run club at P.A. College of Engineering, Mangalore. This policy covers the club website and the registration and feedback forms hosted on it. Anything you send us through this site is handled by club members, using the shared club account ',
    ),
    bold(CONTACT),
    text('.'),
  ]),

  heading('h2', [text('What We Collect')]),

  heading('h3', [text('If you fill in a form')]),
  paragraph([
    text(
      'Our forms are used to register for club events and to collect feedback afterwards. What is asked varies by event, but typically includes:',
    ),
  ]),
  list('bullet', [
    [
      bold('Your name and email address'),
      text(' - used to contact you, and printed on your certificate.'),
    ],
    [
      bold('Your USN'),
      text(
        ' - your University Seat Number. It is how the college identifies you, and it is what the participation report is compiled against, so we do not need to ask you for your course, semester or branch separately. It is never published on this site, and it goes no further than the club and the college.',
      ),
    ],
    [bold('Your phone number'), text(' - used to reach you about the event you registered for.')],
    [
      bold('Arrangements, for longer events'),
      text(
        ' - a hackathon may ask whether you need accommodation, and what you eat. Meal preferences are used to order the right food and nothing else; we do not ask why, and we do not record a reason.',
      ),
    ],
    [
      bold('Files you attach'),
      text(
        ', where a question asks for one. For paid events this includes the screenshot of your UPI payment, which may show your UPI ID, your name, and the transaction reference.',
      ),
    ],
  ]),
  paragraph([
    text(
      'A particular event may ask one or two things beyond these where it genuinely needs them - the size of a t-shirt, or which track you want to attend. No form asks for more than the event requires.',
    ),
  ]),

  heading('h3', [text('If you are a club member')]),
  paragraph([
    text(
      'Members are not self-registered. There is no sign-up form and no application: members add members in the admin panel after someone has taken part in the club and been given a role. A member profile holds a name, photo, short bio, the years active, and any GitHub or LinkedIn links the member has chosen to share. All of that is public on the ',
    ),
    link([text('Members')], '/members'),
    text(
      ' page. Members may also record their gender. It is optional, and it is used for one thing: choosing which generated avatar stands in for a member who has no photo, or who would rather their own was not published. It is never displayed, and it is removed from the page data before that data reaches your browser.',
    ),
  ]),

  heading('h3', [text('Automatically')]),
  paragraph([
    text(
      'When a form is submitted we read the IP address of the request. It is used only to limit how many submissions can come from one place in a minute, so the form cannot be flooded. It is not stored with your response and is not used to identify you.',
    ),
  ]),
  paragraph([
    text(
      'This site sets no advertising or analytics cookies, and does not track you across other websites.',
    ),
  ]),

  heading('h2', [text('Why We Collect It')]),
  list('bullet', [
    [bold('To run the event'), text(' - registering you, and knowing who is coming.')],
    [
      bold('To contact you about it'),
      text(
        ' - reminders, venue or timing changes, and other messages about the event you signed up for.',
      ),
    ],
    [
      bold('To issue your certificate'),
      text(' - sent to the email address you gave, either on registering or after the event.'),
    ],
    [
      bold('To report to the college'),
      text(
        ' - the club submits participation reports to P.A. College of Engineering, listing the students who took part.',
      ),
    ],
    [
      bold('To confirm payment'),
      text(' - checking the payment screenshot against the registration, for paid events.'),
    ],
  ]),
  paragraph([
    text(
      'We do not use these details for anything else. We do not sell them, and we do not pass them to anyone outside the club and the college.',
    ),
  ]),

  heading('h2', [text('Where It Is Stored')]),
  paragraph([text('The site is built on services run by other companies:')]),
  list('bullet', [
    [bold('Vercel'), text(' - hosts the website.')],
    [bold('Neon'), text(' - hosts the database holding your responses.')],
    [
      bold('Google Drive'),
      text(
        ' - holds the files you attach, including payment screenshots, in a folder owned by the club account.',
      ),
    ],
    [
      bold('Google Sheets'),
      text(' - a mirror of the responses, so members can work through them.'),
    ],
    [bold('Our email provider'), text(' - used to send certificates.')],
  ]),
  paragraph([
    text(
      'Access to all of these is through the club account, held by the current members. Some of these services store data outside India.',
    ),
  ]),

  heading('h2', [text('How Long We Keep It')]),
  paragraph([
    bold(
      'We keep participation records indefinitely, and we would rather say so than promise a deletion date we do not keep.',
    ),
    text(
      ' The club has records going back years. A record of who took part in what is part of the club’s history and part of what the college holds about a student’s time here, in the same way the college does not delete a student’s record once they graduate.',
    ),
  ]),
  paragraph([text('What that means in practice:')]),
  list('bullet', [
    [
      text(
        'Your record is kept for the club’s and the college’s own records, and so that a certificate can be reissued however long afterwards you ask for it.',
      ),
    ],
    [
      text(
        'It is not used for anything else. We do not market to you, we do not sell it, and we do not pass it to anyone outside the club and the college.',
      ),
    ],
    [
      text(
        'Access stays with whoever holds the club account - the current members - and passes to the members who follow them.',
      ),
    ],
  ]),
  paragraph([
    text('You can still ask us to remove your details, and we will. See '),
    bold('Your Choices'),
    text(
      ' below. Where your participation has already gone into a report submitted to the college, that report is the college’s and we cannot take it back - but we will remove your contact details and any files you attached from our own records.',
    ),
  ]),
  paragraph([
    text(
      'Member profiles stay up for as long as the member is listed on the site, and come down on request.',
    ),
  ]),

  heading('h2', [text('Your Choices')]),
  paragraph([text('Write to '), bold(CONTACT), text(' and you can ask us to:')]),
  list('bullet', [
    [text('tell you what we hold about you;')],
    [text('correct anything that is wrong;')],
    [text('delete your response, or take your member profile down;')],
    [text('stop emailing you about an event.')],
  ]),
  paragraph([
    text(
      'Deleting a registration before the event usually means we cannot issue your certificate, since the certificate is printed from that record.',
    ),
  ]),

  heading('h2', [text('If You Are Under 18')]),
  paragraph([
    text(
      'Our events are run for college students. If you are under 18, please register only with the agreement of a parent or guardian. If you believe a child’s details have been submitted to us, write to ',
    ),
    bold(CONTACT),
    text(' and we will remove them.'),
  ]),

  heading('h2', [text('Changes')]),
  paragraph([
    text(
      'If this policy changes, the date at the top of this page changes with it. Continuing to use the site or its forms means the current version applies.',
    ),
  ]),

  heading('h2', [text('Contact')]),
  paragraph([
    text('Questions about this policy, or about anything we hold: '),
    bold(CONTACT),
    text(
      '. Embed Club, P.A. College of Engineering, Nadupadav, Montepadav Post, Kairangala, Mangalore – 574153, Karnataka, India.',
    ),
  ]),
])

const TERMS = richText([
  paragraph([
    text(
      'These terms cover the Embed Club website and the events you register for through it. Using the site, or submitting a form on it, means you accept them.',
    ),
  ]),

  heading('h2', [text('About The Club')]),
  paragraph([
    text(
      'Embed Club is a student-run club at P.A. College of Engineering, Mangalore. It is not a company and does not trade. Events are organised by student members, and the club account ',
    ),
    bold(CONTACT),
    text(' is how to reach them.'),
  ]),

  heading('h2', [text('Using This Site')]),
  paragraph([
    text(
      'The tutorials, guides and resources here are published for students to learn from, and are free to read and use for study. Do not copy them wholesale onto another site, present them as your own work, or use them commercially without asking us first. Club and college logos and names are not yours to use.',
    ),
  ]),
  paragraph([
    text(
      'Do not attempt to break into, overload, or interfere with the site, and do not submit forms automatically or in bulk.',
    ),
  ]),

  heading('h2', [text('Event Registration')]),
  list('bullet', [
    [
      text(
        'Registering does not by itself guarantee you a place - some events are capped, and places go in the order they are taken.',
      ),
    ],
    [
      text(
        'Give accurate details. Your certificate is printed from what you enter, and a name typed wrongly is printed wrongly.',
      ),
    ],
    [
      text(
        'One registration per person per event. A second submission with the same email replaces the first rather than adding another.',
      ),
    ],
    [
      text(
        'We may close registration early, change the date, venue or format of an event, or cancel it, and will tell registered participants when we do.',
      ),
    ],
  ]),

  heading('h2', [text('Payment And Refunds')]),
  paragraph([
    text(
      'Some events carry a registration fee. Where they do, payment is made by scanning the UPI QR code shown on the form and paying from your own UPI app, then attaching a screenshot of the payment as proof. The club account receives the money directly. We do not use a payment gateway, and this site never sees or stores your card, bank or UPI credentials.',
    ),
  ]),
  paragraph([bold('Refunds are given only if the event does not go ahead.')]),
  list('bullet', [
    [
      bold('Refunded'),
      text(' - the event is cancelled by the club, or does not take place as announced.'),
    ],
    [
      bold('Not refunded'),
      text(
        ' - you register and then do not attend, withdraw, arrive too late to take part, or are unable to attend for any reason of your own.',
      ),
    ],
  ]),
  paragraph([
    text('Where a refund is due, it goes back to the UPI account the payment came from. Write to '),
    bold(CONTACT),
    text(' if one has not reached you.'),
  ]),

  heading('h2', [text('Certificates')]),
  paragraph([
    text(
      'Certificates are issued for participation, and are emailed to the address given on the form - either on registering or after the event has ended, depending on the event. They record that you took part. They are not a qualification, and are not awarded by the college. If yours has not arrived, or a detail on it is wrong, write to us and we will reissue it - we keep participation records, so we can do that years later. See the ',
    ),
    link([text('Privacy Policy')], '/privacy'),
    text('.'),
  ]),

  heading('h2', [text('Conduct At Events')]),
  paragraph([
    text(
      'College rules apply at every club event. Equipment lent to you during a workshop is the club’s, and is to be returned in the condition it was given. members may ask anyone disrupting an event to leave, without a refund.',
    ),
  ]),

  heading('h2', [text('Photographs')]),
  paragraph([
    text('We photograph our events and publish some of those photographs in the '),
    link([text('Gallery')], '/gallery'),
    text(
      ' and on club social media. If you would rather not appear, tell a member at the event or write to us afterwards and we will take the picture down.',
    ),
  ]),

  heading('h2', [text('Accuracy And Availability')]),
  paragraph([
    text(
      'The technical content here is written by students and offered in good faith, but it comes with no warranty. Check datasheets and manufacturer documentation before relying on anything for coursework or a build, and take your own precautions when working with hardware, mains power, or tools. The club is not liable for damage to your equipment or for loss arising from following a guide published here.',
    ),
  ]),
  paragraph([
    text(
      'We do not promise the site will always be available. Links out to other sites are provided for convenience, and what happens on those sites is not ours to control.',
    ),
  ]),

  heading('h2', [text('Changes To These Terms')]),
  paragraph([
    text(
      'These terms may be revised; the date at the top of this page shows when they last were. Indian law applies, and the courts at Mangalore, Karnataka have jurisdiction.',
    ),
  ]),

  heading('h2', [text('Contact')]),
  paragraph([
    text('Embed Club, P.A. College of Engineering, Mangalore - '),
    bold(CONTACT),
    text('.'),
  ]),
])

const CONSENT_NOTICE =
  'I agree that Embed Club may store the details and files I have entered here, use them to contact me about this event and to issue my certificate, and include my participation in the report submitted to P.A. College of Engineering. See the'

async function run() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'legal-pages',
    data: {
      privacyTitle: 'Privacy Policy',
      privacy: PRIVACY,
      termsTitle: 'Terms & Conditions',
      terms: TERMS,
      consentNotice: CONSENT_NOTICE,
      lastUpdated: new Date().toISOString(),
    },
  })

  console.log('Seeded the Legal Pages global - /privacy and /terms are live.')
  flushExit(0)
}

run().catch((err) => {
  console.error(err)
  flushExit(1)
})
