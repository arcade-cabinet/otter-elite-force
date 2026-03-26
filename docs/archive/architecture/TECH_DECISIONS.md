# Technology Stack Decisions & Rationale

## Executive Summary

**DECISION (Updated): Migrate to Babylon.js + Reactylon + Expo Stack**

After initial analysis favoring Three.js/R3F, the strategic decision was made to **MIGRATE to Babylon.js 8 + Reactylon + Expo** for production-ready mobile-first development. This document reflects the final decision and rationale.

---

## Current Production Stack (Post-Migration)

### 3D Graphics: Babylon.js 8.52

**Library:** Babylon.js 8.52.0  
**React Integration:** Reactylon 3.5.4  
**Physics:** Havok 1.3.11 (AAA-grade)

**Why Babylon.js over Three.js:**
1. **Built for games** - Game engine first, not visualization library
2. **Havok Physics integration** - Native support for AAA physics
3. **Better tooling** - Inspector, scene optimizer, profiler built-in
4. **Reactylon** - Declarative JSX components for all Babylon.js classes
5. **Production features** - Particle systems, animation, audio engine complete
6. **Mobile-first** - Better React Native integration via @babylonjs/react-native

**Decision Context:**
- Initial preference was Three.js + R3F for bundle size
- Reality: Mobile-first game needs proper native support
- Babylon.js + Reactylon + Expo provides complete mobile solution
- Migration cost: 100+ hours, but necessary for production

---

### Physics: Havok

**Library:** @babylonjs/havok 1.3.11

**Why Havok over Rapier:**
- **AAA pedigree** - Used in Halo, Elden Ring, Call of Duty
- **Native Babylon.js integration** - First-class support
- **Complete feature set** - Ragdolls, advanced constraints, cloth
- **WebAssembly** - High performance
- **Production proven** - Industry standard for games

**Previous Stack:** Rapier via @react-three/rapier (excellent, but requires Three.js)

---

### Mobile Framework: Expo 52 + React Native 0.76

**Why Expo over Capacitor:**
1. **React Native native** - Built for RN from ground up
2. **Metro bundler** - Optimized for React Native code splitting
3. **OTA updates** - Over-the-air updates without app store
4. **Better dev experience** - Expo Go, EAS Build, clear documentation
5. **Native APIs** - Complete access to device features
6. **Cross-platform** - iOS, Android, Web from single codebase

**Previous Consideration:** Capacitor (removed - wrong approach for React Native)

---

### Build System: Metro

**Library:** Metro 0.84.0 + @react-native/metro-config

**Why Metro over Vite:**
1. **React Native standard** - Official bundler for RN
2. **Code splitting** - Optimized for mobile bundle sizes
3. **Fast refresh** - Better HMR than Vite for RN
4. **Asset handling** - Built for React Native asset resolution
5. **Platform support** - iOS, Android, Web simultaneously

**Previous Stack:** Vite 7.3.1 (removed - incompatible with React Native)

---

**Last Updated:** 2026-02-24  
**Decision Status:** IMPLEMENTED  
**Previous Decision:** SUPERSEDED (Three.js + R3F + Capacitor)
