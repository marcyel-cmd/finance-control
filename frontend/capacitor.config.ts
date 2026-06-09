import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.preve.financas',
  appName: 'Preve',
  webDir: 'dist',
  backgroundColor: '#0D1117',
  plugins: {
    SplashScreen: {
      backgroundColor: '#0D1117',
      // Fechamos manualmente via SplashScreen.hide() após o app montar (App.tsx)
      launchAutoHide: false,
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D1117',
    },
  },
};

export default config;
