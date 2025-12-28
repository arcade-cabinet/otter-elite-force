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

### 1. Intelligent Open World Layout

**Critical Design Pattern**: Algorithmically generated world with intelligent POI placement.

#### World Layout Generation Pipeline

```
1. Poisson Disc Sampling → Even POI distribution (minimum distance)
2. Difficulty Radial Placement → Harder content further from LZ
3. MST Path Generation → All POIs reachable via connected paths
4. Coherent Terrain → Rivers flow, jungles cluster naturally
5. Chunk Generation → POIs have specific content, non-POIs are procedural
```

#### Key Algorithms

**Poisson Disc Sampling** for POI placement:
```typescript
// Ensures minimum distance between POIs, no clustering
const points = poissonDiscSample(random, worldRadius * 2, minPOIDistance);
```

**Prim's MST** for path connectivity:
```typescript
// All POIs connected, ensures no isolated areas
const paths = generatePaths(points); // + extra edges for variety
```

**Coherent Terrain** using pseudo-noise:
```typescript
const noiseX = sin(x * 0.1 + seed) * cos(z * 0.15 + seed * 0.7);
const noiseZ = cos(x * 0.12 + seed * 0.5) * sin(z * 0.08 + seed * 1.2);
// Rivers, Marshes, and Dense Jungle based on combined noise + distance
```

#### POI Type Distribution

| Distance | POI Types | Difficulty |
|----------|-----------|------------|
| 0% | LZ (origin) | 0.0 |
| 0-30% | Villages, Healer Hubs | 0.1-0.3 |
| 30-70% | Waypoints, Siphon Clusters, Gas Depots | 0.3-0.7 |
| 70-100% | Enemy Outposts, Prison Camps, Boss Arenas | 0.7-1.0 |

### 2. Chunk-Based Content Generation

```typescript
// World generation is coordinate-based and deterministic
// NOTE: x = east-west, z = north-south (y is vertical height)
interface ChunkData {
  id: string;             // "x,z"
  x: number;
  z: number;              // Horizontal (north-south)
  seed: number;           // Deterministic from coordinates
  terrainType: TerrainType;  // From layout's terrain zones
  entities: ChunkEntity[]; // POI-specific or procedural enemies, objectives
  decorations: ChunkDecoration[];
  secured: boolean;       // Is URA flag planted?
}

// Key behaviors:
// 1. generateChunk(x, z) always returns same data for same coords
// 2. Once discovered, chunk is stored in Zustand and never regenerated
// 3. Modifications (destroyed siphon, rescued villager) are permanent
// 4. Discovery is implicit - chunk exists in discoveredChunks map or not
```

**Chunk Lifecycle**:
1. World layout generated once per game session (seeded)
2. `getKeyCoordinateForChunk()` checks if chunk is a POI
3. POI chunks spawn specific content (rescue cages, bosses)
4. Non-POI chunks use difficulty-based procedural generation
5. Once discovered, chunk stored in Zustand — never regenerated
6. Modifications (destroyed siphon, rescued villager) persist

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
