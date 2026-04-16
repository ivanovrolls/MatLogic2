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

export default function EditSessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedTechniques, setSelectedTechniques] = useState<TechniqueMinimal[]>([])
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
        energy_level: session.energy_level,
        instructor: session.instructor || '',
        gym_location: session.gym_location || '',
      })
      setSelectedTechniques(session.techniques_worked)
    }
  }, [session, reset])

  const performanceRating = watch('performance_rating')
  const energyLevel = watch('energy_level')

  const { data: techniques } = useQuery({
    queryKey: ['techniques', 'all'],
    queryFn: () => techniquesApi.list({ page_size: 200 }).then(r => r.data.results || r.data),
  })

  const filteredTechs = (techniques || []).filter((t: TechniqueMinimal) =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) &&
    !selectedTechniques.find(s => s.id === t.id)
  )

  const mutation = useMutation({
    mutationFn: (data: object) => sessionsApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      toast.success('Session updated.')
      router.push(`/sessions/${id}`)
    },
    onError: () => toast.error('Failed to update session.'),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      techniques_worked_ids: selectedTechniques.map(t => t.id),
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
              <input {...register('duration')} type="number" className="mat-input" min="1" />
              {errors.duration && <p className="text-mat-red-light text-xs mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="mat-label">Title (optional)</label>
              <input {...register('title')} className="mat-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Instructor (optional)</label>
              <input {...register('instructor')} className="mat-input" />
            </div>
            <div>
              <label className="mat-label">Location (optional)</label>
              <input {...register('gym_location')} className="mat-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <RatingPicker
              label="Performance (1-5)"
              value={performanceRating ?? null}
              onChange={v => setValue('performance_rating', v)}
            />
            <RatingPicker
              label="Energy Level (1-5)"
              value={energyLevel ?? null}
              onChange={v => setValue('energy_level', v)}
            />
          </div>

          <div>
            <label className="mat-label">Session Notes</label>
            <textarea {...register('notes')} rows={4} className="mat-input resize-none" />
          </div>
        </div>

        <div className="bg-mat-card border border-mat-border p-6 space-y-4">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Techniques Worked</h3>
          {selectedTechniques.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTechniques.map(t => (
                <div key={t.id} className="flex items-center gap-2 bg-mat-panel border border-mat-gold/30 px-3 py-1.5 text-xs">
                  <span className="text-mat-gold font-medium">{t.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTechniques(prev => prev.filter(x => x.id !== t.id))}
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
              className="mat-input"
              placeholder="Search your techniques..."
            />
            {techSearch && filteredTechs.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-48 overflow-y-auto">
                {filteredTechs.slice(0, 8).map((t: TechniqueMinimal) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSelectedTechniques(prev => [...prev, t]); setTechSearch('') }}
                    className="w-full text-left px-4 py-2.5 hover:bg-mat-darker text-sm flex items-center gap-3 transition-colors"
                  >
                    <span className="text-mat-text">{t.name}</span>
                    <span className="text-mat-text-dim text-xs capitalize">{t.position}</span>
                  </button>
                ))}
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
