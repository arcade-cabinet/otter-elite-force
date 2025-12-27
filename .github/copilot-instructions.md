# GitHub Copilot Instructions for OTTER: ELITE FORCE

## Project Overview

OTTER: ELITE FORCE is a grit-focused tactical simulation set in the **Copper-Silt Reach**, building on a "Full Metal Jacket but with Otters" aesthetic. Built with React 19, Three.js (R3F), and TypeScript, the game features a persistent chunk-based open world, modular character rigs, and squad-based predator AI.

## Technology Stack

- **Frontend Framework**: React 19 RC
- **3D Engine**: Three.js r160 via @react-three/fiber
- **Game AI**: Yuka (FSM, Steering Behaviors)
- **State Management**: Zustand (Persistent Save Data)
- **Animation**: GSAP + Procedural Limbs
- **Build Tool**: Vite
- **Testing**: Vitest (Unit) + Playwright (E2E)

## Architecture Principles

### 1. Persistent Open World (Chunk-Based)
The world is a grid of 100x100 unit chunks.
- **Deterministic**: Use coordinate-based seeds for generation.
- **Persistent**: Save state (secured status, rescued allies) in `gameStore`.
- **Diorama Aesthetic**: Worlds must have physical depth and fade into "Napalm Haze" fog.

### 2. Modular Otter System (MOS)
The `PlayerRig` is a modular assembly.
- **No Smoothing**: Keep the rugged, primitive-based look but add high-detail features (whiskers, scars).
- **Interchangeable Gear**: Use the `Weapon` component for interchangeable armaments.
- **Physics Mapping**: Map `CharacterTraits` (speed, health) directly to character physics.

### 3. Tactical AI & Suppression
- **Pack Hunting**: Predators (Scale-Guard) must coordinate using Yuka's FSM.
- **Suppression**: sustained fire must physically affect enemy speed and behavior.
- **Ambush**: Gators rise from water, snakes strike from trees.

### 4. Zero External Assets
- **Procedural Models**: Constructed via THREE.Group composition of primitives.
- **Synthesized Audio**: Real-time synthesis via Tone.js. No .mp3 files.

## Coding Guidelines

### Zustand State
```typescript
// ✅ DO: Persist critical chunk data
secureChunk: (chunkId) => set(state => ({
  saveData: {
    ...state.saveData,
    discoveredChunks: {
      ...state.saveData.discoveredChunks,
      [chunkId]: { ...state.saveData.discoveredChunks[chunkId], secured: true }
    }
  }
}))
```

### R3F Performance
- **Instancing**: ALWAYS use `InstancedMesh` for repeated jungle elements (Reeds, Lilypads, Mangroves).
- **LOD**: Simplify distant geometries.
- **Cleanup**: Dispose of geometries and materials in `useEffect`.

## What NOT to Do

❌ **No Sci-Fi Drift**: No neon, no future-tech, no aliens. Keep it analog (1960s grit).  
❌ **No End-of-Turn Gaps**: Ensure all logic is fully implemented, no placeholders.  
❌ **No Orphaned Objects**: Ensure all world entities are tied to the chunk seed or store state.

## Git Commit Convention
Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.

## Resources
- [Yuka AI Docs](https://mugen87.github.io/yuka/docs/)
- [Tone.js Framework](https://tonejs.github.io/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
