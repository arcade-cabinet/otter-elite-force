# System Patterns: OTTER: ELITE FORCE

## Architecture Overview
Modular React 19 + TypeScript architecture with a clear domain separation:

```
src/
├── Core/       # Engine foundations (Audio, Input, GameLoop)
├── Entities/   # Game objects (Player, Enemies, Environment, Objectives)
├── Scenes/     # High-level mission states (Menu, Level, Canteen)
├── stores/     # State management (Zustand)
└── UI/         # HUD and overlay components
```

## Key Technical Decisions

### 1. Deterministic World Generation
Uses coordinate-based seeded random functions (`src/stores/worldGenerator.ts`) to ensure chunks are consistent without being stored in a database. This allows for an infinite, sharable world.

### 2. YUKA AI Framework
Enemy logic is decoupled from rendering. The `GatorAI` and other predator brains use the YUKA library for FSM (Finite State Machine) and steering behaviors (Seek, Flee, Wander, Arrive).

### 3. Tone.js Procedural Audio
All audio is synthesized. SFX use oscillator/noise chains. Music uses a pattern registry and cross-fade system to transition themes smoothly without clicks or pops.

### 4. Zustand Persistent Store
The `gameStore` acts as the global FSM. It tracks:
- Game mode (MENU, GAME, VICTORY, etc.)
- Player stats and position
- Discovered world chunks
- Save data (v8 schema) with auto-persistence to `localStorage`.

## Design Patterns

### Singleton Engines
`AudioEngine` and `InputSystem` are singletons to manage long-lived browser resources (AudioContext, EventListeners) independently of the React component lifecycle.

### Imperative Handles
The `Projectiles` and `Particles` systems use `useImperativeHandle` to provide high-performance, non-React methods for spawning thousands of objects without re-rendering the component tree.

### Safe-Area HUD
The UI layout uses CSS `env(safe-area-inset-*)` variables to ensure critical controls are visible on modern mobile devices with notches or dynamic islands.

## Implementation Standards
- **Strict Immutability**: Store updates must be deep-cloned.
- **Resource Cleanup**: All `useEffect` hooks must include thorough cleanup for Three.js objects and event listeners.
- **Performance**: Use `InstancedMesh` for dense vegetation (Reeds, Mangroves) to maintain 60fps.
