'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { competitionApi } from '@/lib/api'
import { formatDuration, SESSION_TYPE_COLORS } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  format, subDays, addDays, parseISO, isSameDay, getDay, startOfDay,
  startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, getDate,
} from 'date-fns'
import {
  BookOpen, Flame, ChevronLeft, ChevronRight, Plus, Trophy, X, Loader2,
} from 'lucide-react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function TrainingCalendar({
  sessions,
  competitions,
}: {
  sessions: { date: string; id: number; session_type: string; session_type_display: string; duration: number }[]
  competitions: { date: string; id: number; name: string; result: string; result_display: string }[]
}) {
  const today = startOfDay(new Date())
  const minMonth = startOfMonth(subMonths(today, 12))
  const maxMonth = startOfMonth(addMonths(today, 12))

  const [viewedMonth, setViewedMonth] = useState(startOfMonth(today))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showAddComp, setShowAddComp] = useState(false)
  const [newCompName, setNewCompName] = useState('')
  const [newCompResult, setNewCompResult] = useState('')

  const queryClient = useQueryClient()

  const createCompMutation = useMutation({
    mutationFn: (data: object) => competitionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      toast.success('Competition saved.')
      setShowAddComp(false)
      setNewCompName('')
      setNewCompResult('')
    },
    onError: () => toast.error('Failed to save competition.'),
  })

  const changeMonth = (newMonth: Date) => {
    setViewedMonth(newMonth)
    setSelectedDay(null)
    setShowAddComp(false)
  }

  const monthStart = startOfMonth(viewedMonth)
  const monthEnd = endOfMonth(viewedMonth)

  const dow = getDay(monthStart)
  const mondayOffset = dow === 0 ? 6 : dow - 1
  const gridStart = subDays(monthStart, mondayOffset)

  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= monthEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }

  const enrichedSessions = (sessions || []).map(s => ({ ...s, day: startOfDay(parseISO(s.date)) }))
  const enrichedComps = (competitions || []).map(c => ({ ...c, day: startOfDay(parseISO(c.date)) }))

  const getSessionsForDay = (day: Date) => enrichedSessions.filter(s => isSameDay(s.day, day))
  const getCompsForDay = (day: Date) => enrichedComps.filter(c => isSameDay(c.day, day))

  const canGoPrev = viewedMonth > minMonth
  const canGoNext = viewedMonth < maxMonth

  const daySessions = selectedDay ? getSessionsForDay(selectedDay) : []
  const dayComps = selectedDay ? getCompsForDay(selectedDay) : []

  return (
    <div className="bg-mat-card border border-mat-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg tracking-wider uppercase text-mat-text flex items-center gap-2">
          <Flame size={15} className="text-mat-gold" />
          Training Calendar — {format(viewedMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(subMonths(viewedMonth, 1))}
            disabled={!canGoPrev}
            className="p-1 text-mat-text-muted hover:text-mat-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => changeMonth(startOfMonth(today))}
            className="px-2 text-mat-text-muted hover:text-mat-gold text-xs transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => changeMonth(addMonths(viewedMonth, 1))}
            disabled={!canGoNext}
            className="p-1 text-mat-text-muted hover:text-mat-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-mat-text-muted text-[10px] uppercase">{d[0]}</div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              const inMonth = isSameMonth(day, viewedMonth)
              const count = inMonth ? getSessionsForDay(day).length : 0
              const hasComp = inMonth && getCompsForDay(day).length > 0
              const isToday = isSameDay(day, today)
              const isSelected = !!selectedDay && isSameDay(day, selectedDay)

              let bg = inMonth ? 'bg-mat-panel hover:bg-mat-panel/80' : ''
              if (inMonth && count === 1) bg = 'bg-mat-gold/30 hover:bg-mat-gold/40'
              if (inMonth && count >= 2) bg = 'bg-mat-gold/60 hover:bg-mat-gold/70'

              let borderCls = inMonth ? 'border-mat-border' : 'border-transparent'
              if (inMonth && count === 1) borderCls = 'border-mat-gold/40'
              if (inMonth && count >= 2) borderCls = 'border-mat-gold/60'
              if (hasComp) borderCls = 'border-amber-500/70'

              return (
                <button
                  key={di}
                  onClick={() => {
                    if (!inMonth) return
                    if (isSelected) {
                      setSelectedDay(null)
                      setShowAddComp(false)
                    } else {
                      setSelectedDay(day)
                      setShowAddComp(false)
                    }
                  }}
                  disabled={!inMonth}
                  className={[
                    'relative h-8 flex flex-col items-start justify-start p-1 border rounded-[2px] transition-colors',
                    bg, borderCls,
                    isToday ? 'ring-1 ring-mat-gold' : '',
                    isSelected ? 'ring-1 ring-white/40' : '',
                    inMonth ? 'cursor-pointer' : 'cursor-default',
                  ].join(' ')}
                >
                  <span className={`text-[9px] leading-none font-medium ${
                    isToday ? 'text-mat-gold' : inMonth ? 'text-mat-text-muted' : 'text-transparent'
                  }`}>
                    {getDate(day)}
                  </span>
                  {hasComp && (
                    <Trophy size={7} className="absolute bottom-0.5 right-0.5 text-amber-400" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-panel border border-mat-border rounded-[1px]" />
          <span className="text-mat-text-dim text-xs">No training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-gold/30 border border-mat-gold/40 rounded-[1px]" />
          <span className="text-mat-text-dim text-xs">1 session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-mat-gold/60 border border-mat-gold/60 rounded-[1px]" />
          <span className="text-mat-text-dim text-xs">2+ sessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy size={9} className="text-amber-400" />
          <span className="text-mat-text-dim text-xs">Competition</span>
        </div>
      </div>

      {selectedDay && (
        <div className="mt-3 border-t border-mat-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mat-text text-sm font-medium">
              {format(selectedDay, 'EEEE, MMMM d')}
            </span>
            <button
              onClick={() => { setSelectedDay(null); setShowAddComp(false) }}
              className="text-mat-text-dim hover:text-mat-text transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {daySessions.length > 0 && (
            <div className="mb-2 space-y-1">
              {daySessions.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center gap-2 text-xs text-mat-text-muted hover:text-mat-gold transition-colors"
                >
                  <BookOpen size={10} />
                  <span className={SESSION_TYPE_COLORS[s.session_type] || 'text-mat-text-muted'}>
                    {s.session_type_display}
                  </span>
                  <span>· {formatDuration(s.duration)}</span>
                  <ChevronRight size={10} className="ml-auto" />
                </Link>
              ))}
            </div>
          )}

          {dayComps.length > 0 && (
            <div className="mb-2 space-y-1">
              {dayComps.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 text-xs text-amber-400">
                  <Trophy size={10} />
                  <span>{c.name}</span>
                  {c.result_display && (
                    <span className="text-mat-text-muted">· {c.result_display}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {daySessions.length === 0 && dayComps.length === 0 && (
            <p className="text-mat-text-dim text-xs mb-2">No activity logged.</p>
          )}

          {!showAddComp && (
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/sessions/new?date=${format(selectedDay, 'yyyy-MM-dd')}`}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Plus size={11} /> Log Session
              </Link>
              <button
                onClick={() => setShowAddComp(true)}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Trophy size={11} /> Add Competition
              </button>
            </div>
          )}

          {showAddComp && (
            <div className="space-y-2">
              <input
                className="mat-input text-xs"
                placeholder="Competition name (e.g. IBJJF Pan Ams)"
                value={newCompName}
                onChange={e => setNewCompName(e.target.value)}
              />
              <select
                className="mat-input text-xs"
                value={newCompResult}
                onChange={e => setNewCompResult(e.target.value)}
              >
                <option value="">— Result (leave blank if upcoming) —</option>
                <option value="gold">Gold Medal</option>
                <option value="silver">Silver Medal</option>
                <option value="bronze">Bronze Medal</option>
                <option value="participated">Participated</option>
                <option value="withdrew">Withdrew</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    createCompMutation.mutate({
                      name: newCompName,
                      date: format(selectedDay, 'yyyy-MM-dd'),
                      result: newCompResult,
                    })
                  }
                  disabled={!newCompName.trim() || createCompMutation.isPending}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createCompMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => { setShowAddComp(false); setNewCompName(''); setNewCompResult('') }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
