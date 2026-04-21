'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, templatesApi, sparringApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, getRatingColor, OUTCOME_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, ChevronRight, Loader2, BookTemplate, ChevronDown, Swords, X, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import type { TrainingSession, SessionTemplate, SparringRound } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Sessions tab helpers ─────────────────────────────────────────────────────

const SESSION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'drilling', label: 'Drilling' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'fundamentals', label: 'Fundamentals' },
]

function RatingDots({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-2 h-2 ${i <= rating ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
      ))}
    </div>
  )
}

function SessionsTab() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then(r => r.data?.results || r.data),
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted.')
    },
  })

  const templates: SessionTemplate[] = Array.isArray(templatesData) ? templatesData : []

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', page, typeFilter, search],
    queryFn: () => sessionsApi.list({
      page,
      session_type: typeFilter || undefined,
      search: search || undefined,
    }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted.')
    },
  })

  const sessions: TrainingSession[] = data?.results || []

  return (
    <div className="space-y-5">
      {/* Templates */}
      <div className="bg-mat-card border border-mat-border">
        <button
          onClick={() => setTemplatesOpen(o => !o)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-mat-darker transition-colors group"
        >
          <div className="flex items-center gap-2">
            <BookTemplate size={14} className="text-mat-gold" />
            <span className="text-mat-text-muted text-xs uppercase tracking-widest">Session Templates</span>
            {templates.length > 0 && (
              <span className="text-mat-text-dim text-xs">({templates.length})</span>
            )}
          </div>
          <ChevronDown size={13} className={cn('text-mat-text-dim group-hover:text-mat-gold transition-transform', templatesOpen ? 'rotate-180' : '')} />
        </button>
        {templatesOpen && (
          <div className="border-t border-mat-border">
            {templates.length === 0 ? (
              <div className="px-5 py-6 text-center text-mat-text-dim text-sm">
                No templates yet.{' '}
                <Link href="/sessions/new" className="text-mat-gold hover:underline">Log a session</Link>
                {' '}and save it as a template.
              </div>
            ) : (
              <div className="divide-y divide-mat-border">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="px-5 py-3 flex items-center justify-between group hover:bg-mat-darker transition-colors">
                    <div>
                      <p className="text-mat-text text-sm font-medium">{tmpl.title}</p>
                      <p className="text-mat-text-muted text-xs mt-0.5">
                        <span className={SESSION_TYPE_COLORS[tmpl.session_type]}>{tmpl.session_type_display}</span>
                        {' · '}{tmpl.duration}min
                        {tmpl.techniques.length > 0 && ` · ${tmpl.techniques.length} technique${tmpl.techniques.length !== 1 ? 's' : ''}`}
                        {tmpl.instructor && ` · ${tmpl.instructor}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sessions/new?template=${tmpl.id}`}
                        className="btn-secondary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Use
                      </Link>
                      <button
                        onClick={() => { if (confirm('Delete this template?')) deleteTemplateMutation.mutate(tmpl.id) }}
                        className="text-mat-text-dim hover:text-mat-red-light opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mat-text-dim" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search sessions..."
            className="mat-input pl-8"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="mat-input w-auto"
        >
          {SESSION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-mat-card border border-mat-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-mat-gold" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-mat-text-dim text-sm">
            No sessions found.{' '}
            <Link href="/sessions/new" className="text-mat-gold hover:underline">Log your first session.</Link>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 border-b border-mat-border text-mat-text-dim text-xs uppercase tracking-widest">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-1">Duration</div>
              <div className="col-span-1">Rounds</div>
              <div className="col-span-2">Rating</div>
              <div className="col-span-1"></div>
            </div>
            {sessions.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-mat-border last:border-0 hover:bg-mat-darker transition-colors group">
                <div className="col-span-12 md:col-span-2 text-mat-text-muted text-sm">
                  {formatDate(s.date, 'MMM d, yy')}
                </div>
                <div className="col-span-6 md:col-span-2">
                  <span className={`text-xs font-bold uppercase ${SESSION_TYPE_COLORS[s.session_type] || ''}`}>
                    {s.session_type_display}
                  </span>
                </div>
                <div className="col-span-12 md:col-span-3 text-mat-text text-sm truncate">
                  {s.title || <span className="text-mat-text-dim italic">No title</span>}
                </div>
                <div className="col-span-4 md:col-span-1 text-mat-text-muted text-sm">
                  {formatDuration(s.duration)}
                </div>
                <div className="col-span-4 md:col-span-1 text-mat-text-muted text-sm">
                  {s.round_count > 0 ? s.round_count : '—'}
                </div>
                <div className="col-span-4 md:col-span-2">
                  <RatingDots rating={s.performance_rating} />
                </div>
                <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => { if (confirm('Delete this session?')) deleteMutation.mutate(s.id) }}
                    className="text-mat-text-dim hover:text-mat-red-light transition-colors opacity-0 group-hover:opacity-100 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                  <Link href={`/sessions/${s.id}`} className="text-mat-text-dim hover:text-mat-gold transition-colors p-1">
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-mat-text-muted text-xs">{data.count} total sessions</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data.previous}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data.next}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sparring tab ─────────────────────────────────────────────────────────────

const POSITIONS = [
  'mount', 'back', 'side_control', 'knee_on_belly', 'closed_guard',
  'half_guard', 'open_guard', 'turtle', 'standing', 'north_south', 'leg_entanglement'
]

const sparringSchema = z.object({
  date: z.string(),
  partner_name: z.string().min(1, 'Partner name required'),
  partner_belt: z.enum(['white', 'blue', 'purple', 'brown', 'black', 'unknown']),
  duration_minutes: z.coerce.number().min(1).max(60),
  outcome: z.enum(['win', 'loss', 'draw']),
  is_gi: z.preprocess(val => val === 'true' ? true : val === 'false' ? false : val, z.boolean()),
  notes: z.string().optional(),
})
type SparringFormData = z.infer<typeof sparringSchema>

function MultiPicker({ label, options, selected, onChange }: {
  label: string
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [custom, setCustom] = useState('')
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  const addCustom = () => {
    const v = custom.trim()
    if (v && !selected.includes(v)) { onChange([...selected, v]) }
    setCustom('')
  }

  return (
    <div>
      <label className="mat-label">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'text-xs px-2.5 py-1 border transition-all capitalize',
              selected.includes(opt)
                ? 'bg-mat-gold/20 border-mat-gold text-mat-gold'
                : 'border-mat-border text-mat-text-dim hover:border-mat-muted'
            )}
          >
            {opt.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          className="mat-input text-xs flex-1"
          placeholder="Custom (e.g. Rear Naked Choke)..."
        />
        <button type="button" onClick={addCustom} className="btn-secondary px-2.5 py-1.5">
          <Plus size={12} />
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(v => (
            <span key={v} className="flex items-center gap-1 text-xs bg-mat-panel border border-mat-gold/30 text-mat-gold px-2 py-0.5">
              {v}
              <button type="button" onClick={() => toggle(v)}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function RoundRow({ round: r, onEdit, onDelete }: {
  round: SparringRound
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const hasPositions = r.dominant_positions.length > 0 || r.positions_conceded.length > 0
  const hasSubs = r.submissions_attempted.length > 0 || r.submissions_conceded.length > 0
  const hasCounts = r.sweeps_completed > 0 || r.takedowns_completed > 0

  return (
    <div>
      <div
        className="px-5 py-3 flex items-center justify-between group hover:bg-mat-darker transition-colors cursor-pointer"
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
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <ChevronDown
            size={13}
            className={`text-mat-text-dim transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="text-mat-text-dim hover:text-mat-gold opacity-0 group-hover:opacity-100 transition-all p-1"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="text-mat-text-dim hover:text-mat-red-light opacity-0 group-hover:opacity-100 transition-all p-1"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-1 bg-mat-darker border-t border-mat-border space-y-2">
          {hasPositions && (
            <div className="grid grid-cols-2 gap-3">
              {r.dominant_positions.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Positions Held</p>
                  <div className="flex flex-wrap gap-1">
                    {r.dominant_positions.map(p => (
                      <span key={p} className="text-xs bg-mat-panel border border-mat-green-light/30 text-mat-green-light px-2 py-0.5 capitalize">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {r.positions_conceded.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Positions Conceded</p>
                  <div className="flex flex-wrap gap-1">
                    {r.positions_conceded.map(p => (
                      <span key={p} className="text-xs bg-mat-panel border border-mat-red-light/30 text-mat-red-light px-2 py-0.5 capitalize">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
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
                    {r.submissions_attempted.map(s => (
                      <span key={s} className="text-xs bg-mat-panel border border-mat-green-light/30 text-mat-green-light px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {r.submissions_conceded.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Tapped To</p>
                  <div className="flex flex-wrap gap-1">
                    {r.submissions_conceded.map(s => (
                      <span key={s} className="text-xs bg-mat-panel border border-mat-red-light/30 text-mat-red-light px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {hasCounts && (
            <div className="flex gap-4">
              {r.sweeps_completed > 0 && (
                <span className="text-xs text-mat-text-muted">
                  <span className="text-mat-gold font-bold">{r.sweeps_completed}</span> sweep{r.sweeps_completed !== 1 ? 's' : ''}
                </span>
              )}
              {r.takedowns_completed > 0 && (
                <span className="text-xs text-mat-text-muted">
                  <span className="text-mat-gold font-bold">{r.takedowns_completed}</span> takedown{r.takedowns_completed !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          {r.notes && (
            <p className="text-mat-text-dim text-xs italic leading-relaxed">{r.notes}</p>
          )}
          {!hasPositions && !hasSubs && !hasCounts && !r.notes && (
            <p className="text-mat-text-dim text-xs">No additional details recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}

function SparringTab({ sessionId }: { sessionId: string | null }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(!!sessionId)
  const [editingRound, setEditingRound] = useState<SparringRound | null>(null)
  const [dominant, setDominant] = useState<string[]>([])
  const [conceded, setConceded] = useState<string[]>([])
  const [subAttempted, setSubAttempted] = useState<string[]>([])
  const [subConceded, setSubConceded] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sparring'],
    queryFn: () => sparringApi.list({ page_size: 50 }).then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['sparring', 'stats'],
    queryFn: () => sparringApi.stats().then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SparringFormData>({
    resolver: zodResolver(sparringSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      partner_belt: 'unknown',
      outcome: 'draw',
      duration_minutes: 5,
      is_gi: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: object) =>
      editingRound ? sparringApi.update(editingRound.id, data) : sparringApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparring'] })
      toast.success(editingRound ? 'Round updated.' : 'Round logged.')
      reset()
      setDominant([]); setConceded([]); setSubAttempted([]); setSubConceded([])
      setShowForm(false)
      setEditingRound(null)
      if (sessionId && !editingRound) router.push(`/sessions/${sessionId}`)
    },
    onError: () => toast.error(editingRound ? 'Failed to update round.' : 'Failed to log round.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sparringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparring'] })
      toast.success('Round deleted.')
    },
  })

  const startEdit = (round: SparringRound) => {
    setEditingRound(round)
    setDominant(round.dominant_positions)
    setConceded(round.positions_conceded)
    setSubAttempted(round.submissions_attempted)
    setSubConceded(round.submissions_conceded)
    reset({
      date: round.date,
      partner_name: round.partner_name,
      partner_belt: round.partner_belt,
      duration_minutes: round.duration_minutes,
      outcome: round.outcome,
      is_gi: String(round.is_gi) as any,
      notes: round.notes,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingRound(null)
    reset()
    setDominant([]); setConceded([]); setSubAttempted([]); setSubConceded([])
  }

  const onSubmit = (data: SparringFormData) => {
    mutation.mutate({
      ...data,
      dominant_positions: dominant,
      positions_conceded: conceded,
      submissions_attempted: subAttempted,
      submissions_conceded: subConceded,
      ...(sessionId && !editingRound ? { session: Number(sessionId) } : {}),
    })
  }

  const rounds: SparringRound[] = data?.results || (Array.isArray(data) ? data : [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Roll Tracker</p>
        <button
          onClick={() => showForm ? cancelForm() : setShowForm(true)}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> {showForm ? 'Cancel' : 'Log Round'}
        </button>
      </div>

      {/* Stats bar */}
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

      {/* Log Round Form */}
      {showForm && (
        <div className="bg-mat-card border border-mat-border p-6 space-y-5 animate-slide-up">
          <h3 className="font-display text-xl tracking-wider text-mat-text uppercase flex items-center gap-2">
            <Swords size={16} className="text-mat-red-light" />
            {editingRound ? 'Edit Sparring Round' : 'Log Sparring Round'}
          </h3>
          {sessionId && !editingRound && (
            <p className="text-mat-gold text-xs">This round will be linked to your session.</p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="mat-label">Date</label>
                <input {...register('date')} type="date" className="mat-input" />
              </div>
              <div>
                <label className="mat-label">Partner Name</label>
                <input {...register('partner_name')} className="mat-input" placeholder="Training partner" />
                {errors.partner_name && <p className="text-mat-red-light text-xs mt-1">{errors.partner_name.message}</p>}
              </div>
              <div>
                <label className="mat-label">Partner Belt</label>
                <select {...register('partner_belt')} className="mat-input">
                  {['unknown','white','blue','purple','brown','black'].map(b => (
                    <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mat-label">Duration (min)</label>
                <input {...register('duration_minutes')} type="number" min="1" max="60" className="mat-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mat-label">Outcome</label>
                <div className="flex gap-2">
                  {(['win', 'loss', 'draw'] as const).map(o => (
                    <label key={o} className="flex items-center gap-1.5 cursor-pointer">
                      <input {...register('outcome')} type="radio" value={o} className="accent-mat-gold" />
                      <span className={`text-xs font-bold uppercase ${OUTCOME_COLORS[o]}`}>{o}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mat-label">Format</label>
                <div className="flex gap-3">
                  {[{v: true, l: 'Gi'}, {v: false, l: 'No-Gi'}].map(({v, l}) => (
                    <label key={l} className="flex items-center gap-1.5 cursor-pointer">
                      <input {...register('is_gi')} type="radio" value={v.toString()} className="accent-mat-gold" />
                      <span className="text-mat-text-muted text-xs">{l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <MultiPicker label="Dominant Positions (I had)" options={POSITIONS} selected={dominant} onChange={setDominant} />
              <MultiPicker label="Positions Conceded (They had)" options={POSITIONS} selected={conceded} onChange={setConceded} />
              <MultiPicker
                label="Submissions Attempted"
                options={['Triangle', 'Armbar', 'Rear Naked Choke', 'Guillotine', 'Kimura', 'Omoplata', 'Leg Lock', "D'Arce", 'Bow and Arrow']}
                selected={subAttempted}
                onChange={setSubAttempted}
              />
              <MultiPicker
                label="Submissions Conceded"
                options={['Triangle', 'Armbar', 'Rear Naked Choke', 'Guillotine', 'Kimura', 'Omoplata', 'Leg Lock', "D'Arce", 'Bow and Arrow']}
                selected={subConceded}
                onChange={setSubConceded}
              />
            </div>

            <div>
              <label className="mat-label">Round Notes</label>
              <textarea {...register('notes')} rows={2} className="mat-input resize-none" placeholder="What happened? What would you do differently?" />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary px-6 py-2.5 flex items-center gap-2"
            >
              {mutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : editingRound ? 'Save Changes' : 'Log Round'}
            </button>
          </form>
        </div>
      )}

      {/* Round list */}
      <div className="bg-mat-card border border-mat-border">
        <div className="px-5 py-4 border-b border-mat-border">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Round History</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-mat-gold" />
          </div>
        ) : rounds.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Swords size={28} className="text-mat-text-dim mx-auto" />
            <p className="text-mat-text-muted text-sm">No rounds logged yet.</p>
            <p className="text-mat-text-dim text-xs">Track your first roll to start building your sparring record.</p>
          </div>
        ) : (
          <div className="divide-y divide-mat-border">
            {rounds.map(r => (
              <RoundRow
                key={r.id}
                round={r}
                onEdit={() => startEdit(r)}
                onDelete={() => { if (confirm('Delete round?')) deleteMutation.mutate(r.id) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'sessions', label: 'Sessions' },
  { value: 'sparring', label: 'Sparring', tutorialId: 'tab-sparring' },
]

export default function SessionsPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const sessionId = searchParams.get('session')

  const [tab, setTab] = useState(
    TABS.some(t => t.value === initialTab) ? initialTab! : 'sessions'
  )

  // If there's a session query param, switch to sparring tab
  useEffect(() => {
    if (sessionId) setTab('sparring')
  }, [sessionId])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Your Training Log</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Sessions</h1>
        </div>
        {tab === 'sessions' && (
          <Link href="/sessions/new" className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs">
            <Plus size={14} /> Log Session
          </Link>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-mat-border">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            data-tutorial={t.tutorialId}
            className={cn(
              'px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px',
              tab === t.value
                ? 'text-mat-gold border-mat-gold'
                : 'text-mat-text-muted border-transparent hover:text-mat-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions' && <SessionsTab />}
      {tab === 'sparring' && <SparringTab sessionId={sessionId} />}
    </div>
  )
}
