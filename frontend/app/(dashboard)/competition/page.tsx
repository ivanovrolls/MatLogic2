'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { competitionApi, techniquesApi } from '@/lib/api'
import { formatDate, RESULT_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Trophy, Loader2, ChevronDown, ChevronUp, Target, Swords, Medal } from 'lucide-react'
import type { Competition, CompetitionMatch, TechniqueMinimal } from '@/lib/types'
import { cn } from '@/lib/utils'

const RESULT_LABELS: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  participated: 'Participated',
  withdrew: 'Withdrew',
}

const METHODS = ['submission', 'points', 'advantages', 'penalty', 'referee', 'dq', 'walkover']

function MatchRow({ match, onDelete }: { match: CompetitionMatch; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-mat-border last:border-0">
      <span className="text-mat-text-muted text-xs w-8">R{match.round_number}</span>
      <div className="flex-1">
        <span className="text-mat-text text-sm">{match.opponent_name || 'Unknown Opponent'}</span>
        {match.opponent_gym && <span className="text-mat-text-dim text-xs ml-2">{match.opponent_gym}</span>}
      </div>
      <span className={cn('text-xs font-bold uppercase', match.result === 'win' ? 'text-mat-green-light' : 'text-mat-red-light')}>
        {match.result}
      </span>
      {match.method && (
        <span className="text-mat-text-muted text-xs capitalize">{match.method}</span>
      )}
      {match.submission_type && (
        <span className="text-mat-gold text-xs">{match.submission_type}</span>
      )}
      <button onClick={onDelete} className="text-mat-text-dim hover:text-mat-red-light text-xs transition-colors">×</button>
    </div>
  )
}

function CompetitionCard({ comp }: { comp: Competition }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddMatch, setShowAddMatch] = useState(false)
  const queryClient = useQueryClient()

  const matchMutation = useMutation({
    mutationFn: (data: object) => competitionApi.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      toast.success('Match logged.')
      setShowAddMatch(false)
    },
  })

  const deleteMatchMutation = useMutation({
    mutationFn: (id: number) => competitionApi.deleteMatch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competitions'] }),
  })

  return (
    <div className="bg-mat-card border border-mat-border">
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-mat-darker transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-display text-xl tracking-wider text-mat-text uppercase">{comp.name}</h3>
            <p className="text-mat-text-muted text-xs mt-0.5">
              {formatDate(comp.date)} · {comp.location || 'Unknown Location'}
              {comp.is_gi ? ' · Gi' : ' · No-Gi'}
              {comp.weight_class && ` · ${comp.weight_class}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {comp.result && (
            <span className={cn('font-display text-lg uppercase', RESULT_COLORS[comp.result])}>
              {RESULT_LABELS[comp.result]}
            </span>
          )}
          <div className="text-mat-text-muted text-xs flex gap-3">
            <span className="text-mat-green-light">{comp.win_count}W</span>
            <span className="text-mat-red-light">{comp.loss_count}L</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-mat-text-dim" /> : <ChevronDown size={14} className="text-mat-text-dim" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-mat-border p-6 space-y-4 animate-slide-up">
          {/* Matches */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-mat-text-muted text-xs uppercase tracking-widest">Matches</h4>
              <button
                onClick={() => setShowAddMatch(!showAddMatch)}
                className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
              >
                <Plus size={11} /> Add Match
              </button>
            </div>

            {showAddMatch && (
              <div className="bg-mat-panel border border-mat-border p-4 mb-3 space-y-3 animate-slide-up">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="mat-label">Round #</label>
                    <input id={`round_${comp.id}`} type="number" defaultValue={comp.matches.length + 1} min={1} className="mat-input" />
                  </div>
                  <div>
                    <label className="mat-label">Opponent Name</label>
                    <input id={`opp_${comp.id}`} className="mat-input" placeholder="Opponent" />
                  </div>
                  <div>
                    <label className="mat-label">Result</label>
                    <select id={`result_${comp.id}`} className="mat-input" defaultValue="win">
                      <option value="win">Win</option>
                      <option value="loss">Loss</option>
                    </select>
                  </div>
                  <div>
                    <label className="mat-label">Method</label>
                    <select id={`method_${comp.id}`} className="mat-input" defaultValue="">
                      <option value="">—</option>
                      {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mat-label">Submission</label>
                    <input id={`sub_${comp.id}`} className="mat-input" placeholder="e.g. Triangle" />
                  </div>
                  <div>
                    <label className="mat-label">Label</label>
                    <input id={`label_${comp.id}`} className="mat-input" placeholder="Semi-Final, Final..." />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const g = (id: string) => (document.getElementById(id) as HTMLInputElement).value
                    matchMutation.mutate({
                      competition: comp.id,
                      round_number: Number(g(`round_${comp.id}`)),
                      opponent_name: g(`opp_${comp.id}`),
                      result: g(`result_${comp.id}`),
                      method: g(`method_${comp.id}`),
                      submission_type: g(`sub_${comp.id}`),
                      round_label: g(`label_${comp.id}`),
                    })
                  }}
                  disabled={matchMutation.isPending}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
                >
                  {matchMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : null}
                  Log Match
                </button>
              </div>
            )}

            {comp.matches.length === 0 ? (
              <p className="text-mat-text-dim text-sm">No matches logged.</p>
            ) : (
              <div>
                {comp.matches.map(m => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    onDelete={() => deleteMatchMutation.mutate(m.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {comp.notes && (
            <div>
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Notes</p>
              <p className="text-mat-text-muted text-sm">{comp.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CompetitionPage() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => competitionApi.list().then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => competitionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      toast.success('Competition logged.')
      setShowForm(false)
    },
    onError: () => toast.error('Failed to save.'),
  })

  const competitions: Competition[] = Array.isArray(data) ? data : []

  const totalWins = competitions.reduce((s, c) => s + c.win_count, 0)
  const totalLosses = competitions.reduce((s, c) => s + c.loss_count, 0)
  const gold = competitions.filter(c => c.result === 'gold').length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Competition Record</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Competition</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> {showForm ? 'Cancel' : 'Add Competition'}
        </button>
      </div>

      {/* Stats */}
      {competitions.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Events', value: competitions.length },
            { label: 'Match Wins', value: totalWins, color: 'text-mat-green-light' },
            { label: 'Match Losses', value: totalLosses, color: 'text-mat-red-light' },
            { label: 'Gold Medals', value: gold, color: 'text-mat-gold' },
          ].map(({ label, value, color = 'text-mat-gold' }) => (
            <div key={label} className="bg-mat-card border border-mat-border p-4 text-center">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-display text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Competition Form */}
      {showForm && (
        <div className="bg-mat-card border border-mat-border p-6 space-y-4 animate-slide-up">
          <h3 className="font-display text-xl tracking-wider text-mat-text uppercase flex items-center gap-2">
            <Trophy size={15} className="text-mat-gold" />
            Log Competition
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Competition Name</label>
              <input id="comp_name" className="mat-input" placeholder="e.g. IBJJF Pan Ams 2024" />
            </div>
            <div>
              <label className="mat-label">Date</label>
              <input id="comp_date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="mat-input" />
            </div>
            <div>
              <label className="mat-label">Location</label>
              <input id="comp_location" className="mat-input" placeholder="City, Country" />
            </div>
            <div>
              <label className="mat-label">Organization</label>
              <input id="comp_org" className="mat-input" placeholder="IBJJF, ADCC, EBI..." />
            </div>
            <div>
              <label className="mat-label">Weight Class</label>
              <input id="comp_weight" className="mat-input" placeholder="e.g. Lightweight" />
            </div>
            <div>
              <label className="mat-label">Belt Division</label>
              <input id="comp_belt" className="mat-input" placeholder="e.g. Blue Belt" />
            </div>
            <div>
              <label className="mat-label">Format</label>
              <select id="comp_gi" className="mat-input" defaultValue="true">
                <option value="true">Gi</option>
                <option value="false">No-Gi</option>
              </select>
            </div>
            <div>
              <label className="mat-label">Result</label>
              <select id="comp_result" className="mat-input" defaultValue="">
                <option value="">— (Pending) —</option>
                <option value="gold">Gold Medal</option>
                <option value="silver">Silver Medal</option>
                <option value="bronze">Bronze Medal</option>
                <option value="participated">Participated</option>
                <option value="withdrew">Withdrew</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mat-label">Notes</label>
            <textarea id="comp_notes" rows={2} className="mat-input resize-none" placeholder="General notes about this competition..." />
          </div>
          <button
            onClick={() => {
              const g = (id: string) => (document.getElementById(id) as HTMLInputElement).value
              createMutation.mutate({
                name: g('comp_name'),
                date: g('comp_date'),
                location: g('comp_location'),
                organization: g('comp_org'),
                weight_class: g('comp_weight'),
                belt_division: g('comp_belt'),
                is_gi: g('comp_gi') === 'true',
                result: g('comp_result'),
                notes: g('comp_notes'),
              })
            }}
            disabled={createMutation.isPending}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Log Competition
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : competitions.length === 0 ? (
        <div className="py-20 text-center text-mat-text-dim text-sm">
          No competitions logged yet. Step up and compete.
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map(comp => (
            <CompetitionCard key={comp.id} comp={comp} />
          ))}
        </div>
      )}
    </div>
  )
}
