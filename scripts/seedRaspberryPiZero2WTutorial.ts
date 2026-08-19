/**
 * Seed the "Raspberry Pi Zero 2 W: Headless Setup" tutorial.
 *
 *   pnpm tsx scripts/seedRaspberryPiZero2WTutorial.ts
 *
 * Separate from the Pi 3/4/5 tutorial because the Zero's whole story is
 * different: no Ethernet, no full-size HDMI or USB, half a gigabyte of RAM, and
 * a USB port that can act as a network device. The Imager steps are shared, so
 * the same screenshots are reused - `ensureMediaFromFile` matches on filename,
 * so this run reuses the media docs that seed already uploaded.
 *
 * Screenshots come from a folder outside this repo (see IMAGE_DIR). Matched on
 * slug, so re-running updates in place. Live immediately.
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
  ensureTagIds,
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

const SLUG = 'raspberry-pi-zero-2-w-headless-setup'
const IMAGE_DIR = 'C:/Projects/EMBEDCLUB/embed-club/events-img/2025'

/** Shared with the Pi 3/4/5 tutorial - the Imager and SSH steps are the same. */
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
  sshAfter: { file: 'SSHAfterConnecting.png', alt: 'A successful SSH session on the Raspberry Pi' },
  pins: { file: 'RaspberryPiPins.png', alt: 'Raspberry Pi 40-pin GPIO pinout' },
  led: { file: 'RaspberryPILED.jpeg', alt: 'LED wired to the Raspberry Pi GPIO header' },
}

const SSH_CONNECT = `# Use the hostname you set in the Imager. The Zero 2 W has no Ethernet, so
# this only works once it has joined the Wi-Fi you configured.
ssh embed@zero2.local

# or by IP, from your router's client list:
ssh embed@192.168.1.42`

const USB_GADGET = `# Optional: make the Zero appear as a network device over the USB data port,
# so it works with no Wi-Fi at all. Edit these two files on the SD card's
# boot partition from your computer, before first boot.

# 1. In config.txt, add this as the LAST line:
dtoverlay=dwc2

# 2. In cmdline.txt, insert this immediately after 'rootwait'
#    (all on ONE line - that file must never contain a line break):
modules-load=dwc2,g_ether`

const UPDATE_SYSTEM = `sudo apt update
sudo apt full-upgrade -y
sudo reboot`

const SWAP_CHECK = `# 512 MB goes fast. Check what is actually free, and how hard it is swapping:
free -h

# Watch memory live while something builds:
htop`

const BLINK_LED = `# blink.py - GPIO17 (physical pin 11), same header as every other Pi.
# Wiring: pin 11 -> 330 ohm resistor -> LED anode; LED cathode -> pin 9 (GND).
from gpiozero import LED
from time import sleep

led = LED(17)

while True:
    led.on()
    sleep(1)
    led.off()
    sleep(1)`

function buildContent(id: (key: string) => number) {
  return [
    textBlock([
      heading('h1', [text('Raspberry Pi Zero 2 W: Headless Setup')], 'center'),
      paragraph([
        text(
          'The Zero 2 W is a full quad-core Linux computer the size of a stick of gum. It has the same processor family as the Pi 3 in a board that costs a fraction as much and draws about a watt - which makes it the one to reach for when a project has to be small, battery-powered, or left running somewhere. The catch is that it has no Ethernet, no full-size ports, and 512 MB of RAM, so it is a board you set up headless and then mostly leave alone.',
        ),
      ]),
      heading('h2', [text('What You Will Need')]),
      list('bullet', [
        [
          bold('A Raspberry Pi Zero 2 W'),
          text(' - the '),
          bold('W'),
          text(' matters; it is the one with Wi-Fi'),
        ],
        [bold('A microSD card'), text(', 16 GB or larger, Class 10 / A1 or better')],
        [
          bold('A 5V micro-USB power supply'),
          text(' - 2.5A, and a real supply rather than a laptop port'),
        ],
        [text('A card reader')],
        [
          text('Optional, for a monitor: a '),
          bold('mini-HDMI'),
          text(' cable or adapter, and a '),
          bold('micro-USB OTG'),
          text(' adapter for a keyboard'),
        ],
      ]),
      paragraph([
        bold('The two micro-USB sockets are not interchangeable. '),
        text('The one marked '),
        code('PWR IN'),
        text(' is power only. The one marked '),
        code('USB'),
        text(
          ' is the data port - that is where an OTG adapter or a USB gadget connection goes. Plugging power into the data port powers the board but leaves it unreliable under load.',
        ),
      ]),
      paragraph([
        bold('Why headless. '),
        text(
          'Reaching the desktop on a Zero needs a mini-HDMI cable and an OTG hub for keyboard and mouse - more adapters than most people have. Setting it up over the network needs none of them, and it is how the board is normally used anyway.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 1: Download Raspberry Pi Imager')]),
      list('number', [
        [text('Visit '), bold('raspberrypi.com/software'), text('.')],
        [text('Download and install Imager for your operating system.')],
        [text('Put the microSD card in the reader.')],
      ]),
    ]),
    imageBlock(id('download'), 'The Raspberry Pi Imager download page'),

    textBlock([
      heading('h2', [text('Step 2: Choose Device, OS, and Storage')]),
      list('number', [
        [
          text('Click '),
          bold('Choose Device'),
          text(' → '),
          bold('Raspberry Pi Zero 2 W'),
          text('.'),
        ],
        [text('Click '), bold('Choose OS'), text('.')],
        [text('Click '), bold('Choose Storage'), text(' and select the card.')],
      ]),
    ]),
    imageBlock(id('imager'), 'Raspberry Pi Imager - Choose Device, OS, and Storage'),
    textBlock([
      paragraph([bold('Which OS to pick, on this board specifically:')]),
      list('bullet', [
        [
          bold('Raspberry Pi OS Lite (64-bit)'),
          text(
            ' - the right default. No desktop, so almost all of the 512 MB stays available for your project.',
          ),
        ],
        [
          bold('Raspberry Pi OS (64-bit) with desktop'),
          text(
            ' - it runs, and it is slow. Worth it only if you genuinely need a GUI on the board itself.',
          ),
        ],
        [
          bold('32-bit'),
          text(' - only for old software that needs it. The Zero 2 W’s processor is 64-bit.'),
        ],
      ]),
      paragraph([
        italic('Lite is not a compromise here. '),
        text('A desktop on a board with half a gigabyte of RAM spends most of that RAM on itself.'),
      ]),
    ]),
    imageBlock(id('osScreen'), 'Selecting the operating system'),

    textBlock([
      heading('h2', [text('Step 3: Configure It Before Writing')]),
      paragraph([
        text('Click '),
        bold('Next'),
        text(' → '),
        bold('Edit Settings'),
        text(
          '. On a headless board this is not a convenience, it is the only chance to configure anything - there is no keyboard attached later to fix a typo.',
        ),
      ]),
    ]),
    imageBlock(id('editSettings'), 'The OS customisation dialog - General tab'),
    textBlock([
      paragraph([text('On '), bold('General'), text(', set:')]),
      list('bullet', [
        [text('Hostname - something you will recognise, e.g. '), code('zero2')],
        [text('Username and password')],
        [
          bold('Wi-Fi SSID, password, and Wi-Fi country'),
          text(
            ' - mandatory on this board. With no Ethernet port, a Zero that does not join Wi-Fi is unreachable.',
          ),
        ],
        [text('Locale and keyboard layout')],
      ]),
      paragraph([
        bold('2.4 GHz only. '),
        text(
          'The Zero 2 W’s radio does not do 5 GHz. If your router publishes both bands under one name it will usually work; a 5 GHz-only network is invisible to it.',
        ),
      ]),
    ]),
    imageBlock(id('filledSettings'), 'The settings filled in'),
    textBlock([
      paragraph([
        text('On the '),
        bold('Services'),
        text(' tab, '),
        bold('enable SSH'),
        text(' with password authentication.'),
      ]),
    ]),
    imageBlock(id('sshSetting'), 'Enabling SSH on the Services tab'),

    textBlock([
      heading('h2', [text('Step 4: Write, Then Boot')]),
      list('number', [
        [
          text('Save the settings, confirm the right card is selected - '),
          bold('writing erases it'),
          text(' - and click Write.'),
        ],
        [text('Eject the card and put it in the Zero.')],
        [text('Connect power to the socket marked '), code('PWR IN'), text('.')],
        [
          text('Wait. First boot resizes the filesystem and takes '),
          bold('2–4 minutes'),
          text(' on this board - noticeably longer than a Pi 4.'),
        ],
      ]),
      paragraph([
        text(
          'The green activity LED flickering irregularly means it is working. A steady or absent LED after several minutes means the card did not boot.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 5: Connect Over SSH')]),
      paragraph([text('From a terminal on your computer:')]),
    ]),
    codeBlock('bash', SSH_CONNECT, 'Connecting to the Zero'),
    textBlock([
      paragraph([
        text(
          'Accept the fingerprint, enter the password you set, and you have a shell. There is no desktop to miss - on Lite there was never one to begin with.',
        ),
      ]),
    ]),
    imageBlock(id('sshAfter'), 'Connected - a shell on the Zero 2 W'),
    textBlock([paragraph([text('Update it before anything else:')])]),
    codeBlock('bash', UPDATE_SYSTEM, 'Update and reboot'),
    textBlock([
      paragraph([
        italic('This takes a while on a Zero. '),
        text(
          'A full upgrade on a fresh image can run 10–20 minutes; it is unpacking on a single slow card, not hung.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('No Wi-Fi Available? Use the USB Port as a Network Cable')]),
      paragraph([
        text(
          'The Zero’s data port can pretend to be a USB network adapter, so the board appears on your computer over the same cable that powers it. Useful on a locked-down network, or when the Wi-Fi details were wrong and you cannot get in to fix them.',
        ),
      ]),
      paragraph([
        text('Put the freshly written card back in your computer and edit two files on the '),
        bold('boot'),
        text(' partition - the small one Windows can see:'),
      ]),
    ]),
    codeBlock('bash', USB_GADGET, 'On the boot partition, before first boot'),
    textBlock([
      paragraph([
        bold('cmdline.txt must stay a single line. '),
        text(
          'An editor that adds a trailing newline or wraps the text will stop the board booting entirely, with no error you can see. Notepad on Windows is safe; be careful with editors that "helpfully" reformat.',
        ),
      ]),
      paragraph([
        text('Then connect the cable to the port marked '),
        code('USB'),
        text(' rather than '),
        code('PWR IN'),
        text(', wait a minute, and '),
        code('ssh'),
        text(' to the same hostname. The board draws its power from that port too.'),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Living With 512 MB')]),
      paragraph([
        text(
          'This is the constraint that defines the board. Four cores, but a third of the memory of a Pi 4’s smallest variant.',
        ),
      ]),
    ]),
    codeBlock('bash', SWAP_CHECK, 'Check memory and swap'),
    textBlock([
      list('bullet', [
        [
          text('Prefer '),
          code('apt install'),
          text(
            ' over building from source - compiling large projects on this board will swap itself to a standstill.',
          ),
        ],
        [
          text('Install '),
          code('pip'),
          text(' packages with '),
          code('--no-cache-dir'),
          text(' so the wheel cache does not fill RAM.'),
        ],
        [
          text(
            'Run headless services, not desktops. One Python process and a couple of daemons is what this board is for.',
          ),
        ],
        [
          text(
            'Heavy swapping wears the SD card. If a workload swaps constantly, it belongs on a bigger Pi.',
          ),
        ],
      ]),
    ]),

    textBlock([
      heading('h2', [text('First Task: Blink an LED')]),
      paragraph([
        text(
          'The Zero 2 W has the same 40-pin header as every other modern Pi - on the plain board it is unpopulated, so it needs headers soldered, or a solderless press-fit header.',
        ),
      ]),
    ]),
    imageBlock(id('pins'), 'The 40-pin GPIO layout, identical across modern Pi models'),
    textBlock([
      paragraph([text('Wire an LED:')]),
      list('bullet', [
        [code('Pin 11'), text(' (GPIO17) → 330Ω resistor → LED long leg (anode)')],
        [text('LED short leg (cathode) → '), code('Pin 9'), text(' (GND)')],
      ]),
    ]),
    imageBlock(id('led'), 'LED wired to the GPIO header', 'medium'),
    codeBlock('python', BLINK_LED, 'blink.py'),
    textBlock([
      paragraph([
        code('gpiozero'),
        text(' is preinstalled on Raspberry Pi OS, including Lite. Save the file over SSH with '),
        code('nano blink.py'),
        text(' and run it with '),
        code('python blink.py'),
        text('.'),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Troubleshooting')]),
      list('bullet', [
        [
          bold('Never appears on the network: '),
          text(
            'the Wi-Fi country was not set in the Imager (the radio stays off without it), the network is 5 GHz-only, or the credentials are wrong. All three need re-writing the card.',
          ),
        ],
        [
          bold('ssh: Could not resolve hostname: '),
          text('.local names need mDNS. Find the IP in your router’s client list and use that.'),
        ],
        [
          bold('Boots, then dies under load: '),
          text(
            'underpowered. A laptop USB port cannot reliably run this board - use a 2.5A supply, into ',
          ),
          code('PWR IN'),
          text('.'),
        ],
        [
          bold('Nothing at all on HDMI: '),
          text('the socket is '),
          bold('mini'),
          text('-HDMI, not micro-HDMI like the Pi 4. The adapters are not interchangeable.'),
        ],
        [
          bold('USB gadget mode does nothing: '),
          text('the cable is in '),
          code('PWR IN'),
          text(', or '),
          code('cmdline.txt'),
          text(' got a line break. Both are silent failures.'),
        ],
        [
          bold('Everything is glacial: '),
          text(
            'a desktop image on 512 MB, or a slow SD card. Reflash with Lite and a Class 10 / A1 card.',
          ),
        ],
      ]),
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [
          text(
            'Attach a Pi Camera with the Zero’s narrower CSI cable and build a battery-powered camera.',
          ),
        ],
        [text('Run it as an always-on sensor node posting to MQTT - it idles at about a watt.')],
        [
          text(
            'Read the Raspberry Pi 3/4/5 tutorial for the desktop and RealVNC path on a board with the headroom for it.',
          ),
        ],
        [
          text(
            'Compare with the Pico W when the job needs no Linux at all - it will run for far longer on a battery.',
          ),
        ],
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

  const tags = await ensureTagIds(payload, ['Raspberry', 'IoT', 'Python'])

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'Raspberry Pi Zero 2 W: Headless Setup',
      slug: SLUG,
      description:
        'Set up a Pi Zero 2 W with no monitor - Imager configuration, SSH over Wi-Fi, USB gadget mode as a fallback, and living within 512 MB of RAM.',
      thumbnail: id('imager'),
      difficulty: 'intermediate',
      tags,
      estimatedReadTime: 22,
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
