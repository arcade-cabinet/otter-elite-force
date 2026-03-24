# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Playable 4-mission demo on desktop web with core RTS mechanics

**Architecture:** Phaser renders everything (game + UI). Koota ECS owns all game state. Yuka handles pathfinding + steering. Zustand bridges persistence. SQLite stores saves/progress.

**Tech Stack:** Vite 7, Phaser 3.90, Koota, Yuka 0.7, Zustand 5, @capacitor-community/sqlite 8, Tone.js, Biome, Vitest

**Spec:** `docs/superpowers/specs/2026-03-23-rts-pivot-design.md`

**Master Index:** `docs/superpowers/plans/2026-03-23-master-index.md`

---

## Task 1: Project Scaffold

**Owner:** scaffold-architect
**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `biome.json`, `capacitor.config.ts`
- Create: `src/main.ts`, `src/config/game.config.ts`
- Create: `index.html`

- [ ] **Step 1:** Initialize new project with pnpm, install core deps
  ```bash
  pnpm init
  pnpm add phaser koota yuka zustand tone @capacitor-community/sqlite @capacitor/core
  pnpm add -D vite typescript @biomejs/biome vitest happy-dom @vitest/coverage-v8 playwright
  ```
- [ ] **Step 2:** Create `vite.config.ts` with Phaser-optimized config (manual chunks: phaser, tone, yuka, koota)
- [ ] **Step 3:** Create `tsconfig.json` (ES2022 target, bundler resolution, strict mode, paths: `@/*` → `src/*`)
- [ ] **Step 4:** Create `biome.json` (tabs, indent-width 2, recommended rules, VCS git-aware)
- [ ] **Step 5:** Create `capacitor.config.ts` (appId: `com.arcadecabinet.ottereliteforce`, webDir: `dist`, CapacitorSQLite plugin config)
- [ ] **Step 6:** Create `index.html` (minimal: single div `#game-container`, no React)
- [ ] **Step 7:** Create `src/main.ts` — instantiate `new Phaser.Game(gameConfig)` from `src/config/game.config.ts`
- [ ] **Step 8:** Create `src/config/game.config.ts` — Phaser config: AUTO renderer, parent `#game-container`, ScaleManager FIT, 1280×720 base, scene list
- [ ] **Step 9:** Verify `pnpm dev` launches Phaser with a blank canvas
- [ ] **Step 10:** Commit: `🔧 chore(scaffold): initialize Vite+Phaser+Capacitor project`

---

## Task 2: .sprite Format Parser

**Owner:** sprite-engineer
**Files:**
- Create: `src/sprites/parser.ts`
- Create: `src/sprites/compiler.ts`
- Create: `src/sprites/atlas.ts`
- Test: `src/__tests__/sprites/parser.test.ts`, `src/__tests__/sprites/compiler.test.ts`

- [ ] **Step 1:** Write failing test for `.sprite` TOML+ASCII parser — parse a minimal sprite string, assert meta/palette/frames extracted
- [ ] **Step 2:** Run test, confirm FAIL. Install `smol-toml` for TOML parsing: `pnpm add smol-toml`
- [ ] **Step 3:** Implement `parseSpriteFile(content: string): SpriteDefinition` — parse TOML header, extract `[frame.N]` art blocks, build palette map
- [ ] **Step 4:** Run test, confirm PASS. Commit: `✨ feat(sprites): implement .sprite TOML+ASCII parser`
- [ ] **Step 5:** Write failing test for sprite compiler — given a SpriteDefinition, output an `ImageData` pixel buffer
- [ ] **Step 6:** Implement `compileSpriteToPixels(def: SpriteDefinition, scale: number): ImageData` — for each char in art grid, look up palette color, write RGBA pixels at scale
- [ ] **Step 7:** Run test, confirm PASS. Commit: `✨ feat(sprites): implement sprite-to-pixel compiler`
- [ ] **Step 8:** Implement `generateAtlas(sprites: SpriteDefinition[]): { image: ImageData, frames: Record<string, Rect> }` — pack multiple sprites into a single atlas
- [ ] **Step 9:** Test atlas generation. Commit: `✨ feat(sprites): implement sprite atlas generator`

---

## Task 3: Initial Sprite Art Assets

**Owner:** sprite-engineer
**Depends on:** Task 2
**Files:**
- Create: `src/sprites/assets/units/river-rat.sprite`
- Create: `src/sprites/assets/units/mudfoot.sprite`
- Create: `src/sprites/assets/units/gator.sprite`
- Create: `src/sprites/assets/buildings/command-post.sprite`
- Create: `src/sprites/assets/buildings/barracks.sprite`
- Create: `src/sprites/assets/buildings/watchtower.sprite`
- Create: `src/sprites/assets/buildings/fish-trap.sprite`
- Create: `src/sprites/assets/buildings/burrow.sprite`
- Create: `src/sprites/assets/buildings/sandbag-wall.sprite`
- Create: `src/sprites/assets/terrain/grass.sprite`, `water.sprite`, `mud.sprite`, `dirt.sprite`, `mangrove.sprite`, `bridge.sprite`
- Create: `src/sprites/assets/portraits/foxhound.sprite`

- [ ] **Step 1-9:** Hand-paint each `.sprite` file using TOML+ASCII format. 16×16 for units/terrain, 32×32 for buildings, 64×96 for portrait. Follow the palette: browns/greens for URA, reds/greens for Scale-Guard, earth tones for terrain.
- [ ] **Step 10:** Commit: `🎨 feat(sprites): add Phase 1 sprite art assets`

---

## Task 4: Koota ECS World + Core Traits

**Owner:** ecs-architect
**Files:**
- Create: `src/ecs/world.ts`
- Create: `src/ecs/traits/identity.ts`, `spatial.ts`, `combat.ts`, `ai.ts`, `orders.ts`, `economy.ts`, `phaser.ts`
- Create: `src/ecs/relations/index.ts`
- Create: `src/ecs/queries/index.ts`
- Test: `src/__tests__/ecs/traits.test.ts`, `src/__tests__/ecs/relations.test.ts`

- [ ] **Step 1:** Write failing test: create world, spawn entity with Position+UnitType, query it back
- [ ] **Step 2:** Implement `src/ecs/world.ts` — `export const world = createWorld()`
- [ ] **Step 3:** Implement `src/ecs/traits/identity.ts` — UnitType, Faction, IsHero, IsBuilding, IsProjectile, IsResource tag traits
- [ ] **Step 4:** Implement `src/ecs/traits/spatial.ts` — Position, Velocity, FacingDirection
- [ ] **Step 5:** Implement `src/ecs/traits/combat.ts` — Health, Attack, Armor, VisionRadius
- [ ] **Step 6:** Implement `src/ecs/traits/economy.ts` — Gatherer, ResourceNode, ProductionQueue, PopulationCost
- [ ] **Step 7:** Implement `src/ecs/traits/orders.ts` — OrderQueue, RallyPoint
- [ ] **Step 8:** Implement `src/ecs/traits/ai.ts` — AIState, SteeringAgent (AoS for Yuka Vehicle ref)
- [ ] **Step 9:** Implement `src/ecs/traits/phaser.ts` — PhaserSprite (AoS for Phaser.GameObjects.Sprite ref)
- [ ] **Step 10:** Run tests, confirm PASS. Commit: `✨ feat(ecs): add Koota world and core traits`
- [ ] **Step 11:** Write failing test for relations — BelongsToSquad, OwnedBy, Targeting
- [ ] **Step 12:** Implement `src/ecs/relations/index.ts` — all 6 relations from spec
- [ ] **Step 13:** Implement `src/ecs/queries/index.ts` — playerUnits, enemiesInVision, idleWorkers, buildingsTraining, damagedUnits
- [ ] **Step 14:** Run tests, confirm PASS. Commit: `✨ feat(ecs): add relations and query factories`

---

## Task 5: Phaser Scene Architecture

**Owner:** phaser-engineer
**Depends on:** Task 1
**Files:**
- Create: `src/scenes/BootScene.ts`, `MenuScene.ts`, `BriefingScene.ts`, `GameScene.ts`, `HUDScene.ts`, `PauseScene.ts`, `VictoryScene.ts`

- [ ] **Step 1:** Create `BootScene.ts` — preload compiled sprite atlases, show loading bar, transition to MenuScene
- [ ] **Step 2:** Create `MenuScene.ts` — campaign select, new game / continue / settings buttons, difficulty selection (Phaser Text + Graphics)
- [ ] **Step 3:** Create `BriefingScene.ts` — portrait sprite + text box + "Deploy" button + dialogue lines with typewriter effect
- [ ] **Step 4:** Create `GameScene.ts` — tilemap creation, camera setup (pan/zoom), ScaleManager FIT, game loop that ticks ECS systems
- [ ] **Step 5:** Create `HUDScene.ts` — launched parallel to GameScene. Resource display, minimap (second camera + RenderTexture), unit info panel, action buttons
- [ ] **Step 6:** Create `PauseScene.ts` — overlay, resume/save/quit buttons
- [ ] **Step 7:** Create `VictoryScene.ts` — mission complete, star rating, continue button
- [ ] **Step 8:** Wire scene transitions in `game.config.ts`
- [ ] **Step 9:** Verify scene flow: Boot → Menu → Briefing → Game+HUD → Victory → Menu
- [ ] **Step 10:** Commit: `✨ feat(phaser): implement scene architecture with all 7 scenes`

---

## Task 6: Koota↔Phaser Sync Layer

**Owner:** ecs-architect
**Depends on:** Task 4, Task 5
**Files:**
- Create: `src/systems/syncSystem.ts`
- Test: `src/__tests__/systems/syncSystem.test.ts`

- [ ] **Step 1:** Write failing test: spawn Koota entity with Position+UnitType, call syncSystem, verify PhaserSprite trait added (mock Scene)
- [ ] **Step 2:** Implement `syncKootaToPhaser(world, scene)` — handle Added(Position), sync positions, handle Removed(Position) cleanup
- [ ] **Step 3:** Implement reverse: Phaser sprite click → resolve kootaEntity data → update selection state in Koota
- [ ] **Step 4:** Run test, confirm PASS. Commit: `✨ feat(ecs): implement Koota↔Phaser sprite sync layer`

---

## Task 7: Tilemap Renderer + Terrain

**Owner:** phaser-engineer
**Depends on:** Task 3 (terrain sprites), Task 5
**Files:**
- Create: `src/maps/loader.ts`
- Create: `src/maps/missions/mission-01-beachhead.ts`

- [ ] **Step 1:** Define tilemap data format: 2D array of terrain type enums, plus object layer (entities, resources, triggers)
- [ ] **Step 2:** Implement `loadMission(scene, missionData)` — create Phaser.Tilemaps.Tilemap from data, apply terrain tile textures
- [ ] **Step 3:** Hand-paint Mission 1 map (~50×40 tiles): starting beach, mangrove forest, fishing spot, timber grove, salvage cache, enemy patrol area
- [ ] **Step 4:** Integrate into GameScene: call loadMission in create(), set camera bounds to map bounds
- [ ] **Step 5:** Verify map renders and camera pans correctly
- [ ] **Step 6:** Commit: `✨ feat(phaser): implement tilemap renderer with Mission 1 map`

---

## Task 8: Unit Data Definitions

**Owner:** combat-engineer (or scenario-designer)
**Files:**
- Create: `src/data/units.ts`, `src/data/buildings.ts`, `src/data/research.ts`, `src/data/factions.ts`

- [ ] **Step 1:** Define TypeScript interfaces for UnitDef, BuildingDef, ResearchDef
- [ ] **Step 2:** Implement `src/data/units.ts` — all URA + Scale-Guard unit stat tables from spec (HP, armor, damage, range, speed, cost, pop)
- [ ] **Step 3:** Implement `src/data/buildings.ts` — all building stat tables (HP, cost, build time, function)
- [ ] **Step 4:** Implement `src/data/research.ts` — all research items (cost, time, effect)
- [ ] **Step 5:** Implement `src/data/factions.ts` — URA and Scale-Guard faction configs
- [ ] **Step 6:** Write unit tests validating all stat values match spec
- [ ] **Step 7:** Commit: `✨ feat(data): add unit, building, research, and faction definitions`

---

## Task 9: Resource Gathering Economy

**Owner:** economy-engineer
**Depends on:** Task 4 (ECS traits)
**Files:**
- Create: `src/systems/economySystem.ts`, `src/systems/productionSystem.ts`
- Test: `src/__tests__/systems/economySystem.test.ts`

- [ ] **Step 1:** Write failing test: River Rat entity with Gatherer trait near ResourceNode, tick economySystem, verify carrying amount increases
- [ ] **Step 2:** Implement `economySystem(world, delta)` — find entities with Gatherer+GatheringFrom relation, increment carrying, when full → pathfind to Command Post → deposit
- [ ] **Step 3:** Implement deposit logic: when Gatherer arrives at Command Post, transfer carried resources to global resource pool (Zustand store)
- [ ] **Step 4:** Run tests, confirm PASS. Commit: `✨ feat(economy): implement resource gathering and deposit`
- [ ] **Step 5:** Write failing test for Fish Trap passive income
- [ ] **Step 6:** Implement passive income: Fish Traps with IsBuilding+OwnedBy('ura') generate +3 fish per 10s
- [ ] **Step 7:** Run tests. Commit: `✨ feat(economy): implement passive Fish Trap income`

---

## Task 10: Building Placement System

**Owner:** economy-engineer
**Depends on:** Task 4, Task 7
**Files:**
- Create: (logic in economySystem or new `src/systems/buildingSystem.ts`)

- [ ] **Step 1:** Write failing test: place building at tile (x,y), verify Koota entity spawned with IsBuilding+Position+Health
- [ ] **Step 2:** Implement building placement: validate tile walkability, deduct resources, spawn entity with construction progress (0→100%), assign River Rat builder
- [ ] **Step 3:** Implement construction tick: builder near incomplete building → progress += buildRate*delta. When 100% → building activates
- [ ] **Step 4:** Implement ghost preview: when player selects building to place, show semi-transparent sprite at cursor
- [ ] **Step 5:** Run tests. Commit: `✨ feat(economy): implement building placement and construction`

---

## Task 11: Unit Training / Production Queue

**Owner:** economy-engineer
**Depends on:** Task 9, Task 10
**Files:**
- Modify: `src/systems/productionSystem.ts`

- [ ] **Step 1:** Write failing test: Barracks entity with ProductionQueue, add 'mudfoot' to queue, tick production, verify progress increments
- [ ] **Step 2:** Implement: buildings with ProductionQueue process first item. Deduct resources when queued. Progress over buildTime. When complete → spawn unit at rally point.
- [ ] **Step 3:** Implement population cap check: can't queue if currentPop >= maxPop (Burrow count × 6)
- [ ] **Step 4:** Run tests. Commit: `✨ feat(economy): implement unit training and production queue`

---

## Task 12: Yuka Pathfinding on Tile Grid

**Owner:** ai-engineer
**Files:**
- Create: `src/ai/graphBuilder.ts`, `src/ai/pathfinder.ts`, `src/ai/steeringFactory.ts`
- Test: `src/__tests__/ai/pathfinder.test.ts`

- [ ] **Step 1:** Write failing test: build graph from 10×10 tile grid with one water tile, pathfind from (0,0) to (9,9), verify path avoids water
- [ ] **Step 2:** Implement `buildGraphFromTilemap(tiles: TerrainType[][])` — create Yuka Graph, add Node per walkable tile, add Edges with terrain cost weights
- [ ] **Step 3:** Implement `findPath(graph, fromTile, toTile): Vector3[]` — Yuka AStar, return waypoint array
- [ ] **Step 4:** Run test, confirm PASS. Commit: `✨ feat(ai): implement tile-grid pathfinding with Yuka A*`
- [ ] **Step 5:** Implement path request queue: max 4 per frame, stagger across frames
- [ ] **Step 6:** Implement `createSteeringVehicle(entity, world)` — Yuka Vehicle with FollowPathBehavior + SeparationBehavior
- [ ] **Step 7:** Test steering with 10 units moving to same target. Commit: `✨ feat(ai): implement steering factory with path following + separation`

---

## Task 13: Basic Combat System

**Owner:** combat-engineer
**Depends on:** Task 4
**Files:**
- Create: `src/systems/combatSystem.ts`
- Test: `src/__tests__/systems/combatSystem.test.ts`

- [ ] **Step 1:** Write failing test: two entities (attacker + defender) within range, tick combat, verify defender Health decreases
- [ ] **Step 2:** Implement `combatSystem(world, delta)`: for each entity with Attack+Targeting relation → check range → apply damage (attack - armor, min 1) on cooldown
- [ ] **Step 3:** Implement aggro: units without Targeting auto-acquire nearest enemy within aggro range
- [ ] **Step 4:** Implement death: when Health.current <= 0 → destroy entity, spawn death particle
- [ ] **Step 5:** Write test for ranged combat: Shellcracker at range 5 attacks Gator, projectile entity spawned
- [ ] **Step 6:** Implement projectile spawning: ranged attacks create IsProjectile entity that travels to target, applies damage on arrival
- [ ] **Step 7:** Run tests. Commit: `✨ feat(combat): implement melee/ranged combat with aggro and projectiles`

---

## Task 14: Fog of War

**Owner:** phaser-engineer
**Depends on:** Task 5, Task 4
**Files:**
- Create: `src/systems/fogSystem.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1:** Create RenderTexture the size of the tilemap, filled with black
- [ ] **Step 2:** Each frame: for each friendly unit, clear a circle (vision radius) on the fog texture
- [ ] **Step 3:** Implement three-state fog: unexplored (fully black), explored (dark tint, shows terrain), visible (clear)
- [ ] **Step 4:** Store explored state in a 2D boolean array — once a tile is explored, it stays explored
- [ ] **Step 5:** Apply fog as overlay above tilemap but below HUD
- [ ] **Step 6:** Commit: `✨ feat(phaser): implement fog of war with explore/visible states`

---

## Task 15: Desktop Input System

**Owner:** ui-engineer
**Files:**
- Create: `src/input/desktopInput.ts`, `src/input/selectionManager.ts`, `src/input/commandDispatcher.ts`

- [ ] **Step 1:** Implement left-click single select: Phaser pointerdown → find entity under cursor → set Selected trait
- [ ] **Step 2:** Implement drag-select rectangle: pointerdown+move → draw Graphics rectangle → pointerup → find all friendly entities within bounds → set Selected
- [ ] **Step 3:** Implement right-click move command: if selection exists, right-click → dispatch Move order to all selected units
- [ ] **Step 4:** Implement right-click attack: right-click on enemy entity → dispatch Attack order
- [ ] **Step 5:** Implement right-click gather: right-click on resource → dispatch Gather order (workers only)
- [ ] **Step 6:** Implement WASD camera pan + scroll wheel zoom
- [ ] **Step 7:** Implement edge scrolling (mouse near screen edge → camera pans)
- [ ] **Step 8:** Commit: `✨ feat(ui): implement desktop input with select, move, attack, gather, camera`

---

## Task 16: HUD Scene

**Owner:** ui-engineer
**Depends on:** Task 5, Task 15
**Files:**
- Modify: `src/scenes/HUDScene.ts`

- [ ] **Step 1:** Implement resource bar (top): Fish/Timber/Salvage counts as Phaser BitmapText, population X/Y
- [ ] **Step 2:** Implement minimap (bottom-left): second Phaser Camera rendering tilemap at small scale + unit dots
- [ ] **Step 3:** Implement unit info panel (left): when unit selected → show portrait, HP bar, stats, name
- [ ] **Step 4:** Implement action panel (bottom): context-sensitive buttons based on selected entity type (Move, Attack, Stop, Patrol for units; Train Unit buttons for buildings)
- [ ] **Step 5:** Implement build menu: when Command Post/Barracks selected → show buildable unit/building list with costs
- [ ] **Step 6:** Commit: `✨ feat(ui): implement HUD with resources, minimap, unit panel, actions`

---

## Task 17: SQLite Persistence

**Owner:** persistence-engineer
**Files:**
- Create: `src/persistence/database.ts`, `src/persistence/migrations.ts`
- Create: `src/persistence/repos/campaignRepo.ts`, `saveRepo.ts`, `settingsRepo.ts`
- Create: `src/stores/campaignStore.ts`, `settingsStore.ts`, `gameStore.ts`
- Test: `src/__tests__/persistence/database.test.ts`

- [ ] **Step 1:** Implement `src/persistence/database.ts` — wrapper around @capacitor-community/sqlite. `initDatabase()`, `execute()`, `query()`, `close()`. Platform detection via `Capacitor.isNativePlatform()`.
- [ ] **Step 2:** Implement `src/persistence/migrations.ts` — inline SQL migrations from spec (campaign_progress, save_state, settings, unlocked_units, unlocked_buildings, research)
- [ ] **Step 3:** Implement `campaignRepo.ts` — CRUD for campaign_progress table
- [ ] **Step 4:** Implement `saveRepo.ts` — save/load game snapshots (serialize Koota world)
- [ ] **Step 5:** Implement `settingsRepo.ts` — load/save user settings
- [ ] **Step 6:** Implement Zustand stores: `campaignStore`, `settingsStore`, `gameStore` (active game state bridge)
- [ ] **Step 7:** Write tests for all repos. Commit: `✨ feat(persistence): implement SQLite persistence with repos and Zustand stores`

---

## Task 18: Scenario Scripting Engine

**Owner:** scenario-designer
**Files:**
- Create: `src/scenarios/types.ts`, `src/scenarios/engine.ts`
- Create: `src/systems/scenarioSystem.ts`
- Test: `src/__tests__/scenarios/engine.test.ts`

- [ ] **Step 1:** Define interfaces: `Scenario`, `ScenarioTrigger`, `TriggerCondition`, `TriggerAction`, `Objective`, `BriefingDefinition`
- [ ] **Step 2:** Implement trigger evaluator: check conditions (timer, unitCount, areaEntered, buildingDestroyed, objectiveComplete) each frame
- [ ] **Step 3:** Implement trigger actions: spawnUnits, showDialogue, changeWeather, spawnReinforcements, completeObjective, failMission
- [ ] **Step 4:** Implement objective tracker: track primary + bonus objectives, emit events on completion
- [ ] **Step 5:** Write test: define scenario with timer trigger → spawn enemy → verify trigger fires at correct time
- [ ] **Step 6:** Commit: `✨ feat(scenario): implement scripting engine with triggers and objectives`

---

## Task 19: Mission 1-4 Definitions

**Owner:** scenario-designer
**Depends on:** Task 18, Task 7
**Files:**
- Create: `src/scenarios/definitions/chapter1/mission01.ts` through `mission04.ts`
- Create: `src/maps/missions/mission-02-causeway.ts` through `mission-04-prison-break.ts`

- [ ] **Step 1:** Define Mission 1 (Beachhead) scenario: start with 3 River Rats, objectives: build Command Post, build Barracks, train 4 Mudfoots. Triggers: tutorial prompts, enemy scout at 5 min.
- [ ] **Step 2:** Hand-paint Mission 2 map (The Causeway): road through jungle, 3 ambush points, outpost at end
- [ ] **Step 3:** Define Mission 2 scenario: pre-built outpost, convoy spawns at edge, escort to base, ambush triggers at waypoints
- [ ] **Step 4:** Hand-paint Mission 3 map (Firebase Delta): 3 capture points in triangle, paths between
- [ ] **Step 5:** Define Mission 3 scenario: small base, 3 capture zones, hold-timer mechanics, Shellcracker unlock
- [ ] **Step 6:** Hand-paint Mission 4 map (Prison Break): enemy compound, guard patrols, infiltration routes
- [ ] **Step 7:** Define Mission 4 scenario: Sgt. Bubbles + 2 scouts, stealth mechanics, Gen. Whiskers rescue, extraction point
- [ ] **Step 8:** Commit: `✨ feat(scenario): add Chapter 1 mission definitions and maps`

---

## Task 20: Audio Engine

**Owner:** scenario-designer (or dedicated)
**Files:**
- Create: `src/audio/engine.ts`, `src/audio/sfx.ts`, `src/audio/music.ts`

- [ ] **Step 1:** Adapt existing Tone.js AudioEngine pattern from current codebase
- [ ] **Step 2:** Define SFX: click, unitSelect, unitMove, unitAttack, unitDeath, buildStart, buildComplete, resourceGather, resourceDeposit
- [ ] **Step 3:** Define music: menuTrack (ambient), combatTrack (tension), victoryStinger, defeatStinger
- [ ] **Step 4:** Wire audio triggers to game events (selection, combat, building)
- [ ] **Step 5:** Commit: `✨ feat(audio): implement Tone.js audio engine with SFX and music`

---

## Task 21: Integration & Mission 1 Playthrough

**Owner:** ALL (led by phaser-engineer)
**Depends on:** Tasks 1-20

- [ ] **Step 1:** Wire all systems into GameScene.update() loop: syncSystem → aiSystem → orderSystem → movementSystem → combatSystem → economySystem → productionSystem → fogSystem → scenarioSystem
- [ ] **Step 2:** Wire BootScene to load all compiled sprite atlases
- [ ] **Step 3:** Wire MenuScene → BriefingScene → GameScene flow with Mission 1
- [ ] **Step 4:** Play Mission 1 end-to-end: gather resources, build base, train units
- [ ] **Step 5:** Fix integration bugs (there will be many)
- [ ] **Step 6:** Wire VictoryScene when mission objectives complete
- [ ] **Step 7:** Wire save/load (PauseScene → save to SQLite, MenuScene → load from SQLite)
- [ ] **Step 8:** Play Missions 2-4 end-to-end
- [ ] **Step 9:** Commit: `✨ feat: integrate all Phase 1 systems — Missions 1-4 playable`

---

## Task 22: Testing & Polish

**Owner:** ALL

- [ ] **Step 1:** Run full test suite: `pnpm test:unit`
- [ ] **Step 2:** Add E2E test: boot → menu → start mission 1 → verify canvas renders
- [ ] **Step 3:** Run `pnpm lint` and `pnpm typecheck`, fix all errors
- [ ] **Step 4:** Commit: `✅ test: add Phase 1 E2E and unit test coverage`
- [ ] **Step 5:** Tag release: `git tag v0.2.0-phase1-complete`
