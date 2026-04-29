import type { CapacitorConfig } from '@capacitor/cli'

// Option A: the native app is a shell around your live hosted web app.
// Set CAPACITOR_SERVER_URL before running `npx cap sync` for production builds:
//   CAPACITOR_SERVER_URL=https://app.matlogic.com npx cap sync
// Leave it unset during local development (Capacitor will use the local build).
const serverUrl = process.env.CAPACITOR_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.matlogic.app',
  appName: 'MatLogic',
  webDir: 'out',

  ...(serverUrl
    ? { server: { url: serverUrl, cleartext: false } }
    : {}),

  plugins: {
    StatusBar: {
      style: 'light',      // light icons on the dark MatLogic background
      overlaysWebView: true,
    },
  },

  ios: {
    contentInset: 'always',        // safe-area CSS vars work correctly
    allowsLinkPreview: false,
    backgroundColor: '#080808',
  },

  android: {
    backgroundColor: '#080808',
    allowMixedContent: false,
  },
}

export default config
