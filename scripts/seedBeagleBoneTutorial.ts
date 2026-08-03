/**
 * Seed the "BeagleBone: Setup and First Task" tutorial.
 *
 *   pnpm tsx scripts/seedBeagleBoneTutorial.ts
 *
 * Screenshot slots and the thumbnail use the shared placeholder graphic with a
 * caption naming the real image that belongs there — there is no BeagleBone
 * photo in the media library yet. Matched on slug, so re-running updates in
 * place. Live immediately.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  codeBlock,
  ensurePlaceholderMedia,
  flushExit,
  heading,
  italic,
  list,
  paragraph,
  placeholderImage,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'beaglebone-setup-and-first-task'

const SSH_CONNECT = `# The board shows up as a USB network device. On Windows it is 192.168.7.2,
# on macOS/Linux 192.168.6.2. Default user 'debian', default password 'temppwd'.
ssh debian@192.168.7.2

# Change that password immediately on a board you keep:
passwd`

const LED_SYSFS = `# The four on-board USER LEDs live under /sys/class/leds. usr0 normally shows
# a heartbeat — take it over, then toggle it by hand.
LED=/sys/class/leds/beaglebone:green:usr0

echo none | sudo tee $LED/trigger      # stop the default heartbeat pattern
echo 1    | sudo tee $LED/brightness   # LED on
echo 0    | sudo tee $LED/brightness   # LED off`

const LED_BLINK = `#!/bin/bash
# blink.sh — blink on-board USER LED 0 once a second. Ctrl+C to stop.
LED=/sys/class/leds/beaglebone:green:usr0
echo none | sudo tee $LED/trigger

while true; do
  echo 1 | sudo tee $LED/brightness
  sleep 1
  echo 0 | sudo tee $LED/brightness
  sleep 1
done`

const EXTERNAL_LED = `# An external LED on header pin P9_14. First set the pin to GPIO mode:
config-pin P9_14 gpio

# blink_ext.py — wiring: P9_14 -> 330 ohm resistor -> LED anode;
#                        LED cathode -> P9_1 (GND).
python3 - <<'PY'
import Adafruit_BBIO.GPIO as GPIO
import time

GPIO.setup("P9_14", GPIO.OUT)
try:
    while True:
        GPIO.output("P9_14", GPIO.HIGH); time.sleep(1)
        GPIO.output("P9_14", GPIO.LOW);  time.sleep(1)
finally:
    GPIO.cleanup()
PY`

const CONTENT = [
  textBlock([
    heading('h1', [text('BeagleBone: Setup and First Task')], 'center'),
    paragraph([
      text(
        'The BeagleBone Black is a small Linux computer aimed at hardware projects — it boots from on-board storage, has a huge number of GPIO pins, and reaches the internet the moment you plug it into your laptop over USB. This tutorial gets it running: the OS image, flashing, connecting over USB, and a first task blinking both an on-board and an external LED.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('A BeagleBone'), text(' — Black or Green')],
      [bold('A micro-USB cable'), text(' that carries data')],
      [bold('A microSD card'), text(', 8 GB or larger, for flashing the image')],
      [text('A host computer (Windows, macOS, or Linux)')],
      [text('Optional: a 5V/2A barrel-jack supply for heavier use')],
    ]),
    paragraph([
      bold('On storage: '),
      text(
        'unlike a Raspberry Pi, the BeagleBone has built-in eMMC flash and can run without an SD card at all. The card is used to carry the new image, which is then written to that on-board storage.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Download the Image')]),
    list('number', [
      [text('Go to '), bold('beagleboard.org/distros'), text('.')],
      [
        text('Download the latest '),
        bold('Debian IoT'),
        text(' image for your board — a '),
        code('.img.xz'),
        text(' file.'),
      ],
      [
        text('Pick a '),
        bold('flasher'),
        text(
          ' image if offered: it writes itself to the on-board eMMC automatically on first boot.',
        ),
      ],
    ]),
  ]),
  placeholderImage(0, 'The beagleboard.org distros page with the Debian IoT image highlighted'),

  textBlock([
    heading('h2', [text('Step 2: Flash the Image to the SD Card')]),
    paragraph([
      text('Use '),
      bold('balenaEtcher'),
      text(' (balena.io/etcher) — it reads the '),
      code('.img.xz'),
      text(' directly, no unzipping.'),
    ]),
    list('number', [
      [text('Insert the microSD card.')],
      [text('Etcher → '), bold('Flash from file'), text(' → the downloaded image.')],
      [
        text('Select the SD card as the target — '),
        bold('confirm the size'),
        text(', it erases it.'),
      ],
      [text('Flash, then eject.')],
    ]),
  ]),
  placeholderImage(0, 'balenaEtcher mid-flash with the BeagleBone image and SD card selected'),

  textBlock([
    heading('h2', [text('Step 3: Boot (and Flash the eMMC)')]),
    paragraph([text('Two cases, depending on the image you downloaded:')]),
    list('bullet', [
      [
        bold('Flasher image: '),
        text(
          'insert the card, power the board. The four USER LEDs sweep back and forth while it writes to eMMC, then all turn off. Remove the card — it now boots from on-board storage.',
        ),
      ],
      [
        bold('Plain image: '),
        text('the board simply boots from the SD card each time. Hold the '),
        code('S2 / BOOT'),
        text(' button while powering on if it will not pick the card.'),
      ],
    ]),
  ]),
  placeholderImage(0, 'A BeagleBone with the four USER LEDs mid-sweep during an eMMC flash'),

  textBlock([
    heading('h2', [text('Step 4: Connect Over USB')]),
    paragraph([
      text(
        'Plug the board into your computer with the micro-USB cable. It powers up and appears as three things at once: a USB drive (with drivers), a serial port, and — the useful one — a small ',
      ),
      bold('network device'),
      text('. The board is reachable at a fixed address:'),
    ]),
    list('bullet', [
      [bold('Windows: '), code('192.168.7.2')],
      [bold('macOS / Linux: '), code('192.168.6.2')],
    ]),
    paragraph([
      text('If it does not appear, install the drivers from the '),
      code('BEAGLEBONE'),
      text(' USB drive that mounts, then re-plug.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 5: Access the Board')]),
    paragraph([text('Connect over '), bold('SSH'), text(' from a terminal:')]),
  ]),
  codeBlock('bash', SSH_CONNECT, 'Connecting over USB networking'),
  placeholderImage(
    0,
    'A terminal with a successful SSH session into the BeagleBone (the debian@beaglebone prompt)',
  ),
  textBlock([
    paragraph([
      text('You can also open the board’s built-in web tools in a browser at '),
      code('http://192.168.7.2'),
      text(', which links to the on-board coding environment and documentation.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 6: First Task — Blink an On-board LED')]),
    paragraph([
      text('No wiring needed. The four green USER LEDs are controlled through the Linux '),
      code('/sys'),
      text(' filesystem — just write to files:'),
    ]),
  ]),
  codeBlock('bash', LED_SYSFS, 'Control USER LED 0 by hand'),
  textBlock([
    paragraph([
      text('Wrap that in a loop to blink it. Save as '),
      code('blink.sh'),
      text(', then '),
      code('bash blink.sh'),
      text(':'),
    ]),
  ]),
  codeBlock('bash', LED_BLINK, 'blink.sh — blink an on-board LED'),
  textBlock([
    paragraph([
      bold('Why write to files: '),
      text('Linux exposes hardware as files under '),
      code('/sys'),
      text('. Setting the trigger to '),
      italic('none'),
      text(' releases the LED from its default heartbeat so your writes to '),
      code('brightness'),
      text(' take effect. This is the same model for GPIO, PWM, and more.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 7: Blink an External LED')]),
    paragraph([
      text('To drive your own LED, use a header pin. Set it to GPIO mode with '),
      code('config-pin'),
      text(', then toggle it from Python:'),
    ]),
    list('bullet', [
      [code('P9_14'), text(' → 330Ω resistor → LED long leg (anode)')],
      [text('LED short leg (cathode) → '), code('P9_1'), text(' (GND)')],
    ]),
  ]),
  codeBlock('bash', EXTERNAL_LED, 'External LED on P9_14'),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('No 192.168.7.2: '),
        text('the USB network drivers are not installed. Open the '),
        code('BEAGLEBONE'),
        text(' drive that mounts and run the installer, then re-plug.'),
      ],
      [
        bold('eMMC flash never finishes: '),
        text(
          'a weak USB port cannot power the write. Use a 5V barrel supply, or a powered USB hub.',
        ),
      ],
      [
        bold('config-pin: not found: '),
        text('an older image. Update with '),
        code('sudo apt update && sudo apt upgrade'),
        text(', or address the GPIO by its '),
        code('/sys/class/gpio'),
        text(' number instead.'),
      ],
      [
        bold('Permission denied writing to /sys: '),
        text('those files need root — keep the '),
        code('sudo tee'),
        text(' pattern shown above.'),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [
        text(
          'Read analogue sensors on the AIN pins — the BeagleBone has a built-in ADC the Pi lacks.',
        ),
      ],
      [text('Use the PRU real-time cores for precise timing a normal Linux process cannot hit.')],
      [text('Drive motors and relays from the many GPIO pins for a robotics build.')],
      [
        text(
          'Compare with the Raspberry Pi and Jetson Nano tutorials to pick the right board per project.',
        ),
      ],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)

  const content = CONTENT.map((block) =>
    block.blockType === 'imageBlock' ? { ...block, image: placeholderId } : block,
  )

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'BeagleBone: Setup and First Task',
      slug: SLUG,
      description:
        'Set up a BeagleBone Black/Green — flash the Debian image, connect over USB, and blink an on-board and external LED through Linux GPIO.',
      // No BeagleBone photo in the library yet; placeholder until one is added.
      thumbnail: placeholderId,
      difficulty: 'intermediate',
      // IoT, Microcontroller
      tags: [1, 5],
      estimatedReadTime: 20,
      content,
    },
  })
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
