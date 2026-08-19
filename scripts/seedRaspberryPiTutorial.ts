/**
 * Re-seed the "Raspberry Pi 3/4/5 Setup" tutorial, completing the guide.
 *
 * The original stopped at "connect over SSH" and had no images. This adds the
 * real Imager / SSH / RealVNC screenshots, formats the shell commands as code
 * blocks, and continues through remote-desktop access, updating the system, and
 * a first GPIO task (blink an LED, plus a light-sensing bonus).
 *
 *   pnpm tsx scripts/seedRaspberryPiTutorial.ts
 *
 * Screenshots come from a folder outside this repo (see IMAGE_DIR); they are
 * uploaded into the media library on first run and reused after. Matched on
 * slug, so re-running updates the existing tutorial in place. Live immediately.
 */
import path from 'node:path'
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  codeBlock,
  ensureMediaFromFile,
  flushExit,
  heading,
  imageBlock,
  italic,
  list,
  paragraph,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'raspberry-pi-345-setup'
const THUMBNAIL_MEDIA_ID = 122
const IMAGE_DIR = 'C:/Projects/EMBEDCLUB/embed-club/events-img/2025'

/** Screenshots to upload, keyed by a short name the content refers to. */
const IMAGES: Record<string, { file: string; alt: string }> = {
  download: { file: 'RaspDownloadPage.png', alt: 'Raspberry Pi Imager download page' },
  imager: { file: 'RaspApplication.png', alt: 'Raspberry Pi Imager main window' },
  osScreen: {
    file: 'RaspberryPIOSScreen.png',
    alt: 'Choosing the operating system in Raspberry Pi Imager',
  },
  editSettings: {
    file: 'RaspAppAfterChoosingEditSettings.png',
    alt: 'Imager OS customisation dialog',
  },
  filledSettings: { file: 'RaspApplicationAfterFilling.png', alt: 'Imager settings filled in' },
  sshSetting: { file: 'RaspSettingsForSSH.png', alt: 'Enabling SSH in the Imager settings' },
  afterNext: { file: 'RaspAppAfterClickingNext.png', alt: 'Imager write confirmation' },
  sshBefore: { file: 'SSHBeforeConnect.png', alt: 'Terminal before connecting over SSH' },
  sshAfter: { file: 'SSHAfterConnecting.png', alt: 'A successful SSH session on the Raspberry Pi' },
  raspiInterface: { file: 'sudoRaspiInterface.png', alt: 'raspi-config Interface Options menu' },
  vncEnable: { file: 'sudoRaspiVNCEnable.png', alt: 'Enabling VNC in raspi-config' },
  vncDownload: { file: 'RealVNCDownload.png', alt: 'RealVNC Viewer download page' },
  vncNew: { file: 'RealVNCNewConnection.png', alt: 'Creating a new connection in RealVNC Viewer' },
  vncDetails: { file: 'RealVNCAfterInputDetails.png', alt: 'RealVNC connection details entered' },
  vncLogin: { file: 'RealVNCLogin.png', alt: 'RealVNC authentication prompt' },
  pins: { file: 'RaspberryPiPins.png', alt: 'Raspberry Pi 40-pin GPIO pinout' },
  led: { file: 'RaspberryPILED.jpeg', alt: 'LED wired to the Raspberry Pi GPIO header' },
  ldr: { file: 'RaspberryPiLDR.jpeg', alt: 'LDR light sensor wired to the Raspberry Pi' },
}

const SSH_CONNECT = `# Replace 'embed' with the username you set in the Imager. Use the hostname,
# or the IP address if .local name resolution does not work on your network.
ssh embed@raspberrypi.local

# or, by IP:
ssh embed@172.23.1.100`

const ENABLE_VNC = `# On the Pi (over SSH), open the configuration tool:
sudo raspi-config
# Then: Interface Options  ->  VNC  ->  Yes  ->  Finish`

const UPDATE_SYSTEM = `sudo apt update
sudo apt full-upgrade -y
sudo reboot`

const BLINK_LED = `# blink.py - blink an LED on GPIO17 (physical pin 11).
# Wiring: pin 11 -> 330 ohm resistor -> LED long leg (anode);
#         LED short leg (cathode) -> pin 9 (GND).
from gpiozero import LED
from time import sleep

led = LED(17)          # BCM numbering: GPIO17

while True:
    led.on()
    sleep(1)
    led.off()
    sleep(1)`

const LDR_LIGHT = `# nightlight.py - turn the LED on when it gets dark.
# LDR + capacitor on GPIO4; LED on GPIO17 as wired above.
from gpiozero import LightSensor, LED

ldr = LightSensor(4)   # GPIO4
led = LED(17)

while True:
    ldr.wait_for_dark()
    led.on()
    ldr.wait_for_light()
    led.off()`

function buildContent(id: (key: string) => number) {
  return [
    textBlock([
      heading('h1', [text('Raspberry Pi 3/4/5 Setup')], 'center'),
      paragraph([
        text(
          'The Raspberry Pi is a full Linux computer the size of a credit card. This guide takes it from a blank microSD card to a working machine you can reach from your laptop - flashing Raspberry Pi OS, setting it up headless (no monitor) over SSH and remote desktop, and finishing with a first GPIO task.',
        ),
      ]),
      heading('h2', [text('What You Will Need')]),
      list('bullet', [
        [bold('A Raspberry Pi'), text(' - 3, 4, or 5')],
        [bold('A microSD card'), text(', 16 GB or larger (Class 10 / A1 or better)')],
        [bold('A card reader'), text(' for your computer')],
        [bold('A USB-C (Pi 5/4) or micro-USB (Pi 3) power supply')],
        [text('For the desktop path: a monitor, HDMI cable, keyboard, and mouse')],
        [text('For the headless path: just your network - Ethernet or configured Wi-Fi')],
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 1: Download Raspberry Pi Imager')]),
      paragraph([
        text(
          'Raspberry Pi Imager is the official tool for writing Raspberry Pi OS (and other systems) to a microSD card.',
        ),
      ]),
      list('number', [
        [text('Visit '), bold('raspberrypi.com/software'), text('.')],
        [text('Download Imager for Windows, macOS, or Linux and install it.')],
        [text('Insert the microSD card into your computer using a card reader.')],
      ]),
    ]),
    imageBlock(id('download'), 'The Raspberry Pi Imager download page'),

    textBlock([
      heading('h2', [text('Step 2: Choose Device, OS, and Storage')]),
      list('number', [
        [text('Open Imager and click '), bold('Choose Device'), text('; pick your Pi model.')],
        [text('Click '), bold('Choose OS'), text('.')],
        [text('Click '), bold('Choose Storage'), text(' and select the microSD card.')],
      ]),
    ]),
    imageBlock(id('imager'), 'Raspberry Pi Imager - Choose Device, OS, and Storage'),
    textBlock([
      paragraph([bold('Recommended OS choices:')]),
      list('bullet', [
        [bold('Raspberry Pi OS (64-bit)'), text(' for the Pi 4 and 5')],
        [bold('Raspberry Pi OS (32-bit)'), text(' for the Pi 3')],
        [
          bold('Raspberry Pi OS Lite'),
          text(' if you will run the Pi headless with no desktop - smaller and lighter'),
        ],
        [text('Or any distro you like (Ubuntu, Kali Linux, and others are offered)')],
      ]),
    ]),
    imageBlock(id('osScreen'), 'Selecting the operating system'),

    textBlock([
      heading('h2', [text('Step 3: Configure Advanced Options')]),
      paragraph([
        text('Before writing, click '),
        bold('Next'),
        text(' → '),
        bold('Edit Settings'),
        text(
          '. This bakes your configuration into the card so the Pi is ready on first boot - essential for a headless setup, where you cannot type anything in later.',
        ),
      ]),
    ]),
    imageBlock(id('editSettings'), 'The OS customisation dialog - General tab'),
    textBlock([
      paragraph([text('On the '), bold('General'), text(' tab, set:')]),
      list('bullet', [
        [text('Hostname (e.g. '), code('raspberrypi.local'), text(')')],
        [text('Username and password')],
        [text('Wi-Fi SSID, password, and your Wi-Fi country')],
        [text('Locale - timezone and keyboard layout')],
      ]),
    ]),
    imageBlock(id('filledSettings'), 'The settings filled in'),
    textBlock([
      paragraph([
        text('Then on the '),
        bold('Services'),
        text(' tab, '),
        bold('enable SSH'),
        text(
          ' and choose password authentication. This is what lets you reach the Pi with no monitor.',
        ),
      ]),
    ]),
    imageBlock(id('sshSetting'), 'Enabling SSH on the Services tab'),

    textBlock([
      heading('h2', [text('Step 4: Write the Operating System')]),
      list('number', [
        [
          text('Click '),
          bold('Save'),
          text(', then '),
          bold('Yes'),
          text(' to apply the settings.'),
        ],
        [
          text('Confirm the correct storage device is selected - '),
          bold('this erases it'),
          text('.'),
        ],
        [text('Click '), bold('Write'), text(' and wait for it to write and verify.')],
        [text('Safely eject the card when it finishes.')],
      ]),
    ]),
    imageBlock(id('afterNext'), 'Confirming the write'),

    textBlock([
      heading('h2', [text('Method 1: Desktop Setup (with a monitor)')]),
      paragraph([text('If you have a monitor, keyboard, and mouse:')]),
      list('number', [
        [text('Insert the microSD card into the Pi.')],
        [text('Connect the HDMI cable, monitor, keyboard, and mouse.')],
        [text('Connect power - the Pi boots automatically.')],
        [text('Finish any first-boot prompts, and you arrive at the desktop.')],
      ]),
      paragraph([
        text(
          'Because you configured everything in the Imager, most of the old first-boot wizard is already done. Skip to ',
        ),
        bold('Update the System'),
        text(' below.'),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Method 2: Headless Setup (over SSH)')]),
      paragraph([text('No monitor needed - reach the Pi from your computer over the network.')]),
      heading('h3', [text('Step 5: Boot on the Network')]),
      list('number', [
        [text('Insert the flashed card and connect power.')],
        [text('Connect Ethernet, or rely on the Wi-Fi you set in the Imager.')],
        [text('Wait 1–2 minutes for the first boot.')],
      ]),
      heading('h3', [text('Step 6: Find the Pi and Connect')]),
      paragraph([
        text(
          'Find its address from your router, an app like Fing, or just try the hostname. Then open a terminal:',
        ),
      ]),
    ]),
    imageBlock(id('sshBefore'), 'A terminal, ready to connect'),
    codeBlock('bash', SSH_CONNECT, 'Connecting over SSH'),
    textBlock([
      paragraph([
        text(
          'Accept the fingerprint the first time, enter your password, and you are on the Pi. A ',
        ),
        code('$'),
        text(' prompt with your hostname means you are in.'),
      ]),
    ]),
    imageBlock(id('sshAfter'), 'Connected - a shell on the Raspberry Pi'),

    textBlock([
      heading('h2', [text('Accessing the Desktop Remotely (RealVNC)')]),
      paragraph([
        text(
          'SSH gives you a terminal. To see the actual Pi desktop from your computer, enable VNC and use ',
        ),
        bold('RealVNC Viewer'),
        text('.'),
      ]),
      heading('h3', [text('Enable VNC on the Pi')]),
      paragraph([text('Over SSH, run:')]),
    ]),
    codeBlock('bash', ENABLE_VNC, 'Turn on the VNC server'),
    imageBlock(id('raspiInterface'), 'raspi-config → Interface Options'),
    imageBlock(id('vncEnable'), 'Enabling VNC'),
    textBlock([
      heading('h3', [text('Connect from Your Computer')]),
      list('number', [
        [text('Download '), bold('RealVNC Viewer'), text(' from realvnc.com and install it.')],
        [
          text('Create a new connection to '),
          code('raspberrypi.local'),
          text(' (or the Pi’s IP).'),
        ],
        [text('Enter your Pi username and password when prompted.')],
      ]),
    ]),
    imageBlock(id('vncDownload'), 'RealVNC Viewer download'),
    imageBlock(id('vncNew'), 'New connection'),
    imageBlock(id('vncDetails'), 'Connection details'),
    imageBlock(id('vncLogin'), 'Authenticating'),
    textBlock([
      paragraph([
        text(
          'The full Pi desktop now opens in a window on your computer - no monitor ever plugged in.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Update the System')]),
      paragraph([text('Whichever method you used, update before doing anything else:')]),
    ]),
    codeBlock('bash', UPDATE_SYSTEM, 'Update and reboot'),

    textBlock([
      heading('h2', [text('First Task: Blink an LED')]),
      paragraph([
        text(
          'The 40-pin header is how the Pi talks to the physical world. Here is the pinout - mind the ',
        ),
        bold('BCM'),
        text(' (GPIO) numbers versus the physical pin positions.'),
      ]),
    ]),
    imageBlock(id('pins'), 'Raspberry Pi 40-pin GPIO layout'),
    textBlock([
      paragraph([text('Wire an LED:')]),
      list('bullet', [
        [code('Pin 11'), text(' (GPIO17) → 330Ω resistor → LED long leg (anode)')],
        [text('LED short leg (cathode) → '), code('Pin 9'), text(' (GND)')],
      ]),
    ]),
    imageBlock(id('led'), 'LED wired to the GPIO header', 'medium'),
    textBlock([
      paragraph([
        text('Raspberry Pi OS ships '),
        code('gpiozero'),
        text(' already. Save this as '),
        code('blink.py'),
        text(' and run '),
        code('python blink.py'),
        text(':'),
      ]),
    ]),
    codeBlock('python', BLINK_LED, 'blink.py'),

    textBlock([
      heading('h2', [text('Bonus: A Light-Sensing Night Light')]),
      paragraph([
        text('Add an '),
        bold('LDR'),
        text(' (light-dependent resistor) and the LED turns on when the room goes dark.'),
      ]),
    ]),
    imageBlock(id('ldr'), 'LDR light sensor on the breadboard', 'medium'),
    codeBlock('python', LDR_LIGHT, 'nightlight.py'),
    textBlock([
      paragraph([
        italic('gpiozero'),
        text(' does the analogue timing for you - '),
        code('wait_for_dark()'),
        text(' blocks until the LDR reads below its threshold, so the loop stays simple.'),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Troubleshooting')]),
      list('bullet', [
        [
          bold('ssh: Could not resolve hostname: '),
          text('.local names need mDNS. Use the IP address from your router instead.'),
        ],
        [
          bold('Connection refused / timed out: '),
          text(
            'SSH was not enabled in the Imager, or the Pi is not on the network yet. Re-check the Services tab and give it another minute.',
          ),
        ],
        [
          bold('VNC "cannot connect": '),
          text('VNC is not enabled, or you are on a different network. Confirm '),
          code('raspi-config'),
          text(' shows it on.'),
        ],
        [
          bold('Rainbow square / under-voltage warning: '),
          text(
            'the power supply is too weak. Use an official one - the Pi 4/5 in particular are fussy.',
          ),
        ],
      ]),
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [text('Attach a Pi Camera and stream video over the network.')],
        [text('Drive sensors and motors from the GPIO header for a full project.')],
        [text('Run the Pi as a always-on home server - Pi-hole, a file share, or a web app.')],
        [text('Try the ESP32-CAM or Jetson Nano tutorials for other on-device tasks.')],
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

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'Raspberry Pi 3/4/5 Setup',
      slug: SLUG,
      description:
        'Set up a Raspberry Pi 3/4/5 from a blank card - flash Raspberry Pi OS, go headless over SSH and RealVNC, update it, and blink your first LED.',
      thumbnail: THUMBNAIL_MEDIA_ID,
      difficulty: 'beginner',
      // IoT, Microcontroller, Raspberry
      tags: [1, 5, 6],
      estimatedReadTime: 25,
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
