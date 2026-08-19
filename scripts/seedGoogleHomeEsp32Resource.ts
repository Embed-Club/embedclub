/**
 * Seed the "Home Automation with Google Home" resource, for the ESP32.
 *
 *   pnpm tsx scripts/seedGoogleHomeEsp32Resource.ts
 *
 * Ports the club's older Sinric Pro post, which was written for a NodeMCU, to
 * the ESP32 as requested. Every credential in the original listing - the Sinric
 * app key and secret, the device ids, and the Wi-Fi password - is replaced with
 * a placeholder here; see the note in the content.
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

const SLUG = 'esp32-home-automation-google-home-sinric-pro'

const SKETCH = `// googleHome.ino - ESP32 + Sinric Pro, with physical switches that still work.
#include <WiFi.h>
#include <SinricPro.h>
#include <SinricProSwitch.h>
#include <map>

#define WIFI_SSID   "YOUR_WIFI_NAME"
#define WIFI_PASS   "YOUR_WIFI_PASSWORD"

// From the Sinric Pro portal: Credentials, then each device's own page.
// These are secrets. Anyone holding them can control your house - never
// commit them, screenshot them, or paste them into a blog post.
#define APP_KEY     "YOUR_APP_KEY"
#define APP_SECRET  "YOUR_APP_SECRET"

#define BAUD_RATE     115200
#define DEBOUNCE_TIME 250

// deviceId -> { relay pin, flip-switch pin, last state, last change }
typedef struct {
  int relayPin;
  int flipPin;
  bool lastFlipState;
  unsigned long lastFlipChange;
} DeviceConfig;

// GPIO numbers, not D labels - the ESP32 has none. These four relay pins and
// four switch pins are all safe outputs/inputs on a standard dev board.
std::map<String, DeviceConfig> devices = {
  { "YOUR_DEVICE_ID_1", { 23, 13, true, 0 } },
  { "YOUR_DEVICE_ID_2", { 22, 12, true, 0 } },
  { "YOUR_DEVICE_ID_3", { 21, 14, true, 0 } },
  { "YOUR_DEVICE_ID_4", { 19, 27, true, 0 } },
};

void setupPins() {
  for (auto &entry : devices) {
    pinMode(entry.second.relayPin, OUTPUT);
    // Relay modules are almost always active LOW: HIGH is off.
    digitalWrite(entry.second.relayPin, HIGH);

    // INPUT_PULLUP so the switch needs two wires and no resistor.
    pinMode(entry.second.flipPin, INPUT_PULLUP);
    entry.second.lastFlipState = digitalRead(entry.second.flipPin);
  }
}

// Called when Google Home (via Sinric Pro) asks for a change.
bool onPowerState(const String &deviceId, bool &state) {
  auto it = devices.find(deviceId);
  if (it == devices.end()) return false;

  digitalWrite(it->second.relayPin, state ? LOW : HIGH);   // active LOW
  return true;
}

// Physical switches. Polled with a debounce rather than an interrupt: these
// are mechanical toggles, and a bouncing contact fires an interrupt dozens of
// times per flip.
void handleFlipSwitches() {
  unsigned long now = millis();

  for (auto &entry : devices) {
    DeviceConfig &cfg = entry.second;
    bool state = digitalRead(cfg.flipPin);

    if (state != cfg.lastFlipState && now - cfg.lastFlipChange > DEBOUNCE_TIME) {
      cfg.lastFlipChange = now;
      cfg.lastFlipState = state;

      bool on = digitalRead(cfg.relayPin) == HIGH;   // active LOW, so invert
      digitalWrite(cfg.relayPin, on ? LOW : HIGH);

      // Tell the cloud, so the app and Google agree with the wall switch.
      SinricProSwitch &device = SinricPro[entry.first];
      device.sendPowerStateEvent(on);
    }
  }
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print("."); }
  Serial.println();
  Serial.print("connected, IP = ");
  Serial.println(WiFi.localIP());
}

void setupSinricPro() {
  for (auto &entry : devices) {
    SinricProSwitch &device = SinricPro[entry.first];
    device.onPowerState(onPowerState);
  }
  SinricPro.begin(APP_KEY, APP_SECRET);
}

void setup() {
  Serial.begin(BAUD_RATE);
  setupPins();
  setupWiFi();
  setupSinricPro();
}

void loop() {
  SinricPro.handle();      // keeps the websocket alive - must run often
  handleFlipSwitches();
}`

const CONTENT_HEADING = 'ESP32 Home Automation with Google Home and Sinric Pro'

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const arduinoIdeSim = await simulatorId(payload, 'arduino-ide')
  const tags = await ensureTagIds(payload, ['ESP32', 'IoT', 'Microcontroller'])

  const content = [
    textBlock([
      heading('h1', [text(CONTENT_HEADING)], 'center'),
      paragraph([
        text(
          '"Hey Google, turn on the fan." This is the full path: an ESP32 driving relays, Sinric Pro as the bridge, and Google Home as the voice front-end. The part most guides skip is the one that makes it usable - the physical wall switches keep working, and the app stays in sync when someone uses them.',
        ),
      ]),
      paragraph([
        bold('Why a bridge service at all: '),
        text(
          'Google will not talk to a hobby board directly. It talks to certified cloud services, and Sinric Pro is one that offers a free tier and an Arduino library. The ESP32 holds an outbound websocket to Sinric Pro, so nothing has to be opened on your router.',
        ),
      ]),
      heading('h2', [text('What You Will Need')]),
      list('bullet', [
        [bold('An ESP32 dev board')],
        [bold('A relay module'), text(' - a 4-channel board is the usual choice')],
        [text('Toggle or rocker switches, one per channel, if you want manual control')],
        [text('A free account at '), bold('sinric.pro')],
        [text('The Google Home app, signed in to the same Google account')],
        [bold('A 2.4 GHz Wi-Fi network')],
      ]),
      paragraph([
        bold('Mains wiring is the dangerous part of this project. '),
        text(
          'Relays switching 230V should be in an enclosure, wired by someone who knows what they are doing, and never worked on live. Everything below can be built and tested with the relay module’s LEDs alone - do that first, and add the load last.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 1: Set Up Sinric Pro')]),
      list('number', [
        [text('Sign up at '), bold('sinric.pro'), text(' and open the portal.')],
        [text('Go to '), bold('Devices → Add Device'), text('.')],
        [
          text('Device type '),
          bold('Switch'),
          text('. Name it what you want to say out loud - "Fan", "Study Light".'),
        ],
        [
          text('Save, and copy the '),
          bold('Device ID'),
          text(' it generates. Repeat per relay channel.'),
        ],
        [
          text('Open '),
          bold('Credentials'),
          text(' and copy the '),
          bold('App Key'),
          text(' and '),
          bold('App Secret'),
          text('.'),
        ],
      ]),
      paragraph([
        bold('Those two strings are credentials, not configuration. '),
        text(
          'They authenticate your hardware to the service, so anyone who has them can switch your devices. Keep them out of screenshots, out of shared code, and out of anything published - and if they do get out, rotate them from the same Credentials page.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 2: Libraries')]),
      paragraph([
        text('Install these from '),
        bold('Sketch → Include Library → Manage Libraries'),
        text(':'),
      ]),
      list('bullet', [
        [bold('SinricPro'), text(' - the official library')],
        [bold('ArduinoJson'), text(' - a dependency; version 6 or later')],
        [bold('WebSockets'), text(' by Markus Sattler - the other dependency')],
      ]),
      paragraph([
        text(
          'If the sketch fails to compile with errors inside the library rather than your code, it is almost always an ',
        ),
        code('ArduinoJson'),
        text(
          ' major-version mismatch. Check which version the installed SinricPro release asks for.',
        ),
      ]),
    ]),

    textBlock([heading('h2', [text('Step 3: The Sketch')])]),
    codeBlock('cpp', SKETCH, 'googleHome.ino'),

    textBlock([
      heading('h2', [text('Two Details That Matter')]),
      list('bullet', [
        [
          bold('Relay modules are active LOW. '),
          text('Writing '),
          code('HIGH'),
          text(
            ' turns most of them off. Get this backwards and every appliance switches on the moment the board boots, which is worse than it sounds when the load is real.',
          ),
        ],
        [
          bold('sendPowerStateEvent is what keeps things honest. '),
          text(
            'Without it, flipping the wall switch changes the relay but not the cloud, so the app shows "off" while the light is on - and the next voice command does nothing, because Google thinks it is already in that state.',
          ),
        ],
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 4: Connect Google Home')]),
      list('number', [
        [text('Open the '), bold('Google Home'), text(' app.')],
        [text('Tap '), bold('+ → Set up device → Works with Google'), text('.')],
        [text('Search for '), bold('Sinric Pro'), text(' and sign in with your Sinric account.')],
        [text('Your devices appear. Assign each to a room.')],
        [text('Say "Hey Google, turn on the fan."')],
      ]),
      paragraph([
        italic('Name things for speech, not for code. '),
        text('"Relay 1" is a name nobody will ever say correctly to a speaker.'),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Troubleshooting')]),
      list('bullet', [
        [
          bold('Device shows offline: '),
          text(
            'the board is not reaching Sinric. Check the serial monitor for the websocket connecting, and confirm the app key and secret.',
          ),
        ],
        [
          bold('Google says "something went wrong": '),
          text(
            'the device id in the sketch does not match the portal. They are per-device, and easy to paste in the wrong slot.',
          ),
        ],
        [bold('Everything switches on at boot: '), text('the active-LOW inversion. See above.')],
        [
          bold('Wall switch works, app does not follow: '),
          text('the '),
          code('sendPowerStateEvent'),
          text(' call is missing or unreachable.'),
        ],
        [
          bold('Switch fires several times per flip: '),
          text('raise '),
          code('DEBOUNCE_TIME'),
          text('. 250 ms suits most toggles; cheap rockers may need more.'),
        ],
        [bold('Board never joins Wi-Fi: '), text('a 5 GHz network. The ESP32 is 2.4 GHz only.')],
      ]),
      heading('h2', [text('Where to Go Next')]),
      list('bullet', [
        [text('Add a temperature sensor as a second Sinric device type and read it aloud.')],
        [text('For control without a voice assistant, see the ThingSpeak remote guide.')],
        [
          text(
            'Move to local control with Home Assistant and ESPHome if you would rather nothing left the house.',
          ),
        ],
      ]),
    ]),

    simulatorLinkBlock(arduinoIdeSim, 'Get the Arduino IDE'),
  ]

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: SLUG,
    data: {
      title: 'Home Automation with Google Home (ESP32)',
      slug: SLUG,
      description:
        'Voice-control relays from an ESP32 using Sinric Pro and Google Home - with physical wall switches that keep working and stay in sync.',
      thumbnail: placeholderId,
      difficulty: 'advanced',
      tags,
      estimatedReadTime: 18,
      badge: 'popular',
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
