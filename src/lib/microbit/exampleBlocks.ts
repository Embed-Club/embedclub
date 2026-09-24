/**
 * Shorthand for writing Blockly workspace JSON by hand, shared by the example
 * lists. Each helper returns the exact shape `Blockly.serialization` loads, so
 * an example reads as a program rather than as nested JSON.
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

export type BlockJson = Record<string, unknown>

/** An editable number slot, like the ones dragged out of the toolbox. */
export const num = (NUM: number) => ({ shadow: { type: 'math_number', fields: { NUM } } })
export const text = (TEXT: string) => ({ shadow: { type: 'text', fields: { TEXT } } })
export const variable = (id: string) => ({ VAR: { id } })

/** A block plugged into an input. */
export const plug = (block: BlockJson) => ({ block })

export const getVar = (id: string): BlockJson => ({ type: 'variables_get', fields: variable(id) })
export const setVar = (id: string, value: BlockJson): BlockJson => ({
  type: 'variables_set',
  fields: variable(id),
  inputs: { VALUE: plug(value) },
})
export const number = (NUM: number): BlockJson => ({ type: 'math_number', fields: { NUM } })

/** `a OP b`, where OP is one of Blockly's EQ, NEQ, LT, LTE, GT, GTE. */
export const compare = (OP: string, A: BlockJson, B: BlockJson): BlockJson => ({
  type: 'logic_compare',
  fields: { OP },
  inputs: { A: plug(A), B: plug(B) },
})

/**
 * An if / else if / else chain. Each branch is [condition, body]; `otherwise`
 * becomes the final else.
 */
export function ifElse(branches: [BlockJson, BlockJson[]][], otherwise?: BlockJson[]): BlockJson {
  const inputs: Record<string, unknown> = {}
  branches.forEach(([condition, body], i) => {
    inputs[`IF${i}`] = plug(condition)
    const first = stack(...body)
    if (first) inputs[`DO${i}`] = plug(first)
  })
  const last = otherwise ? stack(...otherwise) : undefined
  if (last) inputs.ELSE = plug(last)
  return {
    type: 'controls_if',
    extraState: {
      ...(branches.length > 1 ? { elseIfCount: branches.length - 1 } : {}),
      ...(otherwise ? { hasElse: true } : {}),
    },
    inputs,
  }
}

/** Stack blocks top to bottom, each one's `next` the block after it. */
export function stack(...blocks: BlockJson[]): BlockJson | undefined {
  return blocks.reduceRight<BlockJson | undefined>(
    (next, block) => (next ? { ...block, next: { block: next } } : block),
    undefined,
  )
}

/** A hat block at a spot on the canvas, holding a stack. */
export function script(
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

export function workspace(blocks: BlockJson[], variables: string[] = []): object {
  return {
    blocks: { languageVersion: 0, blocks },
    ...(variables.length ? { variables: variables.map((name) => ({ name, id: name })) } : {}),
  }
}

export const pause = (ms: number) => ({ type: 'mb_pause', inputs: { MS: num(ms) } })
export const icon = (ICON: string) => ({ type: 'mb_show_icon', fields: { ICON } })
export const leds = (rows: string) => {
  const [ROW0, ROW1, ROW2, ROW3, ROW4] = rows.split(':')
  return { type: 'mb_show_leds', fields: { ROW0, ROW1, ROW2, ROW3, ROW4 } }
}
export const showNumber = (value: BlockJson): BlockJson => ({
  type: 'mb_show_number',
  inputs: { NUM: plug(value) },
})
