'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planningApi, techniquesApi } from '@/lib/api'
import { formatDate, getWeekStart } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format, parseISO, isThisWeek, isPast, addDays } from 'date-fns'
import {
  Plus, CalendarDays, CheckCircle2, Circle, Loader2,
  Target, ChevronDown, Trophy, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import type { WeeklyPlan, TechniqueMinimal, ChecklistItem } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── helpers ──────────────────────────────────────────────────────────────────

function isPlanComplete(plan: WeeklyPlan): boolean {
  if (!plan.checklists?.length) return false
  const allItems = plan.checklists.flatMap(cl => cl.items)
  return allItems.length > 0 && allItems.every(i => i.completed)
}

function isCurrentWeek(weekStart: string): boolean {
  return isThisWeek(parseISO(weekStart), { weekStartsOn: 1 })
}

function isPastWeek(weekStart: string): boolean {
  const weekEnd = addDays(parseISO(weekStart), 6)
  return isPast(weekEnd) && !isCurrentWeek(weekStart)
}

// ── animated collapsible ─────────────────────────────────────────────────────

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      // measure then transition to exact height, then set auto
      const h = el.scrollHeight
      setHeight(h)
      const timer = setTimeout(() => setHeight('auto'), 300)
      return () => clearTimeout(timer)
    } else {
      // snapshot current height first so transition has a start point
      const h = el.scrollHeight
      setHeight(h)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{
        height: height === 'auto' ? 'auto' : height,
        overflow: 'hidden',
        transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  )
}

// ── checklist widget ──────────────────────────────────────────────────────────

function ChecklistWidget({ checklist, onToggle }: {
  checklist: { id: number; title: string; date: string; items: ChecklistItem[] }
  onToggle: (id: number, itemId: string) => void
}) {
  const completed = checklist.items.filter(i => i.completed).length
  const total = checklist.items.length
  const allDone = total > 0 && completed === total

  return (
    <div className={cn(
      'bg-mat-panel border p-4 transition-colors duration-300',
      allDone ? 'border-mat-gold/40' : 'border-mat-border'
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-mat-text font-semibold text-sm">{checklist.title}</h4>
        <span className={cn('text-xs', allDone ? 'text-mat-gold' : 'text-mat-text-muted')}>
          {completed}/{total}
        </span>
      </div>
      <div className="w-full h-1 bg-mat-muted mb-3 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            allDone ? 'bg-mat-gold' : 'bg-mat-gold/60'
          )}
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

// ── plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, defaultOpen, onToggleItem, isToggling }: {
  plan: WeeklyPlan
  defaultOpen: boolean
  onToggleItem: (checklistId: number, itemId: string) => void
  isToggling: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const complete = isPlanComplete(plan)
  const current = isCurrentWeek(plan.week_start)

  return (
    <div className={cn(
      'border transition-colors duration-300',
      complete ? 'bg-mat-card border-mat-gold/50' : 'bg-mat-card border-mat-border'
    )}>
      {/* Header — click to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          {complete && (
            <Trophy size={15} className="text-mat-gold shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl tracking-wider text-mat-text uppercase">
                {plan.title || `Week of ${formatDate(plan.week_start)}`}
              </h3>
              {current && (
                <span className="text-xs uppercase tracking-wider text-mat-black bg-mat-gold px-2 py-0.5 font-bold">
                  This Week
                </span>
              )}
              {complete && (
                <span className="text-xs uppercase tracking-wider text-mat-gold border border-mat-gold/50 px-2 py-0.5">
                  Complete
                </span>
              )}
            </div>
            <p className="text-mat-text-muted text-xs mt-0.5">
              {formatDate(plan.week_start, 'MMM d')} – {formatDate(plan.week_end, 'MMM d, yyyy')}
              {' '}· {plan.sessions_planned} sessions planned
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-mat-text-dim group-hover:text-mat-gold transition-transform duration-300 shrink-0',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      {/* Collapsible body */}
      <Collapsible open={open}>
        <div className="px-6 pb-6 space-y-4 border-t border-mat-border pt-4">
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
                    onToggle={onToggleItem}
                  />
                ))}
              </div>
            </div>
          )}

          <GenerateChecklistButton plan={plan} />
        </div>
      </Collapsible>
    </div>
  )
}

// ── generate checklist button (extracted to avoid prop drilling) ──────────────

function GenerateChecklistButton({ plan }: { plan: WeeklyPlan }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ planId, title, date }: { planId: number; title: string; date: string }) =>
      planningApi.generateChecklist(planId, { title, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Checklist generated.')
    },
  })

  return (
    <button
      onClick={() => mutation.mutate({
        planId: plan.id,
        title: `Session Checklist`,
        date: format(new Date(), 'yyyy-MM-dd'),
      })}
      disabled={mutation.isPending}
      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 w-fit"
    >
      {mutation.isPending
        ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
        : <><Target size={12} /> Generate Checklist</>
      }
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [selectedTechs, setSelectedTechs] = useState<TechniqueMinimal[]>([])
  const [techSearch, setTechSearch] = useState('')
  const [pastOpen, setPastOpen] = useState(false)
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
  const currentAndFuture = plansArray.filter(p => !isPastWeek(p.week_start))
  const pastPlans = plansArray.filter(p => isPastWeek(p.week_start))

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
              <input type="date" defaultValue={weekStart} id="week_start" className="mat-input" />
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

          <div>
            <label className="mat-label">Focus Techniques</label>
            {selectedTechs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTechs.map(t => (
                  <span key={t.id} className="flex items-center gap-1.5 bg-mat-panel border border-mat-gold/30 px-2.5 py-1 text-xs text-mat-gold">
                    {t.name}
                    <button type="button" onClick={() => setSelectedTechs(p => p.filter(x => x.id !== t.id))}>×</button>
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
            {createMutation.isPending
              ? <><Loader2 size={13} className="animate-spin" /> Creating...</>
              : 'Create Plan'
            }
          </button>
        </div>
      )}

      {/* Plans */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : plansArray.length === 0 ? (
        <div className="py-20 text-center text-mat-text-dim text-sm">
          No plans yet. Create your first weekly plan to start training deliberately.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Current & future plans — default open */}
          {currentAndFuture.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              defaultOpen={isCurrentWeek(plan.week_start)}
              onToggleItem={(checklistId, itemId) =>
                toggleMutation.mutate({ checklistId, itemId })
              }
              isToggling={toggleMutation.isPending}
            />
          ))}

          {/* Past plans — collapsed under a toggle */}
          {pastPlans.length > 0 && (
            <div className="border border-mat-border">
              <button
                onClick={() => setPastOpen(o => !o)}
                className="w-full px-6 py-3 flex items-center justify-between text-left group hover:bg-mat-card transition-colors"
              >
                <span className="text-mat-text-muted text-xs uppercase tracking-widest">
                  Previous Weeks ({pastPlans.length})
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    'text-mat-text-dim group-hover:text-mat-gold transition-transform duration-300',
                    pastOpen ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>
              <Collapsible open={pastOpen}>
                <div className="space-y-px border-t border-mat-border">
                  {pastPlans.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      defaultOpen={false}
                      onToggleItem={(checklistId, itemId) =>
                        toggleMutation.mutate({ checklistId, itemId })
                      }
                      isToggling={toggleMutation.isPending}
                    />
                  ))}
                </div>
              </Collapsible>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
