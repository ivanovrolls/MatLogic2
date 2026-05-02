'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useCoachingStore } from '@/stores/coachingStore'
import { cn, BELT_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, BookOpen, Database, CalendarDays,
  BarChart2, User, LogOut, ChevronRight, Swords,
  Sun, Moon, GraduationCap, X,
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { isCoachMode, enterCoachMode, exitCoachMode } = useCoachingStore()
  const queryClient = useQueryClient()
  const [showCoachPrompt, setShowCoachPrompt] = useState(false)

  const handleLogout = async () => {
    exitCoachMode()
    await logout()
    queryClient.clear()
    toast.success('Logged out.')
    router.push('/login')
  }

  const handleCoachClick = () => {
    if (isCoachMode) {
      router.push('/coaching')
    } else {
      setShowCoachPrompt(true)
    }
  }

  const handleEnterCoachMode = () => {
    enterCoachMode()
    setShowCoachPrompt(false)
    router.push('/coaching')
  }

  const handleExitCoachMode = () => {
    exitCoachMode()
    router.push('/dashboard')
  }

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

    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-mat-darker border-r border-mat-border fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-mat-border flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-2xl tracking-widest">
          <span className="text-mat-gold">MAT</span>
          <span className="text-mat-text">LOGIC</span>
        </Link>
        <NotificationCenter iconSize={16} />
      </div>

      {/* User info */}
      {user && (
        <Link href="/profile" className="px-4 py-4 border-b border-mat-border flex items-center gap-3 hover:bg-mat-card transition-colors group">
          <div className="w-9 h-9 bg-mat-muted flex items-center justify-center text-mat-gold font-bold text-sm shrink-0 overflow-hidden border border-mat-border">
            {user.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : user.username.slice(0, 2).toUpperCase()
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-mat-text text-xs font-semibold truncate">{user.username}</p>
            <p className="text-mat-text-muted text-xs capitalize truncate">{user.belt} belt</p>
          </div>
          <ChevronRight size={12} className="text-mat-text-dim group-hover:text-mat-gold ml-auto shrink-0 transition-colors" />
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map(({ href, label, icon: Icon, tutorialId }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              data-tutorial={tutorialId}
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150 relative group',
                active
                  ? 'text-mat-gold bg-mat-gold/5 border-l-2 border-mat-gold'
                  : 'text-mat-text-muted hover:text-mat-text hover:bg-mat-card border-l-2 border-transparent'
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}

        {/* Coach Mode + Light Mode */}
        <div className="border-t border-mat-border mt-2 pt-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-5 py-2.5 text-sm text-mat-text-muted hover:text-mat-gold hover:bg-mat-card border-l-2 border-transparent transition-all w-full"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="font-medium tracking-wide">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          {isCoachMode ? (
            <>
              <Link
                href="/coaching"
                className={cn(
                  'flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150 border-l-2',
                  pathname.startsWith('/coaching')
                    ? 'text-mat-gold bg-mat-gold/5 border-mat-gold'
                    : 'text-mat-gold/70 hover:text-mat-gold hover:bg-mat-card border-transparent'
                )}
              >
                <GraduationCap size={15} className="shrink-0" />
                <span className="font-medium tracking-wide">Coach View</span>
              </Link>
              <button
                onClick={handleExitCoachMode}
                className="flex items-center gap-3 px-5 py-2 text-xs text-mat-text-dim hover:text-mat-red-light transition-colors w-full border-l-2 border-transparent"
              >
                <X size={13} className="shrink-0" />
                Exit Coach Mode
              </button>
            </>
          ) : (
            <button
              onClick={handleCoachClick}
              className="flex items-center gap-3 px-5 py-2.5 text-sm text-mat-text-muted hover:text-mat-gold hover:bg-mat-card border-l-2 border-transparent transition-all w-full"
            >
              <GraduationCap size={15} className="shrink-0" />
              <span className="font-medium tracking-wide">Coach</span>
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-mat-border py-3 px-2">
        <AndroidInstallButton className="flex items-center gap-3 w-full px-3 py-2 text-mat-gold text-sm hover:bg-mat-card transition-colors" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-mat-text-muted hover:text-mat-red-light text-sm transition-colors hover:bg-mat-card"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  )
}
