import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'MatLogic — BJJ Training Intelligence',
  description: 'Track, analyse, and sharpen your Brazilian Jiu-Jitsu game.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-mat-black text-mat-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
