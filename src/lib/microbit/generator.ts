import * as Blockly from 'blockly/core'
import { Order, PythonGenerator, pythonGenerator } from 'blockly/python'

/**
 * Blocks to MicroPython.
 *
 * Blockly's stock Python generator writes desktop Python, and two of its
 * habits crash on the board: every variable starts as `None` (so `show number
 * count` dies on the first pass), and `change count by 1` pulls in
 * `from numbers import Number`, a module MicroPython does not have. This
 * subclass fixes both, and adds what a micro:bit program needs that desktop
 * Python never did: `on start`, `forever` and events.
 *
 * MicroPython has no event system, so every one of those blocks becomes a
 * plain function and the generator writes one loop at the bottom that polls
 * the buttons, pins, gestures and radio and calls the right function - the
 * same shape a student would write by hand. Forever blocks are called once per
 * pass of that loop, so a long `pause` inside one does delay the events; that
 * is the trade for a program a student can read top to bottom.
 */

type HatKind = 'start' | 'forever' | 'button' | 'gesture' | 'pin' | 'radio' | 'every'

interface Hat {
  kind: HatKind
  /** The function the hat became. */
  fn: string
  /** Which button, gesture, pin or interval it listens for. */
  on?: string
}

/** Names from `from microbit import *` and our helpers - never reused for a student's variable. */
const RESERVED = [
  'microbit',
  'display',
  'Image',
  'button_a',
  'button_b',
  'accelerometer',
  'compass',
  'microphone',
  'speaker',
  'audio',
  'Sound',
  'music',
  'radio',
  'sleep',
  'running_time',
  'temperature',
  'set_volume',
  'pin_logo',
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20].map((n) => `pin${n}`),
  'show_number',
  'music_note',
  'radio_message',
  'Number',
].join(',')

export class MicroPythonGenerator extends PythonGenerator {
  private hats: Hat[] = []

  constructor() {
    super('MicroPython')
    // Four spaces, like the hand-written examples and every Python tutorial.
    this.INDENT = '    '
    // Everything Blockly already knows how to write (if, loops, maths, text,
    // variables, functions), then the board's own blocks on top.
    Object.assign(this.forBlock, pythonGenerator.forBlock)
    this.addReservedWords(RESERVED)
    installMicrobitGenerators(this)
  }

  /** Add a line or helper above the program, once, however many blocks ask. */
  need(key: string, code: string) {
    this.definitions_[key] = code
  }

  override init(workspace: Blockly.Workspace) {
    super.init(workspace)
    this.hats = []
    this.need('import_microbit', 'from microbit import *')
    // Numbers start at 0, as they do in MakeCode. `None` crashes the first
    // `show number` or `change by` that touches the variable.
    const variables = this.definitions_.variables
    if (variables) this.definitions_.variables = variables.replace(/ = None$/gm, ' = 0')
  }

  override finish(code: string): string {
    // Some of Blockly's maths blocks type-check with `numbers.Number`; the
    // board has no `numbers` module, so give them the tuple it stands for.
    if ('from_numbers_import_Number' in this.definitions_) {
      const { from_numbers_import_Number: _, ...rest } = this.definitions_
      this.definitions_ = rest
      this.need('number_type', 'Number = (int, float)')
    }
    const runner = this.runner()
    return super.finish(runner ? `${code}\n\n${runner}\n` : code)
  }

  /**
   * One `on start`, `forever` or event block, written as a function. The
   * loop that calls it is written at the end, in `runner`.
   */
  hat(block: Blockly.Block, kind: HatKind, name: string, on?: string): string {
    const fn = this.nameDB_?.getDistinctName(name, Blockly.Names.NameType.PROCEDURE) ?? name
    this.hats.push({ kind, fn, on })
    const body = this.statementToCode(block, 'DO') || `${this.INDENT}pass\n`
    return `def ${fn}():\n${this.globals(block.workspace)}${body}`
  }

  /** Functions assign to the program's variables, so declare them global. */
  private globals(workspace: Blockly.Workspace): string {
    const names = Blockly.Variables.allUsedVarModels(workspace).map((v) =>
      this.getVariableName(v.getId()),
    )
    return names.length ? `${this.INDENT}global ${names.join(', ')}\n` : ''
  }

  /** The bottom of the program: run `on start`, then loop over everything else. */
  private runner(): string {
    const I = this.INDENT
    const of = (kind: HatKind, on?: string) =>
      this.hats.filter((h) => h.kind === kind && (on === undefined || h.on === on))
    const calls = (hats: Hat[], depth: number) => hats.map((h) => `${I.repeat(depth)}${h.fn}()`)

    const top = calls(of('start'), 0)
    const setup: string[] = []
    const loop: string[] = []

    // Buttons. Each flag is read once per pass, so A+B does not also fire A and B.
    const [a, b, ab] = [of('button', 'A'), of('button', 'B'), of('button', 'AB')]
    if (a.length || ab.length) loop.push('_a = button_a.was_pressed()')
    if (b.length || ab.length) loop.push('_b = button_b.was_pressed()')
    const single = (depth: number) => [
      ...(a.length ? [`${I.repeat(depth)}if _a:`, ...calls(a, depth + 1)] : []),
      ...(b.length ? [`${I.repeat(depth)}if _b:`, ...calls(b, depth + 1)] : []),
    ]
    if (ab.length) {
      loop.push('if _a and _b:', ...calls(ab, 1))
      if (a.length || b.length) loop.push('else:', ...single(1))
    } else {
      loop.push(...single(0))
    }

    for (const gesture of unique(of('gesture'))) {
      loop.push(`if accelerometer.was_gesture('${gesture}'):`, ...calls(of('gesture', gesture), 1))
    }

    // Touch fires once per touch, not on every pass while a finger is down.
    for (const pin of unique(of('pin'))) {
      setup.push(`_${pin}_was = False`)
      loop.push(
        `_${pin}_now = ${pin}.is_touched()`,
        `if _${pin}_now and not _${pin}_was:`,
        ...calls(of('pin', pin), 1),
        `_${pin}_was = _${pin}_now`,
      )
    }

    if (of('radio').length) {
      this.need('import_radio', 'import radio')
      this.need('radio_message', "radio_message = ''")
      setup.push('radio.on()')
      loop.push(
        '_incoming = radio.receive()',
        'if _incoming is not None:',
        `${I}radio_message = _incoming`,
        ...calls(of('radio'), 1),
      )
    }

    for (const timer of of('every')) {
      setup.push(`_${timer.fn}_at = running_time()`)
      loop.push(
        `if running_time() >= _${timer.fn}_at:`,
        `${I}_${timer.fn}_at = running_time() + ${timer.on}`,
        `${I}${timer.fn}()`,
      )
    }

    loop.push(...calls(of('forever'), 0))

    if (!loop.length) return top.join('\n')
    return [...top, ...setup, 'while True:', ...loop.map((line) => I + line)].join('\n')
  }
}

function unique(hats: Hat[]): string[] {
  return [...new Set(hats.map((h) => h.on ?? ''))]
}

/** Five digits 0-9; anything else becomes an off pixel. */
function cleanRow(raw: string): string {
  return (raw || '')
    .replace(/[^0-9]/g, '0')
    .padEnd(5, '0')
    .slice(0, 5)
}

const SHOW_NUMBER = `def show_number(n):
    text = str(n)
    if len(text) == 1:
        display.show(text)
    else:
        display.scroll(text)`

const MUSIC_NOTE = `_NOTES = {'C4': 262, 'D4': 294, 'E4': 330, 'F4': 349, 'G4': 392, 'A4': 440, 'B4': 494, 'C5': 523}

def music_note(name):
    return _NOTES.get(name, 440)`

function installMicrobitGenerators(py: MicroPythonGenerator) {
  const g = py.forBlock

  const value = (block: Blockly.Block, name: string, fallback: string) =>
    py.valueToCode(block, name, Order.NONE) || fallback
  const field = (block: Blockly.Block, name: string) => String(block.getFieldValue(name))
  const music = () => py.need('import_music', 'import music')
  const radio = () => py.need('import_radio', 'import radio')

  // Starting points
  g.mb_on_start = (block) => py.hat(block, 'start', 'on_start')
  g.mb_forever = (block) => py.hat(block, 'forever', 'forever')
  g.mb_on_button = (block) => {
    const button = field(block, 'BUTTON')
    return py.hat(block, 'button', `on_button_${button.toLowerCase()}`, button)
  }
  g.mb_on_gesture = (block) => {
    const gesture = field(block, 'GESTURE')
    return py.hat(block, 'gesture', `on_${gesture.replace(/\s+/g, '_')}`, gesture)
  }
  g.mb_on_pin = (block) => {
    const pin = field(block, 'PIN')
    return py.hat(block, 'pin', `on_${pin}_pressed`, pin)
  }
  g.mb_on_radio = (block) => {
    radio()
    return py.hat(block, 'radio', 'on_radio_received')
  }
  g.mb_every = (block) => {
    const ms = Math.max(1, Math.round(Number(block.getFieldValue('MS')) || 500))
    return py.hat(block, 'every', `every_${ms}ms`, String(ms))
  }

  // Basic
  g.mb_show_string = (block) => `display.scroll(str(${value(block, 'TEXT', "''")}))\n`
  g.mb_show_number = (block) => {
    py.need('show_number', SHOW_NUMBER)
    return `show_number(${value(block, 'NUM', '0')})\n`
  }
  g.mb_show_icon = (block) => `display.show(Image.${field(block, 'ICON')})\n`
  g.mb_show_leds = (block) => {
    const rows = [0, 1, 2, 3, 4].map((i) => cleanRow(field(block, `ROW${i}`)))
    return `display.show(Image('${rows.join(':')}'))\n`
  }
  g.mb_clear = () => 'display.clear()\n'
  g.mb_pause = (block) => `sleep(${value(block, 'MS', '100')})\n`
  g.mb_print = (block) => `print(${value(block, 'TEXT', "''")})\n`

  // Input
  g.mb_button_pressed = (block) => [`${field(block, 'BUTTON')}.is_pressed()`, Order.FUNCTION_CALL]
  g.mb_button_was_pressed = (block) => [
    `${field(block, 'BUTTON')}.was_pressed()`,
    Order.FUNCTION_CALL,
  ]
  g.mb_gesture = (block) => [
    `accelerometer.is_gesture('${field(block, 'GESTURE')}')`,
    Order.FUNCTION_CALL,
  ]
  g.mb_was_gesture = (block) => [
    `accelerometer.was_gesture('${field(block, 'GESTURE')}')`,
    Order.FUNCTION_CALL,
  ]
  g.mb_acceleration = (block) => [
    `accelerometer.get_${field(block, 'AXIS')}()`,
    Order.FUNCTION_CALL,
  ]
  g.mb_temperature = () => ['temperature()', Order.FUNCTION_CALL]
  g.mb_light_level = () => ['display.read_light_level()', Order.FUNCTION_CALL]
  g.mb_sound_level = () => ['microphone.sound_level()', Order.FUNCTION_CALL]
  g.mb_compass_heading = () => ['compass.heading()', Order.FUNCTION_CALL]
  g.mb_running_time = () => ['running_time()', Order.FUNCTION_CALL]
  g.mb_pin_touched = (block) => [`${field(block, 'PIN')}.is_touched()`, Order.FUNCTION_CALL]

  // Music
  g.mb_play_melody = (block) => {
    music()
    return `music.play(music.${field(block, 'MELODY')})\n`
  }
  g.mb_play_note = (block) => {
    music()
    py.need('music_note', MUSIC_NOTE)
    return `music.pitch(music_note('${field(block, 'NOTE')}'), ${value(block, 'MS', '500')})\n`
  }
  g.mb_play_tone = (block) => {
    music()
    return `music.pitch(${value(block, 'HZ', '440')}, ${value(block, 'MS', '500')})\n`
  }
  g.mb_play_sound = (block) => `audio.play(Sound.${field(block, 'SOUND')})\n`
  g.mb_set_volume = (block) => `set_volume(${value(block, 'VOLUME', '128')})\n`
  g.mb_stop_music = () => {
    music()
    return 'music.stop()\n'
  }

  // LED
  g.mb_plot = (block) =>
    `display.set_pixel(${value(block, 'X', '0')}, ${value(block, 'Y', '0')}, 9)\n`
  g.mb_plot_brightness = (block) =>
    `display.set_pixel(${value(block, 'X', '0')}, ${value(block, 'Y', '0')}, ${value(block, 'LEVEL', '9')})\n`
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
  g.mb_radio_on = (block) => {
    radio()
    return `radio.config(group=${value(block, 'GROUP', '0')})\nradio.on()\n`
  }
  g.mb_radio_send = (block) => {
    radio()
    return `radio.send(str(${value(block, 'MSG', "''")}))\n`
  }
  g.mb_radio_message = () => {
    py.need('radio_message', "radio_message = ''")
    return ['radio_message', Order.ATOMIC]
  }
  g.mb_radio_receive = () => {
    radio()
    return ['radio.receive()', Order.FUNCTION_CALL]
  }

  // Pins
  g.mb_digital_write = (block) => `${field(block, 'PIN')}.write_digital(${field(block, 'VALUE')})\n`
  g.mb_digital_read = (block) => [`${field(block, 'PIN')}.read_digital()`, Order.FUNCTION_CALL]
  g.mb_analog_write = (block) =>
    `${field(block, 'PIN')}.write_analog(${value(block, 'VALUE', '0')})\n`
  g.mb_analog_read = (block) => [`${field(block, 'PIN')}.read_analog()`, Order.FUNCTION_CALL]
  g.mb_servo_write = (block) => {
    const pin = field(block, 'PIN')
    const angle = value(block, 'ANGLE', '90')
    // 50 Hz servo pulse: 0.5 ms (0°) to 2.5 ms (180°) out of a 20 ms period.
    return `${pin}.set_analog_period(20)\n${pin}.write_analog(26 + (${angle}) * 102 // 180)\n`
  }

  // Blockly's own `change by` guards against a non-number with
  // `isinstance(x, Number)`. Variables start at 0 here, so the plain form is
  // both correct and the one a student would write.
  g.math_change = (block) => {
    const name = py.getVariableName(field(block, 'VAR'))
    return `${name} += ${py.valueToCode(block, 'DELTA', Order.ADDITIVE) || '0'}\n`
  }
}

let shared: MicroPythonGenerator | null = null

/** The MicroPython for everything on a workspace. */
export function workspaceToMicroPython(workspace: Blockly.Workspace): string {
  shared ??= new MicroPythonGenerator()
  return shared.workspaceToCode(workspace)
}
