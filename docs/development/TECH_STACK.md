# Technology Stack Documentation

**Last Updated:** 2026-02-24  
**Status:** Production (Post-Migration)

---

## Current Architecture

### 3D Graphics Engine: Babylon.js

**Library:** @babylonjs/core 8.52.0  
**React Integration:** reactylon 3.5.4  
**Loaders:** @babylonjs/loaders 8.52.0  
**Materials:** @babylonjs/materials 8.52.0  
**Post-Processing:** @babylonjs/post-processes 8.52.0  
**Native Support:** @babylonjs/react-native 1.9.0

**Why Babylon.js:**
- Built for games, not just visualization
- Native Havok physics integration
- Complete tooling (Inspector, Profiler, Scene Optimizer)
- Reactylon provides declarative JSX components
- Better React Native integration
- Production-ready particle systems, animations, audio

**Usage:**
```tsx
<Canvas>
  <scene clearColor={[0.1, 0.1, 0.1, 1]}>
    <arcRotateCamera name="camera" alpha={0} beta={1} radius={10} />
    <hemisphericLight name="light" intensity={0.7} />
    <box name="myBox" size={2} position={[0, 1, 0]}>
      <standardMaterial name="mat" diffuseColor={[1, 0.5, 0]} />
    </box>
  </scene>
</Canvas>
```

---

### Physics Engine: Havok

**Library:** @babylonjs/havok 1.3.11

**Why Havok:**
- AAA-grade physics (Halo, Elden Ring, Call of Duty)
- WebAssembly compiled for performance
- Complete feature set: ragdolls, cloth, advanced constraints
- Native Babylon.js integration
- Industry standard

**Features:**
- Rigid body dynamics
- Advanced collision detection
- Character controllers
- Joints and constraints
- Trigger volumes

---

### Mobile Framework: Expo + React Native

**Core:**
- expo 52.0.49
- react-native 0.76.5
- react-native-web 0.21.2

**Expo Modules:**
- expo-gl 15.0.5 (WebGL/OpenGL)
- expo-asset 11.0.5 (asset management)
- expo-constants 17.0.8 (app constants)
- expo-status-bar 2.0.1 (status bar control)

**Why Expo:**
- Complete React Native framework
- OTA updates without app store
- Expo Go for instant testing
- EAS Build for native compilation
- Web support via react-native-web
- Metro bundler integration

---

### Build & Tooling

**Bundler:** Metro 0.84.0 (React Native standard)  
**Metro Config:** @react-native/metro-config 0.84.0  
**Linter/Formatter:** @biomejs/biome 2.4.4  
**TypeScript:** 5.9.3  
**Package Manager:** pnpm 10.26.2

**Why Metro:**
- Official React Native bundler
- Code splitting optimized for mobile
- Fast Refresh (HMR)
- Asset resolution for native platforms
- Cross-platform (iOS, Android, Web)

**Build Commands:**
```bash
pnpm dev                 # Metro dev server (web)
pnpm start               # Metro dev server (all platforms)
pnpm build               # Export static web build
pnpm android             # Start Android
pnpm ios                 # Start iOS
```

---

### Styling: NativeWind

**Library:** nativewind 4.2.2  
**CSS Framework:** tailwindcss 3.3.2

**Why NativeWind:**
- Tailwind CSS for React Native
- Same utility classes work on web and native
- Platform-specific variants (ios:, android:, web:)
- Design tokens (Vietnam-era color palette)
- Compiled at build time for performance

**Usage:**
```tsx
<View className="flex-1 bg-jungle-night p-4">
  <Text className="text-2xl font-bold text-otter-orange">
    OTTER: ELITE FORCE
  </Text>
</View>
```

---

### State Management

**Global State:** zustand 5.0.9  
**Entity Component System:** miniplex 2.0.0, @miniplex/react 2.0.0-next.10

**Why This Combination:**
- Zustand for UI state (simple, performant)
- Miniplex for game entities (ECS pattern)
- Clean separation of concerns
- TypeScript support

---

### Navigation & AI

**Pathfinding:** recast-detour 1.6.4  
**Steering:** yuka 0.7.8

**Why Recast:**
- Industry-standard navmesh generation
- Crowd simulation (100+ agents)
- Dynamic obstacle avoidance
- WebAssembly performance

---

### Audio System

**Synthesis:** tone 15.1.22  
**Game Audio:** @strata-game-library/audio-synth 1.0.2, @strata-game-library/core 1.4.11

**Capabilities:**
- Procedural sound generation (no audio files)
- Music synthesis
- Spatial audio
- Real-time effects

---

### Testing

**Unit Tests:** vitest 4.0.18  
**E2E Tests:** @playwright/test 1.58.2  
**Component Tests:** @testing-library/react 16.3.2, @testing-library/dom 10.4.1  
**Test Utilities:** @testing-library/jest-dom 6.9.1, @testing-library/user-event 14.5.3  
**Coverage:** @vitest/coverage-v8 4.0.18  
**Test Environments:** happy-dom 20.7.0, jsdom 28.1.0

**E2E Device Coverage:**
- 17 device configurations
- iPhone 15 Pro, iPhone SE
- Pixel 8a
- OnePlus Open (folded/unfolded)
- iPad Pro, Pixel Tablet
- Desktop Chrome
- Portrait and landscape orientations

---

### Additional Libraries

**UI/Interaction:**
- react 19.2.3
- react-dom 19.2.3
- nipplejs 0.10.2 (touch joystick)
- @react-hook/window-size 3.1.1
- react-device-detect 2.2.3

**Animation:**
- gsap 3.14.2

**Storage:**
- @react-native-async-storage/async-storage 3.0.1

**Types:**
- @types/react 19.2.8
- @types/react-dom 19.2.3
- @types/node 25.3.0

---

## Performance Targets

**Web:**
- Load time: < 3s
- FPS: 60 (target), 50 (minimum)
- Bundle size: < 2MB uncompressed
- Memory: < 200MB initial

**Mobile:**
- 60fps on mid-range devices (Pixel 8a, iPhone SE)
- Startup time: < 5s
- Battery efficient rendering

---

## Deployment

**Web:** GitHub Pages via GitHub Actions  
**iOS:** Expo EAS Build → App Store  
**Android:** Expo EAS Build → Google Play

**CI/CD:**
- GitHub Actions (2 workflows)
- All actions SHA-pinned for security
- Automated testing (lint, unit, e2e, build)

---

## Future Considerations

**Performance:**
- Implement texture atlasing for sprites
- Add LOD (Level of Detail) systems
- Optimize draw calls with batching

**Features:**
- Advanced particle effects
- Dynamic lighting and shadows
- Texture support for terrain
- Full audio integration

**Mobile:**
- Native builds for iOS/Android
- App store deployment
- Push notifications
- In-app purchases (if needed)

---

## Dependency Audit

**Production Dependencies:** 28  
**Dev Dependencies:** 21  
**Total:** 49 packages

**Security:**
- All GitHub Actions SHA-pinned
- Regular dependency updates
- Biome for code quality
- TypeScript for type safety

**Bundle Analysis:**
- Bundle size tracking via CI
- Performance budgets enforced
- Lazy loading for sprites

---

## Migration History

**From:** Three.js + R3F + Vite + Capacitor  
**To:** Babylon.js + Reactylon + Metro + Expo  
**Date:** February 2026  
**Reason:** Mobile-first production readiness

**Removed:**
- three, @react-three/fiber, @react-three/drei, @react-three/rapier
- vite (kept only for unit test runner)
- Capacitor (ios/, android/ directories)
- 1,161 total files deleted

**Added:**
- Babylon.js ecosystem (core, havok, reactylon)
- Expo + React Native
- Metro bundler
- NativeWind
- 444 new packages (React Native ecosystem)

---

**See also:**
- [TECH_DECISIONS.md](../architecture/TECH_DECISIONS.md) - Why these choices
- [TESTING.md](./TESTING.md) - Testing strategy
- [BUNDLE_SIZE.md](./BUNDLE_SIZE.md) - Performance tracking
