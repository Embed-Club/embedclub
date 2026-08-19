/**
 * Seed the "Server-Based Remote" resources - one for the ESP32, one for the
 * ESP8266.
 *
 *   pnpm tsx scripts/seedThingSpeakRemoteResources.ts
 *
 * Ports the club's older ThingSpeak remote-control post. Two documents rather
 * than one: the library and the Wi-Fi header differ, and a page that keeps
 * saying "on the other board, do this instead" is harder to follow than two
 * short pages.
 *
 * The original post had a live channel id and read API key in the listing.
 * Those are deliberately NOT reproduced here - see the note in the content.
 *
 * Matched on slug, so re-running updates in place. Live immediately.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  codeBlock,
  ensurePlaceholderMedia,
  ensureTagIds,
  flushExit,
  heading,
  italic,
  list,
  paragraph,
  simulatorId,
  simulatorLinkBlock,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const ESP32_SKETCH = `// thingSpeakRemote.ino - ESP32.
// Polls a ThingSpeak field and drives a pin from it, so the board can be
// switched from anywhere with an internet connection.
#include <WiFi.h>
#include <ThingSpeak.h>

const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// From your own channel: Channel Settings, and the API Keys tab.
const unsigned long CHANNEL_ID = 0000000;
const char* READ_API_KEY = "YOUR_READ_API_KEY";
const unsigned int FIELD = 1;

const int OUTPUT_PIN = 13;

WiFiClient client;

void setup() {
  Serial.begin(115200);
  pinMode(OUTPUT_PIN, OUTPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("connected, IP = ");
  Serial.println(WiFi.localIP());

  ThingSpeak.begin(client);
}

void loop() {
  long value = ThingSpeak.readLongField(CHANNEL_ID, FIELD, READ_API_KEY);
  int status = ThingSpeak.getLastReadStatus();

  if (status == 200) {
    digitalWrite(OUTPUT_PIN, value ? HIGH : LOW);
    Serial.print("field = ");
    Serial.println(value);
  } else {
    // Do NOT drive the pin on a failed read - a network blip would otherwise
    // switch the load off, because a failed read returns 0.
    Serial.print("read failed, status ");
    Serial.println(status);
  }

  // The free tier rate-limits to one update every 15 seconds. Polling faster
  // just collects errors.
  delay(20000);
}`

const ESP8266_SKETCH = `// thingSpeakRemote.ino - ESP8266 / NodeMCU.
// Identical logic; only the Wi-Fi header and the pin name change.
#include <ESP8266WiFi.h>
#include <ThingSpeak.h>

const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

const unsigned long CHANNEL_ID = 0000000;
const char* READ_API_KEY = "YOUR_READ_API_KEY";
const unsigned int FIELD = 1;

// D7 on the NodeMCU silkscreen is GPIO13. Either name compiles on this core;
// the GPIO number is what the chip and every datasheet mean.
const int OUTPUT_PIN = 13;

WiFiClient client;

void setup() {
  Serial.begin(115200);
  pinMode(OUTPUT_PIN, OUTPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("connected, IP = ");
  Serial.println(WiFi.localIP());

  ThingSpeak.begin(client);
}

void loop() {
  long value = ThingSpeak.readLongField(CHANNEL_ID, FIELD, READ_API_KEY);
  int status = ThingSpeak.getLastReadStatus();

  if (status == 200) {
    digitalWrite(OUTPUT_PIN, value ? HIGH : LOW);
    Serial.print("field = ");
    Serial.println(value);
  } else {
    Serial.print("read failed, status ");
    Serial.println(status);
  }

  delay(20000);
}`

const WRITE_URL = `# Switch the board on and off with a plain URL - from a browser, a phone
# shortcut, or any script. This is the "remote" half of the project.

# ON
https://api.thingspeak.com/update?api_key=YOUR_WRITE_API_KEY&field1=1

# OFF
https://api.thingspeak.com/update?api_key=YOUR_WRITE_API_KEY&field1=0`

/** The two pages differ only in the board name, the library, and the sketch. */
function buildContent({
  board,
  header,
  sketch,
  arduinoIdeSim,
  otherBoard,
}: {
  board: string
  header: string
  sketch: string
  arduinoIdeSim: number
  otherBoard: string
}) {
  return [
    textBlock([
      heading('h1', [text(`Server-Based Remote: ${board} and ThingSpeak`)], 'center'),
      paragraph([
        text(
          'Control a device from anywhere in the world, with no port forwarding and no static IP. The trick is that the board never accepts an incoming connection - it polls a cloud channel and does whatever the latest value says. Anything that can write to that channel becomes the remote control.',
        ),
      ]),
      paragraph([
        bold('Why this beats a local web server: '),
        text(
          'a board serving its own page only works while you are on the same Wi-Fi. Here the board makes outbound requests, which every home router allows by default, so "from anywhere" costs nothing extra.',
        ),
      ]),
      heading('h2', [text('What You Will Need')]),
      list('bullet', [
        [bold(`A ${board} board`)],
        [bold('Arduino IDE'), text(' with the board package installed')],
        [text('The '), bold('ThingSpeak'), text(' library, from the Library Manager')],
        [text('A free account at '), bold('thingspeak.com')],
        [text('An LED or a relay module on the output pin')],
        [bold('A 2.4 GHz Wi-Fi network')],
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 1: Make a Channel')]),
      list('number', [
        [
          text('Sign in at '),
          bold('thingspeak.com'),
          text(' and open '),
          bold('Channels → My Channels → New Channel'),
          text('.'),
        ],
        [text('Name it, tick '), bold('Field 1'), text(', and Save.')],
        [text('Open the '), bold('API Keys'), text(' tab.')],
        [
          text('Note the '),
          bold('Channel ID'),
          text(', the '),
          bold('Read API Key'),
          text(', and the '),
          bold('Write API Key'),
          text('.'),
        ],
      ]),
      paragraph([
        bold('Treat the write key like a password. '),
        text(
          'Anyone who has it can switch your hardware. Keep it out of screenshots and out of anything you publish - and if it does leak, regenerate it from that same API Keys tab.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 2: The Sketch')]),
      paragraph([
        text('Fill in your own network, channel id, and read key. The '),
        code(header),
        text(' header is the one line that differs from the '),
        text(otherBoard),
        text(' version of this page.'),
      ]),
    ]),
    codeBlock('cpp', sketch, 'thingSpeakRemote.ino'),

    textBlock([
      heading('h2', [text('Step 3: Switch It')]),
      paragraph([text('With the sketch running, open either of these in a browser:')]),
    ]),
    codeBlock('bash', WRITE_URL, 'Writing to the channel'),
    textBlock([
      paragraph([
        text(
          'Within one poll interval the pin follows. You can drive the same URLs from a phone home-screen shortcut, a Google Assistant routine via IFTTT, or a ',
        ),
        code('curl'),
        text(' in a cron job.'),
      ]),
    ]),

    textBlock([
      heading('h2', [text('The Two Things That Bite')]),
      list('bullet', [
        [
          bold('Latency is the design, not a bug. '),
          text(
            'The board polls, so a command takes up to one interval to land. ThingSpeak’s free tier allows an update every ',
          ),
          bold('15 seconds'),
          text(
            ', so a 20-second poll is about the floor. This is fine for a light and wrong for anything that needs to stop quickly.',
          ),
        ],
        [
          bold('A failed read returns 0. '),
          text(
            'Check the status code before acting on the value, as the sketch above does. Without that check, every network hiccup reads as "off" and switches your load off with it.',
          ),
        ],
      ]),
      heading('h2', [text('Troubleshooting')]),
      list('bullet', [
        [
          bold('status -301 or -304: '),
          text('no connection to ThingSpeak. Check Wi-Fi first, then the channel id.'),
        ],
        [
          bold('status 0, or always reads 0: '),
          text(
            'wrong read key, or the field is genuinely empty. Write to it once from the URL above.',
          ),
        ],
        [bold('Never connects: '), text('a 5 GHz network. Both boards are 2.4 GHz only.')],
        [
          bold('Relay clicks but the load does not switch: '),
          text('the relay is on the wrong terminal - most modules have both '),
          italic('normally open'),
          text(' and '),
          italic('normally closed'),
          text('.'),
        ],
      ]),
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [
          text(
            'Send data the other way - publish a sensor reading to a field and chart it on the ThingSpeak dashboard.',
          ),
        ],
        [
          text(
            'Swap polling for MQTT, which pushes instead and drops the latency to well under a second.',
          ),
        ],
        [text('For voice control, see the Google Home and Sinric Pro guide.')],
      ]),
    ]),

    simulatorLinkBlock(arduinoIdeSim, 'Get the Arduino IDE'),
  ]
}

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')

  const esp32Tags = await ensureTagIds(payload, ['ESP32', 'IoT', 'Microcontroller'])
  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: 'esp32-server-based-remote-thingspeak',
    data: {
      title: 'Server-Based Remote: ESP32 and ThingSpeak',
      slug: 'esp32-server-based-remote-thingspeak',
      description:
        'Switch an ESP32 from anywhere by polling a ThingSpeak channel - no port forwarding, no static IP, and no incoming connections.',
      thumbnail: placeholderId,
      difficulty: 'intermediate',
      tags: esp32Tags,
      estimatedReadTime: 12,
      content: buildContent({
        board: 'ESP32',
        header: 'WiFi.h',
        sketch: ESP32_SKETCH,
        arduinoIdeSim,
        otherBoard: 'ESP8266',
      }),
    },
  })

  const esp8266Tags = await ensureTagIds(payload, ['ESP8266', 'IoT', 'Microcontroller'])
  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: 'esp8266-server-based-remote-thingspeak',
    data: {
      title: 'Server-Based Remote: ESP8266 and ThingSpeak',
      slug: 'esp8266-server-based-remote-thingspeak',
      description:
        'Switch a NodeMCU from anywhere by polling a ThingSpeak channel - the ESP8266 version, with the D-label to GPIO note.',
      thumbnail: placeholderId,
      difficulty: 'intermediate',
      tags: esp8266Tags,
      estimatedReadTime: 12,
      content: buildContent({
        board: 'ESP8266',
        header: 'ESP8266WiFi.h',
        sketch: ESP8266_SKETCH,
        arduinoIdeSim,
        otherBoard: 'ESP32',
      }),
    },
  })
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
