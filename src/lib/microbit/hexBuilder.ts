import { MicropythonFsHex, microbitBoardId } from '@microbit/microbit-fs'

/**
 * Turn a MicroPython script into a flashable micro:bit hex, in the browser.
 *
 * There is no compiler: the MicroPython runtime is a prebuilt hex (one per
 * board revision, served from `public/micropython/`), and the script is
 * written into the runtime's on-flash filesystem as `main.py`. The board
 * boots MicroPython, MicroPython runs `main.py`. Same approach as
 * python.microbit.org.
 */

export type BoardVersion = 'V1' | 'V2'

// Served as static files - fetched once per session and kept in memory.
const RUNTIME_URLS: Record<BoardVersion, string> = {
  V1: '/micropython/microbit-v1.hex',
  V2: '/micropython/microbit-v2.hex',
}

const BOARD_IDS: Record<BoardVersion, microbitBoardId> = {
  V1: microbitBoardId.V1,
  V2: microbitBoardId.V2,
}

let runtimesPromise: Promise<Record<BoardVersion, string>> | null = null

async function fetchRuntime(version: BoardVersion): Promise<string> {
  const response = await fetch(RUNTIME_URLS[version])
  if (!response.ok) {
    throw new Error(`Could not load the MicroPython runtime for micro:bit ${version}`)
  }
  return response.text()
}

/** Both runtimes, loaded in parallel the first time and cached after. */
export function loadRuntimes(): Promise<Record<BoardVersion, string>> {
  if (!runtimesPromise) {
    runtimesPromise = Promise.all([fetchRuntime('V1'), fetchRuntime('V2')])
      .then(([V1, V2]) => ({ V1, V2 }))
      .catch((error) => {
        // Let the next call retry rather than caching the failure.
        runtimesPromise = null
        throw error
      })
  }
  return runtimesPromise
}

export interface BuiltHex {
  /** Hex for one board revision - what the USB flasher asks for. */
  forBoard(version: BoardVersion): string
  /** Universal hex that flashes on either revision - what the download gives. */
  universal(): string
}

/**
 * Build the hex for a script. Throws if the script is too large for the
 * board's filesystem (roughly 20 KB on V1, more on V2).
 */
export async function buildHex(script: string): Promise<BuiltHex> {
  const runtimes = await loadRuntimes()

  const fs = new MicropythonFsHex([
    { hex: runtimes.V1, boardId: BOARD_IDS.V1 },
    { hex: runtimes.V2, boardId: BOARD_IDS.V2 },
  ])
  fs.write('main.py', script)

  // The library only complains when a hex is generated; check up front so the
  // error is a plain sentence at the moment the student presses Flash.
  if (fs.getStorageRemaining() < 0) {
    const limitKb = Math.floor(fs.getStorageSize() / 1024)
    throw new Error(`The program is too big for the micro:bit (about ${limitKb} KB fits).`)
  }

  return {
    forBoard: (version) => fs.getIntelHex(BOARD_IDS[version]),
    universal: () => fs.getUniversalHex(),
  }
}
