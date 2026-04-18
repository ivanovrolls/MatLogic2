'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, templatesApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, getRatingColor } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, ChevronRight, Loader2, BookTemplate, ChevronDown } from 'lucide-react'
import type { TrainingSession, SessionTemplate } from '@/lib/types'
import { cn } from '@/lib/utils'

const SESSION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'open_mat', label: 'Open Mat' },
  { value: 'drilling', label: 'Drilling' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'fundamentals', label: 'Fundamentals' },
]

function RatingDots({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2 h-2 ${i <= rating ? 'bg-mat-gold' : 'bg-mat-muted'}`}
        />
      ))}
    </div>
  )
}

export default function SessionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then(r => r.data?.results || r.data),
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted.')
    },
  })

  const templates: SessionTemplate[] = Array.isArray(templatesData) ? templatesData : []

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', page, typeFilter, search],
    queryFn: () => sessionsApi.list({
      page,
      session_type: typeFilter || undefined,
      search: search || undefined,
    }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted.')
    },
  })

  const sessions: TrainingSession[] = data?.results || []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Your Training Log</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Sessions</h1>
        </div>
        <Link href="/sessions/new" className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs">
          <Plus size={14} /> Log Session
        </Link>
      </div>

      {/* Templates */}
      <div className="bg-mat-card border border-mat-border">
        <button
          onClick={() => setTemplatesOpen(o => !o)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-mat-darker transition-colors group"
        >
          <div className="flex items-center gap-2">
            <BookTemplate size={14} className="text-mat-gold" />
            <span className="text-mat-text-muted text-xs uppercase tracking-widest">Session Templates</span>
            {templates.length > 0 && (
              <span className="text-mat-text-dim text-xs">({templates.length})</span>
            )}
          </div>
          <ChevronDown size={13} className={cn('text-mat-text-dim group-hover:text-mat-gold transition-transform', templatesOpen ? 'rotate-180' : '')} />
        </button>
        {templatesOpen && (
          <div className="border-t border-mat-border">
            {templates.length === 0 ? (
              <div className="px-5 py-6 text-center text-mat-text-dim text-sm">
                No templates yet.{' '}
                <Link href="/sessions/new" className="text-mat-gold hover:underline">Log a session</Link>
                {' '}and save it as a template.
              </div>
            ) : (
              <div className="divide-y divide-mat-border">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="px-5 py-3 flex items-center justify-between group hover:bg-mat-darker transition-colors">
                    <div>
                      <p className="text-mat-text text-sm font-medium">{tmpl.title}</p>
                      <p className="text-mat-text-muted text-xs mt-0.5">
                        <span className={SESSION_TYPE_COLORS[tmpl.session_type]}>{tmpl.session_type_display}</span>
                        {' · '}{tmpl.duration}min
                        {tmpl.techniques.length > 0 && ` · ${tmpl.techniques.length} technique${tmpl.techniques.length !== 1 ? 's' : ''}`}
                        {tmpl.instructor && ` · ${tmpl.instructor}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/sessions/new?template=${tmpl.id}`}
                        className="btn-secondary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Use
                      </Link>
                      <button
                        onClick={() => { if (confirm('Delete this template?')) deleteTemplateMutation.mutate(tmpl.id) }}
                        className="text-mat-text-dim hover:text-mat-red-light opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mat-text-dim" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search sessions..."
            className="mat-input pl-8"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="mat-input w-auto"
        >
          {SESSION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-mat-card border border-mat-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-mat-gold" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-mat-text-dim text-sm">
            No sessions found.{' '}
            <Link href="/sessions/new" className="text-mat-gold hover:underline">Log your first session.</Link>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 border-b border-mat-border text-mat-text-dim text-xs uppercase tracking-widest">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-1">Duration</div>
              <div className="col-span-1">Rounds</div>
              <div className="col-span-2">Rating</div>
              <div className="col-span-1"></div>
            </div>
            {sessions.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 border-b border-mat-border last:border-0 hover:bg-mat-darker transition-colors group">
                <div className="col-span-12 md:col-span-2 text-mat-text-muted text-sm">
                  {formatDate(s.date, 'MMM d, yy')}
                </div>
                <div className="col-span-6 md:col-span-2">
                  <span className={`text-xs font-bold uppercase ${SESSION_TYPE_COLORS[s.session_type] || ''}`}>
                    {s.session_type_display}
                  </span>
                </div>
                <div className="col-span-12 md:col-span-3 text-mat-text text-sm truncate">
                  {s.title || <span className="text-mat-text-dim italic">No title</span>}
                </div>
                <div className="col-span-4 md:col-span-1 text-mat-text-muted text-sm">
                  {formatDuration(s.duration)}
                </div>
                <div className="col-span-4 md:col-span-1 text-mat-text-muted text-sm">
                  {s.round_count > 0 ? s.round_count : '—'}
                </div>
                <div className="col-span-4 md:col-span-2">
                  <RatingDots rating={s.performance_rating} />
                </div>
                <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Delete this session?')) deleteMutation.mutate(s.id)
                    }}
                    className="text-mat-text-dim hover:text-mat-red-light transition-colors opacity-0 group-hover:opacity-100 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                  <Link href={`/sessions/${s.id}`} className="text-mat-text-dim hover:text-mat-gold transition-colors p-1">
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-mat-text-muted text-xs">{data.count} total sessions</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!data.previous}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data.next}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
