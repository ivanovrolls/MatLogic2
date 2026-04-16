'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Loader2, TrendingUp, Swords, Target, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react'

const PERIODS = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
]

const CHART_COLORS = {
  gold: '#c9a227',
  red: '#8b1a1a',
  green: '#2d8a2d',
  blue: '#2d5a9e',
  muted: '#333333',
  text: '#7a7a7a',
}

const PIE_COLORS = ['#c9a227', '#8b1a1a', '#2d5a9e', '#2d8a2d', '#a855f7', '#f97316', '#06b6d4', '#ec4899']

function SectionCard({ title, children, icon: Icon }: {
  title: string
  children: React.ReactNode
  icon?: React.ElementType
}) {
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mat-panel border border-mat-border px-3 py-2 text-xs">
      <p className="text-mat-text-muted mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('90d')

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => analyticsApi.overview(period).then(r => r.data),
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends', period],
    queryFn: () => analyticsApi.trainingTrends(period).then(r => r.data),
  })

  const { data: sparring, isLoading: sparringLoading } = useQuery({
    queryKey: ['analytics', 'sparring', period],
    queryFn: () => analyticsApi.sparringStats(period).then(r => r.data),
  })

  const { data: techAnalysis } = useQuery({
    queryKey: ['analytics', 'techniques', period],
    queryFn: () => analyticsApi.techniqueAnalysis(period).then(r => r.data),
  })

  const { data: insights } = useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: () => analyticsApi.insights().then(r => r.data),
  })

  // Pie data for session types
  const typeData = Object.entries(trends?.session_type_breakdown || {}).map(([k, v]) => ({
    name: k.replace('_', ' ').toUpperCase(), value: v as number
  }))

  // Position data
  const positionData = Object.entries(techAnalysis?.position_coverage || {})
    .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Performance Data</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Analytics</h1>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                period === p.value
                  ? 'bg-mat-gold text-mat-black font-bold'
                  : 'bg-mat-card border border-mat-border text-mat-text-muted hover:border-mat-gold'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
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
        {/* Training Trend */}
        <SectionCard title="Training Frequency" icon={TrendingUp}>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={18} className="animate-spin text-mat-gold" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trends?.weekly_trend || []} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} />
                <XAxis dataKey="week" tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sessions" fill={CHART_COLORS.gold} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Session Types */}
        <SectionCard title="Session Types">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: 10, color: CHART_COLORS.text }}
                />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-mat-text-dim text-sm text-center py-12">No data for this period.</p>
          )}
        </SectionCard>

        {/* Sparring Win Rate Trend */}
        <SectionCard title="Sparring Win Rate Trend" icon={Swords}>
          {sparringLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={18} className="animate-spin text-mat-gold" />
            </div>
          ) : sparring?.monthly_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sparring.monthly_trend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} />
                <XAxis dataKey="month" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} />
                <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="win_rate" stroke={CHART_COLORS.gold}
                  strokeWidth={2} dot={{ fill: CHART_COLORS.gold, r: 3 }}
                  name="Win %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-mat-text-dim text-sm text-center py-12">No sparring data for this period.</p>
          )}
        </SectionCard>

        {/* Position Coverage */}
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
          ) : (
            <p className="text-mat-text-dim text-sm text-center py-12">Add techniques to see coverage.</p>
          )}
        </SectionCard>
      </div>

      {/* Submissions */}
      {sparring && sparring.top_submissions_conceded?.length > 0 && (
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

      {/* Insights */}
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
                    {insight.action && (
                      <p className="text-mat-gold text-xs mt-2">→ {insight.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!insights.warnings?.length && !insights.highlights?.length && !insights.insights?.length) && (
              <p className="text-mat-text-dim text-sm text-center py-6">
                Log more training data to generate insights.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
