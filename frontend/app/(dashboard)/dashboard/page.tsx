'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, analyticsApi, socialApi } from '@/lib/api'
import { DojoRoom, MyChallenges, ChallengeData } from '@/lib/types'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, getRatingColor } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Trophy, AlertTriangle, Lightbulb, CheckCircle2, X, Loader2,
  Zap, Swords, Clock, CheckCheck, ChevronRight,
  Database, BarChart2, CalendarDays, BookOpen,
} from 'lucide-react'

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = 'bg-mat-gold' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 bg-mat-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Insight card ───────────────────────────────────────────────────────────────

const INSIGHT_CONFIG: Record<string, { icon: React.ElementType; color: string; borderColor: string; bg: string }> = {
  warning:   { icon: AlertTriangle,  color: 'text-amber-400',       borderColor: 'border-l-amber-400',       bg: 'bg-amber-400/5'       },
  highlight: { icon: CheckCircle2,   color: 'text-mat-green-light', borderColor: 'border-l-mat-green-light', bg: 'bg-mat-green-light/5' },
  insight:   { icon: Lightbulb,      color: 'text-mat-gold',        borderColor: 'border-l-mat-gold',        bg: 'bg-mat-gold/5'        },
}

function InsightCard({ insight }: { insight: { type: string; title: string; detail: string; action?: string; _kind?: string } }) {
  const kind = insight._kind || 'insight'
  const cfg = INSIGHT_CONFIG[kind] || INSIGHT_CONFIG.insight
  const Icon = cfg.icon
  return (
    <div className={`border border-mat-border border-l-2 ${cfg.borderColor} ${cfg.bg} p-4`}>
      <div className="flex items-start gap-2.5">
        <Icon size={13} className={`${cfg.color} shrink-0 mt-0.5`} />
        <div className="min-w-0">
          <p className="text-mat-text text-sm font-semibold leading-snug">{insight.title}</p>
          <p className="text-mat-text-muted text-xs mt-1 leading-relaxed">{insight.detail}</p>
          {insight.action && <p className={`${cfg.color} text-xs mt-1.5 font-medium`}>{insight.action}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text-mat-gold', icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ElementType
}) {
  return (
    <div className="bg-mat-card border border-mat-border p-4 sm:p-5">
      {Icon && <Icon size={13} className={`${color} mb-2 opacity-70`} />}
      <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`font-display text-3xl sm:text-4xl ${color}`}>{value}</p>
      {sub && <p className="text-mat-text-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Challenge card ─────────────────────────────────────────────────────────────

function ChallengeCard({
  challenge, onAccept, onDecline, accepting, declining,
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
  const fmt = (v: number | null | undefined) => v === null || v === undefined ? '—' : `${v}${unit}`

  return (
    <div className={`border p-4 space-y-3 ${isCompleted && challenge.won ? 'border-mat-gold/40 bg-mat-gold/5' : 'border-mat-border bg-mat-panel'}`}>
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
            {challenge.challenge_type_display}{challenge.duration_days && ` · ${challenge.duration_days}d`}
          </p>
          {challenge.message && <p className="text-mat-text-muted text-xs mt-1 italic">&ldquo;{challenge.message}&rdquo;</p>}
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
              <span className={`font-medium ${challenge.leading ? 'text-mat-gold' : 'text-mat-text-muted'}`}>{fmt(myVal)}</span>
            </div>
            <ProgressBar value={myVal ?? 0} max={maxVal} color={challenge.leading ? 'bg-mat-gold' : 'bg-mat-text-muted/40'} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-mat-text-muted">{challenge.opponent.username}</span>
              <span className={`font-medium ${!challenge.leading ? 'text-mat-gold' : 'text-mat-text-muted'}`}>{fmt(theirVal)}</span>
            </div>
            <ProgressBar value={theirVal ?? 0} max={maxVal} color={!challenge.leading ? 'bg-mat-gold' : 'bg-mat-text-muted/40'} />
          </div>
        </div>
      )}

      {isPending && !challenge.is_challenger && onAccept && onDecline && (
        <div className="flex gap-2 pt-1">
          <button onClick={onAccept} disabled={accepting || declining}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
            {accepting ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
            Accept
          </button>
          <button onClick={onDecline} disabled={accepting || declining}
            className="btn-secondary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
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

// ── Last trained card ──────────────────────────────────────────────────────────

function LastTrainedCard({ session }: { session: any }) {
  if (!session) {
    return (
      <div className="bg-mat-card border border-mat-border p-6 flex flex-col justify-center h-full min-h-32">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-2">Last Trained</p>
        <p className="text-mat-text-dim text-sm">No sessions logged yet.</p>
        <Link href="/sessions/new" className="text-mat-gold text-xs mt-3 hover:underline inline-flex items-center gap-1">
          Log your first session <ChevronRight size={10} />
        </Link>
      </div>
    )
  }
  return (
    <div className="bg-mat-card border border-mat-border p-6 h-full flex flex-col justify-between">
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Last Trained</p>
        <p className={`text-xs font-bold uppercase tracking-wider ${SESSION_TYPE_COLORS[session.session_type] || 'text-mat-text-muted'}`}>
          {session.session_type_display}
        </p>
        <p className="font-display text-4xl text-mat-gold mt-1">{formatDate(session.date)}</p>
        <div className="flex flex-wrap gap-4 mt-3">
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Duration</p>
            <p className="text-mat-text text-sm font-medium">{formatDuration(session.duration)}</p>
          </div>
          {session.round_count > 0 && (
            <div>
              <p className="text-mat-text-muted text-xs uppercase tracking-widest">Rounds</p>
              <p className="text-mat-text text-sm font-medium">{session.round_count}</p>
            </div>
          )}
          {session.performance_rating && (
            <div>
              <p className="text-mat-text-muted text-xs uppercase tracking-widest">Performance</p>
              <p className={`text-sm font-medium ${getRatingColor(session.performance_rating)}`}>
                {session.performance_rating}/5
              </p>
            </div>
          )}
        </div>
        {session.title && <p className="text-mat-text-dim text-xs mt-2 italic">{session.title}</p>}
      </div>
      <Link href={`/sessions/${session.id}`} className="text-mat-gold text-xs mt-4 flex items-center gap-1 hover:underline self-start">
        View session details <ChevronRight size={10} />
      </Link>
    </div>
  )
}

// ── Onboarding feature card ────────────────────────────────────────────────────

function OnboardCard({ href, icon: Icon, label, desc, color = 'text-mat-gold', step }: {
  href: string; icon: React.ElementType; label: string; desc: string; color?: string; step: string
}) {
  return (
    <Link href={href} className="group border border-mat-border bg-mat-card p-4 hover:border-mat-gold/50 transition-all block">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 border border-mat-border flex items-center justify-center shrink-0 group-hover:border-mat-gold/50 transition-colors`}>
          <Icon size={14} className={color} />
        </div>
        <div className="min-w-0">
          <p className="text-mat-text text-sm font-semibold leading-snug">{label}</p>
          <p className="text-mat-text-dim text-xs leading-relaxed mt-1">{desc}</p>
          <span className={`${color} text-xs mt-2 inline-flex items-center gap-1 group-hover:underline`}>
            Get started <ChevronRight size={10} />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Dashboard page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

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
    ...(insights?.warnings  || []).map((i: any) => ({ ...i, _kind: 'warning'   })),
    ...(insights?.highlights || []).map((i: any) => ({ ...i, _kind: 'highlight' })),
    ...(insights?.insights   || []).map((i: any) => ({ ...i, _kind: 'insight'   })),
  ]

  const pendingChallenges = challengesData?.pending_received?.length ?? 0
  const winRate = stats?.win_rate ?? 0

  // Onboarding grid: show for new users and users inactive in the last 30 days
  // "Active" = 5+ sessions in the past 30 days
  const sessions30d: number = stats?.total_sessions ?? 0
  const statsLoaded = stats !== undefined
  const showOnboarding = statsLoaded && sessions30d < 5

  // Returning-inactive label: logged before but nothing recent
  const hasAnyHistory = (recentSessions?.length ?? 0) > 0
  const onboardingTitle = hasAnyHistory && sessions30d === 0
    ? 'Welcome Back'
    : 'Get Started'
  const onboardingSubtitle = hasAnyHistory && sessions30d === 0
    ? 'You haven\'t logged a session in a while. Here\'s a refresher on what MatLogic can do.'
    : 'Unlock everything MatLogic has to offer.'

  return (
    <div className="animate-fade-in space-y-5 max-w-5xl">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Welcome back</p>
          <h1 className="font-display text-3xl sm:text-5xl tracking-wider text-mat-text uppercase leading-none mt-0.5">
            {user?.username || 'Athlete'}
          </h1>
          <p className="text-mat-text-muted text-sm capitalize mt-1.5">
            {user?.display_belt}{user?.gym ? ` · ${user.gym}` : ''}
          </p>
        </div>

        {/* Log session button — navigates to full form */}
        <Link
          href="/sessions/new"
          data-tutorial="quick-log"
          className="flex flex-col items-center justify-center gap-2 px-5 sm:px-8 border-2 border-mat-gold bg-mat-card text-mat-gold hover:bg-mat-gold hover:text-mat-black transition-all shrink-0 min-w-[120px]"
        >
          <Zap size={22} />
          <span className="text-xs font-bold uppercase tracking-wider text-center leading-tight">
            Log Today&apos;s<br />Session
          </span>
        </Link>
      </div>

      {/* ── Insights ─────────────────────────────────────────────────────────── */}
      <div className="bg-mat-card border border-mat-border" data-tutorial="insights">
        <div className="px-5 py-3.5 border-b border-mat-border flex items-center justify-between">
          <h2 className="font-display text-base tracking-wider uppercase text-mat-text flex items-center gap-2">
            <Lightbulb size={14} className="text-mat-gold" />
            Your Training Insights
          </h2>
          <Link href="/progress" className="text-mat-text-muted hover:text-mat-gold text-xs transition-colors flex items-center gap-1">
            Full Analytics <ChevronRight size={11} />
          </Link>
        </div>
        {allInsights.length > 0 ? (
          <div className="p-4 grid sm:grid-cols-2 gap-3">
            {allInsights.map((insight: any, i: number) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <CheckCircle2 size={20} className="text-mat-green-light mx-auto mb-2 opacity-60" />
            <p className="text-mat-text-muted text-sm">No issues detected — training is on track.</p>
            <p className="text-mat-text-dim text-xs mt-1">Log more sessions for deeper insights.</p>
          </div>
        )}
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Sessions (30d)"
          value={stats?.total_sessions ?? '—'}
          sub={`${stats?.total_hours ?? 0}h on the mat`}
          icon={BookOpen}
        />
        <StatCard
          label="Rounds (30d)"
          value={stats?.total_rounds ?? '—'}
          sub={`${winRate}% win rate`}
          color={winRate >= 50 ? 'text-mat-green-light' : stats?.total_rounds > 0 ? 'text-mat-red-light' : 'text-mat-gold'}
          icon={Swords}
        />
        <StatCard
          label="Techniques"
          value={stats?.techniques_in_db ?? '—'}
          sub="in your database"
          color="text-purple-400"
          icon={Database}
        />
        <StatCard
          label="Competitions"
          value={stats?.competitions ?? '—'}
          sub="lifetime"
          color="text-amber-400"
          icon={Trophy}
        />
      </div>

      {/* ── Last trained + Challenges ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LastTrainedCard session={recentSessions?.[0]} />
        </div>

        <div>
          {challengesData && (() => {
            const { pending_received, pending_sent, active, completed } = challengesData
            const total = pending_received.length + pending_sent.length + active.length + completed.length
            return (
              <div className="bg-mat-card border border-mat-border h-full flex flex-col" data-tutorial="challenges">
                <div className="px-5 py-3.5 border-b border-mat-border flex items-center justify-between shrink-0">
                  <h2 className="font-display text-base tracking-wider uppercase text-mat-text flex items-center gap-2">
                    <Swords size={14} className="text-mat-gold" />
                    Challenges
                    {pendingChallenges > 0 && (
                      <span className="bg-mat-gold text-mat-black text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {pendingChallenges}
                      </span>
                    )}
                  </h2>
                  <Link href="/dojo" className="text-mat-text-muted hover:text-mat-gold text-xs transition-colors">
                    Dojo →
                  </Link>
                </div>
                {total === 0 ? (
                  <div className="px-5 py-6 text-center flex-1 flex flex-col items-center justify-center gap-2">
                    <Swords size={18} className="text-mat-gold opacity-30" />
                    <p className="text-mat-text-dim text-xs">No active challenges.</p>
                    <Link href="/dojo" className="text-mat-gold text-xs hover:underline">
                      Challenge a gym mate →
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto">
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

      {/* ── Onboarding grid — shown for new and returning-inactive users ──────── */}
      {showOnboarding && (
        <div className="bg-mat-card border border-mat-gold/30 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 bg-mat-gold shrink-0" />
              <h2 className="font-display text-lg tracking-wider text-mat-text uppercase">{onboardingTitle}</h2>
            </div>
            <p className="text-mat-text-muted text-xs pl-3">{onboardingSubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <OnboardCard
              href="/sessions/new"
              icon={BookOpen}
              label="Log a training session"
              desc="Record what you trained, how long, how many rounds, and your performance rating."
              color="text-mat-green-light"
              step="01"
            />
            <OnboardCard
              href="/techniques"
              icon={Database}
              label="Build your technique library"
              desc="Save moves you're drilling by position and type. Track how often you practice each one."
              color="text-purple-400"
              step="02"
            />
            <OnboardCard
              href="/planning"
              icon={CalendarDays}
              label="Set a weekly training plan"
              desc="Define goals and focus areas for each day of the week to stay consistent."
              color="text-sky-400"
              step="03"
            />
            <OnboardCard
              href="/progress"
              icon={BarChart2}
              label="Check your analytics"
              desc="See training trends, sparring stats, technique usage, and your full training calendar."
              color="text-mat-gold"
              step="04"
            />
          </div>
        </div>
      )}

    </div>
  )
}
