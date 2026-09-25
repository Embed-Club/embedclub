/**
 * Seed the "Raspberry Pi Workshop CS 2026" resource.
 *
 *   pnpm tsx scripts/seedRaspberryPiWorkshopCs2026.ts
 *
 * The 2026 run of the four-session workshop, starting from the 2025 sessions.
 * The one difference so far: session 1 offers the RealVNC Viewer installer from
 * the club Drive, so attendees are not sent hunting on realvnc.com. Content
 * lives in scripts/lib/raspberryPiWorkshop.ts.
 */
import { flushExit } from './lib/learningSeed'
import { seedRaspberryPiWorkshop } from './lib/raspberryPiWorkshop'

seedRaspberryPiWorkshop({
  slug: 'raspberry-pi-workshop-cs-2026',
  title: 'Raspberry Pi Workshop CS 2026',
  // VNC-Viewer-7.15.1-Windows.exe on the club Drive, shared "anyone with the link".
  vncViewerUrl:
    'https://drive.google.com/file/d/1O--Uh5XO3yt27H5vLI-paYNbCKEZ_Rw7/view?usp=sharing',
})
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
