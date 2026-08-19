/**
 * Seed the "Arduino Uno: Setup and First Sketch" tutorial.
 *
 *   pnpm tsx scripts/seedArduinoUnoTutorial.ts
 *
 * The Nano has its own tutorial rather than a section here - the boards share a
 * chip but differ in every step a beginner actually gets stuck on (connector,
 * driver, processor menu entry), and interleaving both made each path harder to
 * follow than either alone.
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

/**
 * Caption of the image that closes the "install the IDE" step. The simulator
 * card is inserted straight after it, so the download link sits where the
 * reader is being told to go and get the IDE - matched on the caption rather
 * than a hardcoded index, which would silently move as the page is edited.
 */
const IDE_STEP_MARKER = 'The Arduino IDE 2.x download page'

const SLUG = 'arduino-uno-setup-and-first-sketch'

const BLINK = `// Blink - the "hello world" of microcontrollers.
// LED_BUILTIN is the LED soldered to the board, wired to digital pin 13.

void setup() {
  // Runs once at power-on and after every reset.
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // Runs forever, immediately after setup() finishes.
  digitalWrite(LED_BUILTIN, HIGH);  // 5V on the pin - LED on
  delay(1000);                      // wait 1000 ms
  digitalWrite(LED_BUILTIN, LOW);   // 0V - LED off
  delay(1000);
}`

const EXTERNAL_LED = `// externalLed.ino - the same blink, on your own LED.
// Wiring: pin 9 -> 330 ohm resistor -> LED long leg (anode);
//         LED short leg (cathode) -> GND.

const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}`

const BUTTON = `// button.ino - press to light the LED.
// Wiring: one leg of the button -> pin 2, the other leg -> GND.
// No resistor: INPUT_PULLUP switches on the chip's internal one.

const int LED_PIN = 9;
const int BUTTON_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // Pulled up means the pin idles HIGH and reads LOW when pressed -
  // the logic looks backwards, and is correct.
  if (digitalRead(BUTTON_PIN) == LOW) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}`

const POT_FADE = `// fade.ino - a potentiometer dims the LED, and the value prints to serial.
// Wiring: pot outer legs -> 5V and GND; pot middle leg -> A0.
//         LED still on pin 9 (a PWM pin - this matters).

const int LED_PIN = 9;
const int POT_PIN = A0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(POT_PIN);         // 0-1023, a 10-bit reading
  int level = map(raw, 0, 1023, 0, 255); // analogWrite wants 0-255

  analogWrite(LED_PIN, level);

  Serial.print("pot: ");
  Serial.print(raw);
  Serial.print("  ->  pwm: ");
  Serial.println(level);

  delay(50);
}`

const CONTENT = [
  textBlock([
    heading('h1', [text('Arduino Uno: Setup and First Sketch')], 'center'),
    paragraph([
      text(
        'The Uno is the board almost everyone starts on, and it stays useful long after: 5V logic that tolerates rough wiring, a socketed chip you can replace for a few rupees, and a decade of examples written against exactly this pinout. This tutorial takes it from an unopened box to four working sketches - blink, an external LED, a button, and an analogue input driving PWM.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('An Arduino Uno'), text(' - R3, or the newer R4, and clones work fine')],
      [
        bold('A USB cable'),
        text(' - the square '),
        bold('USB-B'),
        text(' printer-style plug on R3, USB-C on R4'),
      ],
      [text('An LED and a '), bold('220–330Ω'), text(' resistor')],
      [text('A pushbutton and a 10 kΩ potentiometer')],
      [text('A breadboard and jumper wires')],
    ]),
    paragraph([
      bold('The resistor is not optional. '),
      text(
        'An LED wired straight across a 5V pin draws whatever current it can until it dies, usually taking the pin with it. 330Ω is the safe default; 220Ω is brighter and still fine.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Install the Arduino IDE')]),
    list('number', [
      [text('Download the IDE from '), bold('arduino.cc/en/software'), text('.')],
      [
        text('Install '),
        bold('Arduino IDE 2.x'),
        text(' - the current version, with autocomplete and a real debugger.'),
      ],
      [text('Open it. Uno support is built in; there is no board package to add.')],
    ]),
    paragraph([
      text('This is the one step the Uno makes easy. Unlike the ESP32 or the Pico, '),
      italic('nothing'),
      text(' has to be installed from a Boards Manager URL - AVR support ships with the IDE.'),
    ]),
  ]),
  placeholderImage(0, 'The Arduino IDE 2.x download page'),

  textBlock([
    heading('h2', [text('Step 2: Plug It In (and the Driver Question)')]),
    paragraph([
      text('Connect the board. The green '),
      code('ON'),
      text(
        ' LED lights, and a factory-loaded Blink sketch usually starts flashing straight away - that is the board working, not your code.',
      ),
    ]),
    list('bullet', [
      [
        bold('Official boards and most R3 clones: '),
        text(
          'use an ATmega16U2 or FTDI chip. Windows 10/11, macOS, and Linux all recognise them with no driver install.',
        ),
      ],
      [
        bold('Cheap clones with a CH340: '),
        text('a small square chip near the USB socket. Windows may need the '),
        code('CH341SER'),
        text(
          ' driver from wch-ic.com. macOS has shipped the driver since Ventura; Linux has it in-kernel.',
        ),
      ],
    ]),
    paragraph([
      bold('How to tell it worked: '),
      text('a new port appears - '),
      code('COM3'),
      text(' or higher on Windows, '),
      code('/dev/cu.usbserial-*'),
      text(' on macOS, '),
      code('/dev/ttyUSB0'),
      text(' or '),
      code('/dev/ttyACM0'),
      text(' on Linux.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 3: Select the Board and Port')]),
    list('number', [
      [text('Open '), bold('Tools → Board → Arduino AVR Boards → Arduino Uno'), text('.')],
      [
        text('Open '),
        bold('Tools → Port'),
        text(' and pick the port that appeared when you plugged in.'),
      ],
      [text('The board and port now show in the toolbar dropdown at the top of the window.')],
    ]),
    paragraph([
      bold('If the port list is greyed out, '),
      text(
        'the computer is not seeing the board at all. That is a cable or driver problem, not an IDE one - try a different USB cable first. Charge-only cables are extremely common and carry no data.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'The Arduino IDE with Arduino Uno selected under Tools → Board, and a COM port selected',
  ),

  textBlock([
    heading('h2', [text('Step 4: Your First Sketch - Blink')]),
    paragraph([
      text('Open '),
      bold('File → Examples → 01.Basics → Blink'),
      text(', or paste this in. It is the whole program:'),
    ]),
  ]),
  codeBlock('cpp', BLINK, 'Blink.ino'),
  textBlock([
    paragraph([
      text('Every Arduino sketch is these two functions. '),
      code('setup()'),
      text(' runs once - configure pins here. '),
      code('loop()'),
      text(
        ' runs over and over, forever, as fast as the chip can go. There is no operating system underneath and nothing else running; when loop() ends, it is called again immediately.',
      ),
    ]),
    heading('h3', [text('Upload It')]),
    list('number', [
      [text('Click the '), bold('→ arrow'), text(' (Upload) in the toolbar.')],
      [
        text('The '),
        bold('TX'),
        text(' and '),
        bold('RX'),
        text(' LEDs flicker while the sketch transfers.'),
      ],
      [text('"Done uploading" appears, and the pin-13 LED blinks once a second.')],
    ]),
    paragraph([
      text('Change the two '),
      code('delay(1000)'),
      text(' values to '),
      code('delay(100)'),
      text(' and upload again. Faster blink means the code on the board is genuinely yours.'),
    ]),
  ]),
  placeholderImage(
    0,
    'The Arduino IDE after a successful upload, showing the "Done uploading" message',
  ),

  textBlock([
    heading('h2', [text('Step 5: An LED You Wired Yourself')]),
    paragraph([text('The built-in LED proves the toolchain. Wiring your own proves the pin.')]),
    list('bullet', [
      [code('Pin 9'), text(' → 330Ω resistor → LED long leg (anode)')],
      [text('LED short leg (cathode) → '), code('GND')],
    ]),
    paragraph([
      text(
        'The long leg is positive. If the LED never lights and nothing is hot, it is almost always in backwards - an LED wired the wrong way round simply does nothing.',
      ),
    ]),
  ]),
  codeBlock('cpp', EXTERNAL_LED, 'externalLed.ino'),
  placeholderImage(
    0,
    'An LED and resistor on a breadboard wired to pin 9 and GND of an Arduino Uno',
  ),

  textBlock([
    heading('h2', [text('Step 6: Read a Button')]),
    paragraph([
      text(
        'An input needs a defined voltage at all times. A button only connects one side of the circuit, so the pin floats - and reads randomly - whenever the button is open. ',
      ),
      code('INPUT_PULLUP'),
      text(
        ' fixes that with a resistor already inside the chip, so you can wire the button with two wires and nothing else.',
      ),
    ]),
    list('bullet', [
      [text('Button leg 1 → '), code('Pin 2')],
      [text('Button leg 2 → '), code('GND')],
    ]),
  ]),
  codeBlock('cpp', BUTTON, 'button.ino'),
  textBlock([
    paragraph([
      bold('The inverted logic trips everyone once. '),
      text('Pulled up, the pin sits at 5V (HIGH) when the button is '),
      italic('not'),
      text(' pressed, and pressing it connects the pin to ground (LOW). So '),
      code('== LOW'),
      text(' means pressed.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 7: Analogue In, PWM Out')]),
    paragraph([
      text('The six '),
      code('A0–A5'),
      text(
        ' pins measure a voltage rather than just seeing on or off. Wire a potentiometer and the Uno reads its position as a number from 0 to 1023.',
      ),
    ]),
    list('bullet', [
      [text('Pot outer legs → '), code('5V'), text(' and '), code('GND')],
      [text('Pot middle leg (wiper) → '), code('A0')],
    ]),
  ]),
  codeBlock('cpp', POT_FADE, 'fade.ino'),
  textBlock([
    paragraph([
      text('Open '),
      bold('Tools → Serial Monitor'),
      text(' and set the baud to '),
      bold('9600'),
      text(' to match '),
      code('Serial.begin(9600)'),
      text(
        '. A mismatched baud rate prints garbage characters - that is the symptom to recognise, not a broken board.',
      ),
    ]),
    paragraph([
      bold('Why pin 9 and not any pin: '),
      code('analogWrite'),
      text(
        ' does not output a real analogue voltage. It switches the pin on and off very fast, and only pins ',
      ),
      code('3, 5, 6, 9, 10, 11'),
      text(' on the Uno have the hardware to do it. They are marked with a '),
      code('~'),
      text(' on the board.'),
    ]),
  ]),
  placeholderImage(0, 'The Serial Monitor printing potentiometer and PWM values as the knob turns'),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('avrdude: stk500_recv(): programmer is not responding: '),
        text('the wrong port or board is selected, or something is plugged into pins '),
        code('0'),
        text(' and '),
        code('1'),
        text(
          ' - those are the serial pins the upload itself uses. Unplug anything on them and retry.',
        ),
      ],
      [
        bold('Port greyed out or missing: '),
        text(
          'a charge-only USB cable, or a missing CH340 driver on a clone. Swap the cable before anything else.',
        ),
      ],
      [
        bold('Sketch uploads but nothing happens: '),
        text(
          'check the LED polarity and that the resistor leg actually shares a breadboard row with the LED leg. Breadboard rows run in fives, and the centre channel splits them.',
        ),
      ],
      [
        bold('"Sketch too big": '),
        text('the Uno has 32 KB of flash and only 2 KB of RAM. Long '),
        code('Serial.print'),
        text(' strings are the usual culprit - wrap them in '),
        code('F("...")'),
        text(' to keep them out of RAM.'),
      ],
      [
        bold('Board resets whenever the Serial Monitor opens: '),
        text(
          'normal and by design. Opening the port toggles the reset line, so the sketch restarts.',
        ),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [
        text(
          'Drive a servo, an ultrasonic sensor, or a 16×2 LCD - all have a stock library in the Library Manager.',
        ),
      ],
      [
        text(
          'Swap to the Arduino Nano tutorial for the same chip in a breadboard-friendly package.',
        ),
      ],
      [text('Move up to the ESP32 when a project needs Wi-Fi, more memory, or more speed.')],
      [
        text('Replace '),
        code('delay()'),
        text(' with '),
        code('millis()'),
        text(' timing so the board can do two things at once.'),
      ],
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
      title: 'Arduino Uno: Setup and First Sketch',
      slug: SLUG,
      description:
        'Take an Arduino Uno from the box to four working sketches - blink, an external LED, a button, and a potentiometer driving PWM.',
      // No Uno photo in the library yet; placeholder until one is added.
      thumbnail: placeholderId,
      difficulty: 'beginner',
      tags,
      estimatedReadTime: 20,
      badge: 'essential',
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
