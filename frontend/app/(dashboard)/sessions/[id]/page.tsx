'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, sparringApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, OUTCOME_COLORS } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronLeft, Trash2, Edit2, Swords, Plus, Loader2 } from 'lucide-react'
import type { TrainingSession, SparringRound } from '@/lib/types'

function RatingDisplay({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={`w-5 h-2 ${n <= value ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
        ))}
        <span className="text-mat-gold text-sm ml-1 font-bold">{value}/5</span>
      </div>
    </div>
  )
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery<TrainingSession>({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.get(Number(id)).then(r => r.data),
  })

  const { data: rounds } = useQuery<{ results: SparringRound[] }>({
    queryKey: ['sparring', 'session', id],
    queryFn: () => sparringApi.list({ session: id }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sessionsApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted.')
      router.push('/sessions')
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
  }

  if (!session) {
    return <div className="text-mat-text-muted py-20 text-center">Session not found.</div>
  }

  const sparringRounds: SparringRound[] = rounds?.results || (Array.isArray(rounds) ? rounds : [])

  return (
    <div className="max-w-3xl animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/sessions" className="text-mat-text-muted hover:text-mat-gold transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Training Session</p>
            <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">
              {session.title || formatDate(session.date)}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (confirm('Delete this session?')) deleteMutation.mutate() }}
            className="btn-ghost text-mat-red-light hover:text-mat-red p-2"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-mat-card border border-mat-border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Date</p>
            <p className="text-mat-text font-semibold">{formatDate(session.date, 'EEEE, MMM d yyyy')}</p>
          </div>
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Type</p>
            <p className={`font-bold uppercase text-sm ${SESSION_TYPE_COLORS[session.session_type]}`}>
              {session.session_type_display}
            </p>
          </div>
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Duration</p>
            <p className="text-mat-text font-semibold">{formatDuration(session.duration)}</p>
          </div>
          <div>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Rounds</p>
            <p className="text-mat-text font-semibold">{session.round_count || '—'}</p>
          </div>
        </div>

        {(session.instructor || session.gym_location) && (
          <div className="grid grid-cols-2 gap-5 mt-4 pt-4 border-t border-mat-border">
            {session.instructor && (
              <div>
                <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Instructor</p>
                <p className="text-mat-text text-sm">{session.instructor}</p>
              </div>
            )}
            {session.gym_location && (
              <div>
                <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Location</p>
                <p className="text-mat-text text-sm">{session.gym_location}</p>
              </div>
            )}
          </div>
        )}

        {(session.performance_rating || session.energy_level) && (
          <div className="grid grid-cols-2 gap-5 mt-4 pt-4 border-t border-mat-border">
            <RatingDisplay label="Performance" value={session.performance_rating} />
            <RatingDisplay label="Energy Level" value={session.energy_level} />
          </div>
        )}
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="bg-mat-card border border-mat-border p-6">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase mb-3">Notes</h3>
          <p className="text-mat-text-muted text-sm leading-relaxed whitespace-pre-wrap">
            {session.notes}
          </p>
        </div>
      )}

      {/* Techniques */}
      {session.techniques_worked.length > 0 && (
        <div className="bg-mat-card border border-mat-border p-6">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase mb-4">
            Techniques Worked ({session.techniques_worked.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {session.techniques_worked.map(t => (
              <Link
                key={t.id}
                href={`/techniques/${t.id}`}
                className="bg-mat-panel border border-mat-border hover:border-mat-gold px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
              >
                <span className="text-mat-text-muted text-xs capitalize">{t.position} ·</span>
                <span className="text-mat-text font-medium">{t.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sparring rounds */}
      <div className="bg-mat-card border border-mat-border">
        <div className="px-6 py-4 border-b border-mat-border flex items-center justify-between">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase flex items-center gap-2">
            <Swords size={15} className="text-mat-red-light" />
            Sparring Rounds
          </h3>
          <Link
            href={`/sparring?session=${id}`}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <Plus size={12} /> Add Round
          </Link>
        </div>

        {sparringRounds.length === 0 ? (
          <div className="py-8 text-center text-mat-text-dim text-sm">
            No rounds logged for this session.
          </div>
        ) : (
          <div className="divide-y divide-mat-border">
            {sparringRounds.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <span className="text-mat-text font-medium text-sm">{r.partner_name}</span>
                  <span className="text-mat-text-muted text-xs ml-2 capitalize">{r.partner_belt}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-mat-text-muted text-xs">{r.duration_minutes}min</span>
                  <span className={`text-xs font-bold uppercase ${OUTCOME_COLORS[r.outcome]}`}>
                    {r.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
