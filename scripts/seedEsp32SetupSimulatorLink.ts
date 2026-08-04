/**
 * Add the Arduino IDE simulator card to the "ESP32 Setup" tutorial.
 *
 *   pnpm tsx scripts/seedEsp32SetupSimulatorLink.ts
 *
 * Unlike the other seed scripts, this tutorial predates them — its content was
 * authored by hand in the admin, not by a script, so there is no CONTENT
 * constant here to own and re-run. This script only patches the one thing it
 * needs to: it fetches the live document, splices a simulator card in after
 * the "Download and Install Arduino IDE" step, and writes it back. Re-running
 * is a no-op if the card is already there.
 */
import 'dotenv/config'
import type { Tutorial } from '@/payload/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'
import { flushExit, simulatorId, simulatorLinkBlock } from './lib/learningSeed'

const SLUG = 'esp32-setup'
const STEP_HEADING = 'Download and Install Arduino IDE'

type Block = NonNullable<Tutorial['content']>[number]

/** Text of every heading node inside a textBlock's Lexical tree, concatenated. */
function headingText(block: Block): string {
  if (block.blockType !== 'textBlock') return ''
  const children = block.text?.root?.children ?? []
  return children
    .filter((node) => node.type === 'heading')
    .flatMap((node) => (node as { children?: { text?: string }[] }).children ?? [])
    .map((leaf) => leaf.text ?? '')
    .join('')
}

async function main() {
  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: 'tutorials',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const doc = found.docs[0]
  if (!doc) throw new Error(`no tutorial with slug "${SLUG}"`)

  const content = (doc.content ?? []) as Block[]

  if (content.some((block) => block.blockType === 'simulatorLinkBlock')) {
    console.log(`Simulator card already present on ${SLUG} — nothing to do.`)
    return
  }

  const stepIndex = content.findIndex((block) => headingText(block).includes(STEP_HEADING))
  if (stepIndex === -1) {
    throw new Error(`no block with a heading containing "${STEP_HEADING}"`)
  }

  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')
  const newContent = [
    ...content.slice(0, stepIndex + 1),
    simulatorLinkBlock(arduinoIdeSim, 'Download the Arduino IDE'),
    ...content.slice(stepIndex + 1),
  ]

  await payload.update({
    collection: 'tutorials',
    id: doc.id,
    data: { content: newContent },
    overrideAccess: true,
  })
  console.log(`Updated tutorial ${doc.id} (${SLUG}) with a simulator card after "${STEP_HEADING}".`)
  console.log(`View at /tutorials/${SLUG}`)
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
