/**
 * The club's four-session Raspberry Pi workshop, shared by every year's run.
 *
 * Each run is its own Resource (CS 2025, CS 2026, ...) seeded from a thin
 * script that calls `seedRaspberryPiWorkshop` with its slug, title and
 * whatever differs that year. The sessions themselves live here once, so a fix
 * to a code sample lands in every year that re-seeds.
 *
 * Built from the AccordionBlock, so each session is a collapsible part rather
 * than one very long scroll. A Resource, not a Tutorial - it assumes a Pi you
 * can already SSH into. Session 1 links out to the Raspberry Pi 3/4/5 Setup
 * tutorial rather than repeating its Imager and VNC steps.
 *
 * Screenshots come from a folder outside this repo (see IMAGE_DIR) and are
 * matched on filename, so this reuses the media the Pi tutorial already
 * uploaded. Matched on slug, so re-running updates in place. Live immediately.
 */
import path from 'node:path'
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  accordionBlock,
  accordionItem,
  bold,
  code,
  codeBlock,
  ensureMediaFromFile,
  ensureTagIds,
  heading,
  imageBlock,
  italic,
  link,
  list,
  paragraph,
  text,
  textBlock,
  upsertLearningDoc,
} from './learningSeed'
import {
  BLINK,
  DJANGO_HOSTS,
  DJANGO_RUN,
  DJANGO_SETUP,
  DJANGO_TEMPLATE,
  DJANGO_URLS,
  DJANGO_VIEWS,
  GPIO_HW,
  LDR,
} from './raspberryPiWorkshopCode'

export interface WorkshopRun {
  slug: string
  title: string
  /**
   * A download for RealVNC Viewer. When set, the "connect with RealVNC Viewer"
   * step links to it, marked optional - the Setup tutorial already covers
   * getting it from realvnc.com.
   */
  vncViewerUrl?: string
}

const IMAGE_DIR = 'C:/Projects/EMBEDCLUB/embed-club/events-img/2025'

const IMAGES: Record<string, { file: string; alt: string }> = {
  pins: { file: 'RaspberryPiPins.png', alt: 'Raspberry Pi 40-pin GPIO pinout' },
  led: { file: 'RaspberryPILED.jpeg', alt: 'LED wired to the Raspberry Pi GPIO header' },
  ldr: { file: 'RaspberryPiLDR.jpeg', alt: 'LDR light sensor wired to the Raspberry Pi' },
  vnc: { file: 'RealVNCAfterInputDetails.png', alt: 'RealVNC connection details entered' },
  auto: { file: 'RaspberryPiAuto.jpeg', alt: 'The completed automation build on the bench' },
}

function buildContent(run: WorkshopRun, id: (key: string) => number) {
  return [
    textBlock([
      heading('h1', [text(run.title)], 'center'),
      paragraph([
        text(
          'The club’s four-part Raspberry Pi course, in one page. Each session builds on the one above it - a configured Pi, then a single LED, then a sensor deciding when that LED comes on, then a web app doing the same thing from a browser. Open the session you need; they are collapsed so the page stays navigable.',
        ),
      ]),
      paragraph([
        bold('Everything here runs over SSH. '),
        text('You do not need a monitor attached to the Pi at any point.'),
      ]),
    ]),

    accordionBlock(
      [
        accordionItem(
          'Session 1 - Setup & VNC',
          [
            textBlock([
              paragraph([
                text(
                  'The first session is the full setup: Raspberry Pi Imager, flashing the card, hostname and Wi-Fi and SSH baked in before first boot, then RealVNC for the desktop.',
                ),
              ]),
              paragraph([
                bold('That is covered in full, with screenshots, in the '),
                link(
                  [bold('Raspberry Pi 3/4/5 Setup tutorial')],
                  '/tutorials/raspberry-pi-345-setup',
                ),
                bold('. '),
                text(
                  'Rather than repeat it here, work through that page and come back - the rest of these sessions assume a Pi you can ',
                ),
                code('ssh'),
                text(' into.'),
              ]),
              heading('h3', [text('The short version')]),
              list('number', [
                [text('Imager → Choose Device, OS (Lite is fine), and Storage.')],
                [
                  text('Next → '),
                  bold('Edit Settings'),
                  text(': hostname, username, password, Wi-Fi, and Wi-Fi country.'),
                ],
                [text('Services tab → '), bold('enable SSH'), text('.')],
                [text('Write, boot, then '), code('ssh user@hostname.local'), text('.')],
                [
                  text('For the desktop: '),
                  code('sudo raspi-config'),
                  text(' → Interface Options → VNC → Yes, then connect with RealVNC Viewer.'),
                  ...(run.vncViewerUrl
                    ? [
                        text(' Optional: '),
                        link([bold('download RealVNC Viewer for Windows')], run.vncViewerUrl, {
                          newTab: true,
                        }),
                        text(' if you do not have it yet.'),
                      ]
                    : []),
                ],
              ]),
            ]),
            imageBlock(id('vnc'), 'RealVNC connecting to the Pi'),
            codeBlock(
              'bash',
              'sudo apt update\nsudo apt full-upgrade -y\nsudo reboot',
              'Update before starting session 2',
            ),
          ],
          {
            summary:
              'Imager, headless SSH, and RealVNC - covered by the Raspberry Pi 3/4/5 tutorial',
            defaultOpen: true,
          },
        ),

        accordionItem(
          'Session 2 - Blink an LED',
          [
            textBlock([
              paragraph([
                text(
                  'The first thing the Pi does in the physical world. One LED, one resistor, six lines of Python.',
                ),
              ]),
              paragraph([
                bold('BCM numbering, not physical. '),
                code('GPIO.setmode(GPIO.BCM)'),
                text(' means '),
                code('17'),
                text(
                  ' refers to GPIO17, which is physical pin 11. Mixing the two schemes up is the single most common reason a correct-looking script does nothing.',
                ),
              ]),
            ]),
            imageBlock(id('pins'), 'The 40-pin header - GPIO numbers against physical positions'),
            textBlock([
              list('bullet', [
                [code('Pin 11'), text(' (GPIO17) → 330Ω resistor → LED long leg (anode)')],
                [text('LED short leg (cathode) → '), code('Pin 9'), text(' (GND)')],
              ]),
            ]),
            imageBlock(id('led'), 'The LED wired to the header', 'medium'),
            codeBlock('python', BLINK, 'blink.py'),
            textBlock([
              paragraph([
                text('Save it with '),
                code('nano blink.py'),
                text(', run it with '),
                code('python blink.py'),
                text(', and stop it with '),
                code('Ctrl+C'),
                text('. The '),
                code('finally: GPIO.cleanup()'),
                text(' is what makes it safe to run twice.'),
              ]),
            ]),
          ],
          { summary: 'RPi.GPIO, BCM numbering, and why cleanup() matters' },
        ),

        accordionItem(
          'Session 3 - LDR Sensor',
          [
            textBlock([
              paragraph([
                text(
                  'Now the Pi decides for itself. An LDR module reads the room, and the LED from session 2 comes on when it gets dark.',
                ),
              ]),
              paragraph([
                bold('Use the module, not a bare LDR. '),
                text(
                  'A bare LDR is a variable resistor - an analogue part - and unlike an Arduino the Pi has no analogue-to-digital converter at all. The small module has a comparator and a threshold pot on it, so it hands the Pi a clean HIGH or LOW, which is something a GPIO pin can read.',
                ),
              ]),
              list('bullet', [
                [text('Module '), code('VCC'), text(' → 3.3V, '), code('GND'), text(' → GND')],
                [text('Module '), code('DO'), text(' → '), code('Pin 13'), text(' (GPIO27)')],
                [text('LED unchanged on GPIO17')],
              ]),
            ]),
            imageBlock(id('ldr'), 'The LDR module alongside the LED', 'medium'),
            codeBlock('python', LDR, 'ldr.py'),
            textBlock([
              paragraph([
                bold('Turn the potentiometer on the module '),
                text(
                  'until its second LED just flips as you cover the sensor with your hand. That is the threshold, and it is set in hardware - no code change needed. If your module reads the opposite way round, swap the two branches in the script.',
                ),
              ]),
            ]),
          ],
          {
            summary:
              'Digital sensor input, and why the Pi needs an LDR module rather than a bare LDR',
          },
        ),

        accordionItem(
          'Session 4 - Automation with Django',
          [
            textBlock([
              paragraph([
                text(
                  'The capstone: a small Django app that puts sessions 2 and 3 behind a web page. Manual buttons for the LED, plus an automatic mode where the LDR drives it - visible from any device on the network.',
                ),
              ]),
              heading('h3', [text('Set up the project')]),
            ]),
            codeBlock('bash', DJANGO_SETUP, 'On the Pi, over SSH'),
            textBlock([
              paragraph([
                bold('The virtual environment is not optional on a modern Pi. '),
                text('Recent Raspberry Pi OS refuses a system-wide '),
                code('pip install'),
                text(' outright, with an '),
                code('externally-managed-environment'),
                text(' error. The '),
                code('venv'),
                text(' is the supported way round it.'),
              ]),
              heading('h3', [text('The hardware layer')]),
              paragraph([
                text(
                  'Keep every GPIO call in one module. A web app handles many short requests, and configuring a pin on each one is both slow and wrong - so the pins are set up once at import, and a background thread owns automatic mode.',
                ),
              ]),
            ]),
            codeBlock('python', GPIO_HW, 'hardware/gpioHw.py'),
            textBlock([
              paragraph([
                text('The '),
                code('threading.Lock'),
                text(
                  ' is doing real work: the worker thread writes the state 5 times a second while request handlers read and write it too. Without the lock a request can read a half-updated dictionary.',
                ),
              ]),
              heading('h3', [text('Views and URLs')]),
            ]),
            codeBlock('python', DJANGO_VIEWS, 'hardware/views.py'),
            codeBlock('python', DJANGO_URLS, 'controller/urls.py'),
            codeBlock('python', DJANGO_HOSTS, 'controller/settings.py'),
            textBlock([heading('h3', [text('The page')])]),
            codeBlock('html', DJANGO_TEMPLATE, 'hardware/templates/hardware/index.html'),
            textBlock([
              paragraph([
                text('It polls '),
                code('/api/state/'),
                text(
                  ' twice a second rather than only updating on a click, so the display still follows the LED when automatic mode is the thing switching it.',
                ),
              ]),
              heading('h3', [text('Run it')]),
            ]),
            codeBlock('bash', DJANGO_RUN, 'Start the server'),
            imageBlock(id('auto'), 'The finished build', 'medium'),
            textBlock([
              paragraph([
                bold('This is the development server. '),
                text(
                  'It is fine for a workshop on your own network and is not meant to be exposed to the internet - that needs gunicorn behind nginx, and a real ALLOWED_HOSTS.',
                ),
              ]),
              heading('h3', [text('If it does not work')]),
              list('bullet', [
                [
                  bold('RuntimeError: No access to /dev/mem: '),
                  text('run as a user in the '),
                  code('gpio'),
                  text(' group - the default '),
                  code('pi'),
                  text('-style account already is.'),
                ],
                [
                  bold('Page loads on the Pi but not from your laptop: '),
                  text('the server was started without '),
                  code('0.0.0.0:8000'),
                  text('.'),
                ],
                [bold('DisallowedHost: '), text('set '), code('ALLOWED_HOSTS'), text(' as above.')],
                [
                  bold('The LED ignores automatic mode: '),
                  text('a manual button was pressed - '),
                  code('setLed'),
                  text(' deliberately turns auto off. Press '),
                  italic('Auto on'),
                  text(' again.'),
                ],
              ]),
            ]),
          ],
          {
            summary:
              'A Django app with manual and automatic control, and a threaded hardware layer',
          },
        ),
      ],
      'Workshop Sessions',
    ),

    textBlock([
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [text('Swap the LDR module for a DHT22 and log temperature instead.')],
        [text('Put the Django app behind gunicorn and nginx so it survives a logout.')],
        [text('Run the same four steps on a Pi Zero 2 W to see how far the board scales down.')],
      ]),
    ]),
  ]
}

export async function seedRaspberryPiWorkshop(run: WorkshopRun) {
  const payload = await getPayload({ config })

  const ids: Record<string, number> = {}
  for (const [key, { file, alt }] of Object.entries(IMAGES)) {
    ids[key] = await ensureMediaFromFile(payload, path.join(IMAGE_DIR, file), alt)
  }
  const id = (key: string) => {
    const v = ids[key]
    if (v == null) throw new Error(`missing image id for "${key}"`)
    return v
  }

  const tags = await ensureTagIds(payload, ['Raspberry', 'Python', 'IoT'])

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: run.slug,
    data: {
      title: run.title,
      slug: run.slug,
      description:
        'The club’s four-part Pi course as collapsible sessions - setup and VNC, blink an LED, an LDR sensor, and a Django app controlling both.',
      thumbnail: id('auto'),
      difficulty: 'intermediate',
      tags,
      estimatedReadTime: 35,
      badge: 'featured',
      content: buildContent(run, id),
    },
  })
}
