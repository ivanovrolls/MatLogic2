'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachingApi } from '@/lib/api'
import { useCoachingStore } from '@/stores/coachingStore'
import { ChevronLeft, Loader2, Plus, X, GraduationCap, BookOpen, Database, ClipboardList, Trash2 } from 'lucide-react'
import { cn, BELT_COLORS, POSITION_LABELS, TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { StudentSummary, TrainingSession, Technique, CoachDrillingPlan, CoachDrill } from '@/lib/types'
import Link from 'next/link'

const POSITIONS = Object.entries(POSITION_LABELS)
const TYPES = Object.entries(TYPE_LABELS)

// ── Assign Technique Modal ─────────────────────────────────────────────────────

function AssignTechniqueModal({
  studentId,
  onClose,
}: {
  studentId: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    position: 'closed_guard',
    technique_type: 'submission',
    description: '',
    notes: '',
    difficulty: 3,
  })

  const mutation = useMutation({
    mutationFn: () => coachingApi.assignTechnique(studentId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-student', studentId, 'techniques'] })
      queryClient.invalidateQueries({ queryKey: ['coaching-students'] })
      toast.success('Technique assigned.')
      onClose()
    },
    onError: () => toast.error('Failed to assign technique.'),
  })

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-md p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">Assign Technique</h2>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mat-label">Technique Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="mat-input"
              placeholder="e.g. Triangle Choke"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mat-label">Position</label>
              <select
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="mat-input"
              >
                {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mat-label">Type</label>
              <select
                value={form.technique_type}
                onChange={e => setForm(f => ({ ...f, technique_type: e.target.value }))}
                className="mat-input"
              >
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mat-label">Difficulty (1–5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, difficulty: n }))}
                  className={cn(
                    'flex-1 py-2 text-sm border transition-colors',
                    form.difficulty === n
                      ? 'border-mat-gold bg-mat-gold/10 text-mat-gold'
                      : 'border-mat-border text-mat-text-muted hover:border-mat-gold'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mat-label">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="mat-input resize-none"
              rows={3}
              placeholder="Describe the technique..."
            />
          </div>
          <div>
            <label className="mat-label">Coach Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="mat-input resize-none"
              rows={2}
              placeholder="Notes for your student..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name.trim() || mutation.isPending}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Assign Technique
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Drilling Plan Modal ────────────────────────────────────────────────────────

function DrillingPlanModal({
  studentId,
  onClose,
}: {
  studentId: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [notes, setNotes] = useState('')
  const [drills, setDrills] = useState<CoachDrill[]>([{ name: '', sets: 3, reps: 10 }])

  const addDrill = () => setDrills(d => [...d, { name: '', sets: 3, reps: 10 }])
  const updateDrill = (i: number, patch: Partial<CoachDrill>) =>
    setDrills(d => d.map((dr, idx) => idx === i ? { ...dr, ...patch } : dr))
  const removeDrill = (i: number) => setDrills(d => d.filter((_, idx) => idx !== i))

  const mutation = useMutation({
    mutationFn: () => coachingApi.createDrillingPlan(studentId, {
      student_id: studentId,
      title,
      week_start: weekStart,
      notes,
      drills: drills.filter(d => d.name.trim()),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-student', studentId, 'plans'] })
      toast.success('Drilling plan created.')
      onClose()
    },
    onError: () => toast.error('Failed to create plan.'),
  })

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-md p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">Drilling Plan</h2>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mat-label">Plan Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mat-input"
              placeholder="e.g. Week 1 Guard Focus"
            />
          </div>
          <div>
            <label className="mat-label">Week Starting</label>
            <input
              type="date"
              value={weekStart}
              onChange={e => setWeekStart(e.target.value)}
              className="mat-input"
            />
          </div>
          <div>
            <label className="mat-label">Drills</label>
            <div className="space-y-2">
              {drills.map((drill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={drill.name}
                    onChange={e => updateDrill(i, { name: e.target.value })}
                    className="mat-input text-sm flex-1"
                    placeholder="Drill name"
                  />
                  <input
                    type="number"
                    value={drill.sets}
                    onChange={e => updateDrill(i, { sets: Number(e.target.value) })}
                    className="mat-input text-sm w-14 text-center"
                    min={1}
                    title="Sets"
                  />
                  <span className="text-mat-text-dim text-xs">×</span>
                  <input
                    type="number"
                    value={drill.reps}
                    onChange={e => updateDrill(i, { reps: Number(e.target.value) })}
                    className="mat-input text-sm w-14 text-center"
                    min={1}
                    title="Reps"
                  />
                  <button
                    type="button"
                    onClick={() => removeDrill(i)}
                    className="text-mat-text-dim hover:text-mat-red-light transition-colors p-1 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <p className="text-mat-text-dim text-xs text-right -mt-1">sets × reps</p>
            </div>
            <button type="button" onClick={addDrill} className="btn-secondary text-xs px-3 py-1.5 mt-2 flex items-center gap-1.5">
              <Plus size={11} /> Add Drill
            </button>
          </div>
          <div>
            <label className="mat-label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mat-input resize-none"
              rows={2}
              placeholder="Additional instructions..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || !weekStart || mutation.isPending}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />}
            Create Plan
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'sessions' | 'techniques' | 'plans'

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const id = Number(studentId)
  const router = useRouter()
  const { isCoachMode } = useCoachingStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [showAssignTech, setShowAssignTech] = useState(false)
  const [showDrillingPlan, setShowDrillingPlan] = useState(false)

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    student: StudentSummary
    recent_sessions: TrainingSession[]
  }>({
    queryKey: ['coaching-student', id, 'overview'],
    queryFn: () => coachingApi.getStudentData(id).then(r => r.data),
    enabled: isCoachMode,
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery<TrainingSession[]>({
    queryKey: ['coaching-student', id, 'sessions'],
    queryFn: () => coachingApi.getStudentData(id, 'sessions').then(r => r.data),
    enabled: isCoachMode && tab === 'sessions',
  })

  const { data: techniques, isLoading: techsLoading } = useQuery<Technique[]>({
    queryKey: ['coaching-student', id, 'techniques'],
    queryFn: () => coachingApi.getStudentData(id, 'techniques').then(r => r.data),
    enabled: isCoachMode && tab === 'techniques',
  })

  const { data: plans, isLoading: plansLoading } = useQuery<CoachDrillingPlan[]>({
    queryKey: ['coaching-student', id, 'plans'],
    queryFn: () => coachingApi.getStudentDrillingPlans(id).then(r => r.data),
    enabled: isCoachMode && tab === 'plans',
  })

  if (!isCoachMode) {
    router.push('/coaching')
    return null
  }

  const student = overview?.student
  const beltColor = student ? (BELT_COLORS[student.belt]?.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-gold') : 'text-mat-gold'

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: GraduationCap },
    { key: 'sessions', label: 'Sessions', icon: BookOpen },
    { key: 'techniques', label: 'Techniques', icon: Database },
    { key: 'plans', label: 'Drilling Plans', icon: ClipboardList },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {showAssignTech && <AssignTechniqueModal studentId={id} onClose={() => setShowAssignTech(false)} />}
      {showDrillingPlan && <DrillingPlanModal studentId={id} onClose={() => setShowDrillingPlan(false)} />}

      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push('/coaching')}
          className="text-mat-text-muted hover:text-mat-gold transition-colors mt-1 shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-mat-gold text-xs uppercase tracking-widest flex items-center gap-1.5">
            <GraduationCap size={11} /> Coach Mode
          </p>
          {student ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mat-muted border border-mat-border flex items-center justify-center text-mat-gold font-bold text-sm shrink-0 overflow-hidden">
                {student.avatar
                  ? <img src={student.avatar} alt={student.username} className="w-full h-full object-cover" />
                  : student.username.slice(0, 2).toUpperCase()
                }
              </div>
              <div>
                <h1 className="font-display text-3xl tracking-wider text-mat-text uppercase">{student.username}</h1>
                <p className={`text-sm font-semibold capitalize ${beltColor}`}>{student.display_belt}</p>
              </div>
            </div>
          ) : (
            <div className="h-9 w-48 bg-mat-muted animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button
            onClick={() => setShowAssignTech(true)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={11} /> Assign Technique
          </button>
          <button
            onClick={() => setShowDrillingPlan(true)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <ClipboardList size={11} /> Add Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mat-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b-2 transition-colors',
              tab === key
                ? 'text-mat-gold border-mat-gold'
                : 'text-mat-text-muted border-transparent hover:text-mat-text'
            )}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {overviewLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
          ) : student ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-mat-card border border-mat-border p-4 text-center">
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Sessions</p>
                  <p className="font-display text-3xl text-mat-gold">{student.total_sessions}</p>
                </div>
                <div className="bg-mat-card border border-mat-border p-4 text-center">
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Techniques</p>
                  <p className="font-display text-3xl text-mat-gold">{student.total_techniques}</p>
                </div>
                <div className="bg-mat-card border border-mat-border p-4 text-center">
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Pending</p>
                  <p className="font-display text-3xl text-mat-gold">{student.pending_techniques}</p>
                </div>
              </div>

              {overview?.recent_sessions && overview.recent_sessions.length > 0 && (
                <div className="bg-mat-card border border-mat-border">
                  <div className="px-5 py-4 border-b border-mat-border">
                    <p className="text-mat-text-muted text-xs uppercase tracking-widest">Recent Sessions</p>
                  </div>
                  <div className="divide-y divide-mat-border">
                    {overview.recent_sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-mat-text text-sm font-medium">{s.title || s.session_type_display}</p>
                          <p className="text-mat-text-dim text-xs">{formatDate(s.date, 'MMM d, yyyy')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-mat-text-muted text-xs">{s.duration} min</p>
                          <p className="text-mat-text-dim text-xs">{s.round_count} rounds</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {tab === 'sessions' && (
        <div>
          {sessionsLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-mat-text-dim py-12 text-center text-sm">No sessions logged yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="bg-mat-card border border-mat-border px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-mat-text text-sm font-medium">{s.title || s.session_type_display}</p>
                    <p className="text-mat-text-dim text-xs">{formatDate(s.date, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-mat-text-muted text-xs">{s.duration} min</p>
                      <p className="text-mat-text-dim text-xs">{s.round_count} rounds</p>
                    </div>
                    {s.performance_rating && (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className={`w-2 h-2 ${n <= (s.performance_rating || 0) ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'techniques' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowAssignTech(true)}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus size={12} /> Assign Technique
            </button>
          </div>
          {techsLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
          ) : !techniques || techniques.length === 0 ? (
            <p className="text-mat-text-dim py-12 text-center text-sm">No techniques in their arsenal yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {techniques.map(t => (
                <div
                  key={t.id}
                  className={cn(
                    'bg-mat-card border p-4 flex flex-col gap-1',
                    t.coach_assignment_pending
                      ? 'border-mat-gold/50 bg-mat-gold/5'
                      : 'border-mat-border'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-mat-text font-semibold text-sm leading-tight">{t.name}</p>
                    {t.coach_assignment_pending && (
                      <span className="text-xs text-mat-gold bg-mat-gold/10 border border-mat-gold/30 px-1.5 py-0.5 shrink-0 ml-2">Pending</span>
                    )}
                  </div>
                  <p className="text-mat-text-dim text-xs">{POSITION_LABELS[t.position] || t.position}</p>
                  <p className="text-mat-text-muted text-xs capitalize">{t.type_display}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowDrillingPlan(true)}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus size={12} /> Create Plan
            </button>
          </div>
          {plansLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
          ) : !plans || plans.length === 0 ? (
            <p className="text-mat-text-dim py-12 text-center text-sm">No drilling plans created yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map(plan => (
                <div key={plan.id} className="bg-mat-card border border-mat-border p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-mat-text font-semibold">{plan.title}</p>
                      <p className="text-mat-text-dim text-xs mt-0.5">
                        Week of {formatDate(plan.week_start, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {plan.notes && <p className="text-mat-text-muted text-sm">{plan.notes}</p>}
                  {plan.drills.length > 0 && (
                    <div className="space-y-1.5">
                      {plan.drills.map((drill, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-mat-text">{drill.name}</span>
                          <span className="text-mat-text-muted text-xs">{drill.sets} sets × {drill.reps} reps</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
