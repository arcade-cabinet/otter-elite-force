# PRD: Rendering Migration — Phaser to react-konva + Continuous World

## Overview

Replace Phaser 3 (~500KB, fighting React lifecycle) with react-konva (~40KB, native React reconciler) as the rendering layer. Simultaneously eliminate the tile-based coordinate system in favor of continuous world coordinates matching the existing Koota ECS `Position({ x, y })` trait. Generate SP-DSL sprites at runtime instead of baking PNGs at build time.

This is a **rendering-layer-only migration**. The 20 Phaser-free ECS systems (combat, economy, orders, movement, production, building, AI, steering, pathfinding, scenarios, scoring, research, demolition, siege, territory, waves, difficulty, stealth, water, siphon) and the Yuka AI layer are untouched.

**Reference implementation:** `docs/references/poc_final.html` — a single-file vanilla RTS that achieves playable gameplay with procedural sprites, continuous coordinates, canvas fog-of-war, day/night lighting, and responsive layout in ~1180 lines. This POC is the gold standard for what the game should look and feel like.

## What the POC Gets Right That We Must Match

### Sprites
The POC's procedural sprites at 16x16 scaled 2.5x produce **significantly more readable, characterful units** than our SP-DSL pixel grids. Otters have visible eyes, noses, bellies, held items. Gators are recognizably reptilian with scales, yellow eyes, long snouts. Buildings are mud lodges with scattered texture. All in ~20 lines of pixel-drawing code per entity type. Our SP-DSL sprites have 238 rows with wrong widths, missing animation frames, and palette reference bugs. The new sprite approach should follow the POC's `SpriteGen` pattern — direct `fillRect`/`fillStyle` procedural drawing into canvas, not a grid-of-palette-chars abstraction.

### HUD Layout
The POC uses a **dead-simple responsive layout** that gives the game 75%+ of screen:
- `flex-col-reverse md:flex-row` — on mobile the UI panel goes to bottom, on desktop it's a left sidebar
- UI panel is exactly `w-64` (desktop) or `h-48` (mobile) — **fixed size, never grows**
- Inside the panel: minimap (1/3), selection info (1/3), action buttons (1/3) — stacked vertically on desktop, horizontal on mobile
- Resource bar is a thin `h-10 md:h-12` absolute-positioned strip at the top of the game area
- **No** separate left dock, right dock, center dock, bottom dock, tactical rail, command console, objectives list, CO feed, speaker feed, tactical feed labels, or any other HUD chrome

Our current HUD (`TacticalShell` with `hudTop`, `leftDock`, `centerDock`, `rightDock`, `alerts`) creates an **overcrowded command center UI** that eats 70% of the screen and leaves a postage stamp for gameplay. The entire `src/ui/hud/` directory (CommandConsole, TacticalRail, GameplayTopBar, ResponsiveHUD) should be replaced with the POC's approach: one UI panel component with three sections.

### Game Area
The POC's game container is `flex-1 relative cursor-crosshair overflow-hidden bg-black` — it takes ALL remaining space after the UI panel. The canvas fills this container via `canvas.width = container.clientWidth`. No decorative borders, no "Tactical Feed" labels, no inner inset shadows, no camo overlays on the game viewport.

## Goals

- Game canvas fills 75%+ of screen (classic RTS layout) — currently ~30%
- Game boots and is interactive within 2 seconds (currently Phaser boot + texture load takes 5-10s)
- Bundle size reduction: drop ~500KB Phaser, add ~40KB Konva
- Eliminate the `syncSystem.ts` bridge layer (182 lines) — Koota state IS render state
- Eliminate the `pnpm build:sprites` pipeline — sprites rendered at init
- **Replace the entire HUD** with the POC's simple panel layout
- **Replace SP-DSL sprite rendering** with POC-style procedural `SpriteGen` drawing
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
| `src/ui/hud/CommandConsole.tsx` | ~400 | Bloated command console — replaced by POC-style action panel |
| `src/ui/hud/TacticalRail.tsx` | ~200 | Left sidebar dock — eliminated |
| `src/ui/hud/GameplayTopBar.tsx` | ~150 | Multi-row top bar — replaced by thin resource strip |
| `src/ui/hud/ResponsiveHUD.tsx` | ~325 | Overcomplicated responsive layout — replaced by POC's `flex-col-reverse md:flex-row` |
| `src/ui/layout/shells.tsx` | ~300 | TacticalShell with 5 dock slots — replaced by simple flex layout |
| `src/ui/hud/PanelFrame.tsx` | ~90 | Decorative rivet frame — not needed in POC layout |

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
| `src/canvas/spriteGen.ts` | POC-style procedural sprite generator (direct canvas drawing) |
| `src/ui/GameLayout.tsx` | POC's flex layout replacing TacticalShell + all dock components |
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

### US-R01: POC-style procedural sprite generator

As a developer, I want entity sprites generated procedurally at runtime using direct canvas drawing (like the POC's `SpriteGen`) so that sprites are readable, characterful, and require no build pipeline.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Reference:** POC `SpriteGen.generate()` (lines 177-248 of `poc_final.html`) — each entity type is 15-25 lines of `fillRect`/`fillStyle`/`circle` calls on a 16x16 or 32x32 canvas, scaled 2.5-3x.

**Acceptance Criteria:**
- [ ] Create `src/canvas/spriteGen.ts` following the POC's `SpriteGen` pattern
- [ ] Each entity type gets a dedicated drawing function using direct Canvas2D calls (`fillRect`, `fillStyle`, pixel placement)
- [ ] **Otter units** (gatherer/brawler/sniper): brown body, amber belly, black dot eyes, black nose, visible arms/legs. Gatherer holds tool, brawler has club + helmet, sniper has long stick weapon. Must look recognizably like otters at game zoom.
- [ ] **Gator enemies**: long green body, lighter belly scales, yellow eyes, visible snout. Must look recognizably reptilian.
- [ ] **Snake enemies**: coiled body with stripes, visible head with eyes.
- [ ] **Buildings**: mud lodge (dome with twig texture + dark door), burrow (smaller dome), armory (structured rectangle), tower (tall with platform). Buildings are 32x32 scaled 3x.
- [ ] **Resources**: cattail (tall reed with brown top), clambed (shallow water circle with shells).
- [ ] Units are 16x16 scaled 2.5x, buildings are 32x32 scaled 3x (matching POC proportions)
- [ ] Store all generated sprites in a `Map<string, HTMLCanvasElement>` keyed by entity ID
- [ ] `initSprites()` generates all sprites at init in <50ms
- [ ] Existing SP-DSL grid definitions in `src/entities/` are kept as data but the rendering path is replaced
- [ ] Unit test verifying every registered entity has a generated sprite

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

### US-R13: Replace HUD with POC's layout

As a player, I want the game canvas to take up 75%+ of the screen with a compact fixed-size UI panel, exactly like the POC.

**Dependencies:** US-R11

**Quality gate:** visual confirmation at 1920x1080, 1280x720, and 375x667

**Reference:** POC layout (lines 53-115 of `poc_final.html`):
- `body` is `flex flex-col-reverse md:flex-row h-screen w-screen`
- UI panel: `w-full md:w-64 h-48 md:h-full` — fixed size, never grows
- Inside panel: minimap (1/3 or `md:h-64`), selection info (1/3 flex-1), action buttons (1/3 or `md:h-64`)
- Game container: `flex-1 relative` — takes ALL remaining space
- Resource bar: `absolute top-0 left-0 w-full h-10 md:h-12` inside game container

**Acceptance Criteria:**
- [ ] **Delete** `TacticalShell`, `CommandConsole`, `TacticalRail`, `GameplayTopBar`, `ResponsiveHUD`, `PanelFrame`
- [ ] Create `src/ui/GameLayout.tsx` — the POC's flex layout: `flex-col-reverse md:flex-row h-screen`
- [ ] UI panel component: fixed `w-full md:w-64 h-48 md:h-full` with three sections (minimap, selection, actions)
- [ ] Resource bar: thin absolute strip inside the game container (`h-10 md:h-12`) showing resources + pop + clock
- [ ] Game container: `flex-1 relative overflow-hidden bg-black` — holds the Konva Stage
- [ ] Selection info panel reads from Koota `Selected` trait — shows name, HP bar, stats (like POC lines 67-74)
- [ ] Action panel shows context-sensitive buttons: build options for workers, train for buildings (like POC lines 602-624)
- [ ] Buttons have costs displayed, greyed out when unaffordable (like POC `addBtn`)
- [ ] Mobile: UI panel at bottom (`h-48`), three sections horizontal (`flex-row`)
- [ ] Desktop: UI panel at left (`w-64`), three sections vertical (`flex-col`)
- [ ] No shell wrappers, no dock slots, no decorative frames, no expanded objectives list
- [ ] Game canvas gets `cursor-crosshair` class

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
