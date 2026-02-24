# Capacitor Installation Script

This script installs Capacitor and initializes iOS/Android platforms.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Xcode (for iOS development) - macOS only
- Android Studio (for Android development)

## Installation

```bash
# Run this script to install Capacitor
chmod +x scripts/install-capacitor.sh
./scripts/install-capacitor.sh
```

## What This Script Does

1. Installs Capacitor core and CLI
2. Installs iOS and Android platforms
3. Installs essential plugins (Haptics, StatusBar, SplashScreen)
4. Initializes platforms (creates ios/ and android/ directories)
5. Syncs web build to native projects

## After Installation

### iOS Setup

```bash
# Open in Xcode
npx cap open ios

# Build for simulator
npx cap run ios --target="iPhone 15 Pro"

# Build for device (requires Apple Developer account)
npx cap run ios --target="Your Device Name"
```

### Android Setup

```bash
# Open in Android Studio
npx cap open android

# Build for emulator
npx cap run android

# Build for device
npx cap run android --target=<device-id>
```

## Updating

When you update the web app:

```bash
# Rebuild web assets
pnpm build

# Sync changes to native projects
npx cap sync
```

## Troubleshooting

### "Command not found: cap"

Make sure you've installed Capacitor:
```bash
pnpm install
```

### iOS build fails

1. Open Xcode
2. Go to Signing & Capabilities
3. Select your development team
4. Clean build folder (Cmd+Shift+K)
5. Build again (Cmd+B)

### Android build fails

1. Open Android Studio
2. Go to File → Sync Project with Gradle Files
3. Update Android SDK if prompted
4. Rebuild project

## Scripts

After installation, you can use these npm scripts:

```bash
# Build and sync to native
pnpm cap:sync

# Open iOS in Xcode
pnpm cap:ios

# Open Android in Android Studio
pnpm cap:android

# Run on iOS simulator
pnpm cap:run:ios

# Run on Android emulator
pnpm cap:run:android
```
