'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { techniquesApi } from '@/lib/api'
import { POSITION_LABELS, TYPE_LABELS, cn } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, Loader2, Pencil, X, ArrowRight, Check, ChevronDown, GraduationCap } from 'lucide-react'
import type { Technique, Sequence, SequenceNode, SequenceArrow } from '@/lib/types'

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

const ARROW_COLORS = [
  { hex: '#EAB308', label: 'Gold' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#22C55E', label: 'Green' },
  { hex: '#3B82F6', label: 'Blue' },
  { hex: '#A855F7', label: 'Purple' },
  { hex: '#F97316', label: 'Orange' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#FFFFFF', label: 'White' },
]

function DifficultyBar({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`w-3 h-1.5 ${n <= value ? 'bg-mat-gold' : 'bg-mat-muted'}`} />
      ))}
    </div>
  )
}

// ─── Techniques tab ───────────────────────────────────────────────────────────

function TechniquesTab() {
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
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

  const grouped = techniques.reduce((acc, t) => {
    const pos = t.position
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(t)
    return acc
  }, {} as Record<string, Technique[]>)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <Link href="/techniques/new" className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs">
          <Plus size={14} /> Add Technique
        </Link>
      </div>

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
                    className={`border transition-colors group flex flex-col ${
                      t.coach_assignment_pending
                        ? 'bg-mat-gold/5 border-mat-gold/50 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'bg-mat-card border-mat-border hover:border-mat-gold/40'
                    }`}
                  >
                    <Link href={`/techniques/${t.id}`} className="block p-4 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-mat-text font-semibold text-sm leading-tight pr-2">{t.name}</p>
                        <span className={`text-xs font-bold uppercase shrink-0 ${TYPE_COLORS[t.technique_type] || 'text-mat-text-muted'}`}>
                          {t.type_display}
                        </span>
                      </div>
                      {t.coach_assignment_pending && (
                        <p className="text-mat-gold text-xs mb-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-mat-gold inline-block animate-pulse" />
                          From coach: {t.coach_assigned_by_username}
                        </p>
                      )}
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
                    {!t.coach_assignment_pending && (
                      <div className="flex items-center justify-end gap-0.5 px-3 pb-2 border-t border-mat-border sm:border-transparent sm:opacity-0 sm:group-hover:opacity-100 sm:border-t-0 transition-opacity">
                        <Link
                          href={`/techniques/${t.id}/edit`}
                          className="p-1.5 text-mat-text-dim hover:text-mat-gold transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <Pencil size={12} />
                        </Link>
                        <button
                          onClick={() => { if (confirm('Delete this technique?')) deleteMutation.mutate(t.id) }}
                          className="p-1.5 text-mat-text-dim hover:text-mat-red-light transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
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

// ─── Sequence builder ─────────────────────────────────────────────────────────

const CELL_W = 148
const CELL_H = 78
const GAP = 10
const COLS = 4

function cellCenter(col: number, row: number) {
  return {
    x: col * (CELL_W + GAP) + CELL_W / 2,
    y: row * (CELL_H + GAP) + CELL_H / 2,
  }
}

function ArrowPath({ from, to, color, label, markerId, onClick, animate }: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  label: string
  markerId: string
  onClick?: () => void
  animate?: boolean
}) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const endX = to.x - (dx / len) * 14
  const endY = to.y - (dy / len) * 14
  const cpx = mx - dy * 0.15
  const cpy = my + dx * 0.15
  const d = `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${endX} ${endY}`

  return (
    // pointer-events="all" overrides the parent SVG's pointer-events="none",
    // so arrows are clickable without the SVG blocking underlying cell clicks.
    <g
      style={{ pointerEvents: onClick ? 'all' : 'none' }}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} style={{ pointerEvents: 'none' }} />
        </marker>
      </defs>
      {/* Wide transparent hit area catches the click */}
      <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
      {/* Visual path — draw-in animation when animate=true */}
      <path
        d={d}
        stroke={color}
        strokeWidth={2}
        fill="none"
        style={{
          pointerEvents: 'none',
          ...(animate && {
            strokeDasharray: 400,
            animation: 'arrowDraw 0.55s ease-out forwards',
          }),
        }}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text x={cpx} y={cpy - 6} textAnchor="middle" fontSize={10} fill={color} style={{ pointerEvents: 'none' }} className="select-none">
          {label}
        </text>
      )}
    </g>
  )
}

function TechniquePickerModal({ techniques, onSelect, onClose }: {
  techniques: Technique[]
  onSelect: (t: Technique) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = techniques.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (POSITION_LABELS[t.position] || t.position).toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-sm p-5 space-y-4 animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Pick Technique</h3>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text"><X size={16} /></button>
        </div>
        <div className="relative shrink-0">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-mat-text-dim" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="mat-input pl-8 text-sm" autoFocus />
        </div>
        <div className="overflow-y-auto space-y-1 flex-1">
          {filtered.length === 0 ? (
            <p className="text-mat-text-dim text-sm text-center py-4">No techniques found.</p>
          ) : filtered.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full text-left px-3 py-2.5 hover:bg-mat-darker transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-mat-text text-sm font-medium">{t.name}</p>
                <p className="text-mat-text-dim text-xs">{POSITION_LABELS[t.position] || t.position}</p>
              </div>
              <span className={`text-xs font-bold uppercase ${TYPE_COLORS[t.technique_type] || 'text-mat-text-dim'}`}>
                {t.type_display}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ArrowEditPopover({ arrow, onSave, onDelete, onClose }: {
  arrow: SequenceArrow
  onSave: (color: string, label: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [color, setColor] = useState(arrow.color)
  const [label, setLabel] = useState(arrow.label)
  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-xs p-5 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">Edit Arrow</h3>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text"><X size={16} /></button>
        </div>
        <div>
          <label className="mat-label">Colour</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {ARROW_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                style={{ background: c.hex, borderColor: color === c.hex ? c.hex : 'transparent' }}
                className={`w-7 h-7 border-2 transition-transform ${color === c.hex ? 'scale-125' : 'hover:scale-110'}`}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="mat-label">Label</label>
          <input value={label} onChange={e => setLabel(e.target.value)} className="mat-input" placeholder="e.g. if they defend..." />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(color, label)} className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1">
            <Check size={12} /> Save
          </button>
          <button onClick={onDelete} className="btn-secondary px-4 py-2 text-xs text-mat-red-light hover:text-mat-red-light">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SequenceGrid({ sequence, techniques, isEditing, onRefresh }: {
  sequence: Sequence
  techniques: Technique[]
  isEditing: boolean
  onRefresh: () => void
}) {
  const queryClient = useQueryClient()
  const [arrowMode, setArrowMode] = useState(false)
  const [arrowFromId, setArrowFromId] = useState<number | null>(null)
  const [pickerCell, setPickerCell] = useState<{ col: number; row: number } | null>(null)
  const [editingArrow, setEditingArrow] = useState<SequenceArrow | null>(null)
  const [exploding, setExploding] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const prevEditing = useRef(isEditing)

  useEffect(() => {
    const wasEditing = prevEditing.current
    prevEditing.current = isEditing
    if (wasEditing && !isEditing) {
      setExploding(true)
      setAnimKey(k => k + 1)
      const t = setTimeout(() => setExploding(false), 700)
      return () => clearTimeout(t)
    }
  }, [isEditing])

  const addNodeMutation = useMutation({
    mutationFn: (data: object) => techniquesApi.addSequenceNode(sequence.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); onRefresh() },
    onError: () => toast.error('Failed to add node.'),
  })
  const removeNodeMutation = useMutation({
    mutationFn: (nodeId: number) => techniquesApi.removeSequenceNode(sequence.id, nodeId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); onRefresh() },
    onError: () => toast.error('Failed to remove node.'),
  })
  const addArrowMutation = useMutation({
    mutationFn: (data: object) => techniquesApi.addSequenceArrow(sequence.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); onRefresh(); setArrowFromId(null) },
    onError: () => toast.error('Failed to add arrow.'),
  })
  const updateArrowMutation = useMutation({
    mutationFn: ({ arrowId, color, label }: { arrowId: number; color: string; label: string }) =>
      techniquesApi.updateSequenceArrow(sequence.id, arrowId, { color, label }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); onRefresh(); setEditingArrow(null) },
    onError: () => toast.error('Failed to update arrow.'),
  })
  const removeArrowMutation = useMutation({
    mutationFn: (arrowId: number) => techniquesApi.removeSequenceArrow(sequence.id, arrowId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); onRefresh(); setEditingArrow(null) },
    onError: () => toast.error('Failed to remove arrow.'),
  })

  const nodeMap = useMemo(() => {
    const m = new Map<string, SequenceNode>()
    sequence.nodes.forEach(n => m.set(`${n.grid_col},${n.grid_row}`, n))
    return m
  }, [sequence.nodes])

  const maxRow = sequence.nodes.reduce((max, n) => Math.max(max, n.grid_row), -1)
  const rows = isEditing ? Math.max(maxRow + 2, 2) : Math.max(maxRow + 1, 1)

  const gridW = COLS * CELL_W + (COLS - 1) * GAP
  const gridH = rows * CELL_H + (rows - 1) * GAP

  const handleCellClick = (col: number, row: number, node: SequenceNode | undefined) => {
    if (!isEditing && !arrowMode) return
    if (arrowMode) {
      if (!node) return
      if (arrowFromId === null) {
        setArrowFromId(node.id)
      } else if (arrowFromId === node.id) {
        setArrowFromId(null)
      } else {
        addArrowMutation.mutate({ from_node_id: arrowFromId, to_node_id: node.id, color: '#EAB308', label: '' })
      }
      return
    }
    if (node) return
    setPickerCell({ col, row })
  }

  const toggleArrowMode = () => {
    setArrowMode(v => !v)
    setArrowFromId(null)
  }

  return (
    <div className="space-y-3">
      {isEditing && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleArrowMode}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors', arrowMode
              ? 'border-mat-gold bg-mat-gold/10 text-mat-gold'
              : 'border-mat-border text-mat-text-muted hover:border-mat-gold/50 hover:text-mat-text'
            )}
          >
            <ArrowRight size={12} />
            {arrowMode ? (arrowFromId ? 'Click target node…' : 'Click source node…') : 'Add Arrow'}
          </button>
          {arrowMode && (
            <button onClick={() => { setArrowMode(false); setArrowFromId(null) }} className="text-mat-text-dim hover:text-mat-text text-xs px-2 py-1.5">
              Cancel
            </button>
          )}
          <p className="text-mat-text-dim text-xs ml-2">
            {arrowMode ? 'Select two nodes to connect.' : 'Click empty cells to add techniques.'}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: gridW, height: gridH }}>
          {/* In edit mode: render all cells (empty ones are click targets).
              In view mode: only render occupied cells — no ghost boxes. */}
          {isEditing
            ? Array.from({ length: rows }, (_, row) =>
                Array.from({ length: COLS }, (_, col) => {
                  const node = nodeMap.get(`${col},${row}`)
                  const isSource = arrowFromId !== null && node?.id === arrowFromId
                  return (
                    <div
                      key={`${col}-${row}`}
                      style={{
                        position: 'absolute',
                        left: col * (CELL_W + GAP),
                        top: row * (CELL_H + GAP),
                        width: CELL_W,
                        height: CELL_H,
                      }}
                      className={cn(
                        'border transition-colors text-xs overflow-hidden',
                        node
                          ? isSource
                            ? 'border-mat-gold bg-mat-gold/20 ring-1 ring-mat-gold cursor-pointer'
                            : arrowMode
                              ? 'border-mat-gold/60 bg-mat-card cursor-pointer hover:border-mat-gold'
                              : 'border-mat-border bg-mat-card'
                          : !arrowMode
                            ? 'border-mat-border/40 bg-mat-darker/40 cursor-pointer hover:border-mat-gold/40 hover:bg-mat-card/60'
                            : 'border-transparent'
                      )}
                      onClick={() => handleCellClick(col, row, node)}
                    >
                      {node ? (
                        <div className="p-2 h-full flex flex-col justify-between relative group">
                          <div>
                            <p className="text-mat-text font-semibold text-xs leading-tight truncate">{node.technique.name}</p>
                            <p className={`text-[10px] font-bold uppercase mt-0.5 ${TYPE_COLORS[node.technique.technique_type] || 'text-mat-text-dim'}`}>
                              {node.technique.technique_type.replace('_', ' ')}
                            </p>
                          </div>
                          <p className="text-mat-text-dim text-[10px] truncate">{POSITION_LABELS[node.technique.position] || node.technique.position}</p>
                          {!arrowMode && (
                            <button
                              onClick={e => { e.stopPropagation(); removeNodeMutation.mutate(node.id) }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-mat-text-dim hover:text-mat-red-light transition-all p-0.5"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ) : !arrowMode ? (
                        <div className="w-full h-full flex items-center justify-center text-mat-text-dim/40">
                          <Plus size={14} />
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )
            : sequence.nodes.map(node => {
                // Compute explosion offset: direction from grid center outward
                const centerCol = sequence.nodes.reduce((s, n) => s + n.grid_col, 0) / (sequence.nodes.length || 1)
                const centerRow = sequence.nodes.reduce((s, n) => s + n.grid_row, 0) / (sequence.nodes.length || 1)
                const ex = (node.grid_col - centerCol) * 10
                const ey = (node.grid_row - centerRow) * 10
                return (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: node.grid_col * (CELL_W + GAP),
                      top: node.grid_row * (CELL_H + GAP),
                      width: CELL_W,
                      height: CELL_H,
                      '--ex': `${ex}px`,
                      '--ey': `${ey}px`,
                      animation: exploding ? 'nodeExplode 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                    } as React.CSSProperties}
                    className="border border-mat-border bg-mat-card text-xs overflow-hidden"
                  >
                    <div className="p-2 h-full flex flex-col justify-between">
                      <div>
                        <p className="text-mat-text font-semibold text-xs leading-tight truncate">{node.technique.name}</p>
                        <p className={`text-[10px] font-bold uppercase mt-0.5 ${TYPE_COLORS[node.technique.technique_type] || 'text-mat-text-dim'}`}>
                          {node.technique.technique_type.replace('_', ' ')}
                        </p>
                      </div>
                      <p className="text-mat-text-dim text-[10px] truncate">{POSITION_LABELS[node.technique.position] || node.technique.position}</p>
                    </div>
                  </div>
                )
              })
          }

          {/* SVG arrow overlay.
              pointer-events-none on the SVG means transparent areas don't block
              cell clicks. Arrow <g> elements with pointer-events="all" override
              this for interactive arrows (SVG children can re-enable pointer
              events even when the SVG parent has none). */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: gridW, height: gridH }}
          >
            {sequence.arrows.map(arrow => {
              const fromNode = sequence.nodes.find(n => n.id === arrow.from_node)
              const toNode = sequence.nodes.find(n => n.id === arrow.to_node)
              if (!fromNode || !toNode) return null
              const fc = cellCenter(fromNode.grid_col, fromNode.grid_row)
              const tc = cellCenter(toNode.grid_col, toNode.grid_row)
              // Scope marker ID to sequence + animKey to avoid cross-sequence
              // collisions and to get fresh markers after each edit session.
              const markerId = `arrow-s${sequence.id}-k${animKey}-${arrow.color.replace('#', '')}`
              return (
                <ArrowPath
                  key={`${arrow.id}-${animKey}`}
                  from={fc}
                  to={tc}
                  color={arrow.color}
                  label={arrow.label}
                  markerId={markerId}
                  onClick={isEditing ? () => setEditingArrow(arrow) : undefined}
                  animate={exploding}
                />
              )
            })}
          </svg>
        </div>
      </div>

      {pickerCell && (
        <TechniquePickerModal
          techniques={techniques}
          onSelect={t => {
            addNodeMutation.mutate({ technique_id: t.id, grid_col: pickerCell.col, grid_row: pickerCell.row })
            setPickerCell(null)
          }}
          onClose={() => setPickerCell(null)}
        />
      )}

      {editingArrow && (
        <ArrowEditPopover
          arrow={editingArrow}
          onSave={(color, label) => updateArrowMutation.mutate({ arrowId: editingArrow.id, color, label })}
          onDelete={() => removeArrowMutation.mutate(editingArrow.id)}
          onClose={() => setEditingArrow(null)}
        />
      )}
    </div>
  )
}

function SequenceCard({ sequence, techniques, onDelete }: {
  sequence: Sequence
  techniques: Technique[]
  onDelete: () => void
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editingGrid, setEditingGrid] = useState(false)
  const [editName, setEditName] = useState(sequence.name)
  const [editDesc, setEditDesc] = useState(sequence.description)

  const updateMutation = useMutation({
    mutationFn: (data: object) => techniquesApi.updateSequence(sequence.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); setEditingMeta(false); toast.success('Sequence updated.') },
    onError: () => toast.error('Failed to update.'),
  })

  const respondMutation = useMutation({
    mutationFn: (action: 'accept' | 'decline') => techniquesApi.respondToCoachSequence(sequence.id, action),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
      toast.success(action === 'accept' ? 'Sequence accepted.' : 'Sequence declined.')
    },
    onError: () => toast.error('Failed to respond.'),
  })

  const refreshSequence = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sequences'] })
  }, [queryClient])

  const nodeCount = sequence.nodes.length
  const preview = sequence.nodes.slice(0, 3).map(n => n.technique.name)

  return (
    <div className={cn(
      'border transition-colors',
      sequence.coach_assignment_pending
        ? 'bg-mat-gold/5 border-mat-gold/50 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
        : 'bg-mat-card border-mat-border'
    )}>
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-mat-darker/40 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg tracking-wider text-mat-text uppercase truncate">{sequence.name}</h3>
            {sequence.coach_assignment_pending && (
              <span className="text-mat-gold text-xs flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-mat-gold inline-block animate-pulse" />
                From coach: {sequence.coach_assigned_by_username}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-mat-text-dim text-xs">{nodeCount} technique{nodeCount !== 1 ? 's' : ''}</span>
            {preview.length > 0 && (
              <span className="text-mat-text-muted text-xs truncate">{preview.join(' → ')}{nodeCount > 3 ? ' …' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
          {sequence.coach_assignment_pending ? (
            <>
              <button
                onClick={() => respondMutation.mutate('accept')}
                disabled={respondMutation.isPending}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Check size={11} /> Accept
              </button>
              <button
                onClick={() => respondMutation.mutate('decline')}
                disabled={respondMutation.isPending}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 text-mat-red-light"
              >
                <X size={11} /> Decline
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditingMeta(v => !v); setExpanded(true); setEditName(sequence.name); setEditDesc(sequence.description) }}
                className="p-1.5 text-mat-text-dim hover:text-mat-gold transition-colors"
                title="Edit name / description"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => { if (confirm('Delete this sequence?')) onDelete() }}
                className="p-1.5 text-mat-text-dim hover:text-mat-red-light transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
        {/* Outside stopPropagation div so clicking it bubbles to the header toggle */}
        <ChevronDown size={13} className={cn('text-mat-text-dim transition-transform ml-2 shrink-0', expanded ? 'rotate-180' : '')} />
      </div>

      {expanded && (
        <div className="border-t border-mat-border p-5 space-y-4 animate-slide-up">
          {editingMeta && (
            <div className="bg-mat-panel border border-mat-gold/30 p-4 space-y-3">
              <p className="text-mat-gold text-xs uppercase tracking-widest">Edit Details</p>
              <div>
                <label className="mat-label">Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="mat-input" />
              </div>
              <div>
                <label className="mat-label">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="mat-input resize-none" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ name: editName, description: editDesc })}
                  disabled={updateMutation.isPending}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {updateMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                </button>
                <button onClick={() => setEditingMeta(false)} className="btn-secondary text-xs px-3 py-2">Cancel</button>
              </div>
            </div>
          )}

          {sequence.description && !editingMeta && (
            <p className="text-mat-text-muted text-sm">{sequence.description}</p>
          )}

          {/* Grid toolbar — edit grid toggle is separate from metadata editing */}
          {!sequence.coach_assignment_pending && (
            <div className="flex items-center justify-between">
              <p className="text-mat-text-dim text-xs uppercase tracking-widest">Flow</p>
              <button
                onClick={() => setEditingGrid(v => !v)}
                className={cn('text-xs px-3 py-1.5 border flex items-center gap-1.5 transition-colors', editingGrid
                  ? 'border-mat-gold bg-mat-gold/10 text-mat-gold'
                  : 'border-mat-border text-mat-text-muted hover:border-mat-gold/50 hover:text-mat-text'
                )}
              >
                <Pencil size={11} /> {editingGrid ? 'Done Editing' : 'Edit Flow'}
              </button>
            </div>
          )}

          <SequenceGrid
            sequence={sequence}
            techniques={techniques}
            isEditing={editingGrid && !sequence.coach_assignment_pending}
            onRefresh={refreshSequence}
          />
        </div>
      )}
    </div>
  )
}

// ─── Create sequence modal ────────────────────────────────────────────────────

function CreateSequenceModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () => techniquesApi.createSequence({ name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
      toast.success('Sequence created.')
      onClose()
    },
    onError: () => toast.error('Failed to create sequence.'),
  })

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-border w-full max-w-sm p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">New Sequence</h2>
          <button onClick={onClose} className="text-mat-text-dim hover:text-mat-text"><X size={16} /></button>
        </div>
        <div>
          <label className="mat-label">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mat-input" placeholder="e.g. Closed Guard Attacks" autoFocus />
        </div>
        <div>
          <label className="mat-label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mat-input resize-none" placeholder="Describe this flow..." />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create
          </button>
          <button onClick={onClose} className="btn-secondary px-5 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Sequences tab ────────────────────────────────────────────────────────────

function SequencesTab() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: seqData, isLoading: seqLoading } = useQuery({
    queryKey: ['sequences'],
    queryFn: () => techniquesApi.listSequences().then(r => r.data?.results || r.data),
  })
  const { data: techData } = useQuery({
    queryKey: ['techniques', '', '', ''],
    queryFn: () => techniquesApi.list({ page_size: 200 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => techniquesApi.deleteSequence(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); toast.success('Sequence deleted.') },
    onError: () => toast.error('Failed to delete.'),
  })

  const sequences: Sequence[] = Array.isArray(seqData) ? seqData : []
  const techniques: Technique[] = techData?.results || (Array.isArray(techData) ? techData : [])

  const pending = sequences.filter(s => s.coach_assignment_pending)
  const own = sequences.filter(s => !s.coach_assignment_pending)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Flow Diagrams</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2.5 flex items-center gap-2 text-xs">
          <Plus size={14} /> New Sequence
        </button>
      </div>

      {seqLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <ArrowRight size={32} className="text-mat-text-dim mx-auto" />
          <p className="text-mat-text-muted text-sm">No sequences yet.</p>
          <p className="text-mat-text-dim text-xs">Build a flow diagram linking your techniques with colour-coded arrows.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-xs mt-2">
            Create Your First Sequence
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest flex items-center gap-2">
                <GraduationCap size={12} className="text-mat-gold" /> From Coach
              </p>
              {pending.map(s => (
                <SequenceCard
                  key={s.id}
                  sequence={s}
                  techniques={techniques}
                  onDelete={() => deleteMutation.mutate(s.id)}
                />
              ))}
            </div>
          )}
          {own.length > 0 && (
            <div className="space-y-2">
              {pending.length > 0 && (
                <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-4">Your Sequences</p>
              )}
              {own.map(s => (
                <SequenceCard
                  key={s.id}
                  sequence={s}
                  techniques={techniques}
                  onDelete={() => deleteMutation.mutate(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateSequenceModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'techniques', label: 'Techniques' },
  { value: 'sequences', label: 'Sequences' },
]

export default function TechniquesPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState(TABS.some(t => t.value === initialTab) ? initialTab! : 'techniques')

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Your Arsenal</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Techniques</h1>
        </div>
      </div>

      <div className="flex border-b border-mat-border">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px',
              tab === t.value ? 'text-mat-gold border-mat-gold' : 'text-mat-text-muted border-transparent hover:text-mat-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'techniques' && <TechniquesTab />}
      {tab === 'sequences' && <SequencesTab />}
    </div>
  )
}
