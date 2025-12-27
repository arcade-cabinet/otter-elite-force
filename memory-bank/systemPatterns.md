# System Patterns: OTTER: ELITE FORCE

## Architecture Overview

Modular React 19 + TypeScript architecture with clear domain separation:

```
src/
├── Core/       # Engine foundations (Audio, Input, GameLoop)
├── Entities/   # Game objects (Player, Enemies, Environment, Objectives)
│   ├── Enemies/     # Gator, Snake, Snapper AI
│   ├── Environment/ # OilSlick, ModularHut, Vegetation
│   └── ...
├── Scenes/     # High-level mission states (Menu, Level, Canteen, Victory)
├── stores/     # State management (Zustand)
│   ├── gameStore.ts      # Main game state FSM
│   ├── worldGenerator.ts # Chunk generation
│   ├── persistence.ts    # Save/Load logic
│   └── types.ts          # Shared interfaces
└── UI/         # HUD and overlay components
```

## Key Technical Decisions

### 1. Open World Chunk System (NOT Levels)

**Critical Design Pattern**: No discrete levels — one persistent open world.

```typescript
// World generation is coordinate-based and deterministic
type ChunkData = {
  x: number;
  y: number;
  seed: number;           // Deterministic from coordinates
  entities: Entity[];     // Enemies, objectives, decorations
  isDiscovered: boolean;  // Has player visited?
  isSecured: boolean;     // Is URA flag planted?
};

// Key behaviors:
// 1. generateChunk(x, y) always returns same data for same coords
// 2. Once discovered, chunk is stored in Zustand and never regenerated
// 3. Modifications (destroyed siphon, rescued villager) are permanent
```

**Chunk Lifecycle**:
1. Player approaches undiscovered coordinate
2. `worldGenerator.ts` creates chunk data using seeded PRNG
3. Chunk is stored in `discoveredChunks` Map in store
4. On return visit, stored chunk is loaded — NOT regenerated
5. Changes (destroyed objectives, collected spoils) persist

### 2. Three-Faction Entity System

Entities are categorized into three factions with distinct behaviors:

```typescript
// Discriminated union for type-safe entity handling
type Entity = 
  | { type: 'PREDATOR'; faction: 'SCALE_GUARD'; hp: number; aiState: GatorState; }
  | { type: 'OBJECTIVE'; faction: 'SCALE_GUARD'; objectiveId: string; destroyed: boolean; }
  | { type: 'CIVILIAN'; faction: 'NATIVE'; rescued: boolean; }
  | { type: 'STRUCTURE'; faction: 'URA' | 'SCALE_GUARD'; buildingType: string; };
```

**Faction Behaviors**:
- **URA (Player)**: Controlled by player input, builds structures at LZ
- **Scale-Guard**: Hostile AI, guards objectives, hunts player
- **Native**: Neutral, awaits rescue, provides rewards when liberated

### 3. Territory Control & CTF Mechanics

The core gameplay loop is **Capture the Flag** style occupation:

```typescript
interface TerritoryState {
  discoveredChunks: Map<string, ChunkData>;  // "x,y" -> ChunkData
  securedChunks: Set<string>;                // URA-controlled territory
  siphonsDestroyed: number;                  // Strategic objective counter
  villagesLiberated: number;                 // Peacekeeping counter
  gasStockpilesCaptured: number;            // Resource counter
}
```

**Occupation Flow**:
1. Destroy Scale-Guard siphon in a chunk
2. Chunk status changes to `isSecured: true`
3. URA flag visually planted at former siphon site
4. Chunk permanently counts toward territory score

### 4. Base Building System

**Modular Construction at LZ (0, 0)**:

```typescript
interface BaseComponent {
  id: string;
  type: 'FLOOR' | 'WALL' | 'ROOF' | 'STILT' | 'TOWER' | 'BARRICADE';
  position: [number, number, number];
  rotation: number;
  material: 'WOOD' | 'METAL' | 'THATCH';
}

interface BaseState {
  components: BaseComponent[];
  resources: {
    wood: number;
    metal: number;
    supplies: number;
  };
  defenseLevel: number;
}
```

**Building Mechanics**:
- First objective is securing LZ
- Modular components snap together algorithmically
- Base state persists across sessions
- In TACTICAL mode, base can be damaged during "The Fall"

### 5. Difficulty System (Escalation Only)

```typescript
type DifficultyMode = 'SUPPORT' | 'TACTICAL' | 'ELITE';

interface DifficultyConfig {
  mode: DifficultyMode;
  canDowngrade: false;  // NEVER — only escalate
  supplyDropsAnywhere: boolean;
  extractionAnywhere: boolean;
  fallThreshold: number;  // Health % that triggers Fall
  permadeath: boolean;
}

const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  SUPPORT: {
    mode: 'SUPPORT',
    canDowngrade: false,
    supplyDropsAnywhere: true,
    extractionAnywhere: true,
    fallThreshold: 0,  // No fall mechanic
    permadeath: false,
  },
  TACTICAL: {
    mode: 'TACTICAL',
    canDowngrade: false,
    supplyDropsAnywhere: false,
    extractionAnywhere: false,
    fallThreshold: 30,  // Fall at 30% HP
    permadeath: false,
  },
  ELITE: {
    mode: 'ELITE',
    canDowngrade: false,
    supplyDropsAnywhere: false,
    extractionAnywhere: false,
    fallThreshold: 0,  // Permadeath, no fall
    permadeath: true,
  },
};
```

### 6. YUKA AI Framework

Enemy logic is decoupled from rendering using the YUKA library:

```typescript
// GatorAI states via FSM
type GatorState = 'IDLE' | 'PATROL' | 'STALK' | 'AMBUSH' | 'ATTACK' | 'RETREAT' | 'SUPPRESSED';

// Pack hunting coordination
interface PackBehavior {
  coordinator: Vehicle;  // Lead gator
  packMembers: Vehicle[];
  formationType: 'CIRCLE' | 'FLANK' | 'PINCER';
}
```

**AI Patterns**:
- **Singleton EntityManager**: Coordinates all AI vehicles
- **Pack Hunting**: Gators coordinate to circle/flank player
- **Ambush Mechanics**: Gators submerge, then rise with weapons

### 7. Tone.js Procedural Audio

All audio is synthesized — no external audio files:

```typescript
// Procedural SFX via oscillator chains
type SFXType = 'SHOOT' | 'HIT' | 'EXPLOSION' | 'PICKUP' | 'AMBUSH';

// Music uses pattern registry with cross-fading
interface MusicState {
  activePattern: Pattern | null;
  fadeTargetPattern: Pattern | null;
  crossFadeDuration: number;
}
```

### 8. Zustand Persistent Store

The `gameStore` acts as the global FSM with localStorage persistence:

```typescript
interface GameState {
  // FSM Mode
  mode: 'MENU' | 'CUTSCENE' | 'GAME' | 'VICTORY' | 'GAMEOVER' | 'CANTEEN';
  
  // Campaign Persistence
  difficulty: DifficultyMode;
  saveData: SaveData;        // v8 schema
  discoveredChunks: Map<string, ChunkData>;
  securedChunks: Set<string>;
  baseState: BaseState;
  
  // Runtime State
  health: number;
  playerPosition: [number, number, number];
  kills: number;
  missionCredits: number;
  
  // Progression Tracking
  territoryScore: number;
  peacekeepingScore: number;
  unlockedCharacters: string[];
}
```

## Design Patterns

### Singleton Engines
`AudioEngine` and `InputSystem` are singletons managing long-lived browser resources independently of React component lifecycle.

### Imperative Handles
`Projectiles` and `Particles` systems use `useImperativeHandle` for high-performance, non-React spawning of thousands of objects without re-rendering.

### Chunk Cache Management
Limit discovered chunks in memory (`MAX_CHUNK_CACHE`) while preserving secured chunks to prevent unbounded state growth.

### Safe-Area HUD
UI layout uses CSS `env(safe-area-inset-*)` for mobile notch/island compatibility.

## Implementation Standards

- **Strict Immutability**: Store updates must be deep-cloned
- **Resource Cleanup**: All `useEffect` hooks include thorough cleanup for Three.js objects
- **Performance**: Use `InstancedMesh` for dense vegetation to maintain 60fps
- **Deterministic Seeds**: All procedural generation uses coordinate-based seeding
- **Type Safety**: Discriminated unions for entity types, strict TypeScript mode
