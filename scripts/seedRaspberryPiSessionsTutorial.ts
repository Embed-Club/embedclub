/**
 * Seed the "Raspberry Pi Workshop: Four Sessions" resource.
 *
 *   pnpm tsx scripts/seedRaspberryPiSessionsTutorial.ts
 *
 * Ports the club's four-part Raspberry Pi course into one page built from the
 * AccordionBlock, so each session is a collapsible part rather than one very long
 * scroll. A Resource, not a Tutorial - it assumes a Pi you can already SSH into,
 * rather than teaching setup itself. Session 1 links out to the Raspberry Pi
 * 3/4/5 Setup tutorial for that instead of repeating its Imager and VNC steps.
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
  flushExit,
  heading,
  imageBlock,
  italic,
  link,
  list,
  paragraph,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'raspberry-pi-workshop-four-sessions'
const IMAGE_DIR = 'C:/Projects/EMBEDCLUB/embed-club/events-img/2025'

const IMAGES: Record<string, { file: string; alt: string }> = {
  pins: { file: 'RaspberryPiPins.png', alt: 'Raspberry Pi 40-pin GPIO pinout' },
  led: { file: 'RaspberryPILED.jpeg', alt: 'LED wired to the Raspberry Pi GPIO header' },
  ldr: { file: 'RaspberryPiLDR.jpeg', alt: 'LDR light sensor wired to the Raspberry Pi' },
  vnc: { file: 'RealVNCAfterInputDetails.png', alt: 'RealVNC connection details entered' },
  auto: { file: 'RaspberryPiAuto.jpeg', alt: 'The completed automation build on the bench' },
}

const BLINK = `# blink.py - session 2.
# Wiring: pin 11 (GPIO17) -> 330 ohm resistor -> LED anode;
#         LED cathode -> pin 9 (GND).
import RPi.GPIO as GPIO
import time

LED = 17

GPIO.setmode(GPIO.BCM)      # number pins by GPIO, not by physical position
GPIO.setup(LED, GPIO.OUT)

try:
    while True:
        GPIO.output(LED, GPIO.HIGH)
        time.sleep(1)
        GPIO.output(LED, GPIO.LOW)
        time.sleep(1)
except KeyboardInterrupt:
    pass
finally:
    # Without this, the pin keeps its last state after Ctrl+C and the next
    # run warns "This channel is already in use".
    GPIO.cleanup()`

const LDR = `# ldr.py - session 3. LED on in the dark, off in the light.
#
# Uses an LDR *module* (the small board with a potentiometer on it), which
# outputs a clean digital HIGH/LOW. A bare LDR is analogue, and the Pi has no
# ADC - that is why the module is worth the few rupees.
#
# Wiring: module VCC -> 3.3V, GND -> GND, DO -> pin 13 (GPIO27).
#         LED still on GPIO17.
import RPi.GPIO as GPIO
import time

LED = 17
LDR = 27

GPIO.setmode(GPIO.BCM)
GPIO.setup(LED, GPIO.OUT)
GPIO.setup(LDR, GPIO.IN)

try:
    while True:
        # Most of these modules pull DO LOW when light crosses the threshold
        # set by the on-board pot. If yours is inverted, swap the branches.
        dark = GPIO.input(LDR) == GPIO.HIGH
        GPIO.output(LED, GPIO.HIGH if dark else GPIO.LOW)
        time.sleep(0.2)
except KeyboardInterrupt:
    pass
finally:
    GPIO.cleanup()`

const DJANGO_SETUP = `# Session 4 - set up the project. Run this on the Pi, over SSH.
sudo apt update
sudo apt install -y python3-venv

mkdir ~/piweb && cd ~/piweb
python3 -m venv .venv
source .venv/bin/activate

pip install django RPi.GPIO

django-admin startproject controller .
python manage.py startapp hardware`

const GPIO_HW = `# hardware/gpioHw.py - everything that touches a pin, in one place.
#
# A web app is many short-lived requests, and GPIO.setup() is not something to
# run on each one. So the pins are configured once at import, and a background
# thread owns the automatic mode. Views only read and write these variables.
import threading
import time

import RPi.GPIO as GPIO

LED = 17
LDR = 27

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)     # the module is imported once per worker
GPIO.setup(LED, GPIO.OUT)
GPIO.setup(LDR, GPIO.IN)

_state = {"led": False, "auto": False, "dark": False}
_lock = threading.Lock()    # views and the worker thread both touch _state


def _worker():
    while True:
        dark = GPIO.input(LDR) == GPIO.HIGH
        with _lock:
            _state["dark"] = dark
            if _state["auto"]:
                _state["led"] = dark
                GPIO.output(LED, GPIO.HIGH if dark else GPIO.LOW)
        time.sleep(0.2)


# daemon=True so Ctrl+C on the dev server actually exits.
threading.Thread(target=_worker, daemon=True).start()


def setLed(on: bool):
    with _lock:
        _state["auto"] = False      # a manual command turns automatic off
        _state["led"] = on
        GPIO.output(LED, GPIO.HIGH if on else GPIO.LOW)


def setAuto(on: bool):
    with _lock:
        _state["auto"] = on


def readState():
    with _lock:
        return dict(_state)`

const DJANGO_VIEWS = `# hardware/views.py
from django.http import JsonResponse
from django.shortcuts import render

from . import gpioHw


def index(request):
    return render(request, "hardware/index.html")


def state(request):
    return JsonResponse(gpioHw.readState())


def led(request, action):
    gpioHw.setLed(action == "on")
    return JsonResponse(gpioHw.readState())


def auto(request, action):
    gpioHw.setAuto(action == "on")
    return JsonResponse(gpioHw.readState())`

const DJANGO_URLS = `# controller/urls.py
from django.urls import path

from hardware import views

urlpatterns = [
    path("", views.index),
    path("api/state/", views.state),
    path("api/led/<str:action>/", views.led),
    path("api/auto/<str:action>/", views.auto),
]`

const DJANGO_TEMPLATE = `<!-- hardware/templates/hardware/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pi Control</title>
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 2rem">
  <h1>Raspberry Pi Control</h1>

  <p>LED: <b id="led">?</b> &nbsp; Light: <b id="dark">?</b> &nbsp; Auto: <b id="auto">?</b></p>

  <p>
    <button onclick="send('/api/led/on/')">LED on</button>
    <button onclick="send('/api/led/off/')">LED off</button>
  </p>
  <p>
    <button onclick="send('/api/auto/on/')">Auto on</button>
    <button onclick="send('/api/auto/off/')">Auto off</button>
  </p>

<script>
function paint(s) {
  document.getElementById('led').textContent  = s.led  ? 'ON' : 'OFF';
  document.getElementById('auto').textContent = s.auto ? 'ON' : 'OFF';
  document.getElementById('dark').textContent = s.dark ? 'dark' : 'bright';
}
function send(url) { fetch(url).then(r => r.json()).then(paint); }

// Poll, so the page follows the LED when automatic mode changes it.
setInterval(() => fetch('/api/state/').then(r => r.json()).then(paint), 500);
</script>
</body>
</html>`

const DJANGO_RUN = `# Let other machines on the network reach it - the default only binds
# localhost, which on a headless Pi means nothing can connect.
python manage.py runserver 0.0.0.0:8000

# Then open http://<your-pi-ip>:8000/ from any device on the same network.`

const DJANGO_HOSTS = `# controller/settings.py - the dev server refuses unknown Host headers.
# For a workshop on a trusted network this is enough:
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    # ...
    "hardware",
]`

function buildContent(id: (key: string) => number) {
  return [
    textBlock([
      heading('h1', [text('Raspberry Pi Workshop: Four Sessions')], 'center'),
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

async function main() {
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
    slug: SLUG,
    data: {
      title: 'Raspberry Pi Workshop: Four Sessions',
      slug: SLUG,
      description:
        'The club’s four-part Pi course as collapsible sessions - setup and VNC, blink an LED, an LDR sensor, and a Django app controlling both.',
      thumbnail: id('auto'),
      difficulty: 'intermediate',
      tags,
      estimatedReadTime: 35,
      badge: 'featured',
      content: buildContent(id),
    },
  })
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
