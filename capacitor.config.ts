import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.squareverse.iceiq',
  appName: 'Ice IQ',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#111827'
  },
  plugins: {
    FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com', 'apple.com'] },
    SplashScreen: { launchAutoHide: true, launchShowDuration: 800, backgroundColor: '#111827' }
  }
}

export default config
