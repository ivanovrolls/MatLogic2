'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back.')
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid credentials.'
      toast.error(msg)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-10">
        <Link href="/" className="font-display text-4xl tracking-widest">
          <span className="text-mat-gold">MAT</span>
          <span className="text-mat-text">LOGIC</span>
        </Link>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-2">
          Sign In to Your Account
        </p>
      </div>

      <div className="bg-mat-card border border-mat-border p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mat-label">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="your@email.com"
              className="mat-input"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-mat-red-light text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mat-label">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="mat-input pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mat-text-dim hover:text-mat-text-muted"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-mat-red-light text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Signing In...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-mat-text-muted text-sm mt-6">
        No account?{' '}
        <Link href="/register" className="text-mat-gold hover:text-mat-gold-light transition-colors">
          Start for free
        </Link>
      </p>
    </div>
  )
}
