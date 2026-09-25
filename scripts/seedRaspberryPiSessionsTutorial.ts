/**
 * Seed the "Raspberry Pi Workshop CS 2025" resource.
 *
 *   pnpm tsx scripts/seedRaspberryPiSessionsTutorial.ts
 *
 * The 2025 run of the four-session workshop. It keeps its original slug so
 * links shared during that workshop still resolve. Content lives in
 * scripts/lib/raspberryPiWorkshop.ts.
 */
import { flushExit } from './lib/learningSeed'
import { seedRaspberryPiWorkshop } from './lib/raspberryPiWorkshop'

seedRaspberryPiWorkshop({
  slug: 'raspberry-pi-workshop-four-sessions',
  title: 'Raspberry Pi Workshop CS 2025',
})
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
