import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy') {
  return format(parseISO(dateStr), fmt)
}

export function formatRelative(dateStr: string) {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export const BELT_COLORS: Record<string, string> = {
  white: 'bg-gray-100 text-gray-900',
  blue: 'bg-blue-700 text-white',
  purple: 'bg-purple-700 text-white',
  brown: 'bg-amber-800 text-white',
  black: 'bg-mat-card text-mat-gold border border-mat-gold',
  unknown: 'bg-mat-muted text-mat-text-muted',
}

export const POSITION_LABELS: Record<string, string> = {
  closed_guard: 'Closed Guard',
  half_guard: 'Half Guard',
  open_guard: 'Open Guard',
  de_la_riva: 'De La Riva',
  spider_guard: 'Spider Guard',
  lasso_guard: 'Lasso Guard',
  x_guard: 'X Guard',
  butterfly: 'Butterfly',
  mount: 'Mount',
  back: 'Back Control',
  side_control: 'Side Control',
  turtle: 'Turtle',
  standing: 'Standing',
  north_south: 'North-South',
  knee_on_belly: 'Knee on Belly',
  leg_entanglement: 'Leg Entanglement',
  other: 'Other',
}

export const TYPE_LABELS: Record<string, string> = {
  submission: 'Submission',
  sweep: 'Sweep',
  pass: 'Pass',
  takedown: 'Takedown',
  escape: 'Escape',
  guard_retention: 'Guard Retention',
  transition: 'Transition',
  control: 'Control',
  setup: 'Setup / Grip',
  counter: 'Counter',
}

export const SESSION_TYPE_LABELS: Record<string, string> = {
  gi: 'Gi',
  nogi: 'No-Gi',
  open_mat: 'Open Mat',
  competition: 'Competition',
  drilling: 'Drilling',
  wrestling: 'Wrestling',
  fundamentals: 'Fundamentals',
}

export const SESSION_TYPE_COLORS: Record<string, string> = {
  gi: 'text-mat-blue-light',
  nogi: 'text-mat-gold',
  open_mat: 'text-mat-green-light',
  competition: 'text-mat-red-light',
  drilling: 'text-purple-400',
  wrestling: 'text-orange-400',
  fundamentals: 'text-cyan-400',
}

export const OUTCOME_COLORS: Record<string, string> = {
  win: 'text-mat-green-light',
  loss: 'text-mat-red-light',
  draw: 'text-mat-text-muted',
}

export const RESULT_COLORS: Record<string, string> = {
  gold: 'text-mat-gold',
  silver: 'text-gray-300',
  bronze: 'text-amber-600',
  participated: 'text-mat-text-muted',
  withdrew: 'text-mat-red-light',
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-mat-green-light'
  if (rating >= 3) return 'text-mat-gold'
  return 'text-mat-red-light'
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}
