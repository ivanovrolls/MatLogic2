'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authApi, titlesApi } from '@/lib/api'
import { BELT_COLORS, formatDate } from '@/lib/utils'
import { Loader2, MapPin, BookOpen, Swords, ArrowLeft, Trophy, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { PublicUser, GridWidget } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'

// ─── Dot Grid Background ──────────────────────────────────────────────────────

function DotGridBg({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle, rgba(201,162,39,0.18) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {children}
    </div>
  )
}

// ─── Widget: Active Title ─────────────────────────────────────────────────────

function TitleWidget({ title }: { title: { slug: string; name: string } | null }) {
  return (
    <div className="col-span-2 bg-mat-card/80 border border-mat-gold/40 p-4 flex items-center gap-3 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-mat-gold/5 to-transparent pointer-events-none" />
      <div className="w-8 h-8 border border-mat-gold/60 flex items-center justify-center shrink-0">
        <Trophy size={14} className="text-mat-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-mat-text-dim text-xs uppercase tracking-widest">Active Title</p>
        <p className="text-mat-gold font-display text-lg uppercase tracking-wider leading-tight truncate">
          {title ? title.name : 'No Title Equipped'}
        </p>
      </div>
    </div>
  )
}

// ─── Widget: Photo ────────────────────────────────────────────────────────────

function PhotoWidget({
  config,
  posts,
}: {
  config: Record<string, unknown>
  posts: Record<string, { image: string | null; caption: string }>
}) {
  const [expanded, setExpanded] = useState(false)
  const postId = String(config.post_id ?? '')
  const post = posts[postId]
  if (!post || !post.image) return null

  return (
    <div
      className="col-span-1 relative overflow-hidden cursor-pointer bg-mat-darker border border-mat-border aspect-square"
      onClick={() => setExpanded(e => !e)}
    >
      <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
      {expanded && (
        <div className="absolute inset-0 bg-mat-black/80 flex flex-col justify-end p-3">
          <p className="text-white text-xs leading-relaxed line-clamp-4">{post.caption}</p>
        </div>
      )}
    </div>
  )
}

// ─── Widget: Training Calendar ────────────────────────────────────────────────

function CalendarWidget({ sessions }: { sessions: string[] }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const sessionSet = new Set(
    sessions
      .filter(d => {
        const dt = new Date(d)
        return dt.getFullYear() === year && dt.getMonth() === month
      })
      .map(d => new Date(d).getDate())
  )

  const monthName = today.toLocaleString('default', { month: 'long' })
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="col-span-2 bg-mat-card/80 border border-mat-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={12} className="text-mat-gold" />
        <p className="text-mat-text-dim text-xs uppercase tracking-widest">{monthName} {year}</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <p key={d} className="text-mat-text-dim text-xs text-center">{d}</p>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center text-xs rounded-sm ${
              day === null
                ? ''
                : sessionSet.has(day)
                ? 'bg-mat-gold text-mat-black font-bold'
                : 'text-mat-text-muted'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Widget: Stats ────────────────────────────────────────────────────────────

function StatsWidget({
  profile,
  config,
}: {
  profile: PublicUser
  config: Record<string, unknown>
}) {
  const stat = config.stat as string | undefined

  let label = ''
  let value: string | number = '—'

  if (stat === 'sessions') {
    label = 'Sessions'
    value = profile.total_sessions
  } else if (stat === 'rounds') {
    label = 'Rounds'
    value = profile.total_rounds
  } else if (stat === 'win_rate') {
    label = 'Win Rate'
    value = profile.win_rate !== null ? `${profile.win_rate}%` : '—'
  } else {
    label = 'Sessions'
    value = profile.total_sessions
  }

  return (
    <div className="col-span-1 bg-mat-card/80 border border-mat-border p-4 text-center flex flex-col items-center justify-center">
      <p className="font-display text-3xl text-mat-gold">{value}</p>
      <p className="text-mat-text-dim text-xs uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}

// ─── Render widget ────────────────────────────────────────────────────────────

function RenderWidget({
  widget,
  profile,
  equippedTitle,
  posts,
  sessionDates,
}: {
  widget: GridWidget
  profile: PublicUser
  equippedTitle: { slug: string; name: string } | null
  posts: Record<string, { image: string | null; caption: string }>
  sessionDates: string[]
}) {
  if (widget.type === 'title') {
    return <TitleWidget title={equippedTitle} />
  }
  if (widget.type === 'photo') {
    return <PhotoWidget config={widget.config} posts={posts} />
  }
  if (widget.type === 'calendar') {
    return <CalendarWidget sessions={sessionDates} />
  }
  if (widget.type === 'stats') {
    return <StatsWidget profile={profile} config={widget.config} />
  }
  return null
}

// ─── Default widgets when grid is empty ──────────────────────────────────────

const DEFAULT_WIDGETS: GridWidget[] = [
  { id: 'default-title', type: 'title', config: {} },
  { id: 'default-sessions', type: 'stats', config: { stat: 'sessions' } },
  { id: 'default-rounds', type: 'stats', config: { stat: 'rounds' } },
  { id: 'default-winrate', type: 'stats', config: { stat: 'win_rate' } },
  { id: 'default-cal', type: 'calendar', config: {} },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const { user: me } = useAuthStore()

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ['public-profile', username],
    queryFn: () => authApi.getPublicProfile(username).then(r => r.data),
  })

  const { data: gridData } = useQuery<{
    widgets: GridWidget[]
    posts: Record<string, { image: string | null; caption: string }>
    equipped_title: { slug: string; name: string } | null
    session_dates: string[]
  }>({
    queryKey: ['public-grid', username],
    queryFn: () => titlesApi.getPublicGrid(username).then(r => r.data),
    enabled: !!profile,
  })

  if (isLoading) {
    return (
      <DotGridBg>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={24} className="animate-spin text-mat-gold" />
        </div>
      </DotGridBg>
    )
  }

  if (error || !profile) {
    const msg = (error as any)?.response?.data?.detail
    return (
      <DotGridBg>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
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
      </DotGridBg>
    )
  }

  const beltCls = BELT_COLORS[profile.belt as keyof typeof BELT_COLORS] || ''
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'

  const widgets = gridData?.widgets?.length ? gridData.widgets : DEFAULT_WIDGETS
  const posts = gridData?.posts ?? {}
  const equippedTitle = gridData?.equipped_title ?? null
  const sessionDates = gridData?.session_dates ?? []

  return (
    <DotGridBg>
      <div className="max-w-lg mx-auto px-4 pb-10 pt-4 animate-fade-in">

        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          {me ? (
            <button onClick={() => router.back()} className="flex items-center gap-2 text-mat-text-muted hover:text-mat-gold transition-colors text-sm">
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <Link href="/" className="font-display text-lg tracking-widest">
              <span className="text-mat-gold">MAT</span><span className="text-mat-text">LOGIC</span>
            </Link>
          )}
          {!me && (
            <Link href="/login" className="text-mat-text-dim text-xs hover:text-mat-gold transition-colors">
              Sign in →
            </Link>
          )}
        </div>

        {/* Profile header */}
        <div className="bg-mat-card/80 border border-mat-border p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mat-gold/80 via-mat-gold/40 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 border border-mat-border shrink-0 overflow-hidden bg-mat-muted flex items-center justify-center">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                : <span className="text-mat-gold font-bold text-xl">{profile.username.slice(0, 2).toUpperCase()}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl text-mat-text uppercase tracking-wider leading-none">
                {profile.username}
              </h1>
              {equippedTitle && (
                <p className="text-mat-gold/80 text-xs mt-0.5 uppercase tracking-wider">{equippedTitle.name}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-2 w-10 rounded-sm ${bgColor}`} />
                <span className="text-mat-text-muted text-xs">{profile.display_belt}</span>
              </div>
              {profile.gym && (
                <p className="flex items-center gap-1 text-mat-text-dim text-xs mt-1">
                  <MapPin size={9} /> {profile.gym}
                </p>
              )}
            </div>
          </div>
          {profile.bio && (
            <p className="text-mat-text-muted text-sm leading-relaxed border-t border-mat-border pt-3 mt-3">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Hunter Profile Grid */}
        <div className="grid grid-cols-2 gap-2">
          {widgets.map(widget => (
            <RenderWidget
              key={widget.id}
              widget={widget}
              profile={profile}
              equippedTitle={equippedTitle}
              posts={posts}
              sessionDates={sessionDates}
            />
          ))}
        </div>

        <p className="text-mat-text-dim text-xs text-center pt-6">
          Powered by{' '}
          <Link href="/login" className="text-mat-gold hover:underline">MatLogic</Link>
          {' '}— BJJ Training Intelligence
        </p>
      </div>
    </DotGridBg>
  )
}
