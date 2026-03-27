# Comprehensive Analysis: Otter Elite Force

Generated 2026-03-27. Three-dimensional audit: gaps vs design docs, wiring of existing code, and integration path verification.

---

## Part 1: Gap Analysis

### 1.1 Unit Registry vs Design Docs

| Unit (Lore/Balance) | In Registry? | Stat Accuracy | Trainable at Runtime? |
|---|---|---|---|
| River Rat (worker) | Yes (`river_rat`) | Matches balance doc | No (production system not visible in HUD, no barracks selection) |
| Mudfoot (infantry) | Yes (`mudfoot`) | Matches | No |
| Shellcracker (heavy ranged) | Yes (`shellcracker`) | Matches | No |
| Sapper (engineer) | Yes (`sapper`) | Matches | No |
| Raftsman (water transport) | Yes (`raftsman`) | Matches | No |
| Mortar Otter (artillery) | Yes (`mortar_otter`) | Matches | No |
| Diver (stealth/water) | Yes (`diver`) | Matches | No |
| Skink (SG scout) | Yes (`skink`) | Matches | N/A (enemy) |
| Gator (SG infantry) | Yes (`gator`) | Matches | N/A |
| Viper (SG ranged) | Yes (`viper`) | Matches | N/A |
| Snapper (SG heavy) | Yes (`snapper`) | Matches | N/A |
| Scout Lizard (SG recon) | Yes (`scout_lizard`) | Matches | N/A |
| Croc Champion (SG elite) | Yes (`croc_champion`) | Matches | N/A |
| Siphon Drone (SG tech) | Yes (`siphon_drone`) | Matches | N/A |
| Serpent King (SG boss) | Yes (`serpent_king`) | Matches | N/A |

**Summary:** All 15 units are defined. None are trainable through the UI at runtime (the production system runs internally but the HUD cannot trigger unit training for most buildings because the SelectionPanel's affordability check is a no-op: `props.bridge.resources.fish >= 0` always returns true).

### 1.2 Building Registry vs Design Docs

| Building (Balance Doc) | In Registry? | Cost Match? | Buildable? |
|---|---|---|---|
| Lodge (pre-placed) | Aliased to `burrow` | N/A | Pre-placed only |
| Burrow (+6 pop) | Yes | Yes | No (build placement broken) |
| Command Post | Yes | Costs differ: BuildMenu says T400/S200, balance doc says F200/T100 | No |
| Barracks | Yes | BuildMenu says T200, balance doc says F150/T75 | No |
| Fish Trap | Yes | BuildMenu says T80, balance doc says T100 | No |
| Watchtower | Yes | BuildMenu says T150/S50, balance doc says F100/T75/S25 | No |
| Sandbag Wall | Yes | BuildMenu says T50, balance doc says T50 | No |
| Stone Wall | Yes (in entities) | Matches | Missing from BuildMenu |
| Armory | Yes | BuildMenu says T250/S150, balance doc says F200/T100/S75 | No |
| Gun Tower | Yes (in entities) | Matches | Missing from BuildMenu |
| Field Hospital | Yes | BuildMenu says T200/S100, balance doc says F250/T100 | No |
| Dock | Yes | BuildMenu says T300/S100, balance doc says F200/T150/S50 | No |
| Minefield | Yes (in entities) | Matches | Missing from BuildMenu |
| Shield Generator | Yes (SG entity) | Matches | Missing from BuildMenu |

**Critical Issue:** BuildMenu uses hardcoded `DEFAULT_BUILD_OPTIONS` with costs that do NOT match the canonical balance doc values. The `data/buildings.ts` definitions may also differ. Additionally, Stone Wall, Gun Tower, Minefield, and Shield Generator are missing from the build palette entirely.

**Build Placement is Broken:** `commandProcessor.ts` emits an `enter-build-mode` event when the player clicks Build, but `tacticalRuntime.ts` does NOT handle this event. The build flow dead-ends.

### 1.3 Hero Registry vs Design Docs

| Hero (Lore) | In Registry? | Stats Match Balance Doc? | Abilities Implemented? |
|---|---|---|---|
| Cpl. Splash | Yes (`cpl_splash`) | Needs verification | Sonar Reveal: Not wired |
| Sgt. Fang | Yes (`sgt_fang`) | Needs verification | Breach Charge: abilitySystem exists but no UI trigger |
| Col. Bubbles | Yes (`col_bubbles`, aliased from `sgt_bubbles`) | Needs verification | Rally Cry: abilitySystem exists but no UI trigger |
| Gen. Whiskers | Yes (`gen_whiskers`) | Needs verification | No special ability defined in lore |
| Medic Marina | Yes (`medic_marina`) | Needs verification | Heal: No UI trigger |
| Pvt. Muskrat | Yes (`pvt_muskrat`) | Needs verification | Demolitions: No UI trigger |

### 1.4 Research Tree vs Design Docs

| Research (Balance Doc) | In researchSystem.ts? | In entities/research.ts? | Can Be Queued? | Effect Applied? |
|---|---|---|---|---|
| Hardshell Armor (+15 HP, +1 armor melee) | Yes (but +20 HP in system) | Needs check | Yes via commandProcessor | Stat mismatch: system says +20 HP, balance doc says +15 HP +1 armor |
| Fish Oil Arrows (+2 dmg Shellcracker) | Yes (but +3 dmg in system) | Needs check | Yes | Stat mismatch: system says +3, balance doc says +2 |
| Demolition Training (+45 Sapper breach) | Yes (+50% in system) | Needs check | Yes | Approximate match |
| Fortified Walls (wall HP boost) | Yes (passive unlock) | Needs check | Yes | Passive check only |
| Precision Bombardment (-30% scatter) | Yes (gun_emplacements/mortar_precision) | Needs check | Yes | Names don't match doc |
| Advanced Fishing (+2 fish/10s) | Not in researchSystem.ts | Unknown | No | MISSING from system |
| Rapid Construction (-25% build time) | Not in researchSystem.ts | Unknown | No | MISSING from system |
| Field Triage (+50% heal rate) | Not in researchSystem.ts | Unknown | No | MISSING from system |

**Summary:** 3 of 8 research items from the balance doc are missing from the engine's research system. The existing ones have stat mismatches with the canonical balance doc.

### 1.5 Mission Mechanic Coverage

| Mission | Key Mechanic | System Exists? | In Pipeline? | Wired to Mission? |
|---|---|---|---|---|
| M1 Beachhead | Tutorial prompts, bridge repair | TutorialOverlay exists | N/A (UI) | TutorialOverlay renders but not tested |
| M2 Causeway | Convoy escort (waypoints) | convoySystem.ts exists | **NOT in pipeline** | Scenario DSL supports convoy triggers |
| M3 Firebase Delta | Capture-hold zones | territorySystem.ts | Yes | Zone counting works in worldQuery |
| M4 Prison Break | Stealth, alarm, detection cones | stealthSystem.ts, detectionSystem.ts | Detection: yes. Stealth: **NOT in pipeline** | Partial |
| M5 Siphon Valley | Destructible siphons, toxic terrain | siphonSystem.ts | **NOT in pipeline** | Not wired |
| M6 Monsoon Ambush | Weather progression, wave defense | weatherSystem.ts, waveSpawnerSystem.ts | **NEITHER in pipeline** | Weather changes via scenario actions, but weatherSystem effects don't run |
| M7 River Rats | Naval interdiction, barges | waterSystem.ts | **NOT in pipeline** | Not wired |
| M8 Underwater Cache | Underwater visibility | waterSystem.ts | **NOT in pipeline** | Not wired |
| M9 Dense Canopy | Dense fog, intel markers | fogSystem (yes), intel-marker resource (yes) | Fog: yes | Partial |
| M10 Scorched Earth | Fire spread, fuel tanks | fireSystem.ts | Yes | Fire system exists and is in pipeline |
| M11 Entrenchment | Tidal terrain changes | tidalSystem.ts | Yes | In pipeline |
| M12 Fang Rescue | Hero rescue, breach charges | abilitySystem.ts | Yes | Ability system in pipeline |
| M13 Great Siphon | Multi-section mega-structure | siegeSystem.ts | **NOT in pipeline** | Not wired |
| M14 Iron Delta | Amphibious assault | waterSystem.ts | **NOT in pipeline** | Not wired |
| M15 Serpent's Lair | Boss fight, 3 phases | bossSystem.ts | **NOT in pipeline** | bossConfigs stored but bossSystem not ticked |
| M16 The Reckoning | 10-wave defense + counterattack | waveSpawnerSystem.ts | **NOT in pipeline** | Not wired |

**Systems that EXIST but are NOT in runAllSystems():**
1. `bossSystem.ts` -- boss phase transitions, AoE, summons
2. `convoySystem.ts` -- escort waypoint movement
3. `weatherSystem.ts` -- rain/monsoon gameplay effects
4. `waveSpawnerSystem.ts` -- timed wave spawning
5. `waterSystem.ts` -- water movement bonuses, drowning
6. `stealthSystem.ts` -- stealth break on attack
7. `siphonSystem.ts` -- siphon resource drain
8. `siegeSystem.ts` -- siege damage to buildings
9. `scoringSystem.ts` -- star rating calculation
10. `difficultyScalingSystem.ts` -- difficulty multipliers
11. `demolitionSystem.ts` -- breach charge mechanics

**This means 11 systems are written but will never execute.** They are dead code at runtime.

### 1.6 Audio Design Coverage

| SFX (audio-design.md) | Defined in engine? | Called at Runtime? |
|---|---|---|
| click (UI) | Yes in sfx.ts | No (no screen calls it) |
| unit_select | Yes | No |
| unit_deselect | Yes | No |
| error (invalid action) | Yes | No |
| move_order | Mapped as "unitMove" in commandProcessor | Yes (commandProcessor calls playSfx) |
| attack_order | Mapped as "unitAttack" | Yes (commandProcessor calls playSfx) |
| melee_hit | Yes in sfxBridge | Only if sfxBridge installed AND EventBus fires |
| ranged_fire | Yes in sfxBridge | Only if EventBus fires |
| unit_death | Yes in sfxBridge | Only if EventBus fires |
| building_place | Mapped as "buildStart" | Yes (commandProcessor) |
| building_complete | Yes in sfxBridge | Only if EventBus fires |
| resource_gather | Yes in sfxBridge | Only if EventBus fires |
| resource_deposit | Yes in sfxBridge | Only if EventBus fires |
| alert | Yes in sfxBridge | Only if EventBus fires |
| victory | Yes | No explicit call |
| defeat | Yes | No explicit call |
| rain_ambient | Yes | No |
| monsoon_ambient | Yes | No |
| siphon_hum | Yes | No |
| Menu music | Yes (playMenuMusic) | No screen calls it |
| Combat music | Yes (playBattleMusic) | No combat system calls it |
| Briefing music | Yes (playBriefingMusic) | BriefingOverlay does NOT call it |

**Audio is initialized** in `tacticalRuntime.ts` (lines 788-789: `initAudioRuntime()` + `playAmbientMusic()`). The SFX bridge wiring relies on `EventBus` events, but the new engine systems emit events to `world.events[]`, NOT to the old `EventBus` singleton. This means the sfxBridge never fires for gameplay events.

**The only working audio path:** `commandProcessor.ts` calls `playSfx()` directly for move/attack/build/research commands. Everything else (combat hits, deaths, building completion, etc.) is silent.

### 1.7 Visual Standards (art-direction.md)

| Standard | Status |
|---|---|
| Purchased sprite atlases (12 animal types) | Atlases exist in `public/assets/sprites/`, loaded by `spriteAtlas.ts`, rendered by `tacticalRuntime.ts` |
| Kenney tiles for terrain | Tiles exist in `public/assets/tiles/`, rendered by `tilePainter.ts` |
| 3x scale (48x48 rendered) | LittleJS handles scaling; needs runtime verification |
| Device-adaptive scale (2x/3x/4x) | NOT implemented |
| Animation system (idle, walk, attack, gather, death, build) | Atlas adapter maps states to sheet rows; needs verification all states render |
| Directional facing (flip horizontal) | Handled in tacticalRuntime.ts via facing component |
| Rank emblems on sprites | `rankEmblems.ts` is imported and used by `tacticalRuntime.ts` |
| Fog of war three states | fogSystem produces three states; fogRenderer exists in tacticalRuntime |
| CombatText / floating damage numbers | FloatingText engine object exists; `tickFloatingTexts` is in pipeline |
| Minimap | **COMPLETELY MISSING** -- no minimap component or renderer |
| Health bars above units | Rendered in tacticalRuntime.ts |
| Selection indicators | Rendered in tacticalRuntime.ts |

### 1.8 Scale-Guard Boss Characters (Lore)

| Boss (Lore) | Defined? | Boss Config? | Mission Assignment |
|---|---|---|---|
| Kommandant Ironjaw (final boss) | No entity def | No config | M15/M16 |
| Captain Scalebreak (albino alligator) | No entity def | No config | Unassigned |
| Warden Fangrot (prison commander) | No entity def | No config | M4 |
| Venom (king cobra) | No entity def | No config | M15 |
| The Broodmother (monitor lizard) | No entity def | No config | M13 |

**All 5 named Scale-Guard commanders are missing as entity definitions.** The bossSystem can handle them generically via `spawnBossUnit` scenario actions, but none are pre-configured.

---

## Part 2: Wiring Analysis

### 2.1 Non-Engine Source Files -- Import Status

#### `src/audio/` (6 files)

| File | Imported By Runtime Code? | Status |
|---|---|---|
| `engine.ts` | `audioRuntime.ts` (lazy import) | ACTIVE -- loaded on first gesture |
| `music.ts` | Not directly; `musicController.ts` imports it | INDIRECT |
| `musicController.ts` | `audioRuntime.ts` (lazy import) | ACTIVE -- loaded after gesture |
| `sfx.ts` | Not directly; `engine.ts` uses it | INDIRECT |
| `sfxBridge.ts` | `audioRuntime.ts` (lazy import) | ACTIVE -- but relies on EventBus which new engine doesn't use |
| `voiceBarks.ts` | Tests only | DEAD CODE at runtime |

**Key Issue:** `sfxBridge.ts` wires `EventBus` events to SFX. The new engine does NOT use `EventBus` -- it uses `world.events[]`. The bridge is installed but never receives events.

#### `src/ai/` (11 files)

| File | Imported By? | Status |
|---|---|---|
| `graphBuilder.ts` | `tacticalSession.ts` | ACTIVE -- builds nav graph |
| `pathfinder.ts` | `movementSystem.ts` | ACTIVE -- A* pathfinding |
| `groupPathCache.ts` | Tests only | DEAD CODE |
| `skirmishAI.ts` | `RuntimeHost.tsx` | ACTIVE -- skirmish opponent |
| `skirmishGameAdapter.ts` | `RuntimeHost.tsx` | ACTIVE |
| `steeringFactory.ts` | Tests only | DEAD CODE |
| `terrainTypes.ts` | `tilePainter.ts` (type import) | ACTIVE (types only) |
| `fsm/context.ts` | Tests only | DEAD CODE |
| `fsm/profiles.ts` | Tests only | DEAD CODE |
| `fsm/runner.ts` | Tests only | DEAD CODE |
| `fsm/states.ts` | Tests only | DEAD CODE |

**Key Issue:** The entire FSM subsystem (`fsm/context.ts`, `profiles.ts`, `runner.ts`, `states.ts`) is only used by tests. `aiSystem.ts` in the engine does NOT import or use the FSM -- it has its own inline behavior. The FSM is dead code.

#### `src/canvas/` (5 files)

| File | Imported By? | Status |
|---|---|---|
| `portraitRenderer.ts` | `TransmissionPortrait.tsx`, `BriefingOverlay.tsx` | PARTIALLY ACTIVE -- portraits render in briefing but TransmissionPortrait is not used in RuntimeHost |
| `rankEmblems.ts` | `tacticalRuntime.ts` | ACTIVE |
| `spriteAtlas.ts` | `tacticalRuntime.ts` | ACTIVE |
| `terrainPainter.ts` | Internal only (imports tilePainter) | ACTIVE (wraps tilePainter) |
| `tilePainter.ts` | `tacticalRuntime.ts`, `tacticalSession.ts` | ACTIVE |

#### `src/input/` (1 file)

| File | Imported By? | Status |
|---|---|---|
| `gestureDetector.ts` | `tacticalRuntime.ts` | ACTIVE -- mobile gesture classification |

#### `src/data/` (5 files)

| File | Imported By? | Status |
|---|---|---|
| `buildings.ts` | Tests only | NOT USED by engine (engine has inline defs in buildingSystem.ts) |
| `factions.ts` | Tests only | DEAD CODE |
| `research.ts` | Tests only | NOT USED by engine (researchSystem.ts has its own RESEARCH map) |
| `units.ts` | Tests only | NOT USED by engine (registry uses entities/ directly) |
| `index.ts` | Tests only | DEAD CODE barrel |

**Key Issue:** The entire `src/data/` directory is a parallel data layer that is NOT used by the runtime. The engine's `buildingSystem.ts` has its own inline building definitions, `researchSystem.ts` has its own research definitions, and unit data comes from `entities/registry.ts`. This means any corrections to `data/*.ts` would have NO effect on gameplay.

#### `src/game/` (2 files)

| File | Imported By? | Status |
|---|---|---|
| `EventBus.ts` | `sfxBridge.ts` | ORPHANED -- new engine uses world.events, not EventBus |
| `difficulty.ts` | Nothing | DEAD CODE |

#### `src/entities/portraits/` (8 files)

| File | Imported By? | Status |
|---|---|---|
| All 7 portrait files + index | `entities/registry.ts` | DEFINED but the portrait rendering path (`canvas/portraitRenderer.ts`) is only reached from `TransmissionPortrait.tsx` and `BriefingOverlay.tsx`. RuntimeHost does NOT use TacticalHUD, so TransmissionPortrait never renders in-game. |

#### `src/entities/props/` (3 files)

| File | Imported By? | Status |
|---|---|---|
| `tall-grass.ts` | `entities/registry.ts` | DEFINED but never spawned or rendered |
| `toxic-sludge.ts` | `entities/registry.ts` | DEFINED but never spawned or rendered |
| `index.ts` | `entities/registry.ts` | Barrel only |

#### `src/maps/skirmishMapGenerator.ts`

| File | Imported By? | Status |
|---|---|---|
| `skirmishMapGenerator.ts` | `tacticalSession.ts` | ACTIVE -- generates skirmish terrain |
| `constants.ts` | Not imported by runtime | DEAD CODE |
| `types.ts` | Not imported by runtime | DEAD CODE (local TerrainType enum, superseded by engine types) |

#### `src/persistence/database.ts`

| File | Imported By? | Status |
|---|---|---|
| `database.ts` | `sqlitePersistenceStore.ts`, `runtimeDiagnostics.ts`, `skirmish/persistence.ts` | ACTIVE |

#### `src/app/missionResult.ts`

| File | Imported By? | Status |
|---|---|---|
| `missionResult.ts` | `AppShell.tsx` | ACTIVE -- campaign progress resolution |

#### Other orphaned files

| File | Status |
|---|---|
| `src/game/difficulty.ts` | DEAD CODE -- not imported anywhere |
| `src/lib/utils.ts` (cn utility) | DEAD CODE -- not imported anywhere (old shadcn remnant) |
| `src/theme/designTokens.ts` | DEAD CODE -- not imported anywhere |
| `src/utils/noise.ts` | DEAD CODE -- not imported anywhere |
| `src/features/skirmish/persistence.ts` | Only imported in its own directory; never called from runtime |

### 2.2 Dead Code Summary

**Completely Dead (never imported by runtime):**
1. `src/ai/fsm/` (4 files) -- FSM system for enemy AI, only used by tests
2. `src/ai/groupPathCache.ts` -- group path caching, only tests
3. `src/ai/steeringFactory.ts` -- Yuka steering, only tests
4. `src/data/` (5 files) -- parallel data layer, superseded by entities/ and inline defs
5. `src/game/difficulty.ts` -- difficulty definitions
6. `src/game/EventBus.ts` -- old event bus, only used by sfxBridge (which itself is orphaned from engine events)
7. `src/lib/utils.ts` -- cn() utility from old shadcn
8. `src/theme/designTokens.ts` -- design token definitions
9. `src/utils/noise.ts` -- noise utility
10. `src/maps/constants.ts` -- CELL_SIZE constant
11. `src/maps/types.ts` -- TerrainType enum
12. `src/entities/props/tall-grass.ts` -- prop definition
13. `src/entities/props/toxic-sludge.ts` -- prop definition

**Exists but Unwired from Pipeline (11 systems):**
1. `bossSystem.ts`
2. `convoySystem.ts`
3. `weatherSystem.ts`
4. `waveSpawnerSystem.ts`
5. `waterSystem.ts`
6. `stealthSystem.ts`
7. `siphonSystem.ts`
8. `siegeSystem.ts`
9. `scoringSystem.ts`
10. `difficultyScalingSystem.ts`
11. `demolitionSystem.ts`

### 2.3 Unwired HUD Components

The RuntimeHost has its own inline HUD rendering (resources, selection, objectives, alerts, boss HP). It does NOT use the SolidJS `TacticalHUD` component or any of its children:

| HUD Component | In TacticalHUD? | Used by RuntimeHost? |
|---|---|---|
| `ResourceBar.tsx` | Yes | No (RuntimeHost renders inline) |
| `SelectionPanel.tsx` | Yes | No (RuntimeHost renders inline -- no action buttons) |
| `BuildMenu.tsx` | Yes | No (RuntimeHost has no build palette) |
| `AlertBanner.tsx` | Yes | No (RuntimeHost renders inline alerts) |
| `ObjectivesPanel.tsx` | Yes | No (RuntimeHost renders inline) |
| `BossHealthBar.tsx` | Yes | No (RuntimeHost renders inline) |
| `CommandTransmission.tsx` | Yes | No |
| `ErrorFeedback.tsx` | Yes | No |
| `PanelFrame.tsx` | Yes | No |
| `MilitaryTooltip.tsx` | Yes | No |
| `StarRatingDisplay.tsx` | Yes | No |
| `TransmissionPortrait.tsx` | Yes | No |
| `TutorialOverlay.tsx` | Yes | No |
| `createTypewriter.ts` | Yes | No |

**The entire `src/solid/hud/` directory (14 files) is unused at runtime.** TacticalHUD is exported but never imported by any active screen or component. The RuntimeHost builds its own simplified HUD inline.

Similarly, `src/solid/mobile/` (6 files -- CommandButtons, RadialMenu, SquadTabs, MobileLayout, formFactor, squadTabsState) is completely unused.

---

## Part 3: Integration Analysis

### 3.1 Build Flow: HUD -> Bridge -> Systems -> World

**Path:** BuildMenu click -> `emit.startBuild(id)` -> SolidBridge enqueues `{type: "startBuild", payload: {buildingId}}` -> `processCommands` dispatches -> `handleStartBuildCommand` -> emits `enter-build-mode` event on `world.events`

**BREAK POINT:** `enter-build-mode` event is pushed to `world.events[]` but nothing reads it. `tacticalRuntime.ts` does NOT have a handler for this event type. The build flow dead-ends here.

**Status: BROKEN** -- clicking Build does nothing visible.

### 3.2 Unit Training Flow: HUD -> Bridge -> Systems -> World

**Path (intended):** SelectionPanel "Train" button -> `emit.queueUnit(unitId)` -> SolidBridge enqueues `{type: "queueUnit", payload: {unitId}}` -> `processCommands` -> `handleQueueUnitCommand` -> finds building EID -> pushes to `productionQueues` -> `productionSystem.runProductionSystem()` advances progress -> spawns unit on completion.

**BREAK POINT 1:** RuntimeHost uses `createGameBridge` (non-reactive), NOT `createSolidBridge`. The inline HUD does not have Train buttons. The SelectionPanel with its Train buttons is in TacticalHUD which is never mounted.

**BREAK POINT 2:** Even if TacticalHUD were mounted, the SolidBridge's `emit.queueUnit()` enqueues a command, but RuntimeHost reads commands from `bridge.drainCommands()` using the `createGameBridge` instance, not the SolidBridge. The SolidBridge and GameBridge are two completely separate objects.

**Status: BROKEN** -- unit training cannot be triggered from the UI.

### 3.3 Research Flow: HUD -> Bridge -> Systems -> World

**Path (intended):** Research button -> `emit.issueResearch(id)` -> command queue -> `handleIssueResearchCommand` -> `queueResearch()` from researchSystem -> progress ticks -> applies stat changes.

**BREAK POINT:** Same as 3.2 -- no UI exists in the RuntimeHost inline HUD for research. TacticalHUD (which has no research panel either) is not mounted.

**Status: BROKEN** -- no way to initiate research from UI.

### 3.4 Scenario Engine -> Mission Triggers -> Victory/Defeat

**Path:** `createRuntimeMissionFlow()` creates ScenarioEngine with compiled triggers -> `missionFlow.step()` called each tick -> ScenarioEngine evaluates triggers against world query -> fires actions (dialogue, spawn, objectives, victory, defeat)

**Analysis:** This path IS wired. The RuntimeHost creates the missionFlow (line 167-173), calls `missionFlow.step()` in the onTick callback (line 199-201), and the ScenarioEngine evaluates triggers using the worldQuery adapter.

**Verified working:** Trigger evaluation, objective completion, dialogue display, unit spawning, phase transitions, victory/defeat conditions.

**Partial issues:**
- `spawnReinforcements` action works but spawned units have no stats (missing `stats` parameter in the spawn call in runtimeMissionFlow.ts)
- Weather change actions set `world.runtime.weather` but weatherSystem is not in the pipeline, so no gameplay effects are applied
- Boss spawn action works but bossSystem is not in the pipeline, so boss phases/AoE/summons never trigger

**Status: PARTIALLY WORKING** -- triggers fire, but downstream systems are missing from pipeline.

### 3.5 Fog of War: System -> Rendering

**Path:** `runFogSystem(world)` updates fog grid each tick based on unit vision -> `tacticalRuntime.ts` reads fog state for rendering decisions

**Analysis:** `fogSystem.ts` IS in the pipeline (line 168 of systems/index.ts). It creates and updates the fog grid. The tacticalRuntime reads fog state to dim/hide terrain and entities.

**Status: WORKING** -- fog updates and renders with three states.

### 3.6 AI Governor / Playtester -> Mission 1 Completion

**Path:** `governor.ts` in `engine/playtester/` provides an automated AI that plays missions. It builds, trains, attacks. Used by `allMissions.test.ts`.

**Analysis:** The governor IS wired to the game world and calls real systems. The `allMissions.test.ts` runs all 16 missions through the governor. However, the governor bypasses the UI entirely -- it directly manipulates world state.

**Status: WORKING for automated testing** -- not relevant to player experience.

### 3.7 Save/Load Roundtrip

**Path:** PauseOverlay "Save" button -> emit.saveGame() -> command queue -> handleSaveCommand -> emits `save-requested` event -> `tacticalRuntime.ts` handles event -> serializes world via `serializeGameWorld()` -> `SqlitePersistenceStore.saveMission()`

**Analysis:** The save path IS wired in tacticalRuntime.ts (it handles `save-requested` at line 566). Serialization exists in `gameWorldSaveLoad.ts`. Load path also exists in `gameWorldSaveLoad.ts` (`deserializeGameWorld`).

**BUT:** PauseOverlay does NOT have a Save button in the current code. And RuntimeHost uses `createGameBridge` which does enqueue "save" commands, but the PauseOverlay screen (in AppShell) is not aware of the game world.

**Status: BACKEND WORKS, UI MISSING** -- save/load roundtrip works in code but no UI to trigger it during gameplay.

### 3.8 Campaign Progress Persistence

**Path:** On victory -> AppShell captures stats -> `resolveMissionVictory()` computes next mission -> `SqlitePersistenceStore.saveCampaign()` persists progress.

**Analysis:** This IS wired in AppShell.tsx (lines 72-121). On phase change to "victory", it creates a SqlitePersistenceStore, loads existing campaign, applies the victory result, and saves.

**ISSUE:** Campaign loading at startup is not wired. `CampaignView.tsx` hardcodes mission 1 as "available" and all others as "locked" (via `getMissionSlots()`) instead of loading from the persistence store.

**Status: PARTIALLY WORKING** -- saves but doesn't load on next session.

### 3.9 Bridge State Synchronization

**Critical Architecture Issue:** RuntimeHost uses `createGameBridge()` (plain object with mutable state) and polls it every 100ms via `setInterval` to update a `hudState` signal. It does NOT use `createSolidBridge()` which provides reactive signals.

This means:
1. HUD updates at 10 FPS (100ms interval), not at frame rate
2. The SolidBridge's fine-grained reactivity is completely unused
3. All the SolidBridge accessor types (signals, stores) referenced by TacticalHUD components are from a different bridge instance that doesn't exist at runtime

**The GameBridge's `state` object is never populated by `syncFromWorld()`.** The GameBridge is a dumb command queue -- it does not read world state. The RuntimeHost polls `bridge.state` which was initialized with zeros and never updated.

Wait -- re-reading the code: RuntimeHost stores `worldInstance` and reads from it directly in the phase-check interval (line 284: `worldInstance?.session.phase`). The HUD state comes from `bridge.state` which is STATIC (only initialized, never updated). Resources/population/selection shown in the inline HUD read from `hudState()` which copies `bridge.state` every 100ms -- but `bridge.state` never changes because nothing calls `syncFromWorld()` on the GameBridge.

**Actually:** Re-examining `createGameBridge()` -- it returns a plain object. The `bridge.state` fields ARE mutated by the RuntimeHost via the `tacticalRuntime.ts` callbacks. Let me re-verify...

Looking at tacticalRuntime.ts: it receives the bridge and mutates `bridge.state` directly during its tick. The RuntimeHost's setInterval then reads these mutations.

**Status: FUNCTIONAL but suboptimal** -- state flows via mutation polling, not reactive signals.

---

## Part 4: Priority Fixes

### Tier 1: "Without these, it's not a game" (Critical Breaks)

| # | Fix | Impact | Effort |
|---|---|---|---|
| 1 | **Wire build placement**: Handle `enter-build-mode` event in tacticalRuntime -- implement ghost placement, click-to-place, worker rally, construction progress visualization | Cannot build = no economy, no army, no game | High |
| 2 | **Mount TacticalHUD** (or move its functionality into RuntimeHost): Replace inline HUD with proper SolidBridge-backed HUD that has action buttons, build menu, training queue, research panel | All UI interaction is currently cosmetic | High |
| 3 | **Bridge architecture**: Switch RuntimeHost to use `createSolidBridge()` or wire `syncFromWorld()` into the game loop so HUD state updates reactively | HUD shows stale/zero data | Medium |
| 4 | **Add 11 missing systems to pipeline**: bossSystem, convoySystem, weatherSystem, waveSpawnerSystem, waterSystem, stealthSystem, siphonSystem, siegeSystem, scoringSystem, difficultyScalingSystem, demolitionSystem | Half the mission mechanics are dead code | Medium |
| 5 | **Minimap**: Implement a minimap renderer (canvas or LittleJS overlay) with click-to-navigate | Cannot navigate 128x128 maps | High |
| 6 | **Fix BuildMenu costs**: Replace hardcoded DEFAULT_BUILD_OPTIONS with data from entities registry or canonical balance doc values | Players see wrong costs | Low |

### Tier 2: "Without these, it feels broken" (Major Gaps)

| # | Fix | Impact |
|---|---|---|
| 7 | **Wire audio EventBus bridge OR emit playSfx calls from engine systems**: Either make systems emit to EventBus, or add direct playSfx calls in combatSystem, economySystem, etc. | Game is silent except for move/attack clicks |
| 8 | **Campaign progress loading**: CampaignView must load from SqlitePersistenceStore on mount | Progress lost between sessions |
| 9 | **Reconcile data layers**: Remove `src/data/` or use it as the single source of truth instead of inline defs in buildingSystem/researchSystem | Three sources of truth for same data |
| 10 | **Research stat reconciliation**: Align researchSystem definitions with balance-deep-dive.md values | Research effects don't match design |
| 11 | **Add missing research**: Advanced Fishing, Rapid Construction, Field Triage | 3 of 8 research items missing |
| 12 | **Boss entity definitions**: Create entity defs for Ironjaw, Scalebreak, Fangrot, Venom, Broodmother | No bosses can spawn correctly |
| 13 | **Portraits in runtime**: Wire TransmissionPortrait into dialogue display, either via TacticalHUD or inline | Dialogue has no portraits |
| 14 | **PauseOverlay Save button**: Re-add Save Game button and wire to persistence | Cannot save mid-mission |

### Tier 3: "Without these, it feels cheap" (Polish)

| # | Fix | Impact |
|---|---|---|
| 15 | Remove dead code: `src/data/`, `src/game/difficulty.ts`, `src/game/EventBus.ts`, `src/lib/utils.ts`, `src/theme/designTokens.ts`, `src/utils/noise.ts`, `src/maps/constants.ts`, `src/maps/types.ts`, unused AI FSM files | Cleaner codebase |
| 16 | Mobile layout adaptation: Wire MobileLayout/formFactor into RuntimeHost | No mobile UX |
| 17 | CSS themes: canvas-grain, riverine-camo, CRT effects, paper grain | Generic appearance |
| 18 | Tooltip system (MilitaryTooltip) | Buttons have no explanations |
| 19 | Tutorial overlay for missions 1-4 | New players have no guidance |
| 20 | Star rating with score breakdown on result screen | Victory feels hollow |
| 21 | Device-adaptive sprite scaling (2x/3x/4x) | One-size rendering |
| 22 | Voice barks on unit selection | Units feel lifeless |

---

## Summary Statistics

| Dimension | Count |
|---|---|
| Design doc unit types defined in registry | 15/15 (100%) |
| Design doc buildings defined in registry | 14/14 (100%) |
| Buildings in build palette (vs 14 defined) | 9/14 (64%) |
| Build palette costs matching balance doc | 1/9 (11%) |
| Research items in engine (vs 8 in balance doc) | 5/8 (63%) |
| Heroes defined in registry | 6/6 (100%) |
| Named bosses defined as entities | 0/5 (0%) |
| Gameplay systems in pipeline (vs 29 total) | 18/29 (62%) |
| Audio SFX wired at runtime | 3/19 (16%) |
| Music tracks playing | 1/4 (ambient only, no menu/briefing/combat) |
| Solid HUD components used by RuntimeHost | 0/14 (0%) |
| Non-engine source files that are dead code | 13+ files |
| Integration paths fully working | 3/9 (33%) |
| Integration paths partially working | 3/9 (33%) |
| Integration paths broken | 3/9 (33%) |
