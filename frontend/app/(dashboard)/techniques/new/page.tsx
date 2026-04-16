'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { techniquesApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ChevronLeft, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { POSITION_LABELS, TYPE_LABELS } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  position: z.string().min(1, 'Position required'),
  technique_type: z.string().min(1, 'Type required'),
  description: z.string().optional(),
  notes: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5).default(3),
  video_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function NewTechniquePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { difficulty: 3 },
  })

  const difficulty = watch('difficulty')

  const mutation = useMutation({
    mutationFn: (data: object) => techniquesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] })
      toast.success('Technique added to your arsenal.')
      router.push(`/techniques/${res.data.id}`)
    },
    onError: () => toast.error('Failed to save technique.'),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ ...data, tags })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/techniques" className="text-mat-text-muted hover:text-mat-gold transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Technique Database</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Add Technique</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-mat-card border border-mat-border p-6 space-y-5">
          <div>
            <label className="mat-label">Technique Name</label>
            <input {...register('name')} className="mat-input" placeholder="e.g. Triangle Choke from Closed Guard" />
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
            <textarea
              {...register('description')}
              rows={3}
              className="mat-input resize-none"
              placeholder="Step-by-step breakdown of the technique..."
            />
          </div>

          <div>
            <label className="mat-label">Personal Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mat-input resize-none"
              placeholder="Key details, setups, common mistakes..."
            />
          </div>

          <div>
            <label className="mat-label">Video URL (optional)</label>
            <input {...register('video_url')} className="mat-input" placeholder="https://youtube.com/..." />
            {errors.video_url && <p className="text-mat-red-light text-xs mt-1">{errors.video_url.message}</p>}
          </div>

          {/* Tags */}
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
            {mutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : 'Add to Arsenal'}
          </button>
          <Link href="/techniques" className="btn-secondary px-8 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
