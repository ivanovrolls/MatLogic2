'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { techniquesApi } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChevronLeft, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { POSITION_LABELS, TYPE_LABELS } from '@/lib/utils'
import type { Technique } from '@/lib/types'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  position: z.string().min(1, 'Position required'),
  technique_type: z.string().min(1, 'Type required'),
  description: z.string().optional(),
  notes: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5),
  video_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function EditTechniquePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const { data: technique, isLoading } = useQuery<Technique>({
    queryKey: ['technique', id],
    queryFn: () => techniquesApi.get(Number(id)).then(r => r.data),
  })

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (technique) {
      reset({
        name: technique.name,
        position: technique.position,
        technique_type: technique.technique_type,
        description: technique.description || '',
        notes: technique.notes || '',
        difficulty: technique.difficulty,
        video_url: technique.video_url || '',
      })
      setTags(technique.tags || [])
    }
  }, [technique, reset])

  const difficulty = watch('difficulty')

  const mutation = useMutation({
    mutationFn: (data: object) => techniquesApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] })
      queryClient.invalidateQueries({ queryKey: ['technique', id] })
      toast.success('Technique updated.')
      router.push(`/techniques/${id}`)
    },
    onError: () => toast.error('Failed to update technique.'),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ ...data, tags })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput('') }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/techniques/${id}`} className="text-mat-text-muted hover:text-mat-gold transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Technique Database</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Edit Technique</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-mat-card border border-mat-border p-6 space-y-5">
          <div>
            <label className="mat-label">Technique Name</label>
            <input {...register('name')} className="mat-input" />
            {errors.name && <p className="text-mat-red-light text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Position</label>
              <select {...register('position')} className="mat-input">
                <option value="">Select position...</option>
                {Object.entries(POSITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.position && <p className="text-mat-red-light text-xs mt-1">{errors.position.message}</p>}
            </div>
            <div>
              <label className="mat-label">Type</label>
              <select {...register('technique_type')} className="mat-input">
                <option value="">Select type...</option>
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.technique_type && <p className="text-mat-red-light text-xs mt-1">{errors.technique_type.message}</p>}
            </div>
          </div>

          <div>
            <label className="mat-label">Difficulty (1-5)</label>
            <div className="flex items-center gap-3">
              <input {...register('difficulty')} type="range" min="1" max="5" className="w-32 accent-mat-gold" />
              <span className="font-display text-2xl text-mat-gold">{difficulty}</span>
              <span className="text-mat-text-muted text-xs">
                {['', 'Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'][difficulty]}
              </span>
            </div>
          </div>

          <div>
            <label className="mat-label">Description</label>
            <textarea {...register('description')} rows={3} className="mat-input resize-none" />
          </div>

          <div>
            <label className="mat-label">Personal Notes</label>
            <textarea {...register('notes')} rows={3} className="mat-input resize-none" />
          </div>

          <div>
            <label className="mat-label">Video URL (optional)</label>
            <input {...register('video_url')} className="mat-input" placeholder="https://youtube.com/..." />
            {errors.video_url && <p className="text-mat-red-light text-xs mt-1">{errors.video_url.message}</p>}
          </div>

          <div>
            <label className="mat-label">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-mat-panel border border-mat-border px-2.5 py-1 text-xs">
                  <span className="text-mat-text-muted">{tag}</span>
                  <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                    <X size={10} className="text-mat-text-dim hover:text-mat-red-light" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                className="mat-input flex-1"
                placeholder="Add a tag (press Enter)"
              />
              <button type="button" onClick={addTag} className="btn-secondary px-3">
                <Plus size={14} />
              </button>
            </div>
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
          <Link href={`/techniques/${id}`} className="btn-secondary px-8 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
