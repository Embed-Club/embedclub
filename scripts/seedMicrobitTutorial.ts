/**
 * Seed the "BBC micro:bit: Setup and First Programs" tutorial.
 *
 * Authored here rather than clicked into the admin, so it is reviewable in a
 * diff and re-runnable - re-running updates the existing document (matched on
 * slug). Targets the same Neon instance production uses, so it is live at once.
 *
 *   pnpm tsx scripts/seedMicrobitTutorial.ts
 *
 * Image slots use a shared placeholder graphic with a caption naming the real
 * screenshot that belongs there; the thumbnail reuses an existing micro:bit
 * media doc. Swap both in the admin later.
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

const SLUG = 'microbit-setup-and-first-programs'
/** Existing micro:bit image (Microbit.webp) reused as a temporary thumbnail. */
const THUMBNAIL_MEDIA_ID = 10

const PY_SCROLL = `# python.microbit.org - the classic first program.
from microbit import *

while True:
    display.scroll("Hello, Embed Club!")
    display.show(Image.HEART)
    sleep(500)`

const PY_BUTTON = `from microbit import *

count = 0
while True:
    if button_a.was_pressed():
        count += 1
        display.scroll(count)
    if button_b.was_pressed():
        count = 0
        display.show(Image.SQUARE)`

const JS_MAKECODE = `// The blocks you drag in MakeCode are JavaScript underneath. Click the
// "JavaScript" tab in the editor to see this - useful for sharing code as text.
input.onButtonPressed(Button.A, function () {
    basic.showString("A")
})
basic.forever(function () {
    basic.showIcon(IconNames.Heart)
    basic.pause(500)
    basic.clearScreen()
    basic.pause(500)
})`

const CONTENT = [
  textBlock([
    heading('h1', [text('BBC micro:bit: Setup and First Programs')], 'center'),
    paragraph([
      text(
        'The micro:bit is a pocket-sized computer built for learning. It has a 5×5 LED display, two buttons, motion and sound sensors, and radio - all programmable from a web browser with no install. This tutorial gets you from an unboxed board to your own scrolling-text and button programs, using both drag-and-drop blocks and written code.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('A micro:bit'), text(' - v1 or v2; v2 adds a microphone, speaker, and touch logo')],
      [bold('A micro-USB cable'), text(' that carries data, not a charge-only cable')],
      [text('A computer (Windows, macOS, Linux, Chromebook) - or an Android/iOS device')],
      [text('Optional: a battery pack (2×AAA) to run the board untethered')],
    ]),
    paragraph([
      bold('On the cable: '),
      text(
        'the single most common first snag is a charge-only USB cable. It powers the board - the LED lights - but the computer never sees the MICROBIT drive, so there is nothing to copy a program to. If the drive does not appear, suspect the cable before anything else.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Meet the Board')]),
    paragraph([text('The parts you will use most, front and back:')]),
    list('bullet', [
      [bold('25 red LEDs'), text(' in a 5×5 grid - the display, for text, numbers and icons')],
      [bold('Buttons A and B'), text(' either side of the display, plus a touch logo on v2')],
      [bold('Accelerometer'), text(' - detects tilt, shake, and freefall')],
      [bold('Compass (magnetometer)'), text(' - heading and magnetic field strength')],
      [bold('Temperature sensor'), text(' - reads the chip temperature, close to room temp')],
      [bold('Microphone and speaker'), text(' (v2 only) - sound level in, tones out')],
      [bold('Radio and Bluetooth'), text(' - talk to other micro:bits, or to a phone')],
      [bold('Edge connector'), text(' - the gold pins along the bottom for crocodile clips')],
      [bold('USB port and reset button'), text(' on the back, with a yellow status LED')],
    ]),
  ]),

  textBlock([
    heading('h2', [text('Two Ways to Program It')]),
    paragraph([text('There are two official editors, and this tutorial covers both:')]),
    list('bullet', [
      [
        bold('MakeCode'),
        text(' - drag-and-drop coloured blocks in the browser. Best for starting out.'),
      ],
      [bold('Python'), text(' - write MicroPython in the browser. Best once you want real code.')],
    ]),
    paragraph([
      text('Both run in the browser, both produce a '),
      code('.hex'),
      text(' file, and both flash the same way. Pick either; the board does not care.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Path A - Drag and Drop with MakeCode')]),
    list('number', [
      [text('Open '), bold('makecode.microbit.org'), text(' in Chrome or Edge.')],
      [
        text('Click '),
        bold('New Project'),
        text(', give it a name, and '),
        bold('Create'),
        text('.'),
      ],
      [
        text('From the '),
        bold('Basic'),
        text(' category, drag a '),
        code('show string'),
        text(' block into the '),
        code('on start'),
        text(' block and type your message.'),
      ],
      [
        text('Drag a '),
        code('show icon'),
        text(' block into '),
        code('forever'),
        text(' to loop an image.'),
      ],
    ]),
  ]),
  placeholderImage(
    0,
    'The MakeCode editor - the block palette on the left, workspace in the middle, and micro:bit simulator on the left edge',
  ),
  textBlock([
    paragraph([
      text('The '),
      bold('simulator'),
      text(
        ' on the left runs your program instantly, so you can test before touching hardware. When it looks right, flash it to the board:',
      ),
    ]),
    list('number', [
      [
        text('Plug the micro:bit into USB. On Chrome/Edge, click '),
        bold('Download'),
        text(' → '),
        bold('Connect'),
        text(' and pick the micro:bit to flash directly (WebUSB).'),
      ],
      [
        text('Otherwise, '),
        bold('Download'),
        text(' saves a '),
        code('.hex'),
        text(' file - drag that onto the '),
        bold('MICROBIT'),
        text(' drive (next section).'),
      ],
    ]),
    paragraph([
      text('You can also read the blocks as text: click the '),
      bold('JavaScript'),
      text(' tab at the top. The same program looks like this.'),
    ]),
  ]),
  codeBlock('javascript', JS_MAKECODE, 'MakeCode - the JavaScript behind the blocks'),

  textBlock([
    heading('h2', [text('Flashing by Drag and Drop')]),
    paragraph([
      text('When you plug in the micro:bit, it appears as a USB drive called '),
      bold('MICROBIT'),
      text(' - exactly like a flash drive. Flashing a program is literally copying the '),
      code('.hex'),
      text(' file onto that drive:'),
    ]),
    list('number', [
      [text('Find the downloaded '), code('.hex'), text(' file (usually your Downloads folder).')],
      [text('Drag it onto the '), bold('MICROBIT'), text(' drive, or copy-paste it there.')],
      [text('The yellow LED on the back blinks while it flashes, then the program runs.')],
      [text('The file vanishes from the drive afterwards - that is normal, not an error.')],
    ]),
  ]),
  placeholderImage(
    0,
    'A file manager showing the MICROBIT drive with a .hex file being dropped onto it',
  ),
  textBlock([
    paragraph([
      bold('Why the file disappears: '),
      text(
        'the MICROBIT drive is not real storage. It is a flashing interface - dropping a hex there tells the on-board chip to program the micro:bit, and the "drive" resets. Nothing is lost.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Path B - Writing Code with Python')]),
    list('number', [
      [text('Open '), bold('python.microbit.org'), text('.')],
      [text('The editor opens with a starter program. Replace it with your own.')],
      [
        text('Every program starts with '),
        code('from microbit import *'),
        text(' - that line gives you '),
        code('display'),
        text(', '),
        code('button_a'),
        text(', and the rest.'),
      ],
    ]),
  ]),
  placeholderImage(
    0,
    'The Python editor at python.microbit.org - code on the left, simulator and reference on the right',
  ),
  textBlock([paragraph([text('A first program - scroll a message, then show a heart, forever:')])]),
  codeBlock('python', PY_SCROLL, 'main.py - scrolling text and an icon'),
  textBlock([
    paragraph([
      text('Flash it the same two ways as MakeCode: click '),
      bold('Send to micro:bit'),
      text(' (WebUSB, on Chrome/Edge) to flash directly, or '),
      bold('Save'),
      text(' to download a '),
      code('.hex'),
      text(' and drag it onto the MICROBIT drive.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('First Real Program - Count Button Presses')]),
    paragraph([
      text('Buttons make it interactive. This counts presses of '),
      bold('A'),
      text(' and resets on '),
      bold('B'),
      text(':'),
    ]),
  ]),
  codeBlock('python', PY_BUTTON, 'main.py - button A counts up, button B resets'),
  textBlock([
    paragraph([
      text('Note '),
      code('was_pressed()'),
      text(' rather than '),
      code('is_pressed()'),
      text('. '),
      italic('was_pressed'),
      text(' returns true once per press and then clears, so a single tap counts once; '),
      italic('is_pressed'),
      text(' is true for the whole time you hold it, which would count hundreds of times.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Programming from a Phone')]),
    paragraph([
      text('No computer? The '),
      bold('micro:bit app'),
      text(
        ' (Android and iOS) flashes over Bluetooth. Install it, pair the board once (hold A + B while pressing reset to enter pairing mode), then send programs wirelessly from MakeCode in the app.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('No MICROBIT drive appears: '),
        text(
          'charge-only cable, or a USB hub in the way. Use a data cable straight into the computer.',
        ),
      ],
      [
        bold('Flashing does nothing / drive shows FAIL.TXT: '),
        text(
          'the firmware is out of date. Open FAIL.TXT for the reason, then update the interface firmware from microbit.org.',
        ),
      ],
      [
        bold('"Send to micro:bit" is greyed out: '),
        text(
          'WebUSB needs Chrome or Edge. Safari and Firefox cannot flash directly - download the hex and drag it instead.',
        ),
      ],
      [
        bold('Program runs once then stops: '),
        text('it has no loop. Wrap repeating logic in '),
        code('while True:'),
        text(' (Python) or '),
        code('forever'),
        text(' (MakeCode).'),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [text('Send messages between two micro:bits with the '), code('radio'), text(' module.')],
      [text('React to shake and tilt using the accelerometer.')],
      [text('Clip sensors and motors to the edge connector with crocodile clips.')],
      [text('Move from MakeCode to Python to get comfortable with written code.')],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)

  // Fill every placeholder slot with the shared graphic now that its id exists.
  const content = CONTENT.map((block) =>
    block.blockType === 'imageBlock' ? { ...block, image: placeholderId } : block,
  )

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'BBC micro:bit: Setup and First Programs',
      slug: SLUG,
      description:
        'From an unboxed micro:bit to your first programs - components, drag-and-drop MakeCode, Python, and flashing over USB.',
      thumbnail: THUMBNAIL_MEDIA_ID,
      difficulty: 'beginner',
      // IoT, Microcontroller
      tags: [1, 5],
      estimatedReadTime: 15,
      badge: 'featured',
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
