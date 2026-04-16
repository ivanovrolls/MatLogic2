'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { techniquesApi } from '@/lib/api'
import { POSITION_LABELS, TYPE_LABELS } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, ChevronRight, Loader2, Star } from 'lucide-react'
import type { Technique } from '@/lib/types'

const POSITIONS = Object.entries(POSITION_LABELS)
const TYPES = Object.entries(TYPE_LABELS)

const TYPE_COLORS: Record<string, string> = {
  submission: 'text-mat-red-light',
  sweep: 'text-mat-gold',
  pass: 'text-blue-400',
  takedown: 'text-orange-400',
  escape: 'text-green-400',
  guard_retention: 'text-purple-400',
  transition: 'text-cyan-400',
  control: 'text-indigo-400',
  setup: 'text-pink-400',
  counter: 'text-amber-400',
}

function DifficultyBar({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`w-3 h-1.5 ${n <= value ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
      ))}
    </div>
  )
}

export default function TechniquesPage() {
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['techniques', positionFilter, typeFilter, search],
    queryFn: () => techniquesApi.list({
      position: positionFilter || undefined,
      technique_type: typeFilter || undefined,
      search: search || undefined,
      page_size: 100,
    }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => techniquesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] })
      toast.success('Technique removed.')
    },
  })

  const techniques: Technique[] = data?.results || (Array.isArray(data) ? data : [])

  // Group by position
  const grouped = techniques.reduce((acc, t) => {
    const pos = t.position
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(t)
    return acc
  }, {} as Record<string, Technique[]>)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Your Arsenal</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Techniques</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/techniques/new" className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs">
            <Plus size={14} /> Add Technique
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mat-text-dim" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search techniques..."
            className="mat-input pl-8"
          />
        </div>
        <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="mat-input w-auto">
          <option value="">All Positions</option>
          {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="mat-input w-auto">
          <option value="">All Types</option>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : techniques.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-mat-text-dim text-sm mb-3">No techniques in your database yet.</p>
          <Link href="/techniques/new" className="btn-primary px-6 py-2.5 text-xs">Add Your First Technique</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([position, techs]) => (
            <div key={position}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">
                  {POSITION_LABELS[position] || position}
                </h2>
                <span className="text-mat-text-dim text-xs">({techs.length})</span>
                <div className="flex-1 h-px bg-mat-border" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {techs.map(t => (
                  <div
                    key={t.id}
                    className="bg-mat-card border border-mat-border hover:border-mat-gold/40 transition-colors group relative"
                  >
                    <Link href={`/techniques/${t.id}`} className="block p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-mat-text font-semibold text-sm leading-tight pr-2">{t.name}</p>
                        <span className={`text-xs font-bold uppercase shrink-0 ${TYPE_COLORS[t.technique_type] || 'text-mat-text-muted'}`}>
                          {t.type_display}
                        </span>
                      </div>
                      <DifficultyBar value={t.difficulty} />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-mat-text-dim text-xs">{t.times_drilled} drills</span>
                        {t.tags.length > 0 && (
                          <div className="flex gap-1">
                            {t.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs text-mat-text-dim bg-mat-panel px-1.5 py-0.5">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => { if (confirm('Delete this technique?')) deleteMutation.mutate(t.id) }}
                      className="absolute top-3 right-3 text-mat-text-dim hover:text-mat-red-light transition-colors opacity-0 group-hover:opacity-100 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
