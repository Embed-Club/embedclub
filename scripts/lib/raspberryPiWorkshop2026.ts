/**
 * The club's four-session Raspberry Pi Workshop CS 2026 resource.
 *
 * Implements the 2026 curriculum:
 *   Session 1: Setup & VNC (Imager, Wayland to X11, RealVNC without sign-up)
 *   Session 2: LED Control, Button Interfacing (Debounce & Pull-up), and Email Alerts
 *   Session 3: Light & Motion Sensors (LDR digital input, state change email, PIR)
 *   Session 4: Smart Home Automation & Intrusion Security Capstone
 *
 *   pnpm tsx scripts/seedRaspberryPiWorkshopCs2026.ts
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
  link,
  list,
  paragraph,
  text,
  textBlock,
  upsertLearningDoc,
} from './learningSeed'
import {
  HOME_AUTOMATION,
  LDR_LED,
  LDR_LED_EMAIL,
  LED_BLINK,
  LED_BUTTON,
  LED_BUTTON_EMAIL,
  PIR_MOTION,
} from './raspberryPiWorkshop2026Code'

const IMAGE_DIR = 'C:/Projects/EMBEDCLUB/embed-club/events-img/2025'
const VNC_VIEWER_URL =
  'https://drive.google.com/file/d/1O--Uh5XO3yt27H5vLI-paYNbCKEZ_Rw7/view?usp=sharing'

const IMAGES: Record<string, { file: string; alt: string }> = {
  pins: { file: 'RaspberryPiPins.png', alt: 'Raspberry Pi 40-pin GPIO pinout' },
  led: { file: 'RaspberryPILED.jpeg', alt: 'LED wired to the Raspberry Pi GPIO header' },
  ldr: { file: 'RaspberryPiLDR.jpeg', alt: 'LDR light sensor wired to the Raspberry Pi' },
  vnc: { file: 'RealVNCAfterInputDetails.png', alt: 'RealVNC connection details entered' },
  waylandToX11: {
    file: 'RaspberryPiWaylandToX11.png',
    alt: 'Switching display server from Wayland to X11 for RealVNC',
  },
  auto: { file: 'RaspberryPiAuto.jpeg', alt: 'The completed automation build on the bench' },
}

function buildContent(id: (key: string) => number) {
  return [
    textBlock([
      heading('h1', [text('Raspberry Pi Workshop CS 2026')], 'center'),
      paragraph([
        text(
          'The club’s four-part Raspberry Pi course for 2026. Each session progresses through real embedded systems development - beginning with headless OS setup and remote desktop, advancing through GPIO inputs, switch debouncing, and email triggers, and concluding with a complete multi-sensor smart home automation and security hub.',
        ),
      ]),
      paragraph([
        bold('Everything here runs over SSH and remote desktop. '),
        text('You do not need a monitor attached to the Raspberry Pi at any point.'),
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
                  'The first session covers initial system preparation: flashing Raspberry Pi OS with the updated Imager wizard, setting up headless credentials and Wi-Fi, switching from Wayland to X11, and connecting via RealVNC.',
                ),
              ]),
              paragraph([
                bold('The full visual guide is documented in the '),
                link(
                  [bold('Raspberry Pi 3/4/5 Setup tutorial')],
                  '/tutorials/raspberry-pi-345-setup',
                ),
                bold('. '),
                text(
                  'Work through that tutorial for detailed screenshots; the summary below outlines the essential steps.',
                ),
              ]),
              heading('h3', [text('The short version')]),
              list('number', [
                [
                  text('Launch Raspberry Pi Imager. Under '),
                  bold('Device'),
                  text(', select '),
                  bold('Raspberry Pi 4'),
                  text('. Under '),
                  bold('OS'),
                  text(', select '),
                  bold('Raspberry Pi OS (64-bit)'),
                  text('. Under '),
                  bold('Storage'),
                  text(', select your microSD card.'),
                ],
                [
                  text('In Customisation: configure '),
                  bold('Hostname'),
                  text(' (e.g. '),
                  code('eight'),
                  text('), '),
                  bold('Localisation'),
                  text(' (timezone & keyboard), '),
                  bold('User'),
                  text(' credentials, and '),
                  bold('Wi-Fi'),
                  text(' SSID and password.'),
                ],
                [
                  text('Under Services: toggle on '),
                  bold('Enable SSH'),
                  text(' with password authentication. Leave Raspberry Pi Connect ignored.'),
                ],
                [
                  text(
                    'Write the image, insert into your Pi 4, power on, and connect over terminal: ',
                  ),
                  code('ssh eight@eight.local'),
                  text(' (or by local IP).'),
                ],
                [
                  text('Enable VNC: run '),
                  code('sudo raspi-config'),
                  text(' → '),
                  bold('Interface Options'),
                  text(' → '),
                  bold('VNC'),
                  text(' → choose '),
                  bold('Yes'),
                  text(', then Finish.'),
                ],
                [
                  text(
                    'Switch from Wayland to X11 for RealVNC compatibility, fix headless virtual resolution to 1080p, enable X11 VNC server service, and reboot:',
                  ),
                ],
              ]),
            ]),
            codeBlock(
              'bash',
              'sudo raspi-config nonint do_wayland W1 && sudo raspi-config nonint do_vnc_resolution 1920x1080 && sudo systemctl disable --now wayvnc && sudo systemctl enable vncserver-x11-serviced && sudo reboot',
              'Switch Wayland to X11, fix resolution, enable VNC service, and reboot',
            ),
            imageBlock(id('waylandToX11'), 'Running the Wayland to X11 switch command in terminal'),
            textBlock([
              paragraph([
                text('Connect using RealVNC Viewer to '),
                code('eight.local'),
                text(' (or the Pi IP). '),
                link(
                  [bold('Download RealVNC Viewer for Windows (Club Drive, No Sign-Up)')],
                  VNC_VIEWER_URL,
                  { newTab: true },
                ),
                text(' to skip the account creation and login prompt.'),
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
            summary: 'Imager, headless SSH, Wayland to X11 conversion, and RealVNC remote desktop',
            defaultOpen: true,
          },
        ),

        accordionItem(
          'Session 2 - LED Control & Button Interfacing',
          [
            textBlock([
              paragraph([
                text(
                  'The second session introduces hardware control with Python’s gpiozero library. We progress from basic LED toggling to push button input with switch debouncing, and then add email alerts over SMTP.',
                ),
              ]),
              heading('h3', [text('Hardware Wiring')]),
              list('bullet', [
                [
                  bold('LED: '),
                  code('Pin 11'),
                  text(
                    ' (GPIO17) → 330Ω current-limiting resistor → LED long leg (anode). LED short leg (cathode) → ',
                  ),
                  code('Pin 9'),
                  text(' (GND).'),
                ],
                [
                  bold('Push Button: '),
                  text('One terminal connects to '),
                  code('Pin 13'),
                  text(' (GPIO27). The other terminal connects to '),
                  code('Pin 14'),
                  text(' (GND).'),
                ],
              ]),
              heading('h3', [text('Important: Button Wiring and Contact Bounce')]),
              paragraph([
                bold('1. Internal Pull-up: '),
                code('gpiozero.Button'),
                text(
                  ' enables the Raspberry Pi internal pull-up resistor by default. The input pin sits at 3.3V (HIGH) when open and is pulled to GND (LOW) when the button is pressed. One leg must go to GPIO27 and the other to GND. If connected to 3.3V, it will never register a press.',
                ),
              ]),
              paragraph([
                bold('2. Contact Debounce: '),
                text(
                  'Mechanical push buttons experience switch bounce - microscopic contact vibrations during closure that can register two or three presses in milliseconds. We pass ',
                ),
                code('bounce_time=0.1'),
                text(' (100ms filter) so each physical press registers exactly once.'),
              ]),
            ]),
            imageBlock(id('pins'), 'Raspberry Pi 40-pin GPIO pinout'),
            imageBlock(id('led'), 'LED wired to GPIO header on breadboard', 'medium'),
            textBlock([
              heading('h3', [text('Program 1: LED Blinking')]),
              paragraph([
                text('Save as '),
                code('blink.py'),
                text(' and run with '),
                code('python blink.py'),
                text('. Press Ctrl+C to exit safely:'),
              ]),
            ]),
            codeBlock('python', LED_BLINK, 'blink.py - Basic LED toggle'),
            textBlock([
              heading('h3', [text('Program 2: LED Button Control')]),
              paragraph([
                text(
                  'Pressing the momentary button toggles the LED state between ON and OFF using an asynchronous event callback: ',
                ),
                code('button.when_pressed = toggle_led'),
                text('.'),
              ]),
            ]),
            codeBlock('python', LED_BUTTON, 'buttonLed.py - Push button toggle with debounce'),
            textBlock([
              heading('h3', [text('Program 3: LED Button Control + Email Alerts')]),
              paragraph([
                text(
                  'Every time the button toggles the LED, the Raspberry Pi connects to Gmail’s SMTP server over SSL (port 465) and dispatches an email notification. Replace ',
                ),
                code('yourgmail@gmail.com'),
                text(' and '),
                code('YOUR_APP_PASSWORD'),
                text(' with your Google Account App Password.'),
              ]),
            ]),
            codeBlock(
              'python',
              LED_BUTTON_EMAIL,
              'buttonEmail.py - Button toggle with Gmail alert',
            ),
          ],
          {
            summary: 'LED blinking, push button toggle, contact debouncing, and Gmail SMTP alerts',
          },
        ),

        accordionItem(
          'Session 3 - Light & Motion Sensors (LDR & PIR)',
          [
            textBlock([
              paragraph([
                text(
                  'Session 3 moves from user inputs to autonomous environmental sensing. We use a digital LDR module to sense ambient illumination and a PIR sensor to detect human movement.',
                ),
              ]),
              heading('h3', [text('Sensor Hardware Connections')]),
              list('bullet', [
                [
                  bold('LDR Module: '),
                  text('Connect '),
                  code('VCC'),
                  text(' → 3.3V (Pin 1), '),
                  code('GND'),
                  text(' → GND (Pin 6), and digital output '),
                  code('DO'),
                  text(' → '),
                  code('Pin 12'),
                  text(' (GPIO18).'),
                ],
                [
                  bold('PIR Motion Sensor: '),
                  text('Connect '),
                  code('VCC'),
                  text(' → 5V (Pin 2), '),
                  code('GND'),
                  text(' → GND (Pin 20), and signal output '),
                  code('OUT'),
                  text(' → '),
                  code('Pin 16'),
                  text(' (GPIO23).'),
                ],
              ]),
              paragraph([
                bold('Adjusting the LDR threshold: '),
                text(
                  'The blue potentiometer on the LDR module sets the trigger threshold in hardware. Turn the screw until the sensor digital output flips (value 1 in darkness, 0 in daylight).',
                ),
              ]),
            ]),
            imageBlock(id('ldr'), 'LDR light sensor module on breadboard', 'medium'),
            textBlock([
              heading('h3', [text('Program 4: LDR + LED Automatic Night Light')]),
              paragraph([
                text(
                  'The Raspberry Pi reads the digital output using DigitalInputDevice(18). When dark (value 1), the LED lights up; in daylight (value 0), it shuts off:',
                ),
              ]),
            ]),
            codeBlock('python', LDR_LED, 'ldrLed.py - Day and Night automatic LED lighting'),
            textBlock([
              heading('h3', [text('Program 5: LDR + LED + Email on State Change')]),
              paragraph([
                text(
                  'To avoid flooding your inbox with continuous emails in a loop, this script tracks ',
                ),
                code('previous_state'),
                text(
                  ' and only triggers an email alert when the environment transitions between Day and Night.',
                ),
              ]),
            ]),
            codeBlock(
              'python',
              LDR_LED_EMAIL,
              'ldrEmail.py - State change transition email notification',
            ),
            textBlock([
              heading('h3', [text('Program 6: PIR Motion Sensor')]),
              paragraph([
                text('The passive infrared (PIR) sensor triggers '),
                code('when_motion'),
                text(' and '),
                code('when_no_motion'),
                text(' callbacks when infrared signatures move across its field of view:'),
              ]),
            ]),
            codeBlock('python', PIR_MOTION, 'pirMotion.py - PIR motion detection'),
          ],
          {
            summary:
              'Digital LDR sensor, transition state tracking, and PIR motion detection callbacks',
          },
        ),

        accordionItem(
          'Session 4 - Smart Home Automation & Security Hub',
          [
            textBlock([
              paragraph([
                text(
                  'The capstone project combines all sensors and actuators into an integrated, dual-mode Smart Home Automation and Intrusion Security System.',
                ),
              ]),
              heading('h3', [text('Complete Hardware Pin Assignment')]),
              list('bullet', [
                [bold('LED (Lighting): '), code('Pin 11'), text(' (GPIO17)')],
                [bold('Button (Manual Override): '), code('Pin 13'), text(' (GPIO27), debounced')],
                [bold('LDR Module (Day/Night Sensing): '), code('Pin 12'), text(' (GPIO18)')],
                [
                  bold('PIR Motion Sensor (Intrusion Detection): '),
                  code('Pin 16'),
                  text(' (GPIO23)'),
                ],
                [
                  bold('Active Buzzer (Audible Alarm): '),
                  code('Pin 18'),
                  text(' (GPIO24). '),
                  bold('Note: '),
                  text('The buzzer is '),
                  bold('active-low'),
                  text(' (sounds when pulled to 0V/GND), so it is initialized with '),
                  code('Buzzer(BUZZER_PIN, active_high=False)'),
                  text('.'),
                ],
              ]),
              heading('h3', [text('System Behavior & Operating Modes')]),
              list('bullet', [
                [
                  bold('Day Mode (LDR = 0): '),
                  text(
                    'Default LED is OFF. The manual button can toggle the LED at will (sending an email confirmation). The PIR motion sensor is ignored, and the buzzer is kept silent.',
                  ),
                ],
                [
                  bold('Night Mode (LDR = 1): '),
                  text(
                    'Default LED turns ON automatically. The manual button can still toggle the LED. Security is armed: PIR motion detection is ACTIVE. Any movement triggers the buzzer alarm immediately and dispatches an emergency intrusion alert email.',
                  ),
                ],
                [
                  bold('Safe Teardown: '),
                  text(
                    'Pressing Ctrl+C shuts down all peripherals and cleans up all five GPIO pins gracefully.',
                  ),
                ],
              ]),
            ]),
            imageBlock(id('auto'), 'The completed automation build on the bench', 'medium'),
            codeBlock('python', HOME_AUTOMATION, 'homeAutomation.py - Full Smart Home System'),
            textBlock([
              heading('h3', [text('Troubleshooting & Tips')]),
              list('bullet', [
                [
                  bold('Button registers twice: '),
                  text('Ensure '),
                  code('bounce_time=0.1'),
                  text(' is set on '),
                  code('Button(27, bounce_time=0.1)'),
                  text('.'),
                ],
                [
                  bold('Buzzer sounds continuously: '),
                  text('The buzzer module is active-low. Confirm '),
                  code('active_high=False'),
                  text(' is specified when creating the Buzzer instance.'),
                ],
                [
                  bold('SMTPAuthenticationError: '),
                  text(
                    'Google accounts require a dedicated 16-character App Password when 2-Factor Authentication is enabled, not your normal account password.',
                  ),
                ],
              ]),
            ]),
          ],
          {
            summary:
              'Full multi-sensor capstone: Day/Night lighting, manual override, PIR security, active-low buzzer, and email alerts',
          },
        ),
      ],
      'Workshop Sessions',
    ),

    textBlock([
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [
          text(
            'Deploy your script as a systemd background service so it starts automatically on boot.',
          ),
        ],
        [
          text(
            'Log sensor events and temperature readings to a local SQLite database or MQTT broker.',
          ),
        ],
        [text('Check the 2025 Workshop sessions for building a web dashboard with Django.')],
      ]),
    ]),
  ]
}

export async function seedRaspberryPiWorkshop2026() {
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

  const tags = await ensureTagIds(payload, ['Raspberry', 'Python', 'IoT', 'Automation'])

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: 'raspberry-pi-workshop-cs-2026',
    data: {
      title: 'Raspberry Pi Workshop CS 2026',
      slug: 'raspberry-pi-workshop-cs-2026',
      description:
        'The club’s 2026 four-part Raspberry Pi course - headless setup, switch debouncing, email alerts, LDR and PIR sensors, and an integrated smart home security capstone.',
      thumbnail: id('auto'),
      difficulty: 'intermediate',
      tags,
      estimatedReadTime: 35,
      badge: 'featured',
      content: buildContent(id),
    },
  })
}
