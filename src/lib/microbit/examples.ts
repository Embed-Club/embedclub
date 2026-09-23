/**
 * Ready-made programs for the micro:bit studio. Each one comes as blocks and
 * as hand-written Python, so the example matches whichever editor is open.
 * The Python is written the way a person would write it rather than copied
 * from the blocks' output - it is meant to be read and learned from.
 */

export interface MicrobitExample {
  id: string
  name: string
  description: string
  /** Five rows of five brightness digits, drawn as the card's LED preview. */
  preview: string
  blocks: object
  python: string
}

type BlockJson = Record<string, unknown>

const num = (NUM: number) => ({ shadow: { type: 'math_number', fields: { NUM } } })
const text = (TEXT: string) => ({ shadow: { type: 'text', fields: { TEXT } } })
const variable = (id: string) => ({ VAR: { id } })

/** Stack blocks top to bottom, each one's `next` the block after it. */
function stack(...blocks: BlockJson[]): BlockJson | undefined {
  return blocks.reduceRight<BlockJson | undefined>(
    (next, block) => (next ? { ...block, next: { block: next } } : block),
    undefined,
  )
}

/** A hat block at a spot on the canvas, holding a stack. */
function script(
  type: string,
  at: [number, number],
  body: BlockJson[],
  fields?: Record<string, unknown>,
): BlockJson {
  const first = stack(...body)
  return {
    type,
    x: at[0],
    y: at[1],
    ...(fields ? { fields } : {}),
    ...(first ? { inputs: { DO: { block: first } } } : {}),
  }
}

function workspace(blocks: BlockJson[], variables: string[] = []): object {
  return {
    blocks: { languageVersion: 0, blocks },
    ...(variables.length ? { variables: variables.map((name) => ({ name, id: name })) } : {}),
  }
}

const pause = (ms: number) => ({ type: 'mb_pause', inputs: { MS: num(ms) } })
const icon = (ICON: string) => ({ type: 'mb_show_icon', fields: { ICON } })
const leds = (rows: string) => {
  const [ROW0, ROW1, ROW2, ROW3, ROW4] = rows.split(':')
  return { type: 'mb_show_leds', fields: { ROW0, ROW1, ROW2, ROW3, ROW4 } }
}

const HAND = '00900:00900:09990:99999:09990'

export const EXAMPLES: MicrobitExample[] = [
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    description: 'A heart that beats forever. The one every micro:bit starts with.',
    preview: '09090:99999:99999:09990:00900',
    blocks: workspace([
      script('mb_forever', [40, 40], [icon('HEART'), pause(500), icon('HEART_SMALL'), pause(500)]),
    ]),
    python: `from microbit import *

while True:
    display.show(Image.HEART)
    sleep(500)
    display.show(Image.HEART_SMALL)
    sleep(500)
`,
  },
  {
    id: 'counter',
    name: 'Button counter',
    description: 'A adds one, B starts again from zero. Your first variable.',
    preview: '00900:09900:00900:00900:09990',
    blocks: workspace(
      [
        script(
          'mb_on_start',
          [40, 40],
          [
            {
              type: 'variables_set',
              fields: variable('count'),
              inputs: { VALUE: { block: { type: 'math_number', fields: { NUM: 0 } } } },
            },
          ],
        ),
        script(
          'mb_on_button',
          [40, 200],
          [{ type: 'math_change', fields: variable('count'), inputs: { DELTA: num(1) } }],
          { BUTTON: 'A' },
        ),
        script(
          'mb_on_button',
          [40, 360],
          [
            {
              type: 'variables_set',
              fields: variable('count'),
              inputs: { VALUE: { block: { type: 'math_number', fields: { NUM: 0 } } } },
            },
          ],
          { BUTTON: 'B' },
        ),
        script(
          'mb_forever',
          [400, 40],
          [
            {
              type: 'mb_show_number',
              inputs: {
                NUM: { block: { type: 'variables_get', fields: variable('count') } },
              },
            },
          ],
        ),
      ],
      ['count'],
    ),
    python: `from microbit import *

count = 0

while True:
    if button_a.was_pressed():
        count += 1
    if button_b.was_pressed():
        count = 0

    # One digit fits on the screen; bigger numbers have to scroll.
    if count < 10:
        display.show(count)
    else:
        display.scroll(count)
`,
  },
  {
    id: 'dice',
    name: 'Shake dice',
    description: 'Shake the board to roll a number from 1 to 6.',
    preview: '90009:00000:00900:00000:90009',
    blocks: workspace([
      script(
        'mb_on_gesture',
        [40, 40],
        [
          {
            type: 'mb_show_number',
            inputs: {
              NUM: {
                block: {
                  type: 'math_random_int',
                  inputs: { FROM: num(1), TO: num(6) },
                },
              },
            },
          },
        ],
        { GESTURE: 'shake' },
      ),
    ]),
    python: `from microbit import *
import random

display.show('?')

while True:
    if accelerometer.was_gesture('shake'):
        display.show(random.randint(1, 6))
`,
  },
  {
    id: 'thermometer',
    name: 'Thermometer',
    description: 'Shows the temperature in °C, updated every second.',
    preview: '00900:00900:00900:09990:09990',
    blocks: workspace([
      script(
        'mb_forever',
        [40, 40],
        [
          { type: 'mb_show_number', inputs: { NUM: { block: { type: 'mb_temperature' } } } },
          pause(1000),
        ],
      ),
    ]),
    python: `from microbit import *

while True:
    display.scroll(temperature())
    sleep(1000)
`,
  },
  {
    id: 'nightLight',
    name: 'Night light',
    description: 'The LEDs switch on by themselves when the room goes dark.',
    preview: '00990:09900:09900:09900:00990',
    blocks: workspace([
      script(
        'mb_forever',
        [40, 40],
        [
          {
            type: 'controls_if',
            extraState: { hasElse: true },
            inputs: {
              IF0: {
                block: {
                  type: 'logic_compare',
                  fields: { OP: 'LT' },
                  inputs: {
                    A: { block: { type: 'mb_light_level' } },
                    B: { block: { type: 'math_number', fields: { NUM: 30 } } },
                  },
                },
              },
              DO0: { block: leds('99999:99999:99999:99999:99999') },
              ELSE: { block: { type: 'mb_clear' } },
            },
          },
          pause(200),
        ],
      ),
    ]),
    python: `from microbit import *

ALL_ON = Image('99999:99999:99999:99999:99999')

while True:
    if display.read_light_level() < 30:
        display.show(ALL_ON)
    else:
        display.clear()
    sleep(200)
`,
  },
  {
    id: 'musicBox',
    name: 'Music box',
    description: 'A plays a tune, B plays another. Needs a speaker or a V2 board.',
    preview: '00990:00909:00900:99900:99900',
    blocks: workspace([
      script('mb_on_start', [40, 40], [icon('MUSIC_QUAVER')]),
      script(
        'mb_on_button',
        [40, 200],
        [{ type: 'mb_play_melody', fields: { MELODY: 'ENTERTAINER' } }],
        { BUTTON: 'A' },
      ),
      script(
        'mb_on_button',
        [40, 360],
        [{ type: 'mb_play_melody', fields: { MELODY: 'BIRTHDAY' } }],
        { BUTTON: 'B' },
      ),
    ]),
    python: `from microbit import *
import music

display.show(Image.MUSIC_QUAVER)

while True:
    if button_a.was_pressed():
        music.play(music.ENTERTAINER)
    if button_b.was_pressed():
        music.play(music.BIRTHDAY)
`,
  },
  {
    id: 'radioChat',
    name: 'Radio chat',
    description: 'Flash two boards. Press A on one and the other one reads it.',
    preview: '99999:00000:09990:00000:00900',
    blocks: workspace([
      script('mb_on_start', [40, 40], [{ type: 'mb_radio_on', inputs: { GROUP: num(1) } }]),
      script(
        'mb_on_button',
        [40, 200],
        [{ type: 'mb_radio_send', inputs: { MSG: text('hello') } }],
        { BUTTON: 'A' },
      ),
      script(
        'mb_on_radio',
        [40, 360],
        [{ type: 'mb_show_string', inputs: { TEXT: { block: { type: 'mb_radio_message' } } } }],
      ),
    ]),
    python: `from microbit import *
import radio

radio.config(group=1)
radio.on()

while True:
    if button_a.was_pressed():
        radio.send('hello')

    message = radio.receive()
    if message:
        display.scroll(message)
`,
  },
  {
    id: 'special',
    name: 'Special',
    description: 'No spoilers. Flash it and see.',
    preview: '09990:90009:00990:00000:00900',
    blocks: workspace([
      script('mb_forever', [40, 40], [leds(HAND), pause(1000), { type: 'mb_clear' }, pause(400)]),
    ]),
    python: `from microbit import *

SPECIAL = Image('${HAND}')

while True:
    display.show(SPECIAL)
    sleep(1000)
    display.clear()
    sleep(400)
`,
  },
]

/** What a fresh project opens with. */
export const STARTER_EXAMPLE = EXAMPLES[0]
