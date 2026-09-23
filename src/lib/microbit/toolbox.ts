import type * as Blockly from 'blockly/core'
import { HUE } from './blocks'

/**
 * The block palette. Each category is listed once here and feeds both
 * Blockly's toolbox (which fills the flyout) and the category rail the studio
 * draws itself, so the two can never disagree about what exists.
 */

type ToolboxItem = Blockly.utils.toolbox.ToolboxItemInfo

export interface StudioCategory {
  /** Blockly's `toolboxitemid`, and the key the rail picks an icon by. */
  id: string
  name: string
  /** Board blocks, or Blockly's general programming blocks. */
  group: 'board' | 'code'
  /** A Blockly hue for our blocks, or a theme category style for Blockly's. */
  hue?: number
  style?: string
  contents?: ToolboxItem[]
  /** Blockly builds these flyouts itself (variables, functions). */
  custom?: 'VARIABLE' | 'PROCEDURE'
}

const num = (NUM: number) => ({ shadow: { type: 'math_number', fields: { NUM } } })
const text = (TEXT: string) => ({ shadow: { type: 'text', fields: { TEXT } } })
const block = (type: string, extra: Record<string, unknown> = {}): ToolboxItem => ({
  kind: 'block',
  type,
  ...extra,
})
const xy = () => ({ X: num(2), Y: num(2) })

export const CATEGORIES: StudioCategory[] = [
  {
    id: 'basic',
    name: 'Basic',
    group: 'board',
    hue: HUE.basic,
    contents: [
      block('mb_on_start'),
      block('mb_forever'),
      block('mb_show_icon'),
      block('mb_show_leds'),
      block('mb_show_string', { inputs: { TEXT: text('Hello!') } }),
      block('mb_show_number', { inputs: { NUM: num(0) } }),
      block('mb_clear'),
      block('mb_pause', { inputs: { MS: num(100) } }),
      block('mb_print', { inputs: { TEXT: text('hello') } }),
    ],
  },
  {
    id: 'input',
    name: 'Input',
    group: 'board',
    hue: HUE.input,
    contents: [
      block('mb_on_button'),
      block('mb_on_gesture'),
      block('mb_on_pin'),
      block('mb_button_pressed'),
      block('mb_button_was_pressed'),
      block('mb_gesture'),
      block('mb_was_gesture'),
      block('mb_pin_touched'),
      block('mb_acceleration'),
      block('mb_temperature'),
      block('mb_light_level'),
      block('mb_sound_level'),
      block('mb_compass_heading'),
      block('mb_running_time'),
    ],
  },
  {
    id: 'music',
    name: 'Music',
    group: 'board',
    hue: HUE.music,
    contents: [
      block('mb_play_melody'),
      block('mb_play_note', { inputs: { MS: num(500) } }),
      block('mb_play_tone', { inputs: { HZ: num(440), MS: num(500) } }),
      block('mb_play_sound'),
      block('mb_set_volume', { inputs: { VOLUME: num(128) } }),
      block('mb_stop_music'),
    ],
  },
  {
    id: 'led',
    name: 'LED',
    group: 'board',
    hue: HUE.led,
    contents: [
      block('mb_plot', { inputs: xy() }),
      block('mb_plot_brightness', { inputs: { ...xy(), LEVEL: num(5) } }),
      block('mb_unplot', { inputs: xy() }),
      block('mb_toggle', { inputs: xy() }),
      block('mb_point', { inputs: xy() }),
    ],
  },
  {
    id: 'radio',
    name: 'Radio',
    group: 'board',
    hue: HUE.radio,
    contents: [
      block('mb_radio_on', { inputs: { GROUP: num(1) } }),
      block('mb_on_radio'),
      block('mb_radio_message'),
      block('mb_radio_send', { inputs: { MSG: text('hi') } }),
      block('mb_radio_receive'),
    ],
  },
  {
    id: 'pins',
    name: 'Pins',
    group: 'board',
    hue: HUE.pins,
    contents: [
      block('mb_digital_write'),
      block('mb_digital_read'),
      block('mb_analog_write', { inputs: { VALUE: num(512) } }),
      block('mb_analog_read'),
      block('mb_servo_write', { inputs: { ANGLE: num(90) } }),
    ],
  },
  {
    id: 'logic',
    name: 'Logic',
    group: 'code',
    style: 'logic_category',
    contents: [
      block('controls_if'),
      block('controls_if', { extraState: { hasElse: true } }),
      block('logic_compare'),
      block('logic_operation'),
      block('logic_negate'),
      block('logic_boolean'),
    ],
  },
  {
    id: 'loops',
    name: 'Loops',
    group: 'code',
    style: 'loop_category',
    contents: [
      block('mb_every'),
      block('controls_repeat_ext', { inputs: { TIMES: num(4) } }),
      block('controls_whileUntil'),
      block('controls_for', { inputs: { FROM: num(0), TO: num(4), BY: num(1) } }),
      block('controls_flow_statements'),
    ],
  },
  {
    id: 'math',
    name: 'Math',
    group: 'code',
    style: 'math_category',
    contents: [
      block('math_number'),
      block('math_arithmetic', { inputs: { A: num(1), B: num(1) } }),
      block('math_random_int', { inputs: { FROM: num(1), TO: num(10) } }),
      block('math_modulo', { inputs: { DIVIDEND: num(10), DIVISOR: num(3) } }),
      block('math_round', { inputs: { NUM: num(3.1) } }),
      block('math_constrain', { inputs: { VALUE: num(50), LOW: num(0), HIGH: num(100) } }),
      block('math_single'),
    ],
  },
  {
    id: 'text',
    name: 'Text',
    group: 'code',
    style: 'text_category',
    contents: [block('text'), block('text_join'), block('text_length')],
  },
  {
    id: 'variables',
    name: 'Variables',
    group: 'code',
    style: 'variable_category',
    custom: 'VARIABLE',
  },
  {
    id: 'functions',
    name: 'Functions',
    group: 'code',
    style: 'procedure_category',
    custom: 'PROCEDURE',
  },
]

export const TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: CATEGORIES.map((category) => ({
    kind: 'category',
    toolboxitemid: category.id,
    name: category.name,
    ...(category.hue === undefined
      ? { categorystyle: category.style }
      : { colour: String(category.hue) }),
    ...(category.custom ? { custom: category.custom } : { contents: category.contents ?? [] }),
  })),
}
