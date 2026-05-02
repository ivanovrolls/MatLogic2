'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useCoachingStore } from '@/stores/coachingStore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Menu, X, LayoutDashboard, BookOpen, Database, CalendarDays,
  BarChart2, User, LogOut, Sun, Moon, Swords, GraduationCap,
} from 'lucide-react'
import { AndroidInstallButton } from '@/components/InstallPrompt'
import { useThemeStore } from '@/stores/themeStore'
import { NotificationCenter } from '@/components/NotificationCenter'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tutorialId: 'nav-dashboard' },
  { href: '/dojo', label: 'Dojo', icon: Swords, tutorialId: 'nav-dojo' },
  { href: '/sessions', label: 'Sessions', icon: BookOpen, tutorialId: 'nav-sessions' },
  { href: '/techniques', label: 'Techniques', icon: Database, tutorialId: 'nav-techniques' },
  { href: '/planning', label: 'Planner', icon: CalendarDays, tutorialId: 'nav-planner' },
  { href: '/progress', label: 'Analytics', icon: BarChart2, tutorialId: 'nav-analytics' },
  { href: '/my-profile', label: 'My Profile', icon: User, tutorialId: 'nav-profile-public' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [showCoachPrompt, setShowCoachPrompt] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { isCoachMode, enterCoachMode, exitCoachMode } = useCoachingStore()
  const queryClient = useQueryClient()

  const handleEnterCoachMode = () => {
    enterCoachMode()
    setShowCoachPrompt(false)
    setOpen(false)
    router.push('/coaching')
  }

  const handleLogout = async () => {
    exitCoachMode()
    await logout()
    queryClient.clear()
    toast.success('Logged out.')
    router.push('/login')
    setOpen(false)
  }

  // Allow Tutorial component to control menu open/close on mobile
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    const handleClose = () => setOpen(false)
    window.addEventListener('tutorial:open-menu', handleOpen)
    window.addEventListener('tutorial:close-menu', handleClose)
    return () => {
      window.removeEventListener('tutorial:open-menu', handleOpen)
      window.removeEventListener('tutorial:close-menu', handleClose)
    }
  }, [])

  return (
    <>
      {/* Coach Mode Prompt */}
      {showCoachPrompt && (
        <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
          <div className="bg-mat-card border border-mat-gold/30 w-full max-w-sm p-7 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-mat-gold/10 border border-mat-gold/30 flex items-center justify-center">
                  <GraduationCap size={16} className="text-mat-gold" />
                </div>
                <div>
                  <p className="text-mat-text-muted text-xs uppercase tracking-widest">Switch View</p>
                  <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">Coach Mode</h2>
                </div>
              </div>
              <button onClick={() => setShowCoachPrompt(false)} className="text-mat-text-dim hover:text-mat-text transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-mat-text-muted text-sm leading-relaxed">
              You&apos;ll switch to a coaching view showing your students&apos; training data. Your own data will be hidden until you exit.
            </p>
            <div className="flex gap-3">
              <button onClick={handleEnterCoachMode} className="btn-primary flex-1 py-2.5 text-sm">
                Enter Coach Mode
              </button>
              <button onClick={() => setShowCoachPrompt(false)} className="btn-secondary flex-1 py-2.5 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header lg:hidden fixed top-0 left-0 right-0 z-30 bg-mat-darker border-b border-mat-border px-4 pb-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-xl tracking-widest">
          <span className="text-mat-gold">MAT</span>
          <span className="text-mat-text">LOGIC</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationCenter iconSize={18} />
          <button
            onClick={() => setOpen(!open)}
            className="text-mat-text-muted hover:text-mat-gold transition-colors p-1"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-20 mat-overlay animate-fade-in overflow-y-auto"
          style={{ paddingTop: 'max(3.5rem, calc(2.75rem + var(--sat)))' }}
        >
          <nav className="px-4 py-6 space-y-1">
            {navItems.map(({ href, label, icon: Icon, tutorialId }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  data-tutorial={tutorialId}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 text-sm transition-colors',
                    active
                      ? 'text-mat-gold bg-mat-gold/5 border-l-2 border-mat-gold'
                      : 'text-mat-text-muted hover:text-mat-text border-l-2 border-transparent'
                  )}
                >
                  <Icon size={16} />
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
            <div className="divider" />
            <AndroidInstallButton className="flex items-center gap-4 w-full px-4 py-3 text-mat-gold text-sm" />
            <div className="divider" />
            <button
              onClick={() => { toggleTheme(); setOpen(false) }}
              className="flex items-center gap-4 w-full px-4 py-3 text-mat-text-muted text-sm border-l-2 border-transparent"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {isCoachMode ? (
              <>
                <Link
                  href="/coaching"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 text-sm border-l-2',
                    pathname.startsWith('/coaching')
                      ? 'text-mat-gold bg-mat-gold/5 border-mat-gold'
                      : 'text-mat-gold/70 border-transparent'
                  )}
                >
                  <GraduationCap size={16} /> Coach View
                </Link>
                <button
                  onClick={() => { exitCoachMode(); setOpen(false); router.push('/dashboard') }}
                  className="flex items-center gap-4 w-full px-4 py-3 text-mat-text-dim text-sm border-l-2 border-transparent"
                >
                  <X size={16} /> Exit Coach Mode
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowCoachPrompt(true)}
                className="flex items-center gap-4 w-full px-4 py-3 text-mat-text-muted text-sm border-l-2 border-transparent"
              >
                <GraduationCap size={16} /> Coach
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3 text-mat-red-light text-sm"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
