import type { CapacitorConfig } from '@capacitor/cli'

// Production:  CAPACITOR_SERVER_URL=https://app.matlogic.com npx cap sync
// Local dev:   CAPACITOR_SERVER_URL=http://<LAN-IP>:3000 npx cap sync
//              (Android emulator: http://10.0.2.2:3000)
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
      style: 'light',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#080808',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
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
