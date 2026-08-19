/**
 * Seed the "Non-Server Controller" resources - one for the ESP32, one for the
 * ESP8266.
 *
 *   pnpm tsx scripts/seedApRemoteResources.ts
 *
 * Ports the club's older Wi-Fi remote post. The board is its own access point
 * and serves its own page, so this works with no router, no internet, and no
 * account anywhere - the opposite trade-off to the ThingSpeak guides.
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

const ESP32_SKETCH = `// apRemote.ino - ESP32 as its own access point.
#include <WiFi.h>

// The network the BOARD creates. Anyone who joins it can control the LED,
// so pick a real password - 8 characters minimum, or the AP silently
// starts open.
const char* apSsid     = "EmbedClub-Node";
const char* apPassword = "changeThis123";

const int LED_PIN = 2;      // on-board LED on most ESP32 dev boards

WiFiServer server(80);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  WiFi.softAP(apSsid, apPassword);
  Serial.print("AP up, connect to it and open http://");
  Serial.println(WiFi.softAPIP());   // 192.168.4.1 by default

  server.begin();
}

void loop() {
  WiFiClient client = server.available();
  if (!client) return;

  // Read only the request line - that is all we need, and reading the whole
  // request without a timeout is how these sketches hang.
  String request = client.readStringUntil('\\r');
  client.readStringUntil('\\n');

  if (request.indexOf("/LEDON") != -1)  digitalWrite(LED_PIN, HIGH);
  if (request.indexOf("/LEDOFF") != -1) digitalWrite(LED_PIN, LOW);

  bool on = digitalRead(LED_PIN) == HIGH;

  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html");
  client.println("Connection: close");
  client.println();
  client.println("<!DOCTYPE html><html><head>");
  client.println("<meta name='viewport' content='width=device-width,initial-scale=1'>");
  client.println("<title>Node</title></head><body style='font-family:sans-serif;text-align:center;padding-top:3rem'>");
  client.print("<h1>LED is ");
  client.print(on ? "ON" : "OFF");
  client.println("</h1>");
  client.println("<p><a href='/LEDON'>Turn on</a> &nbsp; <a href='/LEDOFF'>Turn off</a></p>");
  client.println("</body></html>");

  client.stop();
}`

const ESP8266_SKETCH = `// apRemote.ino - ESP8266 / NodeMCU as its own access point.
#include <ESP8266WiFi.h>

const char* apSsid     = "EmbedClub-Node";
const char* apPassword = "changeThis123";

// GPIO2 is the D4 label, and it is the on-board LED - which is wired to 3.3V,
// so LOW turns it ON. The writes below look inverted because they are.
const int LED_PIN = 2;

WiFiServer server(80);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);   // HIGH = off on this board

  WiFi.softAP(apSsid, apPassword);
  Serial.print("AP up, connect to it and open http://");
  Serial.println(WiFi.softAPIP());   // 192.168.4.1 by default

  server.begin();
}

void loop() {
  WiFiClient client = server.available();
  if (!client) return;

  String request = client.readStringUntil('\\r');
  client.readStringUntil('\\n');

  if (request.indexOf("/LEDON") != -1)  digitalWrite(LED_PIN, LOW);    // on
  if (request.indexOf("/LEDOFF") != -1) digitalWrite(LED_PIN, HIGH);   // off

  bool on = digitalRead(LED_PIN) == LOW;

  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html");
  client.println("Connection: close");
  client.println();
  client.println("<!DOCTYPE html><html><head>");
  client.println("<meta name='viewport' content='width=device-width,initial-scale=1'>");
  client.println("<title>Node</title></head><body style='font-family:sans-serif;text-align:center;padding-top:3rem'>");
  client.print("<h1>LED is ");
  client.print(on ? "ON" : "OFF");
  client.println("</h1>");
  client.println("<p><a href='/LEDON'>Turn on</a> &nbsp; <a href='/LEDOFF'>Turn off</a></p>");
  client.println("</body></html>");

  client.stop();
}`

function buildContent({
  board,
  sketch,
  arduinoIdeSim,
  ledNote,
}: {
  board: string
  sketch: string
  arduinoIdeSim: number
  ledNote: ReturnType<typeof paragraph>
}) {
  return [
    textBlock([
      heading('h1', [text(`Non-Server Controller: ${board} Access Point`)], 'center'),
      paragraph([
        text(
          'No router, no internet, no account: the board makes its own Wi-Fi network and serves its own control page. You join that network from a phone, open one address, and switch the hardware. It works in a field, in an exam hall, and anywhere the Wi-Fi password is not yours to have.',
        ),
      ]),
      paragraph([
        bold('The trade-off against the ThingSpeak guide '),
        text(
          'is exactly reversed. That one reaches the board from anywhere but depends on a cloud service and takes seconds to respond. This one responds instantly and depends on nothing - but you have to be standing within Wi-Fi range.',
        ),
      ]),
      heading('h2', [text('What You Will Need')]),
      list('bullet', [
        [bold(`A ${board} board`)],
        [bold('Arduino IDE'), text(' with the board package installed')],
        [text('Nothing else - the on-board LED stands in for the load')],
      ]),
    ]),

    textBlock([heading('h2', [text('The Sketch')])]),
    codeBlock('cpp', sketch, 'apRemote.ino'),
    textBlock([ledNote]),

    textBlock([
      heading('h2', [text('Using It')]),
      list('number', [
        [text('Upload, then open the Serial Monitor at '), bold('115200'), text('.')],
        [text('On a phone or laptop, join the Wi-Fi network '), code('EmbedClub-Node'), text('.')],
        [text('Open '), code('http://192.168.4.1'), text(' in a browser.')],
        [text('Use the two links. The LED follows immediately.')],
      ]),
      paragraph([
        bold('Your phone will warn that the network has no internet '),
        text(
          'and may try to switch back to mobile data. Tell it to stay connected - on Android this is usually a notification you have to tap, and on iOS it is the "Wi-Fi Assist" setting.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Things Worth Knowing')]),
      list('bullet', [
        [
          bold('Set a real password. '),
          code('softAP()'),
          text(' with a password under 8 characters silently creates an '),
          italic('open'),
          text(' network instead of failing, and then anyone nearby can control the board.'),
        ],
        [
          bold('192.168.4.1 is the default. '),
          text(
            'It is not magic - it is just what the ESP AP stack hands itself. The sketch prints it so you never have to remember.',
          ),
        ],
        [
          bold('Roughly four clients at once. '),
          text(
            'The AP is meant for a phone or two, not a classroom. Beyond that, join a real router instead and serve the page there.',
          ),
        ],
        [
          bold('This is not secure, it is just private. '),
          text(
            'The page has no login, so anyone on the board’s network has full control. That is acceptable because the network is yours and short-range; it is not acceptable on a shared Wi-Fi.',
          ),
        ],
      ]),
      heading('h2', [text('Troubleshooting')]),
      list('bullet', [
        [
          bold('Network does not appear: '),
          text('the sketch did not upload, or the board is in bootloader mode. Tap reset.'),
        ],
        [
          bold('Joins, but the page never loads: '),
          text('the phone fell back to mobile data. Disable it and retry.'),
        ],
        [
          bold('Page loads once, then hangs: '),
          text('a client was left open. The '),
          code('client.stop()'),
          text(' at the end of loop() is what prevents that.'),
        ],
        [
          bold('LED does the opposite of what you asked: '),
          text('see the note above - on-board LEDs are often wired active-low.'),
        ],
      ]),
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [text('Drive a relay instead of the LED to switch a real appliance.')],
        [text('Add a captive portal so joining the network pops the page up on its own.')],
        [
          text(
            'Compare with the ThingSpeak guide when the board needs to be reachable from outside the room.',
          ),
        ],
      ]),
    ]),

    simulatorLinkBlock(arduinoIdeSim, 'Get the Arduino IDE'),
  ]
}

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: 'esp32-access-point-remote',
    data: {
      title: 'Non-Server Controller: ESP32 Access Point',
      slug: 'esp32-access-point-remote',
      description:
        'Make an ESP32 its own Wi-Fi network and serve a control page from it - no router, no internet, no account.',
      thumbnail: placeholderId,
      difficulty: 'beginner',
      tags: await ensureTagIds(payload, ['ESP32', 'IoT', 'Microcontroller']),
      estimatedReadTime: 10,
      content: buildContent({
        board: 'ESP32',
        sketch: ESP32_SKETCH,
        arduinoIdeSim,
        ledNote: paragraph([
          bold('GPIO2 '),
          text(
            'is the on-board LED on most ESP32 dev boards, and it is wired the normal way round - HIGH is on. Swap in any output pin to drive a relay instead.',
          ),
        ]),
      }),
    },
  })

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: 'esp8266-access-point-remote',
    data: {
      title: 'Non-Server Controller: ESP8266 Access Point',
      slug: 'esp8266-access-point-remote',
      description:
        'Make a NodeMCU its own Wi-Fi network and serve a control page from it - including the inverted on-board LED that makes the code look wrong.',
      thumbnail: placeholderId,
      difficulty: 'beginner',
      tags: await ensureTagIds(payload, ['ESP8266', 'IoT', 'Microcontroller']),
      estimatedReadTime: 10,
      content: buildContent({
        board: 'ESP8266',
        sketch: ESP8266_SKETCH,
        arduinoIdeSim,
        ledNote: paragraph([
          bold('The inverted LED is not a typo. '),
          text('GPIO2 (the '),
          code('D4'),
          text(
            ' label) has its anode on 3.3V, so the pin sinks current to light it and LOW means on. Every ESP8266 example you copy will trip over this once.',
          ),
        ]),
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
