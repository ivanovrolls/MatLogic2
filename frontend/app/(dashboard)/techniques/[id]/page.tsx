'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { techniquesApi } from '@/lib/api'
import { formatDate, POSITION_LABELS, TYPE_LABELS } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronLeft, Trash2, ExternalLink, Target, Loader2, Play, Edit2 } from 'lucide-react'
import type { Technique } from '@/lib/types'

function getEmbedInfo(url: string): { type: 'youtube' | 'vimeo' | 'direct' | 'external'; src: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { type: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}?rel=0` }

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'direct', src: url }

  return { type: 'external', src: url }
}

function VideoEmbed({ url }: { url: string }) {
  const { type, src } = getEmbedInfo(url)

  if (type === 'youtube' || type === 'vimeo') {
    return (
      <div className="bg-mat-card border border-mat-border">
        <div className="px-6 py-4 border-b border-mat-border flex items-center gap-2">
          <Play size={14} className="text-mat-gold" />
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Reference Video</h3>
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={src}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Reference video"
          />
        </div>
      </div>
    )
  }

  if (type === 'direct') {
    return (
      <div className="bg-mat-card border border-mat-border">
        <div className="px-6 py-4 border-b border-mat-border flex items-center gap-2">
          <Play size={14} className="text-mat-gold" />
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Reference Video</h3>
        </div>
        <video src={src} controls className="w-full" />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 btn-secondary px-5 py-2.5 w-fit text-xs"
    >
      <ExternalLink size={13} />
      View Reference Video
    </a>
  )
}

const TYPE_COLORS: Record<string, string> = {
  submission: 'bg-mat-red/20 text-mat-red-light border-mat-red/30',
  sweep: 'bg-mat-gold/10 text-mat-gold border-mat-gold/30',
  pass: 'bg-blue-900/30 text-blue-400 border-blue-800/40',
  takedown: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
  escape: 'bg-green-900/30 text-green-400 border-green-800/40',
  guard_retention: 'bg-purple-900/30 text-purple-400 border-purple-800/40',
  transition: 'bg-cyan-900/30 text-cyan-400 border-cyan-800/40',
  control: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/40',
  setup: 'bg-pink-900/30 text-pink-400 border-pink-800/40',
  counter: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
}

export default function TechniqueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: technique, isLoading } = useQuery<Technique>({
    queryKey: ['technique', id],
    queryFn: () => techniquesApi.get(Number(id)).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => techniquesApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] })
      toast.success('Technique removed.')
      router.push('/techniques')
    },
  })

  const drillMutation = useMutation({
    mutationFn: () => techniquesApi.incrementDrills(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technique', id] })
      toast.success('Drill count updated.')
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
  }

  if (!technique) {
    return <div className="text-mat-text-muted py-20 text-center">Technique not found.</div>
  }

  return (
    <div className="max-w-2xl animate-fade-in space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/techniques" className="text-mat-text-muted hover:text-mat-gold transition-colors mt-1">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Technique</p>
            <h1 className="font-display text-3xl tracking-wider text-mat-text uppercase">{technique.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Link href={`/techniques/${id}/edit`} className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs">
            <Edit2 size={12} /> Edit
          </Link>
          <button
            onClick={() => { if (confirm('Delete this technique?')) deleteMutation.mutate() }}
            className="text-mat-text-dim hover:text-mat-red-light transition-colors p-2"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        <span className="border px-3 py-1 text-xs font-bold uppercase text-mat-text-muted border-mat-border">
          {POSITION_LABELS[technique.position] || technique.position}
        </span>
        <span className={`border px-3 py-1 text-xs font-bold uppercase ${TYPE_COLORS[technique.technique_type] || 'text-mat-text-muted border-mat-border'}`}>
          {technique.type_display}
        </span>
        {technique.tags.map(tag => (
          <span key={tag} className="border border-mat-border px-2 py-1 text-xs text-mat-text-dim">{tag}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-mat-card border border-mat-border p-4 text-center">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Difficulty</p>
          <p className="font-display text-3xl text-mat-gold">{technique.difficulty}</p>
          <div className="flex justify-center gap-0.5 mt-1">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`w-3 h-1 ${n <= technique.difficulty ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
            ))}
          </div>
        </div>
        <div className="bg-mat-card border border-mat-border p-4 text-center">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Times Drilled</p>
          <p className="font-display text-3xl text-mat-gold">{technique.times_drilled}</p>
        </div>
        <div className="bg-mat-card border border-mat-border p-4 text-center">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Added</p>
          <p className="text-mat-text text-sm font-semibold">{formatDate(technique.created_at, 'MMM d')}</p>
        </div>
      </div>

      {/* Drill button */}
      <button
        onClick={() => drillMutation.mutate()}
        disabled={drillMutation.isPending}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        <Target size={14} />
        {drillMutation.isPending ? 'Updating...' : 'Mark as Drilled Today'}
      </button>

      {/* Description */}
      {technique.description && (
        <div className="bg-mat-card border border-mat-border p-6">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase mb-3">Description</h3>
          <p className="text-mat-text-muted text-sm leading-relaxed whitespace-pre-wrap">{technique.description}</p>
        </div>
      )}

      {/* Notes */}
      {technique.notes && (
        <div className="bg-mat-card border border-mat-border p-6">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase mb-3">Personal Notes</h3>
          <p className="text-mat-text-muted text-sm leading-relaxed whitespace-pre-wrap">{technique.notes}</p>
        </div>
      )}

      {/* Video */}
      {technique.video_url && <VideoEmbed url={technique.video_url} />}
    </div>
  )
}
