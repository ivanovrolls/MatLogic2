'use client'

import { useState, useEffect, useCallback } from 'react'
import { _registerConfirmDialog } from '@/lib/confirm'

export function ConfirmDialog() {
  const [pending, setPending] = useState<{
    message: string
    danger: boolean
    resolve: (v: boolean) => void
  } | null>(null)

  const openDialog = useCallback(
    (message: string, danger: boolean) =>
      new Promise<boolean>(resolve => setPending({ message, danger, resolve })),
    []
  )

  useEffect(() => {
    _registerConfirmDialog(openDialog)
    return () => _registerConfirmDialog(null)
  }, [openDialog])

  if (!pending) return null

  const done = (v: boolean) => {
    pending.resolve(v)
    setPending(null)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-mat-black/80 p-4"
      onClick={() => done(false)}
    >
      <div
        className="bg-mat-card border border-mat-border w-full max-w-xs p-6 space-y-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-mat-text text-sm leading-relaxed">{pending.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => done(false)}
            className="btn-secondary text-xs px-5 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => done(true)}
            className={pending.danger ? 'btn-danger text-xs px-5 py-2' : 'btn-primary text-xs px-5 py-2'}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
