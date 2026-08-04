/**
 * Seed the "ESP32-CAM Object Detection Setup" resource.
 *
 * Content is authored here rather than clicked into the admin, so it can be
 * reviewed in a diff and re-run. Re-running updates the existing document
 * (matched on slug) instead of creating duplicates.
 *
 * It targets whatever DATABASE_URL points at — which for this repo is the same
 * Neon instance production uses, so anything created here is live immediately.
 *
 *   pnpm seed:esp32cam
 */
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodeBlock } from '@/payload/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'
import { insertAfterCaption, simulatorId, simulatorLinkBlock } from './lib/learningSeed'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGE_PATH = path.resolve(dirname, '../public/esp32-cam.png')
/**
 * The live slug — the published document was renamed to this from the admin, so
 * the script follows it rather than renaming the page back and breaking the URL.
 */
const SLUG = 'esp32-cam-object-detection'
/** Previous slugs, so a re-run updates the existing document instead of leaving an orphan. */
const LEGACY_SLUGS = ['esp32-cam-object-detection-setup', 'esp32-cam-edge-impulse-object-detection']
/** Caption of the board-select code block — the simulator card anchors here. */
const BOARD_SELECT_CAPTION = 'esp32_camera.ino — select the board (required)'

/**
 * Filenames this script's own upload can produce: Payload rewrites the source
 * `esp32-cam.png` to webp and appends `-1`, `-2`… on name collision. Matched
 * case-sensitively on purpose, so an admin-uploaded `ESP32-CAM.webp` is never
 * mistaken for a leftover and deleted.
 */
const SEED_UPLOAD_NAME = /^esp32-cam(-\d+)?\.webp$/

// --- Lexical builders -------------------------------------------------------
// Payload stores rich text as a Lexical tree. These mirror the exact node shape
// the editor itself writes, so documents seeded here are indistinguishable from
// hand-authored ones and stay editable in the admin.

// `type` and `version` are required on every Lexical node by Payload's
// generated richText types, so they are named here rather than left to an
// open Record.
type Node = { [k: string]: unknown; type: string; version: number }

/** Text-format bitmask, matching Lexical. */
const BOLD = 1
const ITALIC = 2
const CODE = 16

function text(value: string, format = 0): Node {
  return { mode: 'normal', text: value, type: 'text', style: '', detail: 0, format, version: 1 }
}

const bold = (value: string) => text(value, BOLD)
const italic = (value: string) => text(value, ITALIC)
const code = (value: string) => text(value, CODE)

function heading(tag: 'h1' | 'h2' | 'h3', children: Node[], format = ''): Node {
  return { tag, type: 'heading', format, indent: 0, version: 1, children, direction: 'ltr' }
}

function paragraph(children: Node[], format = ''): Node {
  return {
    type: 'paragraph',
    format,
    indent: 0,
    version: 1,
    children,
    direction: 'ltr',
    textFormat: 0,
  }
}

function list(type: 'number' | 'bullet', items: Node[][]): Node {
  return {
    tag: type === 'number' ? 'ol' : 'ul',
    type: 'list',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    listType: type,
    direction: 'ltr',
    children: items.map((children, i) => ({
      type: 'listitem',
      value: i + 1,
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    })),
  }
}

/** Wrap top-level nodes in a Lexical root, ready for a richText field. */
function richText(children: Node[]) {
  // `as const` on format/direction: the root's own fields are typed as string
  // unions, and an unannotated literal widens to `string`.
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children,
    },
  }
}

const textBlock = (children: Node[]) => ({
  blockType: 'textBlock' as const,
  text: richText(children),
})

const codeBlock = (language: CodeBlock['language'], snippet: string, caption?: string) => ({
  blockType: 'codeBlock' as const,
  language,
  code: snippet,
  ...(caption ? { caption } : {}),
})

// --- Content ----------------------------------------------------------------

const CAMERA_CONFIG = `// Select your board. The AI-Thinker ESP32-CAM is the common black board
// with the silver shield and a microSD slot on the underside.
#define CAMERA_MODEL_AI_THINKER // Has PSRAM

// Comment out every other CAMERA_MODEL_* line in this block. Leaving two
// defined gives "Camera probe failed with error 0x105" at boot, because the
// pin map compiled in does not match the board you actually flashed.
// #define CAMERA_MODEL_ESP_EYE
// #define CAMERA_MODEL_M5STACK_PSRAM
// #define CAMERA_MODEL_WROVER_KIT`

const SKETCH_TWEAKS = `// Near the top of the sketch, Edge Impulse gates the camera example behind a
// board check. If the sketch refuses to compile with
// "This example is for ESP32 only", confirm the board selected in
// Tools > Board is an ESP32 variant before changing anything here.

// Frame size must stay at or below what the model expects. FOMO models are
// trained at 96x96; the example captures larger and downscales.
#define EI_CAMERA_FRAME_SIZE  FRAMESIZE_QVGA   // 320x240

// Raise this only if inference is starving the watchdog. Default is fine for
// FOMO on a 240 MHz ESP32.
#define EI_CLASSIFIER_SLICES_PER_MODEL_WINDOW 3

// Confidence floor for drawing a detection. Start at 0.5, then tune using the
// numbers your own model reports in the serial monitor.
#define EI_DETECTION_THRESHOLD 0.5f`

const SERIAL_OUTPUT = `Edge Impulse Inferencing Demo
Camera initialised
Starting continuous inference in 2 seconds...

Predictions (DSP: 4 ms., Classification: 187 ms., Anomaly: 0 ms.):
    resistor (0.882031) [ x: 24, y: 32, width: 8, height: 8 ]
    capacitor (0.714844) [ x: 56, y: 16, width: 8, height: 8 ]

Predictions (DSP: 4 ms., Classification: 186 ms., Anomaly: 0 ms.):
    No objects found`

const CONTENT = [
  textBlock([
    heading('h1', [text('ESP32-CAM Object Detection Setup')], 'center'),
    paragraph([
      text(
        'Train a custom object detection model in the browser, then run it entirely on an ESP32-CAM — no cloud call at inference time. This walks the whole path: collecting and labelling a dataset, training a FOMO model in Edge Impulse, exporting it as an Arduino library, and flashing it to the board.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('ESP32-CAM board'), text(' (AI-Thinker) with the OV2640 camera ribbon seated')],
      [bold('FTDI / USB-to-TTL adapter'), text(' switched to '), bold('5V'), text(' logic')],
      [text('Jumper wires, and a breadboard if you would rather not hold them')],
      [text('Arduino IDE 2.x, or 1.8.19')],
      [text('A free account at '), bold('edgeimpulse.com')],
      [
        text('30–50 photos '),
        italic('per object'),
        text(' you want to detect — more if the backgrounds vary'),
      ],
    ]),
    paragraph([
      bold('Note on the FTDI adapter: '),
      text(
        'the ESP32-CAM has no USB port, so this adapter is not optional. Check the jumper is on 5V — 3.3V will appear to work, then brown out the moment the camera initialises.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Create the Edge Impulse Project')]),
    list('number', [
      [text('Sign in at '), bold('studio.edgeimpulse.com'), text('.')],
      [
        text('Click '),
        bold('Create new project'),
        text(', name it, and choose '),
        bold('Developer'),
        text(' (free).'),
      ],
      [
        text('Open '),
        bold('Dashboard'),
        text(' and set '),
        bold('Labeling method'),
        text(' to '),
        bold('Bounding boxes (object detection)'),
        text('.'),
      ],
    ]),
    paragraph([
      text('That third step matters more than it looks. '),
      bold('One label per image'),
      text(
        ' is the default, and it trains a classifier that answers "what is in this picture?" rather than "where is it?". Switching it later means relabelling the whole dataset, so set it before uploading anything.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 2: Collect and Upload the Dataset')]),
    paragraph([
      text(
        'Shoot the photos with the ESP32-CAM itself where you can. A phone camera produces sharper, better-lit images than the OV2640, and a model trained on those tends to disappoint on the real hardware — the sensor it meets in production is the noisy one.',
      ),
    ]),
    heading('h3', [text('Uploading')]),
    list('number', [
      [text('Go to '), bold('Data acquisition'), text(' in the left sidebar.')],
      [text('Click the '), bold('Upload data'), text(' icon.')],
      [text('Select your image files, or a folder.')],
      [
        text('Set '),
        bold('Upload into category'),
        text(' to '),
        bold('Automatically split between training and testing'),
        text('.'),
      ],
      [text('Leave '), bold('Label'), text(' blank — bounding boxes are drawn in the next step.')],
      [text('Click '), bold('Upload data'), text(' and wait for the queue to clear.')],
    ]),
    paragraph([
      text('Aim for an '),
      bold('80/20 train/test split'),
      text(
        ', which the automatic option gives you. Keep the test set genuinely unseen — reusing training photos there produces a flattering accuracy number that tells you nothing.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 3: Label with Bounding Boxes')]),
    list('number', [
      [text('Open '), bold('Data acquisition'), text(' → '), bold('Labeling queue'), text('.')],
      [text('Drag a box around each object in the image.')],
      [
        text('Type the class name, e.g. '),
        code('resistor'),
        text('. Reuse the exact same spelling every time — '),
        code('Resistor'),
        text(' and '),
        code('resistor'),
        text(' become two separate classes.'),
      ],
      [text('Click '), bold('Save labels'), text(' to advance to the next image.')],
    ]),
    paragraph([
      text(
        'Edge Impulse tracks objects between similar frames, so after the first few images the boxes are often pre-drawn and you are only correcting them. ',
      ),
      bold('Label every instance in the frame'),
      text(
        ' — an unlabelled object teaches the model that this pattern is background, which is actively harmful.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 4: Design the Impulse')]),
    list('number', [
      [text('Go to '), bold('Impulse design'), text(' → '), bold('Create impulse'), text('.')],
      [
        text('Set image width and height to '),
        bold('96 × 96'),
        text(' and resize mode to '),
        bold('Fit shortest axis'),
        text('.'),
      ],
      [text('Add an '), bold('Image'), text(' processing block.')],
      [text('Add an '), bold('Object Detection (Images)'), text(' learning block.')],
      [text('Click '), bold('Save Impulse'), text('.')],
      [
        text('Open the '),
        bold('Image'),
        text(' block, set colour depth to '),
        bold('Grayscale'),
        text(', and click '),
        bold('Save parameters'),
        text(' → '),
        bold('Generate features'),
        text('.'),
      ],
    ]),
    paragraph([
      bold('96 × 96 grayscale is not a stylistic choice. '),
      text(
        'The ESP32 has roughly 4 MB of PSRAM and no vector unit. RGB at 160 × 160 will either fail to allocate its tensor arena at boot or run several seconds per frame. Grayscale cuts input by two-thirds for little accuracy loss on shape-driven objects.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 5: Train the Model')]),
    list('number', [
      [text('Open the '), bold('Object detection'), text(' block.')],
      [text('Choose '), bold('FOMO (MobileNetV2 0.35)'), text(' as the model architecture.')],
      [
        text('Start with '),
        bold('60 training cycles'),
        text(' and a learning rate of '),
        code('0.001'),
        text('.'),
      ],
      [
        text('Click '),
        bold('Start training'),
        text(' and wait — a few minutes for a small dataset.'),
      ],
    ]),
    paragraph([
      bold('Why FOMO: '),
      text(
        'conventional detectors like YOLO or MobileNet-SSD will not fit in the ESP32 flash budget. FOMO predicts object centroids on a coarse grid instead of full boxes, which is around 30× smaller and fast enough for real-time video on this hardware. The trade-off is that it gives you object positions and counts, not precise box dimensions — usually fine for "how many, and roughly where".',
      ),
    ]),
    paragraph([
      text('Aim for '),
      bold('F1 above 0.8'),
      text(
        '. If it is lower, the fix is almost always more varied training data — different lighting, angles and backgrounds — rather than more training cycles. Past a point, extra epochs only memorise the training set.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 6: Test Before You Flash')]),
    list('number', [
      [text('Go to '), bold('Model testing'), text(' and click '), bold('Classify all'), text('.')],
      [text('Review accuracy against the held-out test set.')],
      [text('Use '), bold('Live classification'), text(' to try a single new image.')],
    ]),
    paragraph([
      text(
        'Do this before touching hardware. Debugging a weak model through a serial monitor is slow and misleading — if accuracy is poor here, it will be poor on the board, and no amount of firmware tinkering will fix it.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 7: Export as an Arduino Library')]),
    list('number', [
      [text('Go to '), bold('Deployment'), text('.')],
      [text('Search for and select '), bold('Arduino library'), text('.')],
      [
        text('Leave optimisations on '),
        bold('Quantized (int8)'),
        text(' — the float32 build is markedly slower and larger.'),
      ],
      [
        text('Click '),
        bold('Build'),
        text('. A '),
        code('.zip'),
        text(' downloads when it finishes.'),
      ],
    ]),
    paragraph([
      text('In the Arduino IDE, go to '),
      bold('Sketch → Include Library → Add .ZIP Library'),
      text(' and select the file you just downloaded. Do not unzip it first.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 8: Open and Modify the Example')]),
    paragraph([
      text('Open '),
      bold('File → Examples → <your-project-name>_inferencing → esp32 → esp32_camera'),
      text('. The sketch compiles almost as-is; one edit is mandatory.'),
    ]),
  ]),

  codeBlock('cpp', CAMERA_CONFIG, BOARD_SELECT_CAPTION),

  textBlock([
    paragraph([
      text(
        'The remaining settings are optional. Leave them alone on a first run and come back if performance disappoints.',
      ),
    ]),
  ]),

  codeBlock('cpp', SKETCH_TWEAKS, 'esp32_camera.ino — optional tuning'),

  textBlock([
    heading('h2', [text('Step 9: Board Settings')]),
    paragraph([
      text('In '),
      bold('Tools'),
      text(', set the following. The partition scheme is the one people miss.'),
    ]),
    list('bullet', [
      [bold('Board:'), text(' AI Thinker ESP32-CAM')],
      [bold('Partition Scheme:'), text(' Huge APP (3MB No OTA/1MB SPIFFS)')],
      [bold('PSRAM:'), text(' Enabled')],
      [bold('Upload Speed:'), text(' 115200 — drop to 57600 if uploads fail intermittently')],
      [bold('Flash Frequency:'), text(' 80 MHz')],
    ]),
    paragraph([
      bold('If the board does not appear: '),
      text('add '),
      code('https://espressif.github.io/arduino-esp32/package_esp32_index.json'),
      text(' under '),
      bold('File → Preferences → Additional Board Manager URLs'),
      text(', then install '),
      bold('esp32 by Espressif Systems'),
      text(' from the Boards Manager.'),
    ]),
    paragraph([
      bold('On the partition scheme: '),
      text(
        'the default leaves roughly 1.2 MB for the application, and a FOMO model plus the camera driver exceeds that. The symptom is a compile-time "text section exceeds available space in board" error, which reads like a code problem and is not one.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 10: Wire and Flash')]),
    paragraph([text('Wire the FTDI adapter to the ESP32-CAM:')]),
    list('bullet', [
      [code('5V'), text(' → '), code('5V')],
      [code('GND'), text(' → '), code('GND')],
      [code('TX'), text(' (FTDI) → '), code('U0R'), text(' (board)')],
      [code('RX'), text(' (FTDI) → '), code('U0T'), text(' (board)')],
      [bold('IO0'), text(' → '), bold('GND'), text(' — only while flashing')],
    ]),
    paragraph([
      text('Note that TX goes to U0R and RX goes to U0T. '),
      bold('The lines cross'),
      text(
        ' — wiring them straight through is the single most common reason an upload never starts.',
      ),
    ]),
    heading('h3', [text('Flashing Sequence')]),
    list('number', [
      [text('Connect '), bold('IO0 to GND'), text(' to enter bootloader mode.')],
      [text('Plug in the FTDI adapter, then tap the '), bold('RST'), text(' button on the board.')],
      [text('Click '), bold('Upload'), text('.')],
      [
        text(
          'When "Connecting…" appears, the board is listening. If it stalls on dots, tap RST again.',
        ),
      ],
      [text('After upload completes, '), bold('disconnect IO0 from GND'), text('.')],
      [text('Tap '), bold('RST'), text(' once more to boot the new firmware.')],
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 11: Test It')]),
    list('number', [
      [text('Open '), bold('Tools → Serial Monitor'), text('.')],
      [text('Set the baud rate to '), bold('115200'), text('.')],
      [text('Tap '), bold('RST'), text('.')],
      [text('Hold a trained object in front of the lens.')],
    ]),
    paragraph([text('Working output looks like this:')]),
  ]),

  codeBlock('bash', SERIAL_OUTPUT, 'Serial Monitor @ 115200 baud'),

  textBlock([
    paragraph([
      text(
        'The numbers in brackets are grid coordinates in the model input space, not pixels in the captured frame. ',
      ),
      bold('Classification time around 180 ms'),
      text(' is normal for FOMO at 96 × 96, giving roughly 5 frames per second.'),
    ]),
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('Camera probe failed (0x105): '),
        text('the ribbon cable is loose, or more than one '),
        code('CAMERA_MODEL_*'),
        text(' is defined. Reseat the connector and re-check Step 8.'),
      ],
      [
        bold('Brownout detector was triggered: '),
        text(
          'insufficient power. Use the 5V pin, not 3.3V, and prefer a separate supply — many FTDI adapters cannot source the camera’s peak current.',
        ),
      ],
      [
        bold('Guru Meditation Error / boot loop: '),
        text('PSRAM is disabled, or the partition scheme is wrong. Re-check Step 9.'),
      ],
      [
        bold('Failed to connect / stuck on dots: '),
        text(
          'IO0 is not grounded, RX and TX are not crossed, or RST was not tapped after entering bootloader mode.',
        ),
      ],
      [
        bold('Detects nothing on hardware, but tests well in the Studio: '),
        text(
          'the training images were too clean. Re-shoot part of the dataset with the ESP32-CAM itself, under the lighting it will actually run in.',
        ),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [
        text('Stream annotated frames over Wi-Fi with the '),
        code('esp32_camera_web'),
        text(' example in the same library.'),
      ],
      [
        text(
          'Drive a GPIO on detection — a relay, a buzzer, a servo — straight from the inference callback.',
        ),
      ],
      [
        text(
          'Retrain with images captured by the deployed board to close the gap between test and field accuracy.',
        ),
      ],
    ]),
  ]),
]

// --- Seed -------------------------------------------------------------------

async function main() {
  const payload = await getPayload({ config })

  // Prefix match, not the source filename: the media collection sets
  // `formatOptions.format = 'webp'`, so an uploaded `esp32-cam.png` is stored
  // as `esp32-cam.webp`. Looking for the .png name never matches and every
  // re-run uploads another copy.
  //
  // Payload's `like` is case-insensitive on Postgres, so this also returns
  // similarly-named images uploaded through the admin. Those are filtered out
  // below — the thumbnail must come from `public/esp32-cam.png`, not from
  // whatever else happens to share the name.
  const nameMatches = await payload.find({
    collection: 'media',
    where: { filename: { like: 'esp32-cam' } },
    sort: 'id',
    limit: 100,
    overrideAccess: true,
  })
  const existingMedia = nameMatches.docs.filter((doc) => SEED_UPLOAD_NAME.test(doc.filename ?? ''))

  let thumbnailId: number
  if (existingMedia.length > 0) {
    thumbnailId = existingMedia[0].id as number
    console.log(`Reusing existing media ${thumbnailId} (${existingMedia[0].filename}).`)
  } else {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'ESP32-CAM board with OV2640 camera module' },
      filePath: IMAGE_PATH,
      overrideAccess: true,
    })
    thumbnailId = media.id as number
    console.log(`Uploaded media ${thumbnailId} from ${IMAGE_PATH}.`)
  }

  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')
  const content = insertAfterCaption(
    CONTENT,
    BOARD_SELECT_CAPTION,
    simulatorLinkBlock(arduinoIdeSim, 'Download the Arduino IDE'),
  )

  const data = {
    title: 'ESP32-CAM Object Detection Setup',
    slug: SLUG,
    description:
      'Set up on-device object detection on an ESP32-CAM — labelled dataset, trained model, and flashed firmware.',
    thumbnail: thumbnailId,
    difficulty: 'intermediate' as const,
    // ESP32, Microcontroller, IoT
    tags: [3, 5, 1],
    estimatedReadTime: 25,
    badge: 'featured' as const,
    content,
  }

  // Legacy slugs are included so a rename updates the document that is already
  // published rather than creating a second copy under the new slug.
  const existing = await payload.find({
    collection: 'resources',
    where: { slug: { in: [SLUG, ...LEGACY_SLUGS] } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    const id = existing.docs[0].id
    await payload.update({ collection: 'resources', id, data, overrideAccess: true })
    console.log(`Updated existing resource ${id} (${SLUG}).`)
  } else {
    const created = await payload.create({ collection: 'resources', data, overrideAccess: true })
    console.log(`Created resource ${created.id} (${SLUG}).`)
  }

  // Prune copies an earlier run of this script left behind. The list is already
  // filtered to names only this script produces, so an image an officer
  // uploaded through the admin is never touched. This has to happen after the
  // resource is written: `thumbnail` is NOT NULL, so deleting the row it still
  // points at fails on the constraint.
  for (const dupe of existingMedia) {
    if (dupe.id === thumbnailId) continue
    await payload.delete({ collection: 'media', id: dupe.id, overrideAccess: true })
    console.log(`Deleted stale seed media ${dupe.id} (${dupe.filename}).`)
  }

  console.log(`View at /resources/${SLUG}`)
}

/**
 * `process.exit` discards whatever is still buffered in stdout when stdout is a
 * pipe rather than a TTY — which is exactly the case under `payload run` from
 * an npm script, and silently swallowed every log above. Wait for the drain
 * callback before exiting. The explicit exit itself is still needed: Payload
 * leaves the database pool open, so the process would otherwise hang.
 */
function flushExit(code: number) {
  process.stdout.write('', () => process.exit(code))
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
