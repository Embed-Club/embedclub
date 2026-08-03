/**
 * Seed the "Raspberry Pi Pico W: Wi-Fi and a Web-Controlled LED" tutorial.
 *
 *   pnpm tsx scripts/seedRaspberryPiPicoWTutorial.ts
 *
 * Separate from the plain Pico tutorial: the firmware image is different, the
 * on-board LED moves to the wireless chip, and the whole point of the board is
 * the networking the other page does not cover.
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
  italic,
  list,
  paragraph,
  placeholderImage,
  text,
  textBlock,
  upsertLearningDoc,
} from './lib/learningSeed'

const SLUG = 'raspberry-pi-pico-w-wifi-web-led'

const LED_DIFFERENCE = `# On the Pico W the on-board LED is NOT GPIO 25 — it hangs off the CYW43
# wireless chip, so it is addressed by name. Pin(25) is a real GPIO here and
# does nothing visible.
from machine import Pin

led = Pin("LED", Pin.OUT)   # correct on Pico W
led.on()`

const WIFI_CONNECT = `# wifi.py — connect, with a timeout so a bad password does not hang forever.
import network
import time

SSID = "YOUR_WIFI_NAME"
PASSWORD = "YOUR_WIFI_PASSWORD"

def connect():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(SSID, PASSWORD)

    # Never loop on this without a bound. wlan.isconnected() stays False
    # forever on a wrong password, and the board just appears dead.
    for _ in range(20):
        if wlan.isconnected():
            break
        print("connecting...")
        time.sleep(1)

    if not wlan.isconnected():
        raise RuntimeError("wifi failed, status = %d" % wlan.status())

    print("connected, IP =", wlan.ifconfig()[0])
    return wlan

connect()`

const WEB_SERVER = `# main.py — serve a page with two buttons that switch the LED.
import network
import socket
import time
from machine import Pin

SSID = "YOUR_WIFI_NAME"
PASSWORD = "YOUR_WIFI_PASSWORD"

led = Pin("LED", Pin.OUT)

def connect():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(SSID, PASSWORD)
    for _ in range(20):
        if wlan.isconnected():
            break
        time.sleep(1)
    if not wlan.isconnected():
        raise RuntimeError("wifi failed, status = %d" % wlan.status())
    return wlan.ifconfig()[0]

def page(state):
    return """HTTP/1.0 200 OK
Content-Type: text/html

<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pico W</title></head>
<body style="font-family: sans-serif; text-align: center; padding-top: 3rem">
  <h1>LED is {state}</h1>
  <p><a href="/on">Turn on</a> &nbsp; <a href="/off">Turn off</a></p>
</body></html>
""".format(state=state)

ip = connect()
print("listening on http://%s" % ip)

# addr[0][-1] is the (host, port) tuple getaddrinfo returns for this machine.
addr = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
server = socket.socket()
# Without SO_REUSEADDR, restarting the script gives EADDRINUSE for a minute.
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(addr)
server.listen(1)

while True:
    client, remote = server.accept()
    try:
        request = client.recv(1024).decode()
        first_line = request.split("\\r\\n")[0]   # e.g. "GET /on HTTP/1.1"

        if "/on" in first_line:
            led.on()
        elif "/off" in first_line:
            led.off()

        client.send(page("ON" if led.value() else "OFF"))
    finally:
        # Always close, even on a malformed request — the Pico has a small
        # number of sockets and leaking them wedges the server.
        client.close()`

const CONTENT = [
  textBlock([
    heading('h1', [text('Raspberry Pi Pico W: Wi-Fi and a Web-Controlled LED')], 'center'),
    paragraph([
      text(
        'The Pico W is a Pico with a wireless chip on it, and that one addition turns a microcontroller into something you can reach from your phone. This tutorial gets it on your network and finishes with a page you open in a browser to switch the board’s LED — the smallest complete version of the thing most IoT projects actually are.',
      ),
    ]),
    heading('h2', [text('What You Will Need')]),
    list('bullet', [
      [
        bold('A Raspberry Pi Pico W'),
        text(' or '),
        bold('Pico WH'),
        text(' (headers pre-soldered)'),
      ],
      [bold('A micro-USB data cable')],
      [bold('Thonny'), text(' installed, and a working MicroPython setup')],
      [bold('A 2.4 GHz Wi-Fi network'), text(' — the CYW43 chip does not do 5 GHz')],
    ]),
    paragraph([
      text('If you have not flashed MicroPython to a Pico before, do the '),
      bold('Raspberry Pi Pico'),
      text(' tutorial first — BOOTSEL, Thonny, and '),
      code('main.py'),
      text(' all work exactly the same here, and this page assumes them.'),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 1: Flash the Pico W Firmware')]),
    paragraph([
      bold('The firmware is not the same file as the plain Pico. '),
      text(
        'The Pico build has no networking in it at all, and flashing it to a Pico W gives you a board that works perfectly until the first import of ',
      ),
      code('network'),
      text(', which fails.'),
    ]),
    list('number', [
      [
        text('Unplug the board, hold '),
        bold('BOOTSEL'),
        text(', plug it in, release. The '),
        code('RPI-RP2'),
        text(' drive appears.'),
      ],
      [
        text('In Thonny, click the interpreter selector (bottom-right) → '),
        bold('Install MicroPython…'),
        text('.'),
      ],
      [text('Choose the variant '), bold('Raspberry Pi · Pico W / Pico WH'), text('.')],
      [text('Install, and wait for the drive to disappear.')],
    ]),
    paragraph([
      text('Then set the interpreter to '),
      bold('MicroPython (Raspberry Pi Pico)'),
      text(' and confirm the '),
      code('>>>'),
      text(' prompt responds.'),
    ]),
  ]),
  placeholderImage(0, 'Thonny’s Install MicroPython dialog with the Pico W variant selected'),

  textBlock([
    heading('h2', [text('Step 2: The LED Moved')]),
    paragraph([
      text('First thing to know, because it silently breaks every Pico example you copy:'),
    ]),
  ]),
  codeBlock('python', LED_DIFFERENCE, 'The one line that differs from a plain Pico'),
  textBlock([
    paragraph([
      text('On the original Pico the on-board LED is on '),
      code('GPIO 25'),
      text('. On the Pico W that pin was needed for the wireless chip, so the LED is driven '),
      italic('through'),
      text(' that chip and is addressed as '),
      code('Pin("LED")'),
      text(
        '. Code copied from a Pico tutorial will run without any error and do nothing at all — which reads like a broken board.',
      ),
    ]),
  ]),

  textBlock([
    heading('h2', [text('Step 3: Connect to Wi-Fi')]),
    paragraph([text('Put your own network name and password in, and run this:')]),
  ]),
  codeBlock('python', WIFI_CONNECT, 'wifi.py'),
  textBlock([
    paragraph([
      bold('The loop bound matters. '),
      text('The obvious version — '),
      code('while not wlan.isconnected(): pass'),
      text(
        ' — never exits when the password is wrong, so a typo presents as a board that hangs on boot rather than as an error. Twenty seconds and a raised exception tells you what actually happened.',
      ),
    ]),
    paragraph([
      bold('2.4 GHz only. '),
      text(
        'If the network never joins and the credentials are definitely right, check the band. Many routers publish both under one name, which usually works, but a 5 GHz-only SSID is invisible to this board.',
      ),
    ]),
    paragraph([
      text('Note the IP address it prints — that is where the board lives on your network.'),
    ]),
  ]),
  placeholderImage(0, 'The Thonny shell showing the Pico W connecting and printing its IP address'),

  textBlock([
    heading('h2', [text('Step 4: Serve a Page That Controls the LED')]),
    paragraph([
      text('Save this as '),
      code('main.py'),
      text(' on the Pico W, so it runs whenever the board is powered:'),
    ]),
  ]),
  codeBlock('python', WEB_SERVER, 'main.py — a web-controlled LED'),

  textBlock([
    heading('h2', [text('Step 5: Open It')]),
    list('number', [
      [text('Run the script and read the '), code('listening on http://…'), text(' line.')],
      [
        text('On any device on the '),
        bold('same network'),
        text(', open that address in a browser.'),
      ],
      [
        text('Click '),
        bold('Turn on'),
        text(' and '),
        bold('Turn off'),
        text('. The board’s LED follows.'),
      ],
    ]),
    paragraph([
      text('The request handling here is deliberately crude — it looks for '),
      code('/on'),
      text(' or '),
      code('/off'),
      text(
        ' in the request line and ignores everything else about HTTP. That is enough for a board on your own network, and it fits in a page of code. It is not enough for anything exposed to the internet.',
      ),
    ]),
  ]),
  placeholderImage(0, 'A phone browser showing the Pico W control page with the LED on'),

  textBlock([
    heading('h2', [text('Troubleshooting')]),
    list('bullet', [
      [
        bold("ImportError: no module named 'network': "),
        text('the plain Pico firmware is flashed. Re-flash with the '),
        bold('Pico W'),
        text(' variant.'),
      ],
      [
        bold('LED never lights: '),
        text('using '),
        code('Pin(25)'),
        text(' instead of '),
        code('Pin("LED")'),
        text('.'),
      ],
      [
        bold('Never connects: '),
        text(
          'a 5 GHz-only network, a wrong password, or a hidden SSID. The status code in the raised error narrows it — ',
        ),
        code('-3'),
        text(' is a bad password, '),
        code('-2'),
        text(' is no such network.'),
      ],
      [
        bold('EADDRINUSE on restart: '),
        text('the previous socket is still in TIME_WAIT. The '),
        code('SO_REUSEADDR'),
        text(
          ' line above prevents it; if you dropped that line, wait a minute or re-plug the board.',
        ),
      ],
      [
        bold('Page loads once, then the board stops responding: '),
        text('a client socket was not closed. Keep the '),
        code('finally: client.close()'),
        text(' — MicroPython has very few sockets and leaking them wedges the server.'),
      ],
      [
        bold('Works over USB, dead on a power bank: '),
        text(
          'many power banks switch off below a threshold the Pico W never reaches. Use a phone charger instead.',
        ),
      ],
    ]),
    heading('h2', [text('Where to Go Next')]),
    list('bullet', [
      [
        text(
          'Post sensor readings to a service like ThingSpeak or an MQTT broker instead of serving a page.',
        ),
      ],
      [
        text('Swap the hand-rolled socket loop for the '),
        code('microdot'),
        text(' or '),
        code('phew!'),
        text(' web framework.'),
      ],
      [text('Run the board as an access point so it works with no router at all.')],
      [
        text(
          'Compare with the ESP32 tutorial — same idea, more memory and a second core to spend on it.',
        ),
      ],
    ]),
  ]),
]

async function main() {
  const payload = await getPayload({ config })
  const placeholderId = await ensurePlaceholderMedia(payload)
  const tags = await ensureTagIds(payload, ['Raspberry', 'Microcontroller', 'IoT', 'Python'])

  const content = CONTENT.map((block) =>
    block.blockType === 'imageBlock' ? { ...block, image: placeholderId } : block,
  )

  await upsertLearningDoc({
    payload,
    collection: 'tutorials',
    slug: SLUG,
    data: {
      title: 'Raspberry Pi Pico W: Wi-Fi and a Web-Controlled LED',
      slug: SLUG,
      description:
        'Put a Pico W on Wi-Fi with MicroPython and serve a web page that switches its LED — including the LED pin change that breaks copied Pico code.',
      // No Pico W photo in the library yet; placeholder until one is added.
      thumbnail: placeholderId,
      difficulty: 'intermediate',
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
