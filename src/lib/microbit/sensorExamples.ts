/**
 * Examples built on the board's sensors - compass, accelerometer and touch
 * pins. Every one runs on a V1 micro:bit: none of them needs the V2
 * microphone, speaker or touch logo, so a class with a mix of boards can all
 * flash the same thing.
 */

import {
  type BlockJson,
  type MicrobitExample,
  compare,
  getVar,
  icon,
  ifElse,
  leds,
  num,
  number,
  pause,
  plug,
  script,
  setVar,
  showNumber,
  variable,
  workspace,
} from './exampleBlocks'

const either = (A: BlockJson, B: BlockJson): BlockJson => ({
  type: 'logic_operation',
  fields: { OP: 'OR' },
  inputs: { A: plug(A), B: plug(B) },
})

const randomInt = (from: number, to: number): BlockJson => ({
  type: 'math_random_int',
  inputs: { FROM: num(from), TO: num(to) },
})

/** One tilt axis turned into an LED column or row: 0 at one edge, 4 at the other. */
const tiltToLed = (axis: 'x' | 'y'): BlockJson => ({
  type: 'math_constrain',
  inputs: {
    VALUE: plug({
      type: 'math_arithmetic',
      fields: { OP: 'ADD' },
      inputs: {
        A: plug({
          type: 'math_round',
          fields: { OP: 'ROUND' },
          inputs: {
            NUM: plug({
              type: 'math_arithmetic',
              fields: { OP: 'DIVIDE' },
              inputs: {
                A: plug({ type: 'mb_acceleration', fields: { AXIS: axis } }),
                B: num(256),
              },
            }),
          },
        }),
        B: num(2),
      },
    }),
    LOW: num(0),
    HIGH: num(4),
  },
})

const ROCK = '00000:09990:09990:09990:00000'
const PAPER = '99999:90009:90009:90009:99999'
const SCISSORS = '99009:99090:00900:99090:99009'

export const SENSOR_EXAMPLES: MicrobitExample[] = [
  {
    id: 'compass',
    name: 'Compass',
    description: 'An arrow that always points north. Tilt to fill the screen the first time.',
    preview: '00900:09990:90909:00900:00900',
    blocks: workspace(
      [
        script(
          'mb_forever',
          [40, 40],
          [
            setVar('heading', { type: 'mb_compass_heading' }),
            // Facing north, north is ahead. Facing east, it is on your left.
            ifElse(
              [
                [
                  either(
                    compare('LT', getVar('heading'), number(45)),
                    compare('GTE', getVar('heading'), number(315)),
                  ),
                  [icon('ARROW_N')],
                ],
                [compare('LT', getVar('heading'), number(135)), [icon('ARROW_W')]],
                [compare('LT', getVar('heading'), number(225)), [icon('ARROW_S')]],
              ],
              [icon('ARROW_E')],
            ),
            pause(100),
          ],
        ),
      ],
      ['heading'],
    ),
    python: `from microbit import *

# The first time the compass is read, the board asks to be calibrated:
# tilt it around until every LED is lit.

while True:
    heading = compass.heading()

    # Image.ALL_ARROWS runs N, NE, E, SE, S, SW, W, NW. North is \`heading\`
    # degrees anticlockwise of where the board points, so count backwards.
    needle = (360 - heading + 22) // 45 % 8
    display.show(Image.ALL_ARROWS[needle])
    sleep(100)
`,
  },
  {
    id: 'marble',
    name: 'Rolling marble',
    description: 'Tilt the board and a dot rolls downhill. Hold it flat to bring it home.',
    preview: '00000:00100:00030:00009:00000',
    blocks: workspace(
      [
        script(
          'mb_forever',
          [40, 40],
          [
            setVar('x', tiltToLed('x')),
            setVar('y', tiltToLed('y')),
            { type: 'mb_clear' },
            { type: 'mb_plot', inputs: { X: plug(getVar('x')), Y: plug(getVar('y')) } },
            pause(50),
          ],
        ),
      ],
      ['x', 'y'],
    ),
    python: `from microbit import *

def to_led(reading):
    # About 30 degrees of tilt reads as 512, so this gives -2 to 2,
    # shifted to 0 to 4 and kept on the screen.
    return min(4, max(0, round(reading / 256) + 2))

while True:
    x = to_led(accelerometer.get_x())
    y = to_led(accelerometer.get_y())
    display.clear()
    display.set_pixel(x, y, 9)
    sleep(50)
`,
  },
  {
    id: 'stepCounter',
    name: 'Step counter',
    description: 'Clip it to your shoe. Every shake is a step; press A to see the count.',
    preview: '00099:00099:99000:99000:00000',
    blocks: workspace(
      [
        script('mb_on_start', [40, 40], [setVar('steps', number(0))]),
        script(
          'mb_on_gesture',
          [40, 200],
          [{ type: 'math_change', fields: variable('steps'), inputs: { DELTA: num(1) } }],
          { GESTURE: 'shake' },
        ),
        script('mb_on_button', [40, 360], [showNumber(getVar('steps'))], { BUTTON: 'A' }),
      ],
      ['steps'],
    ),
    python: `from microbit import *

steps = 0

while True:
    if accelerometer.was_gesture('shake'):
        steps += 1

    # Scrolling the number takes a while, so only do it when asked -
    # otherwise the steps taken while it scrolls would not count.
    if button_a.was_pressed():
        display.scroll(steps)
`,
  },
  {
    id: 'rockPaperScissors',
    name: 'Rock paper scissors',
    description: 'Shake to throw. Play against a friend with a board of their own.',
    preview: SCISSORS,
    blocks: workspace(
      [
        script(
          'mb_on_gesture',
          [40, 40],
          [
            setVar('hand', randomInt(1, 3)),
            ifElse(
              [
                [compare('EQ', getVar('hand'), number(1)), [leds(ROCK)]],
                [compare('EQ', getVar('hand'), number(2)), [leds(PAPER)]],
              ],
              [leds(SCISSORS)],
            ),
          ],
          { GESTURE: 'shake' },
        ),
      ],
      ['hand'],
    ),
    python: `from microbit import *
import random

ROCK = Image('${ROCK}')
PAPER = Image('${PAPER}')
SCISSORS = Image('${SCISSORS}')

while True:
    if accelerometer.was_gesture('shake'):
        display.show(random.choice([ROCK, PAPER, SCISSORS]))
`,
  },
  {
    id: 'loveMeter',
    name: 'Love meter',
    description: 'Hold GND in one hand, touch pin 0 with the other, and get a score out of 100.',
    preview: '09090:95959:95559:09590:00900',
    blocks: workspace([
      script('mb_on_start', [40, 40], [icon('HEART')]),
      script('mb_on_pin', [40, 200], [showNumber(randomInt(0, 100)), pause(1000), icon('HEART')], {
        PIN: 'pin0',
      }),
    ]),
    python: `from microbit import *
import random

display.show(Image.HEART)

while True:
    # The touch goes through you: one hand on GND, one on pin 0.
    if pin0.is_touched():
        display.scroll(random.randint(0, 100))
        sleep(1000)
        display.show(Image.HEART)
`,
  },
]
