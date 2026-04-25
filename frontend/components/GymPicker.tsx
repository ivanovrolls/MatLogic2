'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { socialApi } from '@/lib/api'
import type { Gym } from '@/lib/types'
import { Check, Loader2, MapPin, Plus, X } from 'lucide-react'

interface GymPickerProps {
  value: number | null
  initialName?: string
  onChange: (gymId: number | null) => void
}

export function GymPicker({ value, initialName = '', onChange }: GymPickerProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Gym | null>(
    value ? { id: value, name: initialName, aliases: '', member_count: 0 } : null,
  )
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createAliases, setCreateAliases] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: results, isFetching } = useQuery<Gym[]>({
    queryKey: ['gym-search', query],
    queryFn: () => socialApi.gymSearch(query).then(r => r.data),
    enabled: isOpen && !showCreate,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: () => socialApi.gymCreate({ name: createName.trim(), aliases: createAliases.trim() }),
    onSuccess: res => {
      const gym: Gym = res.data
      setSelected(gym)
      onChange(gym.id)
      setIsOpen(false)
      setShowCreate(false)
      setQuery('')
      queryClient.invalidateQueries({ queryKey: ['gym-search'] })
    },
  })

  const handleSelect = (gym: Gym) => {
    setSelected(gym)
    onChange(gym.id)
    setIsOpen(false)
    setQuery('')
    setShowCreate(false)
  }

  const handleClear = () => {
    setSelected(null)
    onChange(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const openCreate = () => {
    setCreateName(query)
    setCreateAliases('')
    setShowCreate(true)
  }

  if (selected) {
    return (
      <div className="mat-input flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={13} className="text-mat-gold shrink-0" />
          <span className="text-sm truncate">{selected.name}</span>
        </div>
        <button type="button" onClick={handleClear} className="text-mat-text-dim hover:text-mat-text shrink-0 transition-colors">
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          className="mat-input pr-8"
          placeholder="Search your gym..."
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
        />
        {isFetching && (
          <Loader2
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-mat-text-dim pointer-events-none"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-mat-card border border-mat-border shadow-lg max-h-64 overflow-y-auto">
          {!showCreate ? (
            <>
              {results?.map(gym => (
                <button
                  key={gym.id}
                  type="button"
                  onClick={() => handleSelect(gym)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-mat-muted text-left border-b border-mat-border/50 last:border-0 transition-colors"
                >
                  <span className="text-mat-text text-sm">{gym.name}</span>
                  <span className="text-mat-text-dim text-xs shrink-0 ml-3">
                    {gym.member_count} {gym.member_count === 1 ? 'member' : 'members'}
                  </span>
                </button>
              ))}
              {results?.length === 0 && !isFetching && (
                <p className="px-4 py-3 text-mat-text-dim text-xs">No gyms found.</p>
              )}
              {query.trim() && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-full flex items-center gap-2 px-4 py-3 text-mat-gold hover:bg-mat-muted border-t border-mat-border text-sm transition-colors"
                >
                  <Plus size={13} />
                  Create &quot;{query.trim()}&quot;
                </button>
              )}
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest">New Gym</p>
              <div>
                <label className="mat-label">Full Name</label>
                <input
                  className="mat-input"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="e.g. Marcos Nardini Brazilian Jiujitsu"
                  autoFocus
                />
              </div>
              <div>
                <label className="mat-label">Abbreviation (optional)</label>
                <input
                  className="mat-input"
                  value={createAliases}
                  onChange={e => setCreateAliases(e.target.value)}
                  placeholder="e.g. MNBJJ"
                />
              </div>
              {createMutation.isError && (
                <p className="text-mat-red-light text-xs">
                  {(createMutation.error as any)?.response?.data?.detail || 'Failed to create gym.'}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!createName.trim() || createMutation.isPending}
                  className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createMutation.isPending
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Check size={12} />}
                  Create Gym
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs text-mat-text-dim border border-mat-border hover:text-mat-text transition-colors"
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
