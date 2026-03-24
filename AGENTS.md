# 🦦 AGENTS.md - Technical Briefing for OTTER: ELITE FORCE

> **Historical note (2026-03-24):** The open-world tactical-shooter direction below is legacy context. Active RTS canon is now defined by `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md` and the campaign-first RTS specs.

## 1. Project Identity & Directive

**Project Name**: OTTER: ELITE FORCE (The Copper-Silt Reach)
**Core Aesthetic**: "Full Metal Jacket" meets "Wind in the Willows"
**Technical Constraint**: Procedural Supremacy (No external assets)
**Primary Goal**: Create a mobile-first, procedurally generated 3rd-person tactical shooter with an open world, persistent progression, and base building.

## 2. Critical Design Philosophy

### Open World, NOT Levels

**THIS IS THE MOST IMPORTANT DESIGN DECISION.**

The game is a single, persistent open world — NOT a collection of discrete levels:

- ❌ NO level select screen
- ❌ NO "Mission 1, Mission 2, Mission 3" structure
- ❌ NO terrain regeneration on revisit

Instead:

- ✅ One continuous world generated chunk-by-chunk
- ✅ Chunks are FIXED once discovered (stored in Zustand)
- ✅ Returning to chunk (x:5, z:3) shows the exact same layout
- ✅ Changes persist: destroyed siphons stay destroyed

### Main Menu = Game Loader

The main menu is a **Campaign Command Interface**:

```
┌─────────────────────────────────────┐
│        OTTER: ELITE FORCE           │
│      Defend The Copper-Silt Reach   │
├─────────────────────────────────────┤
│                                     │
│     [ NEW GAME ]                    │
│     Start fresh deployment          │
│     Select difficulty mode          │
│                                     │
│     [ CONTINUE ]                    │
│     Resume saved campaign           │
│     (greyed if no save exists)      │
│                                     │
│     [ CANTEEN ]                     │
│     Visit Forward Operating Base    │
│     Purchase permanent upgrades     │
│                                     │
│     [ RESET DATA ]                  │
│                                     │
└─────────────────────────────────────┘
```

### Three Difficulty Modes (Escalation Only)

| Mode | Description | Key Mechanic |
|------|-------------|--------------|
| SUPPORT | Training wheels | Supply drops anywhere, extract anywhere |
| TACTICAL | Standard combat | "The Fall" at 30% HP, must return to LZ |
| ELITE | Permadeath | One death = campaign over, save purged |

**Critical Rule**: Difficulty can go UP but NEVER DOWN. Once you commit to TACTICAL, you cannot return to SUPPORT. This creates meaningful weight to difficulty decisions.

### Three Victory Verticals

To prevent gameplay monotony:

1. **Platoon Rescues**: Find and rescue characters at specific world coordinates
2. **Arsenal Upgrades**: Spend credits at Canteen for permanent gear improvements
3. **Intel Rewards**: High Peacekeeping scores reveal map POIs

### Base Building at LZ (0, 0)

The first objective is **securing your Landing Zone**:

- Modular construction: stilts, floors, walls, roofs
- Components snap together algorithmically
- Base state persists across sessions
- Expansion as resources are gathered

## 3. Architecture Overview

### The "Procedural Supremacy" Mandate

The entire game engine relies on runtime generation:

- **Libraries**: Three.js via ES Modules (R3F wrapper)
- **Assets**: No .obj, .gltf, .mp3 files — ALL procedural
- **Models**: Constructed from THREE.Group composition of primitives
- **Audio**: Synthesized in real-time using Tone.js (Web Audio API)

### Modern Modular Architecture

```
src/
├── Core/       # Engine foundations (Audio, Input, GameLoop)
├── Entities/   # Game objects (Player, Enemies, Environment)
│   ├── Enemies/     # Gator, Snake, Snapper with YUKA AI
│   ├── Environment/ # Hazards, Decorations, Objectives
│   └── ...
├── Scenes/     # Application states (Menu, Level, Canteen, Victory)
├── stores/     # Zustand state management
│   ├── gameStore.ts      # Main FSM and game state
│   ├── worldGenerator.ts # Chunk generation
│   └── persistence.ts    # Save/Load logic
└── UI/         # HUD and overlay components
```

### State Management: Zustand with Persistence

The `gameStore` is the global FSM tracking:

- **Game Mode**: MENU, CUTSCENE, GAME, VICTORY, GAMEOVER, CANTEEN
- **Open World State**: discoveredChunks, securedChunks, baseState
- **Player Progress**: health, position, kills, credits, territory score
- **Save Data**: v8 schema with localStorage persistence

## 4. Open World Chunk System

### Generation Rules

```typescript
// Coordinate-based deterministic seeding
function generateChunk(x: number, z: number): ChunkData {
  const seed = hashCoords(x, z);
  const rng = seededRandom(seed);

  return {
    id: `${x},${z}`,
    x,
    z,
    seed,
    terrainType: generateTerrainType(rng),
    entities: generateEntities(rng),
    decorations: generateDecorations(rng),
    secured: false,
  };
}
```

### Persistence Rules

1. **First Visit**: Chunk generated, stored in `discoveredChunks` Map
2. **Return Visit**: Chunk loaded from store — NEVER regenerated
3. **Modifications**: Destroyed objectives, rescued villagers persist
4. **Cache Limit**: Old chunks may be unloaded from memory but remain in storage

## 5. Three-Faction Conflict

### URA Peacekeepers (Player)
- Liberation and occupation mission
- Build base, rescue allies, secure territory
- Plant URA flags at captured siphon sites

### Scale-Guard Militia (Enemy)
- Industrial pollution cult of apex predators
- Guard siphons and gas stockpiles
- Hunt player with pack coordination

### Native Inhabitants (Neutral)
- Mustelid villagers caught in crossfire
- Await rescue and liberation
- Provide credits and intel when saved

## 6. Input System (The "Tactical Router")

Touch input routing separates UI from gameplay:

1. Check mode — if not GAME, allow native button clicks
2. Check target — if `<button>`, allow click propagation
3. Otherwise — map touch to virtual joystick logic

**Controls**:
- Left stick: Movement
- Right stick: Aim/Look
- GRIP button: Climbing (hold + right stick up/down)
- SCOPE button: Zoom toggle
- JUMP button: Vertical movement

## 7. Development Guidelines

### Code Style

- TypeScript with strict mode enabled
- Biome for linting and formatting (tabs, double quotes)
- Functional composition over deep inheritance
- Document complex procedural generation logic

### Testing

```bash
pnpm dev       # Development mode
pnpm build     # Production build verification
pnpm test      # Unit tests (Vitest)
pnpm test:e2e  # End-to-end tests (Playwright)
pnpm lint      # Biome linting
```

### Architecture Principles

1. **Separation of Concerns**: Render, logic, and input are separate
2. **Minimal Dependencies**: Native APIs over external libraries
3. **Performance First**: Target 60fps on mobile devices
4. **Procedural Everything**: Generate assets at runtime
5. **Open World First**: Every feature must respect chunk persistence

## 8. AI Agent Instructions

When working on this codebase:

### DO:
1. **Preserve Procedural Nature**: Never add external asset files
2. **Respect Open World**: Chunks must be fixed-on-discovery
3. **Mobile-First**: Always consider touch input and mobile performance
4. **Test Audio**: Web Audio requires user interaction to start
5. **Honor FSM**: Mode transitions must be explicit
6. **Maintain Grit**: Vietnam-era Mekong aesthetic, NOT sci-fi

### DON'T:
1. ❌ Add level select screens or level-based progression
2. ❌ Allow chunks to regenerate on revisit
3. ❌ Add cyborgs, time travel, or chrome aesthetics
4. ❌ Make characters purchasable (they must be rescued)
5. ❌ Allow difficulty downgrade
6. ❌ Break localStorage save schema without migration

### Common Pitfalls

- Don't break audio context initialization (MUST wait for user gesture)
- Don't interfere with touch event propagation for UI buttons
- Don't change localStorage key structure without migration logic
- Don't add Three.js types that conflict with runtime version (r160)
- Don't forget to persist world state changes to store

## 9. Immediate Implementation Priorities

1. **Main Menu Redesign**: Transform into New Game / Continue / Canteen loader
2. **Difficulty Selection**: Three modes with escalation lock
3. **Chunk Persistence**: Ensure discovered chunks never regenerate
4. **Territory Tracking**: HUD displays secured vs. total territory
5. **Base Building v1**: Simple modular construction at LZ

## 10. Reference Coordinates

| Coordinate (x, z) | Name | Purpose |
|-------------------|------|---------|
| (0, 0) | Landing Zone | Base, extraction point |
| (5, 5) | Prison Camp | Gen. Whiskers rescue |
| (10, -10) | Great Siphon | Boss encounter |
| (-15, 20) | Healer's Grove | Peacekeeping hub |
| (-10, 15) | Underwater Cache | Cpl. Splash rescue |
| (8, 8) | Gas Depot | Strategic cluster |
