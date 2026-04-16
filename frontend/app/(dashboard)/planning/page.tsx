'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planningApi, techniquesApi } from '@/lib/api'
import { formatDate, getWeekStart } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import { Plus, CalendarDays, CheckCircle2, Circle, Loader2, ChevronRight, Target } from 'lucide-react'
import Link from 'next/link'
import type { WeeklyPlan, TechniqueMinimal, ChecklistItem } from '@/lib/types'
import { cn } from '@/lib/utils'

function ChecklistWidget({ checklist, onToggle }: {
  checklist: { id: number; title: string; date: string; items: ChecklistItem[] }
  onToggle: (id: number, itemId: string) => void
}) {
  const completed = checklist.items.filter(i => i.completed).length
  const total = checklist.items.length

  return (
    <div className="bg-mat-panel border border-mat-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-mat-text font-semibold text-sm">{checklist.title}</h4>
        <span className="text-mat-text-muted text-xs">{completed}/{total}</span>
      </div>
      <div className="w-full h-1 bg-mat-muted mb-3">
        <div
          className="h-full bg-mat-gold transition-all duration-300"
          style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
        />
      </div>
      <div className="space-y-2">
        {checklist.items.map(item => (
          <button
            key={item.id}
            onClick={() => onToggle(checklist.id, item.id)}
            className="flex items-center gap-2 w-full text-left group"
          >
            {item.completed ? (
              <CheckCircle2 size={14} className="text-mat-gold shrink-0" />
            ) : (
              <Circle size={14} className="text-mat-text-dim shrink-0 group-hover:text-mat-text-muted" />
            )}
            <span className={cn(
              'text-sm transition-colors',
              item.completed ? 'text-mat-text-dim line-through' : 'text-mat-text-muted group-hover:text-mat-text'
            )}>
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PlanningPage() {
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [selectedTechs, setSelectedTechs] = useState<TechniqueMinimal[]>([])
  const [techSearch, setTechSearch] = useState('')
  const queryClient = useQueryClient()

  const weekStart = format(getWeekStart(), 'yyyy-MM-dd')

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planningApi.list().then(r => r.data?.results || r.data),
  })

  const { data: techniques } = useQuery({
    queryKey: ['techniques', 'all'],
    queryFn: () => techniquesApi.list({ page_size: 200 }).then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => planningApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Weekly plan created.')
      setShowNewPlan(false)
      setSelectedTechs([])
    },
    onError: () => toast.error('Failed to create plan.'),
  })

  const checklistMutation = useMutation({
    mutationFn: ({ planId, title, date }: { planId: number; title: string; date: string }) =>
      planningApi.generateChecklist(planId, { title, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Checklist generated.')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: number; itemId: string }) =>
      planningApi.toggleChecklistItem(checklistId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  const filteredTechs = (techniques || []).filter((t: TechniqueMinimal) =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) &&
    !selectedTechs.find(s => s.id === t.id)
  )

  const plansArray: WeeklyPlan[] = Array.isArray(plans) ? plans : []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Deliberate Practice</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Weekly Planner</h1>
        </div>
        <button
          onClick={() => setShowNewPlan(!showNewPlan)}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> {showNewPlan ? 'Cancel' : 'New Plan'}
        </button>
      </div>

      {/* New Plan Form */}
      {showNewPlan && (
        <div className="bg-mat-card border border-mat-border p-6 space-y-5 animate-slide-up">
          <h3 className="font-display text-xl tracking-wider text-mat-text uppercase flex items-center gap-2">
            <CalendarDays size={15} className="text-mat-gold" />
            Create Weekly Plan
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Week Starting</label>
              <input
                type="date"
                defaultValue={weekStart}
                id="week_start"
                className="mat-input"
              />
            </div>
            <div>
              <label className="mat-label">Sessions Planned</label>
              <input type="number" id="sessions_planned" defaultValue={3} min={1} max={14} className="mat-input" />
            </div>
          </div>
          <div>
            <label className="mat-label">Title (optional)</label>
            <input id="plan_title" className="mat-input" placeholder="e.g. Guard Passing Week" />
          </div>
          <div>
            <label className="mat-label">Goals</label>
            <textarea id="plan_goals" rows={2} className="mat-input resize-none" placeholder="What do you want to achieve this week?" />
          </div>

          {/* Technique selection */}
          <div>
            <label className="mat-label">Focus Techniques</label>
            {selectedTechs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTechs.map(t => (
                  <span key={t.id} className="flex items-center gap-1.5 bg-mat-panel border border-mat-gold/30 px-2.5 py-1 text-xs text-mat-gold">
                    {t.name}
                    <button type="button" onClick={() => setSelectedTechs(p => p.filter(x => x.id !== t.id))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                value={techSearch}
                onChange={e => setTechSearch(e.target.value)}
                className="mat-input"
                placeholder="Search techniques to focus on..."
              />
              {techSearch && filteredTechs.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-40 overflow-y-auto">
                  {filteredTechs.slice(0, 6).map((t: TechniqueMinimal) => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTechs(p => [...p, t]); setTechSearch('') }}
                      className="w-full text-left px-4 py-2 hover:bg-mat-darker text-sm"
                    >
                      <span className="text-mat-text">{t.name}</span>
                      <span className="text-mat-text-dim text-xs ml-2">{t.position}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              const week = (document.getElementById('week_start') as HTMLInputElement).value
              const sessions = Number((document.getElementById('sessions_planned') as HTMLInputElement).value)
              const title = (document.getElementById('plan_title') as HTMLInputElement).value
              const goals = (document.getElementById('plan_goals') as HTMLTextAreaElement).value
              createMutation.mutate({
                week_start: week,
                sessions_planned: sessions,
                title,
                goals,
                focus_technique_ids: selectedTechs.map(t => t.id),
              })
            }}
            disabled={createMutation.isPending}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {createMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Creating...</> : 'Create Plan'}
          </button>
        </div>
      )}

      {/* Plans list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : plansArray.length === 0 ? (
        <div className="py-20 text-center text-mat-text-dim text-sm">
          No plans yet. Create your first weekly plan to start training deliberately.
        </div>
      ) : (
        <div className="space-y-5">
          {plansArray.map((plan) => (
            <div key={plan.id} className="bg-mat-card border border-mat-border">
              <div className="px-6 py-4 border-b border-mat-border flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl tracking-wider text-mat-text uppercase">
                    {plan.title || `Week of ${formatDate(plan.week_start)}`}
                  </h3>
                  <p className="text-mat-text-muted text-xs mt-0.5">
                    {formatDate(plan.week_start, 'MMM d')} – {formatDate(plan.week_end, 'MMM d, yyyy')}
                    {' '}· {plan.sessions_planned} sessions planned
                  </p>
                </div>
                <button
                  onClick={() => checklistMutation.mutate({
                    planId: plan.id,
                    title: `Session Checklist`,
                    date: format(new Date(), 'yyyy-MM-dd'),
                  })}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Target size={12} /> Generate Checklist
                </button>
              </div>

              <div className="p-6 space-y-4">
                {plan.goals && (
                  <div>
                    <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Goals</p>
                    <p className="text-mat-text-muted text-sm">{plan.goals}</p>
                  </div>
                )}

                {plan.focus_techniques.length > 0 && (
                  <div>
                    <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-2">Focus Techniques</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.focus_techniques.map(t => (
                        <Link
                          key={t.id}
                          href={`/techniques/${t.id}`}
                          className="border border-mat-border hover:border-mat-gold px-3 py-1 text-xs text-mat-text transition-colors"
                        >
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {plan.checklists.length > 0 && (
                  <div>
                    <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Session Checklists</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {plan.checklists.map(cl => (
                        <ChecklistWidget
                          key={cl.id}
                          checklist={cl}
                          onToggle={(checklistId, itemId) =>
                            toggleMutation.mutate({ checklistId, itemId })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
