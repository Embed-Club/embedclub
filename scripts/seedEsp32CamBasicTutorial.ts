/**
 * Seed the "ESP32-CAM: Live Video Streaming" tutorial — the basic first program
 * for the board (the CameraWebServer example), as distinct from the on-device
 * object-detection resource.
 *
 *   pnpm tsx scripts/seedEsp32CamBasicTutorial.ts
 *
 * Screenshot slots use the shared placeholder graphic with a caption naming the
 * real screenshot that belongs there; the thumbnail is the ESP32-CAM board photo
 * in `public/`, shared with the object-detection resource rather than uploaded a
 * second time. Matched on slug, so re-running updates in place. Live immediately.
 */
import path from 'node:path'
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  codeBlock,
  ensureMediaFromFile,
  ensurePlaceholderMedia,
  flushExit,
  heading,
  insertAfterCaption,
  italic,
  list,
  paragraph,
  placeholderImage,
  simulatorId,
  simulatorLinkBlock,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'esp32-cam-live-video-streaming'

/** Caption of the block that ends the board-support step; the IDE card follows it. */
const IDE_STEP_MARKER = 'Boards Manager URL'
/**
 * Board photo used as the thumbnail. `ensureMediaFromFile` matches on the webp
 * name Payload derives, so this reuses the media doc the object-detection seed
 * already uploaded instead of adding a duplicate.
 */
const THUMBNAIL_SOURCE = path.resolve(process.cwd(), 'public/esp32-cam.png')

const CAMERA_MODEL = `// Near the top of CameraWebServer.ino. Uncomment YOUR board and make sure
// every other CAMERA_MODEL_* line stays commented — two defined at once gives
// "Camera probe failed with error 0x105" at boot.
#define CAMERA_MODEL_AI_THINKER // Has PSRAM

// #define CAMERA_MODEL_WROVER_KIT
// #define CAMERA_MODEL_ESP_EYE
// #define CAMERA_MODEL_M5STACK_PSRAM`

const WIFI_CREDS = `// A little further down, fill in your 2.4 GHz network. The ESP32 does not
// join 5 GHz networks — if it never connects, this is usually why.
const char *ssid = "YOUR_WIFI_NAME";
const char *password = "YOUR_WIFI_PASSWORD";`

const CONTENT = [
  textBlock([
    heading('h1', [text('ESP32-CAM: Live Video Streaming')], 'center'),
    paragraph([
      text(
        'The ESP32-CAM is a tiny board with a camera and Wi-Fi for a few dollars. Its "hello world" is the CameraWebServer example: flash it, and the board hosts a web page that streams live video and exposes every camera setting in the browser. This tutorial gets you there — no code to write, just the example configured and flashed.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('ESP32-CAM board'), text(' (AI-Thinker) with the OV2640 camera seated')],
      [bold('FTDI / USB-to-TTL adapter'), text(' set to '), bold('5V'), text(' logic')],
      [text('Jumper wires, and a breadboard if you prefer')],
      [text('Arduino IDE 2.x')],
      [text('A '), bold('2.4 GHz'), text(' Wi-Fi network (the ESP32 does not do 5 GHz)')],
    ]),
    paragraph([
      bold('Note: '),
      text(
        'the ESP32-CAM has no USB port, so the FTDI adapter is not optional. Keep its jumper on 5V — 3.3V looks fine until the camera powers up and browns out.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Add ESP32 Board Support')]),
    paragraph([text('If you have not used an ESP32 in the Arduino IDE before:')]),
    list('number', [
      [
        text('Open '),
        bold('File → Preferences'),
        text(' and add this to '),
        bold('Additional Board Manager URLs'),
        text(':'),
      ],
      [
        text('Open '),
        bold('Tools → Board → Boards Manager'),
        text(', search '),
        code('esp32'),
        text(', and install '),
        bold('esp32 by Espressif Systems'),
        text('.'),
      ],
    ]),
  ]),
  codeBlock(
    'bash',
    'https://espressif.github.io/arduino-esp32/package_esp32_index.json',
    'Boards Manager URL',
  ),

  textBlock([
    heading('h2', [text('Step 2: Open the CameraWebServer Example')]),
    paragraph([
      text('Go to '),
      bold('File → Examples → ESP32 → Camera → CameraWebServer'),
      text('. This is the full streaming server — you only need to change two things in it.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 3: Select Your Camera Model')]),
    paragraph([
      text('At the top of the sketch, tell it which board you have by uncommenting one line:'),
    ]),
  ]),
  codeBlock('cpp', CAMERA_MODEL, 'CameraWebServer.ino — pick the board'),

  textBlock([heading('h2', [text('Step 4: Enter Your Wi-Fi Details')])]),
  codeBlock('cpp', WIFI_CREDS, 'CameraWebServer.ino — your network'),

  textBlock([
    heading('h2', [text('Step 5: Board Settings')]),
    paragraph([text('In '), bold('Tools'), text(', set:')]),
    list('bullet', [
      [bold('Board:'), text(' AI Thinker ESP32-CAM')],
      [bold('Partition Scheme:'), text(' Huge APP (3MB No OTA/1MB SPIFFS)')],
      [bold('PSRAM:'), text(' Enabled')],
    ]),
    paragraph([
      bold('The partition scheme matters. '),
      text(
        'The default leaves too little program space and the build fails with a "text section exceeds available space" error that reads like a code bug but is not one.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 6: Wire and Flash')]),
    paragraph([text('Wire the FTDI adapter to the ESP32-CAM:')]),
    list('bullet', [
      [code('5V'), text(' → '), code('5V')],
      [code('GND'), text(' → '), code('GND')],
      [code('TX'), text(' (FTDI) → '), code('U0R'), text(' (board)')],
      [code('RX'), text(' (FTDI) → '), code('U0T'), text(' (board)')],
      [bold('IO0'), text(' → '), bold('GND'), text(' — only while flashing')],
    ]),
    paragraph([
      text('TX goes to U0R and RX goes to U0T — '),
      bold('the lines cross'),
      text('. Connect IO0 to GND, plug in the FTDI, tap '),
      bold('RST'),
      text(', then click '),
      bold('Upload'),
      text('. When it finishes, disconnect IO0 from GND and tap RST to run.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 7: Find the Board’s IP Address')]),
    list('number', [
      [
        text('Open '),
        bold('Tools → Serial Monitor'),
        text(' and set the baud to '),
        bold('115200'),
        text('.'),
      ],
      [text('Tap '), bold('RST'), text('. The board connects to Wi-Fi and prints its address.')],
      [
        text('Look for a line like '),
        code("Camera Ready! Use 'http://192.168.1.50' to connect"),
        text('.'),
      ],
    ]),
  ]),
  placeholderImage(
    0,
    'The Arduino Serial Monitor showing the ESP32-CAM connecting to Wi-Fi and printing its IP address',
  ),

  textBlock([
    heading('h2', [text('Step 8: Open the Stream')]),
    list('number', [
      [
        text('On any device on the same Wi-Fi, open that '),
        code('http://<IP>'),
        text(' address in a browser.'),
      ],
      [text('The control page loads. Scroll down and click '), bold('Start Stream'), text('.')],
      [text('Live video from the ESP32-CAM appears.')],
    ]),
  ]),
  placeholderImage(
    0,
    'The ESP32-CAM web interface in a browser — the live video stream with the settings panel on the left',
  ),
  textBlock([
    paragraph([
      text('The left-hand panel is the whole point of this example: '),
      italic('resolution, quality, brightness, and special modes'),
      text(
        ' like face detection are all adjustable live. Drop the resolution if the stream is laggy — the ESP32 has limited bandwidth, and lower frame sizes stream far more smoothly.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('Brownout detector was triggered: '),
        text(
          'underpowered. Use 5V (not 3.3V), and prefer a separate supply — many FTDI adapters cannot source the camera’s peak current.',
        ),
      ],
      [
        bold('Camera probe failed (0x105): '),
        text('the ribbon cable is loose, or more than one '),
        code('CAMERA_MODEL_*'),
        text(' is uncommented. Reseat the connector and re-check Step 3.'),
      ],
      [
        bold('Never connects to Wi-Fi: '),
        text('it is a 5 GHz network, or the credentials are wrong. The ESP32 only joins 2.4 GHz.'),
      ],
      [
        bold('Stream is slow or freezes: '),
        text('lower the resolution in the web panel, and move closer to the router.'),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [text('Run the on-device object detection guide to make the board recognise what it sees.')],
      [text('Trigger a GPIO — a relay, buzzer, or servo — from the web server code.')],
      [text('Save snapshots to the microSD slot instead of only streaming.')],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const thumbnailId = await ensureMediaFromFile(
    payload,
    THUMBNAIL_SOURCE,
    'ESP32-CAM board with OV2640 camera module',
  )

  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')

  const content = insertAfterCaption(
    CONTENT.map((block) =>
      block.blockType === 'imageBlock' ? { ...block, image: placeholderId } : block,
    ),
    IDE_STEP_MARKER,
    simulatorLinkBlock(arduinoIdeSim, 'Download the Arduino IDE'),
  )

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'ESP32-CAM: Live Video Streaming',
      slug: SLUG,
      description:
        'Flash the CameraWebServer example to an ESP32-CAM and stream live video to your browser — the basic first program for the board.',
      thumbnail: thumbnailId,
      difficulty: 'beginner',
      // ESP32, Microcontroller, IoT
      tags: [3, 5, 1],
      estimatedReadTime: 15,
      badge: 'essential',
      content,
    },
  })
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
