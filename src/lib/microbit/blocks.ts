import * as Blockly from 'blockly/core'
import { Order, type PythonGenerator } from 'blockly/python'

/**
 * micro:bit blocks and the MicroPython each one generates.
 *
 * Every block here maps onto one call in the micro:bit MicroPython API
 * (https://microbit-micropython.readthedocs.io). Blockly's own logic, loop,
 * math, text and variable blocks come with a Python generator already, so
 * only the board-specific ones live here.
 *
 * Colours are Blockly hues (0-360), not site colours: they are the block
 * palette students already know from every other block editor, and they need
 * to stay distinct from each other, which the copper theme cannot do alone.
 */

const HUE = {
  basic: 210,
  input: 300,
  music: 0,
  led: 160,
  radio: 30,
  pins: 260,
} as const

/** Icons from `microbit.Image` that are worth a dropdown slot. */
const ICONS = [
  ['heart', 'HEART'],
  ['small heart', 'HEART_SMALL'],
  ['happy', 'HAPPY'],
  ['smile', 'SMILE'],
  ['sad', 'SAD'],
  ['confused', 'CONFUSED'],
  ['angry', 'ANGRY'],
  ['asleep', 'ASLEEP'],
  ['surprised', 'SURPRISED'],
  ['silly', 'SILLY'],
  ['fabulous', 'FABULOUS'],
  ['meh', 'MEH'],
  ['yes', 'YES'],
  ['no', 'NO'],
  ['triangle', 'TRIANGLE'],
  ['diamond', 'DIAMOND'],
  ['square', 'SQUARE'],
  ['target', 'TARGET'],
  ['arrow N', 'ARROW_N'],
  ['arrow S', 'ARROW_S'],
  ['arrow E', 'ARROW_E'],
  ['arrow W', 'ARROW_W'],
  ['music note', 'MUSIC_QUAVER'],
  ['pitchfork', 'PITCHFORK'],
  ['rabbit', 'RABBIT'],
  ['duck', 'DUCK'],
  ['ghost', 'GHOST'],
  ['skull', 'SKULL'],
  ['umbrella', 'UMBRELLA'],
  ['snake', 'SNAKE'],
]

const MELODIES = [
  ['dadadadum', 'DADADADUM'],
  ['entertainer', 'ENTERTAINER'],
  ['prelude', 'PRELUDE'],
  ['ode', 'ODE'],
  ['nyan', 'NYAN'],
  ['ringtone', 'RINGTONE'],
  ['funk', 'FUNK'],
  ['blues', 'BLUES'],
  ['birthday', 'BIRTHDAY'],
  ['wedding', 'WEDDING'],
  ['funeral', 'FUNERAL'],
  ['punchline', 'PUNCHLINE'],
  ['python', 'PYTHON'],
  ['baddy', 'BADDY'],
  ['chase', 'CHASE'],
  ['ba ding', 'BA_DING'],
  ['wawawawaa', 'WAWAWAWAA'],
  ['jump up', 'JUMP_UP'],
  ['jump down', 'JUMP_DOWN'],
  ['power up', 'POWER_UP'],
  ['power down', 'POWER_DOWN'],
]

const GESTURES = [
  ['shake', 'shake'],
  ['logo up', 'up'],
  ['logo down', 'down'],
  ['screen up', 'face up'],
  ['screen down', 'face down'],
  ['tilt left', 'left'],
  ['tilt right', 'right'],
  ['free fall', 'freefall'],
]

const BUTTONS = [
  ['A', 'button_a'],
  ['B', 'button_b'],
]

const PINS = [
  ['P0', 'pin0'],
  ['P1', 'pin1'],
  ['P2', 'pin2'],
  ['P8', 'pin8'],
  ['P12', 'pin12'],
  ['P13', 'pin13'],
  ['P14', 'pin14'],
  ['P15', 'pin15'],
  ['P16', 'pin16'],
]

const TOUCH_PINS = [
  ['P0', 'pin0'],
  ['P1', 'pin1'],
  ['P2', 'pin2'],
]

const AXES = [
  ['x', 'x'],
  ['y', 'y'],
  ['z', 'z'],
]

const NOTES = [
  ['C', 'C4'],
  ['D', 'D4'],
  ['E', 'E4'],
  ['F', 'F4'],
  ['G', 'G4'],
  ['A', 'A4'],
  ['B', 'B4'],
  ['high C', 'C5'],
]

let defined = false

/** Register the blocks once per page - Blockly keeps them globally. */
export function defineMicrobitBlocks() {
  if (defined) return
  defined = true

  Blockly.defineBlocksWithJsonArray([
    // Basic -----------------------------------------------------------------
    {
      type: 'mb_forever',
      message0: 'forever %1 %2',
      args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
      colour: HUE.basic,
      tooltip: 'Runs the blocks inside again and again.',
    },
    {
      type: 'mb_show_string',
      message0: 'show string %1',
      args0: [{ type: 'input_value', name: 'TEXT' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Scrolls text across the LEDs.',
    },
    {
      type: 'mb_show_number',
      message0: 'show number %1',
      args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Scrolls a number across the LEDs.',
    },
    {
      type: 'mb_show_icon',
      message0: 'show icon %1',
      args0: [{ type: 'field_dropdown', name: 'ICON', options: ICONS }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Shows a built-in picture on the LEDs.',
    },
    {
      type: 'mb_show_leds',
      message0: 'show leds %1 %2 %3 %4 %5 %6',
      args0: [
        { type: 'input_dummy' },
        { type: 'field_input', name: 'ROW0', text: '00000' },
        { type: 'field_input', name: 'ROW1', text: '00000' },
        { type: 'field_input', name: 'ROW2', text: '00000' },
        { type: 'field_input', name: 'ROW3', text: '00000' },
        { type: 'field_input', name: 'ROW4', text: '00000' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Draw your own picture: five rows of five digits, 0 = off, 9 = brightest.',
    },
    {
      type: 'mb_clear',
      message0: 'clear screen',
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Turns every LED off.',
    },
    {
      type: 'mb_pause',
      message0: 'pause (ms) %1',
      args0: [{ type: 'input_value', name: 'MS', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Waits for this many milliseconds.',
    },
    {
      type: 'mb_print',
      message0: 'print to console %1',
      args0: [{ type: 'input_value', name: 'TEXT' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.basic,
      tooltip: 'Sends text to the console on this page over USB.',
    },

    // Input -----------------------------------------------------------------
    {
      type: 'mb_button_pressed',
      message0: 'button %1 is pressed',
      args0: [{ type: 'field_dropdown', name: 'BUTTON', options: BUTTONS }],
      output: 'Boolean',
      colour: HUE.input,
      tooltip: 'True while the button is held down.',
    },
    {
      type: 'mb_button_was_pressed',
      message0: 'button %1 was pressed',
      args0: [{ type: 'field_dropdown', name: 'BUTTON', options: BUTTONS }],
      output: 'Boolean',
      colour: HUE.input,
      tooltip: 'True once if the button was pressed since you last checked.',
    },
    {
      type: 'mb_gesture',
      message0: 'is %1',
      args0: [{ type: 'field_dropdown', name: 'GESTURE', options: GESTURES }],
      output: 'Boolean',
      colour: HUE.input,
      tooltip: 'True while the board is in this position or moving this way.',
    },
    {
      type: 'mb_was_gesture',
      message0: 'was %1',
      args0: [{ type: 'field_dropdown', name: 'GESTURE', options: GESTURES }],
      output: 'Boolean',
      colour: HUE.input,
      tooltip: 'True once if this gesture happened since you last checked.',
    },
    {
      type: 'mb_acceleration',
      message0: 'acceleration (mg) %1',
      args0: [{ type: 'field_dropdown', name: 'AXIS', options: AXES }],
      output: 'Number',
      colour: HUE.input,
      tooltip: 'How hard the board is being pushed along one axis.',
    },
    {
      type: 'mb_temperature',
      message0: 'temperature (°C)',
      output: 'Number',
      colour: HUE.input,
      tooltip: 'Temperature of the processor, roughly the room.',
    },
    {
      type: 'mb_light_level',
      message0: 'light level',
      output: 'Number',
      colour: HUE.input,
      tooltip: 'How bright it is, 0 to 255, read from the LEDs.',
    },
    {
      type: 'mb_compass_heading',
      message0: 'compass heading (°)',
      output: 'Number',
      colour: HUE.input,
      tooltip: 'Direction the board is facing, 0 to 359. Asks you to calibrate the first time.',
    },
    {
      type: 'mb_running_time',
      message0: 'running time (ms)',
      output: 'Number',
      colour: HUE.input,
      tooltip: 'Milliseconds since the board switched on.',
    },
    {
      type: 'mb_pin_touched',
      message0: 'pin %1 is touched',
      args0: [{ type: 'field_dropdown', name: 'PIN', options: TOUCH_PINS }],
      output: 'Boolean',
      colour: HUE.input,
      tooltip: 'True while you hold GND and touch this pin.',
    },

    // Music -----------------------------------------------------------------
    {
      type: 'mb_play_melody',
      message0: 'play melody %1',
      args0: [{ type: 'field_dropdown', name: 'MELODY', options: MELODIES }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.music,
      tooltip: 'Plays a built-in tune on the speaker or pin 0.',
    },
    {
      type: 'mb_play_note',
      message0: 'play note %1 for %2 ms',
      args0: [
        { type: 'field_dropdown', name: 'NOTE', options: NOTES },
        { type: 'input_value', name: 'MS', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.music,
      tooltip: 'Plays one note.',
    },
    {
      type: 'mb_play_tone',
      message0: 'play tone %1 Hz for %2 ms',
      args0: [
        { type: 'input_value', name: 'HZ', check: 'Number' },
        { type: 'input_value', name: 'MS', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.music,
      tooltip: 'Plays any frequency.',
    },
    {
      type: 'mb_stop_music',
      message0: 'stop all sounds',
      previousStatement: null,
      nextStatement: null,
      colour: HUE.music,
      tooltip: 'Silence.',
    },

    // LED -------------------------------------------------------------------
    {
      type: 'mb_plot',
      message0: 'plot x %1 y %2',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: HUE.led,
      tooltip: 'Turns one LED on. x and y go from 0 to 4.',
    },
    {
      type: 'mb_unplot',
      message0: 'unplot x %1 y %2',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: HUE.led,
      tooltip: 'Turns one LED off.',
    },
    {
      type: 'mb_toggle',
      message0: 'toggle x %1 y %2',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: HUE.led,
      tooltip: 'Flips one LED between on and off.',
    },
    {
      type: 'mb_point',
      message0: 'point x %1 y %2 is on',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: HUE.led,
      tooltip: 'True if that LED is lit.',
    },

    // Radio -----------------------------------------------------------------
    {
      type: 'mb_radio_on',
      message0: 'radio on, group %1',
      args0: [{ type: 'input_value', name: 'GROUP', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.radio,
      tooltip: 'Switches the radio on. Boards in the same group (0 to 255) hear each other.',
    },
    {
      type: 'mb_radio_send',
      message0: 'radio send %1',
      args0: [{ type: 'input_value', name: 'MSG' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.radio,
      tooltip: 'Broadcasts a message to every board in the group.',
    },
    {
      type: 'mb_radio_receive',
      message0: 'radio receive',
      output: null,
      colour: HUE.radio,
      tooltip: 'The next message waiting, or None if there is none.',
    },

    // Pins ------------------------------------------------------------------
    {
      type: 'mb_digital_write',
      message0: 'digital write pin %1 to %2',
      args0: [
        { type: 'field_dropdown', name: 'PIN', options: PINS },
        {
          type: 'field_dropdown',
          name: 'VALUE',
          options: [
            ['high (1)', '1'],
            ['low (0)', '0'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.pins,
      tooltip: 'Sets a pin fully on or fully off.',
    },
    {
      type: 'mb_digital_read',
      message0: 'digital read pin %1',
      args0: [{ type: 'field_dropdown', name: 'PIN', options: PINS }],
      output: 'Number',
      colour: HUE.pins,
      tooltip: '1 if the pin is high, 0 if low.',
    },
    {
      type: 'mb_analog_write',
      message0: 'analog write pin %1 to %2',
      args0: [
        { type: 'field_dropdown', name: 'PIN', options: PINS },
        { type: 'input_value', name: 'VALUE', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.pins,
      tooltip: 'Sets a pin to a level from 0 to 1023 (PWM).',
    },
    {
      type: 'mb_analog_read',
      message0: 'analog read pin %1',
      args0: [{ type: 'field_dropdown', name: 'PIN', options: TOUCH_PINS }],
      output: 'Number',
      colour: HUE.pins,
      tooltip: 'Voltage on the pin as a number from 0 to 1023.',
    },
    {
      type: 'mb_servo_write',
      message0: 'servo on pin %1 to %2 degrees',
      args0: [
        { type: 'field_dropdown', name: 'PIN', options: PINS },
        { type: 'input_value', name: 'ANGLE', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE.pins,
      tooltip: 'Moves a hobby servo to an angle from 0 to 180.',
    },
  ])
}

/** Attach the MicroPython generators to the given generator instance. */
export function installMicrobitGenerators(py: PythonGenerator) {
  const g = py.forBlock

  const value = (block: Blockly.Block, name: string, fallback: string) =>
    py.valueToCode(block, name, Order.NONE) || fallback

  // Basic
  g.mb_forever = (block) => {
    const body = py.statementToCode(block, 'DO') || `${py.INDENT}pass\n`
    return `while True:\n${body}`
  }
  g.mb_show_string = (block) => `display.scroll(str(${value(block, 'TEXT', "''")}))\n`
  g.mb_show_number = (block) => `display.scroll(${value(block, 'NUM', '0')})\n`
  g.mb_show_icon = (block) => `display.show(Image.${block.getFieldValue('ICON')})\n`
  g.mb_show_leds = (block) => {
    const rows = [0, 1, 2, 3, 4].map((i) => cleanRow(block.getFieldValue(`ROW${i}`)))
    return `display.show(Image('${rows.join(':')}'))\n`
  }
  g.mb_clear = () => 'display.clear()\n'
  g.mb_pause = (block) => `sleep(${value(block, 'MS', '100')})\n`
  g.mb_print = (block) => `print(${value(block, 'TEXT', "''")})\n`

  // Input
  g.mb_button_pressed = (block) => [
    `${block.getFieldValue('BUTTON')}.is_pressed()`,
    Order.FUNCTION_CALL,
  ]
  g.mb_button_was_pressed = (block) => [
    `${block.getFieldValue('BUTTON')}.was_pressed()`,
    Order.FUNCTION_CALL,
  ]
  g.mb_gesture = (block) => [
    `accelerometer.is_gesture('${block.getFieldValue('GESTURE')}')`,
    Order.FUNCTION_CALL,
  ]
  g.mb_was_gesture = (block) => [
    `accelerometer.was_gesture('${block.getFieldValue('GESTURE')}')`,
    Order.FUNCTION_CALL,
  ]
  g.mb_acceleration = (block) => [
    `accelerometer.get_${block.getFieldValue('AXIS')}()`,
    Order.FUNCTION_CALL,
  ]
  g.mb_temperature = () => ['temperature()', Order.FUNCTION_CALL]
  g.mb_light_level = () => ['display.read_light_level()', Order.FUNCTION_CALL]
  g.mb_compass_heading = () => ['compass.heading()', Order.FUNCTION_CALL]
  g.mb_running_time = () => ['running_time()', Order.FUNCTION_CALL]
  g.mb_pin_touched = (block) => [`${block.getFieldValue('PIN')}.is_touched()`, Order.FUNCTION_CALL]

  // Music
  g.mb_play_melody = (block) => `music.play(music.${block.getFieldValue('MELODY')})\n`
  g.mb_play_note = (block) =>
    `music.pitch(music_note('${block.getFieldValue('NOTE')}'), ${value(block, 'MS', '500')})\n`
  g.mb_play_tone = (block) =>
    `music.pitch(${value(block, 'HZ', '440')}, ${value(block, 'MS', '500')})\n`
  g.mb_stop_music = () => 'music.stop()\n'

  // LED
  g.mb_plot = (block) =>
    `display.set_pixel(${value(block, 'X', '0')}, ${value(block, 'Y', '0')}, 9)\n`
  g.mb_unplot = (block) =>
    `display.set_pixel(${value(block, 'X', '0')}, ${value(block, 'Y', '0')}, 0)\n`
  g.mb_toggle = (block) => {
    const x = value(block, 'X', '0')
    const y = value(block, 'Y', '0')
    return `display.set_pixel(${x}, ${y}, 0 if display.get_pixel(${x}, ${y}) else 9)\n`
  }
  g.mb_point = (block) => [
    `display.get_pixel(${value(block, 'X', '0')}, ${value(block, 'Y', '0')}) > 0`,
    Order.RELATIONAL,
  ]

  // Radio
  g.mb_radio_on = (block) => `radio.config(group=${value(block, 'GROUP', '0')})\nradio.on()\n`
  g.mb_radio_send = (block) => `radio.send(str(${value(block, 'MSG', "''")}))\n`
  g.mb_radio_receive = () => ['radio.receive()', Order.FUNCTION_CALL]

  // Pins
  g.mb_digital_write = (block) =>
    `${block.getFieldValue('PIN')}.write_digital(${block.getFieldValue('VALUE')})\n`
  g.mb_digital_read = (block) => [
    `${block.getFieldValue('PIN')}.read_digital()`,
    Order.FUNCTION_CALL,
  ]
  g.mb_analog_write = (block) =>
    `${block.getFieldValue('PIN')}.write_analog(${value(block, 'VALUE', '0')})\n`
  g.mb_analog_read = (block) => [`${block.getFieldValue('PIN')}.read_analog()`, Order.FUNCTION_CALL]
  g.mb_servo_write = (block) => {
    const pin = block.getFieldValue('PIN')
    const angle = value(block, 'ANGLE', '90')
    // 50 Hz servo pulse: 0.5 ms (0°) to 2.5 ms (180°) out of a 20 ms period.
    return `${pin}.set_analog_period(20)\n${pin}.write_analog(26 + (${angle}) * 102 // 180)\n`
  }
}

/** Five digits 0-9; anything else becomes an off pixel. */
function cleanRow(raw: string): string {
  return (raw || '')
    .replace(/[^0-9]/g, '0')
    .padEnd(5, '0')
    .slice(0, 5)
}

/**
 * Lines every generated script starts with. `music_note` is a tiny helper so
 * the note block can name notes the way the music blocks in MakeCode do.
 */
export const SCRIPT_HEADER = `from microbit import *
import music
import radio

_NOTES = {'C4': 262, 'D4': 294, 'E4': 330, 'F4': 349, 'G4': 392, 'A4': 440, 'B4': 494, 'C5': 523}

def music_note(name):
    return _NOTES.get(name, 440)

`

/** Toolbox categories, in the order they appear in the flyout. */
export const TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Basic',
      colour: String(HUE.basic),
      contents: [
        { kind: 'block', type: 'mb_forever' },
        {
          kind: 'block',
          type: 'mb_show_string',
          inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello!' } } } },
        },
        {
          kind: 'block',
          type: 'mb_show_number',
          inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: 0 } } } },
        },
        { kind: 'block', type: 'mb_show_icon' },
        { kind: 'block', type: 'mb_show_leds' },
        { kind: 'block', type: 'mb_clear' },
        {
          kind: 'block',
          type: 'mb_pause',
          inputs: { MS: { shadow: { type: 'math_number', fields: { NUM: 100 } } } },
        },
        {
          kind: 'block',
          type: 'mb_print',
          inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'hello' } } } },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Input',
      colour: String(HUE.input),
      contents: [
        { kind: 'block', type: 'mb_button_pressed' },
        { kind: 'block', type: 'mb_button_was_pressed' },
        { kind: 'block', type: 'mb_gesture' },
        { kind: 'block', type: 'mb_was_gesture' },
        { kind: 'block', type: 'mb_acceleration' },
        { kind: 'block', type: 'mb_temperature' },
        { kind: 'block', type: 'mb_light_level' },
        { kind: 'block', type: 'mb_compass_heading' },
        { kind: 'block', type: 'mb_running_time' },
        { kind: 'block', type: 'mb_pin_touched' },
      ],
    },
    {
      kind: 'category',
      name: 'Music',
      colour: String(HUE.music),
      contents: [
        { kind: 'block', type: 'mb_play_melody' },
        {
          kind: 'block',
          type: 'mb_play_note',
          inputs: { MS: { shadow: { type: 'math_number', fields: { NUM: 500 } } } },
        },
        {
          kind: 'block',
          type: 'mb_play_tone',
          inputs: {
            HZ: { shadow: { type: 'math_number', fields: { NUM: 440 } } },
            MS: { shadow: { type: 'math_number', fields: { NUM: 500 } } },
          },
        },
        { kind: 'block', type: 'mb_stop_music' },
      ],
    },
    {
      kind: 'category',
      name: 'LED',
      colour: String(HUE.led),
      contents: [
        { kind: 'block', type: 'mb_plot', inputs: xyShadows() },
        { kind: 'block', type: 'mb_unplot', inputs: xyShadows() },
        { kind: 'block', type: 'mb_toggle', inputs: xyShadows() },
        { kind: 'block', type: 'mb_point', inputs: xyShadows() },
      ],
    },
    {
      kind: 'category',
      name: 'Radio',
      colour: String(HUE.radio),
      contents: [
        {
          kind: 'block',
          type: 'mb_radio_on',
          inputs: { GROUP: { shadow: { type: 'math_number', fields: { NUM: 1 } } } },
        },
        {
          kind: 'block',
          type: 'mb_radio_send',
          inputs: { MSG: { shadow: { type: 'text', fields: { TEXT: 'hi' } } } },
        },
        { kind: 'block', type: 'mb_radio_receive' },
      ],
    },
    {
      kind: 'category',
      name: 'Pins',
      colour: String(HUE.pins),
      contents: [
        { kind: 'block', type: 'mb_digital_write' },
        { kind: 'block', type: 'mb_digital_read' },
        {
          kind: 'block',
          type: 'mb_analog_write',
          inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 512 } } } },
        },
        { kind: 'block', type: 'mb_analog_read' },
        {
          kind: 'block',
          type: 'mb_servo_write',
          inputs: { ANGLE: { shadow: { type: 'math_number', fields: { NUM: 90 } } } },
        },
      ],
    },
    { kind: 'sep' },
    {
      kind: 'category',
      name: 'Logic',
      categorystyle: 'logic_category',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      categorystyle: 'loop_category',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 4 } } } },
        },
        { kind: 'block', type: 'controls_whileUntil' },
        {
          kind: 'block',
          type: 'controls_for',
          inputs: {
            FROM: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            TO: { shadow: { type: 'math_number', fields: { NUM: 4 } } },
            BY: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          },
        },
        { kind: 'block', type: 'controls_flow_statements' },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      categorystyle: 'math_category',
      contents: [
        { kind: 'block', type: 'math_number' },
        {
          kind: 'block',
          type: 'math_arithmetic',
          inputs: {
            A: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
            B: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          },
        },
        {
          kind: 'block',
          type: 'math_random_int',
          inputs: {
            FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
            TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
          },
        },
        {
          kind: 'block',
          type: 'math_modulo',
          inputs: {
            DIVIDEND: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
            DIVISOR: { shadow: { type: 'math_number', fields: { NUM: 3 } } },
          },
        },
        {
          kind: 'block',
          type: 'math_constrain',
          inputs: {
            VALUE: { shadow: { type: 'math_number', fields: { NUM: 50 } } },
            LOW: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            HIGH: { shadow: { type: 'math_number', fields: { NUM: 100 } } },
          },
        },
        { kind: 'block', type: 'math_single' },
      ],
    },
    {
      kind: 'category',
      name: 'Text',
      categorystyle: 'text_category',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length' },
      ],
    },
    {
      kind: 'category',
      name: 'Variables',
      categorystyle: 'variable_category',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: 'Functions',
      categorystyle: 'procedure_category',
      custom: 'PROCEDURE',
    },
  ],
}

function xyShadows() {
  return {
    X: { shadow: { type: 'math_number', fields: { NUM: 2 } } },
    Y: { shadow: { type: 'math_number', fields: { NUM: 2 } } },
  }
}

/** A fresh workspace: a forever loop showing a heart, so the first flash does something. */
export const STARTER_WORKSPACE = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'mb_forever',
        x: 40,
        y: 40,
        inputs: {
          DO: {
            block: {
              type: 'mb_show_icon',
              fields: { ICON: 'HEART' },
              next: {
                block: {
                  type: 'mb_pause',
                  inputs: { MS: { shadow: { type: 'math_number', fields: { NUM: 500 } } } },
                  next: {
                    block: {
                      type: 'mb_clear',
                      next: {
                        block: {
                          type: 'mb_pause',
                          inputs: {
                            MS: { shadow: { type: 'math_number', fields: { NUM: 500 } } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
}
