'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { injuriesApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Plus, Loader2, AlertTriangle, CheckCircle2, Edit2, Trash2, X } from 'lucide-react'
import type { InjuryLog } from '@/lib/types'
import { cn } from '@/lib/utils'

const BODY_PARTS = [
  'neck', 'shoulder', 'elbow', 'wrist', 'back',
  'hip', 'knee', 'ankle', 'rib', 'finger', 'head', 'other'
]

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  moderate: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  severe: 'text-mat-red-light border-mat-red/30 bg-mat-red/5',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-mat-red-light',
  recovering: 'text-yellow-400',
  resolved: 'text-mat-green-light',
}

function InjuryForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<InjuryLog>
  onSave: (data: object) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [bodyPart, setBodyPart] = useState(initial?.body_part || '')
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>(initial?.severity || 'mild')
  const [status, setStatus] = useState<'active' | 'recovering' | 'resolved'>(initial?.status || 'active')
  const [dateOccurred, setDateOccurred] = useState(initial?.date_occurred || format(new Date(), 'yyyy-MM-dd'))
  const [dateResolved, setDateResolved] = useState(initial?.date_resolved || '')
  const [affectedTraining, setAffectedTraining] = useState(initial?.affected_training ?? true)
  const [notes, setNotes] = useState(initial?.notes || '')

  const submit = () => {
    if (!bodyPart) { toast.error('Select a body part.'); return }
    onSave({
      body_part: bodyPart,
      severity,
      status,
      date_occurred: dateOccurred,
      date_resolved: dateResolved || null,
      affected_training: affectedTraining,
      notes,
    })
  }

  return (
    <div className="bg-mat-card border border-mat-border p-6 space-y-4 animate-slide-up">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="mat-label">Body Part</label>
          <select value={bodyPart} onChange={e => setBodyPart(e.target.value)} className="mat-input">
            <option value="">Select...</option>
            {BODY_PARTS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1).replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mat-label">Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')} className="mat-input">
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className="mat-label">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as 'active' | 'recovering' | 'resolved')} className="mat-input">
            <option value="active">Active</option>
            <option value="recovering">Recovering</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="mat-label">Date Occurred</label>
          <input type="date" value={dateOccurred} onChange={e => setDateOccurred(e.target.value)} className="mat-input" />
        </div>
        <div>
          <label className="mat-label">Date Resolved (if known)</label>
          <input type="date" value={dateResolved} onChange={e => setDateResolved(e.target.value)} className="mat-input" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={affectedTraining}
              onChange={e => setAffectedTraining(e.target.checked)}
              className="accent-mat-gold w-4 h-4"
            />
            <span className="text-mat-text-muted text-xs uppercase tracking-wider">Affected Training</span>
          </label>
        </div>
      </div>
      <div>
        <label className="mat-label">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="mat-input resize-none"
          placeholder="How did it happen? What aggravates it?"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={submit} disabled={isPending} className="btn-primary px-6 py-2.5 flex items-center gap-2">
          {isPending ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : initial?.id ? 'Save Changes' : 'Log Injury'}
        </button>
        <button onClick={onCancel} className="btn-secondary px-5 py-2.5">Cancel</button>
      </div>
    </div>
  )
}

function InjuryCard({ injury, onEdit, onDelete }: {
  injury: InjuryLog
  onEdit: () => void
  onDelete: () => void
}) {
  const resolved = injury.status === 'resolved'
  return (
    <div className={cn(
      'border p-5 flex items-start justify-between gap-4',
      resolved ? 'bg-mat-card border-mat-border opacity-70' : 'bg-mat-card border-mat-border'
    )}>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-display text-lg tracking-wider text-mat-text uppercase">
            {injury.body_part_display}
          </span>
          <span className={cn('text-xs font-bold uppercase px-2 py-0.5 border', SEVERITY_COLORS[injury.severity])}>
            {injury.severity_display}
          </span>
          <span className={cn('text-xs font-bold uppercase', STATUS_COLORS[injury.status])}>
            {injury.status_display}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-mat-text-muted">
          <span>Occurred: {formatDate(injury.date_occurred, 'MMM d, yyyy')}</span>
          {injury.date_resolved && (
            <span>Resolved: {formatDate(injury.date_resolved, 'MMM d, yyyy')}</span>
          )}
          {injury.affected_training && (
            <span className="text-yellow-400">Affected training</span>
          )}
        </div>
        {injury.notes && (
          <p className="text-mat-text-muted text-sm leading-relaxed">{injury.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="text-mat-text-dim hover:text-mat-gold p-1.5 transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={onDelete} className="text-mat-text-dim hover:text-mat-red-light p-1.5 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function InjuriesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['injuries'],
    queryFn: () => injuriesApi.list().then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: object) => injuriesApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injuries'] })
      toast.success('Injury logged.')
      setShowForm(false)
    },
    onError: () => toast.error('Failed to log injury.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => injuriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injuries'] })
      toast.success('Injury updated.')
      setEditingId(null)
    },
    onError: () => toast.error('Failed to update.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => injuriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injuries'] })
      toast.success('Injury removed.')
    },
  })

  const injuries: InjuryLog[] = Array.isArray(data) ? data : []
  const active = injuries.filter(i => i.status !== 'resolved')
  const resolved = injuries.filter(i => i.status === 'resolved')

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Health Tracker</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Injury Log</h1>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditingId(null) }}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> {showForm ? 'Cancel' : 'Log Injury'}
        </button>
      </div>

      {/* Summary bar */}
      {injuries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active', value: injuries.filter(i => i.status === 'active').length, color: 'text-mat-red-light' },
            { label: 'Recovering', value: injuries.filter(i => i.status === 'recovering').length, color: 'text-yellow-400' },
            { label: 'Resolved', value: resolved.length, color: 'text-mat-green-light' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-mat-card border border-mat-border p-4 text-center">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-display text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <InjuryForm
          onSave={d => createMutation.mutate(d)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : injuries.length === 0 ? (
        <div className="py-20 text-center text-mat-text-dim text-sm">
          No injuries logged. Stay healthy out there.
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={12} className="text-yellow-400" /> Current Injuries
              </p>
              {active.map(injury => (
                editingId === injury.id ? (
                  <InjuryForm
                    key={injury.id}
                    initial={injury}
                    onSave={d => updateMutation.mutate({ id: injury.id, data: d })}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMutation.isPending}
                  />
                ) : (
                  <InjuryCard
                    key={injury.id}
                    injury={injury}
                    onEdit={() => { setEditingId(injury.id); setShowForm(false) }}
                    onDelete={() => { if (confirm('Delete this injury log?')) deleteMutation.mutate(injury.id) }}
                  />
                )
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-2">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={12} className="text-mat-green-light" /> Resolved
              </p>
              {resolved.map(injury => (
                editingId === injury.id ? (
                  <InjuryForm
                    key={injury.id}
                    initial={injury}
                    onSave={d => updateMutation.mutate({ id: injury.id, data: d })}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMutation.isPending}
                  />
                ) : (
                  <InjuryCard
                    key={injury.id}
                    injury={injury}
                    onEdit={() => { setEditingId(injury.id); setShowForm(false) }}
                    onDelete={() => { if (confirm('Delete this injury log?')) deleteMutation.mutate(injury.id) }}
                  />
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
