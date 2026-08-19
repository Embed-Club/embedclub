/**
 * Seed the "ESP32: Print a String on a 16×2 LCD" resource.
 *
 *   pnpm tsx scripts/seedEsp32LcdResource.ts
 *
 * A short reference note rather than a full tutorial - it ports the club's older
 * 16×2 LCD post (written against ESP8266 `D` pin labels) to the ESP32, where
 * those labels do not exist and the 3.3V logic level is a real constraint.
 *
 * Thumbnail uses the shared placeholder graphic. Matched on slug, so re-running
 * updates in place. Live immediately.
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
  simulatorId,
  simulatorLinkBlock,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'esp32-print-string-on-16x2-lcd'

/** Caption of the parallel-wiring code block - the simulator card anchors here. */
const WIRING_CODE_CAPTION = 'esp32Lcd.ino'

const PARALLEL = `// esp32Lcd.ino - "Hello" on a 16x2 character LCD, wired in 4-bit mode.
#include <LiquidCrystal.h>

// LiquidCrystal(rs, enable, d4, d5, d6, d7)
//
// Plain GPIO numbers. The ESP32 has no D1/D2/D4... labels - those are
// NodeMCU/ESP8266 silkscreen names, and pasting them here will not compile.
const int RS = 13, EN = 14, D4 = 27, D5 = 26, D6 = 25, D7 = 33;

LiquidCrystal lcd(RS, EN, D4, D5, D6, D7);

void setup() {
  lcd.begin(16, 2);          // 16 columns, 2 rows
  lcd.clear();

  lcd.setCursor(0, 0);       // column 0, row 0
  lcd.print("Hello!");

  lcd.setCursor(0, 1);       // row 1 is the SECOND row - rows count from 0
  lcd.print("Embed Club");
}

void loop() {
  // Nothing here. The text is already on the screen and the LCD holds it
  // without being refreshed.
}`

const I2C = `// esp32LcdI2c.ino - same output, two wires instead of six.
// Needs a PCF8574 "backpack" soldered to the LCD, and the
// LiquidCrystal_I2C library from the Library Manager.
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// 0x27 is the usual address; some backpacks are 0x3F. Run an I2C scanner
// sketch if nothing appears.
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Wire.begin(21, 22);        // ESP32 default SDA, SCL
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("Hello!");
  lcd.setCursor(0, 1);
  lcd.print("Embed Club");
}

void loop() {}`

const CONTENT = [
  textBlock([
    heading('h1', [text('ESP32: Print a String on a 16×2 LCD')], 'center'),
    paragraph([
      text(
        'A short note, ported from the club’s earlier 16×2 LCD write-up. That one was written for a NodeMCU and uses pin names like ',
      ),
      code('D1'),
      text(' and '),
      code('D4'),
      text(
        ', which do not exist on an ESP32 - the labels are ESP8266 board silkscreen, not chip pins. Here is the same thing with real GPIO numbers, plus the one hardware detail that catches people out.',
      ),
    ]),
    heading('h2', [text('What You Need')]),
    list('bullet', [
      [bold('An ESP32 dev board'), text(' (DevKit v1 or similar)')],
      [bold('A 16×2 character LCD'), text(' - the HD44780 type, with 16 pins along the top')],
      [bold('A 10 kΩ potentiometer'), text(' for contrast')],
      [text('A breadboard and jumper wires')],
    ]),
  ]),

  textBlock([
    heading('h2', [text('Wiring')]),
    paragraph([text('Six data lines, plus power and contrast:')]),
    list('bullet', [
      [code('RS'), text(' → '), bold('GPIO 13')],
      [code('E'), text(' → '), bold('GPIO 14')],
      [code('D4'), text(' → '), bold('GPIO 27')],
      [code('D5'), text(' → '), bold('GPIO 26')],
      [code('D6'), text(' → '), bold('GPIO 25')],
      [code('D7'), text(' → '), bold('GPIO 33')],
      [code('RW'), text(' → '), bold('GND'), text(' (write only - never leave it floating)')],
      [code('VSS'), text(' → GND,  '), code('VDD'), text(' → '), bold('5V (VIN)')],
      [code('V0'), text(' → the potentiometer’s middle leg; its outer legs to 5V and GND')],
      [code('A'), text(' → 5V through a 220Ω resistor,  '), code('K'), text(' → GND (backlight)')],
    ]),
    paragraph([
      bold('These GPIO choices are deliberate. '),
      text('Avoid GPIO '),
      code('0, 2, 12, 15'),
      text(
        ' - they are strapping pins and something attached to them can stop the board booting. Avoid ',
      ),
      code('34–39'),
      text(' - those are input only. And leaving '),
      code('21'),
      text(' and '),
      code('22'),
      text(' free keeps I²C available.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('The 3.3V Problem')]),
    paragraph([
      bold('The LCD wants 5V. The ESP32 speaks 3.3V. '),
      text(
        'An HD44780 running at 5V wants at least about 3.5V to register a logic high, and the ESP32 outputs 3.3V - under the threshold, on paper. In practice most modules read it fine and the display just works, which is why so many guides never mention it.',
      ),
    ]),
    paragraph([
      text(
        'If yours is unreliable - flickering, garbled characters, or working only when you touch a wire - the fix is one of:',
      ),
    ]),
    list('bullet', [
      [
        text('Run the LCD from '),
        bold('3.3V'),
        text(
          ' instead. Contrast goes weak, and turning the pot most of the way often recovers it.',
        ),
      ],
      [text('Put a '), bold('level shifter'), text(' on the six data lines.')],
      [text('Use an '), bold('I²C backpack'), text(' instead, below - fewer lines to get wrong.')],
    ]),
    paragraph([
      italic('The reverse direction is the dangerous one. '),
      text('Never feed 5V back into an ESP32 pin. Grounding '),
      code('RW'),
      text(' matters for exactly this reason: it stops the LCD ever driving the data lines at 5V.'),
    ]),
  ]),

  textBlock([heading('h2', [text('The Code')])]),
  codeBlock('cpp', PARALLEL, WIRING_CODE_CAPTION),

  textBlock([
    paragraph([
      bold('Note where the printing happens. '),
      text('The original put '),
      code('lcd.print()'),
      text(' inside '),
      code('loop()'),
      text(
        ', which reprints the same text thousands of times a second. A character LCD holds whatever was written to it until something overwrites it, so printing once in ',
      ),
      code('setup()'),
      text(
        ' gives the same display and leaves the processor free. Only put a print in loop() when the value on screen actually changes - and then clear or overwrite the old text, or leftover characters from a longer previous value stay behind.',
      ),
    ]),
    paragraph([
      code('setCursor(column, row)'),
      text(' counts from zero, so '),
      code('setCursor(0, 1)'),
      text(' is the start of the '),
      italic('second'),
      text(' row.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Two Wires Instead of Six')]),
    paragraph([
      text('If your LCD has an I²C backpack on the back - a small board with four pins marked '),
      code('GND VCC SDA SCL'),
      text(' - the wiring collapses to those four and the code changes slightly:'),
    ]),
  ]),
  codeBlock('cpp', I2C, 'esp32LcdI2c.ino'),
  textBlock([
    paragraph([
      text('Install '),
      bold('LiquidCrystal I2C'),
      text(' from the Library Manager. Power the backpack from '),
      bold('3.3V'),
      text(
        ' where you can: its pull-up resistors tie the I²C lines to whatever voltage it runs on, and at 5V those lines sit above what the ESP32 pins are rated for.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('If It Does Not Work')]),
    list('bullet', [
      [
        bold('Row of solid blocks, no text: '),
        text('the LCD has power but is not being driven. Check '),
        code('E'),
        text(' and '),
        code('RS'),
        text(', and that '),
        code('RW'),
        text(' is grounded.'),
      ],
      [
        bold('Completely blank, backlight on: '),
        text('contrast. Turn the potentiometer through its full range - with '),
        code('V0'),
        text(' unset the text is invisible even when everything else is right.'),
      ],
      [
        bold('Garbled or partial characters: '),
        text('a loose data line, or the 3.3V threshold above. Reseat the wires first.'),
      ],
      [
        bold('Board will not boot with the LCD connected: '),
        text('a data line is on a strapping pin. Move it to one of the GPIOs listed above.'),
      ],
      [
        bold('I²C version shows nothing: '),
        text('wrong address. Run an I²C scanner sketch - '),
        code('0x3F'),
        text(' is as common as '),
        code('0x27'),
        text('.'),
      ],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const tags = await ensureTagIds(payload, ['ESP32', 'Microcontroller'])
  const wokwiSim = await simulatorId(payload, 'wokwi')

  const content = insertAfterCaption(
    CONTENT,
    WIRING_CODE_CAPTION,
    simulatorLinkBlock(wokwiSim, 'Try the Wiring in Wokwi'),
  )

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: SLUG,
    data: {
      title: 'ESP32: Print a String on a 16×2 LCD',
      slug: SLUG,
      description:
        'The club’s 16×2 LCD note ported to the ESP32 - real GPIO numbers instead of NodeMCU D labels, the 3.3V logic caveat, and an I²C alternative.',
      // No LCD photo in the library yet; placeholder until one is added.
      thumbnail: placeholderId,
      difficulty: 'beginner',
      tags,
      estimatedReadTime: 8,
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
