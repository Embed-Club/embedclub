import * as Blockly from 'blockly/core'
import {
  ANALOG_PINS,
  AXES,
  BUTTONS,
  EVENT_BUTTONS,
  GESTURES,
  ICONS,
  MELODIES,
  NOTES,
  type Options,
  PINS,
  SOUNDS,
  TOUCH_PINS,
} from './blockOptions'

/**
 * micro:bit block shapes. What each one turns into lives in `generator.ts`,
 * and where it sits in the palette lives in `toolbox.ts`.
 *
 * Every block maps onto the micro:bit MicroPython API
 * (https://microbit-micropython.readthedocs.io). Blockly's own logic, loop,
 * math, text and variable blocks come with a Python generator already, so
 * only the board-specific ones are defined here.
 *
 * Colours are Blockly hues (0-360), not site colours: they are the block
 * palette students already know from every other block editor, and they need
 * to stay distinct from each other, which the copper theme cannot do alone.
 */

export const HUE = {
  basic: 210,
  input: 300,
  music: 0,
  led: 160,
  radio: 30,
  pins: 260,
  loops: 120,
} as const

type Arg = Record<string, unknown>
type BlockJson = Record<string, unknown>

const dropdown = (name: string, options: Options): Arg => ({
  type: 'field_dropdown',
  name,
  options,
})
const numberInput = (name: string): Arg => ({ type: 'input_value', name, check: 'Number' })
const anyInput = (name: string): Arg => ({ type: 'input_value', name })

/** A block that stacks: it has a notch on top and a bump underneath. */
function statement(
  type: string,
  message0: string,
  args0: Arg[],
  colour: number,
  tooltip: string,
  extra: BlockJson = {},
): BlockJson {
  return {
    type,
    message0,
    args0,
    previousStatement: null,
    nextStatement: null,
    colour,
    tooltip,
    ...extra,
  }
}

/** A block that plugs into a hole and hands back a value. */
function reporter(
  type: string,
  message0: string,
  args0: Arg[],
  output: string | null,
  colour: number,
  tooltip: string,
  extra: BlockJson = {},
): BlockJson {
  return { type, message0, args0, output, colour, tooltip, ...extra }
}

/**
 * A block that starts a script: no notch on top, a mouth for the blocks it
 * runs. `on start`, `forever` and every event are these.
 */
function hat(
  type: string,
  message0: string,
  args0: Arg[],
  colour: number,
  tooltip: string,
): BlockJson {
  const inputs = args0.length
  return {
    type,
    message0: `${message0} %${inputs + 1} %${inputs + 2}`,
    args0: [...args0, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
    colour,
    tooltip,
  }
}

const xy = [numberInput('X'), numberInput('Y')]

let defined = false

/** Register the blocks once per page - Blockly keeps them globally. */
export function defineMicrobitBlocks() {
  if (defined) return
  defined = true

  Blockly.defineBlocksWithJsonArray([
    // Basic -----------------------------------------------------------------
    hat('mb_on_start', 'on start', [], HUE.basic, 'Runs once, when the board switches on.'),
    hat('mb_forever', 'forever', [], HUE.basic, 'Runs the blocks inside again and again.'),
    statement(
      'mb_show_string',
      'show string %1',
      [anyInput('TEXT')],
      HUE.basic,
      'Scrolls text across the LEDs.',
    ),
    statement(
      'mb_show_number',
      'show number %1',
      [numberInput('NUM')],
      HUE.basic,
      'Shows a number. One digit stays put; longer numbers scroll.',
    ),
    statement(
      'mb_show_icon',
      'show icon %1',
      [dropdown('ICON', ICONS)],
      HUE.basic,
      'Shows a built-in picture on the LEDs.',
    ),
    statement(
      'mb_show_leds',
      'show leds %1 %2 %3 %4 %5 %6',
      [
        { type: 'input_dummy' },
        ...[0, 1, 2, 3, 4].map((row) => ({
          type: 'field_input',
          name: `ROW${row}`,
          text: '00000',
        })),
      ],
      HUE.basic,
      'Draw your own picture: five rows of five digits, 0 = off, 9 = brightest.',
    ),
    statement('mb_clear', 'clear screen', [], HUE.basic, 'Turns every LED off.'),
    statement(
      'mb_pause',
      'pause (ms) %1',
      [numberInput('MS')],
      HUE.basic,
      'Waits for this many milliseconds.',
    ),
    statement(
      'mb_print',
      'print to console %1',
      [anyInput('TEXT')],
      HUE.basic,
      'Sends text to the console on this page over USB.',
    ),

    // Input -----------------------------------------------------------------
    hat(
      'mb_on_button',
      'on button %1 pressed',
      [dropdown('BUTTON', EVENT_BUTTONS)],
      HUE.input,
      'Runs the blocks inside each time the button is pressed.',
    ),
    hat(
      'mb_on_gesture',
      'on %1',
      [dropdown('GESTURE', GESTURES)],
      HUE.input,
      'Runs the blocks inside each time the board is moved this way.',
    ),
    hat(
      'mb_on_pin',
      'on pin %1 pressed',
      [dropdown('PIN', TOUCH_PINS)],
      HUE.input,
      'Runs the blocks inside each time the pin is touched (hold GND with your other hand). The logo needs a V2 board.',
    ),
    reporter(
      'mb_button_pressed',
      'button %1 is pressed',
      [dropdown('BUTTON', BUTTONS)],
      'Boolean',
      HUE.input,
      'True while the button is held down.',
    ),
    reporter(
      'mb_button_was_pressed',
      'button %1 was pressed',
      [dropdown('BUTTON', BUTTONS)],
      'Boolean',
      HUE.input,
      'True once if the button was pressed since you last checked.',
    ),
    reporter(
      'mb_gesture',
      'is %1',
      [dropdown('GESTURE', GESTURES)],
      'Boolean',
      HUE.input,
      'True while the board is in this position or moving this way.',
    ),
    reporter(
      'mb_was_gesture',
      'was %1',
      [dropdown('GESTURE', GESTURES)],
      'Boolean',
      HUE.input,
      'True once if this gesture happened since you last checked.',
    ),
    reporter(
      'mb_pin_touched',
      'pin %1 is touched',
      [dropdown('PIN', TOUCH_PINS)],
      'Boolean',
      HUE.input,
      'True while you hold GND and touch this pin. The logo needs a V2 board.',
    ),
    reporter(
      'mb_acceleration',
      'acceleration (mg) %1',
      [dropdown('AXIS', AXES)],
      'Number',
      HUE.input,
      'How hard the board is being pushed along one axis.',
    ),
    reporter(
      'mb_temperature',
      'temperature (°C)',
      [],
      'Number',
      HUE.input,
      'Temperature of the processor, roughly the room.',
    ),
    reporter(
      'mb_light_level',
      'light level',
      [],
      'Number',
      HUE.input,
      'How bright it is, 0 to 255, read from the LEDs.',
    ),
    reporter(
      'mb_sound_level',
      'sound level (V2)',
      [],
      'Number',
      HUE.input,
      'How loud it is, 0 to 255, from the microphone. Needs a V2 board.',
    ),
    reporter(
      'mb_compass_heading',
      'compass heading (°)',
      [],
      'Number',
      HUE.input,
      'Direction the board is facing, 0 to 359. Asks you to calibrate the first time.',
    ),
    reporter(
      'mb_running_time',
      'running time (ms)',
      [],
      'Number',
      HUE.input,
      'Milliseconds since the board switched on.',
    ),

    // Music -----------------------------------------------------------------
    statement(
      'mb_play_melody',
      'play melody %1',
      [dropdown('MELODY', MELODIES)],
      HUE.music,
      'Plays a built-in tune on the speaker or pin 0.',
    ),
    statement(
      'mb_play_note',
      'play note %1 for %2 ms',
      [dropdown('NOTE', NOTES), numberInput('MS')],
      HUE.music,
      'Plays one note.',
    ),
    statement(
      'mb_play_tone',
      'play tone %1 Hz for %2 ms',
      [numberInput('HZ'), numberInput('MS')],
      HUE.music,
      'Plays any frequency.',
    ),
    statement(
      'mb_play_sound',
      'play sound %1 (V2)',
      [dropdown('SOUND', SOUNDS)],
      HUE.music,
      'Plays one of the V2 speaker sounds and waits until it ends. Needs a V2 board.',
    ),
    statement(
      'mb_set_volume',
      'set volume %1 (V2)',
      [numberInput('VOLUME')],
      HUE.music,
      'Speaker volume from 0 to 255. Needs a V2 board.',
    ),
    statement('mb_stop_music', 'stop all sounds', [], HUE.music, 'Silence.'),

    // LED -------------------------------------------------------------------
    statement(
      'mb_plot',
      'plot x %1 y %2',
      xy,
      HUE.led,
      'Turns one LED on. x and y go from 0 to 4.',
      {
        inputsInline: true,
      },
    ),
    statement(
      'mb_plot_brightness',
      'plot x %1 y %2 brightness %3',
      [...xy, numberInput('LEVEL')],
      HUE.led,
      'Lights one LED at a brightness from 0 (off) to 9.',
      { inputsInline: true },
    ),
    statement('mb_unplot', 'unplot x %1 y %2', xy, HUE.led, 'Turns one LED off.', {
      inputsInline: true,
    }),
    statement('mb_toggle', 'toggle x %1 y %2', xy, HUE.led, 'Flips one LED between on and off.', {
      inputsInline: true,
    }),
    reporter(
      'mb_point',
      'point x %1 y %2 is on',
      xy,
      'Boolean',
      HUE.led,
      'True if that LED is lit.',
      {
        inputsInline: true,
      },
    ),

    // Radio -----------------------------------------------------------------
    hat(
      'mb_on_radio',
      'on radio received',
      [],
      HUE.radio,
      'Runs the blocks inside each time a message arrives. Use "received message" inside to read it.',
    ),
    statement(
      'mb_radio_on',
      'radio on, group %1',
      [numberInput('GROUP')],
      HUE.radio,
      'Switches the radio on. Boards in the same group (0 to 255) hear each other.',
    ),
    statement(
      'mb_radio_send',
      'radio send %1',
      [anyInput('MSG')],
      HUE.radio,
      'Broadcasts a message to every board in the group.',
    ),
    reporter(
      'mb_radio_message',
      'received message',
      [],
      'String',
      HUE.radio,
      'The message that started "on radio received".',
    ),
    reporter(
      'mb_radio_receive',
      'radio receive',
      [],
      null,
      HUE.radio,
      'The next message waiting, or None if there is none.',
    ),

    // Pins ------------------------------------------------------------------
    statement(
      'mb_digital_write',
      'digital write pin %1 to %2',
      [
        dropdown('PIN', PINS),
        dropdown('VALUE', [
          ['high (1)', '1'],
          ['low (0)', '0'],
        ]),
      ],
      HUE.pins,
      'Sets a pin fully on or fully off.',
    ),
    reporter(
      'mb_digital_read',
      'digital read pin %1',
      [dropdown('PIN', PINS)],
      'Number',
      HUE.pins,
      '1 if the pin is high, 0 if low.',
    ),
    statement(
      'mb_analog_write',
      'analog write pin %1 to %2',
      [dropdown('PIN', PINS), numberInput('VALUE')],
      HUE.pins,
      'Sets a pin to a level from 0 to 1023 (PWM).',
    ),
    reporter(
      'mb_analog_read',
      'analog read pin %1',
      [dropdown('PIN', ANALOG_PINS)],
      'Number',
      HUE.pins,
      'Voltage on the pin as a number from 0 to 1023.',
    ),
    statement(
      'mb_servo_write',
      'servo on pin %1 to %2 degrees',
      [dropdown('PIN', PINS), numberInput('ANGLE')],
      HUE.pins,
      'Moves a hobby servo to an angle from 0 to 180.',
    ),

    // Loops -----------------------------------------------------------------
    hat(
      'mb_every',
      'every %1 ms',
      [{ type: 'field_number', name: 'MS', value: 500, min: 1, precision: 1 }],
      HUE.loops,
      'Runs the blocks inside on a timer, alongside forever.',
    ),
  ])
}
