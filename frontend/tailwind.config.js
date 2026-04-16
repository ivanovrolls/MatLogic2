/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mat: {
          black: '#080808',
          darker: '#0d0d0d',
          dark: '#111111',
          card: '#161616',
          panel: '#1c1c1c',
          border: '#262626',
          muted: '#333333',
          gold: '#c9a227',
          'gold-light': '#e0b93a',
          'gold-dark': '#a8861f',
          red: '#8b1a1a',
          'red-light': '#b22222',
          'red-dark': '#6b0f0f',
          text: '#ebebeb',
          'text-muted': '#7a7a7a',
          'text-dim': '#4a4a4a',
          blue: '#1e3a5f',
          'blue-light': '#2d5a9e',
          green: '#1a5c1a',
          'green-light': '#2d8a2d',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'gold': '0 0 20px rgba(201, 162, 39, 0.15)',
        'gold-sm': '0 0 8px rgba(201, 162, 39, 0.2)',
        'red': '0 0 20px rgba(139, 26, 26, 0.2)',
        'card': '0 2px 8px rgba(0,0,0,0.6)',
        'modal': '0 8px 40px rgba(0,0,0,0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(201,162,39,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(201,162,39,0.4)' },
        },
      },
    },
  },
  plugins: [],
}
