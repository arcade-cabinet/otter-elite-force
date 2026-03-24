# Entity Architecture Redesign

**Date:** 2026-03-24
**Status:** Approved
**Supersedes:** The fragmented src/data/, src/sprites/, src/ecs/traits/ structure

---

## Problem

The current codebase splits entity data across 3+ directories: sprite art in `src/sprites/assets/`, stats in `src/data/units.ts`, traits in `src/ecs/traits/`, AI profiles in `src/ai/fsm/profiles.ts`. This fragmentation means changing a Mudfoot requires editing 4 files. Sprite definitions use a TOML format that never got wired into the game — the result is colored rectangles instead of pixel art.

## Solution

**One TypeScript file per entity type. Everything about that entity lives together.**

Sprite frames (ASCII grids), gameplay stats, economic cost, AI behavior, trait composition, drop tables, and unlock conditions — all in one importable module. Sprites render at runtime from ASCII data (like the POC's `buildSprites()`) at device-appropriate scale. No build pipeline. No TOML parsing. No PNG files.

---

## Design Decisions

1. **TypeScript modules as sprite format** — ASCII string arrays with a shared PALETTE constant. Zero parsing, type-checked, git-friendly, AI-authorable. Imported directly by Vite.
2. **Runtime rendering** — BootScene creates Canvas elements from ASCII grids at the device's scale factor, registers them with `Phaser.Textures.addCanvas()`. Resolution adapts to screen.
3. **Portraits separate from heroes** — Portraits are their own entity type in `portraits/` because they serve a different rendering context (briefings) and some characters (FOXHOUND) are portrait-only. Heroes reference portraits by ID.
4. **Map terrain: hybrid regions + overrides** — Large terrain zones define the base (jungle, beach, swamp), procedural noise adds organic variation within zones, sparse tile overrides handle specific features (bridges, paths, clearings).
5. **Entity placements: zones + exact coords** — Key entities (objectives, starting buildings) get exact coordinates. Groups (patrols, tree clusters, starting workers) use named zones with count + scatter.

---

## Type System

```typescript
// src/entities/types.ts

// ─── Shared Palette ───
// Single-char keys map to hex colors. '.' = transparent.
// All sprite ASCII grids use these characters.
type PaletteKey = string;
type Palette = Record<PaletteKey, string>;

// ─── Sprite Definition ───
// ASCII string arrays where each char maps to PALETTE.
// Size is inferred from array dimensions.
interface SpriteFrames {
  [animationName: string]: string[][];
  // e.g., idle: [frame1Lines], walk: [frame1Lines, frame2Lines]
  // Each frame is string[] (rows of chars)
}

interface SpriteDef {
  size: number;          // Grid dimension (16 for units, 32 for buildings)
  frames: SpriteFrames;
  animationRates?: Record<string, number>; // fps per animation
}

// ─── Resource Cost ───
interface ResourceCost {
  fish?: number;
  timber?: number;
  salvage?: number;
}

// ─── Unit Definition ───
interface UnitDef {
  id: string;
  name: string;          // Display name: "MUDFOOT"
  faction: 'ura' | 'scale_guard';
  category: 'worker' | 'infantry' | 'ranged' | 'siege' | 'transport' | 'scout' | 'support';

  // Visual
  sprite: SpriteDef;

  // Combat stats
  hp: number;
  armor: number;
  damage: number;
  damageVsBuildings?: number;  // Override damage when attacking buildings (Sapper)
  range: number;               // 1 = melee, >1 = ranged
  attackCooldown: number;      // seconds between attacks
  speed: number;               // tiles per second
  visionRadius: number;

  // Economy
  cost: ResourceCost;
  populationCost: number;
  trainTime: number;           // seconds
  trainedAt: string;           // building id that trains this unit

  // Unlock
  unlockedAt: string;          // mission id or 'start'

  // Worker-specific (optional)
  gatherCapacity?: number;
  gatherRate?: number;
  buildRate?: number;

  // Water (optional)
  canSwim?: boolean;
  canSubmerge?: boolean;
  carryCapacity?: number;      // Raftsman: how many units it carries

  // Stealth (optional)
  canCrouch?: boolean;
  detectionRadius?: number;    // Override default vision for detection

  // AI profile (enemy units)
  aiProfile?: {
    states: string[];          // Allowed FSM states
    defaultState: string;
    aggroRange: number;
    fleeThreshold?: number;    // HP% to trigger flee
    specialBehavior?: string;  // 'ambush' | 'signal' | 'drain' | 'berserk'
  };

  // Drop table (enemy units)
  drops?: {
    type: 'fish' | 'timber' | 'salvage';
    min: number;
    max: number;
    chance: number;            // 0-1 probability
  }[];

  // Trait composition — which Koota traits to apply on spawn
  // Stats are applied from the fields above; this lists extra tags/behaviors
  tags: string[];              // 'IsUnit', 'IsHero', etc.
}

// ─── Hero Definition (extends Unit) ───
interface HeroDef extends UnitDef {
  portraitId: string;          // Reference to portrait in portraits/
  unlockMission: string;       // Mission where hero is rescued
  unlockDescription: string;   // "Rescue at Prison Camp (5,5)"
  abilities?: {
    id: string;
    name: string;
    description: string;
    cooldown: number;
  }[];
}

// ─── Building Definition ───
interface BuildingDef {
  id: string;
  name: string;
  faction: 'ura' | 'scale_guard';
  category: 'production' | 'defense' | 'economy' | 'wall' | 'special';

  // Visual
  sprite: SpriteDef;           // 32x32 grid

  // Stats
  hp: number;
  armor: number;
  buildTime: number;           // seconds

  // Economy
  cost: ResourceCost;
  unlockedAt: string;
  requiresResearch?: string;   // Research id that must be completed first

  // Production (for buildings that train units)
  trains?: string[];           // Unit ids this building can produce

  // Research (for Armory)
  researches?: string[];       // Research ids available here

  // Defense (for towers)
  attackDamage?: number;
  attackRange?: number;
  attackCooldown?: number;

  // Economy (for Fish Trap)
  passiveIncome?: {
    type: 'fish' | 'timber' | 'salvage';
    amount: number;
    interval: number;          // seconds
  };

  // Population (for Burrow)
  populationCapacity?: number;

  // Healing (for Field Hospital)
  healRate?: number;           // HP per second
  healRadius?: number;         // tiles

  // Special
  isExplosive?: boolean;       // Chain explosion on death (Gas Depot)
  chainExplosionRadius?: number;

  tags: string[];
}

// ─── Resource Definition ───
interface ResourceDef {
  id: string;
  name: string;
  resourceType: 'fish' | 'timber' | 'salvage';

  sprite: SpriteDef;

  yield: {
    min: number;
    max: number;
  };
  regrowthTime?: number;       // seconds to respawn (null = one-time)
  harvestRate: number;          // units per second a worker extracts

  tags: string[];
}

// ─── Terrain Tile Definition ───
interface TerrainTileDef {
  id: string;
  name: string;
  sprite: SpriteDef;           // 16x16 tile sprite (or procedural fill rules)

  movementCost: number;        // 1 = normal, 2 = slow, Infinity = impassable
  swimCost?: number;           // Cost for units with canSwim (water tiles)
  blocksVision: boolean;       // Mangrove blocks LOS
  providesConcealment: boolean; // Tall grass hides units
  damagePerSecond?: number;    // Toxic sludge

  // Procedural painting rules (for organic variation)
  paintRules?: {
    baseColor: string;
    noiseColors: string[];     // Random pixel scatter colors
    noiseDensity: number;      // 0-1, how much noise to add
  };
}

// ─── Portrait Definition ───
interface PortraitDef {
  id: string;
  name: string;                // Display name in briefings
  sprite: SpriteDef;           // 64x96 ASCII portrait
  dialogueColor: string;       // Color for their name in dialogue
}

// ─── Research Definition ───
interface ResearchDef {
  id: string;
  name: string;
  description: string;
  cost: ResourceCost;
  researchTime: number;        // seconds
  researchedAt: string;        // building id (usually 'armory')
  unlockedAt: string;          // mission id
  effect: {
    type: 'stat_boost' | 'unlock_building' | 'unlock_ability';
    target?: string;           // unit/building id affected
    stat?: string;             // which stat to modify
    value?: number;            // +20 HP, +3 damage, etc.
    unlocks?: string;          // building/ability id unlocked
  };
}

// ─── Mission Definition ───
interface MissionDef {
  id: string;
  chapter: number;
  mission: number;
  name: string;
  subtitle: string;            // "Korea / Inchon-Inspired"

  // Briefing
  briefing: {
    portraitId: string;        // Who delivers the briefing
    lines: {
      speaker: string;         // Name shown above dialogue
      text: string;
    }[];
  };

  // Map terrain (hybrid: regions + overrides)
  terrain: {
    width: number;             // in tiles
    height: number;
    regions: TerrainRegion[];
    overrides: TileOverride[]; // Sparse list of specific tile changes
  };

  // Placement zones
  zones: {
    [zoneId: string]: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };

  // Entity placements
  placements: Placement[];

  // Starting resources
  startResources: ResourceCost;
  startPopCap: number;

  // Objectives
  objectives: {
    primary: Objective[];
    bonus: Objective[];
  };

  // Scripted triggers
  triggers: ScenarioTrigger[];

  // Weather schedule (optional)
  weather?: WeatherSchedule;

  // Unlocks granted on completion
  unlocks?: {
    units?: string[];
    buildings?: string[];
    heroes?: string[];
  };

  // Scoring
  parTime: number;             // seconds for Gold star time

  // Difficulty modifiers
  difficulty: {
    support: DifficultyModifier;
    tactical: DifficultyModifier;
    elite: DifficultyModifier;
  };
}

interface TerrainRegion {
  terrainId: string;           // terrain tile id
  // Region shape (one of):
  rect?: { x: number; y: number; w: number; h: number };
  circle?: { cx: number; cy: number; r: number };
  river?: { points: [number, number][]; width: number };
  fill?: boolean;              // True = fill entire map (base layer)
}

interface TileOverride {
  x: number;
  y: number;
  terrainId: string;
}

interface Placement {
  type: string;                // entity definition id
  faction?: 'ura' | 'scale_guard' | 'neutral';
  // Exact position (key entities):
  x?: number;
  y?: number;
  // Zone-based (groups):
  zone?: string;
  count?: number;
  // Optional overrides:
  hp?: number;                 // Override default HP
  patrol?: [number, number][]; // Patrol waypoints for this unit
}

interface DifficultyModifier {
  enemyDamageMultiplier: number;
  enemyHpMultiplier: number;
  resourceMultiplier: number;
  xpMultiplier: number;
}
```

---

## Runtime Pipeline

### 1. BootScene — Texture Generation

```
For each entity definition (units, buildings, resources, portraits, props):
  1. Read sprite.size and sprite.frames from the TypeScript definition
  2. Determine scaleFactor based on device:
     - Mobile: 2x (16px grid → 32px rendered)
     - Tablet: 3x (16px grid → 48px rendered)
     - Desktop: 3-4x (16px grid → 48-64px rendered)
     - Buildings (32px grid) scale at 2-3x
     - Portraits (64x96) scale at 1-2x (already large)
  3. For each animation frame:
     - Create offscreen Canvas (grid.width × scaleFactor, grid.height × scaleFactor)
     - For each char in the ASCII grid:
       - Look up color in PALETTE
       - If not '.': fillRect at (x×scale, y×scale, scale, scale)
     - imageSmoothingEnabled = false (crispy pixels)
  4. Register with Phaser:
     - Single frame: textures.addCanvas(entityId, canvas)
     - Multi-frame: create spritesheet texture with frame dimensions
```

### 2. GameScene — Map Painting

```
Given a MissionDef.terrain:
  1. Create background Canvas (width × height × tileSize × scaleFactor)
  2. Fill with first region marked fill: true (base terrain)
  3. For each subsequent region:
     - Determine affected tiles from shape (rect/circle/river)
     - For each tile in region:
       - Draw terrain tile sprite
       - Apply paintRules noise if defined
  4. Apply overrides (bridges, clearings, paths)
  5. Register as Phaser texture 'terrain-bg'
  6. Create TilemapLayer for collision/pathfinding data (separate from visual)
```

### 3. Spawner — Entity Instantiation

```
spawner.spawn(world, definition, x, y, faction):
  1. Create Koota entity with world.spawn()
  2. Apply Position({ x, y })
  3. Apply stats from definition: Health, Attack, Armor, VisionRadius, etc.
  4. Apply UnitType({ type: definition.id })
  5. Apply Faction({ id: faction })
  6. Apply tags from definition.tags
  7. Apply optional traits based on definition fields:
     - canSwim → CanSwim tag
     - aiProfile → AIState + SteeringAgent
     - gatherCapacity → Gatherer trait
  8. Koota↔Phaser sync layer auto-creates sprite from registered texture
```

---

## What Gets Deleted

The following existing code is replaced by this architecture:

| Delete | Reason |
|--------|--------|
| `src/sprites/` (entire directory) | Replaced by sprite data in entity definitions + renderer.ts |
| `src/data/units.ts`, `buildings.ts`, `research.ts`, `factions.ts` | Replaced by per-entity definition files |
| `src/sprites/assets/*.sprite` (41 TOML files) | Replaced by ASCII grids in TypeScript |
| `src/sprites/vitePlugin.ts` | No build pipeline needed |
| `src/sprites/parser.ts`, `compiler.ts`, `atlas.ts` | Runtime renderer replaces all of these |

---

## What Gets Kept/Adapted

| Keep | How |
|------|-----|
| `src/ecs/` (traits, relations, queries, world) | Unchanged — spawner.ts uses these |
| `src/systems/` (all game systems) | Unchanged — systems read Koota traits, not definitions |
| `src/Scenes/` (all Phaser scenes) | BootScene updated to use new renderer, GameScene updated to use new spawner |
| `src/scenarios/` (engine + types) | Types updated to reference MissionDef |
| `src/maps/missions/` | Replaced by `src/entities/missions/` |
| `src/ai/` (pathfinding, FSM, steering) | AI profiles move INTO entity definitions but FSM/pathfinding code stays |
| `src/stores/` (Zustand) | Unchanged |
| `src/persistence/` (SQLite) | Unchanged |

---

## File Count Estimate

| Category | Files | Notes |
|----------|-------|-------|
| Core (types, palette, renderer, spawner) | 4 | |
| URA units | 7 | river-rat through diver |
| Scale-Guard units | 6 | gator through siphon-drone |
| Heroes | 6 | bubbles through muskrat |
| URA buildings | 12 | command-post through minefield |
| Scale-Guard buildings | 5 | sludge-pit through scale-wall |
| Resources | 3 | fish-spot, mangrove, salvage |
| Terrain | 2 | tiles.ts + map-painter.ts |
| Portraits | 7 | foxhound + 6 hero portraits |
| Props | 2 | tall-grass, toxic-sludge |
| Research | 1 | all research definitions |
| Missions | 16 | one per mission |
| Indexes | 8 | barrel exports per category |
| **Total** | **~79** | |
