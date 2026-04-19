'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from '@/stores/themeStore'

function ThemeInitializer() {
  const theme = useThemeStore(s => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1c1c1c',
            color: '#ebebeb',
            border: '1px solid #262626',
            borderRadius: '0',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#c9a227', secondary: '#080808' },
          },
          error: {
            iconTheme: { primary: '#b22222', secondary: '#080808' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
