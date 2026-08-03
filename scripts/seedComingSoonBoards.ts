/**
 * Seed the announced-but-unwritten board tutorials.
 *
 *   pnpm tsx scripts/seedComingSoonBoards.ts
 *
 * Both carry the `comingSoon` badge, which makes their cards render but not
 * link (see resourceCutoutCard.tsx) — the page exists so the announcement has
 * somewhere to live, and so the guide can be written into it later without a new
 * URL. Neither board is in the club's hands yet; the specs below are from the
 * manufacturers' announcements, and each page says so.
 *
 * Thumbnails use the shared placeholder graphic. Matched on slug, so re-running
 * updates in place. Live immediately.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  ensurePlaceholderMedia,
  ensureTagIds,
  flushExit,
  heading,
  italic,
  list,
  paragraph,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const UNO_Q = [
  textBlock([
    heading('h1', [text('Arduino Uno Q')], 'center'),
    paragraph([
      bold('Coming soon. '),
      text(
        'This guide has not been written yet — the board is not in the club’s hands. What follows is what the Uno Q is, why it is interesting, and what the tutorial will cover once we have one to write it against.',
      ),
    ]),
    heading('h2', [text('What It Is')]),
    paragraph([
      text(
        'The Uno Q keeps the Uno’s outline and shield header and puts two completely different processors behind it. One is a microcontroller of the kind every other board on this page uses. The other is a quad-core application processor running Linux — a Raspberry Pi-class computer, on the same board, sharing the same pins.',
      ),
    ]),
    list('bullet', [
      [
        bold('Microcontroller: '),
        text(
          'an STM32U585 — Arm Cortex-M33, the part that does real-time GPIO, timing, and analogue work.',
        ),
      ],
      [
        bold('Application processor: '),
        text('a Qualcomm Dragonwing QRB2210 — four Cortex-A53 cores running a Debian-based Linux.'),
      ],
      [
        bold('Memory: '),
        text('LPDDR4 RAM and on-board eMMC storage, in the gigabytes rather than kilobytes.'),
      ],
      [bold('Connectivity: '), text('Wi-Fi, Bluetooth, and USB-C.')],
      [bold('Form factor: '), text('the classic Uno outline, so existing shields still fit.')],
    ]),
    paragraph([
      italic(
        'Specifications are from Arduino’s announcement and have not been verified against hardware by anyone here.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Why It Matters')]),
    paragraph([
      text(
        'Most interesting projects end up needing both halves of this. A microcontroller can hold a servo at an exact angle and sample a sensor on a precise interval, and cannot run a web app or a vision model. A Linux board can do both of those and cannot be trusted to toggle a pin at a predictable microsecond, because an operating system is scheduling it.',
      ),
    ]),
    paragraph([
      text(
        'The usual answer is two boards and a serial link between them — which is exactly what our ',
      ),
      bold('ESP32-CAM'),
      text(' and '),
      bold('Jetson Nano'),
      text(
        ' guides end up doing in different ways. The Uno Q puts both on one board with a shared toolchain, which is either a genuine simplification or a lot of complexity in a small space. That is the thing worth writing up honestly.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('What the Guide Will Cover')]),
    list('number', [
      [text('First boot, and getting a shell on the Linux side.')],
      [
        text('Setting up '),
        bold('Arduino App Lab'),
        text(', the environment that spans both processors.'),
      ],
      [text('Flashing a sketch to the microcontroller from the board itself.')],
      [
        text(
          'Passing data between the Linux side and the sketch — the part that makes it one board rather than two.',
        ),
      ],
      [
        text(
          'A real task using both: precise sensor timing on the MCU, with the Linux side serving the results.',
        ),
      ],
      [
        text(
          'Where the shield compatibility actually holds, and where 3.3V logic breaks a 5V shield.',
        ),
      ],
      [
        text(
          'An honest comparison against a Pi plus a Nano, which costs less and is better documented.',
        ),
      ],
    ]),
    heading('h2', [text('When')]),
    paragraph([
      text(
        'When we get hardware. There is a DigiKey selection in play; if that lands, this page becomes a real guide. Until then it is here so the board is on the list rather than forgotten.',
      ),
    ]),
    paragraph([
      text('In the meantime, the '),
      bold('Arduino Uno'),
      text(' and '),
      bold('Raspberry Pi 3/4/5'),
      text(
        ' tutorials cover the two halves separately, which is the setup this board is trying to replace.',
      ),
    ]),
  ]),
]

const CORE_S3_SE = [
  textBlock([
    heading('h1', [text('M5Stack CoreS3 SE')], 'center'),
    paragraph([
      bold('Coming soon. '),
      text(
        'This guide has not been written yet — the board is not in the club’s hands. What follows is what the CoreS3 SE is and what the tutorial will cover once we have one.',
      ),
    ]),
    heading('h2', [text('What It Is')]),
    paragraph([
      text(
        'An ESP32-S3 in a finished enclosure. Rather than a bare board you wire onto a breadboard, the CoreS3 SE is a small plastic brick with a touchscreen on the front, a battery inside, and a stacking connector underneath for modules — the same chip as a development board, packaged as something you can hand to someone.',
      ),
    ]),
    list('bullet', [
      [bold('Processor: '), text('ESP32-S3, dual-core Xtensa LX7 with Wi-Fi and Bluetooth LE')],
      [bold('Memory: '), text('16 MB flash and 8 MB PSRAM')],
      [bold('Display: '), text('a 2-inch 320×240 capacitive touchscreen')],
      [
        bold('Also on board: '),
        text(
          'speaker, microSD slot, real-time clock, power management, USB-C, and a built-in battery',
        ),
      ],
      [
        bold('What "SE" means: '),
        text(
          'the stripped-down CoreS3. The camera, microphone and motion sensors of the full CoreS3 are not fitted — which is also why it is cheaper.',
        ),
      ],
    ]),
    paragraph([
      italic(
        'Specifications are from M5Stack’s published documentation and have not been verified against hardware by anyone here.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Why It Matters')]),
    paragraph([
      text(
        'Every other board here needs a breadboard, a power supply, and a laptop nearby before it does anything a person can look at. This one has a screen and a battery, so a project on it is finished the moment the code works. For demos, for competitions, and for anything that has to leave the lab bench, that gap matters more than the specification does.',
      ),
    ]),
    paragraph([
      text('It also runs '),
      bold('UIFlow'),
      text(
        ', a block-based environment, alongside the normal Arduino and MicroPython routes — so it is a plausible first board for someone who has not written code before, which is not true of most ESP32 hardware.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('What the Guide Will Cover')]),
    list('number', [
      [text('First boot, and what the preinstalled firmware gives you.')],
      [
        text('Setting it up three ways: '),
        bold('UIFlow'),
        text(' blocks, '),
        bold('Arduino IDE'),
        text(' with the M5Unified library, and '),
        bold('MicroPython'),
        text('.'),
      ],
      [
        text(
          'Drawing on the screen and handling touch — the part that is genuinely different from a bare ESP32.',
        ),
      ],
      [
        text(
          'Reading the battery level and behaving sensibly on power, since it has a battery to manage.',
        ),
      ],
      [text('Stacking a module or a Unit sensor onto the '), code('M-Bus'), text(' connector.')],
      [text('A complete self-contained project: sensor in, live display out, running on battery.')],
      [
        text(
          'What the missing camera and IMU rule out, so nobody buys the SE expecting the full CoreS3.',
        ),
      ],
    ]),
    heading('h2', [text('When')]),
    paragraph([
      text(
        'When we get hardware — it is the alternative choice in the same DigiKey selection as the Arduino Uno Q. Until then, the ',
      ),
      bold('ESP32'),
      text(
        ' tutorial covers the same chip family on a plain development board, and everything in it applies here.',
      ),
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)

  const unoQTags = await ensureTagIds(payload, ['Arduino', 'Microcontroller', 'IoT'])
  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: 'arduino-uno-q',
    data: {
      title: 'Arduino Uno Q',
      slug: 'arduino-uno-q',
      description:
        'A microcontroller and a quad-core Linux processor on one Uno-shaped board. Guide coming once we have the hardware.',
      thumbnail: placeholderId,
      difficulty: 'advanced',
      tags: unoQTags,
      badge: 'comingSoon',
      content: UNO_Q,
    },
  })

  const coreTags = await ensureTagIds(payload, ['ESP32', 'Microcontroller', 'IoT'])
  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: 'm5stack-cores3-se',
    data: {
      title: 'M5Stack CoreS3 SE',
      slug: 'm5stack-cores3-se',
      description:
        'An ESP32-S3 with a touchscreen, a battery and an enclosure — a project that is finished when the code works. Guide coming once we have the hardware.',
      thumbnail: placeholderId,
      difficulty: 'intermediate',
      tags: coreTags,
      badge: 'comingSoon',
      content: CORE_S3_SE,
    },
  })
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
