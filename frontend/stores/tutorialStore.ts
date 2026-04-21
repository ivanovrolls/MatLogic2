import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TutorialState {
  hasSeenTutorial: boolean
  isOpen: boolean
  markAsSeen: () => void
  open: () => void
  close: () => void
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      isOpen: false,
      markAsSeen: () => set({ hasSeenTutorial: true, isOpen: false }),
      open: () => set({ isOpen: true }),
      close: () => set({ hasSeenTutorial: true, isOpen: false }),
    }),
    { name: 'matlogic-tutorial' }
  )
)
