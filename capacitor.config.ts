import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arcadecabinet.ottereliteforce',
  appName: 'OTTER: ELITE FORCE',
  webDir: 'dist',
  
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffaa00',
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },

    Keyboard: {
      resize: 'native',
    },

    Haptics: {
      // Enable haptic feedback for game events
    },
  },

  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },

  ios: {
    contentInset: 'always',
  },
};

export default config;
