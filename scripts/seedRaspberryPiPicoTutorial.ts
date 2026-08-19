/**
 * Seed the "Raspberry Pi Pico: MicroPython Setup" tutorial.
 *
 *   pnpm tsx scripts/seedRaspberryPiPicoTutorial.ts
 *
 * The Pico W has its own tutorial covering Wi-Fi; this one is the board itself -
 * firmware, the REPL, main.py, and the on-chip sensors.
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
  italic,
  list,
  paragraph,
  placeholderImage,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'raspberry-pi-pico-micropython-setup'

const REPL_FIRST = `>>> print("hello from the Pico")
hello from the Pico
>>> from machine import Pin
>>> led = Pin(25, Pin.OUT)
>>> led.on()
>>> led.off()`

const BLINK = `# blink.py - the on-board LED, on GPIO 25.
from machine import Pin
from time import sleep

led = Pin(25, Pin.OUT)

while True:
    led.toggle()
    sleep(0.5)`

const BUTTON = `# button.py - press to light an external LED.
#
# Wiring: GP15 -> 330 ohm resistor -> LED anode; LED cathode -> GND (pin 38).
#         Button between GP14 and GND (pin 33).
#
# PULL_UP uses a resistor inside the RP2040, so the pin idles at 3.3V and
# reads 0 when pressed. Two wires, no extra components.
from machine import Pin
from time import sleep

led = Pin(15, Pin.OUT)
button = Pin(14, Pin.IN, Pin.PULL_UP)

while True:
    if button.value() == 0:      # 0 means pressed
        led.on()
    else:
        led.off()
    sleep(0.01)                  # crude debounce, and it keeps the loop calm`

const TEMPERATURE = `# temperature.py - the RP2040 has a temperature sensor wired to ADC channel 4.
# No external parts at all.
import machine
import time

sensor = machine.ADC(4)
CONVERSION = 3.3 / 65535        # read_u16 returns 0-65535 across 0-3.3V

while True:
    volts = sensor.read_u16() * CONVERSION
    # Formula from the RP2040 datasheet: 0.706V at 27C, -1.721 mV per degree.
    celsius = 27 - (volts - 0.706) / 0.001721
    print("{:.1f} C".format(celsius))
    time.sleep(1)`

const CONTENT = [
  textBlock([
    heading('h1', [text('Raspberry Pi Pico: MicroPython Setup')], 'center'),
    paragraph([
      text(
        'The Pico is a microcontroller board built around Raspberry Pi’s own RP2040 chip: two cores at 133 MHz, 264 KB of RAM, and a price low enough to leave one soldered into a finished project. It also has the friendliest first hour of any board here - no drivers, no board packages, and a Python prompt running on the chip within about five minutes.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [
        bold('A Raspberry Pi Pico'),
        text(' - the plain one, or the '),
        bold('Pico H'),
        text(' with headers already soldered'),
      ],
      [bold('A micro-USB cable'), text(' that carries data, not just power')],
      [text('An LED and a '), bold('220–330Ω'), text(' resistor')],
      [text('A pushbutton')],
      [text('A breadboard and jumper wires')],
    ]),
    paragraph([
      bold('The plain Pico ships with no headers. '),
      text(
        'If you do not want to solder, buy the Pico H. Pressing an unsoldered Pico into a breadboard makes intermittent contact, and the resulting "my code randomly stops working" is genuinely hard to diagnose.',
      ),
    ]),
    paragraph([
      bold('3.3V logic, not 5V. '),
      text(
        'Unlike the Uno and Nano, the Pico’s GPIO pins are 3.3V and are not 5V tolerant. Feeding 5V from a sensor straight into a GPIO pin damages the chip - use a level shifter or a divider for anything that outputs 5V.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Install Thonny')]),
    paragraph([
      text(
        'Thonny is a small Python editor that speaks MicroPython over USB. It is the path of least resistance and it is what the official documentation assumes.',
      ),
    ]),
    list('number', [
      [text('Download it from '), bold('thonny.org'), text(' and install it.')],
      [text('Open it. Leave the settings alone for now.')],
    ]),
  ]),
  placeholderImage(0, 'The Thonny download page'),

  textBlock([
    heading('h2', [text('Step 2: Put the Pico in Bootloader Mode')]),
    paragraph([
      text('The Pico has exactly one button, marked '),
      bold('BOOTSEL'),
      text('. It only matters at the moment of plugging in:'),
    ]),
    list('number', [
      [text('Make sure the Pico is '), bold('unplugged'), text('.')],
      [text('Hold '), bold('BOOTSEL'), text(' down.')],
      [text('While still holding it, plug the USB cable into your computer.')],
      [text('Let go. A USB drive called '), code('RPI-RP2'), text(' appears.')],
    ]),
    paragraph([
      text('That drive '),
      italic('is'),
      text(
        ' the bootloader. Anything you copy onto it is written to flash, and the board reboots into it. There is no driver to install and no upload tool - the file manager is the flashing tool.',
      ),
    ]),
  ]),
  placeholderImage(0, 'The RPI-RP2 drive mounted in the file manager after holding BOOTSEL'),

  textBlock([
    heading('h2', [text('Step 3: Install MicroPython')]),
    paragraph([text('The easiest route is to let Thonny do it:')]),
    list('number', [
      [
        text('In Thonny, click the '),
        bold('interpreter selector'),
        text(' in the bottom-right corner of the window.'),
      ],
      [text('Choose '), bold('Install MicroPython…'), text('.')],
      [
        text('Pick '),
        bold('Raspberry Pi · Pico / Pico H'),
        text(' as the variant, then '),
        bold('Install'),
        text('.'),
      ],
      [
        text('When it finishes, the '),
        code('RPI-RP2'),
        text(' drive disappears - the board has rebooted into MicroPython.'),
      ],
    ]),
    paragraph([
      text('The manual route works too: download the '),
      code('.uf2'),
      text(' file for the Pico from '),
      bold('raspberrypi.com/documentation/microcontrollers/micropython.html'),
      text(' and drag it onto the '),
      code('RPI-RP2'),
      text(' drive. Same result.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 4: Talk to the Board')]),
    paragraph([
      text('At the bottom-right of Thonny, select '),
      bold('MicroPython (Raspberry Pi Pico)'),
      text(' as the interpreter. The Shell panel shows a '),
      code('>>>'),
      text(' prompt. That prompt is running '),
      italic('on the Pico'),
      text(' - type into it and the chip responds:'),
    ]),
  ]),
  codeBlock('python', REPL_FIRST, 'The MicroPython REPL, over USB'),
  textBlock([
    paragraph([
      text('The on-board LED is on '),
      code('GPIO 25'),
      text(
        '. Being able to poke hardware one line at a time, with no compile and no upload, is the real advantage of MicroPython on this board - it is a far faster way to find out what a new sensor actually returns.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'Thonny with the MicroPython (Raspberry Pi Pico) interpreter selected and the REPL responding',
  ),

  textBlock([
    heading('h2', [text('Step 5: Run a Real Program')]),
    paragraph([text('Type this into the editor pane (the top half of the window):')]),
  ]),
  codeBlock('python', BLINK, 'blink.py'),
  textBlock([
    list('number', [
      [
        text('Press the green '),
        bold('Run'),
        text(' button. The LED blinks. Press '),
        bold('Stop'),
        text(' to end it.'),
      ],
      [
        text('To make it survive a reboot: '),
        bold('File → Save as…'),
        text(' → '),
        bold('Raspberry Pi Pico'),
        text('.'),
      ],
      [text('Name it exactly '), code('main.py'), text('.')],
    ]),
    paragraph([
      bold('The filename is the whole mechanism. '),
      text('MicroPython looks for a file called '),
      code('main.py'),
      text(
        ' on boot and runs it. Save it under any other name and it only runs when you press Run. Save it as main.py and the board does its job standalone from a phone charger, with no computer attached.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 6: An LED and a Button')]),
    paragraph([text('Wire it up:')]),
    list('bullet', [
      [code('GP15'), text(' (physical pin 20) → 330Ω resistor → LED anode')],
      [text('LED cathode → '), code('GND'), text(' (physical pin 23 or 38)')],
      [text('Button between '), code('GP14'), text(' (pin 19) and '), code('GND')],
    ]),
    paragraph([
      bold('GP numbers are not pin numbers. '),
      text(
        'The Pico has 40 physical pins and the GPIO labels do not line up with them - GP15 is physical pin 20. Keep a pinout diagram open; guessing costs more time than looking.',
      ),
    ]),
  ]),
  codeBlock('python', BUTTON, 'button.py'),
  placeholderImage(0, 'The official Raspberry Pi Pico pinout diagram'),

  textBlock([
    heading('h2', [text('Step 7: Read the On-Chip Temperature Sensor')]),
    paragraph([
      text(
        'The RP2040 has a temperature sensor built into the silicon, on the fifth ADC channel. Nothing to wire:',
      ),
    ]),
  ]),
  codeBlock('python', TEMPERATURE, 'temperature.py'),
  textBlock([
    paragraph([
      text('Expect it to read a few degrees above room temperature - it measures the '),
      italic('die'),
      text(
        ', which is warmed by the chip itself. It is useful for spotting the board getting hot, not for reporting the weather.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('No RPI-RP2 drive: '),
        text(
          'BOOTSEL was not held while plugging in, or the cable is charge-only. Unplug, hold the button down, plug in, then release.',
        ),
      ],
      [
        bold('Thonny cannot connect / "port is busy": '),
        text(
          'another program has the serial port open - a second Thonny window, or a serial monitor. Close it, then click ',
        ),
        bold('Stop'),
        text(' in Thonny to reconnect.'),
      ],
      [
        bold('A bad main.py locks the board out: '),
        text('press '),
        bold('Stop'),
        text(
          ' in Thonny to interrupt it. If even that fails, hold BOOTSEL while plugging in and re-flash MicroPython - that wipes the filesystem and gives you a clean board back.',
        ),
      ],
      [
        bold('Pin(25) does nothing: '),
        text('you have a '),
        bold('Pico W'),
        text('. Its LED is wired to the wireless chip instead, so it is '),
        code('Pin("LED")'),
        text(' there. See the Pico W tutorial.'),
      ],
      [
        bold('Readings jump around, or the board resets at random: '),
        text('an unsoldered Pico in a breadboard. Solder the headers.'),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [text('Move to the Pico W tutorial to put the same board on Wi-Fi.')],
      [text('Drive a servo or a NeoPixel strip - MicroPython has a module for both built in.')],
      [
        text(
          'Try the PIO state machines, which are unique to the RP2040 and can bit-bang protocols without using a core.',
        ),
      ],
      [text('Compare with the Arduino Uno tutorial to see the same tasks in C++ on 5V hardware.')],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const tags = await ensureTagIds(payload, ['Raspberry', 'Microcontroller', 'Python'])

  const content = CONTENT.map((block) =>
    block.blockType === 'imageBlock' ? { ...block, image: placeholderId } : block,
  )

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'Raspberry Pi Pico: MicroPython Setup',
      slug: SLUG,
      description:
        'Flash MicroPython to a Raspberry Pi Pico with a drag-and-drop, then blink, read a button, and use the on-chip temperature sensor from a live Python prompt.',
      // No Pico photo in the library yet; placeholder until one is added.
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
