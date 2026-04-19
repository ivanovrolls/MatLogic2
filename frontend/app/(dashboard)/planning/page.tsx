'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planningApi, techniquesApi } from '@/lib/api'
import { formatDate, getWeekStart } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format, parseISO, isThisWeek, isPast, addDays } from 'date-fns'
import {
  Plus, CalendarDays, CheckCircle2, Circle, Loader2,
  Target, ChevronDown, Trophy, Pencil, Trash2, X, Dumbbell,
} from 'lucide-react'
import Link from 'next/link'
import type { WeeklyPlan, TechniqueMinimal, ChecklistItem, DrillItem } from '@/lib/types'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

// ── collapsible ───────────────────────────────────────────────────────────────

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      const h = el.scrollHeight
      setHeight(h)
      const timer = setTimeout(() => setHeight('auto'), 300)
      return () => clearTimeout(timer)
    } else {
      const h = el.scrollHeight
      setHeight(h)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{ height: height === 'auto' ? 'auto' : height, overflow: 'hidden', transition: 'height 300ms cubic-bezier(0.4,0,0.2,1)' }}
    >
      {children}
    </div>
  )
}

// ── drill picker (reusable inline component) ──────────────────────────────────

function DrillPicker({
  allTechniques,
  onAdd,
}: {
  allTechniques: TechniqueMinimal[]
  onAdd: (drill: DrillItem) => void
}) {
  const [search, setSearch] = useState('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [picked, setPicked] = useState<TechniqueMinimal | null>(null)

  const filtered = allTechniques.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const add = () => {
    if (!picked) return
    onAdd({ technique_id: picked.id, technique_name: picked.name, sets, reps })
    setPicked(null)
    setSearch('')
    setSets(3)
    setReps(10)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          value={picked ? picked.name : search}
          onChange={e => { setSearch(e.target.value); setPicked(null) }}
          className="mat-input text-sm"
          placeholder="Search technique to drill..."
        />
        {!picked && search && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-36 overflow-y-auto">
            {filtered.slice(0, 6).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setPicked(t); setSearch('') }}
                className="w-full text-left px-3 py-2 hover:bg-mat-darker text-sm flex items-center gap-2"
              >
                <span className="text-mat-text">{t.name}</span>
                <span className="text-mat-text-dim text-xs capitalize">{t.position}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <label className="text-mat-text-muted text-xs">Sets</label>
          <input
            type="number" min={1} max={99} value={sets}
            onChange={e => setSets(Number(e.target.value))}
            className="mat-input w-16 text-xs text-center"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-mat-text-muted text-xs">Reps</label>
          <input
            type="number" min={1} max={999} value={reps}
            onChange={e => setReps(Number(e.target.value))}
            className="mat-input w-16 text-xs text-center"
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!picked}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40"
        >
          <Plus size={11} /> Add
        </button>
      </div>
    </div>
  )
}

// ── drill list display ────────────────────────────────────────────────────────

function DrillList({ drills, onRemove }: { drills: DrillItem[]; onRemove?: (i: number) => void }) {
  if (drills.length === 0) return <p className="text-mat-text-dim text-xs">No drills added.</p>
  return (
    <div className="space-y-1">
      {drills.map((d, i) => (
        <div key={i} className="flex items-center justify-between bg-mat-panel border border-mat-border px-3 py-1.5">
          <span className="text-mat-text text-xs">{d.technique_name}</span>
          <div className="flex items-center gap-3">
            <span className="text-mat-gold text-xs font-bold">{d.sets}×{d.reps}</span>
            {onRemove && (
              <button type="button" onClick={() => onRemove(i)} className="text-mat-text-dim hover:text-mat-red-light">
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      ))}
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
    <div className={cn('bg-mat-panel border p-4 transition-colors duration-300', allDone ? 'border-mat-gold/40' : 'border-mat-border')}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-mat-text font-semibold text-sm">{checklist.title}</h4>
        <span className={cn('text-xs', allDone ? 'text-mat-gold' : 'text-mat-text-muted')}>{completed}/{total}</span>
      </div>
      <div className="w-full h-1 bg-mat-muted mb-3 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500', allDone ? 'bg-mat-gold' : 'bg-mat-gold/60')}
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
            {item.completed
              ? <CheckCircle2 size={14} className="text-mat-gold shrink-0" />
              : <Circle size={14} className="text-mat-text-dim shrink-0 group-hover:text-mat-text-muted" />
            }
            <span className={cn('text-sm transition-colors flex-1', item.completed ? 'text-mat-text-dim line-through' : 'text-mat-text-muted group-hover:text-mat-text')}>
              {item.text}
            </span>
            {(item.sets && item.reps) ? (
              <span className="text-mat-gold text-xs font-bold shrink-0">{item.sets}×{item.reps}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, defaultOpen, onToggleItem, allTechniques }: {
  plan: WeeklyPlan
  defaultOpen: boolean
  onToggleItem: (checklistId: number, itemId: string) => void
  allTechniques: TechniqueMinimal[]
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(plan.title)
  const [editGoals, setEditGoals] = useState(plan.goals)
  const [editSessions, setEditSessions] = useState(plan.sessions_planned)
  const [editTechs, setEditTechs] = useState<TechniqueMinimal[]>(plan.focus_techniques)
  const [editWeeklyDrills, setEditWeeklyDrills] = useState<DrillItem[]>(plan.weekly_drills || [])
  const [techSearch, setTechSearch] = useState('')
  // For adding per-day drills to an existing plan
  const [showAddDayDrill, setShowAddDayDrill] = useState(false)
  const [addDayIndex, setAddDayIndex] = useState(0)
  const [addDayDrills, setAddDayDrills] = useState<DrillItem[]>([])

  const queryClient = useQueryClient()
  const complete = isPlanComplete(plan)
  const current = isCurrentWeek(plan.week_start)

  const updateMutation = useMutation({
    mutationFn: (data: object) => planningApi.update(plan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan updated.')
      setEditing(false)
      setTechSearch('')
    },
    onError: () => toast.error('Failed to update plan.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => planningApi.delete(plan.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan deleted.')
    },
    onError: () => toast.error('Failed to delete plan.'),
  })

  const addDayDrillMutation = useMutation({
    mutationFn: (data: object) => planningApi.createChecklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Day drills saved.')
      setShowAddDayDrill(false)
      setAddDayDrills([])
    },
    onError: () => toast.error('Failed to save day drills.'),
  })

  const deleteChecklistMutation = useMutation({
    mutationFn: (id: number) => planningApi.deleteChecklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Checklist removed.')
    },
  })

  const startEdit = () => {
    setEditTitle(plan.title)
    setEditGoals(plan.goals)
    setEditSessions(plan.sessions_planned)
    setEditTechs(plan.focus_techniques)
    setEditWeeklyDrills(plan.weekly_drills || [])
    setTechSearch('')
    setEditing(true)
    setOpen(true)
  }

  const saveEdit = () => {
    updateMutation.mutate({
      title: editTitle,
      goals: editGoals,
      sessions_planned: editSessions,
      focus_technique_ids: editTechs.map(t => t.id),
      weekly_drills: editWeeklyDrills,
    })
  }

  const saveAddDayDrill = () => {
    if (addDayDrills.length === 0) return
    const date = format(addDays(parseISO(plan.week_start), addDayIndex), 'yyyy-MM-dd')
    addDayDrillMutation.mutate({
      plan: plan.id,
      title: DAY_NAMES[addDayIndex],
      date,
      items: addDayDrills.map((d, i) => ({
        id: `${d.technique_id}-${i}-${Date.now()}`,
        technique_id: d.technique_id,
        text: `Drill: ${d.technique_name}`,
        sets: d.sets,
        reps: d.reps,
        completed: false,
      })),
    })
  }

  const filteredTechs = allTechniques.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) &&
    !editTechs.find(e => e.id === t.id)
  )

  const isDailyMode = plan.drill_mode === 'daily'
  const hasWeeklyDrills = !isDailyMode && (plan.weekly_drills?.length ?? 0) > 0

  return (
    <div className={cn('border transition-colors duration-300', complete ? 'bg-mat-card border-mat-gold/50' : 'bg-mat-card border-mat-border')}>
      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between">
        <button onClick={() => !editing && setOpen(o => !o)} className="flex items-center gap-3 flex-1 text-left">
          <div className="flex items-center gap-3">
            {complete && <Trophy size={15} className="text-mat-gold shrink-0" />}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl tracking-wider text-mat-text uppercase">
                  {plan.title || `Week of ${formatDate(plan.week_start)}`}
                </h3>
                {current && <span className="text-xs uppercase tracking-wider text-mat-black bg-mat-gold px-2 py-0.5 font-bold">This Week</span>}
                {complete && <span className="text-xs uppercase tracking-wider text-mat-gold border border-mat-gold/50 px-2 py-0.5">Complete</span>}
                {isDailyMode && <span className="text-xs uppercase tracking-wider text-mat-text-muted border border-mat-border px-2 py-0.5">Daily Drills</span>}
              </div>
              <p className="text-mat-text-muted text-xs mt-0.5">
                {formatDate(plan.week_start, 'MMM d')} – {formatDate(plan.week_end, 'MMM d, yyyy')} · {plan.sessions_planned} sessions planned
              </p>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button onClick={() => editing ? setEditing(false) : startEdit()} className="p-1.5 text-mat-text-dim hover:text-mat-gold transition-colors">
            {editing ? <X size={13} /> : <Pencil size={13} />}
          </button>
          <button
            onClick={() => { if (confirm('Delete this plan?')) deleteMutation.mutate() }}
            className="p-1.5 text-mat-text-dim hover:text-mat-red-light transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {!editing && (
            <button onClick={() => setOpen(o => !o)} className="p-1.5">
              <ChevronDown size={16} className={cn('text-mat-text-dim hover:text-mat-gold transition-transform duration-300', open ? 'rotate-180' : '')} />
            </button>
          )}
        </div>
      </div>

      <Collapsible open={open}>
        <div className="px-6 pb-6 space-y-4 border-t border-mat-border pt-4">

          {/* ── Edit form ── */}
          {editing && (
            <div className="bg-mat-panel border border-mat-gold/30 p-4 space-y-4">
              <p className="text-mat-gold text-xs uppercase tracking-widest">Edit Plan</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="mat-label">Title</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mat-input" placeholder="e.g. Guard Passing Week" />
                </div>
                <div>
                  <label className="mat-label">Sessions Planned</label>
                  <input type="number" min={1} max={14} value={editSessions} onChange={e => setEditSessions(Number(e.target.value))} className="mat-input" />
                </div>
              </div>
              <div>
                <label className="mat-label">Goals</label>
                <textarea value={editGoals} onChange={e => setEditGoals(e.target.value)} rows={2} className="mat-input resize-none" />
              </div>
              {/* Focus techniques */}
              <div>
                <label className="mat-label">Focus Techniques</label>
                {editTechs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {editTechs.map(t => (
                      <span key={t.id} className="flex items-center gap-1 bg-mat-panel border border-mat-gold/30 px-2.5 py-0.5 text-xs text-mat-gold">
                        {t.name}
                        <button type="button" onClick={() => setEditTechs(p => p.filter(x => x.id !== t.id))}><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input value={techSearch} onChange={e => setTechSearch(e.target.value)} className="mat-input text-sm" placeholder="Search techniques..." />
                  {techSearch && filteredTechs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-36 overflow-y-auto">
                      {filteredTechs.slice(0, 6).map(t => (
                        <button key={t.id} type="button" onClick={() => { setEditTechs(p => [...p, t]); setTechSearch('') }}
                          className="w-full text-left px-4 py-2 hover:bg-mat-darker text-sm flex items-center gap-2">
                          <span className="text-mat-text">{t.name}</span>
                          <span className="text-mat-text-dim text-xs">{t.position}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Weekly drills edit (only if not daily mode) */}
              {!isDailyMode && (
                <div>
                  <label className="mat-label flex items-center gap-1.5"><Dumbbell size={11} /> Weekly Drills</label>
                  <DrillList drills={editWeeklyDrills} onRemove={i => setEditWeeklyDrills(p => p.filter((_, idx) => idx !== i))} />
                  <div className="mt-2">
                    <DrillPicker allTechniques={allTechniques} onAdd={d => setEditWeeklyDrills(p => [...p, d])} />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={updateMutation.isPending} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                  {updateMutation.isPending ? <><Loader2 size={11} className="animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
              </div>
            </div>
          )}

          {/* ── View mode ── */}
          {!editing && (
            <>
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
                      <Link key={t.id} href={`/techniques/${t.id}`}
                        className="border border-mat-border hover:border-mat-gold px-3 py-1 text-xs text-mat-text transition-colors">
                        {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly drills (non-daily mode) */}
              {hasWeeklyDrills && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Dumbbell size={11} /> Weekly Drills
                  </p>
                  <DrillList drills={plan.weekly_drills} />
                </div>
              )}

              {/* Daily drill checklists */}
              {plan.checklists.length > 0 && (
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">
                    {isDailyMode ? 'Daily Drills' : 'Session Checklists'}
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {plan.checklists.map(cl => (
                      <div key={cl.id} className="relative group/cl">
                        <ChecklistWidget checklist={cl} onToggle={onToggleItem} />
                        <button
                          onClick={() => { if (confirm('Remove this checklist?')) deleteChecklistMutation.mutate(cl.id) }}
                          className="absolute top-2 right-2 text-mat-text-dim hover:text-mat-red-light opacity-0 group-hover/cl:opacity-100 transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add day drills (daily mode) */}
              {isDailyMode && (
                <div>
                  {!showAddDayDrill ? (
                    <button onClick={() => setShowAddDayDrill(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 w-fit">
                      <Plus size={11} /> Add Day Drills
                    </button>
                  ) : (
                    <div className="bg-mat-panel border border-mat-border p-4 space-y-3">
                      <p className="text-mat-text-muted text-xs uppercase tracking-widest">Add Drills for a Day</p>
                      <div>
                        <label className="mat-label">Day</label>
                        <select value={addDayIndex} onChange={e => setAddDayIndex(Number(e.target.value))} className="mat-input">
                          {DAY_NAMES.map((name, i) => (
                            <option key={i} value={i}>
                              {name} ({format(addDays(parseISO(plan.week_start), i), 'MMM d')})
                            </option>
                          ))}
                        </select>
                      </div>
                      <DrillPicker allTechniques={allTechniques} onAdd={d => setAddDayDrills(p => [...p, d])} />
                      <DrillList drills={addDayDrills} onRemove={i => setAddDayDrills(p => p.filter((_, idx) => idx !== i))} />
                      <div className="flex gap-2">
                        <button onClick={saveAddDayDrill} disabled={addDayDrills.length === 0 || addDayDrillMutation.isPending}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40">
                          {addDayDrillMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : null}
                          Save Day Drills
                        </button>
                        <button onClick={() => { setShowAddDayDrill(false); setAddDayDrills([]) }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isDailyMode && <GenerateChecklistButton plan={plan} />}
            </>
          )}
        </div>
      </Collapsible>
    </div>
  )
}

// ── generate checklist button ─────────────────────────────────────────────────

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
      onClick={() => mutation.mutate({ planId: plan.id, title: 'Session Checklist', date: format(new Date(), 'yyyy-MM-dd') })}
      disabled={mutation.isPending}
      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 w-fit"
    >
      {mutation.isPending ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <><Target size={12} /> Generate Checklist</>}
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [selectedTechs, setSelectedTechs] = useState<TechniqueMinimal[]>([])
  const [techSearch, setTechSearch] = useState('')
  const [pastOpen, setPastOpen] = useState(false)
  const [weekStartInput, setWeekStartInput] = useState(format(getWeekStart(), 'yyyy-MM-dd'))
  const [drillMode, setDrillMode] = useState<'weekly' | 'daily'>('weekly')
  const [weeklyDrills, setWeeklyDrills] = useState<DrillItem[]>([])
  // dailyDrills: dayIndex (0=Mon..6=Sun) → DrillItem[]
  const [dailyDrills, setDailyDrills] = useState<Record<number, DrillItem[]>>({})
  const queryClient = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planningApi.list().then(r => r.data?.results || r.data),
  })

  const { data: techniques } = useQuery({
    queryKey: ['techniques', 'all'],
    queryFn: () => techniquesApi.list({ page_size: 200 }).then(r => r.data?.results || r.data),
  })

  const allTechniques: TechniqueMinimal[] = Array.isArray(techniques) ? techniques : []

  const createMutation = useMutation({
    mutationFn: (data: object) => planningApi.create(data),
    onSuccess: async (res) => {
      const planId = res.data.id

      // Create per-day drill checklists if in daily mode
      if (drillMode === 'daily') {
        for (const [dayIndexStr, drills] of Object.entries(dailyDrills)) {
          if (drills.length === 0) continue
          const dayIndex = Number(dayIndexStr)
          const date = format(addDays(parseISO(weekStartInput), dayIndex), 'yyyy-MM-dd')
          await planningApi.createChecklist({
            plan: planId,
            title: DAY_NAMES[dayIndex],
            date,
            items: drills.map((d, i) => ({
              id: `${d.technique_id}-${i}-${Date.now()}`,
              technique_id: d.technique_id,
              text: `Drill: ${d.technique_name}`,
              sets: d.sets,
              reps: d.reps,
              completed: false,
            })),
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Weekly plan created.')
      setShowNewPlan(false)
      setSelectedTechs([])
      setWeeklyDrills([])
      setDailyDrills({})
      setDrillMode('weekly')
    },
    onError: () => toast.error('Failed to create plan.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: number; itemId: string }) =>
      planningApi.toggleChecklistItem(checklistId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  const filteredTechs = allTechniques.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) &&
    !selectedTechs.find(s => s.id === t.id)
  )

  const plansArray: WeeklyPlan[] = Array.isArray(plans) ? plans : []
  const currentAndFuture = plansArray.filter(p => !isPastWeek(p.week_start))
  const pastPlans = plansArray.filter(p => isPastWeek(p.week_start))

  const handleCreate = () => {
    const titleEl = document.getElementById('plan_title') as HTMLInputElement
    const goalsEl = document.getElementById('plan_goals') as HTMLTextAreaElement
    const sessionsEl = document.getElementById('sessions_planned') as HTMLInputElement

    createMutation.mutate({
      week_start: weekStartInput,
      sessions_planned: Number(sessionsEl.value),
      title: titleEl.value,
      goals: goalsEl.value,
      focus_technique_ids: selectedTechs.map(t => t.id),
      drill_mode: drillMode,
      weekly_drills: drillMode === 'weekly' ? weeklyDrills : [],
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Deliberate Practice</p>
          <h1 className="font-display text-2xl sm:text-4xl tracking-wider text-mat-text uppercase">Weekly Planner</h1>
        </div>
        <button onClick={() => setShowNewPlan(!showNewPlan)} className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs shrink-0">
          <Plus size={14} /> {showNewPlan ? 'Cancel' : 'New Plan'}
        </button>
      </div>

      {/* ── New Plan Form ── */}
      {showNewPlan && (
        <div className="bg-mat-card border border-mat-border p-6 space-y-5 animate-slide-up">
          <h3 className="font-display text-xl tracking-wider text-mat-text uppercase flex items-center gap-2">
            <CalendarDays size={15} className="text-mat-gold" />
            Create Weekly Plan
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Week Starting</label>
              <input type="date" value={weekStartInput} onChange={e => setWeekStartInput(e.target.value)} className="mat-input" />
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

          {/* Focus techniques */}
          <div>
            <label className="mat-label">Focus Techniques</label>
            {selectedTechs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTechs.map(t => (
                  <span key={t.id} className="flex items-center gap-1.5 bg-mat-panel border border-mat-gold/30 px-2.5 py-1 text-xs text-mat-gold">
                    {t.name}
                    <button type="button" onClick={() => setSelectedTechs(p => p.filter(x => x.id !== t.id))}><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input value={techSearch} onChange={e => setTechSearch(e.target.value)} className="mat-input" placeholder="Search techniques to focus on..." />
              {techSearch && filteredTechs.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-mat-panel border border-mat-border max-h-40 overflow-y-auto">
                  {filteredTechs.slice(0, 6).map((t: TechniqueMinimal) => (
                    <button key={t.id} onClick={() => { setSelectedTechs(p => [...p, t]); setTechSearch('') }}
                      className="w-full text-left px-4 py-2 hover:bg-mat-darker text-sm">
                      <span className="text-mat-text">{t.name}</span>
                      <span className="text-mat-text-dim text-xs ml-2">{t.position}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drill mode toggle */}
          <div className="border border-mat-border p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Dumbbell size={14} className="text-mat-gold" />
                <span className="text-mat-text text-sm font-medium">Drill Tracking</span>
              </div>
              <div className="flex items-center gap-1 bg-mat-panel border border-mat-border p-0.5">
                <button
                  type="button"
                  onClick={() => { setDrillMode('weekly'); setDailyDrills({}) }}
                  className={cn('text-xs px-3 py-1.5 transition-colors', drillMode === 'weekly' ? 'bg-mat-gold text-mat-black font-bold' : 'text-mat-text-muted hover:text-mat-text')}
                >
                  For the Week
                </button>
                <button
                  type="button"
                  onClick={() => { setDrillMode('daily'); setWeeklyDrills([]) }}
                  className={cn('text-xs px-3 py-1.5 transition-colors', drillMode === 'daily' ? 'bg-mat-gold text-mat-black font-bold' : 'text-mat-text-muted hover:text-mat-text')}
                >
                  Per Day
                </button>
              </div>
            </div>

            {drillMode === 'weekly' && (
              <div className="space-y-3">
                <DrillList drills={weeklyDrills} onRemove={i => setWeeklyDrills(p => p.filter((_, idx) => idx !== i))} />
                <DrillPicker allTechniques={allTechniques} onAdd={d => setWeeklyDrills(p => [...p, d])} />
              </div>
            )}

            {drillMode === 'daily' && (
              <div className="space-y-3">
                {DAY_NAMES.map((name, dayIndex) => {
                  const drills = dailyDrills[dayIndex] || []
                  const dateStr = weekStartInput
                    ? format(addDays(parseISO(weekStartInput), dayIndex), 'MMM d')
                    : ''
                  return (
                    <div key={dayIndex} className="border border-mat-border p-3 space-y-2">
                      <p className="text-mat-text-muted text-xs font-medium uppercase tracking-wide">
                        {name} {dateStr && <span className="text-mat-text-dim">({dateStr})</span>}
                      </p>
                      <DrillList drills={drills} onRemove={i => setDailyDrills(p => ({ ...p, [dayIndex]: (p[dayIndex] || []).filter((_, idx) => idx !== i) }))} />
                      <DrillPicker
                        allTechniques={allTechniques}
                        onAdd={d => setDailyDrills(p => ({ ...p, [dayIndex]: [...(p[dayIndex] || []), d] }))}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary px-6 py-2.5 flex items-center gap-2">
            {createMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Creating...</> : 'Create Plan'}
          </button>
        </div>
      )}

      {/* ── Plans ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-mat-gold" /></div>
      ) : plansArray.length === 0 ? (
        <div className="py-20 text-center text-mat-text-dim text-sm">
          No plans yet. Create your first weekly plan to start training deliberately.
        </div>
      ) : (
        <div className="space-y-3">
          {currentAndFuture.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              defaultOpen={isCurrentWeek(plan.week_start)}
              onToggleItem={(checklistId, itemId) => toggleMutation.mutate({ checklistId, itemId })}
              allTechniques={allTechniques}
            />
          ))}

          {pastPlans.length > 0 && (
            <div className="border border-mat-border">
              <button onClick={() => setPastOpen(o => !o)}
                className="w-full px-6 py-3 flex items-center justify-between text-left group hover:bg-mat-card transition-colors">
                <span className="text-mat-text-muted text-xs uppercase tracking-widest">Previous Weeks ({pastPlans.length})</span>
                <ChevronDown size={14} className={cn('text-mat-text-dim group-hover:text-mat-gold transition-transform duration-300', pastOpen ? 'rotate-180' : '')} />
              </button>
              <Collapsible open={pastOpen}>
                <div className="space-y-px border-t border-mat-border">
                  {pastPlans.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      defaultOpen={false}
                      onToggleItem={(checklistId, itemId) => toggleMutation.mutate({ checklistId, itemId })}
                      allTechniques={allTechniques}
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
