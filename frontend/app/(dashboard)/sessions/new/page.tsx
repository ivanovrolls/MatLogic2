'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, techniquesApi, templatesApi } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ChevronLeft, Loader2, Plus, X, BookTemplate, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { TechniqueMinimal, SessionTemplate } from '@/lib/types'
import { SESSION_TYPE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session logged.')
      router.push(`/sessions/${res.data.id}`)
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

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      techniques_worked_ids: selectedTechniques.map(t => t.id),
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
              <label className="mat-label">Duration (minutes)</label>
              <input {...register('duration')} type="number" className="mat-input" placeholder="90" min="1" />
              {errors.duration && <p className="text-mat-red-light text-xs mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="mat-label">Title (optional)</label>
              <input {...register('title')} className="mat-input" placeholder="e.g. Friday night class" />
            </div>
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
