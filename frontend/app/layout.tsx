import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'MatLogic — BJJ Training Intelligence',
  description: 'Track, analyse, and sharpen your Brazilian Jiu-Jitsu game.',
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#c9a227" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MatLogic" />
        {/* Prevents flash of unstyled theme on load */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('matlogic-theme');if(s){var d=JSON.parse(s);if(d.state&&d.state.theme==='light'){document.documentElement.setAttribute('data-theme','light')}}}catch(e){}})()` }} />
      </head>
      <body className="bg-mat-black text-mat-text antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
