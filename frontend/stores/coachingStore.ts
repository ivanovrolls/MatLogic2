import { create } from 'zustand'

interface CoachingStore {
  isCoachMode: boolean
  enterCoachMode: () => void
  exitCoachMode: () => void
}

export const useCoachingStore = create<CoachingStore>((set) => ({
  isCoachMode: false,
  enterCoachMode: () => set({ isCoachMode: true }),
  exitCoachMode: () => set({ isCoachMode: false }),
}))
