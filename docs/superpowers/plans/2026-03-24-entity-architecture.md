# Entity Architecture Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure codebase so every entity (unit, building, resource, terrain, portrait) is a single TypeScript file containing sprite data + stats + behavior, with runtime Canvas→Phaser texture rendering that actually produces visible pixel art.

**Architecture:** Entity definitions are TypeScript modules with ASCII sprite grids and gameplay data. At boot, a renderer converts ASCII grids to Canvas elements at device-appropriate scale and registers them as Phaser textures. A spawner reads definitions to create Koota entities with correct traits. Map terrain uses hybrid regions + tile overrides, painted onto a background Canvas at load time.

**Tech Stack:** Phaser 3.90 (textures.addCanvas), Koota ECS, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-24-entity-architecture-design.md`

**POC Reference:** `docs/references/poc_handdrawn.html` (ASCII sprite rendering pattern)

---

## File Map

### Create (new files)
```
src/entities/
├── types.ts                          # All type interfaces (UnitDef, BuildingDef, etc.)
├── palette.ts                        # PALETTE constant (shared color mapping)
├── renderer.ts                       # ASCII grid → Canvas → Phaser texture
├── spawner.ts                        # Definition → Koota entity with traits
├── registry.ts                       # Central registry: ALL_UNITS, ALL_BUILDINGS, etc.
├── units/ura/river-rat.ts            # First unit definition (POC)
├── units/ura/mudfoot.ts
├── buildings/ura/command-post.ts     # First building definition
├── buildings/ura/barracks.ts
├── resources/fish-spot.ts            # First resource definition
├── resources/mangrove-tree.ts
├── terrain/tiles.ts                  # All terrain tile definitions
├── terrain/map-painter.ts            # Region + override → painted Canvas
├── portraits/foxhound.ts            # First portrait
├── missions/chapter1/mission-01-beachhead.ts  # First mission (new format)
```

### Modify (existing files)
```
src/Scenes/BootScene.ts               # Wire renderer to generate all textures at boot
src/Scenes/GameScene.ts               # Wire spawner + map-painter for mission loading
src/config/game.config.ts             # Expose game instance for texture access
vitest.config.ts                      # Ensure new paths are included
```

### Delete (after migration complete)
```
src/sprites/                          # Entire directory (parser, compiler, atlas, vitePlugin, .sprite files)
src/data/                             # units.ts, buildings.ts, research.ts, factions.ts
src/maps/                             # Old mission map data files
```

---

## Task 1: Type System + Palette

**Files:**
- Create: `src/entities/types.ts`
- Create: `src/entities/palette.ts`
- Test: `src/__tests__/entities/types.test.ts`

- [ ] **Step 1: Write type interfaces**

Create `src/entities/types.ts` with all interfaces from the spec: `SpriteDef`, `UnitDef`, `HeroDef`, `BuildingDef`, `ResourceDef`, `TerrainTileDef`, `PortraitDef`, `ResearchDef`, `MissionDef`, `TerrainRegion`, `TileOverride`, `Placement`, `DifficultyModifier`. These are pure types — no runtime code.

- [ ] **Step 2: Create the shared palette**

Create `src/entities/palette.ts` following the POC's pattern:

```typescript
export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  '#': '#000000',   // Black outline
  'S': '#ffcc99',   // Skin light
  's': '#eebb88',   // Skin dark/shadow
  'B': '#1e3a8a',   // Blue primary (URA)
  'b': '#3b82f6',   // Blue secondary (URA)
  'R': '#7f1d1d',   // Red primary (Scale-Guard)
  'r': '#ef4444',   // Red secondary
  'G': '#166534',   // Dark green (leaves/jungle)
  'g': '#22c55e',   // Light green
  'W': '#78350f',   // Dark wood
  'w': '#b45309',   // Light wood
  'Y': '#eab308',   // Gold/yellow
  'y': '#fef08a',   // Light gold
  'C': '#4b5563',   // Dark stone
  'c': '#9ca3af',   // Light stone
  'M': '#1f2937',   // Dark interior
  'T': '#0d9488',   // Teal (water/otter)
  't': '#5eead4',   // Light teal
  'O': '#c2410c',   // Orange (enemy accent)
  'o': '#fb923c',   // Light orange
  'P': '#7e22ce',   // Purple (poison/special)
  'p': '#c084fc',   // Light purple
};
```

- [ ] **Step 3: Write a type-check test**

```typescript
// src/__tests__/entities/types.test.ts
import { describe, it, expect } from 'vitest';
import { PALETTE } from '@/entities/palette';
import type { UnitDef, BuildingDef, SpriteDef } from '@/entities/types';

describe('PALETTE', () => {
  it('has transparent mapped to "."', () => {
    expect(PALETTE['.']).toBe('transparent');
  });
  it('has at least 20 color entries', () => {
    expect(Object.keys(PALETTE).length).toBeGreaterThanOrEqual(20);
  });
  it('all non-transparent values are valid hex colors', () => {
    for (const [key, val] of Object.entries(PALETTE)) {
      if (val !== 'transparent') {
        expect(val).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });
});
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run src/__tests__/entities/types.test.ts`

- [ ] **Step 5: Commit**

`git commit -m "✨ feat(entities): add type system and shared palette"`

---

## Task 2: Sprite Renderer

**Files:**
- Create: `src/entities/renderer.ts`
- Test: `src/__tests__/entities/renderer.test.ts`

- [ ] **Step 1: Write failing test for single-frame rendering**

```typescript
// src/__tests__/entities/renderer.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { renderSprite, renderAllSprites } from '@/entities/renderer';
import { PALETTE } from '@/entities/palette';
import type { SpriteDef } from '@/entities/types';

// Need ImageData polyfill for happy-dom
beforeAll(() => {
  if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
      width: number; height: number; data: Uint8ClampedArray;
      constructor(w: number, h: number) {
        this.width = w; this.height = h;
        this.data = new Uint8ClampedArray(w * h * 4);
      }
    } as any;
  }
});

const testSprite: SpriteDef = {
  size: 4,
  frames: {
    idle: [[
      '.##.',
      '#BB#',
      '#BB#',
      '.##.',
    ]]
  }
};

describe('renderSprite', () => {
  it('creates a canvas with correct dimensions at scale 1', () => {
    const canvas = renderSprite(testSprite, 'idle', 0, 1);
    expect(canvas.width).toBe(4);
    expect(canvas.height).toBe(4);
  });

  it('scales dimensions correctly at scale 3', () => {
    const canvas = renderSprite(testSprite, 'idle', 0, 3);
    expect(canvas.width).toBe(12);
    expect(canvas.height).toBe(12);
  });

  it('draws non-transparent pixels', () => {
    const canvas = renderSprite(testSprite, 'idle', 0, 1);
    const ctx = canvas.getContext('2d')!;
    const pixel = ctx.getImageData(1, 0, 1, 1).data; // '#' at (1,0) = black
    expect(pixel[3]).toBeGreaterThan(0); // not transparent
  });

  it('leaves transparent pixels empty', () => {
    const canvas = renderSprite(testSprite, 'idle', 0, 1);
    const ctx = canvas.getContext('2d')!;
    const pixel = ctx.getImageData(0, 0, 1, 1).data; // '.' at (0,0)
    expect(pixel[3]).toBe(0); // transparent
  });
});
```

- [ ] **Step 2: Run test, verify FAIL** (renderSprite not defined)

- [ ] **Step 3: Implement renderer**

```typescript
// src/entities/renderer.ts
import { PALETTE } from './palette';
import type { SpriteDef } from './types';

/**
 * Render a single animation frame from a SpriteDef to an offscreen Canvas.
 * Each character in the ASCII grid maps to a PALETTE color.
 * Scale multiplies the pixel size for crispy pixel art at any resolution.
 */
export function renderSprite(
  sprite: SpriteDef,
  animation: string,
  frameIndex: number,
  scale: number,
): HTMLCanvasElement {
  const frames = sprite.frames[animation];
  if (!frames || !frames[frameIndex]) {
    throw new Error(`No frame ${animation}[${frameIndex}]`);
  }
  const grid = frames[frameIndex];
  const h = grid.length;
  const w = grid[0].length;

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;

  // Critical: disable smoothing for crispy pixels
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      const color = PALETTE[char];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  return canvas;
}

/**
 * Determine scale factor based on device/canvas size.
 * Units (16px grid): 2x mobile, 3x tablet, 3-4x desktop
 * Buildings (32px grid): 2-3x
 * Portraits (64x96): 1-2x
 */
export function getScaleFactor(gridSize: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  if (gridSize >= 64) return Math.max(1, Math.round(dpr));        // portraits
  if (gridSize >= 32) return Math.max(2, Math.round(dpr * 1.5));  // buildings
  return Math.max(2, Math.round(dpr * 2));                         // units/terrain (16px)
}

/**
 * Register a SpriteDef as Phaser textures.
 * Creates one texture per animation frame: "{id}" for idle[0],
 * "{id}_{anim}_{frame}" for others.
 */
export function registerSpriteTextures(
  textures: Phaser.Textures.TextureManager,
  id: string,
  sprite: SpriteDef,
  scale?: number,
): void {
  const s = scale ?? getScaleFactor(sprite.size);

  for (const [anim, frames] of Object.entries(sprite.frames)) {
    for (let i = 0; i < frames.length; i++) {
      const canvas = renderSprite(sprite, anim, i, s);
      const key = anim === 'idle' && i === 0 ? id : `${id}_${anim}_${i}`;
      if (!textures.exists(key)) {
        textures.addCanvas(key, canvas);
      }
    }
  }
}
```

- [ ] **Step 4: Run tests, verify PASS**

- [ ] **Step 5: Commit**

`git commit -m "✨ feat(entities): implement ASCII grid → Canvas sprite renderer"`

---

## Task 3: First Unit Definition (Mudfoot) + First Building (Command Post)

**Files:**
- Create: `src/entities/units/ura/mudfoot.ts`
- Create: `src/entities/units/ura/river-rat.ts`
- Create: `src/entities/buildings/ura/command-post.ts`
- Create: `src/entities/buildings/ura/barracks.ts`
- Test: `src/__tests__/entities/definitions.test.ts`

- [ ] **Step 1: Create mudfoot definition**

Model the sprite after the POC's `peasant`/`footman` pattern — 16×16 grid with body/head/limbs drawn from PALETTE chars. Include all gameplay stats from the spec.

```typescript
// src/entities/units/ura/mudfoot.ts
import type { UnitDef } from '@/entities/types';

export const mudfoot: UnitDef = {
  id: 'mudfoot',
  name: 'MUDFOOT',
  faction: 'ura',
  category: 'infantry',

  sprite: {
    size: 16,
    frames: {
      idle: [[
        '......####......',
        '.....#TTTT#.....',
        '.....#tttt#.....',
        '......####......',
        '.....#bbbb#.....',
        '....#bbbbbb#....',
        '....#bBBBBb#....',
        '....#bBBBBb#.##.',
        '.....#BBBB##cC#.',
        '.....#BBBB#.##..',
        '.....#WWWW#.....',
        '.....#wwww#.....',
        '.....#WWWW#.....',
        '.....#WWWW#.....',
        '....###..###....',
        '................',
      ]],
      walk: [[
        '......####......',
        '.....#TTTT#.....',
        '.....#tttt#.....',
        '......####......',
        '.....#bbbb#.....',
        '....#bbbbbb#....',
        '....#bBBBBb#....',
        '....#bBBBBb#.##.',
        '.....#BBBB##cC#.',
        '.....#BBBB#.##..',
        '.....#WWWW#.....',
        '.....#wwww#.....',
        '.....#WW..#.....',
        '.....#..WW#.....',
        '....###..###....',
        '................',
      ]],
    },
  },

  hp: 80,
  armor: 2,
  damage: 12,
  range: 1,
  attackCooldown: 1.0,
  speed: 8,
  visionRadius: 5,

  cost: { fish: 80, salvage: 20 },
  populationCost: 1,
  trainTime: 10,
  trainedAt: 'barracks',
  unlockedAt: 'mission-01',

  tags: ['IsUnit'],
};
```

- [ ] **Step 2: Create river-rat definition** (worker unit — similar pattern but with tool sprite, add gather fields)

- [ ] **Step 3: Create command-post definition** (32×32 building sprite following POC's `townhall` pattern)

- [ ] **Step 4: Create barracks definition** (32×32 building sprite following POC's `barracks` pattern)

- [ ] **Step 5: Write validation test**

```typescript
// src/__tests__/entities/definitions.test.ts
import { describe, it, expect } from 'vitest';
import { mudfoot } from '@/entities/units/ura/mudfoot';
import { riverRat } from '@/entities/units/ura/river-rat';
import { commandPost } from '@/entities/buildings/ura/command-post';
import { barracks } from '@/entities/buildings/ura/barracks';
import { PALETTE } from '@/entities/palette';

describe('Unit definitions', () => {
  it('mudfoot has valid sprite frames', () => {
    const frame = mudfoot.sprite.frames.idle[0];
    expect(frame.length).toBe(16); // 16 rows
    expect(frame[0].length).toBe(16); // 16 cols
  });

  it('mudfoot sprite uses only valid palette chars', () => {
    for (const [anim, frames] of Object.entries(mudfoot.sprite.frames)) {
      for (const frame of frames) {
        for (const row of frame) {
          for (const char of row) {
            expect(PALETTE).toHaveProperty(char);
          }
        }
      }
    }
  });

  it('mudfoot stats match spec', () => {
    expect(mudfoot.hp).toBe(80);
    expect(mudfoot.armor).toBe(2);
    expect(mudfoot.damage).toBe(12);
    expect(mudfoot.cost).toEqual({ fish: 80, salvage: 20 });
  });

  it('command-post is 32x32', () => {
    expect(commandPost.sprite.size).toBe(32);
    const frame = commandPost.sprite.frames.idle[0];
    expect(frame.length).toBe(32);
    expect(frame[0].length).toBe(32);
  });
});
```

- [ ] **Step 6: Run tests, verify PASS**
- [ ] **Step 7: Commit**

`git commit -m "✨ feat(entities): add mudfoot, river-rat, command-post, barracks definitions"`

---

## Task 4: Entity Spawner

**Files:**
- Create: `src/entities/spawner.ts`
- Test: `src/__tests__/entities/spawner.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { createWorld } from 'koota';
import { spawnUnit, spawnBuilding } from '@/entities/spawner';
import { mudfoot } from '@/entities/units/ura/mudfoot';
import { commandPost } from '@/entities/buildings/ura/command-post';
import { Position } from '@/ecs/traits/spatial';
import { Health } from '@/ecs/traits/combat';
import { UnitType, Faction } from '@/ecs/traits/identity';

describe('spawner', () => {
  it('spawns a unit with correct traits from definition', () => {
    const world = createWorld();
    const entity = spawnUnit(world, mudfoot, 10, 20, 'ura');

    const pos = entity.get(Position);
    expect(pos?.x).toBe(10);
    expect(pos?.y).toBe(20);

    const health = entity.get(Health);
    expect(health?.max).toBe(80);
    expect(health?.current).toBe(80);

    const type = entity.get(UnitType);
    expect(type?.type).toBe('mudfoot');

    const faction = entity.get(Faction);
    expect(faction?.id).toBe('ura');
  });

  it('spawns a building with correct traits', () => {
    const world = createWorld();
    const entity = spawnBuilding(world, commandPost, 5, 5, 'ura');

    const health = entity.get(Health);
    expect(health?.max).toBe(600); // command post HP from spec
  });
});
```

- [ ] **Step 2: Implement spawner**

`src/entities/spawner.ts` — reads a `UnitDef` or `BuildingDef` and calls `world.spawn()` with all appropriate Koota traits populated from the definition's stat values. Maps optional fields (canSwim, gatherCapacity, aiProfile, etc.) to their corresponding traits.

- [ ] **Step 3: Run tests, verify PASS**
- [ ] **Step 4: Commit**

`git commit -m "✨ feat(entities): implement spawner — definition → Koota entity"`

---

## Task 5: Terrain Tiles + Map Painter

**Files:**
- Create: `src/entities/terrain/tiles.ts`
- Create: `src/entities/terrain/map-painter.ts`
- Test: `src/__tests__/entities/map-painter.test.ts`

- [ ] **Step 1: Define terrain tiles**

```typescript
// src/entities/terrain/tiles.ts
import type { TerrainTileDef } from '@/entities/types';

export const TERRAIN: Record<string, TerrainTileDef> = {
  grass: {
    id: 'grass',
    name: 'Grass',
    sprite: { size: 16, frames: { idle: [[ /* 16x16 green grid */ ]] } },
    movementCost: 1,
    blocksVision: false,
    providesConcealment: false,
    paintRules: {
      baseColor: '#14532d',
      noiseColors: ['#166534', '#15803d'],
      noiseDensity: 0.3,
    },
  },
  water: {
    id: 'water',
    name: 'Water',
    sprite: { size: 16, frames: { idle: [[ /* 16x16 blue grid */ ]] } },
    movementCost: Infinity,
    swimCost: 2,
    blocksVision: false,
    providesConcealment: false,
    paintRules: {
      baseColor: '#1e3a5f',
      noiseColors: ['#1e40af', '#2563eb'],
      noiseDensity: 0.4,
    },
  },
  // mud, dirt, mangrove, bridge, tall_grass, toxic_sludge, beach...
};
```

- [ ] **Step 2: Implement map painter**

`src/entities/terrain/map-painter.ts` — takes a `MissionDef.terrain` (regions + overrides) and paints a large offscreen Canvas:

1. Fill canvas with base region (the one with `fill: true`)
2. Paint each subsequent region using its shape (rect/circle/river)
3. For each terrain type, apply `paintRules` noise (random scatter of noiseColors at noiseDensity)
4. Apply sparse tile overrides
5. Return the Canvas for Phaser to use as background

- [ ] **Step 3: Write test**

Test that `paintTerrain()` returns a Canvas with correct dimensions, that regions are painted in order, and that overrides take precedence.

- [ ] **Step 4: Run tests, verify PASS**
- [ ] **Step 5: Commit**

`git commit -m "✨ feat(entities): add terrain tiles and hybrid region map painter"`

---

## Task 6: First Mission Definition (Beachhead)

**Files:**
- Create: `src/entities/missions/chapter1/mission-01-beachhead.ts`
- Test: `src/__tests__/entities/mission.test.ts`

- [ ] **Step 1: Create mission definition**

Using the new `MissionDef` type: define terrain regions (beach in south, jungle in north, river running east-west), placement zones (ura_start, resource_area, enemy_patrol), entity placements (3 river rats in ura_start zone, fish spot at exact coords, mangrove cluster in northern_forest zone), briefing lines, objectives, triggers, and starting resources.

- [ ] **Step 2: Write test validating structure**

Verify: terrain dimensions exist, at least one region has `fill: true`, all placements reference valid entity ids, all zone references in placements have matching zone definitions, briefing has at least one line.

- [ ] **Step 3: Run test, verify PASS**
- [ ] **Step 4: Commit**

`git commit -m "✨ feat(entities): add Mission 1 Beachhead definition (new format)"`

---

## Task 7: Wire Into BootScene + GameScene

**Files:**
- Modify: `src/Scenes/BootScene.ts`
- Modify: `src/Scenes/GameScene.ts`
- Create: `src/entities/registry.ts`

- [ ] **Step 1: Create entity registry**

`src/entities/registry.ts` — import all entity definitions, export them as lookup maps:

```typescript
import { mudfoot } from './units/ura/mudfoot';
import { riverRat } from './units/ura/river-rat';
import { commandPost } from './buildings/ura/command-post';
// ...

export const ALL_UNITS: Record<string, UnitDef> = {
  mudfoot, river_rat: riverRat, // ...
};
export const ALL_BUILDINGS: Record<string, BuildingDef> = {
  command_post: commandPost, // ...
};
// etc.
```

- [ ] **Step 2: Wire BootScene to render all textures**

In `BootScene.create()`:
1. Import registry
2. For each definition with a sprite, call `registerSpriteTextures(this.textures, def.id, def.sprite)`
3. Transition to MenuScene when done

- [ ] **Step 3: Wire GameScene to use map painter + spawner**

In `GameScene.create(data)`:
1. Load mission definition from registry by missionId
2. Call `paintTerrain(mission.terrain, tileSize, scale)` → register as background texture
3. Create Phaser Image from background texture
4. For each placement: look up definition, call `spawnUnit`/`spawnBuilding`/etc.
5. Set starting resources from `mission.startResources`
6. Initialize scenario engine with `mission.triggers`

- [ ] **Step 4: Manual test — run `pnpm dev`, verify sprites render as pixel art not colored rectangles**

- [ ] **Step 5: Commit**

`git commit -m "✨ feat: wire entity renderer into BootScene + spawner into GameScene"`

---

## Task 8: Remaining Entity Definitions

**Files:** All remaining unit, building, resource, portrait, and prop definitions.

- [ ] **Step 1:** Create remaining URA units: shellcracker, sapper, raftsman, mortar-otter, diver
- [ ] **Step 2:** Create all Scale-Guard units: gator, viper, snapper, scout-lizard, croc-champion, siphon-drone
- [ ] **Step 3:** Create all heroes: sgt-bubbles, gen-whiskers, cpl-splash, sgt-fang, medic-marina, pvt-muskrat
- [ ] **Step 4:** Create remaining URA buildings: armory, watchtower, fish-trap, burrow, dock, field-hospital, sandbag-wall, stone-wall, gun-tower, minefield
- [ ] **Step 5:** Create Scale-Guard buildings: sludge-pit, spawning-pool, venom-spire, siphon, scale-wall
- [ ] **Step 6:** Create resources: fish-spot, mangrove-tree, salvage-cache
- [ ] **Step 7:** Create portraits: foxhound, gen-whiskers, cpl-splash, sgt-fang, medic-marina, pvt-muskrat, sgt-bubbles
- [ ] **Step 8:** Create props: tall-grass, toxic-sludge
- [ ] **Step 9:** Create research definitions (can be one file: `src/entities/research.ts`)
- [ ] **Step 10:** Update registry.ts with all new definitions
- [ ] **Step 11:** Run full test suite: `pnpm vitest run`
- [ ] **Step 12:** Commit: `🎨 feat(entities): add all unit, building, resource, portrait, prop, and research definitions`

---

## Task 9: Remaining Mission Definitions

**Files:** `src/entities/missions/chapter1/` through `chapter4/`

- [ ] **Step 1:** Convert missions 2-4 to new MissionDef format (terrain regions + zone placements)
- [ ] **Step 2:** Convert missions 5-8 (Chapter 2)
- [ ] **Step 3:** Convert missions 9-12 (Chapter 3)
- [ ] **Step 4:** Convert missions 13-16 (Chapter 4)
- [ ] **Step 5:** Create mission index: `src/entities/missions/index.ts` with `CAMPAIGN` array
- [ ] **Step 6:** Run tests, commit: `🎨 feat(entities): convert all 16 missions to new definition format`

---

## Task 10: Delete Old Code + Final Verification

**Files:**
- Delete: `src/sprites/` (entire directory)
- Delete: `src/data/` (units.ts, buildings.ts, research.ts, factions.ts, index.ts)
- Delete: `src/maps/` (old mission map files)
- Delete: old sprite-related tests

- [ ] **Step 1:** Delete `src/sprites/` — parser, compiler, atlas, vitePlugin, all .sprite files, types.ts, index.ts
- [ ] **Step 2:** Delete `src/data/` — all stat definition files (replaced by entity definitions)
- [ ] **Step 3:** Delete `src/maps/missions/` — old tilemap data files (replaced by mission definitions)
- [ ] **Step 4:** Update any remaining imports that reference deleted modules (grep for `@/sprites`, `@/data`, `@/maps`)
- [ ] **Step 5:** Remove `smol-toml` from package.json dependencies
- [ ] **Step 6:** Run `pnpm tsc --noEmit` — zero errors
- [ ] **Step 7:** Run `pnpm vitest run` — all tests pass
- [ ] **Step 8:** Run `pnpm dev` — verify game boots, menu renders, click New Deployment → briefing shows portrait → Deploy → game renders terrain + units with actual pixel art sprites
- [ ] **Step 9:** Commit: `♻️ refactor: delete old sprite/data/map code — entity definitions are single source of truth`
- [ ] **Step 10:** Tag: `git tag v0.3.0-entity-architecture`
