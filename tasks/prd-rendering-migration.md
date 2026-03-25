# PRD: Rendering Migration — Phaser to react-konva + Continuous World

## Overview

Replace Phaser 3 (~500KB, fighting React lifecycle) with react-konva (~40KB, native React reconciler) as the rendering layer. Simultaneously eliminate the tile-based coordinate system in favor of continuous world coordinates matching the existing Koota ECS `Position({ x, y })` trait. Generate SP-DSL sprites at runtime instead of baking PNGs at build time.

This is a **rendering-layer-only migration**. The 20 Phaser-free ECS systems (combat, economy, orders, movement, production, building, AI, steering, pathfinding, scenarios, scoring, research, demolition, siege, territory, waves, difficulty, stealth, water, siphon) and the Yuka AI layer are untouched.

**Reference implementation:** `docs/references/poc_final.html` — a single-file vanilla RTS that achieves playable gameplay with procedural sprites, continuous coordinates, canvas fog-of-war, day/night lighting, and responsive layout in ~1180 lines.

## Goals

- Game canvas fills 75%+ of screen (classic RTS layout) — currently ~30%
- Game boots and is interactive within 2 seconds (currently Phaser boot + texture load takes 5-10s)
- Bundle size reduction: drop ~500KB Phaser, add ~40KB Konva
- Eliminate the `syncSystem.ts` bridge layer (182 lines) — Koota state IS render state
- Eliminate the `pnpm build:sprites` pipeline — sprites rendered at init
- Zero changes to any of the 20 Phaser-free ECS systems
- Zero changes to Yuka AI/steering/pathfinding
- Zero changes to entity definitions, mission scripts, or campaign data
- All 2,479 existing unit tests continue to pass

## Current Architecture (What Changes)

### Files to DELETE (~3,500 lines)

| File | Lines | Why |
|------|-------|-----|
| `src/Scenes/GameScene.ts` | 1,127 | Phaser scene — replaced by `<GameCanvas>` React component |
| `src/Scenes/BootScene.ts` | 251 | Phaser boot/loading — replaced by React loading state |
| `src/app/PhaserGame.tsx` | 95 | Phaser React wrapper — replaced by `<Stage>` |
| `src/game/config.ts` | 33 | Phaser game config — not needed |
| `src/systems/syncSystem.ts` | 182 | ECS→Phaser sprite sync — not needed (Koota→Konva direct) |
| `src/systems/fogSystem.ts` | ~200 | Phaser RenderTexture fog — replaced by Konva canvas layer |
| `src/systems/dayNightSystem.ts` | ~150 | Phaser overlay — replaced by CSS/Konva blend layer |
| `src/systems/weatherSystem.ts` | ~120 | Phaser overlay — replaced by Konva layer |
| `src/rendering/*.ts` (9 files) | 1,154 | Phaser-specific renderers — rewritten for Konva/canvas |
| `scripts/build-sprites.ts` | ~200 | PNG bake pipeline — sprites rendered at runtime |
| `public/assets/*.png, *.json` | — | Baked sprite atlases — not needed |

### Files to KEEP UNTOUCHED (~2,500+ lines)

All 20 Phaser-free systems, all ECS traits, all entity definitions, all AI, all missions:

- `src/systems/combatSystem.ts` (328 lines)
- `src/systems/economySystem.ts` (233)
- `src/systems/orderSystem.ts` (270)
- `src/systems/movementSystem.ts` (155)
- `src/systems/productionSystem.ts` (138)
- `src/systems/buildingSystem.ts` (166)
- `src/systems/aiSystem.ts` (226)
- `src/systems/scenarioSystem.ts`, `scoringSystem.ts`, `researchSystem.ts`, `demolitionSystem.ts`, `siegeSystem.ts`, `territorySystem.ts`, `waterSystem.ts`, `siphonSystem.ts`, `stealthSystem.ts`, `multiBaseSystem.ts`, `waveSpawnerSystem.ts`, `difficultyScaling.ts`
- `src/ecs/*` — all traits, relations, singletons, world
- `src/ai/*` — FSM, steering, pathfinder, playtester, GOAP profiles
- `src/entities/*` — all unit/building/hero/resource/mission definitions
- `src/scenarios/*` — scenario engine, types, mission compiler

### Files to MODIFY (minimal changes)

| File | Change |
|------|--------|
| `src/systems/gameLoop.ts` | Remove `Phaser.Scene` from `GameLoopContext`, pass canvas dimensions instead |
| `src/input/selectionManager.ts` | Replace `Phaser.Input.Pointer` with standard `PointerEvent` |
| `src/input/commandDispatcher.ts` | Replace `Phaser.Input.Pointer` with standard `PointerEvent` |
| `src/input/desktopInput.ts` | Remove Phaser scene dependency, use DOM events |
| `src/input/mobileInput.ts` | Remove Phaser scene dependency, use DOM pointer events |
| `src/input/keyboardHotkeys.ts` | Remove Phaser key objects, use native `KeyboardEvent` |
| `src/maps/loader.ts` | Remove `TILE_SIZE` export, replace with world-coordinate helpers |
| `src/app/App.tsx` | Replace `<PhaserGame>` with `<GameCanvas>` |

### Files to CREATE

| File | Purpose |
|------|---------|
| `src/canvas/GameCanvas.tsx` | Main react-konva `<Stage>` + game loop + layers |
| `src/canvas/TerrainLayer.tsx` | Procedural background (noise-painted, single `<Image>`) |
| `src/canvas/EntityLayer.tsx` | Renders all ECS entities as Konva `<Image>` / `<Sprite>` nodes |
| `src/canvas/FogLayer.tsx` | Canvas compositing fog-of-war (radial gradient punch-through) |
| `src/canvas/OverlayLayer.tsx` | Day/night, weather, selection box, placement ghost |
| `src/canvas/MinimapCanvas.tsx` | Minimap with camera rect and entity pips |
| `src/canvas/useGameLoop.ts` | Hook: `requestAnimationFrame` → `tickAllSystems()` → trigger Konva redraw |
| `src/canvas/useCamera.ts` | Hook: camera position, edge scroll, WASD, zoom, bounds clamping |
| `src/canvas/usePointerInput.ts` | Hook: unified pointer events (click/drag/right-click/touch) |
| `src/canvas/spriteCache.ts` | Generate all SP-DSL sprites to `HTMLCanvasElement` at init |
| `src/canvas/terrainPainter.ts` | Procedural world background generator (like POC's `buildMap`) |

## Quality Gates

Every user story must pass before merging:

- `pnpm typecheck` — 0 errors
- `pnpm test:unit` — all existing tests pass (2,479+)
- Visual confirmation via dev server that entities render and are interactive

## Dependency Graph

```
Legend: -> means "blocks" (right side waits for left)

# Foundation (no dependencies)
US-R01 (sprite cache), US-R02 (terrain painter), US-R03 (game loop hook)

# Core rendering (depends on foundation)
US-R01 -> US-R04 (entity layer)
US-R02 -> US-R05 (terrain layer)
US-R03 -> US-R06 (GameCanvas shell)

# Input (depends on core rendering)
US-R06 -> US-R07 (pointer input)
US-R07 -> US-R08 (selection + commands)

# Visual layers (depends on core rendering)
US-R06 -> US-R09 (fog of war layer)
US-R06 -> US-R10 (overlay layer — day/night, weather, selection box)

# Integration (depends on all above)
US-R08, US-R09, US-R10 -> US-R11 (wire into App.tsx, remove Phaser)

# Polish (depends on integration)
US-R11 -> US-R12 (minimap)
US-R11 -> US-R13 (HUD layout — game canvas dominant)
US-R11 -> US-R14 (input: keyboard hotkeys, control groups)
US-R11 -> US-R15 (visual feedback: HP bars, floating text, particles)

# Cleanup (last)
US-R15 -> US-R16 (delete Phaser, tile system, sprite pipeline, dead code)
```

## User Stories

---

### US-R01: Runtime SP-DSL sprite cache

As a developer, I want all entity sprites generated at runtime into an in-memory cache so that no PNG build step is needed.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Create `src/canvas/spriteCache.ts`
- [ ] `initSpriteCache()` iterates all entries in `ALL_UNITS`, `ALL_HEROES`, `ALL_BUILDINGS`, `ALL_RESOURCES` from the entity registry
- [ ] For each entity, call the existing SP-DSL renderer (`src/entities/renderer.ts` → `renderEntitySprite()`) to produce an `HTMLCanvasElement`
- [ ] Store results in a `Map<string, HTMLCanvasElement>` keyed by entity ID
- [ ] For entities with animation frames (walk, attack), generate each frame as a separate canvas entry keyed `{id}_walk_0`, `{id}_walk_1`, etc.
- [ ] Export `getSpriteCanvas(entityId: string, animation?: string, frame?: number): HTMLCanvasElement | null`
- [ ] Cache init completes in <100ms for all ~40 entity types
- [ ] Unit test verifying cache contains entries for every registered entity

---

### US-R02: Procedural terrain painter

As a developer, I want mission terrain generated as a continuous painted canvas so that no tile grid is needed.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Create `src/canvas/terrainPainter.ts`
- [ ] `paintTerrain(missionDef: MissionDef): HTMLCanvasElement` reads the mission's `terrain.regions` array
- [ ] Paints base layer as fill color for the terrain type (grass=green, water=blue, mud=brown, etc.)
- [ ] Paints region overlays using scattered noise (random `fillRect` with color variation, like the POC's `buildMap`)
- [ ] River regions painted as sinuous water strips using the `river.points` + `river.width` data
- [ ] Override tiles painted at exact coordinates
- [ ] Output canvas dimensions = `terrain.width * 32` x `terrain.height * 32` (preserving world scale)
- [ ] Unit test verifying output canvas has correct dimensions for Mission 1

---

### US-R03: Game loop hook

As a developer, I want a React hook that runs `tickAllSystems()` each frame so that the ECS simulation drives the game.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Create `src/canvas/useGameLoop.ts`
- [ ] `useGameLoop(world, options)` hook runs a `requestAnimationFrame` loop
- [ ] Each frame: compute delta, call `tickAllSystems()` with a simplified `GameLoopContext` (no Phaser.Scene)
- [ ] `GameLoopContext` is modified to accept `{ world, delta, width, height }` instead of `Phaser.Scene`
- [ ] The fog, weather, and day/night systems get replacement interfaces (canvas-based, not Phaser-based)
- [ ] Hook returns `{ frameCount, fps, isPaused }` for HUD display
- [ ] Game loop pauses when `GamePhase.phase !== "playing"`
- [ ] Cleanup on unmount stops the animation frame

---

### US-R04: Entity rendering layer

As a player, I want to see all units, buildings, and resources rendered on the game canvas with correct positions and sprites.

**Dependencies:** US-R01

**Quality gate:** `pnpm typecheck && pnpm test:unit` + visual confirmation

**Acceptance Criteria:**
- [ ] Create `src/canvas/EntityLayer.tsx`
- [ ] React component that queries Koota ECS for all entities with `Position` + `UnitType` traits
- [ ] Renders each entity as a Konva `<Image>` using the sprite from the cache (US-R01)
- [ ] Entities sorted by Y-position for depth ordering (painter's algorithm)
- [ ] Entity positions offset by camera `(-camX, -camY)` via a parent `<Group>`
- [ ] Only renders entities within the camera viewport (frustum culling)
- [ ] Selected entities show a selection circle (ellipse stroke beneath sprite)
- [ ] Damaged entities show an HP bar above their sprite (green→yellow→red gradient)
- [ ] Buildings under construction render at reduced alpha proportional to progress
- [ ] Facing direction flips sprite horizontally via `scaleX: -1`

---

### US-R05: Terrain rendering layer

As a player, I want to see the mission terrain as a continuous painted landscape.

**Dependencies:** US-R02

**Quality gate:** `pnpm typecheck` + visual confirmation

**Acceptance Criteria:**
- [ ] Create `src/canvas/TerrainLayer.tsx`
- [ ] React component that renders the pre-painted terrain canvas (from US-R02) as a single Konva `<Image>`
- [ ] Terrain offset by camera position via parent `<Group>`
- [ ] Layer has `listening={false}` for performance (no hit detection on background)
- [ ] Terrain only painted once per mission load (not every frame)

---

### US-R06: GameCanvas shell with react-konva Stage

As a developer, I want a `<GameCanvas>` React component that hosts the Konva Stage, layers, and game loop.

**Dependencies:** US-R03, US-R04, US-R05

**Quality gate:** `pnpm typecheck` + visual confirmation (terrain + entities visible)

**Acceptance Criteria:**
- [ ] Create `src/canvas/GameCanvas.tsx`
- [ ] Renders `<Stage width={containerWidth} height={containerHeight}>` that fills its parent container
- [ ] Uses `ResizeObserver` to track container size and update Stage dimensions
- [ ] Contains layers in order: `<TerrainLayer>` → `<EntityLayer>` → `<OverlayLayer>` → `<FogLayer>`
- [ ] Runs the game loop hook (US-R03)
- [ ] Passes camera state to all layers
- [ ] Accepts `deploymentData` prop (missionId + difficulty) and initializes the mission on mount
- [ ] Spawns entities from mission `placements` array into the Koota world

---

### US-R07: Unified pointer input

As a player, I want to click/tap/drag on the game canvas to interact with units using standard pointer events.

**Dependencies:** US-R06

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Create `src/canvas/usePointerInput.ts`
- [ ] Hook attaches `pointerdown`, `pointermove`, `pointerup` to the Stage's container div
- [ ] Translates screen coordinates to world coordinates using camera offset
- [ ] Detects: single click/tap, drag (box select), right-click (desktop), two-finger pan (mobile)
- [ ] Dispatches selection and command actions to the Koota world (reusing existing `OrderQueue` push logic)
- [ ] No Phaser dependency — uses standard DOM `PointerEvent`
- [ ] Two-finger camera panning via `activePointers` Map (like POC)
- [ ] Pinch-to-zoom updates camera zoom level

---

### US-R08: Selection and command dispatch

As a player, I want to select units and issue move/attack/gather/build commands so that the game is playable.

**Dependencies:** US-R07

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Refactor `src/input/selectionManager.ts` to remove Phaser dependency — use world coordinates from US-R07
- [ ] Refactor `src/input/commandDispatcher.ts` to remove Phaser dependency — accept `(worldX, worldY, mode, append)` directly
- [ ] Click on friendly unit = select (add `Selected` trait)
- [ ] Shift-click = additive selection (toggle `Selected`)
- [ ] Drag = box select all friendly units in rectangle
- [ ] Right-click ground = move order
- [ ] Right-click enemy = attack order
- [ ] Right-click resource = gather order (workers only)
- [ ] Right-click with building selected = set rally point
- [ ] Shift+right-click = append to order queue
- [ ] Visual command marker feedback (green/red/yellow circle at target)

---

### US-R09: Fog of war layer

As a player, I want unexplored areas hidden and explored-but-not-visible areas dimmed so that I must scout.

**Dependencies:** US-R06

**Quality gate:** `pnpm typecheck` + visual confirmation

**Acceptance Criteria:**
- [ ] Create `src/canvas/FogLayer.tsx`
- [ ] Uses a Konva `<Shape>` with custom `sceneFunc` that draws fog via Canvas2D compositing
- [ ] Procedural fog texture (tiled noise pattern, like POC's `buildFogTexture`)
- [ ] Vision holes punched using `destination-out` compositing with radial gradients per player entity
- [ ] Vision radius read from entity's `VisionRadius` trait (buildings get larger radius)
- [ ] Soft feathered edges on vision circles
- [ ] Layer uses `listening={false}` and appropriate blend mode

---

### US-R10: Overlay layer (day/night, weather, selection box, placement ghost)

As a player, I want visual overlays for time-of-day, weather effects, selection rectangle, and building placement preview.

**Dependencies:** US-R06

**Quality gate:** `pnpm typecheck` + visual confirmation

**Acceptance Criteria:**
- [ ] Create `src/canvas/OverlayLayer.tsx`
- [ ] Day/night: color tint overlay interpolated from `GameClock` time (dawn orange → day clear → dusk red → night blue)
- [ ] Weather: rain/monsoon particle overlay when `WeatherCondition` active
- [ ] Selection box: green translucent rectangle drawn during drag-select
- [ ] Placement ghost: semi-transparent building sprite following cursor with green/red validity tint
- [ ] All overlays are pointer-events-none (don't interfere with input)

---

### US-R11: Wire GameCanvas into App.tsx, remove Phaser

As a developer, I want `<GameCanvas>` replacing `<PhaserGame>` in the app so that the game runs on Konva.

**Dependencies:** US-R08, US-R09, US-R10

**Quality gate:** `pnpm typecheck && pnpm test:unit` + playable game in browser

**Acceptance Criteria:**
- [ ] Replace `<PhaserGame ref={phaserRef} deploymentData={deploymentData} />` with `<GameCanvas deploymentData={deploymentData} />`
- [ ] Remove `PhaserGame.tsx` import
- [ ] Remove Phaser from `package.json` dependencies
- [ ] Add `konva` and `react-konva` to dependencies
- [ ] The game loads Mission 1, shows terrain, spawns entities, and accepts input
- [ ] Resource bar updates as workers gather
- [ ] All ECS systems tick correctly (combat, economy, production, etc.)
- [ ] `pnpm build` produces a working production bundle without Phaser

---

### US-R12: Minimap

As a player, I want a minimap showing the full battlefield with unit pips and camera viewport rectangle.

**Dependencies:** US-R11

**Quality gate:** `pnpm typecheck` + visual confirmation

**Acceptance Criteria:**
- [ ] Create `src/canvas/MinimapCanvas.tsx`
- [ ] Small canvas (200x200 or responsive) rendering a scaled-down view of the world
- [ ] Player units as colored pips (blue), enemy units as red pips, resources as yellow pips
- [ ] Buildings as larger pips
- [ ] Camera viewport rectangle overlay
- [ ] Click minimap = snap camera to that position
- [ ] Drag minimap = pan camera smoothly

---

### US-R13: HUD layout — game canvas dominant

As a player, I want the game canvas to take up 75%+ of the screen with a compact HUD bar.

**Dependencies:** US-R11

**Quality gate:** visual confirmation at 1920x1080, 1280x720, and 375x667

**Acceptance Criteria:**
- [ ] Restructure `TacticalShell` layout: game canvas is the dominant area, HUD is a compact bottom bar
- [ ] Resource bar is a single thin row at the top (mission name + resources + pop + clock)
- [ ] Bottom bar contains: minimap (left), unit panel (center), action buttons (right) — all compact
- [ ] No left sidebar, no expanded objectives list, no "Tactical Feed" labels
- [ ] Phone layout: resource bar top, game canvas middle, action bar bottom (thumb-reachable)
- [ ] Reference: StarCraft/Warcraft II layout proportions

---

### US-R14: Keyboard hotkeys and control groups

As a player, I want keyboard shortcuts working with the new input system.

**Dependencies:** US-R11

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Refactor `src/input/keyboardHotkeys.ts` to remove Phaser key objects — use native `KeyboardEvent` via `window.addEventListener`
- [ ] WASD/arrow keys pan camera
- [ ] H = halt, A+click = attack-move, P+click = patrol
- [ ] Ctrl+1-9 = assign control group, 1-9 = recall
- [ ] Escape = deselect / cancel placement
- [ ] Space = center camera on last alert

---

### US-R15: Visual feedback (HP bars, floating text, particles, projectile trails)

As a player, I want visual feedback for damage, resource gathering, construction, and combat.

**Dependencies:** US-R11

**Quality gate:** `pnpm typecheck` + visual confirmation

**Acceptance Criteria:**
- [ ] HP bars rendered above entities via Konva `<Rect>` nodes in the entity layer
- [ ] Floating damage/resource text via Konva `<Text>` nodes that rise and fade
- [ ] Projectile trails via small `<Circle>` particles in a particle layer
- [ ] Construction progress: building alpha increases from 30% to 100%
- [ ] Resource carrying indicator: colored pip above workers
- [ ] Rally point: dashed line from building to rally point when selected
- [ ] Selection circle: ellipse below selected units

---

### US-R16: Delete Phaser, tile system, sprite pipeline, dead code

As a developer, I want all Phaser-related code and the tile system removed so the codebase is clean.

**Dependencies:** US-R15

**Quality gate:** `pnpm typecheck && pnpm test:unit && pnpm build`

**Acceptance Criteria:**
- [ ] `pnpm remove phaser`
- [ ] Delete: `src/Scenes/`, `src/app/PhaserGame.tsx`, `src/game/config.ts`, `src/systems/syncSystem.ts`
- [ ] Delete: `src/rendering/*.ts` (old Phaser-specific renderers)
- [ ] Delete: `scripts/build-sprites.ts`, `public/assets/*.png`, `public/assets/*.json`
- [ ] Remove `TILE_SIZE` constant and all `Math.floor(x / TILE_SIZE)` conversions from input layer
- [ ] Remove `pnpm build:sprites` from package.json scripts
- [ ] Update `tsconfig.json` includes to remove deleted directories
- [ ] Update `CLAUDE.md` to reflect new stack (react-konva, no Phaser, no tiles)
- [ ] All tests pass, production build succeeds, game is playable

---

## Technical Requirements

- **react-konva** ^19.x (React 19 reconciler)
- **konva** ^9.x
- **anime.js** (optional, for HUD animations — can add later)
- Remove **phaser** ^3.88
- Keep **koota** (ECS), **yuka** (AI/steering), **tone.js** (audio)
- Continuous world coordinates: entities use `Position({ x, y })` directly, no tile conversion
- Sprite generation at runtime via existing SP-DSL renderer — no build pipeline

## Success Criteria

- Game loads to playable state in <2 seconds
- Game canvas occupies 75%+ of viewport at 1280x720
- All 20 Phaser-free ECS systems work identically (zero changes)
- All 2,479 existing unit tests pass
- Bundle size decreases by ~450KB
- Mission 1 is playable: gather, build, train, fight, win

## Out of Scope

- Rewriting ECS systems or Yuka AI
- Changing entity definitions or mission scripts
- Adding new gameplay features
- Mobile Capacitor native builds (separate PRD)
- Multiplayer / networking
- New unit types or abilities

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| react-konva perf with 200+ entities | Konva's layer separation + `listening: false` on static layers. POC handles this with vanilla canvas at 60fps. |
| Losing Phaser's camera system | Camera is just `camX`/`camY` offset on a `<Group>`. POC does this in 4 lines. |
| SP-DSL runtime rendering slower than pre-baked PNGs | Cache all sprites at init into `HTMLCanvasElement` map. One-time cost <100ms. |
| Input regression (selection, commands) | Existing input tests continue to pass. Input logic is preserved, only the event source changes (Phaser.Pointer → DOM PointerEvent). |
| ECS game loop timing differences | `requestAnimationFrame` provides the same `delta` mechanism as Phaser's `update()`. |
