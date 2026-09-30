/**
 * Seed the "Raspberry Pi Workshop CS 2026" resource.
 *
 *   pnpm tsx scripts/seedRaspberryPiWorkshopCs2026.ts
 *
 * The 2026 run of the four-session workshop with the updated 2026 curriculum:
 * Session 1: Setup & VNC (Imager, Wayland to X11, RealVNC without sign-up)
 * Session 2: LED Control, Button Inputs (Debounce & Pull-up), and Email Alerts
 * Session 3: Light & Motion Sensors (LDR digital input, state change email, PIR)
 * Session 4: Smart Home Automation & Security Capstone
 *
 * Content lives in scripts/lib/raspberryPiWorkshop2026.ts.
 */
import { flushExit } from './lib/learningSeed'
import { seedRaspberryPiWorkshop2026 } from './lib/raspberryPiWorkshop2026'

seedRaspberryPiWorkshop2026()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
