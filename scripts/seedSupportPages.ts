/**
 * Seed the contact page.
 *
 *   pnpm tsx scripts/seedSupportPages.ts
 *
 * Writes the Support & Contact global. Support merged into /contact, so the
 * support answers seed as FAQ accordion items rather than as a page of prose.
 * Re-running overwrites it, so once a member has edited the wording in the
 * admin, do not run this again - edit there.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import { bold, flushExit, link, paragraph, richText, text } from './lib/learningSeed'

const CONTACT_EMAIL = 'embedclub@pace.edu.in'
const CONTACT_PHONE = '+91 72596 44228'

const FAQ = [
  {
    question: 'What does Embed Club actually do?',
    answer: richText([
      paragraph([
        text(
          'Embed Club is the embedded-systems club at P.A. College of Engineering, running since 2018. We build with microcontrollers and real hardware - soldering boards, wiring sensors, writing firmware, debugging circuits that refuse to work. The workshops, sessions, and project builds are run by members themselves, and what gets covered is published as ',
        ),
        link([text('resources')], '/resources'),
        text(' and '),
        link([text('tutorials')], '/tutorials'),
        text(' so a session doesn’t end when the lab closes. Past events are on the '),
        link([text('Events')], '/events'),
        text(' page.'),
      ]),
    ]),
  },
  {
    question: 'Who can be part of Embed Club?',
    answer: richText([
      paragraph([
        text(
          'Any student of P.A. College of Engineering, from any branch and any year. No prior electronics experience is expected - plenty of people start knowing nothing about microcontrollers. What is expected is that you turn up and do the work.',
        ),
      ]),
    ]),
  },
  {
    question: 'How do I become a member?',
    answer: richText([
      paragraph([
        bold('There is no joining form, and no recruitment drive. '),
        text(
          'Embed Club does not work the way most clubs do - you do not hand in your details and get added to a list. Membership is earned by taking part: come to the meetings, give a workshop, take a session, build a project in the club. Do that and you are a member, officially.',
        ),
      ]),
      paragraph([
        text(
          'So joining and contributing are the same act. Nobody will come asking you to sign up; the motivation and the interest have to come from you. Start showing up and doing the work, and the rest follows.',
        ),
      ]),
    ]),
  },
  {
    question: 'How does learning work here?',
    answer: richText([
      paragraph([
        bold('We do not teach you. '),
        text(
          'Embed Club is self-learning and building on your own. Mentors and seniors are there if you want help, and they will point you the right way - but nobody is going to sit you down and run a syllabus. You develop yourself.',
        ),
      ]),
      paragraph([
        text(
          'The way it actually works is: you come, you learn something, then you teach it to others. Teaching is where the real learning happens - explaining it exposes what you only half understood, and the mistakes people make in front of you drag you into debugging, which is where the skill is built.',
        ),
      ]),
      paragraph([
        text(
          'What you pick up along the way is practical rather than theoretical: microcontroller boards and programming them, sensors and actuators, reading and wiring circuits, soldering and bench discipline, firmware debugging, and taking a project from an idea to hardware that runs.',
        ),
      ]),
    ]),
  },
  {
    question: 'Can I use club components in my own projects?',
    answer: richText([
      paragraph([
        bold('No. '),
        text(
          'Club components, boards, and tools stay in the club. They are there for you to learn on and develop yourself with, inside Embed Club activities - sessions, workshops, and club projects. They cannot be taken home, and they cannot be used for personal, academic, or outside projects.',
        ),
      ]),
      paragraph([
        text(
          'It is one shared inventory funded for everyone, so a part that leaves is a part the next batch cannot learn on. If you need something for a project of your own, ask us - we will happily tell you what to buy and how to get it working.',
        ),
      ]),
    ]),
  },
  {
    question: 'How can I contribute?',
    answer: richText([
      paragraph([
        text(
          'Contributing is the same thing as being a member, so this is the answer to both. Give a workshop, take a session on something you know well, build a project in the club, be there for meetings, write a tutorial or resource for the site, or help with the photography, design, and the website itself.',
        ),
      ]),
      paragraph([
        text(
          'None of it needs you to be the most experienced person in the room - teaching something you learned last month is worth more here than waiting until you feel ready. Tell a senior or write to us with what you want to take on.',
        ),
      ]),
    ]),
  },
  {
    question: 'A registration or feedback form won’t submit',
    answer: richText([
      paragraph([
        text(
          'If a form won’t submit, rejects an answer that looks right, or you need to change a response after sending it, write to us with the event name and what happened.',
        ),
      ]),
    ]),
  },
  {
    question: 'My certificate hasn’t arrived, or a detail on it is wrong',
    answer: richText([
      paragraph([
        text(
          'Certificates are sent to the email address given on the form, either on registering or after the event. If yours hasn’t arrived or a detail on it is wrong, write in - we keep participation records, so we can reissue it even years later.',
        ),
      ]),
    ]),
  },
  {
    question: 'A payment isn’t reflecting against my registration',
    answer: richText([
      paragraph([
        text(
          'For a paid event, attach your UPI payment screenshot as proof when you register. If a payment isn’t reflecting against your registration, write in with the transaction reference.',
        ),
      ]),
    ]),
  },
  {
    question: 'What happens to the data I put in a form?',
    answer: richText([
      paragraph([
        text('What we store and how long we keep it is in the '),
        link([text('Privacy Policy')], '/privacy'),
        text('. Anything that isn’t covered there, write in and ask.'),
      ]),
    ]),
  },
]

const CONTACT = richText([
  paragraph([
    text(
      'Embed Club is a student-run club at P.A. College of Engineering, Mangalore. Write or call us about anything to do with an event, a form, or the club in general - a member reads and replies. Common questions are answered further down the page.',
    ),
  ]),
  paragraph([
    bold('Writing in? '),
    text(
      'Include the event name and, for a certificate or payment, the email address you registered with.',
    ),
  ]),
])

async function run() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'support-pages',
    data: {
      contactTitle: 'Contact',
      contactEmail: CONTACT_EMAIL,
      contactPhone: CONTACT_PHONE,
      contact: CONTACT,
      supportFaq: FAQ,
    },
  })

  console.log('Seeded the Contact page - /contact is live.')
  flushExit(0)
}

run().catch((err) => {
  console.error(err)
  flushExit(1)
})
