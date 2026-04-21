'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, sparringApi } from '@/lib/api'
import { formatDate, OUTCOME_COLORS } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Loader2, TrendingUp, Swords, Target, Lightbulb, AlertTriangle,
  CheckCircle2, ChevronDown,
} from 'lucide-react'
import type { SparringRound } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const CHART_COLORS = { gold: '#c9a227', red: '#8b1a1a', green: '#2d8a2d', blue: '#2d5a9e', muted: '#333333', text: '#7a7a7a' }
const PIE_COLORS = ['#c9a227', '#8b1a1a', '#2d5a9e', '#2d8a2d', '#a855f7', '#f97316', '#06b6d4', '#ec4899']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mat-panel border border-mat-border px-3 py-2 text-xs">
      <p className="text-mat-text-muted mb-1">{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

function SectionCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="bg-mat-card border border-mat-border">
      <div className="px-6 py-4 border-b border-mat-border flex items-center gap-2">
        {Icon && <Icon size={15} className="text-mat-gold" />}
        <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

const PERIODS = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
]

function AnalyticsTab() {
  const [period, setPeriod] = useState('90d')

  const { data: overview } = useQuery({ queryKey: ['analytics', 'overview', period], queryFn: () => analyticsApi.overview(period).then(r => r.data) })
  const { data: trends, isLoading: trendsLoading } = useQuery({ queryKey: ['analytics', 'trends', period], queryFn: () => analyticsApi.trainingTrends(period).then(r => r.data) })
  const { data: sparring, isLoading: sparringLoading } = useQuery({ queryKey: ['analytics', 'sparring', period], queryFn: () => analyticsApi.sparringStats(period).then(r => r.data) })
  const { data: techAnalysis } = useQuery({ queryKey: ['analytics', 'techniques', period], queryFn: () => analyticsApi.techniqueAnalysis(period).then(r => r.data) })
  const { data: insights } = useQuery({ queryKey: ['analytics', 'insights'], queryFn: () => analyticsApi.insights().then(r => r.data) })

  const typeData = Object.entries(trends?.session_type_breakdown || {}).map(([k, v]) => ({ name: k.replace('_', ' ').toUpperCase(), value: v as number }))
  const positionData = Object.entries(techAnalysis?.position_coverage || {}).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v as number })).sort((a, b) => b.value - a.value).slice(0, 8)
  const hasAnyData = (overview?.total_sessions ?? 0) > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Performance Data</p>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${period === p.value ? 'bg-mat-gold text-mat-black font-bold' : 'bg-mat-card border border-mat-border text-mat-text-muted hover:border-mat-gold'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasAnyData ? (
        <div className="py-16 text-center space-y-2">
          <TrendingUp size={32} className="text-mat-text-dim mx-auto" />
          <p className="text-mat-text-muted text-sm">No training data yet.</p>
          <p className="text-mat-text-dim text-xs">Analytics will populate once you start logging sessions.</p>
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sessions', value: overview.total_sessions, sub: `${overview.total_hours}h total` },
                { label: 'Rounds', value: overview.total_rounds, sub: `${overview.win_rate}% win rate` },
                { label: 'Avg/Week', value: overview.avg_sessions_per_week, sub: 'sessions' },
                { label: 'Avg Performance', value: overview.avg_performance ? `${overview.avg_performance.toFixed(1)}/5` : '—', sub: 'self-rated' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-mat-card border border-mat-border p-4">
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-display text-3xl text-mat-gold">{value}</p>
                  <p className="text-mat-text-dim text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <SectionCard title="Training Frequency" icon={TrendingUp}>
              {trendsLoading ? <div className="flex items-center justify-center h-40"><Loader2 size={18} className="animate-spin text-mat-gold" /></div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trends?.weekly_trend || []} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} />
                    <XAxis dataKey="week" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sessions" fill={CHART_COLORS.gold} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Session Types">
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                      {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10, color: CHART_COLORS.text }} />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-mat-text-dim text-sm text-center py-12">No data for this period.</p>}
            </SectionCard>

            <SectionCard title="Sparring Win Rate" icon={Swords}>
              {sparringLoading ? <div className="flex items-center justify-center h-40"><Loader2 size={18} className="animate-spin text-mat-gold" /></div>
                : sparring?.monthly_trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sparring.monthly_trend} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} />
                      <XAxis dataKey="month" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} />
                      <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="win_rate" stroke={CHART_COLORS.gold} strokeWidth={2} dot={{ fill: CHART_COLORS.gold, r: 3 }} name="Win %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-mat-text-dim text-sm text-center py-12">Log sparring rounds to see your trend.</p>}
            </SectionCard>

            <SectionCard title="Technique Position Coverage" icon={Target}>
              {positionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={positionData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} horizontal={false} />
                    <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 9 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill={CHART_COLORS.blue} radius={[0, 2, 2, 0]} name="Techniques" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-mat-text-dim text-sm text-center py-12">Add techniques to see coverage.</p>}
            </SectionCard>
          </div>

          {sparring?.top_submissions_conceded?.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <SectionCard title="Most Conceded Submissions">
                <div className="space-y-2">
                  {sparring.top_submissions_conceded.map(([sub, count]: [string, number], i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-mat-text text-sm">{sub}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-mat-red-light" style={{ width: `${(count / sparring.top_submissions_conceded[0][1]) * 80}px` }} />
                        <span className="text-mat-text-muted text-xs w-4 text-right">{count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Most Attempted Submissions">
                <div className="space-y-2">
                  {(sparring.top_submissions_attempted || []).map(([sub, count]: [string, number], i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-mat-text text-sm">{sub}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-mat-gold" style={{ width: `${(count / (sparring.top_submissions_attempted[0]?.[1] || 1)) * 80}px` }} />
                        <span className="text-mat-text-muted text-xs w-4 text-right">{count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {insights && (
            <div className="bg-mat-card border border-mat-border">
              <div className="px-6 py-4 border-b border-mat-border flex items-center gap-2">
                <Lightbulb size={15} className="text-mat-gold" />
                <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Training Insights</h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  ...(insights.warnings || []).map((i: any) => ({ ...i, _kind: 'warning' })),
                  ...(insights.highlights || []).map((i: any) => ({ ...i, _kind: 'highlight' })),
                  ...(insights.insights || []).map((i: any) => ({ ...i, _kind: 'insight' })),
                ].map((insight: any, idx: number) => (
                  <div key={idx} className="border border-mat-border p-4 gold-bar">
                    <div className="flex items-start gap-3">
                      {insight._kind === 'warning' && <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />}
                      {insight._kind === 'highlight' && <CheckCircle2 size={14} className="text-mat-green-light mt-0.5 shrink-0" />}
                      {insight._kind === 'insight' && <Lightbulb size={14} className="text-mat-gold mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-mat-text font-semibold text-sm">{insight.title}</p>
                        <p className="text-mat-text-muted text-xs mt-1 leading-relaxed">{insight.detail}</p>
                        {insight.action && <p className="text-mat-gold text-xs mt-2">→ {insight.action}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {(!insights.warnings?.length && !insights.highlights?.length && !insights.insights?.length) && (
                  <p className="text-mat-text-dim text-sm text-center py-6">Log more training data to generate insights.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Sparring Log tab (read-only) ─────────────────────────────────────────────

function SparringLogRow({ round: r }: { round: SparringRound }) {
  const [expanded, setExpanded] = useState(false)
  const hasPositions = r.dominant_positions.length > 0 || r.positions_conceded.length > 0
  const hasSubs = r.submissions_attempted.length > 0 || r.submissions_conceded.length > 0
  const hasCounts = r.sweeps_completed > 0 || r.takedowns_completed > 0

  return (
    <div>
      <div
        className="px-5 py-3 flex items-center justify-between hover:bg-mat-darker transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-bold uppercase ${OUTCOME_COLORS[r.outcome]}`}>{r.outcome}</span>
            <span className="text-mat-text font-medium text-sm">{r.partner_name}</span>
            <span className="text-mat-text-muted text-xs capitalize">{r.partner_belt}</span>
            <span className="text-mat-text-dim text-xs">{r.duration_minutes}min</span>
            <span className="text-mat-text-dim text-xs">{r.is_gi ? 'Gi' : 'No-Gi'}</span>
          </div>
          <p className="text-mat-text-muted text-xs mt-0.5">{formatDate(r.date)}</p>
        </div>
        <ChevronDown size={13} className={`text-mat-text-dim transition-transform duration-200 ml-3 shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-1 bg-mat-darker border-t border-mat-border space-y-2">
          {hasPositions && (
            <div className="grid grid-cols-2 gap-3">
              {r.dominant_positions.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Positions Held</p>
                  <div className="flex flex-wrap gap-1">
                    {r.dominant_positions.map(p => <span key={p} className="text-xs bg-mat-panel border border-mat-green-light/30 text-mat-green-light px-2 py-0.5 capitalize">{p.replace(/_/g, ' ')}</span>)}
                  </div>
                </div>
              )}
              {r.positions_conceded.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Positions Conceded</p>
                  <div className="flex flex-wrap gap-1">
                    {r.positions_conceded.map(p => <span key={p} className="text-xs bg-mat-panel border border-mat-red-light/30 text-mat-red-light px-2 py-0.5 capitalize">{p.replace(/_/g, ' ')}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {hasSubs && (
            <div className="grid grid-cols-2 gap-3">
              {r.submissions_attempted.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Submissions Attempted</p>
                  <div className="flex flex-wrap gap-1">
                    {r.submissions_attempted.map(s => <span key={s} className="text-xs bg-mat-panel border border-mat-green-light/30 text-mat-green-light px-2 py-0.5">{s}</span>)}
                  </div>
                </div>
              )}
              {r.submissions_conceded.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Tapped To</p>
                  <div className="flex flex-wrap gap-1">
                    {r.submissions_conceded.map(s => <span key={s} className="text-xs bg-mat-panel border border-mat-red-light/30 text-mat-red-light px-2 py-0.5">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {hasCounts && (
            <div className="flex gap-4">
              {r.sweeps_completed > 0 && <span className="text-xs text-mat-text-muted"><span className="text-mat-gold font-bold">{r.sweeps_completed}</span> sweep{r.sweeps_completed !== 1 ? 's' : ''}</span>}
              {r.takedowns_completed > 0 && <span className="text-xs text-mat-text-muted"><span className="text-mat-gold font-bold">{r.takedowns_completed}</span> takedown{r.takedowns_completed !== 1 ? 's' : ''}</span>}
            </div>
          )}
          {r.notes && <p className="text-mat-text-dim text-xs italic leading-relaxed">{r.notes}</p>}
          {!hasPositions && !hasSubs && !hasCounts && !r.notes && <p className="text-mat-text-dim text-xs">No additional details recorded.</p>}
        </div>
      )}
    </div>
  )
}

function SparringLogTab() {
  const { data, isLoading } = useQuery({ queryKey: ['sparring'], queryFn: () => sparringApi.list({ page_size: 200 }).then(r => r.data) })
  const { data: stats } = useQuery({ queryKey: ['sparring', 'stats'], queryFn: () => sparringApi.stats().then(r => r.data) })
  const rounds: SparringRound[] = data?.results || (Array.isArray(data) ? data : [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Roll History</p>
        <p className="text-mat-text-dim text-xs">Log rounds from within a session</p>
      </div>

      {stats && stats.total_rounds > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Rounds', value: stats.total_rounds },
            { label: 'Win Rate', value: `${stats.win_rate}%`, color: stats.win_rate >= 50 ? 'text-mat-green-light' : 'text-mat-red-light' },
            { label: 'Wins', value: stats.wins, color: 'text-mat-green-light' },
            { label: 'Losses', value: stats.losses, color: 'text-mat-red-light' },
          ].map(({ label, value, color = 'text-mat-gold' }) => (
            <div key={label} className="bg-mat-card border border-mat-border p-4 text-center">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-display text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-mat-card border border-mat-border">
        <div className="px-5 py-4 border-b border-mat-border">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Round History</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-mat-gold" /></div>
        ) : rounds.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Swords size={28} className="text-mat-text-dim mx-auto" />
            <p className="text-mat-text-muted text-sm">No sparring rounds logged yet.</p>
            <p className="text-mat-text-dim text-xs">Add rounds from a session's detail page.</p>
          </div>
        ) : (
          <div className="divide-y divide-mat-border">
            {rounds.map(r => <SparringLogRow key={r.id} round={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'sparring', label: 'Sparring Log' },
]

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState(TABS.some(t => t.value === initialTab) ? initialTab! : 'analytics')

  return (
    <div className="space-y-5 animate-fade-in" data-tutorial="nav-analytics">
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Performance Data</p>
        <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Analytics</h1>
      </div>

      <div className="flex border-b border-mat-border">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px',
              tab === t.value ? 'text-mat-gold border-mat-gold' : 'text-mat-text-muted border-transparent hover:text-mat-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'sparring' && <SparringLogTab />}
    </div>
  )
}
