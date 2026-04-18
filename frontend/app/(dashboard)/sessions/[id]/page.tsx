'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi, sparringApi } from '@/lib/api'
import { formatDate, formatDuration, SESSION_TYPE_COLORS, OUTCOME_COLORS, BELT_COLORS } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronLeft, Trash2, Pencil, Swords, Plus, Loader2, Link2, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
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

function SessionRoundRow({ round: r, onUnlink }: { round: SparringRound; onUnlink: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const hasPositions = r.dominant_positions.length > 0 || r.positions_conceded.length > 0
  const hasSubs = r.submissions_attempted.length > 0 || r.submissions_conceded.length > 0
  const hasCounts = r.sweeps_completed > 0 || r.takedowns_completed > 0

  return (
    <div>
      <div
        className="px-6 py-3 flex items-center justify-between group hover:bg-mat-darker transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-bold uppercase ${OUTCOME_COLORS[r.outcome]}`}>{r.outcome}</span>
            <span className="text-mat-text font-medium text-sm">{r.partner_name}</span>
            <span className="text-mat-text-muted text-xs capitalize">{r.partner_belt}</span>
            <span className="text-mat-text-muted text-xs">{r.duration_minutes}min</span>
            <span className="text-mat-text-dim text-xs">{r.is_gi ? 'Gi' : 'No-Gi'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <ChevronDown
            size={13}
            className={`text-mat-text-dim transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
          <button
            onClick={e => { e.stopPropagation(); onUnlink() }}
            className="text-mat-text-dim hover:text-mat-red-light opacity-0 group-hover:opacity-100 transition-all p-1 text-xs"
            title="Unlink from session"
          >
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-4 pt-1 bg-mat-darker border-t border-mat-border space-y-2">
          {hasPositions && (
            <div className="grid grid-cols-2 gap-3">
              {r.dominant_positions.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Positions Held</p>
                  <div className="flex flex-wrap gap-1">
                    {r.dominant_positions.map(p => (
                      <span key={p} className="text-xs bg-mat-panel border border-mat-green-light/30 text-mat-green-light px-2 py-0.5 capitalize">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {r.positions_conceded.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Positions Conceded</p>
                  <div className="flex flex-wrap gap-1">
                    {r.positions_conceded.map(p => (
                      <span key={p} className="text-xs bg-mat-panel border border-mat-red-light/30 text-mat-red-light px-2 py-0.5 capitalize">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasSubs && (
            <div className="grid grid-cols-2 gap-3">
              {r.submissions_attempted.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Submissions Attempted</p>
                  <div className="flex flex-wrap gap-1">
                    {r.submissions_attempted.map(s => (
                      <span key={s} className="text-xs bg-mat-panel border border-mat-green-light/30 text-mat-green-light px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {r.submissions_conceded.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Tapped To</p>
                  <div className="flex flex-wrap gap-1">
                    {r.submissions_conceded.map(s => (
                      <span key={s} className="text-xs bg-mat-panel border border-mat-red-light/30 text-mat-red-light px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasCounts && (
            <div className="flex gap-4">
              {r.sweeps_completed > 0 && (
                <span className="text-xs text-mat-text-muted">
                  <span className="text-mat-gold font-bold">{r.sweeps_completed}</span> sweep{r.sweeps_completed !== 1 ? 's' : ''}
                </span>
              )}
              {r.takedowns_completed > 0 && (
                <span className="text-xs text-mat-text-muted">
                  <span className="text-mat-gold font-bold">{r.takedowns_completed}</span> takedown{r.takedowns_completed !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {r.notes && (
            <p className="text-mat-text-dim text-xs italic leading-relaxed">{r.notes}</p>
          )}

          {!hasPositions && !hasSubs && !hasCounts && !r.notes && (
            <p className="text-mat-text-dim text-xs">No additional details recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [roundSearch, setRoundSearch] = useState('')

  const { data: session, isLoading } = useQuery<TrainingSession>({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.get(Number(id)).then(r => r.data),
  })

  const { data: rounds } = useQuery<{ results: SparringRound[] }>({
    queryKey: ['sparring', 'session', id],
    queryFn: () => sparringApi.list({ session: id }).then(r => r.data),
  })

  const { data: allRounds } = useQuery<{ results: SparringRound[] } | SparringRound[]>({
    queryKey: ['sparring', 'all'],
    queryFn: () => sparringApi.list({ page_size: 200 }).then(r => r.data),
    enabled: showLinkPicker,
  })

  const deleteMutation = useMutation({
    mutationFn: () => sessionsApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted.')
      router.push('/sessions')
    },
  })

  const linkMutation = useMutation({
    mutationFn: (roundId: number) => sparringApi.update(roundId, { session: Number(id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparring', 'session', id] })
      queryClient.invalidateQueries({ queryKey: ['sparring', 'all'] })
      toast.success('Round linked to session.')
    },
    onError: () => toast.error('Failed to link round.'),
  })

  const unlinkMutation = useMutation({
    mutationFn: (roundId: number) => sparringApi.update(roundId, { session: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sparring', 'session', id] })
      queryClient.invalidateQueries({ queryKey: ['sparring', 'all'] })
      toast.success('Round removed from session.')
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
  }

  if (!session) {
    return <div className="text-mat-text-muted py-20 text-center">Session not found.</div>
  }

  const sparringRounds: SparringRound[] = (rounds as any)?.results || (Array.isArray(rounds) ? rounds : [])
  const allRoundsArr: SparringRound[] = (allRounds as any)?.results || (Array.isArray(allRounds) ? allRounds : [])

  // Rounds not already linked to this session
  const linkedIds = new Set(sparringRounds.map(r => r.id))
  const linkableRounds = allRoundsArr
    .filter(r => !linkedIds.has(r.id))
    .filter(r =>
      roundSearch === '' ||
      r.partner_name.toLowerCase().includes(roundSearch.toLowerCase()) ||
      r.date.includes(roundSearch)
    )

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
          <Link href={`/sessions/${id}/edit`} className="btn-secondary px-3 py-1.5 flex items-center gap-1.5 text-xs">
            <Pencil size={12} /> Edit
          </Link>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowLinkPicker(v => !v); setRoundSearch('') }}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <Link2 size={12} /> Link Existing
            </button>
            <Link
              href={`/sparring?session=${id}`}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <Plus size={12} /> New Round
            </Link>
          </div>
        </div>

        {/* Link existing picker */}
        {showLinkPicker && (
          <div className="border-b border-mat-border p-4 space-y-3 bg-mat-darker animate-slide-up">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Select a round to link</p>
            <input
              value={roundSearch}
              onChange={e => setRoundSearch(e.target.value)}
              className="mat-input text-sm"
              placeholder="Search by partner name or date..."
              autoFocus
            />
            <div className="max-h-52 overflow-y-auto divide-y divide-mat-border border border-mat-border">
              {linkableRounds.length === 0 ? (
                <p className="text-mat-text-dim text-xs text-center py-6">
                  {allRoundsArr.length === 0 ? 'No rounds logged yet.' : 'All rounds are already linked.'}
                </p>
              ) : (
                linkableRounds.map(r => (
                  <button
                    key={r.id}
                    onClick={() => linkMutation.mutate(r.id)}
                    disabled={linkMutation.isPending}
                    className="w-full text-left px-4 py-2.5 hover:bg-mat-card transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase ${OUTCOME_COLORS[r.outcome]}`}>{r.outcome}</span>
                      <span className="text-mat-text text-sm font-medium">{r.partner_name}</span>
                      <span className="text-mat-text-muted text-xs capitalize">{r.partner_belt}</span>
                      <span className="text-mat-text-dim text-xs">{r.duration_minutes}min</span>
                    </div>
                    <span className="text-mat-text-dim text-xs">{formatDate(r.date, 'MMM d, yyyy')}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {sparringRounds.length === 0 ? (
          <div className="py-8 text-center text-mat-text-dim text-sm">
            No rounds logged for this session.
          </div>
        ) : (
          <div className="divide-y divide-mat-border">
            {sparringRounds.map(r => (
              <SessionRoundRow
                key={r.id}
                round={r}
                onUnlink={() => { if (confirm('Remove this round from the session?')) unlinkMutation.mutate(r.id) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
