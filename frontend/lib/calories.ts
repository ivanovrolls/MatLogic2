// MET (Metabolic Equivalent of Task) values for BJJ session types.
// Formula: calories = MET × weight_kg × (duration_minutes / 60)
const SESSION_MET: Record<string, number> = {
  gi: 5.5,
  nogi: 6.0,
  open_mat: 6.0,
  competition: 10.0,
  drilling: 4.0,
  wrestling: 6.5,
  fundamentals: 4.5,
}

const SPARRING_MET = 9.0

export function estimateCalories({
  sessionType,
  durationMinutes,
  weightKg,
  sparringMinutes = 0,
}: {
  sessionType: string
  durationMinutes: number
  weightKg: number
  sparringMinutes?: number
}): number {
  const baseMet = SESSION_MET[sessionType] ?? 6.0
  const clampedSparring = Math.min(sparringMinutes, durationMinutes)
  const baseMins = Math.max(0, durationMinutes - clampedSparring)

  const sparringCals = (SPARRING_MET * weightKg * clampedSparring) / 60
  const baseCals = (baseMet * weightKg * baseMins) / 60

  return Math.round(sparringCals + baseCals)
}
