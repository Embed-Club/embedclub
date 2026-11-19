/**
 * Computes the Gaussian wave polygon formula.
 *
 * Begins directly on the hero text carousel line ((1 - p) * 100%), with the wave crest
 * surging upwards above the carousel to push it away. Accelerates smoothly so the wave
 * fully reaches the top of the viewport and flattens out completely by p = 0.82,
 * ensuring zero black strips or wedges remain at the top before handing off to Manifesto.
 *
 * @param progress 0 (wave below bottom, 0% height) to 1 (wave fully cleared past top, 100% height)
 * @param peakX peak horizontal center point (defaults to 0.5, centered)
 * @returns CSS clip-path polygon string with 33 sampled Gaussian points
 */
export function getWavePolygon(progress: number, peakX = 0.5): string {
  const p = Math.max(0, Math.min(1, progress))
  const u = Math.min(1, p / 0.82)
  const d = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2
  const amplitude = 30 * Math.sin(Math.PI * u)
  const baseline = 100 * (1 - d)
  const points: string[] = []

  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    const z = (t - peakX) / 0.3
    const y = baseline - amplitude * Math.exp(-z * z)
    points.push(`${(t * 100).toFixed(2)}% ${Math.min(105, y).toFixed(2)}%`)
  }

  return `polygon(${points.join(', ')}, 100% 120%, 0% 120%)`
}
