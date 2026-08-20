/**
 * Fill in "How to use" steps and the button label for every simulator.
 *
 *   pnpm tsx scripts/seedSimulatorGuides.ts
 *
 * Two things per tool: whether the main button reads "Open Website" or
 * "Download App", and a short numbered guide shown under the video in the
 * modal. Steps are deliberately short - enough to get a student from a cold
 * start to something running, not a manual.
 *
 * Walkthrough videos are left alone. A video URL has to be a real one someone
 * has watched, so those get added by hand in the admin rather than guessed at
 * here.
 *
 * Matched on slug. Re-running overwrites the guide, so edit in the admin once
 * A member has improved the wording.
 */
import "dotenv/config";
import config from "@payload-config";
import { getPayload } from "payload";
import {
  flushExit,
  list,
  paragraph,
  text,
  textBlock,
} from "./lib/learningSeed";

interface Guide {
  /** 'website' for anything that runs in a browser, 'download' for an install. */
  launchType: "website" | "download";
  intro?: string;
  steps: string[];
}

const GUIDES: Record<string, Guide> = {
  wokwi: {
    launchType: "website",
    intro:
      "Runs entirely in the browser. No account needed to start, but make one to save projects.",
    steps: [
      "Open the site and pick a board, for example ESP32 or Arduino Uno.",
      "Click the plus button on the diagram to add parts, then drag a wire between two pins.",
      "Write your sketch in the code panel on the left.",
      "Press the green play button. The simulation runs with the serial monitor live at the bottom.",
    ],
  },
  "arduino-ide": {
    launchType: "download",
    steps: [
      "Go to the website linked below and download the IDE for your operating system.",
      "Install it, then plug in your board over USB.",
      "Pick your board and port under the Tools menu.",
      "Open a new sketch, write your code, and press upload.",
    ],
  },
  tinkercad: {
    launchType: "website",
    intro: "Free with an Autodesk account. Sign in with your college email.",
    steps: [
      "Create an account, then choose Circuits from the left sidebar.",
      "Click Create, then Circuit.",
      "Drag components onto the workspace and click pin to pin to wire them.",
      "Switch the code panel to Text if you want real Arduino code, then press Start Simulation.",
    ],
  },
  kicad: {
    launchType: "download",
    steps: [
      "Download and install KiCad for your operating system.",
      "Create a project, then open the schematic editor and place your parts.",
      "Assign a footprint to every symbol, then run the netlist through to the PCB editor.",
      "Arrange the parts, route the tracks, and check the 3D viewer before exporting Gerbers.",
    ],
  },
  "fusion-360": {
    launchType: "download",
    intro:
      "Free on an education licence. Sign up with your college email address first.",
    steps: [
      "Register for the education licence, then download and install Fusion.",
      "Start a new design and draw a sketch on a plane.",
      "Extrude or revolve the sketch into a solid, then add fillets and holes.",
      "Export as STL for printing, or as STEP if it is going to someone else.",
    ],
  },
  blender: {
    launchType: "download",
    steps: [
      "Download and install Blender. It is free and needs no account.",
      "Learn the navigation first: middle mouse to orbit, shift and middle to pan, scroll to zoom.",
      "Model with the modifier stack rather than by hand where you can. It stays editable.",
      "Set up a camera and lights, then press F12 to render.",
    ],
  },
  unity: {
    launchType: "download",
    intro:
      "Free on the Personal plan. Install Unity Hub first, then an editor version from inside it.",
    steps: [
      "Install Unity Hub and sign in with a free Unity account.",
      "From the Installs tab, add an LTS editor version and tick the platforms you need.",
      "Create a project from a template: 3D for most things, URP if you want better lighting.",
      "Drop objects into the scene, attach C# scripts for behaviour, then press play to test.",
    ],
  },
  "orca-slicer": {
    launchType: "download",
    steps: [
      "Download the release for your operating system from the GitHub page.",
      "Add your printer on first launch, then pick the filament you actually have loaded.",
      "Import an STL, position it on the plate, and set layer height and infill.",
      "Slice, check the preview for the first layer and supports, then export the G-code.",
    ],
  },
  "ultimaker-cura": {
    launchType: "download",
    steps: [
      "Download and install Cura, then add your printer from the built in list.",
      "Import an STL by dragging it onto the plate.",
      "Choose a profile: 0.2mm standard is a sensible starting point.",
      "Slice, read the time and material estimate, then save the G-code to your SD card.",
    ],
  },
  "falstad-circuit-simulator": {
    launchType: "website",
    intro:
      "Opens straight into a working circuit. Nothing to install, nothing to sign up for.",
    steps: [
      "Open the simulator. A default LRC circuit is already running.",
      "Use Circuits in the menu bar to load one of the worked examples.",
      "Right click any component to change its value, or drag from the Draw menu to add your own.",
      "Hover a wire to read voltage and current at that point.",
    ],
  },
  simulide: {
    launchType: "download",
    steps: [
      "Download the build for your operating system and unpack it. There is no installer.",
      "Drag components onto the canvas and wire them together.",
      "Add a microcontroller, then right click it to load a compiled hex or elf file.",
      "Press the power button in the toolbar to run, and probe pins while it is live.",
    ],
  },
  easyeda: {
    launchType: "website",
    intro:
      "Runs in the browser. The Std edition is enough for most club boards.",
    steps: [
      "Create a free account and start a new project.",
      "Draw the schematic, searching the LCSC library for real parts as you go.",
      "Convert the schematic to a PCB, then place and route the board.",
      "Export Gerbers, or order straight from JLCPCB if the board is going to be made.",
    ],
  },
  fritzing: {
    launchType: "download",
    steps: [
      "Download Fritzing. The paid download funds the project, and the source is free to build.",
      "Start in Breadboard view and drag in the parts you are actually using.",
      "Wire them the way you would on the bench. Colour the wires to match.",
      "Switch to Schematic or PCB view when you want the formal version of the same circuit.",
    ],
  },
  ltspice: {
    launchType: "download",
    steps: [
      "Download LTspice from Analog Devices. It is free with no licence key.",
      "Place components with the toolbar, then wire them and add a ground. Nothing runs without a ground.",
      "Add a simulation directive: transient for waveforms, AC sweep for frequency response.",
      "Run it, then click a node to plot voltage or a component to plot current.",
    ],
  },
  freecad: {
    launchType: "download",
    steps: [
      "Download and install FreeCAD.",
      "Create a document and switch to the Part Design workbench.",
      "Make a sketch on a plane, constrain it fully, then pad it into a solid.",
      "Keep going feature by feature, then export STL for printing.",
    ],
  },
  openscad: {
    launchType: "download",
    intro:
      "You describe the model in code and it renders. No mouse modelling at all.",
    steps: [
      "Download and install OpenSCAD.",
      "Write shapes as code, for example cube([20,10,5]); or cylinder(h=10, r=3);",
      "Combine them with union, difference, and intersection to cut holes and join parts.",
      "Press F5 to preview and F6 to render properly, then export STL.",
    ],
  },
  prusaslicer: {
    launchType: "download",
    steps: [
      "Download and install PrusaSlicer, then pick your printer in the configuration wizard.",
      "Switch to Expert mode once you are comfortable. Simple mode hides most of what matters.",
      "Import an STL, then set layer height, infill, and supports.",
      "Slice and step through the preview layer by layer before exporting the G-code.",
    ],
  },
  platformio: {
    launchType: "download",
    intro: "An extension rather than a separate app. Install VS Code first.",
    steps: [
      "Install VS Code, then add the PlatformIO IDE extension from the marketplace.",
      "Use PIO Home to create a project and pick your board.",
      "Write your code in src/main.cpp, and declare libraries in platformio.ini.",
      "Use the tick to build and the arrow to upload, both on the bottom toolbar.",
    ],
  },
  thonny: {
    launchType: "download",
    steps: [
      "Download and install Thonny.",
      "Plug in your Pico or ESP32, then open Run, then Configure interpreter.",
      "Choose MicroPython for your board. Thonny will offer to flash the firmware for you.",
      "Write code in the editor and press play, or type straight into the REPL at the bottom.",
    ],
  },
  renode: {
    launchType: "download",
    steps: [
      "Download and install Renode for your operating system.",
      "Start the Renode monitor and load a platform script for the board you are targeting.",
      "Load your firmware binary onto the emulated machine with sysbus LoadELF.",
      "Type start to run it, and attach GDB if you want to step through the firmware.",
    ],
  },
  qemu: {
    launchType: "download",
    steps: [
      "Install QEMU from your package manager, or the installer on Windows.",
      "Pick the binary for your target, for example qemu-system-arm or qemu-system-riscv64.",
      "Point it at a machine, a kernel, and a disk image with the -machine, -kernel, and -drive flags.",
      "Add -nographic to keep everything in the terminal, and -s -S to wait for a debugger.",
    ],
  },
  "node-red": {
    launchType: "download",
    intro:
      "Runs as a local server, then you use it through your browser at localhost:1880.",
    steps: [
      "Install Node.js, then run npm install -g --unsafe-perm node-red.",
      "Start it by running node-red in a terminal, and leave that terminal open.",
      "Open localhost:1880 in your browser.",
      "Drag nodes onto the canvas, wire them together, and press Deploy to make the flow live.",
    ],
  },
  "home-assistant": {
    launchType: "download",
    intro:
      "Usually run on a Raspberry Pi. The whole point is that it stays on.",
    steps: [
      "Flash Home Assistant OS to an SD card with the Raspberry Pi Imager.",
      "Boot the Pi on your network and open homeassistant.local:8123 in a browser.",
      "Create your account, then add integrations for the devices you own.",
      "Add ESPHome to bring your own ESP32 boards in as first class devices.",
    ],
  },
  "visual-studio-code": {
    launchType: "download",
    steps: [
      "Download and install VS Code.",
      "Install the extensions for what you work on: PlatformIO, Python, C and C++, or Arduino.",
      "Open a folder rather than a file. Most features work at the project level.",
      "Learn two shortcuts and everything gets faster: Ctrl+P for files, Ctrl+Shift+P for commands.",
    ],
  },
  "google-colab": {
    launchType: "website",
    intro:
      "Notebooks run on Google machines, so your laptop being weak does not matter.",
    steps: [
      "Open Colab and sign in with a Google account, then create a new notebook.",
      "For anything heavy, switch on the GPU under Runtime, then Change runtime type.",
      "Write Python in cells and press Shift and Enter to run a cell.",
      "Mount Google Drive if you need your files, and remember the machine is wiped when it disconnects.",
    ],
  },
  godot: {
    launchType: "download",
    intro:
      "A single executable, around 100MB, with no installer and no account.",
    steps: [
      "Download Godot and run it. There is nothing to install.",
      "Create a project, then build a scene out of nodes in the scene tree.",
      "Attach a GDScript to a node for behaviour. The syntax is close to Python.",
      "Press F5 to run, and F6 to run just the scene you are working on.",
    ],
  },
};

async function run() {
  const payload = await getPayload({ config });

  let updated = 0;
  const missing: string[] = [];

  for (const [slug, guide] of Object.entries(GUIDES)) {
    const found = await payload.find({
      collection: "simulators",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });

    if (found.docs.length === 0) {
      missing.push(slug);
      continue;
    }

    const children = [];
    if (guide.intro) children.push(paragraph([text(guide.intro)]));
    children.push(
      list(
        "number",
        guide.steps.map((step) => [text(step)]),
      ),
    );

    await payload.update({
      collection: "simulators",
      id: found.docs[0].id,
      data: {
        launchType: guide.launchType,
        content: [textBlock(children)],
      },
      overrideAccess: true,
    });
    updated++;
    console.log(`ok  ${slug} (${guide.launchType})`);
  }

  console.log(`\nGuides written: ${updated}`);
  if (missing.length > 0)
    console.log(`No simulator for slug: ${missing.join(", ")}`);
  flushExit(0);
}

run().catch((err) => {
  console.error(err);
  flushExit(1);
});
