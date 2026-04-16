'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchProfile } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [isAuthenticated, router, fetchProfile])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-mat-black">
      <Sidebar />
      <Header />
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
