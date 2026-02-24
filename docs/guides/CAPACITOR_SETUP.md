# Capacitor Mobile App Setup

## Overview

OTTER: ELITE FORCE uses Capacitor to package the web game as native iOS and Android apps, enabling App Store distribution and access to native device APIs.

## Installation

```bash
# Install Capacitor
pnpm add @capacitor/core @capacitor/cli
pnpm add @capacitor/ios @capacitor/android
pnpm add @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen

# Initialize platforms
npx cap add ios
npx cap add android
```

## Configuration

See `capacitor.config.ts` for app configuration.

**App ID:** `com.arcadecabinet.ottereliteforce`  
**App Name:** OTTER: ELITE FORCE

## Building

### iOS

```bash
# Build web assets
pnpm build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then build in Xcode for simulator or device.

### Android

```bash
# Build web assets
pnpm build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then build in Android Studio for emulator or device.

## Native Features

### Haptics

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light haptic feedback
await Haptics.impact({ style: ImpactStyle.Light });

// Medium haptic feedback
await Haptics.impact({ style: ImpactStyle.Medium });

// Heavy haptic feedback
await Haptics.impact({ style: ImpactStyle.Heavy });
```

### Status Bar

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Hide status bar (game mode)
await StatusBar.hide();

// Show status bar (menus)
await StatusBar.show();

// Set dark style
await StatusBar.setStyle({ style: Style.Dark });
```

### Splash Screen

Configured in `capacitor.config.ts`. Shows for 2 seconds on app launch.

## App Icons & Splash Screens

### iOS

Place assets in `ios/App/App/Assets.xcassets/`:
- AppIcon.appiconset/ - Various sizes for different devices
- Splash.imageset/ - Launch screen images

### Android

Place assets in `android/app/src/main/res/`:
- drawable/ - App icons
- drawable-land/ - Landscape splash
- drawable-port/ - Portrait splash

## Testing

### iOS Simulator

```bash
pnpm build
npx cap sync ios
npx cap run ios
```

### Android Emulator

```bash
pnpm build
npx cap sync android
npx cap run android
```

### Physical Devices

Requires developer certificates (iOS) or debug signing (Android).

## Distribution

### iOS App Store

1. Build in Xcode with Release configuration
2. Archive and upload to App Store Connect
3. Submit for review

### Google Play Store

1. Build signed APK/AAB in Android Studio
2. Upload to Google Play Console
3. Submit for review

## Environment Variables

For production builds, set in CI/CD:

```bash
CAPACITOR_ANDROID_KEYSTORE_PATH=/path/to/keystore
CAPACITOR_ANDROID_KEYSTORE_PASSWORD=xxx
CAPACITOR_IOS_CERTIFICATE=xxx
```

## Troubleshooting

### Build fails after sync

```bash
# Clean and rebuild
npx cap sync --force
```

### Assets not updating

```bash
# Clear and rebuild
rm -rf dist
pnpm build
npx cap sync
```

### Native API not working

Check that plugin is installed and properly imported:

```bash
pnpm list @capacitor/haptics
```

## Performance Notes

- Capacitor adds ~200KB to bundle
- Native API calls are asynchronous
- Test on real devices for accurate performance
- Use Chrome DevTools for remote debugging

## Additional Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Development](https://capacitorjs.com/docs/ios)
- [Android Development](https://capacitorjs.com/docs/android)
- [Plugins](https://capacitorjs.com/docs/apis)
