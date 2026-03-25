# PRD: OTTER: ELITE FORCE — Complete Remaining Work

## Overview

This PRD covers **all remaining work** for OTTER: ELITE FORCE, a campaign-first 2D RTS about the Otter Elite Force conducting a river-jungle liberation campaign against the Scale-Guard. The codebase has 22 gameplay systems, 46+ entity definitions, 16 mission scripts, a full ECS with Koota, React 19 HUD components, Phaser 3 rendering, Tone.js audio, and Yuka AI — all passing unit tests in isolation. The critical gap is **integration**: systems have never been validated working together in the browser as a playable game.

This PRD is structured with explicit dependency chains so that ralph-tui parallel mode can automatically execute independent stories concurrently while respecting ordering constraints.

## Goals

- Wire all existing systems into a working end-to-end game loop in the browser
- Deliver a complete gather → build → train → fight → advance gameplay experience
- Make all 16 campaign missions playable with scoring and progression
- Apply the Copilot design bible's analog-military art direction to the UI
- Achieve mobile/tablet/desktop parity for all gameplay and menus
- Implement save/load, settings persistence, and campaign progress across sessions
- Add skirmish mode with procedural maps and AI opponents
- Reach comprehensive test coverage (unit, browser, E2E)
- Optimize performance for 20+ unit battles on mobile
- Clean up obsolete documentation

## Quality Gates

These commands must pass for every user story unless noted otherwise:

**For systems/ECS/gameplay stories:**
- `pnpm typecheck` — Type checking
- `pnpm test:unit` — Unit tests

**For UI/component stories:**
- `pnpm typecheck` — Type checking
- `pnpm lint` — Biome linting
- `pnpm test:unit` — Unit tests
- Verify in browser using dev-browser skill

**For browser integration stories:**
- `pnpm typecheck` — Type checking
- `pnpm test:browser` — Browser integration tests

**For E2E stories:**
- `pnpm typecheck` — Type checking
- `pnpm test:e2e` — Playwright tests

**For sprite/asset stories:**
- `pnpm build:sprites` — Sprite pipeline
- `pnpm typecheck` — Type checking

**For documentation stories:**
- No code quality gates (content review only)

## Dependency Graph

Stories reference dependencies by ID. Stories with no dependencies can execute immediately in parallel. The graph below shows the critical path and parallel opportunities.

```
Legend: → means "blocks" (right side waits for left)

# Foundation (no dependencies — all launch in parallel)
US-001, US-007, US-012, US-029, US-034, US-070, US-078, US-092, US-103, US-112

# Core Integration (depends on foundation)
US-001 → US-002, US-003, US-004, US-005
US-007 → US-008
US-008 → US-009, US-010

# Gameplay Feedback (depends on core integration)
US-002 → US-021 (floating text needs gather loop)
US-003 → US-022, US-023, US-024 (build visuals need build loop)
US-004 → US-017 (queue indicator needs train loop)
US-005 → US-025, US-027 (combat visuals need combat loop)

# HUD Wiring (depends on relevant gameplay)
US-002 → US-013 (UnitPanel needs working selection + ECS)
US-012 → US-014, US-015 (ActionBar/BuildMenu need ResourceBar)
US-009 → US-037 (minimap theme needs functional minimap)

# Mission Runtime (depends on all gameplay + HUD)
US-002, US-003, US-004, US-005, US-006 → US-049 (Mission 1)
US-049 → US-050, US-051, US-052, US-053 (campaign features)
US-049 → US-054 → US-055 → US-056 → US-057 (mission batches)

# Persistence (depends on basic gameplay)
US-006 → US-042 → US-043, US-044, US-045, US-046, US-047, US-048

# Mobile (depends on input wiring)
US-008, US-010 → US-058 → US-059, US-060, US-061, US-062
US-058 → US-063, US-064, US-065, US-066

# AI Behaviors (depends on AI system + movement)
US-001, US-070 → US-071, US-072, US-073, US-074, US-075, US-076
US-049 → US-077 (balance validation needs mission 1)

# Skirmish (depends on full gameplay + AI)
US-049, US-076 → US-087 → US-088, US-089, US-090, US-091

# Polish & Theme (depends on HUD wiring)
US-034 → US-035, US-036, US-038, US-039, US-040, US-041

# Testing (depends on relevant features)
US-049 → US-093, US-095, US-096, US-097, US-098
US-047 → US-094

# Accessibility + Native (late dependencies)
US-066 → US-104, US-105, US-106, US-107
US-062 → US-108, US-109, US-110, US-111

# Per-mission AI + Full E2E (depends on AI + all missions)
US-065, US-049 → US-101 (per-mission GOAP profiles)
US-101, US-054, US-055, US-056, US-057 → US-102 (E2E all 16 missions)
```

## User Stories

---

### TRACK A: GAME LOOP & SYSTEMS INTEGRATION

---

### US-001: Wire AI FSM system to game loop
As a developer, I want the enemy AI FSM system wired into the game loop so that enemy units make autonomous decisions each frame.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Create `aiSystem(world, delta)` function in `src/systems/aiSystem.ts`
- [ ] Import and call FSM runner from `src/ai/fsm/runner.ts` for all entities with `AIState` trait
- [ ] Wire aiSystem into `tickAllSystems()` in `src/systems/gameLoop.ts` at position 3 (replacing the TODO comment at line 77-78)
- [ ] Remove the `// aiSystem(world, delta);` placeholder comment
- [ ] Enemy units with FSM profiles (Gator, Viper, Scout Lizard, etc.) execute state transitions each frame
- [ ] Add unit test verifying aiSystem calls FSM runner for entities with AIState trait
- [ ] Existing unit tests continue to pass

---

### US-002: End-to-end gather loop in browser
As a player, I want to right-click a resource with a worker and see them walk → harvest → carry → deposit → repeat, so that resource gathering feels satisfying.

**Dependencies:** US-001

**Quality gate:** `pnpm typecheck && pnpm test:unit && pnpm test:browser`

**Acceptance Criteria:**
- [ ] Right-clicking a fish spot / mangrove / salvage cache with a River Rat selected dispatches a Gather order
- [ ] Worker walks to resource node using Yuka pathfinding
- [ ] Harvest timer runs (visible via progress indicator or animation)
- [ ] Worker picks up resources and walks to nearest Command Post
- [ ] Resources deposited to `ResourcePool` singleton on arrival
- [ ] Worker auto-returns to the same resource node after deposit
- [ ] Fish Trap passive income (+3 fish/10s) works concurrently
- [ ] Add browser integration test verifying the complete gather cycle

---

### US-003: End-to-end build loop in browser
As a player, I want to select a worker → click a build button → place a building ghost → watch construction complete, so that base building works.

**Dependencies:** US-001

**Quality gate:** `pnpm typecheck && pnpm test:unit && pnpm test:browser`

**Acceptance Criteria:**
- [ ] Selecting a River Rat shows build options in the ActionBar
- [ ] Clicking a build option enters placement mode with a ghost preview following the cursor
- [ ] Ghost shows green overlay when placement is valid, red when invalid (terrain/occupancy)
- [ ] Left-clicking places the building and deducts resources from `ResourcePool`
- [ ] Worker auto-walks to construction site
- [ ] `buildingSystem` ticks construction progress from 0% to 100%
- [ ] Building becomes functional on completion (can train units, provide income, etc.)
- [ ] Right-click or Escape cancels placement mode
- [ ] Add browser integration test verifying the build cycle

---

### US-004: End-to-end train loop in browser
As a player, I want to select a Barracks → click train → see a queue progress → have the unit spawn at the rally point, so that army production works.

**Dependencies:** US-001

**Quality gate:** `pnpm typecheck && pnpm test:unit && pnpm test:browser`

**Acceptance Criteria:**
- [ ] Selecting a Barracks shows train options in the ActionBar
- [ ] Clicking a train button deducts resources from `ResourcePool`
- [ ] Training shows in `ProductionQueue` with visible progress
- [ ] On completion, unit spawns at the building's location
- [ ] If rally point is set, unit auto-walks to rally point
- [ ] Population cap check prevents training when at max
- [ ] "Not enough resources" feedback when resources insufficient
- [ ] Add browser integration test verifying the train cycle

---

### US-005: End-to-end combat loop in browser
As a player, I want to right-click an enemy unit to attack, see my units chase and deal damage, and see enemies die, so that combat works.

**Dependencies:** US-001

**Quality gate:** `pnpm typecheck && pnpm test:unit && pnpm test:browser`

**Acceptance Criteria:**
- [ ] Right-clicking an enemy dispatches an Attack order
- [ ] Melee units chase and deal damage on arrival (attack cooldown respected)
- [ ] Ranged units stop at their attack range and fire projectiles
- [ ] Projectiles track targets and deal damage on arrival
- [ ] `aggroSystem` auto-acquires nearest enemy within vision radius for idle combat units
- [ ] `deathSystem` removes dead entities and clears targeting relations
- [ ] HP changes are visible (HP bar updates)
- [ ] Add browser integration test verifying combat from attack order to death

---

### US-006: Victory and defeat detection with overlay
As a player, I want to see a victory or defeat overlay when mission objectives are completed or failed, so that missions have clear endings.

**Dependencies:** US-002, US-003, US-004, US-005

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `scenarioSystem` fires `endMission` action with victory/defeat when objectives are met
- [ ] Victory overlay renders full-screen with mission name, star rating placeholder, and "Continue" button
- [ ] Defeat overlay renders full-screen with "Retry" and "Menu" buttons
- [ ] Game loop pauses when overlay is showing (`GamePhase` → victory/defeat)
- [ ] "Continue" button returns to menu (updates `AppScreen` singleton)
- [ ] Victory/defeat sound effect plays via AudioEngine
- [ ] Verify in browser using dev-browser skill

---

### TRACK B: CAMERA & INPUT

---

### US-007: Selection rectangle visual in Phaser
As a player, I want to see a green translucent rectangle when drag-selecting units so that I have clear visual feedback for box selection.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Left-click-drag renders a Phaser Graphics rectangle (green border + 20% opacity fill)
- [ ] Rectangle coordinates track mouse position in world space (camera offset accounted for)
- [ ] Releasing the mouse selects all player units within the rectangle
- [ ] Single left-click still selects individual units
- [ ] Rectangle clears on mouse release
- [ ] Verify visually in browser

---

### US-008: Right-click context-sensitive commands
As a player, I want right-click to automatically dispatch the correct command (move/attack/gather/build/rally) based on what I click, so that gameplay is intuitive.

**Dependencies:** US-007

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Right-click on ground with units selected → Move order
- [ ] Right-click on enemy with units selected → Attack order
- [ ] Right-click on resource with worker selected → Gather order
- [ ] Right-click on ground with building selected → Set rally point
- [ ] Right-click plays appropriate cursor change / feedback
- [ ] `commandDispatcher.ts` handles all context resolution correctly
- [ ] Add unit test for each context-sensitive dispatch case

---

### US-009: Minimap camera sync and interaction
As a player, I want to click/drag on the minimap to move my camera, and see unit pips on the minimap, so that I can navigate large maps.

**Dependencies:** US-008

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Minimap renders a scaled-down view of the terrain
- [ ] Camera viewport rectangle is visible on the minimap
- [ ] Clicking the minimap snaps the camera to that world position
- [ ] Dragging on the minimap pans the camera smoothly
- [ ] Player units show as colored pips (URA blue)
- [ ] Enemy units in vision show as colored pips (SG red)
- [ ] Buildings show as larger pips
- [ ] Minimap updates each frame
- [ ] Verify in browser using dev-browser skill

---

### US-010: Edge scroll and camera zoom limits
As a player, I want the camera to scroll when my mouse is near the screen edge and zoom to be limited per device, so that camera control feels polished.

**Dependencies:** US-008

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mouse within 20px of screen edge triggers camera pan in that direction
- [ ] Camera pan speed matches WASD/arrow key speed (12px/frame or configurable)
- [ ] Mouse-in detection flag prevents false triggers when mouse enters from outside the game area
- [ ] Zoom limits enforced: phone (0.5x–1.5x), tablet (0.5x–2x), desktop (0.25x–3x)
- [ ] Mouse wheel zoom is smooth (lerp, not instant)
- [ ] Camera cannot scroll beyond map boundaries

---

### US-011: Keyboard hotkeys for commands
As a player, I want keyboard shortcuts for common commands so that experienced players can play efficiently.

**Dependencies:** US-008

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `H` — halt all selected units (Stop order)
- [ ] `A` then left-click — attack-move to location
- [ ] `P` then left-click — patrol between current position and target
- [ ] `Ctrl+1..9` — assign selected units to control group
- [ ] `1..9` — select control group
- [ ] `Escape` — deselect all / cancel current action
- [ ] `Space` — center camera on last alert/event
- [ ] Hotkeys are documented in a settings-accessible reference

---

### TRACK C: HUD FUNCTIONAL WIRING

---

### US-012: ResourceBar live Koota binding validation
As a player, I want the resource bar to show my current fish, timber, salvage, and population in real time so that I can make economic decisions.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `ResourceBar` component reads from `ResourcePool` and `PopulationState` singletons via Koota
- [ ] Fish, timber, salvage counts update in real time as resources are gathered/spent
- [ ] Population shows current/max format (e.g., "12/30")
- [ ] Numbers animate smoothly when changing (CSS transition or counter animation)
- [ ] Resource bar is visible at all breakpoints (phone/tablet/desktop)
- [ ] Verify in browser using dev-browser skill

---

### US-013: UnitPanel selection → ECS trait binding
As a player, I want the unit panel to show the selected unit's stats (name, HP, armor, damage, abilities) so that I can make tactical decisions.

**Dependencies:** US-002

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Selecting a unit populates `UnitPanel` with: unit name, HP/maxHP bar, armor value, damage value, attack range
- [ ] Selecting a building shows: building name, HP bar, current production queue (if any), research slot
- [ ] Selecting multiple units shows count and aggregate info
- [ ] Deselecting clears the panel
- [ ] HP bar updates in real time during combat
- [ ] Verify in browser using dev-browser skill

---

### US-014: ActionBar context-sensitive commands
As a player, I want the action bar to show different buttons depending on what I have selected so that I always see relevant actions.

**Dependencies:** US-012

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Worker selected → shows Move, Stop, Gather, Build buttons
- [ ] Combat unit selected → shows Move, Stop, Attack, Patrol, Hold Position buttons
- [ ] Building selected → shows Train buttons for that building's production queue
- [ ] Armory selected → shows Research options
- [ ] Nothing selected → action bar is empty or shows global commands
- [ ] Buttons are disabled (greyed out) when action is unavailable (e.g., not enough resources)
- [ ] Cost tooltip on hover for train/build/research buttons
- [ ] Verify in browser using dev-browser skill

---

### US-015: BuildMenu affordability gating and ghost trigger
As a player, I want the build menu to grey out buildings I can't afford and trigger ghost placement mode when I click an affordable one.

**Dependencies:** US-012

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Build menu shows all available buildings for URA faction
- [ ] Each button displays the building's cost (fish/timber/salvage)
- [ ] Buildings the player cannot afford are greyed out and unclickable
- [ ] Buildings not yet unlocked (per mission progression) are hidden or locked
- [ ] Clicking an affordable building enters ghost placement mode (dispatches event to Phaser)
- [ ] Verify in browser using dev-browser skill

---

### US-016: AlertBanner event wiring
As a player, I want to see alert toasts when important events happen (enemy spotted, under attack, building complete) so that I can respond to the battlefield.

**Dependencies:** none (can wire to EventBus immediately)

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] "Under Attack!" alert when player units take damage from enemies
- [ ] "Building Complete" alert when construction finishes
- [ ] "Training Complete" alert when unit production finishes
- [ ] "Enemy Spotted" alert when fog reveals enemy units
- [ ] "Objective Complete" alert when mission objective is achieved
- [ ] Alerts auto-dismiss after 3 seconds
- [ ] Maximum 3 alerts visible simultaneously (queue overflow)
- [ ] Clicking an alert centers camera on the event location

---

### US-017: Building training queue progress indicator
As a player, I want to see a progress bar showing what a building is currently training so that I can plan my army composition.

**Dependencies:** US-004

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Selected building with active `ProductionQueue` shows progress bar in UnitPanel
- [ ] Progress bar fills from 0% to 100% as training progresses
- [ ] Unit icon and name shown next to progress bar
- [ ] Queue depth indicator (e.g., "2 more queued") below progress bar
- [ ] Progress bar also renders as a small overlay below the building sprite in the game view
- [ ] Verify in browser using dev-browser skill

---

### US-018: Research UI panel
As a player, I want to see available research at my Armory, their costs and effects, so that I can invest in tech upgrades.

**Dependencies:** US-014

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Selecting an Armory building shows available research options in ActionBar
- [ ] Each research button shows: name, cost, research time, effect description
- [ ] Already-completed research is marked with a checkmark and not re-clickable
- [ ] Research in progress shows a progress bar
- [ ] Unaffordable research is greyed out
- [ ] Starting research deducts resources and begins the timer
- [ ] Completion adds to `CompletedResearch` singleton and applies stat bonuses
- [ ] Verify in browser using dev-browser skill

---

### US-019: Game clock and objective tracker in top bar
As a player, I want to see the elapsed mission time and current objectives in the top bar so that I can track my progress toward par time and goals.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `GameplayTopBar` or equivalent displays elapsed time from `GameClock` singleton (MM:SS format)
- [ ] Active objectives from `Objectives` singleton display with status (incomplete/complete)
- [ ] Completed objectives show a checkmark
- [ ] Par time indicator (optional: shows how close to gold star threshold)
- [ ] Verify in browser using dev-browser skill

---

### US-020: Pause menu during gameplay
As a player, I want to press Escape during a mission to pause the game and see options (Resume, Save, Settings, Quit to Menu) so that I can take breaks.

**Dependencies:** US-006

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Pressing Escape during gameplay sets `GamePhase` to paused and shows a pause overlay
- [ ] Pause overlay shows: Resume, Save Game, Settings, Quit to Menu buttons
- [ ] "Resume" or pressing Escape again unpauses and hides overlay
- [ ] "Quit to Menu" returns to main menu (with confirmation dialog)
- [ ] Game loop does not tick while paused
- [ ] Verify in browser using dev-browser skill

---

### TRACK D: VISUAL FEEDBACK

---

### US-021: Floating damage and resource text
As a player, I want to see floating "+10 Fish" text when resources are deposited and "-6 HP" when units take damage, so that every action feels consequential.

**Dependencies:** US-002

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Implement a `FloatingTextManager` in Phaser that spawns text at world positions
- [ ] Resource deposit shows green "+X [resource]" text that rises and fades over 1 second
- [ ] Damage dealt shows red "-X HP" text that rises and fades over 1 second
- [ ] Healing shows green "+X HP" text
- [ ] Text has black outline/shadow for readability against any background
- [ ] Maximum 20 simultaneous floating texts (oldest removed on overflow)
- [ ] Text is visible at all zoom levels (fixed screen size, not world size)

---

### US-022: Building placement ghost with affordability overlay
As a player, I want to see a translucent building preview that follows my cursor and shows green/red based on placement validity, so that I can place buildings confidently.

**Dependencies:** US-003

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Entering placement mode spawns a Phaser sprite at 50% alpha following cursor/touch
- [ ] Ghost snaps to tile grid (32px tiles)
- [ ] Green tint overlay when placement is valid (terrain walkable, not occupied, affordable)
- [ ] Red tint overlay when placement is invalid
- [ ] Invalid placement shows reason in a small tooltip ("Blocked" / "Not enough resources")
- [ ] Ghost despawns on placement, right-click cancel, or Escape

---

### US-023: Construction progress visual
As a player, I want to see buildings visually rise from a foundation during construction, so that building feels satisfying.

**Dependencies:** US-003

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Buildings at 0% construction render as a foundation outline (low alpha, placeholder frame)
- [ ] Building alpha increases linearly from 30% to 100% as construction progresses
- [ ] Optional: scaffolding overlay visible during construction (simple cross-hatch lines)
- [ ] Construction complete plays a brief visual flourish (flash or particle burst)
- [ ] Construction percentage is readable when building is selected (shown in UnitPanel)

---

### US-024: Rally point visualization
As a player, I want to see a dashed line from my building to its rally point so that I know where trained units will go.

**Dependencies:** US-003

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Right-clicking ground with a building selected sets its `RallyPoint` trait
- [ ] A dashed line renders from the building center to the rally point
- [ ] A flag/dot marker renders at the rally point position
- [ ] Rally visualization only shows when the building is selected
- [ ] Rally point persists until changed

---

### US-025: HP bar color gradient
As a player, I want unit and building HP bars to change color from green to yellow to red based on health percentage so that I can quickly assess army health.

**Dependencies:** US-005

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] HP bars render above units and buildings in Phaser
- [ ] Color gradient: >66% = green, 33-66% = yellow, <33% = red
- [ ] HP bars only visible for selected units, damaged units, or units in combat
- [ ] HP bar width proportional to unit's max HP (larger for buildings/heroes)
- [ ] HP bars are thin (2-3px) and don't obscure the unit sprite

---

### US-026: Resource carrying indicator
As a player, I want to see a small colored pip above workers who are carrying resources so that I can identify which workers are gathering vs idle.

**Dependencies:** US-002

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Workers carrying fish show a blue pip above their sprite
- [ ] Workers carrying timber show a brown pip above their sprite
- [ ] Workers carrying salvage show a grey pip above their sprite
- [ ] Pip disappears when resources are deposited
- [ ] Pip is small (4-6px circle) and visible at game zoom

---

### US-027: Projectile particle trails
As a player, I want to see short particle trails behind projectiles so that ranged combat feels impactful.

**Dependencies:** US-005

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Projectiles spawned by `projectileSystem` emit 2-3 trailing particles per frame
- [ ] Trail particles fade and shrink over 0.3 seconds
- [ ] Trail color matches the projectile type (grey for slingshot stones, orange for mortar)
- [ ] Performance: particle system uses object pooling (max 100 trail particles)

---

### US-028: Day/night cycle visual overlay
As a player, I want to see a subtle day/night cycle that changes the map lighting so that time passing feels atmospheric.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Phaser overlay layer renders a semi-transparent color tint over the game
- [ ] Dawn: warm orange tint (5% opacity)
- [ ] Day: clear (0% opacity)
- [ ] Dusk: warm red tint (10% opacity)
- [ ] Night: blue tint (25% opacity) with reduced visibility radius
- [ ] Cycle tied to `GameClock` singleton (1 in-game day = configurable real minutes)
- [ ] Night affects fog of war (smaller vision radius for all units)

---

### TRACK E: AUDIO

---

### US-029: Audio unlock on first user gesture
As a player, I want audio to initialize cleanly on my first click/tap so that sounds work without browser autoplay restrictions.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `Tone.start()` called on the first pointer event (click, tap, or keypress)
- [ ] AudioEngine initializes all synthesizers after Tone context is running
- [ ] No audio-related console errors on page load
- [ ] Audio works on Chrome, Firefox, Safari (WebKit autoplay restrictions handled)
- [ ] Initialization is idempotent (multiple calls don't create duplicate synths)

---

### US-030: Wire SFX to all gameplay events
As a player, I want to hear sound effects for every meaningful action (select, move, attack, build, gather, error) so that the game has audio feedback.

**Dependencies:** US-029, US-002, US-005

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Unit select: short click/chirp
- [ ] Unit command (move): confirmation beep
- [ ] Unit command (attack): aggressive chirp
- [ ] Melee hit: thud/impact
- [ ] Ranged fire: twang/thwip
- [ ] Ranged hit: impact variant
- [ ] Gather resource: chop/splash/clank per resource type
- [ ] Resource deposit: register/ding
- [ ] Building placement: stamp/thunk
- [ ] Building complete: construction-complete fanfare
- [ ] Training complete: horn/bugle blip
- [ ] Research complete: discovery chime
- [ ] Error action (can't build, can't afford): buzz/error tone
- [ ] Unit death: brief death sound
- [ ] All SFX fire through `AudioEngine.playSFX()` to respect volume settings

---

### US-031: Wire music to screen and combat state
As a player, I want ambient music in menus, tension music during gameplay, and combat music when fighting starts, so that the soundtrack matches the mood.

**Dependencies:** US-029

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Menu music plays when `AppScreen` is "menu"
- [ ] Ambient gameplay music plays when `AppScreen` is "game" and no enemies are in combat
- [ ] Combat music fades in (1s crossfade) when player units engage enemies
- [ ] Combat music fades back to ambient when no combat for 5+ seconds
- [ ] Briefing track plays during mission intro dialogue
- [ ] Music respects `UserSettings` music volume
- [ ] Music transitions are smooth (no abrupt cuts)

---

### US-032: Audio polish — concurrent SFX limit and crossfade
As a player, I want SFX to not become cacophonous during large battles so that audio remains clear and pleasant.

**Dependencies:** US-030

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Maximum 4 simultaneous SFX voices (oldest interrupted on overflow)
- [ ] Identical SFX cannot play more than once per 100ms (debounce)
- [ ] Music crossfade transitions are 1 second duration
- [ ] Volume settings from `UserSettings` trait applied: master, sfx, music sliders
- [ ] Mute toggle works for all audio

---

### US-033: Unit voice barks on select and command
As a player, I want units to make short distinctive sounds when selected or commanded so that the game feels responsive and characterful.

**Dependencies:** US-030

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Each unit type has 2-3 short synth voice barks for selection ("Ready!", "Sir!", etc. conveyed through tone)
- [ ] Each unit type has 1-2 command acknowledgment sounds
- [ ] Barks use Tone.js synthesis (no audio files) — different pitch/timbre per unit type
- [ ] Heroes have slightly longer/more distinctive barks than regular units
- [ ] Barks respect the concurrent SFX limit

---

### TRACK F: ART DIRECTION & THEME

---

### US-034: Map Copilot palette to Tailwind CSS variables
As a developer, I want the Copilot design bible's color palette (jungle/khaki/rust/steel/accents) applied as Tailwind CSS variables so that all UI components use the correct military theme.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm build`

**Acceptance Criteria:**
- [ ] Define CSS custom properties for: jungle-950 through jungle-50, khaki-900 through khaki-100, rust tones, steel tones, alert-orange, phosphor-green, highlight-yellow
- [ ] Map to Tailwind v4 theme tokens in `src/app/globals.css` or tailwind config
- [ ] Update `--background`, `--foreground`, `--border`, `--card`, `--primary`, `--secondary`, `--accent` to use the new palette
- [ ] All existing components inherit the new palette without manual changes
- [ ] Verify visual result in browser using dev-browser skill

---

### US-035: Manila folder briefing treatment
As a player, I want mission briefings to look like a worn manila dossier folder with stamps and paper grain so that the narrative feels immersive and military.

**Dependencies:** US-034

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Briefing overlay uses a warm khaki/manila background with subtle paper grain texture (CSS noise or SVG filter)
- [ ] Mission code stamp (e.g., "OPERATION MUDSLIDE FURY") in stencil font at top
- [ ] "CLASSIFIED" or "TOP SECRET" red stamp overlay at an angle
- [ ] Redacted black-bar lines as decorative elements
- [ ] Commander's pawprint signature at bottom of briefing text
- [ ] Briefing text uses a typewriter font
- [ ] Verify in browser using dev-browser skill

---

### US-036: Typewriter character-by-character animation
As a player, I want briefing dialogue to appear one character at a time with a typewriter sound so that briefings feel dramatic and analog.

**Dependencies:** US-034

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `CommandTransmissionPanel` displays dialogue text character-by-character at ~40 chars/second
- [ ] Optional typewriter clack sound on each character (via AudioEngine)
- [ ] Clicking/tapping during animation instantly completes the current line
- [ ] Clicking/tapping after line complete advances to next line
- [ ] Paragraph pauses (0.3s) at periods and commas
- [ ] Animation is skippable (skip button or rapid clicks complete all dialogue)

---

### US-037: Phosphor-green minimap CRT styling
As a player, I want the minimap to look like a phosphor-green radar scope with CRT grid lines so that it matches the military command-post aesthetic.

**Dependencies:** US-009

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Minimap container has a dark background with phosphor-green (#00ff41 or similar) border glow
- [ ] CRT-style scanlines or grid overlay (subtle, 5-10% opacity)
- [ ] Unit pips glow in phosphor-green (friendly) and red (enemy)
- [ ] Camera viewport rectangle is a brighter green
- [ ] Optional: radial sweep line animation (rotating line like a radar)
- [ ] Verify in browser using dev-browser skill

---

### US-038: Canvas/metal texture overlays on HUD panels
As a player, I want HUD panels to have subtle canvas/metal texture overlays so that the UI feels like a physical military command post.

**Dependencies:** US-034

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Create a reusable CSS class or Tailwind utility for canvas-grain texture (SVG noise filter or tiled PNG)
- [ ] Apply to: ResourceBar, UnitPanel, ActionBar, AlertBanner backgrounds
- [ ] Texture is subtle (5-15% opacity) — enhances, doesn't distract
- [ ] Texture renders correctly at all breakpoints
- [ ] Verify in browser using dev-browser skill

---

### US-039: Rivet and bracket panel corner decorations
As a player, I want small rivet/bracket decorations on HUD panel corners so that panels feel like bolted military equipment.

**Dependencies:** US-034

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Create a reusable `PanelFrame` component or CSS utility that adds corner brackets
- [ ] Bracket style: L-shaped metal brackets at each corner (CSS borders or SVG)
- [ ] Optional rivet dots at bracket intersections
- [ ] Applied to major panels: UnitPanel, ActionBar, Minimap frame
- [ ] Decorations scale appropriately at all breakpoints
- [ ] Verify in browser using dev-browser skill

---

### US-040: Stencil and typewriter typography verification
As a developer, I want to verify and apply the correct typography stack (stencil for headers, typewriter for body, monospace for numbers) across all UI components.

**Dependencies:** US-034

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm build`

**Acceptance Criteria:**
- [ ] Headers (panel titles, menu buttons) use a stencil-style font (e.g., Black Ops One or similar)
- [ ] Body text uses a typewriter-style font
- [ ] Numbers (resource counts, HP values, timers) use a monospace font for alignment
- [ ] Font loading is handled via @fontsource or CSS @font-face
- [ ] Font weights and sizes follow a consistent scale
- [ ] Verify all text is readable at phone, tablet, and desktop sizes

---

### US-041: Enforce border-radius: 0 across all tactical components
As a developer, I want all tactical UI components to have sharp corners (no border-radius) to match the military aesthetic.

**Dependencies:** US-034

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] All HUD components (ResourceBar, UnitPanel, ActionBar, BuildMenu, Minimap, AlertBanner) have `border-radius: 0`
- [ ] All buttons in tactical context have `border-radius: 0`
- [ ] shadcn/ui base component overrides applied (remove default rounded corners)
- [ ] Menu/command-post components may retain slight rounding if deliberate
- [ ] Verify in browser using dev-browser skill

---

### TRACK G: PERSISTENCE & CAMPAIGN

---

### US-042: Wire save/load to game state
As a player, I want to save my current mission progress and reload it later so that I don't lose progress.

**Dependencies:** US-006

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `saveMission()` in `saveLoadSystem.ts` serializes all ECS entities with their traits to JSON
- [ ] `loadMission()` reconstructs entities from JSON, skipping runtime traits (PhaserSprite, SteeringAgent)
- [ ] Save includes: entity positions, health, resources, objectives, game clock, weather state
- [ ] Load restores the game to a visually identical state (sprites re-created by syncSystem)
- [ ] Round-trip test: save → load → game state matches original
- [ ] Add unit test verifying save/load round-trip integrity

---

### US-043: Auto-save on mission complete
As a player, I want the game to auto-save my campaign progress when I complete a mission so that I never lose my star ratings.

**Dependencies:** US-042

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] On victory, campaign progress (mission ID, star rating, difficulty) is persisted via `campaignRepo`
- [ ] On defeat, no campaign progress is saved (player retries from last state)
- [ ] Auto-save happens before the victory overlay is shown
- [ ] Auto-save is silent (no UI interruption)

---

### US-044: Manual save slots (1-3)
As a player, I want to save my mid-mission progress to one of 3 save slots so that I can experiment with different strategies.

**Dependencies:** US-042

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Save UI (accessible from pause menu) shows 3 save slots
- [ ] Each slot shows: mission name, save date/time, play time
- [ ] Clicking an empty slot saves immediately
- [ ] Clicking an occupied slot asks for confirmation before overwriting
- [ ] Save data stored via `saveRepo` with slot index
- [ ] Load UI shows the same 3 slots with "Load" buttons

---

### US-045: "Continue" button loads latest save
As a player, I want the "Continue" button on the main menu to resume my most recent save or campaign mission so that I can pick up where I left off.

**Dependencies:** US-042

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] "Continue" button on MainMenu reads latest save from `campaignRepo` or `saveRepo`
- [ ] If a mid-mission save exists, it loads that save
- [ ] If no mid-mission save, it starts the next uncompleted mission
- [ ] If no campaign progress exists, "Continue" is greyed out
- [ ] Loading transition shows a brief loading screen

---

### US-046: Campaign progress persistence across sessions
As a player, I want my completed missions, star ratings, and unlocked units/buildings to persist across browser sessions so that I can play over multiple sittings.

**Dependencies:** US-042

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `CampaignProgress` singleton data persisted via `campaignRepo` to SQLite/localStorage
- [ ] On app launch, campaign progress is loaded from storage into `CampaignProgress` singleton
- [ ] Mission completion records include: mission ID, star rating, completion time, difficulty
- [ ] Unlock state (units, buildings available per mission) derived from campaign progress
- [ ] Data survives browser refresh and session restart

---

### US-047: Settings persistence across sessions
As a player, I want my settings (volume, haptics, camera speed, UI scale) to persist across sessions.

**Dependencies:** US-042

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `UserSettings` singleton data persisted via `settingsRepo`
- [ ] On app launch, settings loaded from storage into `UserSettings` singleton
- [ ] Settings include: masterVolume, sfxVolume, musicVolume, haptics, cameraSpeed, uiScale
- [ ] Changing a setting in the Settings panel immediately persists it
- [ ] Default settings used when no saved settings exist

---

### US-048: Unlock state persistence (units, buildings, research)
As a player, I want my research completions and unit/building unlocks to persist so that I retain my tech progress.

**Dependencies:** US-042

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `CompletedResearch` singleton persisted as part of campaign save
- [ ] Research completed in any mission is globally available in subsequent missions
- [ ] Unit/building unlock progression (per mission gates from entity definitions) derived from campaign progress
- [ ] Research bonuses (stat upgrades) correctly applied on mission load

---

### TRACK H: MISSION RUNTIME

---

### US-049: Mission 1 (Beachhead) full playthrough validation
As a player, I want to play Mission 1 from start to victory in the browser, experiencing the complete gather → build → train → fight loop.

**Dependencies:** US-002, US-003, US-004, US-005, US-006

**Quality gate:** `pnpm typecheck && pnpm test:unit && pnpm test:browser`

**Acceptance Criteria:**
- [ ] Mission 1 loads: terrain paints, starting units spawn, resources placed
- [ ] All mission 1 objectives display in the objective tracker
- [ ] Player can gather timber and fish with starting River Rats
- [ ] Player can build a Barracks and train Mudfoots
- [ ] Player can attack and destroy enemy Scale-Guard units/buildings
- [ ] All scenario triggers fire at the correct times (reinforcements, dialogue)
- [ ] Victory condition triggers when all objectives are complete
- [ ] Star rating calculates and displays on the victory overlay
- [ ] Mission is completable within the 8-minute par time
- [ ] Verify by playing through in browser using dev-browser skill

---

### US-050: Campaign progression UI
As a player, I want to select missions from a campaign view, see which are completed with star ratings, and launch the next available mission.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] "New Game" starts at Mission 1 with difficulty selection
- [ ] After completing a mission, the next mission unlocks
- [ ] Campaign view shows all 16 missions organized by chapter (4 chapters × 4 missions)
- [ ] Completed missions show earned star rating (bronze/silver/gold)
- [ ] Locked missions are visually distinct (greyed out, padlock icon)
- [ ] Clicking an unlocked mission loads its briefing
- [ ] Verify in browser using dev-browser skill

---

### US-051: Difficulty mode selection
As a player, I want to choose Support, Tactical, or Elite difficulty before starting a campaign so that the challenge matches my skill level.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Difficulty selection screen appears before first mission (or when starting new campaign)
- [ ] Three options with descriptions: Support (0.75x enemy damage, 1.25x player resources), Tactical (1x/1x), Elite (1.25x/0.75x)
- [ ] Selected difficulty stored in `CampaignProgress` singleton
- [ ] Difficulty modifiers applied to combat and economy systems
- [ ] Difficulty cannot be lowered mid-campaign (one-way escalation)
- [ ] Verify in browser using dev-browser skill

---

### US-052: Mission briefing dialogue via CommandTransmissionPanel
As a player, I want to see a mission briefing delivered as in-game radio transmissions at the start of each mission so that I feel narratively immersed.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] On mission start, `CommandTransmissionPanel` displays briefing dialogue from the mission definition
- [ ] Speaker portrait shows the briefing character (Foxhound for early missions, Gen. Whiskers for later)
- [ ] Dialogue plays line-by-line with the typewriter animation (US-036)
- [ ] Player can skip briefing by clicking a "Skip" button
- [ ] After briefing completes, game transitions to playing phase
- [ ] All 16 missions have authored briefing text in their mission definitions

---

### US-053: Star rating display on mission completion
As a player, I want to see my star rating (bronze/silver/gold) broken down by time, survival, and bonus objectives so that I understand how I performed.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Victory overlay shows overall star rating (1-3 stars or bronze/silver/gold)
- [ ] Breakdown shows: Time Score (40%), Survival Score (30%), Bonus Score (30%)
- [ ] Each category shows current score vs. threshold
- [ ] Star icon animates on reveal (stamp effect or shine)
- [ ] "Next Mission" button visible if more missions available
- [ ] "Replay" button to retry for a better score
- [ ] Verify in browser using dev-browser skill

---

### US-054: Missions 2-4 scripting and validation
As a player, I want Missions 2 (Causeway escort), 3 (Firebase Delta capture), and 4 (Prison Break stealth) to be playable and validated.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mission 2: Convoy escort scripting works — convoy moves, player defends, ambush triggers fire
- [ ] Mission 3: Capture-point mechanic works — hold 3 points for 2 minutes each
- [ ] Mission 4: Stealth hero mission works — alarm system, detection radius, hero solo play
- [ ] All scenario triggers fire correctly for each mission
- [ ] Victory and defeat conditions work for each mission
- [ ] Each mission completable within par time

---

### US-055: Missions 5-8 scripting and validation
As a player, I want Missions 5-8 (Siphon Valley, Monsoon Ambush, River Rats CTF, Underwater Cache) to be playable.

**Dependencies:** US-054

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mission 5: Multiple destroy objectives with full base build
- [ ] Mission 6: Weather system affects gameplay (monsoon reduces visibility/accuracy), wave defense
- [ ] Mission 7: CTF mechanic — grab supply crates from enemy side, water traversal
- [ ] Mission 8: Hero underwater stealth mission — Submerged mechanic, CanSwim units
- [ ] All scenario triggers, objectives, and special mechanics work
- [ ] Each mission completable within par time

---

### US-056: Missions 9-12 scripting and validation
As a player, I want Missions 9-12 (Dense Canopy, Healer's Grove, Entrenchment, The Stronghold) to be playable.

**Dependencies:** US-055

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mission 9: Heavy fog skirmish — fog system creates tense close-range combat
- [ ] Mission 10: Village liberation — 5 villages to free, territory tracking works
- [ ] Mission 11: 12-wave defense — wave spawner escalation, fortification mechanics
- [ ] Mission 12: Siege mission — assault Scale-Guard stronghold, siege mechanics work
- [ ] All scenario triggers, objectives, and special mechanics validated
- [ ] Each mission completable within par time

---

### US-057: Missions 13-16 scripting and validation
As a player, I want Missions 13-16 (Supply Lines, Gas Depot, Sacred Sludge, The Reckoning) to be playable, completing the campaign.

**Dependencies:** US-056

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mission 13: Multi-base mission — uses canonical "good enough" base state (not M11 save), multi-base resource pooling
- [ ] Mission 14: Hero demolition mission — Sapper-focused, destroy gas depot objectives
- [ ] Mission 15: Sludge flood mechanic — rising sludge on timer, evacuation pressure
- [ ] Mission 16: 3-phase boss fight — escalating phases, all player capabilities needed
- [ ] All scenario triggers, objectives, and special mechanics validated
- [ ] Final campaign completion celebration (credits or special victory screen)
- [ ] Each mission completable within par time

---

### TRACK I: MOBILE & RESPONSIVE

---

### US-058: Touch to game command dispatch integration
As a mobile player, I want to tap to select units and use touch gestures to issue commands so that the game is playable on phones and tablets.

**Dependencies:** US-008, US-010

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Tap on unit selects it (shows selection highlight + populates UnitPanel)
- [ ] Tap on ground with unit selected moves the unit
- [ ] Tap on enemy with unit selected attacks the enemy
- [ ] Tap on resource with worker selected starts gathering
- [ ] `MobileInput` correctly translates gestures into the same commands as desktop input
- [ ] Selection and command work without false positives from camera gestures

---

### US-059: Two-finger camera pan and pinch-to-zoom
As a mobile player, I want to pan the camera with two-finger drag and zoom with pinch so that I can navigate the battlefield on touch devices.

**Dependencies:** US-058

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Two-finger drag pans the camera smoothly
- [ ] Pinch-to-zoom changes camera zoom level within device limits
- [ ] Camera gestures don't interfere with single-finger selection/commands
- [ ] Gesture detection from `gestureDetector.ts` correctly discriminates pan/zoom/tap
- [ ] Camera inertia for natural-feeling pan (optional)

---

### US-060: Long-press for mobile commands and minimap enlarge
As a mobile player, I want to long-press for context menus and tap the minimap to enlarge it so that advanced commands are accessible on touch.

**Dependencies:** US-058

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Long-press on ground shows a radial command menu (Move, Attack-Move, Patrol, Rally)
- [ ] Long-press on a unit shows unit-specific options (abilities, special commands)
- [ ] Long-press duration: 500ms before menu appears
- [ ] Minimap tap enlarges to 40% of screen for precise navigation
- [ ] Tapping outside enlarged minimap shrinks it back
- [ ] Landscape orientation lock via Capacitor `ScreenOrientation` during gameplay

---

### US-061: Touch target sizing validation (44px minimum)
As a mobile player, I want all interactive elements to be at least 44px so that I can tap accurately on a phone screen.

**Dependencies:** US-058

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] All buttons in ActionBar, BuildMenu, and menus are minimum 44x44px tap targets
- [ ] Resource bar elements have adequate spacing for touch
- [ ] Minimap has adequate hit area
- [ ] Unit panel interactive elements meet 44px minimum
- [ ] Audit all interactive components at phone breakpoint
- [ ] Verify in browser using dev-browser skill at mobile viewport

---

### US-062: HUD layout at phone breakpoint (< 600px)
As a mobile player, I want the HUD to be usable on a phone screen with nothing overlapping or cut off.

**Dependencies:** US-058

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Resource bar fits within phone width (horizontal scroll or compact layout)
- [ ] ActionBar positioned as bottom-screen overlay (thumb-reachable)
- [ ] UnitPanel collapses to a compact card at the bottom
- [ ] Minimap positioned in a corner, enlargeable on tap
- [ ] Game clock and objectives visible but minimal
- [ ] No elements overlap the Phaser game canvas at phone width
- [ ] Verify in browser using dev-browser skill at 375px width

---

### US-063: HUD layout at tablet breakpoint (600-1024px)
As a tablet player, I want the HUD to use the extra space without feeling sparse.

**Dependencies:** US-058

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Resource bar has comfortable spacing
- [ ] ActionBar may use a sidebar layout (classic RTS sidebar)
- [ ] UnitPanel has room for full stats display
- [ ] Minimap is larger than phone but not taking excessive space
- [ ] Layout transitions smoothly between phone and tablet
- [ ] Verify in browser using dev-browser skill at 768px and 1024px width

---

### US-064: HUD layout at desktop breakpoint (> 1024px)
As a desktop player, I want the full classic RTS layout with sidebar, minimap, and spacious panels.

**Dependencies:** US-058

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Classic RTS sidebar layout (left or right side) with minimap + unit panel + action panel stacked
- [ ] Resource bar spans the top of the game area
- [ ] Tooltips appear on hover for all interactive elements
- [ ] Layout matches the design bible's command-post aesthetic
- [ ] Verify in browser using dev-browser skill at 1280px and 1920px width

---

### TRACK J: AI & PLAYTESTING

---

### US-065: Wire Yuka FSM profiles to game entities
As a developer, I want all enemy unit types to use their Yuka FSM profiles so that enemies behave according to their defined AI patterns.

**Dependencies:** US-001

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Spawning a Scale-Guard entity creates a Yuka Vehicle with the correct FSM profile from `src/ai/fsm/profiles.ts`
- [ ] Each enemy type (Gator, Viper, Scout Lizard, Croc Champion, Siphon Drone, Snapper, Skink) has a distinct FSM profile
- [ ] FSM states (Idle, Patrol, Alert, Chase, Attack, Flee, etc.) transition correctly based on perception
- [ ] AI entities use Yuka pathfinding to navigate terrain
- [ ] Add integration test verifying FSM state transitions for at least 2 enemy types

---

### US-066: Enemy AI behavior — Gator and Croc Champion
As a player, I want Gators and Croc Champions to feel like dangerous ambush predators that are distinct from each other.

**Dependencies:** US-065

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Gator: idle → patrol area → alert when player unit enters vision → chase → melee attack → return to patrol if target lost
- [ ] Croc Champion: patrol → engage when player enters range → berserk mode below 50% HP (increased speed/damage) → does not flee
- [ ] Both use their correct stat values from entity definitions
- [ ] Behavior differences are visible and meaningful in gameplay

---

### US-067: Enemy AI behavior — Viper, Scout Lizard, Siphon Drone
As a player, I want ranged/support enemy types to behave differently from melee enemies, creating tactical variety.

**Dependencies:** US-065

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Viper: patrol → snipe at max range when enemy spotted → flee when enemy closes to melee range → re-engage at range
- [ ] Scout Lizard: patrol → spot player units → signal alert (triggers nearby enemies to Alert state) → flee
- [ ] Siphon Drone: approach player buildings → drain resources → retreat when threatened
- [ ] Each behavior creates distinct tactical challenges for the player

---

### US-068: Wave spawner escalation for defense missions
As a player, I want defense missions to have escalating enemy waves that become progressively more challenging.

**Dependencies:** US-065

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Wave spawner reads wave definitions from mission `ScenarioTrigger` data
- [ ] Early waves are small (2-3 basic enemies)
- [ ] Later waves add variety (mixed unit types) and increase count
- [ ] Boss waves include Croc Champions or special units
- [ ] Wave timing is configurable per mission
- [ ] Difficulty scaling applies to wave composition (Support = smaller, Elite = larger per balance-framework.md)
- [ ] Wave number indicator visible to player ("Wave 3/8")

---

### US-069: AI difficulty scaling per mode
As a player, I want enemies to be easier on Support difficulty and harder on Elite difficulty, with scaling that feels fair.

**Dependencies:** US-065

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Support: enemy damage ×0.75, player resource income ×1.25
- [ ] Tactical: all values at 1.0x (baseline)
- [ ] Elite: enemy damage ×1.25, player resource income ×0.75
- [ ] Difficulty read from `CampaignProgress` singleton
- [ ] Modifiers applied in `combatSystem` and `economySystem`
- [ ] Add unit tests verifying modifier application

---

### US-070: Playtester — full Mission 1 automated playthrough
As a developer, I want the AI playtester to complete Mission 1 autonomously so that I can validate the entire game loop without manual play.

**Dependencies:** US-001, US-049

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] AIPlaytester runs perception → goal arbitration → action execution loop
- [ ] Playtester successfully: gathers resources, builds a Barracks, trains Mudfoots, attacks enemies
- [ ] Playtester completes Mission 1 objectives and triggers victory
- [ ] Run produces a log of all actions taken and game state snapshots
- [ ] Playtester completes within 2x par time (16 minutes)
- [ ] Add automated test that runs playtester on Mission 1

---

### US-071: Playtester strategy profiles
As a developer, I want the playtester to support different strategy profiles (aggressive, defensive, economic) so that I can test diverse play patterns.

**Dependencies:** US-070

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Aggressive profile: prioritizes combat units and early attacks
- [ ] Defensive profile: prioritizes walls/towers and army composition before advancing
- [ ] Economic profile: prioritizes resource infrastructure before military
- [ ] Each profile produces a different build order and engagement timing
- [ ] Profiles are selectable as a parameter to the playtester

---

### US-072: Balance validation automation
As a developer, I want automated combat simulation tests so that I can validate the balance framework's counter matrix.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Test: 3 Mudfoots vs 2 Gators → Gators should win (Gator counters Mudfoot)
- [ ] Test: 3 Shellcrackers vs 2 Gators → Shellcrackers should win (kiting at range)
- [ ] Test: 2 Sappers vs 1 Scale Wall → Sappers should destroy wall efficiently
- [ ] Test: 1 Mortar Otter vs 4 clustered Gators → Mortar AoE should deal significant damage
- [ ] Tests run in headless mode without Phaser rendering
- [ ] Results logged with margin of victory (HP remaining, time elapsed)

---

### TRACK K: SPRITE & ASSET QUALITY

---

### US-073: Visual QC — render all sprites at game zoom
As a developer, I want to render every SP-DSL sprite at 1x, 2x, and 3x zoom and visually verify readability so that sprites look good in-game.

**Dependencies:** none

**Quality gate:** `pnpm build:sprites && pnpm typecheck`

**Acceptance Criteria:**
- [ ] Build all sprites via `pnpm build:sprites`
- [ ] Create a visual QC page/test that renders every entity sprite at 1x, 2x, and 3x scale
- [ ] Each unit is identifiable by silhouette at game zoom (no two units look identical)
- [ ] Each building is identifiable by silhouette at game zoom
- [ ] Faction colors (URA blue vs SG red) are instantly distinguishable
- [ ] Document any sprites that need revision

---

### US-074: Portrait quality consistency check
As a developer, I want all character portraits to have consistent quality and style so that the briefing/transmission UI looks polished.

**Dependencies:** none

**Quality gate:** `pnpm build:sprites && pnpm typecheck`

**Acceptance Criteria:**
- [ ] All 7 portraits (Foxhound, Sgt. Bubbles, Gen. Whiskers, Cpl. Splash, Sgt. Fang, Medic Marina, Pvt. Muskrat) render at consistent quality
- [ ] Eyes are visible and expression is readable at display size
- [ ] Color palettes are consistent across all portraits
- [ ] Portraits look good in the `TransmissionPortrait` component at all breakpoints
- [ ] Document any portraits that need revision

---

### US-075: Verify all entity animations exist
As a developer, I want to verify that all unit types have idle, walk, and attack animation frames so that animations don't break at runtime.

**Dependencies:** none

**Quality gate:** `pnpm build:sprites && pnpm typecheck`

**Acceptance Criteria:**
- [ ] Every unit type (7 URA + 7 SG + 6 heroes) has: idle frame(s), walk cycle frame(s), attack frame(s)
- [ ] Building types have: complete frame, under-construction frame (or alpha variation)
- [ ] Animation frame transitions are smooth (no jarring jumps)
- [ ] Missing animations are documented with placeholder frames identified
- [ ] Sprite atlas JSON correctly references all animation frames

---

### US-076: Tile seam QC at game zoom
As a developer, I want to verify that terrain tiles don't show visible grid seams at game zoom so that the world looks organic.

**Dependencies:** none

**Quality gate:** `pnpm build:sprites && pnpm typecheck`

**Acceptance Criteria:**
- [ ] Load a mission map in the browser and zoom to game-play level
- [ ] No visible grid lines between adjacent tiles of the same type
- [ ] Transition tiles between different terrain types (grass→water, grass→mud) look natural
- [ ] Document any tile seam issues for art revision

---

### US-077: Recon photo images and TOP SECRET stamp for briefings
As a player, I want mission briefings to include black-and-white recon-style photos and a TOP SECRET stamp so that the dossier aesthetic is complete.

**Dependencies:** US-035

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Each mission briefing includes at least one "recon photo" (SP-DSL rendered image with greyscale + grain filter)
- [ ] Photos show mission terrain/objectives in a surveillance camera aesthetic
- [ ] "TOP SECRET" red stamp overlay rendered at a slight angle on briefing
- [ ] Commander's pawprint signature rendered below briefing text
- [ ] Assets generated via the SP-DSL pipeline (no external images)

---

### TRACK L: SKIRMISH MODE

---

### US-078: Skirmish map selection UI
As a player, I want to select a skirmish map, choose difficulty, and start a match so that I can play RTS battles outside the campaign.

**Dependencies:** US-049, US-071

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] "Skirmish" option accessible from main menu
- [ ] Map selection screen shows available maps with previews
- [ ] Maps unlock based on campaign star count (specified per map)
- [ ] Difficulty selection: Easy/Medium/Hard/Brutal
- [ ] "Play as Scale-Guard" toggle (mirror units for enemy faction)
- [ ] Start button launches the selected map
- [ ] Verify in browser using dev-browser skill

---

### US-079: Procedural map generation for skirmish
As a player, I want skirmish maps to be procedurally generated with balanced terrain, resources, and starting positions so that each match feels fresh.

**Dependencies:** US-078

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Map generator takes: size (small/medium/large), terrain type (jungle/swamp/river)
- [ ] Generates terrain using noise (Perlin or simplex) with biome regions
- [ ] Places starting positions for player and AI (symmetric or fair-balanced)
- [ ] Seeds resource nodes evenly between starting positions
- [ ] Adds natural chokepoints (bridges, passes) for strategic depth
- [ ] Generated maps pass pathfinding validation (no unreachable areas)
- [ ] Add unit test verifying map generation produces valid, pathable terrain

---

### US-080: AI opponent for single-player skirmish
As a player, I want an AI opponent that builds a base, trains an army, and attacks me so that skirmish mode is a real challenge.

**Dependencies:** US-079

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Skirmish AI follows a build order: workers → resource infrastructure → barracks → army
- [ ] AI scouts with early units to find the player's base
- [ ] AI attacks when army reaches a threshold size
- [ ] AI difficulty affects: build speed, army composition, aggression timing
- [ ] Easy: slow build, small armies, predictable attacks
- [ ] Brutal: fast build, optimized composition, multi-prong attacks
- [ ] Win condition: destroy enemy Command Post

---

### US-081: Skirmish victory condition and star unlocks
As a player, I want skirmish victories to feel rewarding and unlock more skirmish maps via campaign stars.

**Dependencies:** US-078

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Win condition: destroy enemy Command Post
- [ ] Lose condition: player Command Post destroyed
- [ ] Victory screen shows: time elapsed, units trained, units lost, resources gathered
- [ ] Skirmish maps require campaign stars to unlock (configured per map)
- [ ] 100% campaign gold star completion unlocks all skirmish maps

---

### TRACK M: TESTING & QUALITY

---

### US-082: Fix pre-existing test failures
As a developer, I want all pre-existing test failures fixed so that CI is green and new regressions are detectable.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Fix unit-panel test failures (noted in roadmap)
- [ ] Fix resource-bar test failures (noted in roadmap)
- [ ] `pnpm test:unit` passes with 0 failures
- [ ] `pnpm typecheck` passes with 0 errors
- [ ] `pnpm lint` passes with 0 errors

---

### US-083: E2E — menu to new game to mission loads
As a developer, I want a Playwright E2E test that verifies the critical path from main menu through new game to a mission loading.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm test:e2e`

**Acceptance Criteria:**
- [ ] Playwright test navigates: launch app → main menu visible → click "New Game" → select difficulty → Mission 1 loads
- [ ] Verify Phaser canvas is rendered and non-empty
- [ ] Verify ResourceBar is visible with starting resources
- [ ] Verify at least one player unit is visible on the map
- [ ] Test runs headless in CI (no display required)

---

### US-084: E2E — settings panel opens and saves
As a developer, I want a Playwright E2E test verifying settings persistence so that settings don't silently break.

**Dependencies:** US-047

**Quality gate:** `pnpm typecheck && pnpm test:e2e`

**Acceptance Criteria:**
- [ ] Playwright test: main menu → click Settings → settings panel visible
- [ ] Change a setting (e.g., music volume slider)
- [ ] Close settings → reopen → verify setting persisted
- [ ] Back button returns to main menu

---

### US-085: Browser tests — gather, combat, building, training loops
As a developer, I want browser-mode Vitest tests that validate each core gameplay loop works in a browser environment.

**Dependencies:** US-002, US-003, US-004, US-005

**Quality gate:** `pnpm typecheck && pnpm test:browser`

**Acceptance Criteria:**
- [ ] Browser test: worker gathers resource → deposit → ResourcePool increases
- [ ] Browser test: unit attacks enemy → enemy HP decreases → enemy dies at 0 HP
- [ ] Browser test: building placed → construction ticks → building completes at 100%
- [ ] Browser test: unit queued at building → production ticks → unit spawns
- [ ] All tests use the browser Vitest config (`vitest.browser.config.ts`)
- [ ] Tests run in headless browser (Playwright chromium)

---

### US-086: Pathfinding performance — stagger queue
As a developer, I want pathfinding requests staggered to max 4 per frame so that group movement doesn't cause frame drops.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Implement a pathfinding request queue in `src/ai/pathfinder.ts`
- [ ] Maximum 4 pathfinding calculations per frame tick
- [ ] Excess requests queued and processed in subsequent frames
- [ ] Units waiting for paths show a brief "thinking" state (not frozen)
- [ ] Add unit test verifying queue behavior under load (20+ simultaneous requests)

---

### US-087: Path caching for group movement
As a developer, I want units moving to the same destination to share pathfinding results so that group commands are efficient.

**Dependencies:** US-086

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] When multiple units receive Move orders to the same destination, only one pathfinding calculation occurs
- [ ] Cached path is shared with slight offset per unit (formation spread)
- [ ] Cache invalidated when terrain changes (building placed/destroyed)
- [ ] Cache TTL of 5 seconds (paths expire to prevent stale routing)

---

### US-088: Large battle performance profiling
As a developer, I want to profile and optimize scenarios with 20+ units in combat so that the game runs at 60fps on mobile.

**Dependencies:** US-005

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Create a benchmark scenario: 20 URA units vs 20 SG units in combat
- [ ] Profile frame time breakdown: ECS systems, Phaser rendering, pathfinding, AI
- [ ] Identify bottlenecks and optimize (spatial partitioning, object pooling, etc.)
- [ ] Target: maintain 30fps+ on mid-tier mobile device (iPhone 12 equivalent)
- [ ] Target: maintain 60fps on desktop
- [ ] Document performance findings and optimizations applied

---

### US-089: Bundle size audit and optimization
As a developer, I want the production bundle to be as small as possible for fast mobile loading.

**Dependencies:** none

**Quality gate:** `pnpm build && pnpm typecheck`

**Acceptance Criteria:**
- [ ] Run `pnpm build:analyze` and document current bundle composition
- [ ] Identify largest dependencies (Phaser, Tone.js, React, Yuka)
- [ ] Apply tree-shaking optimizations where possible
- [ ] Lazy-load Phaser and Tone.js (only import when game screen is entered)
- [ ] Target: initial bundle < 500KB gzipped (excluding game assets)
- [ ] Document size before and after optimization

---

### US-090: Loading screen with progress bar
As a player, I want to see a loading screen with a progress bar while assets load so that I know the game isn't frozen.

**Dependencies:** none

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] `BootScene.ts` loading bar is styled to match the military theme
- [ ] Progress bar shows: asset name being loaded, percentage complete
- [ ] Loading screen has the game logo and a military-themed background
- [ ] Smooth progress animation (no jumping from 0% to 100%)
- [ ] Loading screen appears immediately (before any heavy asset loading)
- [ ] Verify in browser using dev-browser skill

---

### TRACK N: ACCESSIBILITY

---

### US-091: WCAG AA contrast validation
As a developer, I want all text and UI elements to meet WCAG AA contrast ratios so that the game is accessible.

**Dependencies:** US-064

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] Audit all text/background color combinations against WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Fix any failing combinations (adjust palette values or text colors)
- [ ] Verify after art direction theme is applied (US-034)
- [ ] Document any intentional exceptions (e.g., decorative text)

---

### US-092: Reduced motion and screen reader support
As a player with accessibility needs, I want to disable animations and have screen reader labels on major UI elements so that I can use the game with assistive technology.

**Dependencies:** US-064

**Quality gate:** `pnpm typecheck && pnpm lint`

**Acceptance Criteria:**
- [ ] `prefers-reduced-motion` media query respected: disable typewriter animation, floating text animation, particle effects
- [ ] Major UI elements have `aria-label` attributes: resource counts, buttons, panels
- [ ] Keyboard navigation works for menus (Tab, Enter, Escape)
- [ ] Focus indicators visible on interactive elements
- [ ] Settings panel accessible via keyboard only

---

### TRACK O: NATIVE BUILDS

---

### US-093: Capacitor iOS and Android builds
As a developer, I want the game to build and run as native iOS and Android apps via Capacitor.

**Dependencies:** US-062

**Quality gate:** `pnpm typecheck && pnpm build`

**Acceptance Criteria:**
- [ ] `npx cap init` configured for iOS and Android platforms
- [ ] `npx cap sync` copies web build to native projects
- [ ] iOS build runs in Xcode simulator
- [ ] Android build runs in Android Studio emulator
- [ ] Touch input works correctly on both platforms
- [ ] Landscape orientation enforced during gameplay

---

### US-094: SQLite persistence via Capacitor
As a mobile player, I want save data stored in native SQLite so that it persists reliably on device.

**Dependencies:** US-093, US-042

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] `CapacitorDatabase` adapter from `src/persistence/database.ts` works on iOS and Android
- [ ] Campaign progress, save slots, and settings persist across app restarts
- [ ] Database migrations run on first launch and app updates
- [ ] Fallback to `JeepSQLiteDatabase` (WASM) on web

---

### US-095: Touch haptics for combat and selection
As a mobile player, I want to feel haptic feedback when selecting units and during combat so that the game feels tactile.

**Dependencies:** US-093

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Light haptic on unit selection
- [ ] Medium haptic on combat hit
- [ ] Heavy haptic on building complete or unit death
- [ ] Haptics respect `UserSettings.haptics` toggle
- [ ] Haptics use Capacitor Haptics API
- [ ] No-op on web platform (graceful degradation)

---

### TRACK P: TUTORIAL & ONBOARDING

---

### US-096: Tutorial prompts for missions 1-4
As a new player, I want contextual tutorial prompts during the first 4 missions that teach me the game mechanics without being intrusive.

**Dependencies:** US-049

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mission 1: "Click a worker, then right-click a tree to gather timber" prompt when game starts
- [ ] Mission 1: "Click a worker, then click Build to construct a Barracks" prompt after first gather
- [ ] Mission 2: "Right-click to set a waypoint for your escort units" prompt
- [ ] Mission 3: "Move units into the capture zone to start capturing" prompt
- [ ] Mission 4: "Stay out of the red detection radius to avoid alerting enemies" prompt
- [ ] Prompts appear as dismissible overlays with arrow pointing to relevant UI element
- [ ] Prompts only show on first playthrough of each mission (tracked in campaign progress)
- [ ] "Skip Tutorials" option in settings

---

### US-097: Tooltip system for units, buildings, and abilities
As a player, I want to see tooltips with stats, costs, and descriptions when hovering over UI elements so that I can learn without a manual.

**Dependencies:** US-014

**Quality gate:** `pnpm typecheck && pnpm lint && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Hovering over a train button shows: unit name, cost (fish/timber/salvage), HP, damage, description
- [ ] Hovering over a build button shows: building name, cost, HP, what it does
- [ ] Hovering over a research option shows: name, cost, time, effect description
- [ ] Tooltips use the military theme (dark bg, stencil header, typewriter body)
- [ ] Tooltips use Radix UI Tooltip component from existing dependencies
- [ ] Tooltips don't appear on mobile (touch doesn't have hover)

---

### US-098: Error feedback for invalid commands
As a player, I want to hear and see feedback when I try an invalid action (not enough resources, can't build here, can't train — population full) so that I understand why my command failed.

**Dependencies:** US-030

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] "Not enough resources" — error buzz SFX + red flash on the lacking resource in ResourceBar
- [ ] "Can't build here" — error buzz + red ghost overlay (already in US-022)
- [ ] "Population cap reached" — error buzz + red flash on population counter
- [ ] "Already researching" — error buzz
- [ ] Error messages appear as brief floating text or AlertBanner
- [ ] Error feedback is immediate and dismisses quickly (1 second)

---

### TRACK Q: DOCS & CLEANUP

---

### US-099: Delete obsolete documentation
As a developer, I want obsolete docs removed so that the repo doesn't mislead contributors.

**Dependencies:** none

**Quality gate:** no code quality gates

**Acceptance Criteria:**
- [ ] Delete: `docs/DESIGN-SYSTEM.md`
- [ ] Delete: `docs/DOMAIN-STANDARD.md`
- [ ] Delete: `docs/ECOSYSTEM.md`
- [ ] Delete: `docs/BUNDLE_SIZE.md`
- [ ] Delete: `docs/superpowers/specs/2026-03-23-rts-pivot-design.md`
- [ ] Delete: `docs/superpowers/specs/2026-03-24-entity-architecture-design.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-23-master-index.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-23-phase-1-foundation.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-23-phase-2-depth.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-23-phase-3-scale.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-23-phase-4-culmination.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-24-entity-architecture.md`
- [ ] Delete: `docs/superpowers/plans/2026-03-24-ui-spdsl-implementation.md`
- [ ] Verify no remaining docs reference deleted files

---

### US-100: Keep canonical docs accurate
As a developer, I want canonical docs to stay aligned with the implementation so that docs are trustworthy.

**Dependencies:** US-099

**Quality gate:** no code quality gates

**Acceptance Criteria:**
- [ ] `docs/architecture/overview.md` matches current screen flow, system list, and tech stack
- [ ] `docs/architecture/testing-strategy.md` matches current test commands and patterns
- [ ] `AGENTS.md` and `CLAUDE.md` reflect any new systems, components, or conventions added
- [ ] `docs/README.md` source-of-truth order is still correct
- [ ] `TESTING.md` matches current test commands
- [ ] `LORE.md` is consistent with implemented mission dialogue

---

### TRACK R: PER-MISSION AI & FULL E2E

---

### US-101: Per-mission Yuka GOAP behavioral/steering profiles
As a developer, I want each of the 16 missions to have a corresponding Yuka GOAP behavioral and steering structure that covers its unique challenges, so that the AI playtester and E2E harness can exercise every mission's mechanics.

**Dependencies:** US-065, US-049

**Quality gate:** `pnpm typecheck && pnpm test:unit`

**Acceptance Criteria:**
- [ ] Mission 1 (Beachhead): basic gather/build/attack GOAP goal graph
- [ ] Mission 2 (Causeway): escort-protect steering — keep units near convoy, intercept ambushers
- [ ] Mission 3 (Firebase Delta): capture-zone occupation — move squads to zones, hold position
- [ ] Mission 4 (Prison Break): stealth avoidance steering — path around detection radii, hero solo
- [ ] Mission 5 (Siphon Valley): multi-objective destroy — prioritize targets, split forces
- [ ] Mission 6 (Monsoon Ambush): wave defense with weather awareness — reposition during monsoon
- [ ] Mission 7 (River Rats): CTF flag-carry steering — grab-and-return with water traversal
- [ ] Mission 8 (Underwater Cache): submerged stealth — CanSwim pathfinding, avoid patrols
- [ ] Mission 9 (Dense Canopy): fog-of-war skirmish — cautious advance, recon-before-engage
- [ ] Mission 10 (Healer's Grove): liberation sweep — visit all 5 villages, clear defenders
- [ ] Mission 11 (Entrenchment): 12-wave defense — fortify, repair, triage reinforcements
- [ ] Mission 12 (The Stronghold): siege assault — breach walls, focus fire on defenses
- [ ] Mission 13 (Supply Lines): multi-base logistics — split economy across bases
- [ ] Mission 14 (Gas Depot): hero demolition — Sapper pathfinding to objectives, avoid patrols
- [ ] Mission 15 (Sacred Sludge): evacuation under time pressure — retreat steering as sludge rises
- [ ] Mission 16 (The Reckoning): 3-phase boss — phase-aware target switching, full army coordination
- [ ] Each profile is a composable GOAP goal graph, not a hardcoded script
- [ ] Each profile has a unit test verifying goal selection under representative game state

---

### US-102: E2E automated playthrough for all 16 missions
As a developer, I want E2E tests that play through every mission from start to victory using the per-mission GOAP profiles, so that the entire campaign is validated end-to-end.

**Dependencies:** US-101, US-054, US-055, US-056, US-057

**Quality gate:** `pnpm typecheck && pnpm test:e2e`

**Acceptance Criteria:**
- [ ] E2E test for each mission (16 total) that boots the mission, runs the GOAP playtester, and asserts victory
- [ ] Each test completes within 3× par time (timeout guard)
- [ ] Each test verifies: all objectives completed, victory overlay shown, star rating calculated
- [ ] Tests run headless in CI (Playwright + Phaser headless or browser mode)
- [ ] Failure produces a game-state snapshot log for debugging
- [ ] Tests can run in parallel (one mission per worker) for CI speed
- [ ] All 16 tests pass on the default (Tactical) difficulty

---

## Functional Requirements

- FR-1: All 14 ECS systems must execute in the correct order each frame via `tickAllSystems()`
- FR-2: The gather → build → train → fight → advance core loop must work end-to-end in the browser
- FR-3: All 16 campaign missions must be playable from start to victory/defeat
- FR-4: Campaign progress, save data, and settings must persist across sessions
- FR-5: The game must be playable on phone (< 600px), tablet (600-1024px), and desktop (> 1024px)
- FR-6: Touch input must support all commands available via mouse/keyboard
- FR-7: The UI must follow the Copilot design bible's analog-military aesthetic
- FR-8: Audio must initialize on first user gesture and play through all gameplay events
- FR-9: Enemy AI must use FSM-based behavior profiles with difficulty scaling
- FR-10: Skirmish mode must support procedural maps and AI opponents
- FR-11: All interactive elements must meet 44px minimum touch targets on mobile
- FR-12: Performance must sustain 30fps+ on mobile for 20+ unit battles
- FR-13: `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, and `pnpm build` must pass at all times
- FR-14: Each mission must have a per-mission Yuka GOAP behavioral/steering profile covering its unique mechanics
- FR-15: E2E automated playthroughs must validate all 16 missions from start to victory

## Non-Goals (Out of Scope)

- Multiplayer / online play
- Custom map editor
- Mod support or plugin system
- Voice acting (audio is procedural synthesis only)
- Loot boxes, microtransactions, or real-money purchases
- iOS/Android App Store submissions (builds only — distribution is future work)
- System theme auto-detection for dark/light mode
- Localization / internationalization (English only for now)
- Custom color schemes or player-selected UI themes
- Achievement system or leaderboards
- Cloud save sync across devices
- WebRTC or WebSocket networking
- Replay system

## Technical Considerations

- **Phaser 3 + React 19 coordination:** HUD components in React must communicate with Phaser game via EventBus (`src/game/EventBus.ts`). Avoid direct Phaser references in React components.
- **Koota ECS performance:** Singleton reads in React should use Koota's `useQuery` or equivalent hooks, not raw world queries. Minimize re-renders by scoping trait subscriptions.
- **Tone.js initialization:** WebKit (Safari/iOS) requires `Tone.start()` inside a user gesture handler. This must happen before any audio playback.
- **Capacitor SQLite:** Web uses WASM-based JeepSQLite; native uses Capacitor SQLite plugin. The `DatabaseAdapter` interface abstracts this. Test both paths.
- **SP-DSL sprite pipeline:** `pnpm build:sprites` must be run after any entity definition changes. The build generates atlas PNGs and JSON manifests to `public/assets/`.
- **Pathfinding with Yuka:** NavMesh graph is built per-mission from terrain data. Large maps may need graph simplification for performance.
- **Save/Load serialization:** Non-serializable traits (`PhaserSprite`, `SteeringAgent`) are skipped during save and recreated by `syncSystem` on load.

## Success Metrics

- All 16 campaign missions are playable from start to victory in a browser
- `pnpm test:all` passes with 0 failures
- `pnpm build` produces a working production bundle
- Game maintains 30fps+ on iPhone 12 equivalent during 20-unit battles
- Initial page load to interactive menu < 3 seconds on desktop
- Production bundle < 500KB gzipped (excluding game assets)
- AI playtester can complete all 16 missions autonomously via per-mission GOAP profiles
- E2E automated playthroughs pass for all 16 missions on Tactical difficulty
- All text meets WCAG AA contrast ratios

## Resolved Questions

1. **Skirmish AI vs campaign AI?** → Share the FSM base (patrol/chase/attack/flee profiles are identical), extend with an economy/tech planning layer for skirmish. US-080 already structures it this way.
2. **Skirmish map count + shareable seeds?** → 3 hand-tuned templates (small/medium/large) + procedural generation with shareable seeds. Display seed on results screen, allow seed input on map select.
3. **Mission 13 base reuse?** → Use a canonical "good enough" base state, not a Mission 11 save. Avoids save dependency, ensures M13 is always playable regardless of M11 performance.
4. **Recon photos?** → Simpler stylized overlays. Greyscale + grain CSS filter on SP-DSL terrain snapshots. No full scene captures.
5. **Tone.js mobile budget?** → Max 4 simultaneous synth voices (US-032). If frame drops detected, fall back to pre-rendered AudioBuffer samples. Add "Low Quality Audio" setting.
6. **Tutorial?** → Integrated as contextual prompts into Missions 1-4 (US-096), not a separate tutorial mission.