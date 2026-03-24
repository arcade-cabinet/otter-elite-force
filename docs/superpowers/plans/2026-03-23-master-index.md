# OTTER: ELITE FORCE RTS — Master Implementation Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete campaign-driven 2D RTS game across 4 phases

**Spec:** `docs/superpowers/specs/2026-03-23-rts-pivot-design.md`

**Pre-pivot baseline tag:** `v0.1.0-ddl-snapshot`

---

## Technology Stack

| Layer | Tech | Version |
|-------|------|---------|
| Platform | Capacitor | 8.x |
| Build | Vite | 7.x |
| Game + UI | Phaser | 3.90+ |
| ECS | Koota | latest |
| AI | Yuka | 0.7.x |
| State | Zustand | 5.x |
| Persistence | @capacitor-community/sqlite | 8.x |
| Audio | Tone.js | 15.x |
| Quality | Biome + Vitest + Playwright | latest |

---

## Phase Plans

| Phase | Plan Document | Deliverable | Status |
|-------|--------------|-------------|--------|
| **Phase 1: Foundation** | [phase-1-foundation.md](./2026-03-23-phase-1-foundation.md) | Playable 4-mission demo (desktop web) | Active |
| **Phase 2: Depth** | [phase-2-depth.md](./2026-03-23-phase-2-depth.md) | 8-mission game (desktop + mobile) | Planned |
| **Phase 3: Scale** | [phase-3-scale.md](./2026-03-23-phase-3-scale.md) | 12-mission game (full unit roster) | Planned |
| **Phase 4: Culmination** | [phase-4-culmination.md](./2026-03-23-phase-4-culmination.md) | Complete game + Skirmish mode | Planned |

---

## Agent Team: 10 Specialists

| # | Agent Name | Role | Phases | Primary Responsibilities |
|---|-----------|------|--------|-------------------------|
| 1 | **scaffold-architect** | Project Infrastructure | 1 | Vite+Phaser+Capacitor scaffold, deps, config, CI |
| 2 | **sprite-engineer** | Art Pipeline | 1-4 | .sprite format, parser, Vite plugin, ALL sprite art |
| 3 | **ecs-architect** | State Architecture | 1-4 | Koota traits, relations, queries, systems, world setup |
| 4 | **phaser-engineer** | Rendering & Scenes | 1-4 | Scene architecture, tilemap, fog of war, camera, particles |
| 5 | **ai-engineer** | AI & Navigation | 1-4 | Yuka pathfinding, steering, FSM, enemy AI profiles |
| 6 | **combat-engineer** | Combat & Mechanics | 1-4 | Damage model, projectiles, health, stealth, weather |
| 7 | **economy-engineer** | Economy & Production | 1-4 | Resources, gathering, buildings, training, tech tree |
| 8 | **ui-engineer** | Input & HUD | 1-4 | HUD Scene, input (desktop+mobile), minimap, selection |
| 9 | **persistence-engineer** | Data & Saves | 1-4 | SQLite, Zustand stores, save/load, campaign progress |
| 10 | **scenario-designer** | Content & Narrative | 1-4 | Scenario engine, mission definitions, maps, briefings, audio |

---

## Parallelism Strategy

### Phase 1 — 6 Independent Tracks

```
Track A (scaffold-architect + sprite-engineer):
  Project scaffold → .sprite parser → Vite plugin → sprite art assets

Track B (ecs-architect):
  Koota world + traits → Relations → Sync layer → Systems

Track C (phaser-engineer):
  Scene architecture → Tilemap → Fog of war → Camera

Track D (ai-engineer):
  Yuka graph builder → A* pathfinding → Steering → Basic FSM

Track E (persistence-engineer):
  SQLite setup → Zustand stores → Campaign schema → Save/load

Track F (economy-engineer + combat-engineer + ui-engineer + scenario-designer):
  Economy system │ Combat system │ Input/HUD │ Scenario engine
  (converge when Track A-E foundations are ready)
```

### Cross-Phase Parallelism

While Phase 1 core systems are being built, Phase 2-4 agents can work on content that doesn't require running code:
- **sprite-engineer**: Create ALL unit/building/portrait sprites for all phases
- **scenario-designer**: Design ALL 16 mission maps and scenario definitions
- **ai-engineer**: Define ALL enemy AI profiles and FSM state tables
- **combat-engineer**: Define ALL unit stat tables and balance spreadsheets

---

## File Structure (Full Project)

```
src/
├── main.ts                          # Phaser Game boot
├── config/
│   ├── game.config.ts               # Phaser.Game config
│   └── capacitor.config.ts          # Capacitor config
├── scenes/
│   ├── BootScene.ts                 # Asset loading
│   ├── MenuScene.ts                 # Campaign select
│   ├── BriefingScene.ts             # Pre-mission briefing
│   ├── GameScene.ts                 # Main RTS gameplay
│   ├── HUDScene.ts                  # Resources, minimap, actions
│   ├── PauseScene.ts                # Pause overlay
│   └── VictoryScene.ts             # Mission complete
├── ecs/
│   ├── world.ts                     # Koota world instance
│   ├── traits/
│   │   ├── identity.ts              # UnitType, Faction, IsHero, etc.
│   │   ├── spatial.ts               # Position, Velocity, FacingDirection
│   │   ├── combat.ts                # Health, Attack, Armor, VisionRadius
│   │   ├── ai.ts                    # AIState, SteeringAgent
│   │   ├── orders.ts                # OrderQueue, RallyPoint
│   │   ├── economy.ts               # Gatherer, ResourceNode, ProductionQueue
│   │   ├── stealth.ts               # Concealed, Crouching, DetectionRadius
│   │   ├── water.ts                 # CanSwim, Submerged
│   │   └── phaser.ts                # PhaserSprite (sync bridge)
│   ├── relations/
│   │   └── index.ts                 # BelongsToSquad, OwnedBy, Targeting, etc.
│   └── queries/
│       └── index.ts                 # Pre-built query factories
├── systems/
│   ├── syncSystem.ts                # Koota↔Phaser sync
│   ├── movementSystem.ts            # Position updates from Yuka
│   ├── combatSystem.ts              # Damage, projectiles, aggro
│   ├── economySystem.ts             # Gathering, deposits, income
│   ├── productionSystem.ts          # Building trains units
│   ├── fogSystem.ts                 # Fog of war updates
│   ├── aiSystem.ts                  # Yuka FSM tick
│   ├── orderSystem.ts               # Process order queue
│   ├── stealthSystem.ts             # Detection checks
│   ├── weatherSystem.ts             # Weather effects
│   ├── territorySystem.ts           # Village liberation
│   └── scenarioSystem.ts            # Trigger evaluation
├── ai/
│   ├── graphBuilder.ts              # Tilemap → Yuka Graph
│   ├── pathfinder.ts                # A* with queue/caching
│   ├── steeringFactory.ts           # Create Vehicle with behaviors
│   ├── fsm/
│   │   ├── states.ts                # Idle, Patrol, Alert, Chase, Attack, Flee
│   │   └── profiles.ts              # Per-unit-type FSM configs
│   └── goalDriven/
│       └── evaluators.ts            # Think evaluators for complex AI
├── sprites/
│   ├── compiler.ts                  # .sprite → pixel buffer
│   ├── parser.ts                    # TOML+ASCII grid parser
│   ├── atlas.ts                     # Sprite atlas generator
│   └── assets/
│       ├── units/                   # .sprite files for all units
│       ├── buildings/               # .sprite files for all buildings
│       ├── terrain/                 # .sprite files for terrain tiles
│       └── portraits/               # .sprite files for character portraits
├── maps/
│   ├── loader.ts                    # Tilemap data → Phaser Tilemap
│   └── missions/                    # Hand-painted mission maps
│       ├── mission-01-beachhead.ts
│       ├── mission-02-causeway.ts
│       └── ...
├── scenarios/
│   ├── engine.ts                    # Scenario runner + trigger evaluator
│   ├── types.ts                     # Scenario, Trigger, Objective interfaces
│   └── definitions/
│       ├── chapter1/
│       │   ├── mission01.ts
│       │   └── ...
│       └── ...
├── stores/
│   ├── campaignStore.ts             # Campaign progress, unlocks
│   ├── settingsStore.ts             # User preferences
│   └── gameStore.ts                 # Active game state bridge
├── persistence/
│   ├── database.ts                  # @capacitor-community/sqlite wrapper
│   ├── migrations.ts                # Schema migrations
│   └── repos/
│       ├── campaignRepo.ts          # Campaign CRUD
│       ├── saveRepo.ts              # Save/load game state
│       └── settingsRepo.ts          # Settings CRUD
├── audio/
│   ├── engine.ts                    # Tone.js synth engine
│   ├── sfx.ts                       # Sound effect definitions
│   └── music.ts                     # Music track generators
├── input/
│   ├── desktopInput.ts              # Mouse/keyboard handler
│   ├── mobileInput.ts               # Touch handler
│   ├── selectionManager.ts          # Unit selection logic
│   └── commandDispatcher.ts         # Translate input → orders
├── data/
│   ├── units.ts                     # Unit stat definitions
│   ├── buildings.ts                 # Building stat definitions
│   ├── research.ts                  # Tech tree definitions
│   └── factions.ts                  # Faction configs
├── utils/
│   ├── constants.ts                 # Game constants
│   └── math.ts                      # Helper math functions
└── __tests__/
    ├── ecs/                         # Trait/query/relation tests
    ├── systems/                     # System logic tests
    ├── ai/                          # Pathfinding/FSM tests
    ├── sprites/                     # Parser/compiler tests
    ├── scenarios/                   # Trigger evaluation tests
    ├── persistence/                 # Database/repo tests
    └── e2e/                         # Playwright E2E tests
```

---

## Commit Convention

All commits follow: `<emoji> <type>(<scope>): <description>`

Scopes: `scaffold`, `sprites`, `ecs`, `phaser`, `ai`, `combat`, `economy`, `ui`, `persistence`, `scenario`, `audio`, `maps`, `data`
