# Entity Architecture — Implementation Plan (Revised)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the codebase around entity-centric definitions with tests-as-specifications driving all implementation.

**Philosophy:** Write tests that define what things SHOULD be FIRST. Then build until the tests pass. Tests are the design documents in code form.

**Architecture:** Entity definitions are TypeScript modules with ASCII sprites + stats. Runtime renderer converts to Phaser textures. Spawner creates Koota entities from definitions. Map painter renders terrain from region declarations. 3-layer test strategy: specification → visual → integration.

**Tech Stack:** Phaser 3.90, Koota ECS, Yuka AI, Vitest, @vitest/browser-playwright

**Design Docs:** `docs/design/` (game-design-document, art-direction, balance-framework, audio-design, mission-design-guide)

**Architecture Docs:** `docs/architecture/` (overview, testing-strategy)

**Spec:** `docs/superpowers/specs/2026-03-24-entity-architecture-design.md`

---

## Phase A: Foundation (Types + Renderer + Palette)

### Task A1: Type System + Palette
**Owner:** types-agent
**Files:** Create `src/entities/types.ts`, `src/entities/palette.ts`
**Deps:** None

### Task A2: Sprite Renderer
**Owner:** renderer-agent
**Files:** Create `src/entities/renderer.ts`
**Deps:** A1

### Task A3: Entity Spawner
**Owner:** renderer-agent
**Files:** Create `src/entities/spawner.ts`
**Deps:** A1, A2

### Task A4: Terrain Tile Definitions + Map Painter
**Owner:** terrain-agent
**Files:** Create `src/entities/terrain/tiles.ts`, `src/entities/terrain/map-painter.ts`
**Deps:** A1, A2

---

## Phase B: Specification Tests (Tests FIRST — define what everything should be)

### Task B1: Unit Stat Specification Tests
**Owner:** spec-tester
**Files:** Create `src/__tests__/specs/entities/unit-stats.test.ts`
**Deps:** A1 (types only — tests import types, not implementations)

Write tests that assert EVERY unit's stats match the design docs. These tests will FAIL until entity definitions are written.

```typescript
// Example: test imports the definition (which doesn't exist yet) and validates it
import type { UnitDef } from '@/entities/types';

describe('Mudfoot specification', () => {
  // This test defines what the mudfoot SHOULD be
  it('has 80 HP, 2 armor, 12 damage, range 1, speed 8', () => {
    // Will import from '@/entities/units/ura/mudfoot' once it exists
    expect(mudfoot.hp).toBe(80);
    expect(mudfoot.armor).toBe(2);
    expect(mudfoot.damage).toBe(12);
    expect(mudfoot.range).toBe(1);
    expect(mudfoot.speed).toBe(8);
  });

  it('costs 80 fish and 20 salvage', () => {
    expect(mudfoot.cost).toEqual({ fish: 80, salvage: 20 });
  });

  it('has a 16x16 sprite with idle and walk frames', () => {
    expect(mudfoot.sprite.size).toBe(16);
    expect(mudfoot.sprite.frames.idle).toBeDefined();
    expect(mudfoot.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
    expect(mudfoot.sprite.frames.walk).toBeDefined();
    expect(mudfoot.sprite.frames.walk.length).toBeGreaterThanOrEqual(2);
  });

  it('sprite grid uses only valid palette characters', () => {
    for (const frame of mudfoot.sprite.frames.idle) {
      for (const row of frame) {
        expect(row.length).toBe(16);
        for (const char of row) {
          expect(PALETTE).toHaveProperty(char);
        }
      }
    }
  });

  it('trains at barracks, unlocks at mission-01', () => {
    expect(mudfoot.trainedAt).toBe('barracks');
    expect(mudfoot.unlockedAt).toBe('mission-01');
  });
});
```

Write these for ALL 13 URA units + 6 Scale-Guard units + 6 heroes = 25 unit specs.

### Task B2: Building Stat Specification Tests
**Owner:** spec-tester
**Files:** Create `src/__tests__/specs/entities/building-stats.test.ts`
**Deps:** A1

Same pattern for ALL 12 URA buildings + 5 Scale-Guard buildings = 17 building specs.

### Task B3: Combat Outcome Specification Tests
**Owner:** balance-tester
**Files:** Create `src/__tests__/specs/combat/melee-outcomes.test.ts`, `ranged-outcomes.test.ts`, `building-damage.test.ts`
**Deps:** A1

Tests that define the counter matrix from balance-framework.md:
- Gator beats Mudfoot 1v1 with >50% HP remaining
- 3 Mudfoots beat 2 Gators with 1-2 survivors
- Shellcracker kites Gator (wins at range 5 vs speed 5)
- Sapper does 30 damage to buildings (45 with research)
- Mortar AoE hits all units in 2-tile splash

### Task B4: Economy Curve Specification Tests
**Owner:** balance-tester
**Files:** Create `src/__tests__/specs/economy/gather-rates.test.ts`, `build-order.test.ts`, `population.test.ts`
**Deps:** A1

Tests from balance-framework.md:
- 2 workers gathering 60s → ~120 fish
- Fish Trap income: +3 fish per 10s
- Build order timeline matches design (Barracks at ~1min)
- Burrow provides +6 pop cap (not Fish Trap)
- Population limit: 10 burrows × 6 = 60 max

### Task B5: Sprite Validity Specification Tests
**Owner:** spec-tester
**Files:** Create `src/__tests__/specs/entities/sprite-validity.test.ts`
**Deps:** A1

Tests from art-direction.md:
- Every unit sprite is 16×16
- Every building sprite is 32×32
- Every portrait sprite is 64×96
- All characters in all grids exist in PALETTE
- No row length mismatches (every row same length as declared size)
- Every entity has at least an idle frame
- URA units have 'B' or 'b' chars in torso region (rows 4-9)
- Scale-Guard units have 'R' or 'r' chars in torso region

### Task B6: Research Effect Specification Tests
**Owner:** balance-tester
**Files:** Create `src/__tests__/specs/entities/research-effects.test.ts`
**Deps:** A1

- Hardshell Armor: +20 HP to Mudfoots (80→100)
- Fish Oil Arrows: +3 damage to Shellcrackers (10→13)
- Demolition Training: +50% Sapper building damage (30→45)
- Each research costs correct resources and time

### Task B7: Mission Structure Specification Tests
**Owner:** spec-tester
**Files:** Create `src/__tests__/specs/scenarios/mission-structure.test.ts`
**Deps:** A1

For each of the 16 missions:
- Has valid terrain (width/height > 0, at least one fill region)
- All placement entity types exist in registry
- All zone references have matching zone definitions
- Briefing has portrait + at least 2 lines
- Has at least 1 primary objective
- Has par time defined
- Has starting resources defined

---

## Phase C: Entity Definitions (satisfy the Phase B tests)

### Task C1: All URA Unit Definitions
**Owner:** sprite-artist
**Files:** Create `src/entities/units/ura/*.ts` (7 files)
**Deps:** A1, A2 (and B1+B5 tests exist to validate against)

Draw ASCII sprites following art-direction.md rules. Set stats from design docs. Run B1+B5 tests to validate.

### Task C2: All Scale-Guard Unit Definitions
**Owner:** sprite-artist
**Files:** Create `src/entities/units/scale-guard/*.ts` (6 files)
**Deps:** A1, A2

### Task C3: All Hero Definitions
**Owner:** sprite-artist
**Files:** Create `src/entities/units/heroes/*.ts` (6 files)
**Deps:** A1, A2

### Task C4: All URA Building Definitions
**Owner:** building-artist
**Files:** Create `src/entities/buildings/ura/*.ts` (12 files)
**Deps:** A1, A2

### Task C5: All Scale-Guard Building Definitions
**Owner:** building-artist
**Files:** Create `src/entities/buildings/scale-guard/*.ts` (5 files)
**Deps:** A1, A2

### Task C6: Resource + Prop Definitions
**Owner:** building-artist
**Files:** Create `src/entities/resources/*.ts` (3 files), `src/entities/props/*.ts` (2 files)
**Deps:** A1, A2

### Task C7: Portrait Definitions
**Owner:** sprite-artist
**Files:** Create `src/entities/portraits/*.ts` (7 files)
**Deps:** A1, A2

### Task C8: Research Definitions
**Owner:** building-artist
**Files:** Create `src/entities/research.ts`
**Deps:** A1

### Task C9: Entity Registry
**Owner:** sprite-artist (or building-artist, whoever finishes first)
**Files:** Create `src/entities/registry.ts`
**Deps:** C1-C8 (needs all definitions to import)

---

## Phase D: Visual Specification Tests (Vitest Browser — screenshots)

### Task D1: Unit Sprite Render Tests
**Owner:** visual-tester
**Files:** Create `src/__tests__/visual/sprites/unit-renders.test.ts`
**Deps:** C1, C2, C3 (needs actual sprites to render)

For each unit: render at 3x, verify dimensions, sample faction color pixels, take screenshot baseline.

### Task D2: Building + Portrait + Terrain Render Tests
**Owner:** visual-tester
**Files:** Create `src/__tests__/visual/sprites/building-renders.test.ts`, `portrait-renders.test.ts`, `terrain-painting.test.ts`
**Deps:** C4, C5, C7, A4

---

## Phase E: Mission Definitions

### Task E1: Mission 1-4 Definitions (Chapter 1)
**Owner:** mission-designer
**Files:** Create `src/entities/missions/chapter1/*.ts`
**Deps:** A4, C9 (needs terrain tiles + entity registry)

### Task E2: Mission 5-8 Definitions (Chapter 2)
**Owner:** mission-designer
**Deps:** E1

### Task E3: Mission 9-12 Definitions (Chapter 3)
**Owner:** mission-designer
**Deps:** E1

### Task E4: Mission 13-16 Definitions (Chapter 4)
**Owner:** mission-designer
**Deps:** E1

### Task E5: Mission Index + Campaign Structure
**Owner:** mission-designer
**Files:** Create `src/entities/missions/index.ts`
**Deps:** E1-E4

---

## Phase F: Scene Wiring + Integration

### Task F1: Wire BootScene (renderer → textures)
**Owner:** integration-agent
**Files:** Modify `src/Scenes/BootScene.ts`
**Deps:** A2, C9

### Task F2: Wire GameScene (spawner + map painter)
**Owner:** integration-agent
**Files:** Modify `src/Scenes/GameScene.ts`
**Deps:** A3, A4, E1

### Task F3: Wire BriefingScene (portraits + dialogue)
**Owner:** integration-agent
**Files:** Modify `src/Scenes/BriefingScene.ts`
**Deps:** C7, E1

### Task F4: Integration Tests (full pipeline)
**Owner:** integration-agent
**Files:** Update `src/__tests__/browser/*.test.ts`
**Deps:** F1, F2, F3

### Task F5: Playtest with Chrome DevTools + Screenshots
**Owner:** integration-agent
**Deps:** F4

---

## Phase G: Cleanup + Tag

### Task G1: Delete Old Code
**Files:** Delete `src/sprites/`, `src/data/`, `src/maps/`
**Deps:** F4 (all integration tests pass first)

### Task G2: Final Verification
**Deps:** G1

Run all 3 test layers. Typecheck. Production build. Manual playtest Mission 1 end-to-end.

Tag: `git tag v0.3.0-entity-architecture`

---

## Dependency Graph

```
A1 (types+palette)
├── A2 (renderer) ──── A3 (spawner)
├── A4 (terrain)
├── B1-B7 (spec tests — can start immediately after A1)
│
├── C1-C8 (entity definitions — satisfy B tests)
│   └── C9 (registry)
│       ├── D1-D2 (visual tests)
│       ├── E1-E5 (missions)
│       │   └── F1-F3 (scene wiring)
│       │       └── F4-F5 (integration + playtest)
│       │           └── G1-G2 (cleanup + tag)
```

## Agent Team (6 agents)

| Agent | Owns | Parallel Track |
|-------|------|---------------|
| **types-agent** | A1, A2, A3, A4 | Foundation — everything depends on this |
| **spec-tester** | B1, B2, B5, B7 | Write spec tests while foundation builds |
| **balance-tester** | B3, B4, B6 | Write balance tests while foundation builds |
| **sprite-artist** | C1, C2, C3, C7, C9 | Draw all unit + hero + portrait sprites |
| **building-artist** | C4, C5, C6, C8 | Draw all building + resource + prop + research defs |
| **mission-designer** | E1-E5, plus visual tests D1-D2 | Mission content + visual QC |

Integration (F1-F5, G1-G2) is led by the team lead after all other work converges.
