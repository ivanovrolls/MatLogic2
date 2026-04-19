import type { SessionBlock } from './types'

// MET (Metabolic Equivalent of Task) values.
// Formula: calories = MET × weight_kg × (duration_minutes / 60)

export const BLOCK_MET: Record<string, number> = {
  warmup: 3.0,
  drilling: 4.0,
  technique: 4.5,
  sparring: 9.0,
  conditioning: 7.0,
  cool_down: 2.5,
}

export const BLOCK_LABELS: Record<string, string> = {
  warmup: 'Warm-Up',
  drilling: 'Drilling',
  technique: 'Technique Work',
  sparring: 'Sparring / Rolling',
  conditioning: 'Conditioning',
  cool_down: 'Cool Down',
}

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

// Block-based calculation: precise per-activity breakdown
export function estimateCaloriesFromBlocks(blocks: SessionBlock[], weightKg: number): number {
  return Math.round(
    blocks.reduce((sum, b) => sum + (BLOCK_MET[b.block_type] ?? 5.0) * weightKg * (b.duration_minutes / 60), 0)
  )
}

// Fallback simple calculation (session type + linked sparring rounds)
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
  return Math.round(
    (SPARRING_MET * weightKg * clampedSparring) / 60 +
    (baseMet * weightKg * baseMins) / 60
  )
}
