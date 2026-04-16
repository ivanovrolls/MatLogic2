'use client'

import { useQuery } from '@tanstack/react-query'
import { sessionsApi, analyticsApi, sparringApi } from '@/lib/api'
import { formatDate, formatDuration, OUTCOME_COLORS, SESSION_TYPE_COLORS, getRatingColor } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { format, subDays, addDays, parseISO, isSameDay, getDay, startOfDay } from 'date-fns'
import {
  BookOpen, Swords, Target, TrendingUp, Plus, ChevronRight,
  Flame, Trophy, AlertTriangle, Lightbulb, CheckCircle2, HeartPulse
} from 'lucide-react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function TrainingCalendar({ sessions }: { sessions: { date: string }[] }) {
  const today = startOfDay(new Date())
  const rangeStart = subDays(today, 29)
  const sessionDates = (sessions || []).map(s => startOfDay(parseISO(s.date)))

  const getCount = (day: Date) =>
    sessionDates.filter(d => isSameDay(d, day)).length

  // Find the Monday of the week containing rangeStart (Mon=1...Sun=0 in getDay)
  const dow = getDay(rangeStart) // 0=Sun,1=Mon,...,6=Sat
  const mondayOffset = dow === 0 ? 6 : dow - 1
  const gridStart = subDays(rangeStart, mondayOffset)

  // Build weeks until we've covered today
  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= today) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }

  return (
    <div className="bg-mat-card border border-mat-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
          <Flame size={15} className="text-mat-gold" />
          Training Calendar
        </h2>
        <span className="text-mat-text-muted text-xs">Last 30 days</span>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-mat-text-muted text-[10px] uppercase">{d[0]}</div>
        ))}
      </div>

      {/* Week rows — aspect-square cells so squares stay square */}
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((day, di) => {
              const inRange = day >= rangeStart && day <= today
              if (!inRange) return <div key={di} className="aspect-square" />
              const count = getCount(day)
              const isToday = isSameDay(day, today)
              let bg = 'bg-black border-mat-border'
              if (count === 1) bg = 'bg-mat-gold/40 border-mat-gold/40'
              if (count >= 2) bg = 'bg-mat-gold border-mat-gold'
              return (
                <div
                  key={di}
                  title={`${format(day, 'EEE MMM d')}${count > 0 ? ` · ${count} session${count > 1 ? 's' : ''}` : ''}`}
                  className={`aspect-square border cursor-default transition-colors rounded-[2px] ${bg} ${isToday ? 'ring-1 ring-mat-gold' : ''}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-black border border-mat-border" />
          <span className="text-mat-text-dim text-xs">No training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-gold/40 border border-mat-gold/40" />
          <span className="text-mat-text-dim text-xs">1 session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-gold border border-mat-gold" />
          <span className="text-mat-text-dim text-xs">2+ sessions</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-mat-gold' }: {
  label: string, value: string | number, sub?: string, color?: string
}) {
  return (
    <div className="bg-mat-card border border-mat-border p-5">
      <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-display text-4xl ${color}`}>{value}</p>
      {sub && <p className="text-mat-text-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}

function InsightCard({ insight }: { insight: { type: string; title: string; detail: string; action?: string; severity?: string } }) {
  const icons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle size={14} className="text-amber-400 shrink-0" />,
    highlight: <CheckCircle2 size={14} className="text-mat-green-light shrink-0" />,
    insight: <Lightbulb size={14} className="text-mat-gold shrink-0" />,
  }
  return (
    <div className="bg-mat-panel border border-mat-border p-4 gold-bar">
      <div className="flex items-start gap-2">
        {icons.insight}
        <div>
          <p className="text-mat-text text-sm font-semibold">{insight.title}</p>
          <p className="text-mat-text-muted text-xs mt-1 leading-relaxed">{insight.detail}</p>
          {insight.action && (
            <p className="text-mat-gold text-xs mt-2 font-medium">{insight.action}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: recentSessions } = useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: () => sessionsApi.recent().then(r => r.data),
  })

  const { data: calendarSessions } = useQuery({
    queryKey: ['sessions', 'calendar'],
    queryFn: () => sessionsApi.list({ page_size: 200 }).then(r => r.data?.results || r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.overview('30d').then(r => r.data),
  })

  const { data: insights } = useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: () => analyticsApi.insights().then(r => r.data),
  })

  const allInsights = [
    ...(insights?.warnings || []).map((i: any) => ({ ...i, _kind: 'warning' })),
    ...(insights?.highlights || []).map((i: any) => ({ ...i, _kind: 'highlight' })),
    ...(insights?.insights || []).map((i: any) => ({ ...i, _kind: 'insight' })),
  ].slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Welcome back</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">
            {user?.username || 'Athlete'}
          </h1>
          <p className="text-mat-text-muted text-sm capitalize mt-0.5">
            {user?.display_belt} {user?.gym ? `· ${user.gym}` : ''}
          </p>
        </div>
        <Link href="/sessions/new" className="btn-primary px-5 py-2.5 flex items-center gap-2 text-xs">
          <Plus size={14} />
          Log Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Sessions (30d)"
          value={stats?.total_sessions ?? '—'}
          sub={`${stats?.total_hours ?? 0}h on the mat`}
        />
        <StatCard
          label="Rounds (30d)"
          value={stats?.total_rounds ?? '—'}
          sub={`${stats?.win_rate ?? 0}% win rate`}
          color={stats?.win_rate >= 50 ? 'text-mat-green-light' : 'text-mat-red-light'}
        />
        <StatCard
          label="Techniques"
          value={stats?.techniques_in_db ?? '—'}
          sub="in your database"
          color="text-purple-400"
        />
        <StatCard
          label="Competitions"
          value={stats?.competitions ?? '—'}
          sub="lifetime"
          color="text-amber-400"
        />
      </div>

      {/* Main grid — both columns stretch to the same height */}
      <div className="grid lg:grid-cols-3 gap-4 items-stretch">

        {/* Left 2/3: flex column, 75% sessions + 25% calendar */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Recent Sessions — fills remaining space above calendar */}
          <div className="flex-1 min-h-0 flex flex-col bg-mat-card border border-mat-border overflow-hidden">
            <div className="px-5 py-4 border-b border-mat-border flex items-center justify-between shrink-0">
              <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
                <BookOpen size={15} className="text-mat-gold" />
                Recent Sessions
              </h2>
              <Link href="/sessions" className="text-mat-text-muted hover:text-mat-gold text-xs flex items-center gap-1 transition-colors">
                All Sessions <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-mat-border overflow-y-auto flex-1">
              {recentSessions?.length === 0 && (
                <div className="px-5 py-8 text-center text-mat-text-dim text-sm">
                  No sessions logged yet.{' '}
                  <Link href="/sessions/new" className="text-mat-gold hover:underline">Log your first one.</Link>
                </div>
              )}
              {recentSessions?.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-mat-darker transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase ${SESSION_TYPE_COLORS[s.session_type] || 'text-mat-text-muted'}`}>
                        {s.session_type_display}
                      </span>
                      {s.title && <span className="text-mat-text text-sm">{s.title}</span>}
                    </div>
                    <div className="text-mat-text-muted text-xs mt-0.5 flex items-center gap-3">
                      <span>{formatDate(s.date)}</span>
                      <span>{formatDuration(s.duration)}</span>
                      {s.round_count > 0 && <span>{s.round_count} rounds</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.performance_rating && (
                      <span className={`font-display text-xl ${getRatingColor(s.performance_rating)}`}>
                        {s.performance_rating}/5
                      </span>
                    )}
                    <ChevronRight size={14} className="text-mat-text-dim group-hover:text-mat-gold transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Training Calendar — natural height from aspect-square cells */}
          <div className="shrink-0">
            <TrainingCalendar sessions={Array.isArray(calendarSessions) ? calendarSessions : []} />
          </div>

        </div>

        {/* Right 1/3: Insights + Quick Actions */}
        <div className="flex flex-col gap-4">
          {allInsights.length > 0 && (
            <div className="bg-mat-card border border-mat-border shrink-0">
              <div className="px-5 py-4 border-b border-mat-border">
                <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
                  <Lightbulb size={15} className="text-mat-gold" />
                  Insights
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {allInsights.map((insight: any, i: number) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-mat-card border border-mat-border shrink-0">
            <div className="px-5 py-4 border-b border-mat-border">
              <h2 className="font-display text-lg tracking-wider uppercase text-mat-text">
                Quick Actions
              </h2>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { href: '/sessions/new', label: 'Log Training Session', icon: BookOpen, color: 'text-mat-gold' },
                { href: '/sparring', label: 'Add Sparring Round', icon: Swords, color: 'text-mat-red-light' },
                { href: '/techniques/new', label: 'Add Technique', icon: Target, color: 'text-purple-400' },
                { href: '/planning', label: 'Set Weekly Plan', icon: TrendingUp, color: 'text-mat-green-light' },
                { href: '/competition', label: 'Log Competition', icon: Trophy, color: 'text-amber-400' },
                { href: '/injuries', label: 'Log Injury', icon: HeartPulse, color: 'text-mat-red-light' },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-mat-darker transition-colors group"
                >
                  <Icon size={14} className={`${color} group-hover:scale-110 transition-transform shrink-0`} />
                  <span className="text-mat-text-muted group-hover:text-mat-text text-sm transition-colors">{label}</span>
                  <ChevronRight size={12} className="text-mat-text-dim group-hover:text-mat-gold ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
