/**
 * Seed the "Raspberry Pi 3/4/5 Setup" tutorial with the updated Imager UI,
 * Wayland-to-X11 RealVNC configuration, and first GPIO project.
 *
 *   pnpm tsx scripts/seedRaspberryPiTutorial.ts
 *
 * Screenshots come from events-img/2025 (copied from downloads); they are
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
  link,
  list,
  paragraph,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'raspberry-pi-345-setup'
const THUMBNAIL_MEDIA_ID = 122
const IMAGE_DIR = 'C:/Projects/EMBEDCLUB/embed-club/events-img/2025'

const VNC_VIEWER_URL =
  'https://drive.google.com/file/d/1O--Uh5XO3yt27H5vLI-paYNbCKEZ_Rw7/view?usp=sharing'

/** Screenshots to upload, keyed by a short name the content refers to. */
const IMAGES: Record<string, { file: string; alt: string }> = {
  device: {
    file: 'RaspberryPiImagerDevice.png',
    alt: 'Selecting your Raspberry Pi device in Raspberry Pi Imager',
  },
  osScreen: {
    file: 'RaspberryPiImagerOS.png',
    alt: 'Choosing the operating system in Raspberry Pi Imager',
  },
  storage: {
    file: 'RaspberryPiImagerStorage.png',
    alt: 'Selecting the microSD card storage device',
  },
  hostname: {
    file: 'RaspberryPiImagerHostname.png',
    alt: 'Setting the Raspberry Pi hostname in Imager customisation',
  },
  localisation: {
    file: 'RaspberryPiImagerLocalisation.png',
    alt: 'Setting timezone and keyboard localisation',
  },
  wifi: {
    file: 'RaspberryPiImagerWifi.png',
    alt: 'Configuring Wi-Fi network SSID and password',
  },
  sshSetting: {
    file: 'RaspberryPiImagerSSH.png',
    alt: 'Enabling SSH with password authentication',
  },
  rpiConnect: {
    file: 'RaspberryPiImagerConnect.png',
    alt: 'Raspberry Pi Connect settings left disabled',
  },
  summary: {
    file: 'RaspberryPiImagerSummary.png',
    alt: 'Imager write summary and customisations review',
  },
  eraseWarning: {
    file: 'RaspberryPiImagerEraseWarning.png',
    alt: 'Imager storage erase confirmation dialog',
  },
  writing: {
    file: 'RaspberryPiImagerWriting.png',
    alt: 'Imager writing OS to the microSD card',
  },
  sshConnecting: {
    file: 'RaspberryPiSSHConnecting.png',
    alt: 'Connecting to Raspberry Pi via SSH in terminal',
  },
  sshLogin: {
    file: 'RaspberryPiSSHLogin.png',
    alt: 'Logged into Raspberry Pi shell over SSH',
  },
  raspiInterface: {
    file: 'RaspberryPiRaspiConfigMain.png',
    alt: 'raspi-config main menu selecting Interface Options',
  },
  raspiVncOption: {
    file: 'RaspberryPiRaspiConfigInterface.png',
    alt: 'raspi-config Interface Options menu selecting VNC',
  },
  vncEnable: {
    file: 'RaspberryPiRaspiConfigVNCEnable.png',
    alt: 'Enabling VNC server prompt in raspi-config',
  },
  waylandToX11: {
    file: 'RaspberryPiWaylandToX11.png',
    alt: 'Switching display server from Wayland to X11 for RealVNC compatibility',
  },
  vncNew: {
    file: 'RealVNCNewConnection.png',
    alt: 'Creating a new connection in RealVNC Viewer',
  },
  vncDetails: {
    file: 'RealVNCAfterInputDetails.png',
    alt: 'RealVNC connection details entered',
  },
  vncLogin: {
    file: 'RealVNCLogin.png',
    alt: 'RealVNC authentication prompt',
  },
  pins: {
    file: 'RaspberryPiPins.png',
    alt: 'Raspberry Pi 40-pin GPIO pinout layout',
  },
  led: {
    file: 'RaspberryPILED.jpeg',
    alt: 'LED wired to the Raspberry Pi GPIO header',
  },
  ldr: {
    file: 'RaspberryPiLDR.jpeg',
    alt: 'LDR light sensor wired to the Raspberry Pi breadboard',
  },
}

const SSH_CONNECT = `# Replace 'eight' with the username you set in the Imager.
# Connect using the hostname:
ssh eight@eight.local

# Or connect directly by IP address if your network does not resolve .local:
ssh eight@192.168.1.100`

const WAYLAND_TO_X11 = `# After enabling VNC in sudo raspi-config -> Interface Options -> VNC:
# Switch from Wayland to X11, set resolution, enable X11 VNC server, and reboot:
sudo raspi-config nonint do_wayland W1 && sudo raspi-config nonint do_vnc_resolution 1920x1080 && sudo systemctl disable --now wayvnc && sudo systemctl enable vncserver-x11-serviced && sudo reboot`

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
          'The Raspberry Pi is a complete single-board Linux computer. This guide takes you from a blank microSD card through the updated Raspberry Pi Imager interface, headless configuration over SSH, switching the display server from Wayland to X11 for RealVNC compatibility, and blinking your first physical LED.',
        ),
      ]),
      heading('h2', [text('What You Will Need')]),
      list('bullet', [
        [bold('A Raspberry Pi'), text(' - Pi 3, Pi 4, or Pi 5')],
        [bold('A microSD card'), text(', 16 GB or larger (Class 10 / A1 or faster recommended)')],
        [bold('A microSD card reader'), text(' for your computer')],
        [bold('A reliable power supply'), text(' - USB-C (Pi 4/5) or micro-USB (Pi 3)')],
        [text('For headless setup: your local network connection (Wi-Fi or Ethernet cable)')],
        [text('For desktop setup (optional): monitor, micro-HDMI/HDMI cable, keyboard, and mouse')],
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 1: Download Raspberry Pi Imager')]),
      paragraph([
        text(
          'Raspberry Pi Imager is the official utility to flash Raspberry Pi OS onto your microSD card while pre-configuring network credentials and remote access.',
        ),
      ]),
      list('number', [
        [
          text('Go to '),
          bold('raspberrypi.com/software'),
          text(' and download the Imager for Windows, macOS, or Linux.'),
        ],
        [text('Install and launch Raspberry Pi Imager.')],
        [text('Insert your microSD card into your computer via a card reader.')],
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 2: Select Your Raspberry Pi Device')]),
      paragraph([
        text(
          'The updated Imager layout guides you with a left-hand navigation list: Device, OS, Storage, Customisation, Writing, and Done.',
        ),
      ]),
      list('number', [
        [
          text('Under the '),
          bold('Device'),
          text(' step, choose your Raspberry Pi model (such as '),
          bold('Raspberry Pi 4'),
          text(' or '),
          bold('Raspberry Pi 5'),
          text(').'),
        ],
        [text('Click '), bold('NEXT'), text(' at the bottom right.')],
      ]),
    ]),
    imageBlock(id('device'), 'Selecting your Raspberry Pi model in Raspberry Pi Imager'),

    textBlock([
      heading('h2', [text('Step 3: Choose Operating System')]),
      list('number', [
        [text('Under '), bold('OS'), text(', select your desired operating system.')],
        [text('Click '), bold('NEXT'), text(' to proceed.')],
      ]),
      paragraph([bold('Recommended operating systems:')]),
      list('bullet', [
        [
          bold('Raspberry Pi OS (64-bit)'),
          text(' - Recommended for Raspberry Pi 4 and 5 with standard desktop applications.'),
        ],
        [
          bold('Raspberry Pi OS (32-bit)'),
          text(
            ' - Recommended for Raspberry Pi 3 or boards where memory footprint is constrained.',
          ),
        ],
        [
          bold('Raspberry Pi OS Lite'),
          text(' - CLI-only without desktop GUI, lightweight for pure headless server roles.'),
        ],
      ]),
    ]),
    imageBlock(id('osScreen'), 'Choosing the operating system'),

    textBlock([
      heading('h2', [text('Step 4: Select Storage')]),
      list('number', [
        [
          text('Under '),
          bold('Storage'),
          text(', click on your target microSD card (e.g. SDHC Card).'),
        ],
        [
          text('Verify you selected the correct removable card drive, then click '),
          bold('NEXT'),
          text('.'),
        ],
      ]),
    ]),
    imageBlock(id('storage'), 'Selecting the microSD card storage drive'),

    textBlock([
      heading('h2', [text('Step 5: Pre-Configure Customisation Settings')]),
      paragraph([
        text(
          'The Customisation wizard pre-configures everything before writing so the Pi connects to your local network and enables SSH immediately on first boot - no external monitor or keyboard needed.',
        ),
      ]),
      heading('h3', [text('1. Choose Hostname')]),
      paragraph([
        text('Enter a unique hostname to identify your Pi on your local network (e.g. '),
        code('eight'),
        text(' or '),
        code('raspberrypi'),
        text('). Click '),
        bold('NEXT'),
        text('.'),
      ]),
    ]),
    imageBlock(id('hostname'), 'Setting the Pi hostname'),

    textBlock([
      heading('h3', [text('2. Localisation')]),
      paragraph([
        text('Select your capital city, timezone, and keyboard layout (for example: Capital city '),
        bold('New Delhi (India)'),
        text(', Time zone '),
        bold('Asia/Kolkata'),
        text(', and Keyboard layout '),
        bold('in'),
        text('). Click '),
        bold('NEXT'),
        text('.'),
      ]),
    ]),
    imageBlock(id('localisation'), 'Setting timezone and keyboard layout'),

    textBlock([
      heading('h3', [text('3. User Credentials')]),
      paragraph([
        text('Under '),
        bold('User'),
        text(', enter your preferred username (e.g. '),
        code('eight'),
        text(') and enter your chosen password twice. Click '),
        bold('NEXT'),
        text('.'),
      ]),
      heading('h3', [text('4. Wi-Fi Configuration')]),
      paragraph([
        text(
          'Enter your wireless network name (SSID) and network password so the Pi connects to your Wi-Fi automatically upon boot. Click ',
        ),
        bold('NEXT'),
        text('.'),
      ]),
    ]),
    imageBlock(id('wifi'), 'Configuring Wi-Fi network credentials'),

    textBlock([
      heading('h3', [text('5. Remote Access (SSH)')]),
      paragraph([
        text('Turn the '),
        bold('Enable SSH'),
        text(' toggle switch '),
        bold('ON'),
        text(' and select '),
        bold('Use password authentication'),
        text(
          '. This is the essential setting that gives you terminal access over the network without a monitor. Click ',
        ),
        bold('NEXT'),
        text('.'),
      ]),
    ]),
    imageBlock(id('sshSetting'), 'Enabling SSH access with password authentication'),

    textBlock([
      heading('h3', [text('6. Raspberry Pi Connect (Ignore)')]),
      paragraph([
        text('Leave the '),
        bold('Enable Raspberry Pi Connect'),
        text(
          ' toggle switch turned off / ignored. Raspberry Pi Connect requires cloud account login and is not required for direct local SSH and RealVNC remote desktop access. Click ',
        ),
        bold('NEXT'),
        text('.'),
      ]),
    ]),
    imageBlock(id('rpiConnect'), 'Raspberry Pi Connect left disabled'),

    textBlock([
      heading('h2', [text('Step 6: Write and Flash the Card')]),
      list('number', [
        [
          text('Review the choices and customisations listed on the summary screen. Click '),
          bold('WRITE'),
          text('.'),
        ],
        [
          text('An erase confirmation modal will appear: '),
          bold(
            'You are about to ERASE all data on: SDHC Card. This action is PERMANENT and CANNOT be undone.',
          ),
          text(' Click '),
          bold('I UNDERSTAND, ERASE AND WRITE'),
          text('.'),
        ],
        [text('Wait for the Imager to write the image and verify the card data.')],
        [text('Once finished, safely remove the microSD card from your computer.')],
      ]),
    ]),
    imageBlock(id('summary'), 'Reviewing the customisation summary before writing'),
    imageBlock(id('eraseWarning'), 'Confirming erase of microSD card'),
    imageBlock(id('writing'), 'Writing OS to the microSD card'),

    textBlock([
      heading('h2', [text('Step 7: First Boot and SSH Connection')]),
      paragraph([
        text(
          'Insert the flashed card into your Raspberry Pi and connect the power supply. On first boot, allow 1 to 2 minutes for the system to expand the file system, apply your settings, and join the network.',
        ),
      ]),
      paragraph([
        text('Open PowerShell, Command Prompt, or terminal on your computer and connect:'),
      ]),
    ]),
    codeBlock('bash', SSH_CONNECT, 'Connecting via SSH'),
    imageBlock(id('sshConnecting'), 'Initiating SSH connection in terminal'),
    textBlock([
      paragraph([
        text(
          'Type your password when prompted (characters will not show in the terminal while typing). Once authenticated, you will have a shell on the Pi:',
        ),
      ]),
    ]),
    imageBlock(id('sshLogin'), 'Logged into the Raspberry Pi shell over SSH'),

    textBlock([
      heading('h2', [text('Step 8: Enable VNC and Switch from Wayland to X11')]),
      paragraph([
        text(
          'Recent versions of Raspberry Pi OS use Wayland and wayvnc by default. However, RealVNC Viewer is incompatible with the default Wayland session. To use RealVNC Viewer smoothly without connection drops, we turn on VNC in raspi-config, switch the display manager to X11, disable wayvnc, and enable vncserver-x11-serviced.',
        ),
      ]),
      heading('h3', [text('Part A: Turn On VNC in raspi-config')]),
      paragraph([text('In your SSH terminal, open the Raspberry Pi configuration menu:')]),
    ]),
    codeBlock('bash', 'sudo raspi-config', 'Open configuration utility'),
    imageBlock(id('raspiInterface'), 'Navigating to Interface Options in raspi-config'),
    imageBlock(id('raspiVncOption'), 'Selecting I3 VNC'),
    imageBlock(id('vncEnable'), 'Confirming VNC Server enablement'),
    textBlock([
      list('number', [
        [text('Navigate to '), bold('3 Interface Options'), text(' and press Enter.')],
        [text('Select '), bold('I3 VNC'), text(' and press Enter.')],
        [
          text('When asked '),
          bold('Would you like the VNC Server to be enabled?'),
          text(', select '),
          bold('<Yes>'),
          text(' and press Enter.'),
        ],
        [text('Select '), bold('<Finish>'), text(' to exit raspi-config back to the shell.')],
      ]),
      heading('h3', [text('Part B: Switch to X11 Backend and Enable RealVNC Service')]),
      paragraph([
        text(
          'Run this single command in your terminal to switch from Wayland to X11, set the headless virtual resolution to 1080p, activate the X11 VNC server, and reboot:',
        ),
      ]),
    ]),
    codeBlock('bash', WAYLAND_TO_X11, 'Switch Wayland to X11, set resolution, and reboot'),
    imageBlock(id('waylandToX11'), 'Running the Wayland to X11 switch command in terminal'),
    textBlock([
      paragraph([text('What this command accomplishes:')]),
      list('bullet', [
        [
          code('do_wayland W1'),
          text(' - Switches the graphical backend from Wayland to X11 (Openbox).'),
        ],
        [
          code('do_vnc_resolution 1920x1080'),
          text(
            ' - Fixes the virtual display resolution to 1920x1080 when running headless without an HDMI display.',
          ),
        ],
        [
          code('systemctl disable --now wayvnc'),
          text(' - Stops and disables the Wayland VNC server.'),
        ],
        [
          code('systemctl enable vncserver-x11-serviced'),
          text(' - Enables the classic RealVNC service for X11.'),
        ],
      ]),
      paragraph([
        text(
          'The Pi reboots automatically. Wait 30 to 60 seconds for it to restart and reconnect to your network.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 9: Connect with RealVNC Viewer (No Sign-Up Required)')]),
      paragraph([
        text(
          'Recent RealVNC Viewer releases downloaded from realvnc.com require signing up and creating a cloud account. To skip this registration process, download the standalone installer hosted on the club Drive which allows direct local network connections without an account:',
        ),
      ]),
      paragraph([
        link(
          [bold('Download RealVNC Viewer for Windows (Club Drive, No Sign-Up)')],
          VNC_VIEWER_URL,
          {
            newTab: true,
          },
        ),
      ]),
      list('number', [
        [text('Download and launch RealVNC Viewer on your computer.')],
        [text('Click '), bold('File → New connection...'), text(' (or press Ctrl+N).')],
        [
          text('In the '),
          bold('VNC Server'),
          text(' field, enter your hostname (e.g. '),
          code('eight.local'),
          text(') or your Pi IP address. Give the connection a name and click '),
          bold('OK'),
          text('.'),
        ],
        [
          text(
            'Double-click your new connection card. Enter your Pi username and password when prompted.',
          ),
        ],
      ]),
    ]),
    imageBlock(id('vncNew'), 'Creating a new connection in RealVNC Viewer'),
    imageBlock(id('vncDetails'), 'RealVNC connection details entered'),
    imageBlock(id('vncLogin'), 'RealVNC credentials login prompt'),
    textBlock([
      paragraph([
        text(
          'The full Raspberry Pi desktop interface will open inside a window on your computer screen - completely headless without ever plugging a monitor into the Pi.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 10: Update the System')]),
      paragraph([
        text(
          'Before installing project libraries, ensure all base system packages are up to date:',
        ),
      ]),
    ]),
    codeBlock('bash', UPDATE_SYSTEM, 'Update package lists, upgrade system, and reboot'),

    textBlock([
      heading('h2', [text('First Task: Blink an LED')]),
      paragraph([
        text(
          'The 40-pin header is how the Pi interfaces with external hardware. Mind the difference between physical pin numbers and BCM GPIO numbering.',
        ),
      ]),
    ]),
    imageBlock(id('pins'), 'Raspberry Pi 40-pin GPIO layout'),
    textBlock([
      paragraph([text('Wire an LED on your breadboard:')]),
      list('bullet', [
        [code('Pin 11'), text(' (GPIO17) → 330Ω resistor → LED long leg (anode)')],
        [text('LED short leg (cathode) → '), code('Pin 9'), text(' (GND)')],
      ]),
    ]),
    imageBlock(id('led'), 'LED wired to the GPIO header', 'medium'),
    textBlock([
      paragraph([
        text('Raspberry Pi OS includes '),
        code('gpiozero'),
        text(' by default. Save this script as '),
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
        text(
          ' (light-dependent resistor) so the LED turns on automatically when ambient light drops.',
        ),
      ]),
    ]),
    imageBlock(id('ldr'), 'LDR light sensor circuit on breadboard', 'medium'),
    codeBlock('python', LDR_LIGHT, 'nightlight.py'),
    textBlock([
      paragraph([
        italic('gpiozero'),
        text(' handles the analogue RC timing - '),
        code('wait_for_dark()'),
        text(
          ' pauses execution until the light reading drops below threshold, keeping your Python loop clean.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Troubleshooting')]),
      list('bullet', [
        [
          bold('ssh: Could not resolve hostname: '),
          text(
            'mDNS (.local) resolution can be blocked by certain Wi-Fi routers. Find the IP assigned to your Pi from your router or phone hotspot, then connect with the IP (e.g. ssh user@192.168.1.100).',
          ),
        ],
        [
          bold('Connection refused on port 22: '),
          text(
            'SSH was not enabled during the Imager setup step, or the Pi has not finished booting yet. Wait 2 minutes or re-flash making sure Enable SSH is toggled ON.',
          ),
        ],
        [
          bold('RealVNC shows "Cannot currently show the desktop": '),
          text(
            'This occurs when Wayland is active instead of X11. Run the Wayland to X11 conversion command in Step 8 and reboot.',
          ),
        ],
        [
          bold('Under-voltage warning or rainbow icon: '),
          text(
            'The power supply cannot supply enough current. Pi 4 and Pi 5 require 3A and 5A supplies respectively - use official or high-current USB-C adapters.',
          ),
        ],
      ]),
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [text('Attach a Raspberry Pi Camera Module and stream low-latency video.')],
        [text('Connect I2C and SPI sensors (OLED displays, temperature sensors, gyroscopes).')],
        [
          text(
            'Check the Raspberry Pi Workshop CS sessions under Resources for full guided project builds.',
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

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'Raspberry Pi 3/4/5 Setup',
      slug: SLUG,
      description:
        'Set up a Raspberry Pi 3/4/5 from a blank card - flash Raspberry Pi OS, configure headless SSH, switch from Wayland to X11 for RealVNC remote desktop, and blink your first LED.',
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
