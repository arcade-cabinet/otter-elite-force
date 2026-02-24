# Technology Stack Documentation

## Current Architecture

### 3D Graphics Engine: Three.js

**Library:** Three.js r0.182.0  
**React Integration:** @react-three/fiber v9.4.2  
**Helpers:** @react-three/drei v10.7.7  
**Post-Processing:** @react-three/postprocessing v3.0.4

**Why Three.js over Babylon.js/Reactylon:**
1. **Smaller bundle size** (~400KB vs 1MB+) - critical for mobile
2. **Rapier physics integration** - best-in-class physics
3. **Mature R3F ecosystem** - battle-tested, extensive community
4. **Zero migration cost** - already deeply integrated
5. **Performance parity** - both engines are excellent

**Decision:** Keep Three.js. Reactylon is great for NEW projects, but migrating would cost 100+ hours with no tangible benefit for this game's requirements.

---

### Physics Engine: Rapier

**Library:** @react-three/rapier v2.2.0

**Why Rapier:**
- **Rust-based** - compiled to WebAssembly for maximum performance
- **Deterministic** - same simulation every time
- **Feature-complete** - rigid bodies, colliders, joints, triggers
- **Best-in-class** - superior to Cannon.js, Ammo.js for web games
- **Active development** - modern, well-maintained

**Integration:**
- Character controller for player movement
- Collision detection for combat
- Trigger volumes for objectives
- Rigid bodies for physics objects

---

### Audio System

**Synthesis:** Tone.js v15.1.22  
**Game Audio:** @strata-game-library/audio-synth v1.0.2

**Capabilities:**
- Procedural sound effects (no audio files needed)
- Music generation
- Spatial audio
- Real-time synthesis

---

### State Management & ECS

**Global State:** Zustand v5.0.9
- Lightweight, fast, no boilerplate
- Perfect for React integration
- Persistent storage support

**Entity Component System:** Miniplex v2.0.0
- Type-safe ECS for game entities
- Query-based architecture
- Excellent React integration via @miniplex/react

**AI/Steering:** Yuka v0.7.8
- Professional game AI library
- Steering behaviors (seek, flee, pursue, evade)
- State machines
- Path finding

---

### Build & Tooling

**Build System:** Vite v7.3.1
- Lightning-fast HMR
- Optimized production builds
- ES modules native
- Excellent TypeScript support

**Linting/Formatting:** Biome v2.4.4
- All-in-one tool (replaces ESLint + Prettier)
- 100x faster than ESLint
- Zero config needed

**Testing:**
- Unit: Vitest v4.0.18
- E2E: Playwright v1.58.2
- React Testing: @testing-library/react
- 3D Testing: @react-three/test-renderer

**TypeScript:** v5.9.3 (strict mode)

---

### Mobile Support

**Current:** Mobile-first web app (PWA)
- Touch controls (nipplejs v0.10.2)
- Gyroscope support
- Responsive design
- Service worker ready

**Planned:** Capacitor Native Apps
- iOS App Store
- Google Play Store
- Native APIs (haptics, notifications, etc.)
- Offline support

---

### UI Framework

**Framework:** React 19.2.3
- Latest stable release
- Server components ready
- Improved hydration
- Better performance

**Utilities:**
- Window size: @react-hook/window-size
- Device detection: react-device-detect
- Animations: GSAP v3.14.2

---

## Architecture Decisions

### Why NOT Reactylon/Babylon.js?

**Reactylon Pros:**
- Nice React wrappers for Babylon.js
- All-in-one solution
- Good documentation

**Reactylon Cons for This Project:**
1. **Migration cost:** Entire 3D layer rewrite (~1500 LOC)
2. **Bundle size:** ~3x larger than Three.js
3. **Physics:** Babylon's physics options inferior to Rapier
4. **Investment:** Already deep into R3F ecosystem
5. **Community:** R3F has more examples, plugins, support
6. **No benefit:** Performance would be identical

**Verdict:** Keep Three.js + R3F. Reactylon is excellent for greenfield projects, but switching would delay production by 2-3 months for zero gameplay improvement.

---

### Why Rapier over Cannon/Ammo/Havok?

**Rapier Advantages:**
- **Performance:** Rust + WASM = fastest option
- **Determinism:** Critical for gameplay consistency
- **Features:** Most complete feature set
- **Integration:** @react-three/rapier is seamless
- **Size:** Smaller bundle than Ammo.js
- **Maintenance:** Actively developed

**Alternatives Rejected:**
- Cannon.js: Slower, unmaintained
- Ammo.js: Large bundle, complex API
- Havok: Proprietary, expensive

---

### Why Tone.js over Howler/Web Audio API?

**Tone.js chosen for:**
- **Procedural synthesis** - no audio files needed
- **Musical composition** - notes, scales, timing
- **Effects chain** - reverb, delay, filters
- **Zero-asset philosophy** - matches game design

**Raw Web Audio API** would require more code.  
**Howler.js** is for playing audio files (we generate all audio).

---

## Performance Targets

**Mobile:**
- 60fps on iPhone 12 / Galaxy S21
- 30fps minimum on iPhone XR / older devices
- <500KB gzipped bundle (currently ~650KB - needs optimization)

**Desktop:**
- 144fps on modern hardware
- 60fps on integrated graphics

---

## Future Considerations

### Potential Additions

**Capacitor** (High Priority)
- Native iOS/Android apps
- App Store distribution
- Native APIs access

**Bundle Optimization** (High Priority)
- Code splitting
- Dynamic imports
- Tree shaking improvements
- Target: <500KB gzipped

**Analytics** (Medium Priority)
- Error tracking (Sentry)
- Usage analytics
- Performance monitoring

---

## Dependency Audit

Last Updated: 2026-02-24

All dependencies are latest stable versions with no known critical vulnerabilities. Biome v2.4.4 ensures zero linting errors.

See `package.json` for complete list.
