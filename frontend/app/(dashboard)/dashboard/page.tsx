'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, analyticsApi, competitionApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, getRatingColor } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  format, subDays, addDays, parseISO, isSameDay, getDay, startOfDay,
  startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, getDate,
} from 'date-fns'
import {
  BookOpen, Swords, Target, TrendingUp, Plus, ChevronRight, ChevronLeft,
  Flame, Trophy, AlertTriangle, Lightbulb, CheckCircle2, HeartPulse, X, Loader2,
  Zap, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function TrainingCalendar({
  sessions,
  competitions,
}: {
  sessions: { date: string; id: number; session_type: string; session_type_display: string; duration: number }[]
  competitions: { date: string; id: number; name: string; result: string; result_display: string }[]
}) {
  const today = startOfDay(new Date())
  const minMonth = startOfMonth(subMonths(today, 12))
  const maxMonth = startOfMonth(addMonths(today, 12))

  const [viewedMonth, setViewedMonth] = useState(startOfMonth(today))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showAddComp, setShowAddComp] = useState(false)
  const [newCompName, setNewCompName] = useState('')
  const [newCompResult, setNewCompResult] = useState('')

  const queryClient = useQueryClient()

  const createCompMutation = useMutation({
    mutationFn: (data: object) => competitionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      toast.success('Competition saved.')
      setShowAddComp(false)
      setNewCompName('')
      setNewCompResult('')
    },
    onError: () => toast.error('Failed to save competition.'),
  })

  const changeMonth = (newMonth: Date) => {
    setViewedMonth(newMonth)
    setSelectedDay(null)
    setShowAddComp(false)
  }

  const monthStart = startOfMonth(viewedMonth)
  const monthEnd = endOfMonth(viewedMonth)

  const dow = getDay(monthStart)
  const mondayOffset = dow === 0 ? 6 : dow - 1
  const gridStart = subDays(monthStart, mondayOffset)

  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= monthEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }

  const enrichedSessions = (sessions || []).map(s => ({ ...s, day: startOfDay(parseISO(s.date)) }))
  const enrichedComps = (competitions || []).map(c => ({ ...c, day: startOfDay(parseISO(c.date)) }))

  const getSessionsForDay = (day: Date) => enrichedSessions.filter(s => isSameDay(s.day, day))
  const getCompsForDay = (day: Date) => enrichedComps.filter(c => isSameDay(c.day, day))

  const canGoPrev = viewedMonth > minMonth
  const canGoNext = viewedMonth < maxMonth

  const daySessions = selectedDay ? getSessionsForDay(selectedDay) : []
  const dayComps = selectedDay ? getCompsForDay(selectedDay) : []

  return (
    <div className="bg-mat-card border border-mat-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
          <Flame size={15} className="text-mat-gold" />
          Training Calendar — {format(viewedMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(subMonths(viewedMonth, 1))}
            disabled={!canGoPrev}
            className="p-1 text-mat-text-muted hover:text-mat-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => changeMonth(startOfMonth(today))}
            className="px-2 text-mat-text-muted hover:text-mat-gold text-xs transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => changeMonth(addMonths(viewedMonth, 1))}
            disabled={!canGoNext}
            className="p-1 text-mat-text-muted hover:text-mat-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-mat-text-muted text-[10px] uppercase">{d[0]}</div>
        ))}
      </div>

      {/* Week rows */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              const inMonth = isSameMonth(day, viewedMonth)
              const count = inMonth ? getSessionsForDay(day).length : 0
              const hasComp = inMonth && getCompsForDay(day).length > 0
              const isToday = isSameDay(day, today)
              const isSelected = !!selectedDay && isSameDay(day, selectedDay)

              let bg = inMonth ? 'bg-mat-panel hover:bg-mat-panel/80' : ''
              if (inMonth && count === 1) bg = 'bg-mat-gold/30 hover:bg-mat-gold/40'
              if (inMonth && count >= 2) bg = 'bg-mat-gold/60 hover:bg-mat-gold/70'

              let borderCls = inMonth ? 'border-mat-border' : 'border-transparent'
              if (inMonth && count === 1) borderCls = 'border-mat-gold/40'
              if (inMonth && count >= 2) borderCls = 'border-mat-gold/60'
              if (hasComp) borderCls = 'border-amber-500/70'

              return (
                <button
                  key={di}
                  onClick={() => {
                    if (!inMonth) return
                    if (isSelected) {
                      setSelectedDay(null)
                      setShowAddComp(false)
                    } else {
                      setSelectedDay(day)
                      setShowAddComp(false)
                    }
                  }}
                  disabled={!inMonth}
                  className={[
                    'relative h-8 flex flex-col items-start justify-start p-1 border rounded-[2px] transition-colors',
                    bg, borderCls,
                    isToday ? 'ring-1 ring-mat-gold' : '',
                    isSelected ? 'ring-1 ring-white/40' : '',
                    inMonth ? 'cursor-pointer' : 'cursor-default',
                  ].join(' ')}
                >
                  <span className={`text-[9px] leading-none font-medium ${
                    isToday ? 'text-mat-gold' : inMonth ? 'text-mat-text-muted' : 'text-transparent'
                  }`}>
                    {getDate(day)}
                  </span>
                  {hasComp && (
                    <Trophy size={7} className="absolute bottom-0.5 right-0.5 text-amber-400" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-panel border border-mat-border rounded-[1px]" />
          <span className="text-mat-text-dim text-xs">No training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-gold/30 border border-mat-gold/40 rounded-[1px]" />
          <span className="text-mat-text-dim text-xs">1 session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-gold/60 border border-mat-gold/60 rounded-[1px]" />
          <span className="text-mat-text-dim text-xs">2+ sessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy size={9} className="text-amber-400" />
          <span className="text-mat-text-dim text-xs">Competition</span>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="mt-3 border-t border-mat-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mat-text text-sm font-medium">
              {format(selectedDay, 'EEEE, MMMM d')}
            </span>
            <button
              onClick={() => { setSelectedDay(null); setShowAddComp(false) }}
              className="text-mat-text-dim hover:text-mat-text transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Sessions */}
          {daySessions.length > 0 && (
            <div className="mb-2 space-y-1">
              {daySessions.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center gap-2 text-xs text-mat-text-muted hover:text-mat-gold transition-colors"
                >
                  <BookOpen size={10} />
                  <span className={SESSION_TYPE_COLORS[s.session_type] || 'text-mat-text-muted'}>
                    {s.session_type_display}
                  </span>
                  <span>· {formatDuration(s.duration)}</span>
                  <ChevronRight size={10} className="ml-auto" />
                </Link>
              ))}
            </div>
          )}

          {/* Competitions */}
          {dayComps.length > 0 && (
            <div className="mb-2 space-y-1">
              {dayComps.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 text-xs text-amber-400">
                  <Trophy size={10} />
                  <span>{c.name}</span>
                  {c.result_display && (
                    <span className="text-mat-text-muted">· {c.result_display}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {daySessions.length === 0 && dayComps.length === 0 && (
            <p className="text-mat-text-dim text-xs mb-2">No activity logged.</p>
          )}

          {/* Action buttons */}
          {!showAddComp && (
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/sessions/new?date=${format(selectedDay, 'yyyy-MM-dd')}`}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Plus size={11} /> Log Session
              </Link>
              <button
                onClick={() => setShowAddComp(true)}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Trophy size={11} /> Add Competition
              </button>
            </div>
          )}

          {/* Add competition mini-form */}
          {showAddComp && (
            <div className="space-y-2">
              <input
                className="mat-input text-xs"
                placeholder="Competition name (e.g. IBJJF Pan Ams)"
                value={newCompName}
                onChange={e => setNewCompName(e.target.value)}
              />
              <select
                className="mat-input text-xs"
                value={newCompResult}
                onChange={e => setNewCompResult(e.target.value)}
              >
                <option value="">— Result (leave blank if upcoming) —</option>
                <option value="gold">Gold Medal</option>
                <option value="silver">Silver Medal</option>
                <option value="bronze">Bronze Medal</option>
                <option value="participated">Participated</option>
                <option value="withdrew">Withdrew</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    createCompMutation.mutate({
                      name: newCompName,
                      date: format(selectedDay, 'yyyy-MM-dd'),
                      result: newCompResult,
                    })
                  }
                  disabled={!newCompName.trim() || createCompMutation.isPending}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createCompMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => { setShowAddComp(false); setNewCompName(''); setNewCompResult('') }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QuickLogPanel() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [sessionType, setSessionType] = useState('gi')
  const [duration, setDuration] = useState(90)
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: (data: object) => sessionsApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      toast.success('Session logged!')
      router.push(`/sessions/${res.data.id}`)
    },
    onError: () => toast.error('Failed to log session.'),
  })

  const handleLog = () => {
    mutation.mutate({
      date: format(new Date(), 'yyyy-MM-dd'),
      session_type: sessionType,
      duration,
      title: title.trim() || undefined,
    })
  }

  return (
    <div className="bg-mat-card border border-mat-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-mat-darker transition-colors"
      >
        <div className="flex items-center gap-2 text-mat-text-muted">
          <Zap size={13} className="text-mat-gold" />
          <span className="text-sm font-medium">Quick Log Today&apos;s Session</span>
        </div>
        <ChevronDown size={14} className={cn('text-mat-text-dim transition-transform duration-200', open ? 'rotate-180' : '')} />
      </button>

      {open && (
        <div className="border-t border-mat-border px-5 py-4 animate-slide-up">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="mat-label">Type</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                className="mat-input w-36"
              >
                {[
                  { value: 'gi', label: 'Gi' },
                  { value: 'nogi', label: 'No-Gi' },
                  { value: 'open_mat', label: 'Open Mat' },
                  { value: 'drilling', label: 'Drilling' },
                  { value: 'wrestling', label: 'Wrestling' },
                  { value: 'fundamentals', label: 'Fundamentals' },
                  { value: 'competition', label: 'Competition' },
                ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mat-label">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="mat-input w-24"
                min={1}
              />
            </div>
            <div className="flex-1 min-w-32">
              <label className="mat-label">Title (optional)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mat-input"
                placeholder="e.g. Friday night class"
              />
            </div>
            <button
              onClick={handleLog}
              disabled={mutation.isPending}
              className="btn-primary px-5 py-2 flex items-center gap-2 text-xs shrink-0 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              Log Now
            </button>
            <Link href="/sessions/new" className="btn-secondary px-4 py-2 text-xs shrink-0">
              Full Form
            </Link>
          </div>
        </div>
      )}
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
    queryFn: () => sessionsApi.list({ page_size: 500 }).then(r => r.data?.results || r.data),
  })

  const { data: calendarCompetitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => competitionApi.list().then(r => r.data?.results || r.data),
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Welcome back</p>
          <h1 className="font-display text-2xl sm:text-4xl tracking-wider text-mat-text uppercase">
            {user?.username || 'Athlete'}
          </h1>
          <p className="text-mat-text-muted text-sm capitalize mt-0.5">
            {user?.display_belt} {user?.gym ? `· ${user.gym}` : ''}
          </p>
        </div>
        <Link href="/sessions/new" className="btn-secondary px-4 py-2.5 flex items-center gap-2 text-xs shrink-0">
          <Plus size={14} />
          Full Log
        </Link>
      </div>

      {/* Quick Log */}
      <QuickLogPanel />

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

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4 items-stretch">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Recent Sessions */}
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

          {/* Training Calendar */}
          <div className="shrink-0">
            <TrainingCalendar
              sessions={Array.isArray(calendarSessions) ? calendarSessions : []}
              competitions={Array.isArray(calendarCompetitions) ? calendarCompetitions : []}
            />
          </div>

        </div>

        {/* Right 1/3 */}
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
