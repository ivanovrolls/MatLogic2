'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, techniquesApi, templatesApi, sparringApi } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ChevronLeft, Loader2, Plus, X, BookTemplate, ChevronDown, LayoutList, Minus, Swords, Pencil } from 'lucide-react'
import Link from 'next/link'
import type { TechniqueMinimal, SessionTemplate, SessionBlock, BlockType, PartnerBelt, Outcome } from '@/lib/types'
import { SESSION_TYPE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { BLOCK_LABELS, BLOCK_MET } from '@/lib/calories'

// ── Session block builder ─────────────────────────────────────────────────────

const BLOCK_TYPES: BlockType[] = ['warmup', 'drilling', 'technique', 'sparring', 'conditioning', 'cool_down']

const BLOCK_COLORS: Record<BlockType, string> = {
  warmup: 'text-orange-400',
  drilling: 'text-purple-400',
  technique: 'text-mat-blue-light',
  sparring: 'text-mat-red-light',
  conditioning: 'text-mat-green-light',
  cool_down: 'text-cyan-400',
}

function SessionBlockBuilder({
  blocks,
  onChange,
}: {
  blocks: SessionBlock[]
  onChange: (blocks: SessionBlock[]) => void
}) {
  const addBlock = () => {
    onChange([
      ...blocks,
      { id: crypto.randomUUID(), block_type: 'drilling', duration_minutes: 15 },
    ])
  }

  const updateBlock = (id: string, patch: Partial<SessionBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b))
  }

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id))
  }

  const total = blocks.reduce((s, b) => s + b.duration_minutes, 0)

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <p className="text-mat-text-dim text-xs py-2">No blocks yet. Add your first activity block below.</p>
      )}
      {blocks.map((block, i) => (
        <div key={block.id} className="flex items-center gap-2">
          <span className="text-mat-text-dim text-xs w-5 shrink-0 text-right">{i + 1}.</span>
          <select
            value={block.block_type}
            onChange={e => updateBlock(block.id, { block_type: e.target.value as BlockType })}
            className={cn('mat-input flex-1 text-sm', BLOCK_COLORS[block.block_type])}
          >
            {BLOCK_TYPES.map(t => (
              <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => updateBlock(block.id, { duration_minutes: Math.max(1, block.duration_minutes - 5) })}
              className="w-7 h-9 border border-mat-border text-mat-text-muted hover:text-mat-gold hover:border-mat-gold transition-colors flex items-center justify-center"
            >
              <Minus size={11} />
            </button>
            <input
              type="number"
              value={block.duration_minutes}
              onChange={e => updateBlock(block.id, { duration_minutes: Math.max(1, Number(e.target.value)) })}
              className="mat-input w-16 text-sm text-center"
              min={1}
            />
            <button
              type="button"
              onClick={() => updateBlock(block.id, { duration_minutes: block.duration_minutes + 5 })}
              className="w-7 h-9 border border-mat-border text-mat-text-muted hover:text-mat-gold hover:border-mat-gold transition-colors flex items-center justify-center"
            >
              <Plus size={11} />
            </button>
            <span className="text-mat-text-dim text-xs w-6">min</span>
          </div>
          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            className="text-mat-text-dim hover:text-mat-red-light transition-colors p-1 shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={addBlock}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Plus size={11} /> Add Block
        </button>
        {total > 0 && (
          <span className="text-mat-text-muted text-xs">
            Total: <span className="text-mat-gold font-bold">{total} min</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ── Sparring round helpers ────────────────────────────────────────────────────

const BELTS: PartnerBelt[] = ['white', 'blue', 'purple', 'brown', 'black', 'unknown']
const OUTCOMES: Outcome[] = ['win', 'loss', 'draw']
const OUTCOME_LABEL: Record<Outcome, string> = { win: 'W', loss: 'L', draw: 'D' }
const OUTCOME_CLS: Record<Outcome, string> = {
  win: 'bg-mat-green-light text-mat-black',
  loss: 'bg-mat-red-light text-mat-black',
  draw: 'bg-mat-text-muted text-mat-black',
}

interface DraftRound {
  id: string
  partner_name: string
  partner_belt: PartnerBelt
  duration_minutes: number
  outcome: Outcome
  is_gi: boolean
  submissions_attempted: string[]
  submissions_hit: string[]
  submissions_conceded: string[]
  notes: string
}

function MultiChipInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  return (
    <div>
      <label className="mat-label">{label}</label>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 text-xs bg-mat-panel border border-mat-border px-2 py-0.5 text-mat-text">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="text-mat-text-dim hover:text-mat-red-light">
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          className="mat-input text-xs flex-1"
          placeholder={placeholder || 'Type and press Enter'}
        />
        <button type="button" onClick={add} className="btn-secondary text-xs px-2 py-1 shrink-0">Add</button>
      </div>
    </div>
  )
}

function RoundForm({
  initial,
  isGiDefault,
  onSave,
  onCancel,
  saveLabel,
}: {
  initial: DraftRound
  isGiDefault: boolean
  onSave: (round: DraftRound) => void
  onCancel?: () => void
  saveLabel: string
}) {
  const [draft, setDraft] = useState<DraftRound>(initial)
  const [showDetails, setShowDetails] = useState(
    initial.submissions_attempted.length > 0 ||
    initial.submissions_hit.length > 0 ||
    initial.submissions_conceded.length > 0 ||
    !!initial.notes
  )

  const patch = (p: Partial<DraftRound>) => setDraft(d => ({ ...d, ...p }))

  const handleSave = () => {
    if (!draft.partner_name.trim()) return
    onSave(draft)
  }

  return (
    <div className="border border-mat-border p-4 space-y-3 bg-mat-panel">
      {/* Row 1: outcome + partner */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 shrink-0">
          {OUTCOMES.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => patch({ outcome: o })}
              className={cn(
                'w-8 h-9 text-xs font-bold transition-colors border',
                draft.outcome === o
                  ? OUTCOME_CLS[o] + ' border-transparent'
                  : 'border-mat-border text-mat-text-muted hover:border-mat-gold hover:text-mat-gold'
              )}
            >
              {OUTCOME_LABEL[o]}
            </button>
          ))}
        </div>
        <input
          value={draft.partner_name}
          onChange={e => patch({ partner_name: e.target.value })}
          className="mat-input text-sm flex-1"
          placeholder="Partner name"
        />
      </div>

      {/* Row 2: belt + duration + gi toggle */}
      <div className="flex items-center gap-2">
        <select
          value={draft.partner_belt}
          onChange={e => patch({ partner_belt: e.target.value as PartnerBelt })}
          className="mat-input text-sm flex-1 capitalize"
        >
          {BELTS.map(b => (
            <option key={b} value={b}>{b === 'unknown' ? 'Unknown belt' : b.charAt(0).toUpperCase() + b.slice(1)}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => patch({ duration_minutes: Math.max(1, draft.duration_minutes - 1) })}
            className="w-7 h-9 border border-mat-border text-mat-text-muted hover:text-mat-gold hover:border-mat-gold transition-colors flex items-center justify-center"
          >
            <Minus size={11} />
          </button>
          <input
            type="number"
            value={draft.duration_minutes}
            onChange={e => patch({ duration_minutes: Math.max(1, Number(e.target.value)) })}
            className="mat-input w-14 text-sm text-center"
            min={1}
          />
          <button
            type="button"
            onClick={() => patch({ duration_minutes: draft.duration_minutes + 1 })}
            className="w-7 h-9 border border-mat-border text-mat-text-muted hover:text-mat-gold hover:border-mat-gold transition-colors flex items-center justify-center"
          >
            <Plus size={11} />
          </button>
          <span className="text-mat-text-dim text-xs w-6">min</span>
        </div>
        <button
          type="button"
          onClick={() => patch({ is_gi: !draft.is_gi })}
          className={cn(
            'text-xs px-3 py-2 border transition-colors shrink-0',
            draft.is_gi
              ? 'border-mat-gold text-mat-gold bg-mat-gold/10'
              : 'border-mat-border text-mat-text-muted hover:border-mat-gold'
          )}
        >
          {draft.is_gi ? 'Gi' : 'No-Gi'}
        </button>
      </div>

      {/* Optional details */}
      <button
        type="button"
        onClick={() => setShowDetails(v => !v)}
        className="flex items-center gap-1 text-mat-text-dim hover:text-mat-text text-xs transition-colors"
      >
        <ChevronDown size={11} className={cn('transition-transform', showDetails ? 'rotate-180' : '')} />
        {showDetails ? 'Hide details' : 'Add submissions & notes'}
      </button>

      {showDetails && (
        <div className="space-y-3 pt-1 animate-slide-up">
          <MultiChipInput
            label="Submissions Attempted"
            values={draft.submissions_attempted}
            onChange={v => patch({ submissions_attempted: v })}
            placeholder="e.g. Armbar, Triangle"
          />
          <MultiChipInput
            label="Submissions Hit"
            values={draft.submissions_hit}
            onChange={v => patch({ submissions_hit: v })}
            placeholder="e.g. Rear Naked Choke"
          />
          <MultiChipInput
            label="Tapped To"
            values={draft.submissions_conceded}
            onChange={v => patch({ submissions_conceded: v })}
            placeholder="e.g. Guillotine"
          />
          <div>
            <label className="mat-label">Notes</label>
            <input
              value={draft.notes}
              onChange={e => patch({ notes: e.target.value })}
              className="mat-input text-sm"
              placeholder="What happened in this round?"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.partner_name.trim()}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
        >
          <Plus size={11} /> {saveLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-mat-text-dim hover:text-mat-text text-xs transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

function RoundCard({
  round,
  onEdit,
  onRemove,
}: {
  round: DraftRound
  onEdit: (updated: DraftRound) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <RoundForm
        initial={round}
        isGiDefault={round.is_gi}
        saveLabel="Save"
        onSave={updated => { onEdit(updated); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex items-center gap-3 bg-mat-panel border border-mat-border px-4 py-2.5 text-sm group">
      <span className={cn('text-xs font-bold px-1.5 py-0.5 shrink-0', OUTCOME_CLS[round.outcome])}>
        {OUTCOME_LABEL[round.outcome]}
      </span>
      <span className="text-mat-text font-medium flex-1 truncate">{round.partner_name}</span>
      <span className="text-mat-text-muted text-xs capitalize">{round.partner_belt}</span>
      <span className="text-mat-text-dim text-xs">{round.duration_minutes}m</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-mat-text-dim hover:text-mat-gold transition-colors shrink-0 opacity-0 group-hover:opacity-100 p-1"
      >
        <Pencil size={11} />
      </button>
      <button type="button" onClick={onRemove} className="text-mat-text-dim hover:text-mat-red-light transition-colors shrink-0">
        <X size={12} />
      </button>
    </div>
  )
}

const schema = z.object({
  date: z.string(),
  session_type: z.enum(['gi', 'nogi', 'open_mat', 'competition', 'drilling', 'wrestling', 'fundamentals']),
  duration: z.coerce.number().min(1, 'Enter duration'),
  title: z.string().optional(),
  notes: z.string().optional(),
  performance_rating: z.coerce.number().min(1).max(5).optional().nullable(),
  energy_level: z.coerce.number().min(1).max(5).optional().nullable(),
  instructor: z.string().optional(),
  gym_location: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function RatingPicker({ label, value, onChange }: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <label className="mat-label">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            className={`w-9 h-9 text-sm font-bold border transition-all ${
              value === n
                ? 'bg-mat-gold border-mat-gold text-mat-black'
                : 'border-mat-border text-mat-text-muted hover:border-mat-gold hover:text-mat-gold'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [selectedTechniques, setSelectedTechniques] = useState<TechniqueMinimal[]>([])
  const [techSearch, setTechSearch] = useState('')
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [sessionMode, setSessionMode] = useState<'simple' | 'structured'>('simple')
  const [sessionBlocks, setSessionBlocks] = useState<SessionBlock[]>([])
  const [draftRounds, setDraftRounds] = useState<DraftRound[]>([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'),
      session_type: 'gi',
      duration: 90,
      performance_rating: null,
      energy_level: null,
    },
  })

  const performanceRating = watch('performance_rating')
  const energyLevel = watch('energy_level')
  const watchedType = watch('session_type')

  const { data: techniques } = useQuery({
    queryKey: ['techniques', 'all'],
    queryFn: () => techniquesApi.list({ page_size: 200 }).then(r => r.data.results || r.data),
  })

  const templateIdParam = searchParams.get('template')

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then(r => r.data?.results || r.data),
    enabled: showTemplatePicker || !!templateIdParam,
  })

  // Auto-load template from URL param once data is available
  const [autoLoaded, setAutoLoaded] = useState(false)
  if (templateIdParam && !autoLoaded && Array.isArray(templates)) {
    const tmpl = (templates as SessionTemplate[]).find(t => t.id === Number(templateIdParam))
    if (tmpl) {
      setValue('session_type', tmpl.session_type)
      setValue('duration', tmpl.duration)
      setValue('instructor', tmpl.instructor)
      setValue('gym_location', tmpl.gym_location)
      setValue('notes', tmpl.notes)
      setSelectedTechniques(tmpl.techniques)
      setAutoLoaded(true)
    }
  }

  const filteredTechs = (techniques || []).filter((t: TechniqueMinimal) =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) &&
    !selectedTechniques.find(s => s.id === t.id)
  )

  const createTemplateMutation = useMutation({
    mutationFn: (data: object) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template saved.')
      setSaveAsTemplate(false)
      setTemplateTitle('')
    },
    onError: () => toast.error('Failed to save template.'),
  })

  const mutation = useMutation({
    mutationFn: (data: object) => sessionsApi.create(data),
    onSuccess: async (res) => {
      const sessionId = res.data.id
      const sessionDate = res.data.date
      if (draftRounds.length > 0) {
        await Promise.all(
          draftRounds.map(r =>
            sparringApi.create({
              session: sessionId,
              date: sessionDate,
              partner_name: r.partner_name,
              partner_belt: r.partner_belt,
              duration_minutes: r.duration_minutes,
              outcome: r.outcome,
              is_gi: r.is_gi,
              submissions_attempted: r.submissions_attempted,
              submissions_hit: r.submissions_hit,
              submissions_conceded: r.submissions_conceded,
              dominant_positions: [],
              positions_conceded: [],
              sweeps_completed: 0,
              takedowns_completed: 0,
              notes: r.notes,
            })
          )
        )
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sparring'] })
      toast.success('Session logged.')
      router.push(`/sessions/${sessionId}`)
    },
    onError: () => toast.error('Failed to save session.'),
  })

  const loadTemplate = (tmpl: SessionTemplate) => {
    setValue('session_type', tmpl.session_type)
    setValue('duration', tmpl.duration)
    setValue('instructor', tmpl.instructor)
    setValue('gym_location', tmpl.gym_location)
    setValue('notes', tmpl.notes)
    setSelectedTechniques(tmpl.techniques)
    setShowTemplatePicker(false)
    toast.success(`Loaded "${tmpl.title}"`)
  }

  const blocksTotalMinutes = sessionBlocks.reduce((s, b) => s + b.duration_minutes, 0)

  const onSubmit = (data: FormData) => {
    const effectiveDuration = sessionMode === 'structured' && blocksTotalMinutes > 0
      ? blocksTotalMinutes
      : data.duration
    mutation.mutate({
      ...data,
      duration: effectiveDuration,
      techniques_worked_ids: selectedTechniques.map(t => t.id),
      session_blocks: sessionMode === 'structured' ? sessionBlocks : [],
    })
  }

  const handleSaveTemplate = () => {
    if (!templateTitle.trim()) return
    const values = watch()
    createTemplateMutation.mutate({
      title: templateTitle,
      session_type: values.session_type,
      duration: values.duration,
      notes: values.notes || '',
      instructor: values.instructor || '',
      gym_location: values.gym_location || '',
      technique_ids: selectedTechniques.map(t => t.id),
    })
  }

  const templatesArr: SessionTemplate[] = Array.isArray(templates) ? templates : []

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/sessions" className="text-mat-text-muted hover:text-mat-gold transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Training Log</p>
            <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Log Session</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTemplatePicker(v => !v)}
          className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
        >
          <BookTemplate size={13} />
          Load Template
          <ChevronDown size={11} className={cn('transition-transform', showTemplatePicker ? 'rotate-180' : '')} />
        </button>
      </div>

      {/* Template picker */}
      {showTemplatePicker && (
        <div className="bg-mat-card border border-mat-border p-4 mb-5 animate-slide-up">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Saved Templates</p>
          {templatesArr.length === 0 ? (
            <p className="text-mat-text-dim text-sm">No templates yet. Fill out the form below and save it as a template.</p>
          ) : (
            <div className="space-y-1">
              {templatesArr.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl)}
                  className="w-full text-left px-4 py-3 border border-mat-border hover:border-mat-gold hover:bg-mat-darker transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="text-mat-text text-sm font-medium">{tmpl.title}</p>
                    <p className="text-mat-text-muted text-xs mt-0.5">
                      <span className={SESSION_TYPE_COLORS[tmpl.session_type]}>{tmpl.session_type_display}</span>
                      {' · '}{tmpl.duration}min
                      {tmpl.techniques.length > 0 && ` · ${tmpl.techniques.length} technique${tmpl.techniques.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-mat-gold text-xs opacity-0 group-hover:opacity-100 transition-opacity">Use →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-mat-card border border-mat-border p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Date</label>
              <input {...register('date')} type="date" className="mat-input" />
            </div>
            <div>
              <label className="mat-label">Type</label>
              <select {...register('session_type')} className="mat-input">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">
                Duration (minutes)
                {sessionMode === 'structured' && blocksTotalMinutes > 0 && (
                  <span className="text-mat-gold ml-1 normal-case tracking-normal font-normal">
                    — auto from blocks ({blocksTotalMinutes}m)
                  </span>
                )}
              </label>
              <input
                {...register('duration')}
                type="number"
                className={cn('mat-input', sessionMode === 'structured' && blocksTotalMinutes > 0 && 'opacity-40 pointer-events-none')}
                placeholder="90"
                min="1"
                value={sessionMode === 'structured' && blocksTotalMinutes > 0 ? blocksTotalMinutes : undefined}
                readOnly={sessionMode === 'structured' && blocksTotalMinutes > 0}
              />
              {errors.duration && <p className="text-mat-red-light text-xs mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="mat-label">Title (optional)</label>
              <input {...register('title')} className="mat-input" placeholder="e.g. Friday night class" />
            </div>
          </div>

          {/* Session structure */}
          <div className="border border-mat-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutList size={14} className="text-mat-gold" />
                <span className="text-mat-text text-sm font-medium">Session Structure</span>
              </div>
              <div className="flex items-center gap-1 bg-mat-panel border border-mat-border p-0.5">
                <button
                  type="button"
                  onClick={() => setSessionMode('simple')}
                  className={cn('text-xs px-3 py-1.5 transition-colors', sessionMode === 'simple' ? 'bg-mat-gold text-mat-black font-bold' : 'text-mat-text-muted hover:text-mat-text')}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setSessionMode('structured')}
                  className={cn('text-xs px-3 py-1.5 transition-colors', sessionMode === 'structured' ? 'bg-mat-gold text-mat-black font-bold' : 'text-mat-text-muted hover:text-mat-text')}
                >
                  Structured
                </button>
              </div>
            </div>

            {sessionMode === 'simple' && (
              <p className="text-mat-text-dim text-xs">
                The whole session is logged as one type. Switch to Structured to break it into activity blocks for accurate calorie tracking.
              </p>
            )}

            {sessionMode === 'structured' && (
              <SessionBlockBuilder blocks={sessionBlocks} onChange={setSessionBlocks} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Instructor (optional)</label>
              <input {...register('instructor')} className="mat-input" placeholder="Coach name" />
            </div>
            <div>
              <label className="mat-label">Location (optional)</label>
              <input {...register('gym_location')} className="mat-input" placeholder="Gym" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <RatingPicker label="Performance (1-5)" value={performanceRating ?? null} onChange={(v) => setValue('performance_rating', v)} />
            <RatingPicker label="Energy Level (1-5)" value={energyLevel ?? null} onChange={(v) => setValue('energy_level', v)} />
          </div>

          <div>
            <label className="mat-label">Session Notes</label>
            <textarea {...register('notes')} rows={4} className="mat-input resize-none" placeholder="What did you work on? What clicked? What needs improvement?" />
          </div>
        </div>

        {/* Techniques */}
        <div className="bg-mat-card border border-mat-border p-6 space-y-4">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Techniques Worked</h3>
          {selectedTechniques.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTechniques.map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-mat-panel border border-mat-gold/30 px-3 py-1.5 text-xs">
                  <span className="text-mat-gold font-medium">{t.name}</span>
                  <button type="button" onClick={() => setSelectedTechniques(prev => prev.filter(x => x.id !== t.id))} className="text-mat-text-dim hover:text-mat-red-light transition-colors">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <input value={techSearch} onChange={e => setTechSearch(e.target.value)} className="mat-input" placeholder="Search your techniques..." />
            {techSearch && filteredTechs.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-48 overflow-y-auto">
                {filteredTechs.slice(0, 8).map((t: TechniqueMinimal) => (
                  <button key={t.id} type="button" onClick={() => { setSelectedTechniques(prev => [...prev, t]); setTechSearch('') }}
                    className="w-full text-left px-4 py-2.5 hover:bg-mat-darker text-sm flex items-center gap-3 transition-colors">
                    <span className="text-mat-text">{t.name}</span>
                    <span className="text-mat-text-dim text-xs capitalize">{t.position}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sparring rounds */}
        <div className="bg-mat-card border border-mat-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-mat-red-light" />
            <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Sparring Rounds</h3>
            {draftRounds.length > 0 && (
              <span className="text-mat-text-dim text-xs ml-1">({draftRounds.length})</span>
            )}
          </div>
          {draftRounds.length > 0 && (
            <div className="space-y-1.5">
              {draftRounds.map((r, i) => (
                <RoundCard
                  key={r.id}
                  round={r}
                  onEdit={updated => setDraftRounds(prev => prev.map((x, j) => j === i ? updated : x))}
                  onRemove={() => setDraftRounds(prev => prev.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          )}
          <RoundForm
            initial={{
              id: '',
              partner_name: '',
              partner_belt: 'unknown',
              duration_minutes: 5,
              outcome: 'win',
              is_gi: watchedType === 'gi',
              submissions_attempted: [],
              submissions_hit: [],
              submissions_conceded: [],
              notes: '',
            }}
            isGiDefault={watchedType === 'gi'}
            saveLabel="Add Round"
            onSave={r => setDraftRounds(prev => [...prev, { ...r, id: crypto.randomUUID() }])}
          />
        </div>

        {/* Save as template */}
        <div className="bg-mat-card border border-mat-border p-4">
          <button
            type="button"
            onClick={() => setSaveAsTemplate(v => !v)}
            className="flex items-center gap-2 text-mat-text-muted hover:text-mat-gold text-xs transition-colors"
          >
            <BookTemplate size={13} />
            Save this setup as a template
            <ChevronDown size={11} className={cn('transition-transform', saveAsTemplate ? 'rotate-180' : '')} />
          </button>
          {saveAsTemplate && (
            <div className="mt-3 flex gap-2 items-center">
              <input
                value={templateTitle}
                onChange={e => setTemplateTitle(e.target.value)}
                className="mat-input text-sm flex-1"
                placeholder="Template name (e.g. Monday Gi Class)"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!templateTitle.trim() || createTemplateMutation.isPending}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40 shrink-0"
              >
                {createTemplateMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary px-8 py-3 flex items-center gap-2">
            {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Log Session'}
          </button>
          <Link href="/sessions" className="btn-secondary px-8 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
