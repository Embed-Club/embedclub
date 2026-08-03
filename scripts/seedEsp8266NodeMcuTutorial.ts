/**
 * Seed the "ESP8266 NodeMCU: Setup and Wi-Fi" tutorial.
 *
 *   pnpm tsx scripts/seedEsp8266NodeMcuTutorial.ts
 *
 * Written as the shorter companion to the ESP32 tutorial rather than a repeat of
 * it: the setup differs (board URL, board entry, the D-label pin mapping) and the
 * gotchas are the board's own — inverted on-board LED, boot-mode pins.
 *
 * Screenshot slots and the thumbnail use the shared placeholder graphic with a
 * caption naming the real image that belongs there. Matched on slug, so
 * re-running updates in place. Live immediately.
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
  insertAfterCaption,
  list,
  paragraph,
  placeholderImage,
  simulatorId,
  simulatorLinkBlock,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'esp8266-nodemcu-setup-and-wifi'

/** Caption of the block that ends the board-support step; the IDE card follows it. */
const IDE_STEP_MARKER = 'Boards Manager URL'

const BOARD_URL = 'https://arduino.esp8266.com/stable/package_esp8266com_index.json'

const BLINK = `// blink.ino — the on-board LED, which is wired backwards.
//
// LED_BUILTIN on the NodeMCU is GPIO2 (the D4 label), and it is wired to
// 3.3V rather than to ground. So LOW turns it ON and HIGH turns it OFF —
// the opposite of every Arduino example.

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, LOW);   // ON
  delay(500);
  digitalWrite(LED_BUILTIN, HIGH);  // OFF
  delay(500);
}`

const WIFI_CONNECT = `// wifi.ino — join the network and print the address.
#include <ESP8266WiFi.h>

const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  delay(100);

  // STA mode explicitly: the ESP8266 remembers its last mode in flash, and a
  // board left in AP mode by earlier firmware will not join anything.
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("connected, IP = ");
  Serial.println(WiFi.localIP());
}

void loop() {}`

const WEB_SERVER = `// webled.ino — a page with two links that switch the LED.
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

ESP8266WebServer server(80);

void sendPage() {
  // digitalRead of an output returns what we last wrote. Remember the LED is
  // inverted, so LOW is on.
  String state = digitalRead(LED_BUILTIN) == LOW ? "ON" : "OFF";
  String html =
    "<!DOCTYPE html><html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1'>"
    "<title>NodeMCU</title></head>"
    "<body style='font-family:sans-serif;text-align:center;padding-top:3rem'>"
    "<h1>LED is " + state + "</h1>"
    "<p><a href='/on'>Turn on</a> &nbsp; <a href='/off'>Turn off</a></p>"
    "</body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);   // start off

  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("http://");
  Serial.println(WiFi.localIP());

  server.on("/",    sendPage);
  server.on("/on",  []() { digitalWrite(LED_BUILTIN, LOW);  sendPage(); });
  server.on("/off", []() { digitalWrite(LED_BUILTIN, HIGH); sendPage(); });
  server.begin();
}

void loop() {
  // Must be called often. A long delay() in loop() makes the board stop
  // answering requests, which looks like the Wi-Fi dropping.
  server.handleClient();
}`

const CONTENT = [
  textBlock([
    heading('h1', [text('ESP8266 NodeMCU: Setup and Wi-Fi')], 'center'),
    paragraph([
      text(
        'The ESP8266 was the board that made Wi-Fi cheap, and the NodeMCU is the version of it with a USB socket and a voltage regulator already attached. It has been superseded by the ESP32 on paper, but it is still the right answer when a project needs one sensor on the network and nothing else — it is smaller, cheaper, and draws less. This tutorial covers setup, the two ways the board surprises people, and a web page that switches its LED.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [bold('A NodeMCU board'), text(' — v1.0 / ESP-12E is the common one')],
      [bold('A micro-USB data cable')],
      [bold('Arduino IDE 2.x')],
      [bold('A 2.4 GHz Wi-Fi network'), text(' — the ESP8266 has no 5 GHz radio')],
    ]),
    paragraph([
      bold('3.3V logic. '),
      text(
        'The NodeMCU regulates 5V from USB down to 3.3V for the chip, but every GPIO pin is 3.3V and none are 5V tolerant. Sensors that output 5V need a divider or a level shifter.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Add ESP8266 Board Support')]),
    list('number', [
      [
        text('Open '),
        bold('File → Preferences'),
        text(' and paste this into '),
        bold('Additional Board Manager URLs'),
        text(':'),
      ],
      [
        text('Open '),
        bold('Tools → Board → Boards Manager'),
        text(', search '),
        code('esp8266'),
        text(', and install '),
        bold('esp8266 by ESP8266 Community'),
        text('.'),
      ],
    ]),
  ]),
  codeBlock('bash', BOARD_URL, 'Boards Manager URL'),
  textBlock([
    paragraph([
      text(
        'This is a different URL and a different package from the ESP32. If you already have the ESP32 core installed, both can live side by side — the field takes a comma-separated list.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 2: Driver and Port')]),
    paragraph([
      text('Plug the board in. Most NodeMCUs use a '),
      bold('CH340'),
      text(' USB chip; some older ones use a '),
      bold('CP2102'),
      text('.'),
    ]),
    list('bullet', [
      [
        bold('Windows: '),
        text('install '),
        code('CH341SER'),
        text(' from wch-ic.com, or the CP210x driver from Silicon Labs.'),
      ],
      [bold('macOS: '), text('both drivers ship with recent versions.')],
      [bold('Linux: '), text('both are in-kernel; the port is '), code('/dev/ttyUSB0'), text('.')],
    ]),
    paragraph([
      text('Then set '),
      bold('Tools → Board → ESP8266 Boards → NodeMCU 1.0 (ESP-12E Module)'),
      text(
        ', and pick the port. Leave the rest of the Tools menu at its defaults; the flash size and speed presets are correct for this board.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'The Arduino IDE with NodeMCU 1.0 (ESP-12E Module) selected under Tools → Board',
  ),

  textBlock([
    heading('h2', [text('Step 3: The Pin Labels Lie')]),
    paragraph([
      text('The silkscreen says '),
      code('D0'),
      text(' through '),
      code('D8'),
      text(
        '. The chip does not know about those names — its pins are GPIO numbers, and the two do not match:',
      ),
    ]),
    list('bullet', [
      [
        code('D0'),
        text(' = GPIO16'),
        text('  ·  '),
        code('D1'),
        text(' = GPIO5'),
        text('  ·  '),
        code('D2'),
        text(' = GPIO4'),
      ],
      [
        code('D3'),
        text(' = GPIO0'),
        text('  ·  '),
        code('D4'),
        text(' = GPIO2'),
        text('  ·  '),
        code('D5'),
        text(' = GPIO14'),
      ],
      [
        code('D6'),
        text(' = GPIO12'),
        text('  ·  '),
        code('D7'),
        text(' = GPIO13'),
        text('  ·  '),
        code('D8'),
        text(' = GPIO15'),
      ],
    ]),
    paragraph([
      bold('The Arduino core accepts the D names, '),
      text('so '),
      code('digitalWrite(D1, HIGH)'),
      text(
        ' works. Libraries and datasheets almost always mean GPIO numbers instead. When a wiring diagram says "GPIO4", that is the pin labelled ',
      ),
      code('D2'),
      text(' — mixing the two up is the most common wiring mistake on this board.'),
    ]),
    heading('h3', [text('Pins to leave alone')]),
    list('bullet', [
      [
        code('D3'),
        text(' (GPIO0), '),
        code('D4'),
        text(' (GPIO2), '),
        code('D8'),
        text(
          ' (GPIO15) set the boot mode. A component pulling any of them the wrong way at power-on stops the board booting.',
        ),
      ],
      [
        code('D0'),
        text(' (GPIO16) has no interrupt and no pull-up. It is the wake-from-deep-sleep pin.'),
      ],
    ]),
  ]),
  placeholderImage(0, 'A NodeMCU pinout diagram showing D labels alongside GPIO numbers'),

  textBlock([
    heading('h2', [text('Step 4: Blink — and the Inverted LED')]),
    paragraph([text('Upload this. Note that the logic is upside down on purpose:')]),
  ]),
  codeBlock('cpp', BLINK, 'blink.ino'),
  textBlock([
    paragraph([
      text(
        'The on-board LED has its anode on 3.3V and its cathode on GPIO2, so the pin sinks current to light it. ',
      ),
      code('LOW'),
      text(
        ' is on. Every Arduino tutorial you copy will have this backwards, and the symptom — an LED that is on except when the code says it should be — is easy to mistake for broken hardware.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 5: Join the Network')]),
    paragraph([text('Fill in your own 2.4 GHz network and upload:')]),
  ]),
  codeBlock('cpp', WIFI_CONNECT, 'wifi.ino'),
  textBlock([
    paragraph([
      text('Open '),
      bold('Tools → Serial Monitor'),
      text(' at '),
      bold('115200'),
      text(
        '. The ESP8266 also prints its own bootloader messages at 74880 baud, so a screenful of garbage at reset before your output starts is normal, not a fault.',
      ),
    ]),
    paragraph([
      bold('Why '),
      code('WiFi.mode(WIFI_STA)'),
      bold(' is not optional: '),
      text(
        'the ESP8266 stores its last radio mode in flash and restores it at boot. A board previously running an access-point sketch will keep behaving as one until told otherwise, which presents as code that works on one board and not on another.',
      ),
    ]),
  ]),
  placeholderImage(
    0,
    'The Serial Monitor at 115200 showing the NodeMCU connecting and printing its IP',
  ),

  textBlock([
    heading('h2', [text('Step 6: A Web-Controlled LED')]),
    paragraph([
      text('The '),
      code('ESP8266WebServer'),
      text(' library ships with the core — nothing to install:'),
    ]),
  ]),
  codeBlock('cpp', WEB_SERVER, 'webled.ino'),
  textBlock([
    paragraph([
      text(
        'Upload, read the address from the serial monitor, and open it from any device on the same network.',
      ),
    ]),
    paragraph([
      bold('Keep '),
      code('loop()'),
      bold(' fast. '),
      text('The Wi-Fi stack runs between calls to '),
      code('loop()'),
      text('. A '),
      code('delay(5000)'),
      text(
        ' in there does not just pause your code, it starves the radio and can trigger a watchdog reset. Use millis() timing for anything periodic.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold('espcomm_sync failed / Failed to connect: '),
        text(
          'wrong port, a charge-only cable, or a missing CH340 driver. Unlike the ESP32, the NodeMCU auto-resets into the bootloader, so there is no button to hold.',
        ),
      ],
      [
        bold('Boots into a loop, or prints '),
        code('rst cause:4'),
        bold(' repeatedly: '),
        text('a watchdog reset. Something in '),
        code('loop()'),
        text(' blocks for too long, or a boot-mode pin (GPIO0/2/15) has something attached to it.'),
      ],
      [bold('LED behaves backwards: '), text('it is meant to. LOW is on — see Step 4.')],
      [
        bold('A wiring diagram’s GPIO number does not match the board: '),
        text('translate it with the table in Step 3. GPIO4 is the pin printed '),
        code('D2'),
        text('.'),
      ],
      [
        bold('Connects, then drops off the network after minutes: '),
        text(
          'usually power. The Wi-Fi radio pulls short bursts of several hundred milliamps, and a weak USB port or a long cable browns it out.',
        ),
      ],
      [bold('Never joins the network: '), text('a 5 GHz SSID. The ESP8266 is 2.4 GHz only.')],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [text('Add a DHT22 or BMP280 and publish readings over MQTT.')],
      [
        text('Use '),
        code('ESP8266HTTPClient'),
        text(' to push data to a web API instead of serving a page.'),
      ],
      [
        text(
          'Put the board into deep sleep between readings — wired D0 to RST, it can run for months on batteries.',
        ),
      ],
      [text('Move to the ESP32 tutorial when you need Bluetooth, more pins, or more RAM.')],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const tags = await ensureTagIds(payload, ['ESP8266', 'Microcontroller', 'IoT'])
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
      title: 'ESP8266 NodeMCU: Setup and Wi-Fi',
      slug: SLUG,
      description:
        'Set up a NodeMCU in the Arduino IDE, decode the D-label pin numbering, and serve a web page that switches the board’s (inverted) on-board LED.',
      // No NodeMCU photo in the library yet; placeholder until one is added.
      thumbnail: placeholderId,
      difficulty: 'beginner',
      tags,
      estimatedReadTime: 20,
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
