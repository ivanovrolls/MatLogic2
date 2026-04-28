'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, templatesApi, injuriesApi, coachingApi, competitionApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, RESULT_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, ChevronRight, Loader2, BookTemplate, ChevronDown, ChevronUp, HeartPulse, AlertTriangle, CheckCircle2, Pencil, GraduationCap, Trophy, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import type { TrainingSession, SessionTemplate, InjuryLog, InjurySeverity, InjuryStatus, CoachSessionEdit, Competition, CompetitionMatch } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Sessions tab ─────────────────────────────────────────────────────────────

const SESSION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'gi', label: 'Taught Class - Gi' },
  { value: 'nogi', label: 'Taught Class - No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'drilling', label: 'Drilling Only' },
  { value: 'standup_grappling', label: 'Standup Grappling' },
  { value: 'competition', label: 'Competition Class' },
  { value: 'coaching', label: 'Coaching' },
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

  const { data: pendingEdits } = useQuery<CoachSessionEdit[]>({
    queryKey: ['my-session-edits'],
    queryFn: () => coachingApi.getMySessionEdits().then(r => r.data),
  })
  const pendingEditBySession = new Map((pendingEdits ?? []).map(e => [e.session, e]))

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
            {sessions.map(s => {
              const hasPendingEdit = pendingEditBySession.has(s.id)
              return (
                <div
                  key={s.id}
                  className={cn(
                    'grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-mat-border last:border-0 transition-colors group',
                    hasPendingEdit
                      ? 'bg-mat-gold/5 hover:bg-mat-gold/10 shadow-[0_0_12px_rgba(212,175,55,0.12)]'
                      : 'hover:bg-mat-darker'
                  )}
                >
                  <div className="col-span-12 md:col-span-2 text-mat-text-muted text-sm flex items-center gap-1.5">
                    {formatDate(s.date, 'MMM d, yy')}
                    {hasPendingEdit && <span className="w-1.5 h-1.5 rounded-full bg-mat-gold animate-pulse shrink-0" title="Coach edit pending" />}
                  </div>
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
                    {hasPendingEdit && (
                      <Link href={`/sessions/${s.id}`} className="text-mat-gold p-1" title="Coach edit pending — review it">
                        <GraduationCap size={13} />
                      </Link>
                    )}
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
              )
            })}
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
          <select value={severity} onChange={e => setSeverity(e.target.value as InjurySeverity)} className="mat-input">
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className="mat-label">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as InjuryStatus)} className="mat-input">
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

// ─── Competitions tab ─────────────────────────────────────────────────────────

const RESULT_LABELS: Record<string, string> = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', participated: 'Participated', withdrew: 'Withdrew' }
const MATCH_METHODS = ['submission', 'points', 'advantages', 'penalty', 'referee', 'dq', 'walkover']

function MatchRow({ match, onDelete }: { match: CompetitionMatch; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-mat-border last:border-0">
      <span className="text-mat-text-muted text-xs w-8">R{match.round_number}</span>
      <div className="flex-1">
        <span className="text-mat-text text-sm">{match.opponent_name || 'Unknown Opponent'}</span>
        {match.opponent_gym && <span className="text-mat-text-dim text-xs ml-2">{match.opponent_gym}</span>}
      </div>
      <span className={cn('text-xs font-bold uppercase', match.result === 'win' ? 'text-mat-green-light' : 'text-mat-red-light')}>{match.result}</span>
      {match.method && <span className="text-mat-text-muted text-xs capitalize">{match.method}</span>}
      {match.submission_type && <span className="text-mat-gold text-xs">{match.submission_type}</span>}
      <button onClick={onDelete} className="text-mat-text-dim hover:text-mat-red-light text-xs transition-colors">×</button>
    </div>
  )
}

function CompetitionCard({ comp }: { comp: Competition }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [editing, setEditing] = useState(false)
  const queryClient = useQueryClient()
  const [editName, setEditName] = useState(comp.name)
  const [editDate, setEditDate] = useState(comp.date)
  const [editLocation, setEditLocation] = useState(comp.location)
  const [editOrg, setEditOrg] = useState(comp.organization)
  const [editWeight, setEditWeight] = useState(comp.weight_class)
  const [editBelt, setEditBelt] = useState(comp.belt_division)
  const [editGi, setEditGi] = useState(String(comp.is_gi))
  const [editResult, setEditResult] = useState(comp.result || '')
  const [editNotes, setEditNotes] = useState(comp.notes)

  const openEdit = () => {
    setEditName(comp.name); setEditDate(comp.date); setEditLocation(comp.location)
    setEditOrg(comp.organization); setEditWeight(comp.weight_class); setEditBelt(comp.belt_division)
    setEditGi(String(comp.is_gi)); setEditResult(comp.result || ''); setEditNotes(comp.notes)
    setEditing(true); setExpanded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (data: object) => competitionApi.update(comp.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['competitions'] }); toast.success('Competition updated.'); setEditing(false) },
    onError: () => toast.error('Failed to update.'),
  })
  const deleteMutation = useMutation({
    mutationFn: () => competitionApi.delete(comp.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['competitions'] }); toast.success('Competition deleted.') },
  })
  const matchMutation = useMutation({
    mutationFn: (data: object) => competitionApi.createMatch(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['competitions'] }); toast.success('Match logged.'); setShowAddMatch(false) },
  })
  const deleteMatchMutation = useMutation({
    mutationFn: (id: number) => competitionApi.deleteMatch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competitions'] }),
  })

  return (
    <div className="bg-mat-card border border-mat-border">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => !editing && setExpanded(!expanded)}>
          <div>
            <h3 className="font-display text-xl tracking-wider text-mat-text uppercase">{comp.name}</h3>
            <p className="text-mat-text-muted text-xs mt-0.5">
              {formatDate(comp.date)} · {comp.location || 'Unknown Location'}{comp.is_gi ? ' · Gi' : ' · No-Gi'}{comp.weight_class && ` · ${comp.weight_class}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {comp.result && !editing && <span className={cn('font-display text-lg uppercase', RESULT_COLORS[comp.result])}>{RESULT_LABELS[comp.result]}</span>}
          {!editing && (
            <div className="text-mat-text-muted text-xs flex gap-3">
              <span className="text-mat-green-light">{comp.win_count}W</span>
              <span className="text-mat-red-light">{comp.loss_count}L</span>
            </div>
          )}
          <button onClick={e => { e.stopPropagation(); editing ? setEditing(false) : openEdit() }} className="text-mat-text-dim hover:text-mat-gold transition-colors p-1">
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
          <button onClick={e => { e.stopPropagation(); if (confirm('Delete this competition?')) deleteMutation.mutate() }} className="text-mat-text-dim hover:text-mat-red-light transition-colors p-1">
            <Trash2 size={14} />
          </button>
          <button onClick={() => !editing && setExpanded(!expanded)} className="text-mat-text-dim p-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-mat-border p-6 space-y-4 animate-slide-up">
          {editing && (
            <div className="bg-mat-panel border border-mat-gold/30 p-5 space-y-4">
              <p className="text-mat-gold text-xs uppercase tracking-widest">Edit Competition</p>
              <div className="grid md:grid-cols-2 gap-3">
                {([['Name', editName, setEditName, 'text'], ['Date', editDate, setEditDate, 'date'], ['Location', editLocation, setEditLocation, 'text'], ['Organization', editOrg, setEditOrg, 'text'], ['Weight Class', editWeight, setEditWeight, 'text'], ['Belt Division', editBelt, setEditBelt, 'text']] as const).map(([label, val, setter, type]: any) => (
                  <div key={label}><label className="mat-label">{label}</label><input type={type} value={val} onChange={e => setter(e.target.value)} className="mat-input" /></div>
                ))}
                <div><label className="mat-label">Format</label><select value={editGi} onChange={e => setEditGi(e.target.value)} className="mat-input"><option value="true">Gi</option><option value="false">No-Gi</option></select></div>
                <div><label className="mat-label">Result</label><select value={editResult} onChange={e => setEditResult(e.target.value)} className="mat-input"><option value="">— Pending —</option><option value="gold">Gold Medal</option><option value="silver">Silver Medal</option><option value="bronze">Bronze Medal</option><option value="participated">Participated</option><option value="withdrew">Withdrew</option></select></div>
              </div>
              <div><label className="mat-label">Notes</label><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="mat-input resize-none" /></div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ name: editName, date: editDate, location: editLocation, organization: editOrg, weight_class: editWeight, belt_division: editBelt, is_gi: editGi === 'true', result: editResult, notes: editNotes })}
                  disabled={updateMutation.isPending}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  {updateMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-mat-text-muted text-xs uppercase tracking-widest">Matches</h4>
              <button onClick={() => setShowAddMatch(!showAddMatch)} className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"><Plus size={11} /> Add Match</button>
            </div>
            {showAddMatch && (
              <div className="bg-mat-panel border border-mat-border p-4 mb-3 space-y-3 animate-slide-up">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><label className="mat-label">Round #</label><input id={`round_${comp.id}`} type="number" defaultValue={comp.matches.length + 1} min={1} className="mat-input" /></div>
                  <div><label className="mat-label">Opponent</label><input id={`opp_${comp.id}`} className="mat-input" placeholder="Name" /></div>
                  <div><label className="mat-label">Result</label><select id={`result_${comp.id}`} className="mat-input" defaultValue="win"><option value="win">Win</option><option value="loss">Loss</option></select></div>
                  <div><label className="mat-label">Method</label><select id={`method_${comp.id}`} className="mat-input" defaultValue=""><option value="">—</option>{MATCH_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label className="mat-label">Submission</label><input id={`sub_${comp.id}`} className="mat-input" placeholder="e.g. Triangle" /></div>
                  <div><label className="mat-label">Label</label><input id={`label_${comp.id}`} className="mat-input" placeholder="Semi-Final..." /></div>
                </div>
                <button
                  onClick={() => {
                    const g = (id: string) => (document.getElementById(id) as HTMLInputElement).value
                    matchMutation.mutate({ competition: comp.id, round_number: Number(g(`round_${comp.id}`)), opponent_name: g(`opp_${comp.id}`), result: g(`result_${comp.id}`), method: g(`method_${comp.id}`), submission_type: g(`sub_${comp.id}`), round_label: g(`label_${comp.id}`) })
                  }}
                  disabled={matchMutation.isPending}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
                >
                  {matchMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : null} Log Match
                </button>
              </div>
            )}
            {comp.matches.length === 0
              ? <p className="text-mat-text-dim text-sm">No matches logged.</p>
              : <div>{comp.matches.map(m => <MatchRow key={m.id} match={m} onDelete={() => deleteMatchMutation.mutate(m.id)} />)}</div>
            }
          </div>

          {comp.notes && (
            <div><p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Notes</p><p className="text-mat-text-muted text-sm">{comp.notes}</p></div>
          )}
        </div>
      )}
    </div>
  )
}

function CompetitionsTab() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['competitions'], queryFn: () => competitionApi.list().then(r => r.data?.results || r.data) })
  const createMutation = useMutation({
    mutationFn: (data: object) => competitionApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['competitions'] }); toast.success('Competition logged.'); setShowForm(false) },
    onError: () => toast.error('Failed to save.'),
  })

  const competitions: Competition[] = Array.isArray(data) ? data : []
  const totalWins = competitions.reduce((s, c) => s + c.win_count, 0)
  const totalLosses = competitions.reduce((s, c) => s + c.loss_count, 0)
  const gold = competitions.filter(c => c.result === 'gold').length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Competition Record</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs">
          <Plus size={14} /> {showForm ? 'Cancel' : 'Add Competition'}
        </button>
      </div>

      {competitions.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Events', value: competitions.length },
            { label: 'Wins', value: totalWins, color: 'text-mat-green-light' },
            { label: 'Losses', value: totalLosses, color: 'text-mat-red-light' },
            { label: 'Gold Medals', value: gold, color: 'text-mat-gold' },
          ].map(({ label, value, color = 'text-mat-gold' }) => (
            <div key={label} className="bg-mat-card border border-mat-border p-4 text-center">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-display text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-mat-card border border-mat-border p-6 space-y-4 animate-slide-up">
          <h3 className="font-display text-xl tracking-wider text-mat-text uppercase flex items-center gap-2"><Trophy size={15} className="text-mat-gold" />Log Competition</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="mat-label">Competition Name</label><input id="comp_name" className="mat-input" placeholder="e.g. IBJJF Pan Ams 2024" /></div>
            <div><label className="mat-label">Date</label><input id="comp_date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="mat-input" /></div>
            <div><label className="mat-label">Location</label><input id="comp_location" className="mat-input" placeholder="City, Country" /></div>
            <div><label className="mat-label">Organization</label><input id="comp_org" className="mat-input" placeholder="IBJJF, ADCC..." /></div>
            <div><label className="mat-label">Weight Class</label><input id="comp_weight" className="mat-input" placeholder="e.g. Lightweight" /></div>
            <div><label className="mat-label">Belt Division</label><input id="comp_belt" className="mat-input" placeholder="e.g. Blue Belt" /></div>
            <div><label className="mat-label">Format</label><select id="comp_gi" className="mat-input" defaultValue="true"><option value="true">Gi</option><option value="false">No-Gi</option></select></div>
            <div><label className="mat-label">Result</label><select id="comp_result" className="mat-input" defaultValue=""><option value="">— (Pending) —</option><option value="gold">Gold Medal</option><option value="silver">Silver Medal</option><option value="bronze">Bronze Medal</option><option value="participated">Participated</option><option value="withdrew">Withdrew</option></select></div>
          </div>
          <div><label className="mat-label">Notes</label><textarea id="comp_notes" rows={2} className="mat-input resize-none" placeholder="General notes..." /></div>
          <button
            onClick={() => {
              const g = (id: string) => (document.getElementById(id) as HTMLInputElement).value
              createMutation.mutate({ name: g('comp_name'), date: g('comp_date'), location: g('comp_location'), organization: g('comp_org'), weight_class: g('comp_weight'), belt_division: g('comp_belt'), is_gi: g('comp_gi') === 'true', result: g('comp_result'), notes: g('comp_notes') })
            }}
            disabled={createMutation.isPending}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={13} className="animate-spin" />} Log Competition
          </button>
        </div>
      )}

      {isLoading
        ? <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
        : competitions.length === 0 && !showForm
          ? (
            <div className="py-16 text-center space-y-2">
              <Trophy size={32} className="text-mat-text-dim mx-auto" />
              <p className="text-mat-text-muted text-sm">No competitions logged yet.</p>
              <p className="text-mat-text-dim text-xs">Add your first event to start tracking your competitive record.</p>
            </div>
          )
          : <div className="space-y-3">{competitions.map(comp => <CompetitionCard key={comp.id} comp={comp} />)}</div>
      }
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'sessions', label: 'Sessions' },
  { value: 'injuries', label: 'Injuries' },
  { value: 'competitions', label: 'Competitions' },
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
      {tab === 'competitions' && <CompetitionsTab />}
    </div>
  )
}
