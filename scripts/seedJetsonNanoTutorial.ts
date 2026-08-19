/**
 * Seed the "NVIDIA Jetson Nano: Flash, Boot, and First Task" tutorial.
 *
 * Authored here rather than clicked into the admin, so it is reviewable in a
 * diff and re-runnable - re-running updates the existing document (matched on
 * slug). Targets the same Neon instance production uses, so it is live at once.
 *
 *   pnpm tsx scripts/seedJetsonNanoTutorial.ts
 *
 * Image slots use a shared placeholder graphic with a caption naming the real
 * screenshot that belongs there; the thumbnail reuses the existing Nvidia media
 * doc. Swap both in the admin later.
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

const SLUG = 'jetson-nano-flash-boot-first-task'
/** Existing Nvidia image (Nvidia.webp) reused as a temporary thumbnail. */
const THUMBNAIL_MEDIA_ID = 84

const SSH_CONNECT = `# From another computer on the same network. Find the Nano's IP from your
# router, or run 'ip addr' on the Nano over the serial console first.
ssh embedclub@192.168.1.42

# First login walks through the same Ubuntu setup as the desktop path:
# licence, language, keyboard, timezone, username, password.`

const SWAP_ADD = `# The 4GB Nano runs out of RAM fast under AI workloads. Add 4GB of swap:
sudo systemctl disable nvzramconfig
sudo fallocate -l 4G /mnt/4GB.swap
sudo chmod 600 /mnt/4GB.swap
sudo mkswap /mnt/4GB.swap
sudo swapon /mnt/4GB.swap
# Make it permanent across reboots:
echo '/mnt/4GB.swap swap swap defaults 0 0' | sudo tee -a /etc/fstab`

const BLINK_LED = `# blink.py - blink an LED wired to pin 12 (BOARD numbering).
# Wiring: pin 12 -> 220 ohm resistor -> LED anode (long leg);
#         LED cathode (short leg) -> pin 6 (GND).
import Jetson.GPIO as GPIO
import time

LED = 12
GPIO.setmode(GPIO.BOARD)      # use the physical pin numbers on the header
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
    GPIO.cleanup()            # release the pin cleanly on Ctrl+C`

const AI_INFERENCE = `# Run NVIDIA's "Hello AI World" object detection on a live image, using the
# pre-built jetson-inference container so nothing has to be compiled.
sudo docker run --runtime nvidia -it --rm --network host \\
  --volume ~/jetson-inference/data:/jetson-inference/data \\
  --device /dev/video0 \\
  dustynv/jetson-inference:r32.7.1

# Inside the container, detect objects in a sample image:
detectnet images/peds_0.jpg images/out.jpg
# 'out.jpg' now has boxes drawn around every person the model found.`

const CONTENT = [
  textBlock([
    heading('h1', [text('NVIDIA Jetson Nano: Flash, Boot, and First Task')], 'center'),
    paragraph([
      text(
        'The Jetson Nano is a small single-board computer with a real GPU, built for running AI at the edge. This tutorial takes it from a blank SD card to a working board: downloading NVIDIA’s image, flashing it, booting either with a monitor or fully headless, and then running a first task - blinking an LED, and running an object-detection model on the GPU.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('Jetson Nano Developer Kit'), text(' (2GB or 4GB)')],
      [bold('microSD card'), text(', 32GB or larger, UHS-1 speed or better')],
      [
        bold('Power supply'),
        text(' - 5V/4A barrel jack recommended, or 5V/2A micro-USB for light use'),
      ],
      [text('A host computer to download and flash the image')],
      [
        text('Either a '),
        bold('monitor + USB keyboard/mouse'),
        text(' (desktop setup), or nothing extra (headless setup)'),
      ],
      [text('An Ethernet cable or a supported Wi-Fi dongle for network access')],
    ]),
    paragraph([
      bold('On power: '),
      text(
        'AI workloads spike the current draw, and a micro-USB supply browns out under load - the board simply reboots mid-task. For anything beyond first light, use a 5V/4A barrel jack and fit the ',
      ),
      code('J48'),
      text(' jumper, which tells the Nano to take power from the barrel instead of USB.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Download the Image from NVIDIA')]),
    list('number', [
      [text('Go to '), bold('developer.nvidia.com/embedded/downloads'), text('.')],
      [
        text('Find '),
        bold('Jetson Nano Developer Kit SD Card Image'),
        text(' (match the 2GB or 4GB version to your board).'),
      ],
      [text('Download the '), code('.zip'), text(' - it is around 6–14 GB, so give it time.')],
    ]),
    paragraph([
      text('Do not unzip it. The flashing tool in the next step reads the '),
      code('.zip'),
      text(' directly.'),
    ]),
  ]),
  placeholderImage(
    0,
    'The NVIDIA Jetson download page with the "Jetson Nano Developer Kit SD Card Image" highlighted',
  ),

  textBlock([
    heading('h2', [text('Step 2: Flash the Image to the SD Card')]),
    paragraph([
      text('Use '),
      bold('balenaEtcher'),
      text(
        ' - free, and it works the same on Windows, macOS, and Linux. Install it from balena.io/etcher.',
      ),
    ]),
    list('number', [
      [text('Insert the microSD card into your computer (a USB adapter is fine).')],
      [
        text('Open balenaEtcher and click '),
        bold('Flash from file'),
        text('; pick the downloaded '),
        code('.zip'),
        text('.'),
      ],
      [
        text('Click '),
        bold('Select target'),
        text(' and choose the SD card. '),
        bold('Check this carefully'),
        text(' - it erases the target.'),
      ],
      [text('Click '), bold('Flash'), text('. It writes, then verifies - roughly 10–20 minutes.')],
    ]),
    paragraph([
      bold('On selecting the target: '),
      text(
        'Etcher hides system drives, but always confirm the size matches your SD card before flashing. Picking the wrong disk wipes it. If Windows pops up "you need to format the disk" afterwards, ignore and eject - that is Windows not understanding the Linux partitions, not a failed flash.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'balenaEtcher mid-flash - showing the selected image, target SD card, and progress bar',
  ),

  textBlock([
    heading('h2', [text('Step 3: First Boot')]),
    paragraph([text('Two ways to do the initial Ubuntu setup. Pick one.')]),
    heading('h3', [text('Option A - With a Monitor')]),
    list('number', [
      [text('Insert the flashed SD card into the slot on the underside of the module.')],
      [text('Connect the monitor (HDMI), keyboard, and mouse.')],
      [text('Plug in power. A green LED lights and Ubuntu boots to a setup wizard.')],
      [text('Accept the licence, then pick language, keyboard, timezone, and create your user.')],
    ]),
  ]),
  placeholderImage(
    0,
    'The Ubuntu first-boot setup wizard on the Jetson Nano (licence / language / user creation screen)',
  ),

  textBlock([
    heading('h3', [text('Option B - Headless')]),
    paragraph([
      text(
        'No monitor needed. Do the same first-boot setup over a direct USB connection, then switch to SSH.',
      ),
    ]),
    list('number', [
      [
        text('Insert the SD card and connect the Nano to your computer with the '),
        bold('micro-USB'),
        text(' cable.'),
      ],
      [text('Plug in power. Wait about a minute for it to boot.')],
      [
        text('Open a serial console to the Nano at '),
        bold('115200 baud'),
        text(' - '),
        code('screen /dev/ttyACM0 115200'),
        text(' on macOS/Linux, or PuTTY to the new COM port on Windows.'),
      ],
      [text('Complete the same Ubuntu setup wizard in the terminal.')],
      [text('Once it has an IP on the network, switch to SSH for everything after:')],
    ]),
  ]),
  codeBlock('bash', SSH_CONNECT, 'Connecting to a headless Nano'),

  textBlock([
    heading('h2', [text('Step 4: First Task - Blink an LED')]),
    paragraph([
      text('The 40-pin header is Raspberry-Pi-compatible. NVIDIA ships '),
      code('Jetson.GPIO'),
      text(' pre-installed. Wire an LED and blink it:'),
    ]),
    list('bullet', [
      [code('Pin 12'), text(' → 220Ω resistor → LED long leg (anode)')],
      [text('LED short leg (cathode) → '), code('Pin 6'), text(' (GND)')],
    ]),
  ]),
  codeBlock('python', BLINK_LED, 'blink.py - run with: python3 blink.py'),
  textBlock([
    paragraph([
      text('Run it with '),
      code('python3 blink.py'),
      text(' and the LED blinks once a second. '),
      bold('Ctrl+C'),
      text(' stops it, and '),
      code('GPIO.cleanup()'),
      text(' releases the pin so the next run starts clean.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 5: Run an AI Model on the GPU')]),
    paragraph([
      text(
        'The reason to use a Nano over a plain Pi is the GPU. NVIDIA’s "Hello AI World" ships pre-trained models in a container, so you can run real object detection without compiling anything:',
      ),
    ]),
  ]),
  codeBlock('bash', AI_INFERENCE, 'Object detection with jetson-inference'),
  textBlock([
    paragraph([
      text(
        'The first run pulls the container image (a few GB) and loads the model, so give it a minute. After that, ',
      ),
      code('detectnet'),
      text(' draws boxes around detected objects. Point it at a USB camera with '),
      code('detectnet /dev/video0'),
      text(' for live detection.'),
    ]),
    paragraph([
      bold('This is where swap matters. '),
      text(
        'Loading a model on the 4GB (or 2GB) board can exhaust RAM and get the process killed. If a run dies with no clear error, add swap first:',
      ),
    ]),
  ]),
  codeBlock('bash', SWAP_ADD, 'Add 4GB of swap to survive model loading'),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('No green light / nothing boots: '),
        text('re-flash the SD card, and confirm it is fully seated in the slot under the module.'),
      ],
      [
        bold('Green light but no display: '),
        text(
          'use HDMI, not a DisplayPort/VGA adapter - the Nano is picky. Try a different monitor before re-flashing.',
        ),
      ],
      [
        bold('Reboots under load: '),
        text('underpowered. Switch to a 5V/4A barrel supply and fit the '),
        code('J48'),
        text(' jumper.'),
      ],
      [
        bold('Process "Killed" during AI tasks: '),
        text('out of memory. Add swap (Step 5) and disable the desktop GUI with '),
        code('sudo systemctl set-default multi-user.target'),
        text(' to free RAM.'),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [
        text('Train and run your own model with the rest of the '),
        italic('Hello AI World'),
        text(' guide.'),
      ],
      [text('Attach a Raspberry Pi Camera or USB webcam for live inference.')],
      [text('Drive motors and sensors from the GPIO header for a robotics project.')],
      [text('Use the Nano as a small always-on server for edge AI on your network.')],
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
      title: 'NVIDIA Jetson Nano: Flash, Boot, and First Task',
      slug: SLUG,
      description:
        'Flash NVIDIA’s image to an SD card, boot the Jetson Nano with a monitor or headless, then blink an LED and run object detection on the GPU.',
      thumbnail: THUMBNAIL_MEDIA_ID,
      difficulty: 'intermediate',
      // IoT, Microcontroller
      tags: [1, 5],
      estimatedReadTime: 20,
      badge: 'popular',
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
