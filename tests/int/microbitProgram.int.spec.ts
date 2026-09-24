import { defineMicrobitBlocks } from '@/lib/microbit/blocks'
import { EXAMPLES } from '@/lib/microbit/examples'
import { workspaceToMicroPython } from '@/lib/microbit/generator'
import { SENSOR_EXAMPLES } from '@/lib/microbit/sensorExamples'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import * as En from 'blockly/msg/en'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * What the blocks turn into is what runs on the board, and a crash there only
 * shows up as a scrolling error on a 5x5 screen. These pin down the Python for
 * the programs students actually build.
 */
function generate(state: object): string {
  const workspace = new Blockly.Workspace()
  try {
    Blockly.serialization.workspaces.load(state, workspace)
    return workspaceToMicroPython(workspace)
  } finally {
    workspace.dispose()
  }
}

describe('workspaceToMicroPython', () => {
  beforeAll(() => {
    Blockly.setLocale(En as unknown as Record<string, string>)
    defineMicrobitBlocks()
  })

  it('runs a counter without the desktop-only numbers module', () => {
    // The program that crashed with "line 10": a variable changed inside
    // forever. Blockly's stock generator imported `numbers` and started the
    // variable at None.
    const python = generate({
      variables: [{ name: 'count', id: 'count' }],
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'mb_forever',
            x: 0,
            y: 0,
            inputs: {
              DO: {
                block: {
                  type: 'mb_show_number',
                  inputs: {
                    NUM: { block: { type: 'variables_get', fields: { VAR: { id: 'count' } } } },
                  },
                  next: {
                    block: {
                      type: 'controls_if',
                      inputs: {
                        IF0: {
                          block: { type: 'mb_button_pressed', fields: { BUTTON: 'button_a' } },
                        },
                        DO0: {
                          block: {
                            type: 'math_change',
                            fields: { VAR: { id: 'count' } },
                            inputs: {
                              DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
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
    })

    expect(python).not.toContain('numbers')
    expect(python).not.toContain('None')
    expect(python).toMatch(/^count = 0$/m)
    expect(python).toContain('count += 1')
    expect(python).toContain('def forever():\n    global count\n')
    expect(python).toMatch(/while True:\n {4}forever\(\)\n$/)
  })

  it('runs on start first, then polls events inside one loop', () => {
    const counter = EXAMPLES.find((example) => example.id === 'counter')
    const python = generate(counter?.blocks ?? {})

    const start = python.indexOf('on_start()\n')
    const loop = python.indexOf('while True:')
    expect(start).toBeGreaterThan(-1)
    expect(loop).toBeGreaterThan(start)
    expect(python).toContain('_a = button_a.was_pressed()')
    expect(python).toContain('if _a:\n        on_button_a()')
    expect(python).toContain('if _b:\n        on_button_b()')
  })

  it('only imports what the program uses', () => {
    const heartbeat = generate(EXAMPLES[0].blocks)
    expect(heartbeat.startsWith('from microbit import *\n')).toBe(true)
    expect(heartbeat).not.toContain('import music')
    expect(heartbeat).not.toContain('import radio')

    const radio = generate(EXAMPLES.find((example) => example.id === 'radioChat')?.blocks ?? {})
    expect(radio).toContain('import radio')
    expect(radio).toContain("radio_message = ''")
    expect(radio).toContain('radio_message = _incoming')
  })

  it('turns the compass example into an if / elif / else chain', () => {
    const python = generate(EXAMPLES.find((example) => example.id === 'compass')?.blocks ?? {})
    expect(python).toContain('heading = compass.heading()')
    expect(python).toMatch(/if heading < 45 or heading >= 315:/)
    expect(python).toContain('elif heading < 135:')
    expect(python).toContain('display.show(Image.ARROW_E)')
  })

  // A class often has V1 and V2 boards side by side; these have to run on both.
  it.each(SENSOR_EXAMPLES.map((example) => [example.id, example] as const))(
    'keeps the %s example to V1 hardware',
    (_id, example) => {
      for (const python of [generate(example.blocks), example.python]) {
        expect(python).not.toMatch(/microphone|speaker|audio|Sound\.|set_volume|pin_logo/)
      }
    },
  )

  it.each(EXAMPLES.map((example) => [example.id, example] as const))(
    'generates the %s example',
    (_id, example) => {
      const python = generate(example.blocks)
      expect(python).toContain('from microbit import *')
      expect(python).not.toContain('numbers')
      expect(python).not.toContain('pass\n\n\nwhile')
      // Every example actually does something, so each one ends in a call or a loop.
      expect(python.trim().length).toBeGreaterThan(40)
    },
  )
})
