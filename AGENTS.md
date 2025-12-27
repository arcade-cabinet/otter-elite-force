# 🦦 AGENTS.md - Technical Briefing for OTTER: ELITE FORCE

## 1. Project Identity & Directive

**Project Name**: OTTER: ELITE FORCE (The Copper-Silt Reach)
**Core Aesthetic**: "Full Metal Jacket" meets "Wind in the Willows." 
**Primary Goal**: A persistent, procedurally generated 3rd-person tactical shooter with open-world exploration, territory occupation, and base building.

## 2. Architecture Overview

### Modular World System (Chunk-Based)
The game world is an infinite, persistent grid of **100x100 unit chunks**.
- **Deterministic Generation**: Chunks are generated on-the-fly using coordinate-based seeds.
- **Persistence**: Discovered chunk data (enemies, siphons, village status) is fixed in the `gameStore` and persisted to `localStorage`.
- **Verticality**: Integrated 3D physics with gravity, jumping, and AABB collision against platforms.

### State Management (Zustand)
The `gameStore` is the "Mission Control" for all persistent data:
- **Save Schema**: `{ rank, xp, coins, discoveredChunks, strategicObjectives, spoilsOfWar, upgrades, isLZSecured, baseComponents, difficultyMode }`.
- **Mode FSM**: `MENU`, `CUTSCENE`, `GAME`, `GAMEOVER`, `CANTEEN`.

### Input System (OTS Control)
- **Fluid Camera**: Tight "Over-the-Shoulder" (OTS) view with lateral offset and spring-arm physics.
- **Tactical Cluster**: Left joystick for movement, right-side cluster for `JUMP`, `GRIP` (climbing), `SCOPE`, and `SUPPORT`.
- **Gyroscopic Aiming**: Supported for mobile fine-tuning.

## 3. Core Systems

### Modular Otter System (MOS)
The `PlayerRig` is a modular assembly of:
- **High-Detail Base**: Detailed snouts, twitching whiskers, brow ridges, and expressive eyes.
- **Traits**: `baseSpeed`, `baseHealth`, `climbSpeed` mapped to character-specific physics.
- **Swappable Gear**: Procedural mounting for `headgear`, `vest`, `backgear`, and `weapons`.

### Tactical AI (Yuka FSM)
Enemies use a Finite State Machine for pack-hunting:
- **Gator States**: `IDLE`, `STALK`, `AMBUSH` (Periscope mode + Machine Gun), `RETREAT`.
- **Suppression**: Firepower physically affects enemy movement speed and behavior (ducking/hiding).
- **Ambush Predators**: Tree-hanging snakes and stationary Snapper bunkers complement the mobile gator squads.

### Base Building & Objectives
- **Occupation Mechanic**: Destroying industrial siphons "secures" territory, hoisting URA flags.
- **LZ/FOB**: Players secure an initial Landing Zone (0,0) and expand it using algorithmic modular components (stilts, floors, walls, roofs).
- **Strategic Verticals**:
  1. **Platoon**: Rescuing allies from prison camps at specific coordinates.
  2. **Arsenal**: Economic weapon/stat upgrades at the Canteen.
  3. **Intel**: Peacekeeping scores unlocking map data.

## 4. Development Guidelines

### Code Style
- **Modular Everything**: Keep entities (Enemies, Environment, Objectives) in their own subdirectories.
- **Performance First**: Use `InstancedMesh` for dense jungle elements (Mangroves, Reeds, Debris).
- **Procedural Nature**: Preserve the zero-external-asset rule. Models must be composed of primitives and synthesized audio.

### AI Agent Instructions
1. **Maintain the Grit**: Avoid sci-fi tropes. Stick to the "Vietnam with Otters" analog aesthetic.
2. **Respect Persistence**: When modifying chunks or entities, ensure the change is captured in the store if it needs to persist.
3. **OTS Perspective**: Design environments and UI for the "Down and In" over-the-shoulder camera.
4. **Suppression is Key**: Gameplay should reward fire-discipline and tactical positioning over arcade spraying.

### Common Pitfalls
- **Memory Leaks**: Dispose of instanced geometries and clear event listeners in `InputSystem`.
- **Store Bloat**: Only store the delta of discovered chunks; use the deterministic seed for static decoration.
- **Sync Issues**: Ensure Yuka vehicles and R3F meshes are tightly synced in the `useFrame` loop.
