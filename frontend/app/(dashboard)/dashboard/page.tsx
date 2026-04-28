'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, analyticsApi, socialApi } from '@/lib/api'
import { DojoRoom, MyChallenges, ChallengeData } from '@/lib/types'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, getRatingColor } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Trophy, AlertTriangle, Lightbulb, CheckCircle2, X, Loader2,
  Zap, ChevronDown, Users, Swords, Clock, CheckCheck, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MyProfilePage from '../my-profile/page'

function ProgressBar({ value, max, color = 'bg-mat-gold' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 bg-mat-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ChallengeCard({
  challenge,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  challenge: ChallengeData
  onAccept?: () => void
  onDecline?: () => void
  accepting?: boolean
  declining?: boolean
}) {
  const isActive = challenge.status === 'active'
  const isCompleted = challenge.status === 'completed'
  const isPending = challenge.status === 'pending'

  const myVal = challenge.my_value
  const theirVal = challenge.their_value
  const maxVal = Math.max(myVal ?? 0, theirVal ?? 0, 1)
  const unit = challenge.unit
  const fmt = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : `${v}${unit}`

  return (
    <div className={`border p-4 space-y-3 ${
      isCompleted && challenge.won
        ? 'border-mat-gold/40 bg-mat-gold/5'
        : isCompleted && challenge.won === false
          ? 'border-mat-border bg-mat-panel'
          : 'border-mat-border bg-mat-panel'
    }`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
          {challenge.opponent.avatar
            ? <img src={challenge.opponent.avatar} alt={challenge.opponent.username} className="w-full h-full object-cover" />
            : <span className="text-mat-gold font-bold text-xs">{challenge.opponent.username.slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-mat-text text-sm font-medium">{challenge.opponent.username}</span>
            <span className="text-mat-text-dim text-xs">
              {isPending && !challenge.is_challenger ? 'challenged you' : challenge.is_challenger ? 'you challenged' : ''}
            </span>
          </div>
          <p className="text-mat-gold text-xs font-medium mt-0.5">
            {challenge.challenge_type_display}
            {challenge.duration_days && ` · ${challenge.duration_days} days`}
          </p>
          {challenge.message && (
            <p className="text-mat-text-muted text-xs mt-1 italic">&ldquo;{challenge.message}&rdquo;</p>
          )}
        </div>
        {isActive && challenge.days_left !== undefined && (
          <div className="text-right shrink-0">
            <p className="font-display text-mat-gold text-lg">{challenge.days_left}</p>
            <p className="text-mat-text-dim text-xs">days left</p>
          </div>
        )}
        {isCompleted && (
          <div className="shrink-0">
            {challenge.won === true && <Trophy size={16} className="text-amber-400" />}
            {challenge.won === false && <span className="text-mat-text-dim text-xs">L</span>}
            {challenge.won === null && <span className="text-mat-text-dim text-xs">Draw</span>}
          </div>
        )}
      </div>

      {(isActive || isCompleted) && (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-mat-gold">You</span>
              <span className={`font-medium ${challenge.leading ? 'text-mat-gold' : 'text-mat-text-muted'}`}>
                {fmt(myVal)}
              </span>
            </div>
            <ProgressBar
              value={myVal ?? 0}
              max={maxVal}
              color={challenge.leading ? 'bg-mat-gold' : 'bg-mat-text-muted/40'}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-mat-text-muted">{challenge.opponent.username}</span>
              <span className={`font-medium ${!challenge.leading ? 'text-mat-gold' : 'text-mat-text-muted'}`}>
                {fmt(theirVal)}
              </span>
            </div>
            <ProgressBar
              value={theirVal ?? 0}
              max={maxVal}
              color={!challenge.leading ? 'bg-mat-gold' : 'bg-mat-text-muted/40'}
            />
          </div>
          {challenge.challenge_type === 'win_rate' && (myVal === null || theirVal === null) && (
            <p className="text-mat-text-dim text-xs">Minimum 3 sparring rounds required to count.</p>
          )}
        </div>
      )}

      {isPending && !challenge.is_challenger && onAccept && onDecline && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onAccept}
            disabled={accepting || declining}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
          >
            {accepting ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
            Accept
          </button>
          <button
            onClick={onDecline}
            disabled={accepting || declining}
            className="btn-secondary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
          >
            {declining ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
            Decline
          </button>
        </div>
      )}

      {isPending && challenge.is_challenger && (
        <p className="text-mat-text-dim text-xs flex items-center gap-1">
          <Clock size={10} /> Waiting for response…
        </p>
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
    <div className="bg-mat-card border border-mat-border" data-tutorial="quick-log">
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

function LastTrainedCard({ session }: { session: any | undefined }) {
  if (!session) {
    return (
      <div className="bg-mat-card border border-mat-border p-5 flex flex-col justify-center min-h-36">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-2">Last Trained</p>
        <p className="text-mat-text-dim text-sm">No sessions logged yet.</p>
        <Link href="/sessions/new" className="text-mat-gold text-xs mt-3 hover:underline">
          Log your first session →
        </Link>
      </div>
    )
  }
  return (
    <div className="bg-mat-card border border-mat-border p-5">
      <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Last Trained</p>
      <p className={`text-xs font-bold uppercase ${SESSION_TYPE_COLORS[session.session_type] || 'text-mat-text-muted'}`}>
        {session.session_type_display}
      </p>
      <p className="font-display text-3xl text-mat-gold mt-1">{formatDate(session.date)}</p>
      <div className="text-mat-text-muted text-xs mt-2 space-y-0.5">
        <p>{formatDuration(session.duration)}</p>
        {session.round_count > 0 && <p>{session.round_count} rounds</p>}
        {session.performance_rating && (
          <p className={getRatingColor(session.performance_rating)}>{session.performance_rating}/5 performance</p>
        )}
      </div>
      <Link href={`/sessions/${session.id}`} className="text-mat-gold text-xs mt-3 flex items-center gap-1 hover:underline">
        View Session <ChevronRight size={10} />
      </Link>
    </div>
  )
}

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'my-profile', label: 'My Profile' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('overview')

  const { data: recentSessions } = useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: () => sessionsApi.recent().then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.overview('30d').then(r => r.data),
  })

  const { data: insights } = useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: () => analyticsApi.insights().then(r => r.data),
  })

  const { data: dojoData } = useQuery<DojoRoom | { detail: string }>({
    queryKey: ['dojo'],
    queryFn: () => socialApi.dojo().then(r => r.data),
    enabled: !!user?.gym,
  })

  const { data: challengesData, refetch: refetchChallenges } = useQuery<MyChallenges>({
    queryKey: ['challenges'],
    queryFn: () => socialApi.myChallenges().then(r => r.data),
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' }) =>
      socialApi.respondChallenge(id, action),
    onSuccess: (_, { action }) => {
      refetchChallenges()
      toast.success(action === 'accept' ? 'Challenge accepted! Let\'s go.' : 'Challenge declined.')
    },
    onError: () => toast.error('Failed to respond.'),
  })

  const allInsights = [
    ...(insights?.warnings || []).map((i: any) => ({ ...i, _kind: 'warning' })),
    ...(insights?.highlights || []).map((i: any) => ({ ...i, _kind: 'highlight' })),
    ...(insights?.insights || []).map((i: any) => ({ ...i, _kind: 'insight' })),
  ].slice(0, 4)

  return (
    <div className="animate-fade-in">
      <div className="flex border-b border-mat-border mb-6">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cn('px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px',
              tab === t.value ? 'text-mat-gold border-mat-gold' : 'text-mat-text-muted border-transparent hover:text-mat-text'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my-profile' && <MyProfilePage />}

      {tab === 'overview' && (
      <div className="space-y-6">
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
        </div>

        {/* Quick Log */}
        <QuickLogPanel />

        {/* Insights — promoted to top */}
        {allInsights.length > 0 && (
          <div className="bg-mat-card border border-mat-border" data-tutorial="insights">
            <div className="px-5 py-4 border-b border-mat-border">
              <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
                <Lightbulb size={15} className="text-mat-gold" />
                Insights
              </h2>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              {allInsights.map((insight: any, i: number) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

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

        {/* Getting Started — only shown when no sessions exist */}
        {stats !== undefined && stats?.total_sessions === 0 && (
          <div className="bg-mat-card border border-mat-gold/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-mat-gold" />
              <h2 className="font-display text-lg tracking-wider text-mat-text uppercase">Getting Started</h2>
            </div>
            <p className="text-mat-text-muted text-xs">Three steps to get the most out of MatLogic:</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { step: '01', label: 'Log your first session', desc: 'Record a training session to start tracking your progress.', href: '/sessions/new', cta: 'Log Session' },
                { step: '02', label: 'Build your Techniques', desc: 'Save techniques you\'re drilling so you can track them over time.', href: '/techniques/new', cta: 'Add Technique' },
                { step: '03', label: 'Set your weekly plan', desc: 'Define training goals for each day to build consistency.', href: '/planning', cta: 'Open Planner' },
              ].map(({ step, label, desc, href, cta }) => (
                <Link key={step} href={href} className="group border border-mat-border p-4 hover:border-mat-gold/50 transition-colors block">
                  <p className="font-display text-2xl text-mat-gold/30 group-hover:text-mat-gold/60 transition-colors mb-2">{step}</p>
                  <p className="text-mat-text text-sm font-medium mb-1">{label}</p>
                  <p className="text-mat-text-dim text-xs leading-relaxed mb-3">{desc}</p>
                  <span className="text-mat-gold text-xs group-hover:underline">{cta} →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mini Dojo leaderboard */}
        {dojoData && !('detail' in dojoData) && (dojoData as DojoRoom).members.length > 1 && (() => {
          const dojo = dojoData as DojoRoom
          const top = [...dojo.members]
            .sort((a, b) => b.hours_month - a.hours_month)
            .slice(0, 5)
          return (
            <div className="bg-mat-card border border-mat-border">
              <div className="px-5 py-4 border-b border-mat-border flex items-center justify-between">
                <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
                  <Users size={15} className="text-mat-gold" />
                  {dojo.gym} Dojo
                </h2>
                <Link href="/dojo" className="text-mat-text-muted hover:text-mat-gold text-xs flex items-center gap-1 transition-colors">
                  Full Leaderboard <ChevronRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-mat-border">
                {top.map((m, i) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 px-5 py-3 ${m.is_me ? 'bg-mat-gold/5' : ''}`}
                  >
                    <span className={`font-display text-base w-5 text-center ${i === 0 ? 'text-amber-400' : 'text-mat-text-dim'}`}>
                      #{i + 1}
                    </span>
                    <div className="w-7 h-7 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
                      {m.avatar
                        ? <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" />
                        : <span className="text-mat-gold font-bold text-xs">{m.username.slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <span className={`flex-1 text-sm ${m.is_me ? 'text-mat-gold font-medium' : 'text-mat-text'}`}>
                      {m.username}{m.is_me ? ' (you)' : ''}
                    </span>
                    <span className="font-display text-mat-gold text-base">{m.hours_month}h</span>
                    <span className="text-mat-text-dim text-xs">this month</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Last Trained + Challenges */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <LastTrainedCard session={recentSessions?.[0]} />
          </div>

          <div className="flex flex-col gap-4">
            {challengesData && (() => {
              const { pending_received, pending_sent, active, completed } = challengesData
              const total = pending_received.length + pending_sent.length + active.length + completed.length
              return (
                <div className="bg-mat-card border border-mat-border" data-tutorial="challenges">
                  <div className="px-5 py-4 border-b border-mat-border flex items-center justify-between">
                    <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
                      <Swords size={15} className="text-mat-gold" />
                      Challenges
                      {pending_received.length > 0 && (
                        <span className="bg-mat-gold text-mat-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {pending_received.length}
                        </span>
                      )}
                    </h2>
                    <Link href="/dojo" className="text-mat-text-muted hover:text-mat-gold text-xs transition-colors">
                      Dojo →
                    </Link>
                  </div>
                  {total === 0 ? (
                    <div className="px-5 py-5 text-center">
                      <p className="text-mat-text-dim text-xs">Challenge a gym mate from the Dojo page.</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {pending_received.map(c => (
                        <ChallengeCard
                          key={c.id}
                          challenge={c}
                          onAccept={() => respondMutation.mutate({ id: c.id, action: 'accept' })}
                          onDecline={() => respondMutation.mutate({ id: c.id, action: 'decline' })}
                          accepting={respondMutation.isPending && respondMutation.variables?.id === c.id && respondMutation.variables?.action === 'accept'}
                          declining={respondMutation.isPending && respondMutation.variables?.id === c.id && respondMutation.variables?.action === 'decline'}
                        />
                      ))}
                      {active.map(c => <ChallengeCard key={c.id} challenge={c} />)}
                      {pending_sent.map(c => <ChallengeCard key={c.id} challenge={c} />)}
                      {completed.slice(0, 2).map(c => <ChallengeCard key={c.id} challenge={c} />)}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
