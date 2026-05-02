'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachingApi, techniquesApi } from '@/lib/api'
import { useCoachingStore } from '@/stores/coachingStore'
import {
  ChevronLeft, Loader2, Plus, X, GraduationCap, BookOpen,
  Database, ClipboardList, MessageSquare, CheckCircle2, UserMinus,
  Eye, Pencil, ChevronRight, Save, Mic, MicOff, Swords, Video, Send, Trash2, ArrowRight,
} from 'lucide-react'
import { cn, BELT_COLORS, POSITION_LABELS, TYPE_LABELS, SESSION_TYPE_COLORS, OUTCOME_COLORS } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { confirm } from '@/lib/confirm'
import type { StudentSummary, TrainingSession, Technique, CoachDrillingPlan, CoachDrill, CoachSessionNote, CoachSessionEdit, SparringRound, CoachRoundFeedback, Sequence } from '@/lib/types'

const POSITIONS = Object.entries(POSITION_LABELS)
const TYPES = Object.entries(TYPE_LABELS)

// ── Assign Technique Modal ─────────────────────────────────────────────────────

function AssignTechniqueModal({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '', position: 'closed_guard', technique_type: 'submission',
    description: '', notes: '', difficulty: 3, video_url: '',
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
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mat-label">Technique Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mat-input" placeholder="e.g. Triangle Choke" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mat-label">Position</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="mat-input">
                {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mat-label">Type</label>
              <select value={form.technique_type} onChange={e => setForm(f => ({ ...f, technique_type: e.target.value }))} className="mat-input">
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mat-label">Difficulty (1–5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, difficulty: n }))}
                  className={cn('flex-1 py-2 text-sm border transition-colors', form.difficulty === n ? 'border-mat-gold bg-mat-gold/10 text-mat-gold' : 'border-mat-border text-mat-text-muted hover:border-mat-gold')}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mat-label">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mat-input resize-none" rows={5} placeholder="Describe the technique..." />
          </div>
          <div>
            <label className="mat-label">Coach Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mat-input resize-none" rows={4} placeholder="Notes for your student..." />
          </div>
          <div>
            <label className="mat-label">Reference Video URL (optional)</label>
            <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="mat-input" placeholder="https://youtube.com/..." type="url" />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Assign Technique
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Assign Sequence Modal ──────────────────────────────────────────────────────

function AssignSequenceModal({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: seqData, isLoading } = useQuery({
    queryKey: ['my-sequences-for-assign'],
    queryFn: () => techniquesApi.listSequences().then(r => r.data?.results || r.data),
  })
  const sequences: Sequence[] = Array.isArray(seqData) ? seqData.filter((s: Sequence) => !s.coach_assignment_pending) : []

  const mutation = useMutation({
    mutationFn: () => coachingApi.assignSequence(studentId, selectedId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-student', studentId] })
      toast.success('Sequence assigned.')
      onClose()
    },
    onError: () => toast.error('Failed to assign sequence.'),
  })

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-sm p-6 space-y-5 animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">Assign Sequence</h2>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors"><X size={16} /></button>
        </div>
        <p className="text-mat-text-dim text-xs shrink-0">Select one of your sequences to assign to this student.</p>
        <div className="overflow-y-auto flex-1 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-mat-gold" /></div>
          ) : sequences.length === 0 ? (
            <p className="text-mat-text-dim text-sm text-center py-6">No sequences in your library yet. Create one first in Techniques → Sequences.</p>
          ) : sequences.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={cn(
                'w-full text-left px-4 py-3 border transition-colors',
                selectedId === s.id ? 'border-mat-gold bg-mat-gold/10' : 'border-mat-border hover:border-mat-gold/50'
              )}
            >
              <p className="text-mat-text font-medium text-sm">{s.name}</p>
              <p className="text-mat-text-dim text-xs mt-0.5">{s.nodes.length} technique{s.nodes.length !== 1 ? 's' : ''}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => mutation.mutate()}
            disabled={!selectedId || mutation.isPending}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Assign Sequence
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Drilling Plan Modal ────────────────────────────────────────────────────────

function DrillingPlanModal({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [notes, setNotes] = useState('')
  const [drills, setDrills] = useState<CoachDrill[]>([{ name: '', reps: 10 }])

  const addDrill = () => setDrills(d => [...d, { name: '', reps: 10 }])
  const updateDrill = (i: number, patch: Partial<CoachDrill>) => setDrills(d => d.map((dr, idx) => idx === i ? { ...dr, ...patch } : dr))
  const removeDrill = (i: number) => setDrills(d => d.filter((_, idx) => idx !== i))

  const mutation = useMutation({
    mutationFn: () => coachingApi.createDrillingPlan(studentId, {
      student_id: studentId, title, week_start: weekStart, notes,
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
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mat-label">Plan Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="mat-input" placeholder="e.g. Week 1 Guard Focus" />
          </div>
          <div>
            <label className="mat-label">Week Starting</label>
            <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="mat-input" />
          </div>
          <div>
            <label className="mat-label">Drills</label>
            <div className="space-y-2">
              {drills.map((drill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={drill.name} onChange={e => updateDrill(i, { name: e.target.value })} className="mat-input text-sm flex-1" placeholder="Drill name" />
                  <input type="number" value={drill.reps} onChange={e => updateDrill(i, { reps: Number(e.target.value) })} className="mat-input text-sm w-20 text-center" min={1} title="Reps" />
                  <span className="text-mat-text-dim text-xs shrink-0">reps</span>
                  <button type="button" onClick={() => removeDrill(i)} className="text-mat-text-dim hover:text-mat-red-light transition-colors p-1 shrink-0"><X size={12} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addDrill} className="btn-secondary text-xs px-3 py-1.5 mt-2 flex items-center gap-1.5">
              <Plus size={11} /> Add Drill
            </button>
          </div>
          <div>
            <label className="mat-label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mat-input resize-none" rows={2} placeholder="Additional instructions..." />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => mutation.mutate()} disabled={!title.trim() || !weekStart || mutation.isPending}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />}
            Create Plan
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Voice Note Recorder ────────────────────────────────────────────────────────

function VoiceNoteRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current) }, [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecorded(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      toast.error('Microphone access denied.')
    }
  }

  const stop = () => {
    mediaRef.current?.stop()
    timerRef.current && clearInterval(timerRef.current)
    setRecording(false)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (recording) {
    return (
      <button onClick={stop} className="flex items-center gap-2 text-xs text-mat-red-light border border-mat-red-light/40 px-3 py-1.5 hover:bg-mat-red-light/10 transition-colors">
        <MicOff size={11} /> Stop {fmt(seconds)}
      </button>
    )
  }

  return (
    <button onClick={start} className="flex items-center gap-2 text-xs text-mat-text-muted border border-mat-border px-3 py-1.5 hover:text-mat-gold hover:border-mat-gold transition-colors">
      <Mic size={11} /> Record Voice Note
    </button>
  )
}

// ── Coach Round Feedback Panel ─────────────────────────────────────────────────

function CoachRoundFeedbackPanel({ studentId, round }: { studentId: number; round: SparringRound }) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [pendingVoice, setPendingVoice] = useState<Blob | null>(null)
  const audioUrl = pendingVoice ? URL.createObjectURL(pendingVoice) : null

  const { data: feedback, isLoading } = useQuery<CoachRoundFeedback | null>({
    queryKey: ['coach-round-feedback', studentId, round.id],
    queryFn: () => coachingApi.getRoundFeedback(studentId, round.id).then(r => r.data),
  })

  useEffect(() => {
    if (feedback) setText(feedback.text_feedback)
  }, [feedback])

  const saveMutation = useMutation({
    mutationFn: () => coachingApi.saveRoundFeedback(studentId, round.id, {
      text_feedback: text,
      ...(pendingVoice ? { voice_note: new File([pendingVoice], 'voice_note.webm', { type: 'audio/webm' }) } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-round-feedback', studentId, round.id] })
      setPendingVoice(null)
      toast.success('Feedback saved.')
    },
    onError: () => toast.error('Failed to save feedback.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => coachingApi.deleteRoundFeedback(studentId, round.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-round-feedback', studentId, round.id] })
      setText('')
      toast.success('Feedback removed.')
    },
    onError: () => toast.error('Failed to remove feedback.'),
  })

  if (isLoading) return <div className="flex justify-center py-3"><Loader2 size={13} className="animate-spin text-mat-gold" /></div>

  return (
    <div className="space-y-2 mt-2">
      {feedback?.voice_note_url && !pendingVoice && (
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Voice Note</p>
          <audio src={feedback.voice_note_url} controls className="w-full h-8" />
        </div>
      )}
      {audioUrl && (
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">New Recording</p>
          <audio src={audioUrl} controls className="w-full h-8" />
        </div>
      )}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="mat-input resize-none w-full text-xs"
        rows={3}
        placeholder="Write feedback on this round..."
      />
      <div className="flex items-center gap-2 flex-wrap">
        <VoiceNoteRecorder onRecorded={setPendingVoice} />
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || (!text.trim() && !pendingVoice)}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          Save
        </button>
        {feedback && (
          <button
            onClick={async () => { if (await confirm('Remove feedback?')) deleteMutation.mutate() }}
            className="text-xs text-mat-red-light/70 hover:text-mat-red-light transition-colors flex items-center gap-1"
          >
            <Trash2 size={10} /> Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ── Session Rounds Panel ───────────────────────────────────────────────────────

function SessionRoundsPanel({ studentId, sessionId }: { studentId: number; sessionId: number }) {
  const [openRoundId, setOpenRoundId] = useState<number | null>(null)

  const { data: rounds, isLoading } = useQuery<SparringRound[]>({
    queryKey: ['coaching-student-rounds', studentId, sessionId],
    queryFn: () => coachingApi.getStudentSessionRounds(studentId, sessionId).then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-mat-gold" /></div>
  if (!rounds || rounds.length === 0) return <p className="text-mat-text-dim text-xs py-4 text-center">No sparring rounds logged for this session.</p>

  return (
    <div className="space-y-2">
      {rounds.map(r => {
        const isOpen = openRoundId === r.id
        const hasVideo = !!(r.youtube_embed_url || r.video_url)
        return (
          <div key={r.id} className="border border-mat-border bg-mat-darker">
            <button
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-mat-card transition-colors"
              onClick={() => setOpenRoundId(isOpen ? null : r.id)}
            >
              <div className="flex items-center gap-3 flex-wrap text-left">
                <span className={`text-xs font-bold uppercase ${OUTCOME_COLORS[r.outcome]}`}>{r.outcome}</span>
                <span className="text-mat-text text-sm font-medium">{r.partner_name}</span>
                <span className="text-mat-text-muted text-xs capitalize">{r.partner_belt}</span>
                <span className="text-mat-text-dim text-xs">{r.duration_minutes}min</span>
                {hasVideo && <Video size={10} className="text-mat-gold" />}
              </div>
              <ChevronRight size={12} className={`text-mat-text-dim transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-mat-border space-y-3">
                {r.youtube_embed_url && (
                  <div className="aspect-video w-full">
                    <iframe src={r.youtube_embed_url} className="w-full h-full" allowFullScreen />
                  </div>
                )}
                {r.video_url && !r.youtube_embed_url && (
                  <a href={r.video_url} target="_blank" rel="noopener noreferrer" className="text-mat-gold text-xs hover:underline break-all">
                    {r.video_url}
                  </a>
                )}
                <div className="border-t border-mat-border pt-3">
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <GraduationCap size={10} /> Coach Feedback
                  </p>
                  <CoachRoundFeedbackPanel studentId={studentId} round={r} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Session Type options ───────────────────────────────────────────────────────

const SESSION_TYPES = [
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'competition', label: 'Competition' },
  { value: 'drilling', label: 'Drilling Only' },
  { value: 'wrestling', label: 'Wrestling / Takedowns' },
  { value: 'fundamentals', label: 'Fundamentals Class' },
]

// ── Session Detail Modal ───────────────────────────────────────────────────────

function SessionDetailModal({
  studentId,
  sessionId,
  onClose,
}: {
  studentId: number
  sessionId: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string | number | null>>({})
  const [feedbackText, setFeedbackText] = useState('')
  const [pendingVoice, setPendingVoice] = useState<Blob | null>(null)
  const feedbackAudioUrl = pendingVoice ? URL.createObjectURL(pendingVoice) : null

  const { data, isLoading, isError } = useQuery<{ session: TrainingSession; pending_edit: CoachSessionEdit | null }>({
    queryKey: ['coaching-student-session', studentId, sessionId],
    queryFn: () => coachingApi.getStudentSessionDetail(studentId, sessionId).then(r => r.data),
  })

  const session = data?.session
  const pendingEdit = data?.pending_edit

  const initEditForm = (s: TrainingSession) => {
    setEditForm({
      title: s.title,
      notes: s.notes,
      session_type: s.session_type,
      duration: s.duration,
      performance_rating: s.performance_rating ?? '',
      energy_level: s.energy_level ?? '',
      instructor: s.instructor,
      gym_location: s.gym_location,
    })
    setFeedbackText('')
    setPendingVoice(null)
    setEditMode(true)
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const changes: Record<string, string | number | null> = {}
      if (!session) return Promise.reject()
      const fields = ['title', 'notes', 'session_type', 'duration', 'performance_rating', 'energy_level', 'instructor', 'gym_location'] as const
      for (const f of fields) {
        const val = editForm[f]
        if (val !== '' && val !== null && val !== undefined) {
          changes[f] = typeof val === 'string' && ['duration', 'performance_rating', 'energy_level'].includes(f)
            ? Number(val)
            : val
        } else if (['performance_rating', 'energy_level'].includes(f)) {
          changes[f] = null
        }
      }
      await coachingApi.submitSessionEdit(studentId, sessionId, changes)
      if (feedbackText.trim() || pendingVoice) {
        await coachingApi.saveSessionNote(studentId, sessionId, {
          note: feedbackText,
          ...(pendingVoice ? { voice_note: new File([pendingVoice], 'voice_note.webm', { type: 'audio/webm' }) } : {}),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-student-session', studentId, sessionId] })
      queryClient.invalidateQueries({ queryKey: ['coaching-student', studentId, 'session-notes'] })
      setEditMode(false)
      setPendingVoice(null)
      toast.success('Edits and feedback sent.')
    },
    onError: () => toast.error('Failed to send edits.'),
  })

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-lg p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">
            {editMode ? 'Edits & Feedback' : 'Session Details'}
          </h2>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors"><X size={16} /></button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
        ) : isError ? (
          <p className="text-mat-text-dim text-sm py-8 text-center">Failed to load session. Please try again.</p>
        ) : !session ? (
          <p className="text-mat-text-dim text-sm py-8 text-center">Session not found.</p>
        ) : editMode ? (
          /* ── Edit form ── */
          <div className="space-y-4">
            <div>
              <label className="mat-label">Title</label>
              <input value={String(editForm.title ?? '')} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="mat-input" placeholder="Session title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mat-label">Session Type</label>
                <select value={String(editForm.session_type ?? '')} onChange={e => setEditForm(f => ({ ...f, session_type: e.target.value }))} className="mat-input">
                  {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mat-label">Duration (min)</label>
                <input type="number" value={String(editForm.duration ?? '')} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))} className="mat-input" min={1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mat-label">Performance (1–5)</label>
                <select value={String(editForm.performance_rating ?? '')} onChange={e => setEditForm(f => ({ ...f, performance_rating: e.target.value }))} className="mat-input">
                  <option value="">—</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="mat-label">Energy Level (1–5)</label>
                <select value={String(editForm.energy_level ?? '')} onChange={e => setEditForm(f => ({ ...f, energy_level: e.target.value }))} className="mat-input">
                  <option value="">—</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mat-label">Instructor</label>
              <input value={String(editForm.instructor ?? '')} onChange={e => setEditForm(f => ({ ...f, instructor: e.target.value }))} className="mat-input" placeholder="Instructor name" />
            </div>
            <div>
              <label className="mat-label">Location</label>
              <input value={String(editForm.gym_location ?? '')} onChange={e => setEditForm(f => ({ ...f, gym_location: e.target.value }))} className="mat-input" placeholder="Gym / Location" />
            </div>
            <div>
              <label className="mat-label">Notes</label>
              <textarea value={String(editForm.notes ?? '')} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="mat-input resize-none" rows={5} placeholder="Session notes..." />
            </div>
            <div className="border-t border-mat-border pt-4 space-y-3">
              <p className="text-mat-gold text-xs uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={11} /> Coach Feedback
              </p>
              {feedbackAudioUrl && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">New Recording</p>
                  <audio src={feedbackAudioUrl} controls className="w-full h-8" />
                </div>
              )}
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="mat-input resize-none w-full text-sm"
                rows={3}
                placeholder="Leave feedback for this session (optional)..."
              />
              <VoiceNoteRecorder onRecorded={setPendingVoice} />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send
              </button>
              <button onClick={() => setEditMode(false)} className="btn-secondary flex-1 py-2.5">Back</button>
            </div>
          </div>
        ) : (
          /* ── Session detail view ── */
          <div className="space-y-4">
            {pendingEdit && (
              <div className="bg-mat-gold/5 border border-mat-gold/40 px-4 py-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-mat-gold animate-pulse shrink-0" />
                <p className="text-mat-gold text-xs font-semibold">Edit suggestion pending student review</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mat-label">Date</p>
                <p className="text-mat-text text-sm">{formatDate(session.date, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="mat-label">Type</p>
                <p className={`text-sm font-bold uppercase ${SESSION_TYPE_COLORS[session.session_type] || 'text-mat-text'}`}>{session.session_type_display}</p>
              </div>
              <div>
                <p className="mat-label">Duration</p>
                <p className="text-mat-text text-sm">{session.duration} min</p>
              </div>
              <div>
                <p className="mat-label">Rounds</p>
                <p className="text-mat-text text-sm">{session.round_count || '—'}</p>
              </div>
              {session.performance_rating && (
                <div>
                  <p className="mat-label">Performance</p>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => <div key={n} className={`w-4 h-2 ${n <= session.performance_rating! ? 'bg-mat-gold' : 'bg-mat-muted'}`} />)}
                  </div>
                </div>
              )}
              {session.energy_level && (
                <div>
                  <p className="mat-label">Energy</p>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => <div key={n} className={`w-4 h-2 ${n <= session.energy_level! ? 'bg-mat-gold' : 'bg-mat-muted'}`} />)}
                  </div>
                </div>
              )}
              {session.instructor && (
                <div>
                  <p className="mat-label">Instructor</p>
                  <p className="text-mat-text text-sm">{session.instructor}</p>
                </div>
              )}
              {session.gym_location && (
                <div>
                  <p className="mat-label">Location</p>
                  <p className="text-mat-text text-sm">{session.gym_location}</p>
                </div>
              )}
            </div>

            {session.notes && (
              <div>
                <p className="mat-label">Notes</p>
                <p className="text-mat-text-muted text-sm leading-relaxed whitespace-pre-wrap mt-1">{session.notes}</p>
              </div>
            )}

            {session.techniques_worked && session.techniques_worked.length > 0 && (
              <div>
                <p className="mat-label mb-1">Techniques Worked</p>
                <div className="flex flex-wrap gap-1.5">
                  {session.techniques_worked.map(t => (
                    <span key={t.id} className="text-xs bg-mat-panel border border-mat-border px-2 py-1 text-mat-text-muted">{t.name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-mat-border pt-4">
              <p className="mat-label mb-2 flex items-center gap-1.5">
                <Swords size={11} className="text-mat-red-light" /> Sparring Rounds
              </p>
              <SessionRoundsPanel studentId={studentId} sessionId={sessionId} />
            </div>

            <div className="pt-1">
              <button
                onClick={() => initEditForm(session)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                <Pencil size={13} /> Edits & Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Technique Detail / Edit Modal ─────────────────────────────────────────────

function TechniqueDetailModal({
  studentId,
  technique,
  onClose,
  onUpdated,
}: {
  studentId: number
  technique: Technique
  onClose: () => void
  onUpdated: () => void
}) {
  const canEdit = !!technique.coach_assigned_by_username
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: technique.name,
    position: technique.position,
    technique_type: technique.technique_type,
    description: technique.description,
    notes: technique.notes,
    difficulty: technique.difficulty,
    video_url: technique.video_url,
  })

  const mutation = useMutation({
    mutationFn: () => coachingApi.updateStudentTechnique(studentId, technique.id, form),
    onSuccess: () => {
      toast.success('Technique updated.')
      onUpdated()
      onClose()
    },
    onError: () => toast.error('Failed to update technique.'),
  })

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-md p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">
            {editing ? 'Edit Technique' : 'Technique Details'}
          </h2>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text transition-colors"><X size={16} /></button>
        </div>

        {technique.coach_assignment_pending && (
          <div className="bg-mat-gold/5 border border-mat-gold/30 px-3 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-mat-gold animate-pulse shrink-0" />
            <p className="text-mat-gold text-xs font-semibold">Pending student acceptance</p>
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="mat-label">Technique Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mat-input" placeholder="e.g. Triangle Choke" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mat-label">Position</label>
                <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value as import('@/lib/types').Position }))} className="mat-input">
                  {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mat-label">Type</label>
                <select value={form.technique_type} onChange={e => setForm(f => ({ ...f, technique_type: e.target.value as import('@/lib/types').TechniqueType }))} className="mat-input">
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mat-label">Difficulty (1–5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, difficulty: n }))}
                    className={cn('flex-1 py-2 text-sm border transition-colors', form.difficulty === n ? 'border-mat-gold bg-mat-gold/10 text-mat-gold' : 'border-mat-border text-mat-text-muted hover:border-mat-gold')}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mat-label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mat-input resize-none" rows={5} placeholder="Describe the technique..." />
            </div>
            <div>
              <label className="mat-label">Coach Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mat-input resize-none" rows={4} placeholder="Notes for your student..." />
            </div>
            <div>
              <label className="mat-label">Reference Video URL (optional)</label>
              <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="mat-input" placeholder="https://youtube.com/..." type="url" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
                {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save Changes
              </button>
              <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mat-label">Position</p>
                <p className="text-mat-text text-sm">{POSITION_LABELS[technique.position] || technique.position}</p>
              </div>
              <div>
                <p className="mat-label">Type</p>
                <p className="text-mat-text text-sm capitalize">{technique.type_display}</p>
              </div>
              <div>
                <p className="mat-label">Difficulty</p>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-4 h-2 ${n <= technique.difficulty ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
                  ))}
                </div>
              </div>
            </div>
            {technique.description && (
              <div>
                <p className="mat-label">Description</p>
                <p className="text-mat-text-muted text-sm leading-relaxed whitespace-pre-wrap mt-1">{technique.description}</p>
              </div>
            )}
            {technique.notes && (
              <div>
                <p className="mat-label">Coach Notes</p>
                <p className="text-mat-text-muted text-sm leading-relaxed whitespace-pre-wrap mt-1">{technique.notes}</p>
              </div>
            )}
            {technique.video_url && (
              <div>
                <p className="mat-label">Reference Video</p>
                <a href={technique.video_url} target="_blank" rel="noopener noreferrer" className="text-mat-gold text-sm hover:underline break-all">{technique.video_url}</a>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {canEdit && (
                <button onClick={() => setEditing(true)} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-sm">
                  <Pencil size={13} /> Edit
                </button>
              )}
              <button onClick={onClose} className={cn('py-2.5 flex-1 text-sm', canEdit ? 'btn-secondary' : 'btn-primary')}>Close</button>
            </div>
          </div>
        )}
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
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showAssignTech, setShowAssignTech] = useState(false)
  const [showAssignSeq, setShowAssignSeq] = useState(false)
  const [showDrillingPlan, setShowDrillingPlan] = useState(false)
  const [viewSessionId, setViewSessionId] = useState<number | null>(null)
  const [viewTechnique, setViewTechnique] = useState<Technique | null>(null)
  const [noteSessionId, setNoteSessionId] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')

  const { data: overview, isLoading: overviewLoading } = useQuery<{ student: StudentSummary; recent_sessions: TrainingSession[] }>({
    queryKey: ['coaching-student', id, 'overview'],
    queryFn: () => coachingApi.getStudentData(id).then(r => r.data),
    enabled: isCoachMode,
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery<TrainingSession[]>({
    queryKey: ['coaching-student', id, 'sessions'],
    queryFn: () => coachingApi.getStudentData(id, 'sessions').then(r => r.data),
    enabled: isCoachMode && tab === 'sessions',
  })

  const { data: sessionNotes } = useQuery<CoachSessionNote[]>({
    queryKey: ['coaching-student', id, 'session-notes'],
    queryFn: () => coachingApi.getStudentSessionNotes(id).then(r => r.data),
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

  const saveNoteMutation = useMutation({
    mutationFn: ({ sessionId, note }: { sessionId: number; note: string }) =>
      coachingApi.saveSessionNote(id, sessionId, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-student', id, 'session-notes'] })
      toast.success('Note saved.')
      setNoteSessionId(null)
    },
    onError: () => toast.error('Failed to save note.'),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (sessionId: number) => coachingApi.deleteSessionNote(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-student', id, 'session-notes'] })
      toast.success('Note removed.')
      setNoteSessionId(null)
    },
    onError: () => toast.error('Failed to remove note.'),
  })

  const removeStudentMutation = useMutation({
    mutationFn: () => coachingApi.removeStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-students'] })
      toast.success('Student removed.')
      router.push('/coaching')
    },
    onError: () => toast.error('Failed to remove student.'),
  })

  if (!isCoachMode) {
    router.push('/coaching')
    return null
  }

  const student = overview?.student
  const beltColor = student
    ? (BELT_COLORS[student.belt]?.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-gold')
    : 'text-mat-gold'

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: GraduationCap },
    { key: 'sessions', label: 'Sessions', icon: BookOpen },
    { key: 'techniques', label: 'Techniques', icon: Database },
    { key: 'plans', label: 'Plans', icon: ClipboardList },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {showAssignTech && <AssignTechniqueModal studentId={id} onClose={() => setShowAssignTech(false)} />}
      {showAssignSeq && <AssignSequenceModal studentId={id} onClose={() => setShowAssignSeq(false)} />}
      {showDrillingPlan && <DrillingPlanModal studentId={id} onClose={() => setShowDrillingPlan(false)} />}
      {viewSessionId && <SessionDetailModal studentId={id} sessionId={viewSessionId} onClose={() => setViewSessionId(null)} />}
      {viewTechnique && (
        <TechniqueDetailModal
          studentId={id}
          technique={viewTechnique}
          onClose={() => setViewTechnique(null)}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['coaching-student', id, 'techniques'] })}
        />
      )}

      {/* Header */}
      <div className="space-y-3">
        {/* Row 1: back + student info + remove */}
        <div className="flex items-start gap-3">
          <button onClick={() => router.push('/coaching')} className="text-mat-text-muted hover:text-mat-gold transition-colors mt-1 shrink-0">
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
          <button
            onClick={async () => { if (await confirm(`Remove ${student?.username || 'this student'} as your student? This cannot be undone.`)) removeStudentMutation.mutate() }}
            disabled={removeStudentMutation.isPending}
            className="p-1.5 text-mat-text-dim hover:text-mat-red-light transition-colors mt-1 shrink-0"
            title="Remove student"
          >
            <UserMinus size={15} />
          </button>
        </div>
        {/* Row 2: action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAssignTech(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-1 justify-center">
            <Plus size={11} /> Assign Technique
          </button>
          <button onClick={() => setShowAssignSeq(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-1 justify-center">
            <ArrowRight size={11} /> Assign Sequence
          </button>
          <button onClick={() => setShowDrillingPlan(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-1 justify-center">
            <ClipboardList size={11} /> Add Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mat-border overflow-x-auto scrollbar-none">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1 px-2.5 py-2 text-[10px] font-medium uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap shrink-0',
              tab === key ? 'text-mat-gold border-mat-gold' : 'text-mat-text-muted border-transparent hover:text-mat-text')}>
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
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

      {/* ── Sessions ── */}
      {tab === 'sessions' && (
        <div>
          {sessionsLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-mat-text-dim py-12 text-center text-sm">No sessions logged yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => {
                const existingNote = sessionNotes?.find(n => n.session === s.id)
                const isEditing = noteSessionId === s.id
                return (
                  <div key={s.id} className="bg-mat-card border border-mat-border">
                    <div
                      className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-mat-darker transition-colors"
                      onClick={() => setViewSessionId(s.id)}
                    >
                      <div>
                        <p className="text-mat-text text-sm font-medium">{s.title || s.session_type_display}</p>
                        <p className="text-mat-text-dim text-xs">{formatDate(s.date, 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.performance_rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <div key={n} className={`w-2 h-2 ${n <= (s.performance_rating || 0) ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
                            ))}
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-mat-text-muted text-xs">{s.duration} min</p>
                          <p className="text-mat-text-dim text-xs">{s.round_count} rounds</p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (isEditing) { setNoteSessionId(null) }
                            else { setNoteSessionId(s.id); setNoteText(existingNote?.note || '') }
                          }}
                          className={cn('p-1.5 transition-colors', existingNote ? 'text-mat-gold' : 'text-mat-text-dim hover:text-mat-gold')}
                          title={existingNote ? 'Edit note' : 'Add note'}
                        >
                          <MessageSquare size={13} />
                        </button>
                        <ChevronRight size={13} className="text-mat-text-dim" />
                      </div>
                    </div>

                    {/* Inline note editor */}
                    {isEditing && (
                      <div className="border-t border-mat-border px-5 py-4 space-y-3 bg-mat-darker">
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          className="mat-input resize-none w-full text-sm"
                          rows={3}
                          placeholder="Leave feedback for this session..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNoteMutation.mutate({ sessionId: s.id, note: noteText })}
                            disabled={!noteText.trim() || saveNoteMutation.isPending}
                            className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
                          >
                            {saveNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                          </button>
                          {existingNote && (
                            <button
                              onClick={async () => { if (await confirm('Remove this note?')) deleteNoteMutation.mutate(s.id) }}
                              disabled={deleteNoteMutation.isPending}
                              className="text-xs px-3 py-1.5 border border-mat-red-light/30 text-mat-red-light hover:bg-mat-red-light/10 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          <button onClick={() => setNoteSessionId(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Existing note preview */}
                    {!isEditing && existingNote && (
                      <div className="border-t border-mat-gold/20 px-5 py-3 bg-mat-gold/5">
                        <p className="text-mat-text-muted text-xs italic leading-relaxed">{existingNote.note}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Techniques ── */}
      {tab === 'techniques' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowAssignTech(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
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
                <button
                  key={t.id}
                  onClick={() => setViewTechnique(t)}
                  className={cn(
                    'bg-mat-card border p-4 flex flex-col gap-1 text-left w-full transition-colors',
                    t.coach_assignment_pending
                      ? 'border-mat-gold/50 bg-mat-gold/5 hover:bg-mat-gold/10'
                      : 'border-mat-border hover:bg-mat-darker'
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
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Drilling Plans ── */}
      {tab === 'plans' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowDrillingPlan(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Plus size={12} /> Create Plan
            </button>
          </div>
          {plansLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
          ) : !plans || plans.length === 0 ? (
            <p className="text-mat-text-dim py-12 text-center text-sm">No drilling plans created yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map(plan => {
                const totalDrills = plan.drills.length
                const completedDrills = Object.values(plan.drill_completions).filter(Boolean).length
                const pct = totalDrills > 0 ? (completedDrills / totalDrills) * 100 : 0
                return (
                  <div key={plan.id} className="bg-mat-card border border-mat-border p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-mat-text font-semibold">{plan.title}</p>
                        <p className="text-mat-text-dim text-xs mt-0.5">Week of {formatDate(plan.week_start, 'MMM d, yyyy')}</p>
                      </div>
                      {totalDrills > 0 && (
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-mat-text-muted text-xs">{completedDrills}/{totalDrills} done</p>
                          <div className="w-20 h-1 bg-mat-muted mt-1">
                            <div className="h-full bg-mat-gold transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    {plan.notes && <p className="text-mat-text-muted text-sm">{plan.notes}</p>}
                    {plan.drills.length > 0 && (
                      <div className="space-y-1.5">
                        {plan.drills.map((drill, i) => {
                          const done = !!plan.drill_completions[String(i)]
                          return (
                            <div key={i} className={cn('flex items-center justify-between text-sm px-3 py-2 border', done ? 'bg-mat-gold/5 border-mat-gold/20' : 'bg-mat-panel border-mat-border')}>
                              <div className="flex items-center gap-2">
                                {done ? <CheckCircle2 size={12} className="text-mat-gold shrink-0" /> : <div className="w-3 h-3 border border-mat-text-dim rounded-full shrink-0" />}
                                <span className={cn('text-sm', done ? 'text-mat-text-muted line-through' : 'text-mat-text')}>{drill.name}</span>
                              </div>
                              <span className="text-mat-text-muted text-xs">{drill.reps} reps</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {plan.student_feedback && (
                      <div className="border-t border-mat-border pt-3">
                        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Student Feedback</p>
                        <p className="text-mat-text-muted text-sm italic leading-relaxed">{plan.student_feedback}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
