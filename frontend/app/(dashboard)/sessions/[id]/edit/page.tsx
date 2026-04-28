'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, techniquesApi } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChevronLeft, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import type { TechniqueMinimal, TrainingSession } from '@/lib/types'

const SESSION_TYPES = [
  { value: 'gi', label: 'Taught Class - Gi' },
  { value: 'nogi', label: 'Taught Class - No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'drilling', label: 'Drilling Only' },
  { value: 'standup_grappling', label: 'Standup Grappling' },
  { value: 'competition', label: 'Competition Class' },
  { value: 'coaching', label: 'Coaching' },
]

const schema = z.object({
  date: z.string(),
  session_type: z.enum(['gi', 'nogi', 'open_mat', 'competition', 'drilling', 'standup_grappling', 'coaching', 'wrestling', 'fundamentals']),
  duration: z.coerce.number().min(1, 'Enter duration'),
  title: z.string().optional(),
  notes: z.string().optional(),
  performance_rating: z.coerce.number().min(1).max(5).optional().nullable(),
  instructor: z.string().optional(),
  gym_location: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface SelectedTechnique {
  id: number | null
  name: string
  position?: string
}

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

export default function EditSessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedTechniques, setSelectedTechniques] = useState<SelectedTechnique[]>([])
  const [techSearch, setTechSearch] = useState('')

  const { data: session, isLoading } = useQuery<TrainingSession>({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.get(Number(id)).then(r => r.data),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (session) {
      reset({
        date: session.date,
        session_type: session.session_type,
        duration: session.duration,
        title: session.title || '',
        notes: session.notes || '',
        performance_rating: session.performance_rating,
        instructor: session.instructor || '',
        gym_location: session.gym_location || '',
      })
      setSelectedTechniques(session.techniques_worked.map(t => ({
        id: t.id,
        name: t.name,
        position: t.position,
      })))
    }
  }, [session, reset])

  const performanceRating = watch('performance_rating')

  const { data: arsenal } = useQuery({
    queryKey: ['techniques', 'all'],
    queryFn: () => techniquesApi.list({ page_size: 200 }).then(r => r.data.results || r.data),
  })

  const filteredArsenal = (arsenal || []).filter((t: TechniqueMinimal) =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) &&
    !selectedTechniques.find(s => s.id === t.id)
  )

  const showAddNew = techSearch.trim() &&
    !(arsenal || []).find((t: TechniqueMinimal) => t.name.toLowerCase() === techSearch.trim().toLowerCase()) &&
    !selectedTechniques.find(s => s.name.toLowerCase() === techSearch.trim().toLowerCase())

  const addFreeText = () => {
    const name = techSearch.trim()
    if (!name) return
    setSelectedTechniques(prev => [...prev, { id: null, name }])
    setTechSearch('')
  }

  const mutation = useMutation({
    mutationFn: async (data: object) => sessionsApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      toast.success('Session updated.')
      router.push(`/sessions/${id}`)
    },
    onError: () => toast.error('Failed to update session.'),
  })

  const onSubmit = async (data: FormData) => {
    const resolvedTechniques = await Promise.all(
      selectedTechniques.map(async t => {
        if (t.id !== null) return t.id
        const res = await techniquesApi.create({
          name: t.name,
          position: 'other',
          technique_type: 'control',
        })
        return res.data.id as number
      })
    )

    mutation.mutate({
      ...data,
      techniques_worked_ids: resolvedTechniques,
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/sessions/${id}`} className="text-mat-text-muted hover:text-mat-gold transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Training Log</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Edit Session</h1>
        </div>
      </div>

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
                {SESSION_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Duration (minutes)</label>
              <input {...register('duration')} type="number" className="mat-input" min="1" />
              {errors.duration && <p className="text-mat-red-light text-xs mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="mat-label">Title <span className="text-mat-text-dim font-normal normal-case tracking-normal">(optional)</span></label>
              <input {...register('title')} className="mat-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Instructor <span className="text-mat-text-dim font-normal normal-case tracking-normal">(optional)</span></label>
              <input {...register('instructor')} className="mat-input" />
            </div>
            <div>
              <label className="mat-label">Location <span className="text-mat-text-dim font-normal normal-case tracking-normal">(optional)</span></label>
              <input {...register('gym_location')} className="mat-input" />
            </div>
          </div>

          <RatingPicker
            label="Perceived Performance (1–5)"
            value={performanceRating ?? null}
            onChange={v => setValue('performance_rating', v)}
          />

          <div>
            <label className="mat-label">Session Notes</label>
            <textarea {...register('notes')} rows={4} className="mat-input resize-none" />
          </div>
        </div>

        <div className="bg-mat-card border border-mat-border p-6 space-y-4">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Techniques Worked</h3>
          {selectedTechniques.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTechniques.map((t, i) => (
                <div key={i} className="flex items-center gap-2 bg-mat-panel border border-mat-gold/30 px-3 py-1.5 text-xs">
                  <span className="text-mat-gold font-medium">{t.name}</span>
                  {t.id === null && <span className="text-mat-text-dim">(new)</span>}
                  <button
                    type="button"
                    onClick={() => setSelectedTechniques(prev => prev.filter((_, j) => j !== i))}
                    className="text-mat-text-dim hover:text-mat-red-light transition-colors"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              value={techSearch}
              onChange={e => setTechSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (filteredArsenal.length > 0) {
                    setSelectedTechniques(prev => [...prev, { id: filteredArsenal[0].id, name: filteredArsenal[0].name, position: filteredArsenal[0].position }])
                    setTechSearch('')
                  } else if (showAddNew) {
                    addFreeText()
                  }
                }
              }}
              className="mat-input"
              placeholder="Search your techniques or type a new name..."
            />
            {techSearch && (filteredArsenal.length > 0 || showAddNew) && (
              <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-48 overflow-y-auto">
                {filteredArsenal.slice(0, 8).map((t: TechniqueMinimal) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTechniques(prev => [...prev, { id: t.id, name: t.name, position: t.position }])
                      setTechSearch('')
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-mat-darker text-sm flex items-center gap-3 transition-colors"
                  >
                    <span className="text-mat-text">{t.name}</span>
                    <span className="text-mat-text-dim text-xs capitalize">{t.position}</span>
                  </button>
                ))}
                {showAddNew && (
                  <button type="button" onClick={addFreeText}
                    className="w-full text-left px-4 py-2.5 hover:bg-mat-darker text-sm flex items-center gap-2 transition-colors border-t border-mat-border">
                    <Plus size={11} className="text-mat-gold shrink-0" />
                    <span className="text-mat-text-muted">Add <span className="text-mat-text font-medium">"{techSearch.trim()}"</span> as new technique</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary px-8 py-3 flex items-center gap-2"
          >
            {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
          <Link href={`/sessions/${id}`} className="btn-secondary px-8 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
