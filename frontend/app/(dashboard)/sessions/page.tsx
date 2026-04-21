'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, templatesApi, injuriesApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, ChevronRight, Loader2, BookTemplate, ChevronDown, HeartPulse, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import type { TrainingSession, SessionTemplate, InjuryLog } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Sessions tab ─────────────────────────────────────────────────────────────

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
    queryFn: () => sessionsApi.list({ page, session_type: typeFilter || undefined, search: search || undefined }).then(r => r.data),
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
            {templates.length > 0 && <span className="text-mat-text-dim text-xs">({templates.length})</span>}
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
                      <Link href={`/sessions/new?template=${tmpl.id}`} className="btn-secondary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Use</Link>
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
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="mat-input w-auto">
          {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-mat-card border border-mat-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-mat-text-dim text-sm">
            No sessions found.{' '}<Link href="/sessions/new" className="text-mat-gold hover:underline">Log your first session.</Link>
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
            {sessions.map(s => (
              <div key={s.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-mat-border last:border-0 hover:bg-mat-darker transition-colors group">
                <div className="col-span-12 md:col-span-2 text-mat-text-muted text-sm">{formatDate(s.date, 'MMM d, yy')}</div>
                <div className="col-span-6 md:col-span-2">
                  <span className={`text-xs font-bold uppercase ${SESSION_TYPE_COLORS[s.session_type] || ''}`}>{s.session_type_display}</span>
                </div>
                <div className="col-span-12 md:col-span-3 text-mat-text text-sm truncate">
                  {s.title || <span className="text-mat-text-dim italic">No title</span>}
                </div>
                <div className="col-span-4 md:col-span-1 text-mat-text-muted text-sm">{formatDuration(s.duration)}</div>
                <div className="col-span-4 md:col-span-1 text-mat-text-muted text-sm">{s.round_count > 0 ? s.round_count : '—'}</div>
                <div className="col-span-4 md:col-span-2"><RatingDots rating={s.performance_rating} /></div>
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

      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-mat-text-muted text-xs">{data.count} total sessions</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!data.previous} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={!data.next} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Injuries tab ─────────────────────────────────────────────────────────────

const BODY_PARTS = ['neck', 'shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle', 'rib', 'finger', 'head', 'other']
const SEVERITY_COLORS: Record<string, string> = {
  mild: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  moderate: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  severe: 'text-mat-red-light border-mat-red/30 bg-mat-red/5',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'text-mat-red-light',
  recovering: 'text-yellow-400',
  resolved: 'text-mat-green-light',
}

function InjuryForm({ initial, onSave, onCancel, isPending }: {
  initial?: Partial<InjuryLog>
  onSave: (data: object) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [bodyPart, setBodyPart] = useState(initial?.body_part || '')
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>(initial?.severity || 'mild')
  const [status, setStatus] = useState<'active' | 'recovering' | 'resolved'>(initial?.status || 'active')
  const [dateOccurred, setDateOccurred] = useState(initial?.date_occurred || format(new Date(), 'yyyy-MM-dd'))
  const [dateResolved, setDateResolved] = useState(initial?.date_resolved || '')
  const [affectedTraining, setAffectedTraining] = useState(initial?.affected_training ?? true)
  const [notes, setNotes] = useState(initial?.notes || '')

  const submit = () => {
    if (!bodyPart) { toast.error('Select a body part.'); return }
    onSave({ body_part: bodyPart, severity, status, date_occurred: dateOccurred, date_resolved: dateResolved || null, affected_training: affectedTraining, notes })
  }

  return (
    <div className="bg-mat-card border border-mat-border p-6 space-y-4 animate-slide-up">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="mat-label">Body Part</label>
          <select value={bodyPart} onChange={e => setBodyPart(e.target.value)} className="mat-input">
            <option value="">Select...</option>
            {BODY_PARTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="mat-label">Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="mat-input">
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className="mat-label">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="mat-input">
            <option value="active">Active</option>
            <option value="recovering">Recovering</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="mat-label">Date Occurred</label>
          <input type="date" value={dateOccurred} onChange={e => setDateOccurred(e.target.value)} className="mat-input" />
        </div>
        <div>
          <label className="mat-label">Date Resolved</label>
          <input type="date" value={dateResolved} onChange={e => setDateResolved(e.target.value)} className="mat-input" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={affectedTraining} onChange={e => setAffectedTraining(e.target.checked)} className="accent-mat-gold w-4 h-4" />
            <span className="text-mat-text-muted text-xs uppercase tracking-wider">Affected Training</span>
          </label>
        </div>
      </div>
      <div>
        <label className="mat-label">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mat-input resize-none" placeholder="How did it happen? What aggravates it?" />
      </div>
      <div className="flex gap-3">
        <button onClick={submit} disabled={isPending} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          {isPending ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : initial?.id ? 'Save Changes' : 'Log Injury'}
        </button>
        <button onClick={onCancel} className="btn-secondary px-5 py-2.5">Cancel</button>
      </div>
    </div>
  )
}

function InjuryCard({ injury, onEdit, onDelete }: { injury: InjuryLog; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={cn('border p-5 flex items-start justify-between gap-4 bg-mat-card border-mat-border', injury.status === 'resolved' && 'opacity-70')}>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-display text-lg tracking-wider text-mat-text uppercase">{injury.body_part_display}</span>
          <span className={cn('text-xs font-bold uppercase px-2 py-0.5 border', SEVERITY_COLORS[injury.severity])}>{injury.severity_display}</span>
          <span className={cn('text-xs font-bold uppercase', STATUS_COLORS[injury.status])}>{injury.status_display}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-mat-text-muted">
          <span>Occurred: {formatDate(injury.date_occurred, 'MMM d, yyyy')}</span>
          {injury.date_resolved && <span>Resolved: {formatDate(injury.date_resolved, 'MMM d, yyyy')}</span>}
          {injury.affected_training && <span className="text-yellow-400">Affected training</span>}
        </div>
        {injury.notes && <p className="text-mat-text-muted text-sm leading-relaxed">{injury.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="text-mat-text-dim hover:text-mat-gold p-1.5 transition-colors"><Pencil size={13} /></button>
        <button onClick={onDelete} className="text-mat-text-dim hover:text-mat-red-light p-1.5 transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

function InjuriesTab() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['injuries'], queryFn: () => injuriesApi.list().then(r => r.data?.results || r.data) })
  const createMutation = useMutation({
    mutationFn: (d: object) => injuriesApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['injuries'] }); toast.success('Injury logged.'); setShowForm(false) },
    onError: () => toast.error('Failed to log injury.'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => injuriesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['injuries'] }); toast.success('Injury updated.'); setEditingId(null) },
    onError: () => toast.error('Failed to update.'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => injuriesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['injuries'] }); toast.success('Injury removed.') },
  })

  const injuries: InjuryLog[] = Array.isArray(data) ? data : []
  const active = injuries.filter(i => i.status !== 'resolved')
  const resolved = injuries.filter(i => i.status === 'resolved')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Health Tracker</p>
        <button
          onClick={() => { setShowForm(v => !v); setEditingId(null) }}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> {showForm ? 'Cancel' : 'Log Injury'}
        </button>
      </div>

      {injuries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active', value: injuries.filter(i => i.status === 'active').length, color: 'text-mat-red-light' },
            { label: 'Recovering', value: injuries.filter(i => i.status === 'recovering').length, color: 'text-yellow-400' },
            { label: 'Resolved', value: resolved.length, color: 'text-mat-green-light' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-mat-card border border-mat-border p-4 text-center">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-display text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && <InjuryForm onSave={d => createMutation.mutate(d)} onCancel={() => setShowForm(false)} isPending={createMutation.isPending} />}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
      ) : injuries.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <HeartPulse size={32} className="text-mat-text-dim mx-auto" />
          <p className="text-mat-text-muted text-sm">No injuries logged.</p>
          <p className="text-mat-text-dim text-xs">Stay healthy out there — log anything that needs monitoring.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={12} className="text-yellow-400" /> Current
              </p>
              {active.map(injury => editingId === injury.id
                ? <InjuryForm key={injury.id} initial={injury} onSave={d => updateMutation.mutate({ id: injury.id, data: d })} onCancel={() => setEditingId(null)} isPending={updateMutation.isPending} />
                : <InjuryCard key={injury.id} injury={injury} onEdit={() => { setEditingId(injury.id); setShowForm(false) }} onDelete={() => { if (confirm('Delete?')) deleteMutation.mutate(injury.id) }} />
              )}
            </div>
          )}
          {resolved.length > 0 && (
            <div className="space-y-2">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={12} className="text-mat-green-light" /> Resolved
              </p>
              {resolved.map(injury => editingId === injury.id
                ? <InjuryForm key={injury.id} initial={injury} onSave={d => updateMutation.mutate({ id: injury.id, data: d })} onCancel={() => setEditingId(null)} isPending={updateMutation.isPending} />
                : <InjuryCard key={injury.id} injury={injury} onEdit={() => { setEditingId(injury.id); setShowForm(false) }} onDelete={() => { if (confirm('Delete?')) deleteMutation.mutate(injury.id) }} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'sessions', label: 'Sessions' },
  { value: 'injuries', label: 'Injuries' },
]

export default function SessionsPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState(TABS.some(t => t.value === initialTab) ? initialTab! : 'sessions')

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

      {tab === 'sessions' && <SessionsTab />}
      {tab === 'injuries' && <InjuriesTab />}
    </div>
  )
}
