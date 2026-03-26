# PRD: Otter Elite Force — Full Engine Rewrite

## Overview

Migrate the Otter: Elite Force runtime from React+Konva+Koota to SolidJS+LittleJS+bitECS per docs/engine-rewrite-plan.md v3.0. The foundation layer (Milestone A) is complete. This PRD covers everything from current state through Milestone G (legacy deletion).

## Current State

- **Done:** src/engine/ foundation (GameWorld, bitECS components, seed, persistence, diagnostics, bridge, littlejsRuntime Canvas2D, RuntimeHost, session bootstrap)
- **Done:** Old Konva canvas layers deleted
- **Not done:** 100 files still import Koota, 29 .tsx files still use React, 0 SolidJS components, 31 systems not ported, no sprite/terrain rendering, no fog, SolidJS shell 0%

## Goals

1. All tactical gameplay runs on LittleJS (or Canvas2D via LittleJS runtime)
2. All ECS state uses bitECS + world-owned stores, zero Koota at runtime
3. All shell/HUD runs on SolidJS, zero React at runtime
4. All 16 missions playable and polished
5. Persistence via Capacitor SQLite
6. Deterministic visual/browser/device tests pass
7. React, React-DOM, React-Konva, Koota, @koota/react removed from prod deps

## Out of Scope

- Multiplayer/netcode
- Full editor tooling
- Replacing Yuka or Tone.js
- Redesigning campaign content or mission designs
- iOS ship (architecture must be viable, not shipped)

## Success Criteria

- `pnpm build` produces zero legacy framework imports
- `pnpm test` passes all suites
- Mission 1 through 16 complete start-to-finish in browser
- Campaign save/load roundtrip works
- Skirmish mode boots with seed replay
- Android APK boots via Capacitor
- Diagnostics JSON emitted per run

---

## User Stories

### Milestone B: Harness Completion

#### US-B01: Skirmish runtime sandbox
As a developer, I want a skirmish mode that boots a minimal battlefield with deterministic seed so I can test systems in isolation.
Acceptance Criteria:
- Skirmish config specifies seed, map size, faction placement
- Skirmish session boots GameWorld with entities from config
- Systems pipeline runs in skirmish mode
- Diagnostics snapshot emitted on skirmish completion
- Seed replay produces identical entity state

#### US-B02: Vitest browser visual capture harness
As a developer, I want deterministic visual snapshot tests so I can catch rendering regressions.
Acceptance Criteria:
- Vitest browser test boots a skirmish session
- Captures canvas screenshot at tick 0, tick 60, tick 300
- Compares against baseline images
- Fails on pixel diff above threshold
- Runs in CI

---

### Milestone C: Vertical Slice (Mission 1 Playable)

#### US-C01: Port core systems to GameWorld
As a developer, I want movement, combat, economy, production, fog, and AI systems reading/writing GameWorld so the game loop actually simulates.
Acceptance Criteria:
- src/engine/systems/ contains: movementSystem, combatSystem, economySystem, productionSystem, fogSystem, aiSystem, orderSystem
- Each system is a pure function taking GameWorld
- Movement uses order queue, moves toward target at speed per tick
- Combat finds nearest enemy in range, applies damage, marks dead for removal
- Economy: workers near resources increment world.session.resources
- Production: buildings advance queue progress, spawn units at 100%
- Fog: maintains Uint8Array grid, marks tiles around player entities as visible
- AI: enemy entities with no orders seek nearest player entity in detection range
- flushRemovals called at end of pipeline
- Unit tests for each system pass

#### US-C02: Mission bootstrap pipeline
As a developer, I want a bootstrapMission(world, missionId) function that loads a mission definition and seeds the GameWorld with all placements, resources, objectives, terrain dimensions, and script tags.
Acceptance Criteria:
- Reads mission from registry by ID
- Spawns all placements via spawnUnit/spawnBuilding/spawnResource
- Sets world.session.resources to mission starting values
- Sets world.navigation.width/height from mission map size
- Registers scriptId tags for named entities
- Sets initial objectives on world.session.objectives
- Sets world.session.phase to "playing"
- Test: bootstrap Mission 1, verify entity count and positions

#### US-C03: System pipeline wired into runtime loop
As a developer, I want the tick() function to run all gameplay systems each frame so entities actually move, fight, gather, and die.
Acceptance Criteria:
- RuntimeHost creates system pipeline alongside mission flow
- onTick callback runs: mission flow step → system pipeline step
- Entities move toward targets each frame
- Combat resolves, dead entities removed
- Resources accumulate from gathering
- Bridge state updates reflect live game state

#### US-C04: Terrain tile rendering
As a developer, I want the tactical canvas to render actual Kenney tiles instead of grid lines so terrain is visible.
Acceptance Criteria:
- Tile images loaded from public/assets/tiles/
- Terrain grid rendered at 32x32 per cell with camera offset/zoom
- Viewport culling (only visible tiles drawn)
- Basic terrain types render: grass, water, sand, forest, dirt, stone
- Chunks pre-rendered to offscreen canvases for performance

#### US-C05: Sprite atlas entity rendering
As a developer, I want entities rendered with their actual sprite atlas frames instead of colored shapes.
Acceptance Criteria:
- Sprite atlas JSON+PNG loaded per animal type
- Entity type maps to correct atlas
- Sprites rendered at correct position, sorted by Y for depth
- Animation frames cycle based on tick
- Selection circles, HP bars rendered on top
- Fallback to current shapes if atlas not loaded

#### US-C06: Fog of war rendering
As a developer, I want fog of war drawn as an overlay on the tactical canvas.
Acceptance Criteria:
- Unexplored tiles render as black
- Explored (previously seen) tiles render at 50% opacity dark
- Visible tiles render transparent
- Fog aligns to 32x32 grid with camera offset
- Entities hidden by fog are not rendered
- Minimap reflects fog state

#### US-C07: Save/load roundtrip on new runtime
As a developer, I want mid-mission save and load to work via SQLite persistence so progress is not lost.
Acceptance Criteria:
- Save serializes: all entity scalar state, world session, runtime queues, campaign progress
- Load reconstructs GameWorld from save data
- Runtime-only objects (Yuka vehicles, nav graph) reconstructed after load
- Mission continues from saved tick
- Test: save at tick 100, load, verify entity positions match

#### US-C08: Input consolidation (desktop + mobile)
As a developer, I want one coherent input path for both desktop and mobile so all RTS interactions work on both.
Acceptance Criteria:
- Desktop: left-click select, drag-box select, right-click move/attack, right-drag pan, scroll zoom, keyboard hotkeys
- Mobile: tap select/move, long-press drag-select, two-finger pan, pinch zoom
- Minimap click/drag jumps camera
- Context-sensitive commands (attack enemy, gather resource, enter building)
- No edge scroll, no keyboard-only flows
- Control groups (Ctrl+1..9 assign, 1..9 recall)

---

### Milestone D: Mechanic Coverage

#### US-D01: Port secondary systems
As a developer, I want stealth, detection, water, boss, convoy, wave spawner, weather systems ported to GameWorld.
Acceptance Criteria:
- src/engine/systems/ contains: stealthSystem, detectionSystem, waterSystem, bossSystem, convoySystem, waveSpawnerSystem, weatherSystem
- Each is a pure function on GameWorld
- Unit tests pass for each

#### US-D02: Port mission-specific systems
As a developer, I want tidal, fire, siphon, multiBase, territory, demolition, siege, loot, encounter, difficultyScaling, scoring systems ported.
Acceptance Criteria:
- src/engine/systems/ contains all 11 mission-specific systems
- Each operates on GameWorld
- Unit tests pass

#### US-D03: Chapter 1 missions (1-4) playable
As a player, I want Missions 1-4 to boot, play through, and complete on the new runtime.
Acceptance Criteria:
- Each mission: bootstrap loads placements, triggers fire, objectives track, victory/defeat resolves
- Tested: boot → play → complete for each mission

#### US-D04: Chapter 2 missions (5-8) playable
As a player, I want Missions 5-8 playable with their chapter-specific mechanics (monsoon, river, underwater, canopy).
Acceptance Criteria:
- Weather system active for monsoon mission
- Water/tidal mechanics work for river/underwater missions
- Stealth/canopy mechanics work for dense canopy mission

#### US-D05: Chapter 3 missions (9-12) playable
As a player, I want Missions 9-12 playable with fire, entrenchment, rescue, siphon mechanics.
Acceptance Criteria:
- Fire spread system works
- Siege/entrenchment mechanics work
- Rescue/escort objectives track correctly
- Siphon mechanic operational

#### US-D06: Chapter 4 missions (13-16) playable
As a player, I want Missions 13-16 playable including the final boss encounter.
Acceptance Criteria:
- Multi-base system works for great siphon
- Iron delta fortress assault works
- Boss system works for serpent lair
- Final stand escalation and victory condition works

---

### Milestone E: Campaign Complete

#### US-E01: Campaign flow end-to-end
As a player, I want to start a new campaign, play missions in order, see briefings, track progress, and reach the ending.
Acceptance Criteria:
- Main menu → New Campaign → Mission 1 briefing → play → victory → Mission 2 briefing → ...
- Campaign progress persists to SQLite
- Mission unlock progression works
- Star ratings recorded per mission
- Campaign completion screen after Mission 16

#### US-E02: Skirmish mode fully functional
As a player, I want skirmish mode with configurable seed, map, factions, and difficulty.
Acceptance Criteria:
- Skirmish setup screen works (seed input, shuffle, faction select, map size, difficulty)
- Skirmish session boots and plays
- Skirmish result screen shows stats
- Skirmish setup persists to SQLite
- Seed replay produces deterministic results

---

### Milestone F: SolidJS Shell + Polish

#### US-F01: SolidJS app root and routing
As a developer, I want the app root to be SolidJS with screen routing so React is no longer the shell.
Acceptance Criteria:
- src/main.tsx renders Solid root, not React root
- Screen routing via Solid (main menu, campaign, settings, skirmish, game, briefing, result)
- No React imports in the routing path

#### US-F02: SolidJS main menu and campaign view
As a player, I want the main menu and campaign selection to be SolidJS components.
Acceptance Criteria:
- MainMenu.tsx → Solid component
- CampaignView.tsx → Solid component
- Mission selection, difficulty, new game flow all work

#### US-F03: SolidJS settings and skirmish setup
As a player, I want settings and skirmish setup as Solid components.
Acceptance Criteria:
- SettingsPanel → Solid with audio/visual/accessibility controls
- SkirmishSetup → Solid with seed/faction/map/difficulty config
- Persist settings to SQLite

#### US-F04: SolidJS briefing and result overlays
As a player, I want mission briefing, pause, and result screens as Solid overlays.
Acceptance Criteria:
- BriefingOverlay → Solid (commander portrait, mission description, deploy button)
- PauseOverlay → Solid (resume, settings, quit)
- MissionResult → Solid (victory/defeat, star rating, next mission)
- SkirmishResult → Solid (stats, replay seed, rematch)

#### US-F05: SolidJS tactical HUD
As a player, I want the in-game HUD (resources, selection, actions, alerts, objectives) as Solid components reading from GameBridge.
Acceptance Criteria:
- ResourceBar → Solid (fish, timber, salvage, population)
- UnitPanel/SelectionPanel → Solid (selected entity info, actions)
- ActionBar/BuildMenu → Solid (build options, action buttons)
- AlertBanner → Solid (tactical alerts)
- ObjectivesPanel → Solid (mission objectives with status)
- BossHealthBar → Solid
- CommandTransmissionPanel → Solid (dialogue lines)
- ErrorFeedback → Solid

#### US-F06: GameBridge with Solid signals
As a developer, I want GameBridge to use Solid signals/stores so HUD updates are fine-grained and efficient.
Acceptance Criteria:
- GameBridge exposes createSignal/createStore-based accessors
- HUD components subscribe to specific bridge signals
- No polling interval — reactive updates from game loop
- Bridge publishes at end of each tick via batch()

#### US-F07: SolidJS mobile components
As a player on mobile, I want touch-optimized command buttons, radial menu, and squad tabs.
Acceptance Criteria:
- CommandButtons → Solid (large tap targets)
- RadialMenu → Solid (context actions on long-press)
- SquadTabs → Solid (unit group switching)
- Layout adapts by form factor (phone vs tablet vs desktop)

#### US-F08: Audio migration from React hooks
As a developer, I want audio (Tone.js) wired without React hooks.
Acceptance Criteria:
- Remove useAudioUnlock, useMusicWiring, useAudioSettings React hooks
- Audio unlock triggers from Solid lifecycle or runtime event
- Music/SFX controlled via world events or bridge emit
- Settings control volume via bridge

#### US-F09: Polish pass — all 16 missions
As a player, I want all 16 missions polished: pacing, readability, audio cues, fog/minimap clarity, balance.
Acceptance Criteria:
- Each mission reviewed against its design doc
- Dialogue triggers at correct moments
- Audio cues for combat, alerts, objectives
- Fog and minimap readable
- Balance passes via diagnostics-driven tuning

---

### Milestone G: Cutover and Deletion

#### US-G01: Delete legacy React runtime
As a developer, I want all React components, hooks, and React-specific code deleted.
Acceptance Criteria:
- Delete src/ui/ (all React HUD/briefing/command-post/mobile components)
- Delete src/app/App.tsx React root
- Delete src/main.tsx React entry
- Delete React-specific hooks (useAudioUnlock, useMusicWiring, etc.)
- Remove react, react-dom from package.json dependencies

#### US-G02: Delete legacy Koota runtime
As a developer, I want all Koota ECS code deleted.
Acceptance Criteria:
- Delete src/ecs/world.ts, src/ecs/traits/, src/ecs/relations/, src/ecs/queries/
- Delete src/ecs/singletons.ts
- Delete src/systems/ (old Koota-based systems, replaced by src/engine/systems/)
- Remove koota, @koota/react from package.json

#### US-G03: Delete legacy Konva code
As a developer, I want any remaining Konva references deleted.
Acceptance Criteria:
- Remove react-konva from package.json
- Grep confirms zero imports of react-konva or konva
- Remove any Konva type references

#### US-G04: Test migration complete
As a developer, I want all tests ported from Koota/React fixtures to bitECS/Solid fixtures.
Acceptance Criteria:
- All src/__tests__/systems/ tests rewritten against GameWorld
- All src/__tests__/ecs/ tests rewritten against bitECS components
- All src/__tests__/specs/ui/ tests rewritten for Solid
- React Testing Library removed from deps
- All tests pass: pnpm test

#### US-G05: Visual regression and device tests
As a developer, I want visual regression tests and Maestro device tests passing.
Acceptance Criteria:
- Vitest browser: canvas snapshots for Mission 1 at key ticks
- Playwright: campaign flow E2E, responsive checks
- Maestro: Android skirmish launch, tap-select-move flow
- CI runs all three layers

#### US-G06: Diagnostics fully operational
As a developer, I want diagnostics JSON emitted per mission/skirmish run with macro/meso/micro data.
Acceptance Criteria:
- Run metadata (mission, seed, tick, duration)
- Objective transitions logged
- Encounter/wave/loot outcomes logged
- Performance counters (FPS, frame time, system time)
- Pathfinding anomalies (stuck units, boundary violations)
- Persisted to SQLite diagnostic_snapshot table

#### US-G07: Documentation updated to final state
As a developer, I want all docs reflecting only the new stack.
Acceptance Criteria:
- CLAUDE.md, AGENTS.md reference only SolidJS/LittleJS/bitECS
- Architecture docs updated
- No references to React, Konva, or Koota in active docs
- CONTRIBUTING.md updated for new dev workflow

#### US-G08: Clean dependency graph
As a developer, I want the production dependency graph free of legacy frameworks.
Acceptance Criteria:
- pnpm build succeeds
- Bundle audit: no react, react-dom, react-konva, konva, koota, @koota/react in prod chunks
- package.json: legacy deps removed or moved to devDependencies only if needed for test migration tooling
- pnpm test passes with clean deps
