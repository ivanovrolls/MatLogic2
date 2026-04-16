'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn, BELT_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, BookOpen, Database, CalendarDays,
  Swords, BarChart2, Trophy, User, LogOut, ChevronRight, Shield
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sessions', label: 'Sessions', icon: BookOpen },
  { href: '/techniques', label: 'Techniques', icon: Database },
  { href: '/planning', label: 'Planner', icon: CalendarDays },
  { href: '/sparring', label: 'Sparring', icon: Swords },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/competition', label: 'Competition', icon: Trophy },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out.')
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-mat-darker border-r border-mat-border fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-mat-border">
        <Link href="/dashboard" className="font-display text-2xl tracking-widest">
          <span className="text-mat-gold">MAT</span>
          <span className="text-mat-text">LOGIC</span>
        </Link>
      </div>

      {/* User info */}
      {user && (
        <Link href="/profile" className="px-4 py-4 border-b border-mat-border flex items-center gap-3 hover:bg-mat-card transition-colors group">
          <div className="w-9 h-9 bg-mat-muted flex items-center justify-center text-mat-gold font-bold text-sm shrink-0">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-mat-text text-xs font-semibold truncate">{user.username}</p>
            <p className="text-mat-text-muted text-xs capitalize truncate">{user.belt} belt</p>
          </div>
          <ChevronRight size={12} className="text-mat-text-dim group-hover:text-mat-gold ml-auto shrink-0 transition-colors" />
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
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
      </nav>

      {/* Footer */}
      <div className="border-t border-mat-border py-3 px-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 text-mat-text-muted hover:text-mat-text text-sm transition-colors hover:bg-mat-card"
        >
          <User size={14} />
          <span>Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-mat-text-muted hover:text-mat-red-light text-sm transition-colors hover:bg-mat-card"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
