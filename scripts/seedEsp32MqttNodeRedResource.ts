/**
 * Seed the "ESP32 + DHT22 -> MQTT -> Node-RED" resource.
 *
 *   pnpm tsx scripts/seedEsp32MqttNodeRedResource.ts
 *
 * Screenshots are uploaded from a local folder, not from the repo, so the
 * images live in the media collection and the repo stays free of 27 PNGs.
 * Point HIVEMQ_IMAGE_DIR somewhere else if the folder moves.
 *
 * Matched on slug, so re-running updates in place. Live immediately.
 */
import { homedir } from 'node:os'
import path from 'node:path'
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  code,
  codeBlock,
  ensureMediaFromFile,
  ensureTagIds,
  flushExit,
  heading,
  imageBlock,
  italic,
  link,
  list,
  paragraph,
  simulatorId,
  simulatorLinkBlock,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'esp32-dht22-mqtt-node-red-dashboard'

const IMAGE_DIR = process.env.HIVEMQ_IMAGE_DIR ?? path.join(homedir(), 'Documents', 'HiveMQ')

const SKETCH = `/*
  ESP32 + DHT22 -> MQTT -> Node-RED demo (Wokwi)

  Wiring:
    DHT22 VCC -> ESP32 3V3
    DHT22 SDA -> ESP32 GPIO15
    DHT22 NC  -> not connected
    DHT22 GND -> ESP32 GND

  MQTT: using the public broker.hivemq.com for a quick test.
  This is a public broker, so don't put private data on it.
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHTesp.h>

// ---- Wiring ----
#define DHT_PIN 15

// ---- WiFi (Wokwi's built-in virtual network) ----
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// ---- MQTT ----
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT   = 1883;
const char* MQTT_CLIENT_ID = "embedclub-YOURNAME-esp32";

// Change YOURNAME below too, so your topics don't collide with anyone else's
const char* TOPIC_TEMPERATURE = "embedclub/YOURNAME/dht22/temperature";
const char* TOPIC_HUMIDITY    = "embedclub/YOURNAME/dht22/humidity";

DHTesp dht;
WiFiClient espClient;
PubSubClient mqtt(espClient);

void connectWiFi() {
  Serial.printf("Connecting to WiFi \\"%s\\" ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(" connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT broker...");
    if (mqtt.connect(MQTT_CLIENT_ID)) {
      Serial.println(" connected!");
    } else {
      Serial.printf(" failed, rc=%d, retrying in 2s\\n", mqtt.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  dht.setup(DHT_PIN, DHTesp::DHT22);

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  if (!mqtt.connected()) {
    connectMQTT();
  }
  mqtt.loop();

  TempAndHumidity reading = dht.getTempAndHumidity();

  if (dht.getStatus() != 0) {
    Serial.print("DHT22 error: ");
    Serial.println(dht.getStatusString());
  } else {
    char tempStr[8];
    char humStr[8];
    dtostrf(reading.temperature, 4, 1, tempStr);
    dtostrf(reading.humidity, 4, 1, humStr);

    Serial.printf("Temp: %s C  Humidity: %s %%\\n", tempStr, humStr);

    mqtt.publish(TOPIC_TEMPERATURE, tempStr);
    mqtt.publish(TOPIC_HUMIDITY, humStr);
  }

  delay(2500); // DHT22 refreshes at most every ~2s
}`

const SERIAL_OUTPUT = `Connecting to WiFi "Wokwi-GUEST" ..... connected!
IP address: 10.10.0.2
Connecting to MQTT broker... connected!
Temp: 24.0 C  Humidity: 40.0 %`

const INSTALL_NODE_RED = `npm install -g --unsafe-perm node-red
node-red`

const CONTENT_HEADING = 'ESP32 + DHT22 + MQTT + Node-RED: A Live IoT Dashboard'

/** Upload one screenshot from the folder and return a medium image block. */
async function shot(
  // biome-ignore lint/suspicious/noExplicitAny: Payload instance, typed at the call site
  payload: any,
  file: string,
  alt: string,
  caption: string,
) {
  const id = await ensureMediaFromFile(payload, path.join(IMAGE_DIR, file), alt)
  return imageBlock(id, caption, 'medium')
}

async function main() {
  const payload = await getPayload({ config })
  const tags = await ensureTagIds(payload, ['ESP32', 'IoT', 'MQTT', 'Node-RED'])
  const wokwiSim = await simulatorId(payload, 'wokwi')

  const thumbnail = await ensureMediaFromFile(
    payload,
    path.join(IMAGE_DIR, 'ValuesShowing.png'),
    'Node-RED dashboard showing live temperature and humidity gauges',
  )

  const content = [
    textBlock([
      heading('h1', [text(CONTENT_HEADING)], 'center'),
      paragraph([
        text(
          'You simulate an ESP32 reading a DHT22 temperature and humidity sensor, publish the readings over MQTT to a real broker on the internet, and watch them move on a Node-RED dashboard. No hardware needed. A browser and Node.js on your machine is the whole shopping list.',
        ),
      ]),
      paragraph([
        bold('What is real and what is not: '),
        text('Only the chip and the sensor are simulated. '),
        link([text('Wokwi')], 'https://wokwi.com', { newTab: true }),
        text(
          ' runs the ESP32 in your browser but gives the simulated board actual internet access, so the network, the broker, and the dashboard are all real. The readings really do leave your browser, cross a public broker in Germany, and come back into Node-RED on your laptop.',
        ),
      ]),
      heading('h2', [text('Pick a unique topic prefix first')]),
      paragraph([
        text('If everyone uses the same topic, such as '),
        code('dht22/temperature'),
        text(
          ", you will all see each other's data mixed together, plus whatever a stranger happens to be publishing, because the broker is public and anyone can write to it. Replace ",
        ),
        code('YOURNAME'),
        text(' everywhere below with your name or roll number, no spaces. For example '),
        code('embedclub/rafan42/dht22/temperature'),
        text('.'),
      ]),
      paragraph([
        italic(
          'The screenshots in this guide were taken with the prefix session/dht22/, so use your own prefix rather than copying what you see in the images.',
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 1: Create a Wokwi project')]),
      list('number', [
        [text('Go to '), bold('wokwi.com'), text(' and click '), bold('New Project'), text('.')],
        [text('Choose the '), bold('ESP32'), text(' template.')],
        [text('An account is only needed to save a project, not to run one.')],
      ]),
      heading('h2', [text('Step 2: Add and wire the DHT22')]),
      paragraph([
        text('Open the diagram editor, search the parts list for '),
        bold('DHT22'),
        text(', drag it onto the canvas, and wire it up:'),
      ]),
      list('bullet', [
        [bold('VCC'), text(' to ESP32 '), bold('3V3')],
        [bold('SDA'), text(' to ESP32 '), bold('GPIO 15')],
        [bold('NC'), text(' stays unconnected')],
        [bold('GND'), text(' to ESP32 '), bold('GND')],
      ]),
      paragraph([
        text('The pin labelled '),
        code('SDA'),
        text(
          " on the DHT22 is a label and nothing more. There is no I2C here, it is the sensor's single data wire.",
        ),
      ]),
    ]),
    await shot(
      payload,
      'CircuitDiagram.png',
      'DHT22 wired to an ESP32 in the Wokwi diagram editor',
      'Four wires. Green for 3V3 and data, black for ground.',
    ),

    textBlock([
      heading('h2', [text('Step 3: Add the libraries')]),
      paragraph([text('Open the '), bold('Library Manager'), text(' tab in Wokwi and add:')]),
      list('bullet', [
        [
          bold('DHT sensor library for ESPx'),
          text(' by beegee-tokyo, which gives you the '),
          code('DHTesp'),
          text(' class'),
        ],
        [bold('PubSubClient'), text(" by Nick O'Leary, the MQTT client")],
      ]),
      heading('h2', [text('Step 4: Write the firmware')]),
      paragraph([
        text('Paste this into '),
        code('sketch.ino'),
        text(', replacing '),
        code('YOURNAME'),
        text(':'),
      ]),
    ]),
    codeBlock('cpp', SKETCH, 'sketch.ino'),

    textBlock([
      heading('h2', [text('Step 5: Run it')]),
      paragraph([
        text('Click the green '),
        bold('Run'),
        text(' button. The first build takes a while because Wokwi compiles on a shared queue.'),
      ]),
    ]),
    await shot(
      payload,
      'CodeCompile.png',
      'Wokwi compiling the ESP32 sketch',
      'Compiling. A build that sits here for a minute is normal, and the upgrade prompt can be ignored.',
    ),
    textBlock([
      paragraph([text('Watch the serial monitor in the bottom panel. You are looking for:')]),
    ]),
    codeBlock('bash', SERIAL_OUTPUT, 'Serial Monitor'),
    textBlock([
      paragraph([
        text(
          "The numbers sit still because Wokwi's virtual DHT22 returns fixed readings. Click the sensor in the simulation view and drag its temperature and humidity sliders to change them while the sketch runs.",
        ),
      ]),
    ]),
    await shot(
      payload,
      'VerifyingConnectionToMQTT.png',
      'Wokwi simulation with the DHT22 sliders open and serial output showing published readings',
      'Sliders at 40.5 C and 75%, and the serial monitor reporting the same values going out to the broker.',
    ),
    textBlock([
      paragraph([
        bold('If you see "Build Servers Busy": '),
        text(
          "that is Wokwi's shared compile queue, not your code. Close the dialog and click Run again. It usually clears within a minute.",
        ),
      ]),
    ]),

    textBlock([
      heading('h2', [text('Step 6: Check the data with a public MQTT client')]),
      paragraph([
        text(
          'This step is optional, but it splits the problem in half. If the readings show up here, the firmware and the broker are fine and anything that goes wrong later is a Node-RED problem.',
        ),
      ]),
      list('number', [
        [
          text('Open '),
          link(
            [text("HiveMQ's public WebSocket client")],
            'https://www.hivemq.com/demos/websocket-client/',
            { newTab: true },
          ),
          text('.'),
        ],
        [
          text('Click '),
          bold('Connect'),
          text('. The defaults already point at the right broker.'),
        ],
        [
          text('Expand '),
          bold('Subscriptions'),
          text(', add the topic '),
          code('embedclub/YOURNAME/dht22/#'),
          text(', and click Subscribe.'),
        ],
        [text('Expand '), bold('Messages'), text('.')],
      ]),
    ]),
    await shot(
      payload,
      'HiveMQPage.png',
      'HiveMQ websocket client before connecting',
      'The client opens disconnected. The host and port are already filled in.',
    ),
    await shot(
      payload,
      'AfterConnectingHiveMQ.png',
      'HiveMQ websocket client after connecting to the broker',
      'Connected. Now it will accept a subscription.',
    ),
    await shot(
      payload,
      'TypingTopicHiveMQ.png',
      'Adding a topic subscription in the HiveMQ websocket client',
      'The # wildcard catches both temperature and humidity in one subscription.',
    ),
    await shot(
      payload,
      'ReadingsFromWokwiInHiveMQ.png',
      'Messages arriving in the HiveMQ websocket client',
      'Readings arriving every 2.5 seconds. Your data is on the internet.',
    ),

    textBlock([
      heading('h2', [text('Step 7: Install Node-RED')]),
      paragraph([
        text(
          'Node-RED is not a website. It is a program that runs on your own computer, and your browser only displays its editor.',
        ),
      ]),
    ]),
    codeBlock('bash', INSTALL_NODE_RED, 'Terminal'),
    await shot(
      payload,
      'NodeREDInstall.png',
      'npm installing node-red globally',
      'The global install pulls in a few hundred packages and takes about half a minute.',
    ),
    await shot(
      payload,
      'StartingNodeRED.png',
      'Node-RED starting up in a terminal',
      'The line to look for is "Server now running at http://127.0.0.1:1880/". Leave this terminal open, because closing it stops Node-RED.',
    ),
    textBlock([
      paragraph([
        text('Open '),
        code('http://localhost:1880'),
        text(' in your browser and you get an empty flow.'),
      ]),
    ]),
    await shot(
      payload,
      'NodeREDPage.png',
      'The empty Node-RED editor',
      'Palette on the left, canvas in the middle, sidebar on the right.',
    ),

    textBlock([
      heading('h2', [text('Step 8: Install the dashboard palette')]),
      paragraph([
        text('The gauge nodes are not built in. Use the hamburger menu at the top right, then '),
        bold('Manage palette'),
        text(', then the '),
        bold('Install'),
        text(' tab, and search for '),
        code('node-red-dashboard'),
        text('.'),
      ]),
    ]),
    await shot(
      payload,
      'OpeningManagePalette.png',
      'Opening Manage palette from the Node-RED menu',
      'Manage palette lives in the hamburger menu.',
    ),
    await shot(
      payload,
      'InstallNodeRedDashboard.png',
      'Searching for node-red-dashboard in the palette manager',
      'Install node-red-dashboard, not one of the forks that come up alongside it.',
    ),
    await shot(
      payload,
      'NodeRedLibraryInstalled.png',
      'The dashboard palette installed in Node-RED',
      'A "dashboard" section appears at the bottom of the palette once it finishes.',
    ),

    textBlock([
      heading('h2', [text('Step 9: Build the flow')]),
      paragraph([
        text('Drag two '),
        bold('mqtt in'),
        text(' nodes onto the canvas. They are the teal ones under '),
        bold('network'),
        text(
          '. The orange triangle on each means it is not configured yet, which is expected at this point.',
        ),
      ]),
    ]),
    await shot(
      payload,
      'ImportingMQTT.png',
      'Two unconfigured mqtt in nodes on the Node-RED canvas',
      'Two mqtt in nodes, one per reading.',
    ),
    textBlock([
      paragraph([
        text('Double-click the first one. Server is '),
        code('none'),
        text(' and the topic is empty.'),
      ]),
    ]),
    await shot(
      payload,
      'SettingUpMQTTIN1.png',
      'The mqtt in node edit dialog before configuration',
      'The red outline on Topic is the node telling you it needs a value.',
    ),
    textBlock([
      paragraph([
        text('Click the pencil next to '),
        bold('Server'),
        text(' to add a broker: server '),
        code('broker.hivemq.com'),
        text(', port '),
        code('1883'),
        text(', security left blank. Then click '),
        bold('Add'),
        text('.'),
      ]),
    ]),
    await shot(
      payload,
      'ConnectingToHiveMQIn.png',
      'Adding broker.hivemq.com as an mqtt broker config node',
      'Leave TLS off. Port 1883 is the plain, unencrypted port, which is why this broker is fine for a demo and not for anything private.',
    ),
    textBlock([
      paragraph([
        text("Set this node's "),
        bold('Topic'),
        text(
          ' to your temperature topic, then do the same for the second node with the humidity topic. The broker is already configured, so the second node just reuses it from the dropdown.',
        ),
      ]),
    ]),
    await shot(
      payload,
      'UpdatingSameForHumidity.png',
      'The first mqtt in node subscribed to the temperature topic',
      'First node: the temperature topic.',
    ),
    await shot(
      payload,
      'UpdatingTemperature.png',
      'The second mqtt in node subscribed to the humidity topic',
      'Second node: the humidity topic, same broker.',
    ),
    textBlock([
      paragraph([
        text('Now drag two '),
        bold('gauge'),
        text(' nodes from the dashboard section onto the canvas.'),
      ]),
    ]),
    await shot(
      payload,
      'AddTwoGuages.png',
      'Two unconfigured gauge nodes next to the mqtt in nodes',
      'The gauges carry the same warning triangle until they belong to a dashboard group.',
    ),
    textBlock([
      paragraph([
        text('Double-click a gauge. '),
        bold('Group'),
        text(' is '),
        code('none'),
        text(
          ', which is what the warning triangle is about. A gauge has to live inside a group, and a group has to live on a tab.',
        ),
      ]),
    ]),
    await shot(
      payload,
      'EditingGuage.png',
      'The gauge node edit dialog with no group assigned',
      'Group set to none. This is the cause of the "Invalid properties: - group" error people hit here.',
    ),
    textBlock([
      paragraph([
        text('Click the pencil next to '),
        bold('Group'),
        text(', name the group something like '),
        code('DHT22'),
        text(', then use the pencil next to '),
        bold('Tab'),
        text(' to create a tab called '),
        code('Home'),
        text('. Click Add through both dialogs.'),
      ]),
    ]),
    await shot(
      payload,
      'AddingTabValue.png',
      'Creating a dashboard group named DHT22 on the Home tab',
      'One group on one tab is enough. Both gauges go in it.',
    ),
    textBlock([
      paragraph([
        text(
          'Give each gauge a label and a sensible range. Temperature and humidity need different ranges, and a gauge with the wrong range either pins at the end or never moves.',
        ),
      ]),
    ]),
    await shot(
      payload,
      'UpdatingTemperatureGuage.png',
      'Gauge configured for temperature with a range of -50 to 50',
      'Temperature: -50 to 50.',
    ),
    await shot(
      payload,
      'UpdatingHumidityGuage.png',
      'Gauge configured for humidity with a range of 0 to 100',
      'Humidity: 0 to 100, because humidity is a percentage.',
    ),
    textBlock([
      paragraph([
        text(
          "Wire each mqtt in node's output to a gauge's input by dragging from one port to the other.",
        ),
      ]),
    ]),
    await shot(
      payload,
      'ConnectingMQTTInToGuage.png',
      'Each mqtt in node wired to its gauge in Node-RED',
      'Two independent pairs. Nothing crosses over.',
    ),

    textBlock([
      heading('h2', [text('Step 10: Deploy and watch it move')]),
      paragraph([
        text('Nothing you have drawn is running yet. Click '),
        bold('Deploy'),
        text(' at the top right to push the flow to the Node-RED runtime.'),
      ]),
    ]),
    await shot(
      payload,
      'Deploy.png',
      'Deploying the flow in Node-RED',
      'The mqtt nodes turn green and say "connected" once the deploy lands.',
    ),
    textBlock([
      paragraph([
        text('Open '),
        code('http://localhost:1880/ui'),
        text(' in a new tab. That is the dashboard, separate from the editor.'),
      ]),
    ]),
    await shot(
      payload,
      'OpeningUIPage.png',
      'Opening the Node-RED dashboard UI',
      'The /ui path is the dashboard the palette added.',
    ),
    await shot(
      payload,
      'ValuesShowing.png',
      'Live temperature and humidity gauges on the Node-RED dashboard',
      'Live values, updating every 2.5 seconds. Go back to Wokwi, drag the sliders, and these needles follow.',
    ),

    textBlock([
      heading('h2', [text('When something does not work')]),
      list('bullet', [
        [
          bold('"Build Servers Busy" in Wokwi: '),
          text('the shared compile queue is overloaded. Retry.'),
        ],
        [
          bold('WiFi never connects: '),
          text('the SSID has to be exactly '),
          code('Wokwi-GUEST'),
          text(', case-sensitive, with an empty password.'),
        ],
        [
          bold('MQTT connects but the dashboard stays empty: '),
          text(
            'the topics do not match between the firmware and Node-RED. Check both ends character by character, including your YOURNAME substitution.',
          ),
        ],
        [
          bold('You see readings that are not yours: '),
          text('someone else is on the same prefix. Make yours longer and stranger.'),
        ],
        [
          bold('"Please add some UI nodes and redeploy": '),
          text('the gauges exist in the editor but were never deployed.'),
        ],
        [
          bold('Red triangle and "Invalid properties: - group": '),
          text('the gauge has no dashboard group. See step 9.'),
        ],
      ]),
      heading('h2', [text('About the broker')]),
      paragraph([
        text('This guide uses '),
        code('broker.hivemq.com'),
        text(
          ' because it needs no account and no setup. Anyone in the world can publish or subscribe to any topic on it, which is the whole reason the unique prefix matters, and the reason nothing sensitive should go near it. For a real project, run your own broker such as ',
        ),
        link([text('Mosquitto')], 'https://mosquitto.org/', { newTab: true }),
        text(' locally or on a server, and point both the firmware and Node-RED at that address.'),
      ]),
      heading('h2', [text('Where to take it next')]),
      list('bullet', [
        [
          text(
            'Add a chart node beside the gauges to get history instead of a single instant value.',
          ),
        ],
        [
          text(
            'Publish JSON instead of a bare number, so one topic carries both readings and a timestamp.',
          ),
        ],
        [
          text(
            'Swap the simulated board for a real ESP32 and a real DHT22. The sketch does not change.',
          ),
        ],
      ]),
    ]),

    simulatorLinkBlock(wokwiSim, 'Open Wokwi'),
  ]

  await upsertLearningDoc({
    payload,
    collection: 'resources',
    slug: SLUG,
    data: {
      title: 'ESP32 to Node-RED over MQTT (No Hardware Needed)',
      slug: SLUG,
      description:
        'Simulate an ESP32 and DHT22 in Wokwi, publish readings to a public MQTT broker, and watch them on a live Node-RED dashboard running on your own machine.',
      thumbnail,
      difficulty: 'intermediate',
      tags,
      estimatedReadTime: 20,
      badge: 'featured',
      content,
    },
  })
}

// Top-level await, not a floating promise: `payload run` exits as soon as the
// module body finishes, so a `main().then(...)` chain never gets to run.
try {
  await main()
  flushExit(0)
} catch (err) {
  console.error(err)
  flushExit(1)
}
