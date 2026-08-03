/**
 * Seed the "Arduino Nano: Setup and First Sketch" tutorial.
 *
 *   pnpm tsx scripts/seedArduinoNanoTutorial.ts
 *
 * Deliberately not folded into the Uno tutorial. The two boards run the same
 * chip, but every step a beginner actually loses an evening to is different —
 * the CH340 driver, the Old Bootloader processor entry, and the two analogue-only
 * pins the Uno does not have. This page covers those and links across for the
 * parts that genuinely are identical.
 *
 * Screenshot slots and the thumbnail use the shared placeholder graphic with a
 * caption naming the real image that belongs there. Matched on slug, so
 * re-running updates in place. Live immediately.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  codeBlock,
  ensurePlaceholderMedia,
  ensureTagIds,
  flushExit,
  heading,
  insertAfterCaption,
  italic,
  list,
  paragraph,
  placeholderImage,
  simulatorId,
  simulatorLinkBlock,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'arduino-nano-setup-and-first-sketch'

/** Caption of the image closing the IDE/driver step; the IDE card follows it. */
const IDE_STEP_MARKER = 'An Arduino Nano seated across the centre channel'

const BLINK = `// Blink — pin 13 again, but on the Nano the LED sits right next to the
// "L" silkscreen on the board.

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`

const LDR_NIGHTLIGHT = `// nightlight.ino — an LDR on A6 turns the LED on when the room goes dark.
//
// A6 and A7 exist on the Nano and not on the Uno. They are analogue INPUT
// ONLY: digitalRead, digitalWrite and pinMode do nothing on them. Reading
// them with analogRead is the only thing they do, and that is all we need.
//
// Wiring: 5V -> LDR -> A6, and A6 -> 10k resistor -> GND.
//         (a voltage divider: the junction is what A6 measures)
//         LED on pin 9 -> 330 ohm resistor -> GND, as usual.

const int LDR_PIN = A6;
const int LED_PIN = 9;
const int DARK_THRESHOLD = 400;  // tune this to your room, see below

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(LDR_PIN);   // 0 = dark, 1023 = bright
  Serial.println(light);

  if (light < DARK_THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(100);
}`

const CONTENT = [
  textBlock([
    heading('h1', [text('Arduino Nano: Setup and First Sketch')], 'center'),
    paragraph([
      text(
        'The Nano is an Uno that fits on a breadboard. Same ATmega328P, same 5V logic, same code — but the pins are headers you can push straight into a board, which makes it the one to reach for once a project stops being jumper wires and starts being a circuit. It also has two analogue pins the Uno does not, and one settings trap that stops most first uploads.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('An Arduino Nano'), text(' — official, or one of the very common clones')],
      [
        bold('The right USB cable: '),
        text('official Nanos and older clones use '),
        bold('mini-USB'),
        text('; newer clones use '),
        bold('micro-USB'),
        text('. Check the socket before ordering one.'),
      ],
      [text('An LED and a '), bold('220–330Ω'), text(' resistor')],
      [text('An LDR (light-dependent resistor) and a '), bold('10 kΩ'), text(' resistor')],
      [text('A breadboard and jumper wires')],
    ]),
    paragraph([
      bold('On clones: '),
      text(
        'the Nano is the most cloned Arduino there is, and the clones are fine. What differs is the USB chip — a CH340 instead of an FTDI — and the bootloader, which is what Step 3 is about.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Install the IDE and the CH340 Driver')]),
    list('number', [
      [
        text('Install '),
        bold('Arduino IDE 2.x'),
        text(' from arduino.cc. Nano support is built in — no board package to add.'),
      ],
      [text('Plug the Nano in. The red power LED comes on immediately.')],
      [
        text('Check for a new port under '),
        bold('Tools → Port'),
        text('. If one appeared, skip to Step 2.'),
      ],
    ]),
    paragraph([
      text('If no port appeared, the board has a '),
      bold('CH340'),
      text(' USB chip and Windows needs its driver. Install '),
      code('CH341SER'),
      text(
        ' from wch-ic.com, then unplug and re-plug the board. macOS has included the driver since Ventura; on Linux it is already in the kernel.',
      ),
    ]),
    paragraph([
      bold('Before blaming the driver, swap the cable. '),
      text(
        'Mini-USB cables in particular are often charge-only, with no data lines connected at all. A board that powers up but never enumerates is far more often a cable than a driver.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'An Arduino Nano seated across the centre channel of a breadboard, connected by USB',
  ),

  textBlock([
    heading('h2', [text('Step 2: Select the Board and Port')]),
    list('number', [
      [text('Open '), bold('Tools → Board → Arduino AVR Boards → Arduino Nano'), text('.')],
      [text('Open '), bold('Tools → Port'), text(' and select the port.')],
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 3: The Processor Setting — Read This One')]),
    paragraph([
      text('Open '),
      bold('Tools → Processor'),
      text('. There are two entries that look almost the same:'),
    ]),
    list('bullet', [
      [code('ATmega328P'), text(' — official Nanos and recent clones')],
      [
        code('ATmega328P (Old Bootloader)'),
        text(' — most cheap clones, and anything bought as a multi-pack'),
      ],
    ]),
    paragraph([
      bold('Pick the wrong one and the upload fails with '),
      code('avrdude: stk500_recv(): programmer is not responding'),
      text(
        ' — the same message you get from a wrong port, which is why this costs people so much time. The board is fine, the port is fine; the IDE is simply talking at the wrong speed for the bootloader burned into that chip.',
      ),
    ]),
    paragraph([
      italic(
        'If the first upload fails, change this setting to the other option and try again before changing anything else.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'The Tools → Processor menu open, showing ATmega328P and ATmega328P (Old Bootloader)',
  ),

  textBlock([
    heading('h2', [text('Step 4: Upload Blink')]),
    paragraph([
      text('Open '),
      bold('File → Examples → 01.Basics → Blink'),
      text(' and click Upload. The '),
      bold('L'),
      text(' LED beside the pin-13 header starts flashing once a second.'),
    ]),
  ]),
  codeBlock('cpp', BLINK, 'Blink.ino'),
  textBlock([
    paragraph([
      text(
        'Everything from here is identical to the Uno — same functions, same pin numbers, same libraries. If you have not written an Arduino sketch before, the ',
      ),
      bold('Arduino Uno tutorial'),
      text(' walks through '),
      code('setup()'),
      text(', '),
      code('loop()'),
      text(', buttons and PWM in more detail, and all of it applies unchanged here.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 5: Use a Pin the Uno Does Not Have')]),
    paragraph([
      text('The Nano exposes '),
      code('A6'),
      text(' and '),
      code('A7'),
      text(
        ', two extra analogue channels. They are worth knowing about because they come with a restriction: they are wired straight to the ADC and have no digital hardware behind them at all.',
      ),
    ]),
    list('bullet', [
      [code('analogRead(A6)'), text(' — works')],
      [
        code('digitalRead(A6)'),
        text(', '),
        code('digitalWrite(A6)'),
        text(', '),
        code('pinMode(A6, ...)'),
        text(' — silently do nothing'),
      ],
    ]),
    paragraph([
      text(
        'So they are perfect for sensors and useless for buttons. Here is a light sensor on one, wired as a voltage divider:',
      ),
    ]),
    list('bullet', [
      [code('5V'), text(' → LDR → '), code('A6')],
      [code('A6'), text(' → 10 kΩ resistor → '), code('GND')],
      [code('Pin 9'), text(' → 330Ω resistor → LED anode; LED cathode → '), code('GND')],
    ]),
  ]),
  codeBlock('cpp', LDR_NIGHTLIGHT, 'nightlight.ino'),
  textBlock([
    paragraph([
      bold('Tune the threshold rather than trusting 400. '),
      text('Open the '),
      bold('Serial Monitor'),
      text(
        ' at 9600, watch the numbers with the room lit and then with your hand over the sensor, and pick a value between the two. Every LDR and every room reads differently, so a hardcoded threshold copied from anywhere else is a guess.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'An LDR voltage divider on a breadboard feeding A6 on the Nano, with the LED lit',
  ),

  textBlock([
    heading('h2', [text('Powering It Without USB')]),
    paragraph([text('Once a project leaves the desk, the Nano takes power two ways:')]),
    list('bullet', [
      [
        code('VIN'),
        text(
          ' — 7V to 12V from a battery or adapter, through the on-board regulator. Use this one.',
        ),
      ],
      [
        code('5V'),
        text(
          ' — bypasses the regulator entirely. Only for a supply that is already a clean regulated 5V; anything higher destroys the chip instantly.',
        ),
      ],
    ]),
    paragraph([
      text(
        '9V is the comfortable choice for VIN. A 12V supply works but the linear regulator turns the difference into heat, and the board gets genuinely hot.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('stk500_recv(): programmer is not responding: '),
        text('switch '),
        bold('Tools → Processor'),
        text(' between '),
        code('ATmega328P'),
        text(' and '),
        code('ATmega328P (Old Bootloader)'),
        text('. This is the fix roughly nine times out of ten.'),
      ],
      [
        bold('No port at all: '),
        text(
          'charge-only cable, or the missing CH340 driver. Try another cable first — it is the cheaper test.',
        ),
      ],
      [
        bold('digitalWrite on A6 or A7 does nothing: '),
        text(
          'working as designed. Those pins are analogue input only; move the output to any of D2–D13.',
        ),
      ],
      [
        bold('Board gets hot, or the power LED is dim: '),
        text('something is feeding the '),
        code('5V'),
        text(
          ' pin more than 5V, or a short across the breadboard. Unplug it now and check the rails before anything else.',
        ),
      ],
      [
        bold('Uploads work but the sketch behaves oddly after a reset: '),
        text(
          'a clone with a marginal regulator browning out. Power it from USB or a proper supply rather than another board’s 5V pin.',
        ),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [
        text(
          'Read the Arduino Uno tutorial for buttons, PWM and the serial monitor in more depth — all of it runs unchanged on the Nano.',
        ),
      ],
      [
        text(
          'Solder the Nano onto a perfboard to turn a breadboard prototype into something that survives being moved.',
        ),
      ],
      [text('Add an nRF24L01 or HC-05 module to give it radio or Bluetooth.')],
      [text('Step up to the ESP32 when the project needs Wi-Fi or more than 2 KB of RAM.')],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const tags = await ensureTagIds(payload, ['Arduino', 'Microcontroller'])
  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')

  const content = insertAfterCaption(
    CONTENT.map((block) =>
      block.blockType === 'imageBlock' ? { ...block, image: placeholderId } : block,
    ),
    IDE_STEP_MARKER,
    simulatorLinkBlock(arduinoIdeSim, 'Download the Arduino IDE'),
  )

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'Arduino Nano: Setup and First Sketch',
      slug: SLUG,
      description:
        'Set up an Arduino Nano — CH340 driver, the Old Bootloader trap that breaks most first uploads, and a light sensor on the analogue-only A6 pin.',
      // No Nano photo in the library yet; placeholder until one is added.
      thumbnail: placeholderId,
      difficulty: 'beginner',
      tags,
      estimatedReadTime: 18,
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
