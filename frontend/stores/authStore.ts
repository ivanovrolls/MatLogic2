'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/lib/types'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: object) => Promise<void>
  logout: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login(email, password)
          localStorage.setItem('access_token', data.access)
          localStorage.setItem('refresh_token', data.refresh)
          set({
            accessToken: data.access,
            refreshToken: data.refresh,
            isAuthenticated: true,
          })
          await get().fetchProfile()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (formData) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register(formData)
          localStorage.setItem('access_token', data.access)
          localStorage.setItem('refresh_token', data.refresh)
          set({
            user: data.user,
            accessToken: data.access,
            refreshToken: data.refresh,
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        try {
          if (refreshToken) await authApi.logout(refreshToken)
        } catch {}
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      fetchProfile: async () => {
        try {
          const { data } = await authApi.getProfile()
          set({ user: data, isAuthenticated: true })
        } catch {
          set({ isAuthenticated: false })
        }
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'matlogic-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)
