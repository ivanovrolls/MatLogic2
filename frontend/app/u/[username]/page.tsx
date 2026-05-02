'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { BELT_COLORS } from '@/lib/utils'
import { Loader2, MapPin, ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { PublicUser } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'

// ─── Training heatmap ─────────────────────────────────────────────────────────

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function TrainingHeatmap({ dates }: { dates: string[] }) {
  const trained = new Set(dates)
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayStr = toLocalDateStr(today)

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = firstDay.getDay()

  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toLocalDateStr(new Date(year, month, d)))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const monthName = firstDay.toLocaleString('default', { month: 'long' })

  return (
    <div>
      <p className="text-mat-text-dim text-xs mb-2">{monthName} {year}</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-mat-text-dim text-xs">{d}</div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((dateStr, di) => (
              <div
                key={di}
                title={dateStr || ''}
                className={`h-9 rounded-sm transition-colors ${
                  !dateStr
                    ? 'opacity-0'
                    : dateStr > todayStr
                    ? 'bg-mat-muted/20'
                    : trained.has(dateStr)
                    ? 'bg-mat-gold'
                    : 'bg-mat-muted/40'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const { user: me } = useAuthStore()

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ['public-profile', username],
    queryFn: () => authApi.getPublicProfile(username).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mat-black flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-mat-gold" />
      </div>
    )
  }

  if (error || !profile) {
    const msg = (error as any)?.response?.data?.detail
    return (
      <div className="min-h-screen bg-mat-black flex flex-col items-center justify-center p-6 space-y-6">
        <Link href="/" className="font-display text-2xl tracking-widest">
          <span className="text-mat-gold">MAT</span><span className="text-mat-text">LOGIC</span>
        </Link>
        <div className="bg-mat-card border border-mat-border p-10 text-center max-w-sm w-full">
          <p className="text-mat-text-muted text-sm">{msg || 'Profile not found or private.'}</p>
        </div>
        <Link href="/login" className="text-mat-text-dim text-xs hover:text-mat-gold transition-colors">
          Sign in to MatLogic →
        </Link>
      </div>
    )
  }

  const beltCls = BELT_COLORS[profile.belt as keyof typeof BELT_COLORS] || ''
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-gray-400'

  return (
    <div className="min-h-screen bg-mat-black">
      <div className="max-w-xl mx-auto px-4 pb-12 space-y-5 animate-fade-in" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))' }}>

        {/* Top nav */}
        <div className="flex items-center justify-between">
          {me ? (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-mat-text-muted hover:text-mat-gold transition-colors text-sm"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <Link href="/" className="font-display text-xl tracking-widest">
              <span className="text-mat-gold">MAT</span><span className="text-mat-text">LOGIC</span>
            </Link>
          )}
          {!me && (
            <Link href="/login" className="text-xs text-mat-text-dim hover:text-mat-gold transition-colors border border-mat-border px-3 py-1.5">
              Sign in →
            </Link>
          )}
        </div>

        {/* ── Fighter card ─────────────────────────────────────────────────── */}
        <div className="bg-mat-card border border-mat-border relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mat-gold via-mat-gold/50 to-transparent" />

          <div className="p-5 flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 shrink-0 border border-mat-border overflow-hidden bg-mat-muted flex items-center justify-center">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                : <span className="font-display text-2xl text-mat-gold">{profile.username.slice(0, 2).toUpperCase()}</span>
              }
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl text-mat-text uppercase tracking-wider leading-none">
                {profile.username}
              </h1>

              {/* Equipped title */}
              {profile.equipped_title && (
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 border border-mat-gold/40 bg-mat-gold/5">
                  <Trophy size={10} className="text-mat-gold shrink-0" />
                  <span className="text-mat-gold text-xs uppercase tracking-widest font-medium">
                    {profile.equipped_title.name}
                  </span>
                </div>
              )}

              {/* Belt */}
              <div className="mt-2 w-full">
                <div className={`relative h-4 w-full rounded-sm overflow-hidden ${bgColor}`}>
                  {profile.stripes > 0 && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center gap-0.5 px-1.5">
                      {Array.from({ length: profile.stripes }).map((_, i) => (
                        <div key={i} className="w-1 h-full bg-white/80" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-mat-text-muted text-xs mt-1">{profile.display_belt}</p>
              </div>

              {/* Gym */}
              {profile.gym && (
                <p className="flex items-center gap-1 text-mat-text-dim text-xs mt-1.5">
                  <MapPin size={10} /> {profile.gym}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="px-5 pb-5 border-t border-mat-border pt-4">
              <p className="text-mat-text-muted text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 divide-x divide-mat-border border border-mat-border bg-mat-card">
          {[
            { label: 'Sessions', value: profile.total_sessions },
            { label: 'Hours', value: profile.total_hours },
            { label: 'Rounds', value: profile.total_rounds },
            { label: 'Win Rate', value: profile.win_rate !== null ? `${profile.win_rate}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="py-4 text-center">
              <p className="font-display text-2xl text-mat-gold leading-none">{value}</p>
              <p className="text-mat-text-dim text-xs uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Training activity ─────────────────────────────────────────────── */}
        {profile.session_dates.length > 0 && (
          <div className="bg-mat-card border border-mat-border p-4 overflow-hidden">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Training Activity</p>
            <div className="overflow-x-auto">
              <TrainingHeatmap dates={profile.session_dates} />
            </div>
          </div>
        )}

        {/* ── Titles earned ─────────────────────────────────────────────────── */}
        {profile.unlocked_titles.length > 0 && (
          <div className="bg-mat-card border border-mat-border p-4">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">
              Titles Earned
              <span className="text-mat-text-dim ml-1.5">({profile.unlocked_titles.length}/32)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.unlocked_titles.map(title => (
                <span
                  key={title.slug}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border ${
                    title.is_equipped
                      ? 'border-mat-gold/60 bg-mat-gold/10 text-mat-gold'
                      : 'border-mat-border text-mat-text-muted'
                  }`}
                >
                  {title.is_equipped && <Trophy size={9} className="shrink-0" />}
                  {title.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-mat-text-dim text-xs text-center">
          Powered by{' '}
          <Link href="/login" className="text-mat-gold hover:underline">MatLogic</Link>
          {' '}— BJJ Training Intelligence
        </p>
      </div>
    </div>
  )
}
