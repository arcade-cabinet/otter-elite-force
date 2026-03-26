---
title: Engine Rewrite Plan
description: Execution plan for migrating Otter: Elite Force to LittleJS + bitECS + SolidJS
version: 2.0.0
updated: 2026-03-26
tags: [architecture, migration, littlejs, bitecs, solidjs, review]
status: active
---

# Engine Rewrite Plan

This document is the source of truth for the engine rewrite from React + react-konva + Koota to SolidJS + LittleJS + bitECS.

It replaces the previous high-level plan with an execution-grade plan derived from:

- The live codebase in this repository
- The current rewrite target in [AGENTS.md](../AGENTS.md)
- The reference clones at:
  - `/Users/jbogaty/src/reference-codebases/bitECS`
  - `/Users/jbogaty/src/reference-codebases/LittleJS`
  - `/Users/jbogaty/src/reference-codebases/solid`

## Executive Summary

The rewrite direction is valid:

- `react-konva` is the wrong long-term rendering layer for a 60fps RTS.
- `@koota/react` creates avoidable UI coupling and reactive churn.
- A game-first runtime should own update, render, and input directly.
- SolidJS is a better fit than React for HUD and shell UI around a live game loop.
- bitECS is a better long-term ECS substrate than Koota for performance and framework independence.

The previous plan was materially under-scoped.

It was correct about the destination, but incorrect or incomplete about:

- how much of the current runtime is coupled to Koota and `@koota/react`
- how much of the HUD depends on `EventBus`
- how much migration work sits in persistence and serialization
- how much current mission/scenario behavior relies on loose string conventions
- what LittleJS does and does not provide out of the box
- what Solid migration implies for the existing React component and test surface

This rewrite is not a 6-7 day port. It is a staged engine migration with clear cutover points.

## Review Of The Previous Plan

## What It Got Right

- The core split is right: game loop/render/input in LittleJS, ECS in bitECS, shell/HUD in SolidJS.
- Scenario DSL and mission definitions are largely preservable.
- Yuka and Tone.js can remain.
- The repository already contains meaningful framework-agnostic logic in systems, scenario evaluation, mission compilation, pathfinding, and content registries.

## What It Got Wrong

### 1. bitECS migration is not a mechanical search/replace

Current code uses:

- Koota traits with both SoA-like and AoS-like payloads
- Koota relations
- entity instance methods like `.get()`, `.set()`, `.add()`, `.remove()`, `.targetsFor()`, `.id()`
- `@koota/react` hooks in UI and canvas

This means the migration is not just query syntax replacement. It requires:

- a new world API
- a new component storage strategy
- relation rewrites
- replacement of entity-instance methods everywhere
- singleton state redesign
- save/load redesign

### 2. LittleJS does not eliminate all custom input work

LittleJS gives raw input primitives:

- `engineInit`, `gameUpdate`, `gameRender`
- `mousePos`, `mousePosScreen`
- `mouseWasPressed`, `mouseIsDown`
- `keyIsDown`
- `cameraPos`, `cameraScale`

That is useful, but RTS interaction still needs custom logic for:

- hit testing against entities
- drag-box selection
- context-sensitive command dispatch
- camera constraints
- minimap click/drag translation
- multi-touch pan/zoom policy
- right-click parity on desktop vs mobile/touch

The previous plan overstated “free” mobile handling.

### 3. LittleJS does not natively understand this project’s asset formats

Current runtime uses:

- sprite atlas JSON + PNG pairs
- pre-painted terrain chunks
- ad hoc canvas composition for fog, minimap, portraits, overlays

LittleJS is optimized around:

- image preloading through `engineInit`
- `drawTile`
- grid/tile oriented sprite access
- `TileLayer` pre-rendering

That means this project needs adapters for:

- atlas JSON frame lookup
- terrain tilesheet or terrain precomposition strategy
- fog rendering
- rank emblems
- portrait rendering

The previous plan assumed “LittleJS loads these natively.” That is not true for the current atlas pipeline.

### 4. The persistence layer was omitted almost entirely

Current save/load is a major subsystem:

- [src/systems/saveLoadSystem.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/systems/saveLoadSystem.ts)
- Koota trait registry
- Koota relation serialization
- singleton serialization
- runtime-trait exclusion rules

This cannot be deferred as an afterthought. It is one of the highest-risk migration surfaces.

### 5. The plan understated the UI rewrite cost

The current UI stack includes:

- app routing in React
- `WorldProvider` from `koota/react`
- 80 `useQuery` / `useTrait` / `useWorld` hook usages
- React HUD components, command post screens, overlays, and hooks
- React-specific tests

SolidJS is a better fit, but the React surface is not “simple text + buttons.” It is a significant rewrite.

### 6. The migration order was too coarse

The old “Day 1 / Day 2 / Day 3” structure is not actionable. It did not separate:

- foundation vs first-playable vertical slice
- critical-path systems vs optional systems
- runtime cutover vs data migration
- tooling cutover vs gameplay parity
- test migration vs feature migration

## Current Codebase Audit

This section is the current-state review at macro, meso, and micro levels.

## Macro

### App Composition

The live app root is React-based:

- [src/main.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/main.tsx)
- [src/app/App.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/app/App.tsx)

Current structure:

- React root
- `WorldProvider` from `koota/react`
- screen routing via singleton ECS state
- mission briefing and result overlays in React
- `GameCanvas` as the game runtime shell

### Game Runtime

The live tactical runtime is centered on:

- [src/canvas/GameCanvas.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/GameCanvas.tsx)
- [src/systems/gameLoop.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/systems/gameLoop.ts)

It currently combines:

- Konva stage/layers
- React lifecycle
- Koota world access
- camera management
- pointer input
- scenario bootstrapping
- mission spawning
- terrain graph creation
- minimap and combat text overlays

### Quantitative Snapshot

Current repository counts:

- 31 system files under `src/systems/`
- 12 trait files under `src/ecs/traits/`
- 23 mission-related TypeScript files under `src/entities/missions/`
- 6 files directly tied to `react-konva`
- 80 `@koota/react` hook calls
- 145 `world.query(...)` call sites
- 82 `EventBus.emit(...)` call sites
- 41 `EventBus.on(...)` call sites

This is not a trivial renderer swap. It is a runtime architecture replacement.

## Meso

### Rendering Stack

Current canvas stack:

- [src/canvas/TerrainLayer.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/TerrainLayer.tsx)
- [src/canvas/EntityLayer.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/EntityLayer.tsx)
- [src/canvas/OverlayLayer.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/OverlayLayer.tsx)
- [src/canvas/FogLayer.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/FogLayer.tsx)
- [src/canvas/MinimapLayer.tsx](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/MinimapLayer.tsx)

Observations:

- Terrain is already pre-painted into chunked canvases.
- Entity rendering already performs manual culling and sorting.
- Fog is custom compositing logic, not a Konva built-in.
- Minimap is already an HTML canvas overlay, not a Konva concern.
- Overlay work is largely custom, not provided by Konva.

Conclusion:

Konva is not buying enough to justify keeping it. The decision to replace it is sound.

### Input Stack

Current input is split across:

- [src/canvas/usePointerInput.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/canvas/usePointerInput.ts)
- [src/input/gestureDetector.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/input/gestureDetector.ts)
- [src/input/selectionManager.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/input/selectionManager.ts)
- [src/input/commandDispatcher.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/input/commandDispatcher.ts)
- [src/input/minimapInput.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/input/minimapInput.ts)
- [src/input/keyboardHotkeys.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/input/keyboardHotkeys.ts)

Observations:

- The repository now contains both a complex gesture detector and a simpler POC-style pointer path.
- Selection and command logic are already mostly renderer-agnostic.
- Several input paths still directly mutate Koota arrays and traits.
- There is duplicated logic between `usePointerInput`, `SelectionManager`, and `CommandDispatcher`.

Conclusion:

Input should be consolidated during the rewrite, not merely ported.

### ECS And State

Current ECS surface:

- [src/ecs/world.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/ecs/world.ts)
- [src/ecs/traits](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/ecs/traits)
- [src/ecs/relations/index.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/ecs/relations/index.ts)
- [src/ecs/singletons.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/ecs/singletons.ts)

Observations:

- Several “traits” are variable-length AoS payloads:
  - `OrderQueue`
  - `ProductionQueue`
  - `BossUnit.phases`
  - `DialogueState.lines`
  - `CompletedResearch.ids` as `Set`
  - `NavGraphState.graph` as `Graph`
- Some traits hold runtime object references:
  - `SteeringAgent`
  - `SupplyCaravan.route`
- Current relations use Koota-specific APIs and semantics.

Conclusion:

A straight typed-array-only port is the wrong plan. The rewrite needs a mixed storage model.

### Scenario And Mission System

Current scenario layer:

- [src/scenarios/engine.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/scenarios/engine.ts)
- [src/entities/missions/dsl.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/entities/missions/dsl.ts)
- [src/entities/missions/compileMissionScenario.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/entities/missions/compileMissionScenario.ts)

Observations:

- Scenario evaluation is usefully decoupled behind `ScenarioWorldQuery`.
- That interface is worth preserving.
- The current adapter inside `GameCanvas` makes lossy assumptions:
  - `buildingTag` is treated like `UnitType`
  - entity tags are inferred from `UnitType`
  - health lookup is string-based rather than tag-index based

Conclusion:

Scenario logic is preservable, but the mission/runtime contract needs to be tightened during the rewrite.

### AI And Movement

Current AI/pathing surface:

- [src/ai/graphBuilder.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/ai/graphBuilder.ts)
- [src/systems/movementSystem.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/systems/movementSystem.ts)
- [src/systems/aiSystem.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/systems/aiSystem.ts)

Observations:

- Yuka pathing itself is portable.
- Yuka runtime references are currently stored in ECS traits.
- bitECS should not store these inside large typed-array component schemas.

Conclusion:

The rewrite should move runtime-only object references into world-owned maps keyed by entity ID.

### Persistence

Current persistence surface:

- [src/systems/saveLoadSystem.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/systems/saveLoadSystem.ts)
- [src/persistence](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/persistence)

Observations:

- save/load is deeply Koota-specific
- relation serialization depends on Koota entity objects
- singleton serialization assumes Koota trait presence
- several runtime traits are excluded by convention

Conclusion:

Persistence must be re-authored against the new world model, not patched.

### UI

Current UI surface includes:

- command post screens
- briefing overlays
- HUD
- minimap
- resource panels
- pause/result screens
- settings
- audio hooks

The current React UI is not just a shell. It is part of the game runtime.

Conclusion:

The Solid migration must be a first-class workstream with dedicated bridge architecture.

## Micro

These are the specific low-level issues the old plan missed.

### 1. Entity IDs are not enough for all current data

Current code frequently relies on entity methods and live references. Examples:

- `entity.get(...)`
- `entity.set(...)`
- `entity.has(...)`
- `entity.targetsFor(...)`
- Koota relation targets as live entity objects

bitECS removes those affordances. We need helper utilities and stricter state ownership.

### 2. Variable-length data should not be forced into typed arrays

The bitECS reference docs explicitly allow arbitrary component stores and world context data. That flexibility should be used.

Keep typed arrays for hot scalar data:

- position
- velocity
- health
- attack
- armor
- faction enum
- selection flags
- vision radius

Keep world-owned maps or AoS arrays for variable-length data:

- order queues
- production queues
- active dialogue lines
- completed research set
- Yuka object references
- convoy routes
- boss phase configs

### 3. Entity removal semantics need explicit policy

bitECS docs warn that `removeEntity()` invalidates storage differently than Koota patterns and can defer query flush behavior until subsequent queries.

The rewrite must define a removal policy:

- either immediate removal with strict no-reuse assumptions banned
- or a `PendingRemoval` tag plus end-of-frame flush

For this project, end-of-frame removal is safer.

### 4. Relations need a concrete mapping strategy

Current Koota relations:

- `OwnedBy`
- `Targeting`
- `GatheringFrom`
- `TrainingAt`
- `GarrisonedIn`
- `ConstructingAt`
- `BelongsToSquad`

bitECS relationship options are viable, but not every current relation should remain a relation.

Recommended mapping:

- `Targeting` -> bitECS exclusive relation
- `GatheringFrom` -> bitECS relation or scalar `targetEid`
- `GarrisonedIn` -> scalar `containerEid` plus indexed membership lists in world context
- `OwnedBy` -> remove as relation; use scalar faction enum instead unless ownership must target a specific entity
- `ConstructingAt` -> scalar target entity ID or relation if bidirectional queries are required
- `TrainingAt` -> probably not a relation; keep queue and production state on producer entity
- `BelongsToSquad` -> scalar squad ID or relation only if real squad entities survive the rewrite

### 5. Scenario tags need a real component

The scenario adapter currently overloads `UnitType` as a proxy for “tagged entity.”

This is not robust enough for:

- named mission-critical buildings
- escorts
- bosses
- destructible objectives
- one-off script targets

Add a dedicated tag/identity component:

- `ScriptTagPrimary`
- `ScriptTagSecondary`
- or a world-owned `entityTags: Map<string, eid>`

### 6. Terrain rendering strategy is unresolved

Current terrain is not a single LittleJS grid sheet today. It uses:

- many tile PNGs
- chunked prepaint
- terrain painter helpers

The rewrite must choose one of two paths:

1. Build a real terrain atlas compatible with LittleJS tile usage.
2. Keep terrain precomposition and render chunk canvases through a custom LittleJS-adjacent draw path.

Path 1 is cleaner long-term.
Path 2 is faster for early parity.

The plan below supports both, but the project should deliberately choose one.

### 7. Fog is not a built-in renderer feature

Current fog logic is already a game system plus a renderer overlay.

Port strategy:

- preserve fog state generation
- replace Konva compositing with custom canvas rendering in `gameRenderPost`
- keep minimap visibility generation separate

### 8. Solid will remove React-specific dependencies

Current dependency graph includes React-only packages and tests:

- `react`
- `react-dom`
- `react-konva`
- `@testing-library/react`
- React-oriented component tests
- Radix/Base UI React packages

The rewrite must explicitly decide:

- whether command post UI remains custom and lightweight
- whether to keep third-party component libraries at all

Recommended: remove React component libraries from the in-game runtime path. Use project-owned Solid components and plain CSS.

## Target Architecture

## Guiding Principles

1. The game loop owns simulation timing.
2. The ECS is framework-agnostic.
3. The renderer reads ECS state but does not own truth.
4. The UI subscribes to a narrow bridge, not the full world.
5. Runtime-only objects stay outside hot ECS component stores.
6. First playable parity matters more than premature polish.
7. Data contracts are tightened during migration, not preserved if they are weak.

## Runtime Layers

```text
SolidJS Shell
  - screen routing
  - menus, settings, campaign, overlays, HUD
  - listens to narrow game bridge signals/stores
  - emits intent events/commands back to game runtime

LittleJS Runtime
  - engineInit/gameUpdate/gameRender/gameRenderPost
  - owns input sampling, frame clock, camera, world rendering
  - drives ECS systems and render passes
  - owns tactical viewport canvas

bitECS World
  - scalar entity data in typed arrays / SoA stores
  - variable-length and runtime data in world-owned maps
  - relation utilities where actually useful

Domain Layer
  - missions
  - scenario DSL
  - content registry
  - AI/pathfinding
  - audio rules
  - persistence DTOs
```

## Revised Storage Model

## Hot Scalar Components In bitECS

Use typed-array/SoA storage for:

- `Position`
- `Velocity`
- `Facing`
- `Health`
- `Armor`
- `Attack`
- `VisionRadius`
- `FactionId`
- `UnitTypeId`
- `Selection`
- `IsBuilding`
- `IsProjectile`
- `IsResource`
- `IsHero`
- `CanSwim`
- `Submerged`
- `DetectionRadius`
- `CategoryId`
- `PopulationCost`
- `ConstructionProgress`

## Variable-Length Or Runtime Data In World Context

Use world-owned maps/objects for:

- `orderQueues: Map<eid, Order[]>`
- `productionQueues: Map<eid, ProductionEntry[]>`
- `researchSlots: Map<eid, ResearchSlot>`
- `steeringAgents: Map<eid, SteeringVehicle>`
- `bossConfigs: Map<eid, BossRuntimeConfig>`
- `dialogueState`
- `completedResearch`
- `navGraph`
- `campaignProgress`
- `userSettings`
- `objectiveState`
- `scriptTagIndex`
- `convoyRoutes`

This aligns with the bitECS docs: components can be anything, world context can hold custom data, and systems can remain plain functions.

## World Shape

Recommended world context:

```ts
type GameWorld = ReturnType<typeof createWorld<{
  time: { elapsedMs: number; deltaMs: number; tick: number };
  runtime: {
    steeringAgents: Map<number, SteeringVehicle>;
    orderQueues: Map<number, Order[]>;
    productionQueues: Map<number, ProductionEntry[]>;
    scriptTagIndex: Map<string, number>;
  };
  session: {
    currentMissionId: string | null;
    phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat";
    objectives: ObjectiveRuntimeState[];
    dialogue: DialogueRuntimeState | null;
  };
  campaign: CampaignProgressState;
  settings: UserSettingsState;
  navigation: { graph: Graph | null; width: number; height: number };
}>>;
```

This removes the need to force every singleton into a fake ECS trait.

## Library Review Notes

## bitECS

From `/Users/jbogaty/src/reference-codebases/bitECS/docs/Intro.md`:

- entities are numeric IDs
- systems are plain function pipelines
- world context can be custom data
- manual removal/recycling is recommended for control
- relations are powerful but optional

From `/Users/jbogaty/src/reference-codebases/bitECS/docs/Intro.md` and `docs/MIGRATION_GUIDE_0.4.0.md`:

- queries can use `query(world, [...])`
- `addComponent(world, eid, Component)` is the current style
- observers replace older enter/exit query patterns

Implication for this project:

- use bitECS as a toolkit, not as dogma
- keep the hot path flat
- keep complex mutable runtime data outside component arrays

## LittleJS

From `/Users/jbogaty/src/reference-codebases/LittleJS/src/engine.js`:

- `engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, imageSources, rootElement)`
- engine controls the main update/render loop

From `/Users/jbogaty/src/reference-codebases/LittleJS/FAQ.md`:

- input is sampled during update, not render
- touch is routed to mouse
- `drawTile` and `tile(...)` assume tile/spritesheet semantics
- `cameraPos` and `cameraScale` are the main camera controls
- `TileLayer` is intended for fast tile rendering after prerender

Implication for this project:

- LittleJS is a strong fit for the tactical viewport
- but asset adaptation is required
- and RTS interaction must still be authored explicitly

## SolidJS

From `/Users/jbogaty/src/reference-codebases/solid/README.md`:

- components are regular functions
- `createSignal` provides fine-grained updates
- rendering updates the real DOM directly, not via VDOM reconciliation

Implication for this project:

- Solid is a good fit for HUD, menus, overlays, and shell screens
- but the UI should consume a narrow bridge, not raw world state

## Rewrite Strategy

This rewrite should be executed as a staged cutover, not a flag day.

## Phase 0: Freeze And Instrument

Goal:

- make the current runtime measurable before migration

Tasks:

- document current FPS, memory, input defects, and bundle shape
- capture current gameplay parity expectations for Mission 1
- record screenshots/video of:
  - menu
  - campaign
  - briefing
  - Mission 1 base state
  - fog/minimap
  - combat encounter
- inventory all Koota traits/relations and their usages
- inventory all React screens and HUD components
- inventory all tests coupled to React/Konva/Koota

Exit criteria:

- baseline parity checklist exists
- baseline perf numbers exist
- migration backlog is enumerated

## Phase 1: Project Foundation

Goal:

- land the new stack without cutting over gameplay yet

Tasks:

- add `solid-js`
- add Vite Solid plugin
- add `bitecs`
- add `littlejs`
- update `tsconfig` for `jsxImportSource: "solid-js"`
- create parallel entry points:
  - `src/runtime-react-legacy/`
  - `src/runtime-solid-next/`
- decide whether transition period uses one branch or a runtime flag
- define the new world factory and world context types
- define scalar component schemas and world-owned runtime stores

Deliverables:

- new `src/engine-next/` folder exists
- app can boot into a blank Solid shell
- LittleJS can mount a blank canvas in the target container
- bitECS world can be created and ticked

Exit criteria:

- no gameplay parity required yet
- toolchain builds
- both runtimes can coexist while migration proceeds

## Phase 2: Domain Boundary Extraction

Goal:

- isolate portable domain logic from the legacy runtime

Tasks:

- move mission compilation and scenario evaluation behind stable interfaces
- define new domain-facing services:
  - `MissionLoader`
  - `ScenarioRuntime`
  - `ObjectiveRuntime`
  - `CommandService`
  - `SelectionService`
  - `NavigationService`
- replace direct `EventBus` coupling in domain systems where appropriate with:
  - explicit callbacks
  - world event queues
  - UI bridge events
- define content ID enums/tables:
  - faction IDs
  - unit IDs
  - building IDs
  - category IDs

Exit criteria:

- portable logic compiles against interfaces instead of React/Konva/Koota-specific symbols

## Phase 3: bitECS World And Component Migration

Goal:

- establish the new ECS runtime with no renderer dependency

Tasks:

- create `src/engine-next/ecs/components.ts`
- create `src/engine-next/ecs/world.ts`
- create helper APIs:
  - `spawnEntity`
  - `destroyEntity`
  - `markForRemoval`
  - `isAlive`
  - `setFaction`
  - `getOrderQueue`
  - `setSelected`
- migrate scalar traits first
- migrate world-owned singleton/runtime data
- define removal flush system
- define relation replacements and helper queries

Important decisions:

- use numeric enums for hot IDs
- preserve string IDs at content boundaries only
- keep script tags in a dedicated index
- do not store `Set`, `Graph`, or Yuka vehicles in typed arrays

Exit criteria:

- world can spawn and destroy units/buildings/resources
- scalar queries work
- command/state helpers exist

## Phase 4: Persistence Redesign

Goal:

- restore save/load and campaign continuity in the new runtime

Tasks:

- design a runtime-neutral save DTO
- separate save DTOs into:
  - entity scalar state
  - world session state
  - runtime queues and variable-length state
  - campaign progression
- replace Koota trait registry with explicit serializers
- replace Koota relation serialization with either:
  - explicit scalar foreign keys
  - explicit relation DTOs
- define excluded runtime state:
  - Yuka vehicle objects
  - transient particles
  - camera interpolation state
- rebuild post-load runtime state:
  - navigation graph references
  - steering agent runtime objects
  - caches

Deliverables:

- new save schema version
- migration policy for old saves:
  - either hard reset
  - or one-time import path

Recommended:

- hard break old mission saves
- preserve campaign/meta progress if feasible

Exit criteria:

- save during mission
- reload mission
- campaign progress persists

## Phase 5: LittleJS Runtime Shell

Goal:

- replace `GameCanvas` with a LittleJS tactical runtime shell

Tasks:

- create `engineInit` bootstrap
- mount the engine into the app shell container
- wire:
  - `gameInit`
  - `gameUpdate`
  - `gameUpdatePost`
  - `gameRender`
  - `gameRenderPost`
- define camera ownership in runtime, not UI
- define pause semantics
- define tactical viewport sizing rules

Deliverables:

- blank tactical mission boots into LittleJS canvas
- camera can move and zoom
- update loop runs independently of React

Exit criteria:

- no Konva dependency on the tactical path

## Phase 6: Rendering Migration

Goal:

- render terrain, entities, overlays, fog, and minimap in the new stack

Tasks:

### Terrain

Choose one:

1. Short-term parity:
   - preserve terrain prepaint/chunking
   - render chunk canvases in custom passes
2. Long-term target:
   - build terrain atlas
   - use LittleJS tile access + `TileLayer`

Recommended sequence:

- start with chunk prepaint parity
- move to atlas only after the game is stable

### Sprites

- build atlas adapter from current JSON atlas format to runtime frame lookup
- define animation frame resolver
- define sprite anchor/foot position rules
- define render sort by world Y
- define selection circle, HP bar, emblem, projectile rendering

### Fog

- port fog state generation
- render fog in `gameRenderPost`
- keep minimap fog separate from viewport fog

### Minimap

- keep it as a dedicated HTML canvas or Solid-owned canvas
- feed it terrain snapshot, entity dots, and camera rectangle

Exit criteria:

- Mission 1 renders terrain, units, buildings, fog, and minimap with no Konva

## Phase 7: Input Consolidation

Goal:

- replace all legacy tactical input with one coherent runtime path

Tasks:

- define canonical desktop controls
- define canonical mobile controls
- remove duplicated paths from:
  - `usePointerInput`
  - `SelectionManager`
  - `CommandDispatcher`
  - `GestureDetector`
- implement in LittleJS update loop:
  - click select
  - drag box select
  - context command
  - explicit attack/move/build modes
  - minimap camera jump
  - keyboard hotkeys
  - control groups
  - camera pan and zoom
  - mobile pan and pinch policy

Important:

- “touch maps to mouse” is not enough for good RTS UX
- pinch zoom and multi-touch pan still need explicit handling and conflict rules

Exit criteria:

- Mission 1 is fully controllable on desktop
- mobile baseline behavior is defined and testable

## Phase 8: System Migration

Goal:

- port the simulation loop in dependency order

Recommended port order:

1. clock/session state
2. order system
3. movement system
4. combat system
5. projectile/death cleanup
6. economy system
7. production/research/building
8. scenario system bridge
9. fog system
10. AI system
11. specialized mission systems

System groups:

### Core Playable

- `orderSystem`
- `movementSystem`
- `combatSystem`
- `economySystem`
- `productionSystem`
- `buildingSystem`
- `researchSystem`
- `scenarioSystem`
- `fogSystem`

### Essential But Secondary

- `aiSystem`
- `convoySystem`
- `stealthSystem`
- `detectionSystem`
- `waterSystem`
- `bossSystem`

### Mission-Specific / Advanced

- `tidalSystem`
- `fireSystem`
- `siphonSystem`
- `multiBaseSystem`
- `territorySystem`
- `waveSpawnerSystem`
- `demolitionSystem`
- `siegeSystem`
- `lootSystem`
- `encounterSystem`
- `difficultyScaling`
- `scoringSystem`

Porting rules:

- preserve behavior before optimizing
- flatten hot scalar reads/writes
- move queue-like data to world context maps
- replace entity-object APIs with helper functions
- eliminate hidden string contracts where found

Exit criteria:

- Mission 1 completes in the new engine

## Phase 9: Scenario And Mission Contract Hardening

Goal:

- make the content layer robust against runtime changes

Tasks:

- add dedicated script tag/index support
- formalize how scenario actions address runtime entities
- formalize how scenario world queries inspect:
  - unit counts
  - building counts
  - health thresholds
  - objective status
  - resource thresholds
- define mission boot pipeline:
  - load mission data
  - spawn placements
  - register script tags
  - build terrain/navigation
  - initialize objectives
  - start scenario engine

Exit criteria:

- mission scripts no longer depend on accidental `UnitType === tag` behavior

## Phase 10: Solid Shell Migration

Goal:

- replace React screens and HUD with SolidJS

Tasks:

### Routing And Shell

- main menu
- campaign view
- settings
- skirmish setup/result
- pause and mission result overlays

### Tactical HUD

- resource bar
- selection panel
- action/build panel
- alert banner
- mission objectives
- boss health
- error feedback
- command transmissions
- briefing dialogue

### Bridge Design

Do not expose the whole ECS world to Solid.

Create a narrow bridge module:

```ts
type GameBridge = {
  screen: Accessor<AppScreen>;
  resources: Accessor<ResourceViewModel>;
  population: Accessor<PopulationViewModel>;
  selection: Accessor<SelectionViewModel | null>;
  objectives: Accessor<ObjectiveViewModel[]>;
  alerts: Accessor<AlertViewModel[]>;
  dialogue: Accessor<DialogueViewModel | null>;
  emit: {
    resume(): void;
    pause(): void;
    startBuild(buildingId: string): void;
    queueUnit(unitId: string): void;
    issueResearch(researchId: string): void;
    saveGame(): void;
  };
}
```

Recommended Solid primitives:

- `createSignal` for focused view models
- `createMemo` for derived display state
- `batch` for grouped updates after each tick
- `Show` / `For` in UI lists and overlays

Exit criteria:

- React no longer owns routing or HUD for the target runtime

## Phase 11: Audio And Event Model Migration

Goal:

- keep Tone.js, remove React-specific audio wiring

Tasks:

- keep [src/audio/engine.ts](/Users/jbogaty/src/arcade-cabinet/otter-elite-force/src/audio/engine.ts) domain logic where possible
- replace React hook coupling:
  - `useAudioUnlock`
  - `useMusicWiring`
  - `useAudioSettings`
- decide event transport:
  - keep `EventBus` temporarily
  - or replace with typed world event queue

Recommended:

- keep `EventBus` temporarily as a migration shim
- replace with typed event queues after gameplay parity

Exit criteria:

- music, SFX, and audio unlock work in the new shell

## Phase 12: Test Migration

Goal:

- restore confidence without blocking on full UI parity

Tasks:

### Preserve First

- pure domain tests
- mission compiler tests
- scenario tests
- AI/pathfinding tests
- economy/combat spec tests

### Migrate Next

- Koota-dependent system tests to bitECS fixtures
- React component tests to Solid component tests or view-model tests
- bundle audit expectations

### Replace

- renderer tests that assume Konva
- input tests that assume React event wrappers

Recommended testing split:

- Layer 1: pure domain and scenario logic
- Layer 2: ECS/system tests on bitECS fixture worlds
- Layer 3: runtime integration tests for mission boot and completion
- Layer 4: browser/tactical interaction smoke tests

Exit criteria:

- Mission 1 integration test passes in the new runtime
- core domain specs pass

## Phase 13: Cutover And Deletion

Goal:

- remove the legacy runtime once parity is acceptable

Tasks:

- delete React tactical runtime files
- delete Koota world/traits/relations runtime path
- delete Konva renderer path
- delete obsolete hooks and adapters
- remove dead dependencies from `package.json`
- remove or rewrite legacy tests
- update architecture docs and contribution docs

Exit criteria:

- one runtime path remains
- no legacy renderer/ECS packages remain in prod dependencies

## Implementation Backlog

## Workstreams

### Workstream A: ECS/Foundation

- new world factory
- component definitions
- runtime stores
- entity helper layer
- removal lifecycle
- serialization DTOs

### Workstream B: Tactical Runtime

- LittleJS bootstrap
- camera
- update loop
- render passes
- input
- mission boot

### Workstream C: Domain Port

- system migration
- scenario adapter
- mission contract hardening
- AI/runtime maps

### Workstream D: UI/Shell

- Solid boot
- routing
- overlays
- HUD
- settings/campaign

### Workstream E: Validation

- test migration
- mission parity checks
- performance checks
- mobile checks

## Suggested Milestones

### Milestone 1: Blank Next Runtime

- Solid shell boots
- LittleJS canvas mounts
- bitECS world ticks

### Milestone 2: First Battlefield Render

- Mission terrain renders
- units/buildings render
- camera works

### Milestone 3: First Controllable Slice

- select units
- move units
- combat works
- fog works

### Milestone 4: Mission 1 Complete

- full Mission 1 playable start to finish

### Milestone 5: Campaign Shell

- menu/campaign/settings/briefing/result all on Solid

### Milestone 6: Save/Load Restored

- mid-mission saves work
- campaign progress persists

### Milestone 7: Legacy Runtime Removed

- React/Konva/Koota runtime path deleted

## Risk Register

| Risk | Why It Matters | Mitigation |
|------|----------------|------------|
| Terrain asset pipeline does not fit LittleJS tile assumptions | Can stall renderer migration | Start with chunk-prepaint parity, atlas later |
| Save/load rewrite becomes a hidden project inside the project | High code volume and failure impact | Design DTOs early in Phase 4, do not defer |
| bitECS over-normalization makes code worse | Variable-length data does not belong in hot arrays | Use mixed storage model intentionally |
| Scenario tags remain weak | Mission scripting breaks silently | Add dedicated script tag/index support |
| UI bridge leaks whole world state into Solid | Recreates coupling in a new framework | Use narrow derived view models only |
| Input regressions on mobile | RTS controls are fragile | Define explicit mobile control policy and smoke tests |
| Test suite collapses during migration | Confidence disappears | Preserve domain tests first, rebuild integration tests around new runtime |
| Yuka runtime refs become unstable after load/removal | Movement/AI bugs | Runtime map ownership + post-load reconstruction |

## Non-Goals

These are explicitly out of scope for the engine rewrite unless required for parity:

- redesigning campaign content
- changing mission design
- replacing Yuka
- replacing Tone.js
- adding multiplayer
- adding rollback/netcode
- adding full editor tooling
- polishing visuals beyond parity before stable gameplay exists

## Done Criteria

The rewrite is complete only when all of the following are true:

1. Tactical gameplay runs on LittleJS, not Konva.
2. ECS runtime uses bitECS, not Koota.
3. Shell/HUD runs on SolidJS, not React.
4. Mission 1 is fully playable and completable.
5. Save/load and campaign progression work in the new runtime.
6. Core tests pass in the new architecture.
7. React/Konva/Koota are removed from production runtime dependencies.
8. The team can add a new mission trigger, unit tweak, and HUD element without touching legacy code.

## Immediate Next Actions

The next concrete steps are:

1. Create `src/engine-next/` with world factory, component schema, and runtime context types.
2. Add Solid + LittleJS + bitECS to the build without cutting over the existing app.
3. Write the new save/runtime data model before porting systems.
4. Build a Mission 1-only bootstrap in the new runtime.
5. Port the minimum viable loop: spawn, render, select, move, combat, objectives, fog.

Only after that should the rewrite branch expand to full UI parity and the long tail of systems.
