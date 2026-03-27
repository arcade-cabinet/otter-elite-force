# Comprehensive Gap Analysis: Otter Elite Force

Generated 2026-03-26. Exhaustive comparison of old React/Koota/Konva codebase, design docs, and standard RTS expectations against the current SolidJS/bitECS/LittleJS implementation.

---

## 1. UI/UX Regression (React to Solid Port)

### 1.1 ActionBar -- COMPLETELY MISSING

**Old:** Full contextual command console. Worker selected showed Build/Gather/Move/Stop with hotkeys. Military units showed Move/Stop/Attack/Patrol/Hold with hotkeys. Buildings showed Train/Research panels with:
- Unit training queue with cost display, affordability gating, MilitaryTooltip hover
- Research panel with active research progress bar, completion states, cost display
- Hotkey labels on every button (Q, W, S, M, A, P, H, T, R)
- Context hint text explaining what each action does

**New:** SelectionPanel has 4 static buttons (Move/Attack/Stop/Patrol) that are never wired to emit any commands. No context switching for workers vs military vs buildings. No training queue. No research panel. No hotkey display.

**Missing features:**
- Worker-specific action set (Build, Gather, Stop, Move)
- Building-specific action set (Train, Research)
- Unit training interface with cost, affordability, queue count
- Research interface with progress bars, completion tracking
- Hotkey labels on action buttons
- Context hints explaining each action
- MilitaryTooltip on hover for unit/building stats
- Action buttons that actually dispatch commands to the game

### 1.2 AlertBanner -- SEVERELY DEGRADED

**Old:** Listened to 18+ EventBus events: under-attack, building-complete, training-complete, enemy-spotted, objective-completed, mission-failed, alarm-triggered, boss-phase-change, boss-aoe, boss-summon, convoy-arrived, convoy-destroyed, convoy-waypoint-reached, fire-started, fire-extinguished, tide-changed. Each alert had world position coordinates. Clicking an alert centered the camera on the event location. Auto-dismissed after 3 seconds. Max 3 visible.

**New:** Reads from bridge store, which only populates from generic "hud-alert" events. No click-to-center-camera. No auto-dismiss timer visible. No event-specific alert generation for combat/building/training/objectives. Just displays whatever text the bridge passes through.

**Missing features:**
- Click-to-center-camera on alert location
- Auto-dismiss timer (3s)
- Event-specific alert wiring (under-attack, building-complete, etc.)
- Maximum visible alert capping with animation
- World position tracking for alerts

### 1.3 BossHealthBar -- DEGRADED

**Old:** Showed boss name, current phase name, "ENRAGED" state with pulsing text, red HP fill bar, individual phase threshold markers as vertical lines on the bar, numeric HP display (current/max), proper positioning (top-center, z-30).

**New:** Shows name and HP bar with color gradient. No phase name. No enraged state. No phase threshold markers. No phase data at all -- BossViewModel only has name/currentHp/maxHp.

**Missing features:**
- Phase name display (e.g., "PHASE 2: TOXIC RAIN")
- Enraged state indicator (pulsing text)
- Phase threshold markers (vertical lines on HP bar)
- Phase information in bridge view model

### 1.4 BuildMenu -- DEGRADED

**Old:** Read from Koota world ResourcePool and CurrentMission traits. Buildings locked by mission progression were hidden. Used MilitaryTooltip for hover stats (name, cost, HP, role). Dispatched "start-build-placement" event with worker entity ID.

**New:** Hardcoded DEFAULT_BUILD_OPTIONS with costs that may not match data/buildings.ts definitions. No mission-based unlock filtering. No tooltips. No worker entity context -- just emits startBuild(id) without knowing which worker should build. Always visible regardless of selection state.

**Missing features:**
- Mission-based building unlock filtering
- MilitaryTooltip hover with HP, cost, damage stats
- Worker entity association for build commands
- Dynamic cost data from ALL_BUILDINGS definitions
- "Ghost placement mode" entry with worker context
- Visibility tied to worker selection

### 1.5 CombatTextOverlay -- COMPLETELY MISSING

**Old:** Full floating damage/heal/resource numbers overlay. Per-frame scanning of all entities for HP changes (red "-X HP"), heals (green "+X HP"), resource harvesting (yellow "-X TIMBER"), resource deposits at command post (yellow "+X FISH"). Float upward and fade over 900ms. Culled outside viewport. Used requestAnimationFrame for smooth animation.

**New:** Does not exist in any form. No floating numbers for damage, healing, or resource changes.

### 1.6 CommandTransmissionPanel -- DEGRADED

**Old:** Full dialogue system with: portrait display from sprite atlas, speaker name with dialogue-specific color, typewriter cursor animation, "Receiving" vs "Ready" status indicator, "Skip All" button for skipping remaining dialogue, "Acknowledge" / "Move Out" contextual button labels, mission name display, keyboard/click to advance, riverine-camo background pattern.

**New:** Basic panel with speaker name and text. No portrait. No typewriter effect. No status indicator. No Skip All. Generic "Acknowledge" / "Dismiss" buttons. No mission name context. No visual styling (camo, gradient).

**Missing features:**
- Portrait display (TransmissionPortrait with atlas lookup)
- Typewriter text reveal animation
- "Receiving" / "Ready" status badges
- "Skip All" button
- Speaker-specific dialogue colors
- Mission name display
- Contextual advance labels ("Acknowledge" vs "Move Out")
- Riverine-camo background texture

### 1.7 ErrorFeedback -- DEGRADED

**Old:** Listened to "command-error" EventBus events. Played error buzz SFX via audioEngine.playSFX("errorAction"). Showed resource-specific error labels (e.g., "Not enough resources" with "TIMBER" badge). Max 2 visible, auto-dismiss after 1s. Slide-in animation.

**New:** Generic error message display. No SFX on error. No resource-specific labels. No slide-in animation. Errors never actually get pushed -- createErrorFeedback is called but pushError is unused (prefixed with _pushError).

**Missing features:**
- Error SFX playback
- Resource-specific error labels
- Slide-in animation
- Auto-dismiss timer
- Actually wiring errors from game events

### 1.8 MilitaryTooltip -- COMPLETELY MISSING

**Old:** Radix UI tooltip with military theme. Showed name, cost, HP, damage, time, description for any hovered button. Used consistently across ActionBar, BuildMenu, and research panels. Had arrow pointer, zoom animation, dark stencil styling.

**New:** No tooltip system exists. No hover information anywhere.

### 1.9 Minimap -- COMPLETELY MISSING

**Old:** Full interactive minimap with:
- Phosphor-green CRT aesthetic (dark bg, green border glow, scanlines, grid overlay)
- Color-coded entity pips (green=friendly, red=enemy, yellow=resource, selection highlight)
- Camera viewport rectangle
- Click/drag on minimap to move camera (full pointer capture)
- Radar sweep animation
- CRT vignette effect
- "RADAR" / "LIVE FEED" badges
- Legend (OEF / HOSTILE / RES)
- PanelFrame corner brackets

**New:** No minimap component exists at all. The RuntimeHost has no minimap.

### 1.10 PanelFrame -- COMPLETELY MISSING

**Old:** Decorative corner bracket and rivet system. L-shaped bracket marks at each corner with configurable inset, arm length, and rivet dots. Used on ResourceBar, UnitPanel, Minimap, ActionBar -- giving all HUD panels a consistent military aesthetic.

**New:** No PanelFrame equivalent. HUD panels have no corner bracket decorations.

### 1.11 PauseOverlay -- SLIGHTLY DEGRADED

**Old:** Resume, Save Game, Settings, Quit to Menu. "Operations Hold" title. Quit confirmation with cancel. Riverine-camo background.

**New:** Resume, Settings, Quit. No Save Game button. Quit confirmation works. Missing Save Game functionality.

### 1.12 ResourceBar -- FUNCTIONAL BUT DEGRADED

**Old:** PanelFrame wrapper, Badge components ("TACTICAL NET", "FIELD ECONOMY", "POP"), Card/CardContent with canvas-grain texture, resource items with border styling. Aria-label with full resource text.

**New:** Functionally equivalent (shows fish/timber/salvage/population) but missing PanelFrame decorations, Badge components, canvas-grain texture. Uses direct Tailwind classes instead of the old component library.

### 1.13 StarRatingDisplay -- MISSING FROM HUD (partially in MissionResult)

**Old:** Full star rating component with animated reveal (staggered 400ms per star), score breakdown bars (Time 40%, Survival 30%, Bonus 30%), bronze/silver/gold color coding, calculateStarRating() utility function with proper scoring formula.

**New:** MissionResult has a basic StarRating component but no score breakdown bars, no animated reveal, no calculateStarRating function. The result screen uses DEFAULT_RESULT with all zeros.

### 1.14 TransmissionPortrait -- COMPLETELY MISSING

**Old:** Loaded portrait atlas JSON, resolved frame coordinates, rendered sprite from atlas at correct scale with pixelated rendering, fallback to initials, "CO Feed" label, speaker name label, scanline overlay.

**New:** No portrait rendering anywhere. CommandTransmission has no portrait. BriefingOverlay has no portrait.

### 1.15 TutorialOverlay -- COMPLETELY MISSING

**Old:** Contextual tutorial prompts for missions 1-4: gathering, building, waypoint escort, capture zones, stealth detection. Dismissible. localStorage persistence of dismissed tutorials. Auto-dismiss after 8s. Escape to dismiss. "Skip Tutorials" setting integration.

**New:** Does not exist.

### 1.16 UnitPanel -- SEVERELY DEGRADED

**Old:** Full unit stats panel:
- Single unit: name from registry, HP bar with color (green>60%, yellow>30%, red), armor, damage, attack range, vision radius badges
- Building: HP, production queue with progress bar, research slot with progress bar
- Multi-select: count, "GROUP CONTROL" badge, aggregate HP display
- Hero badge for hero units

**New:** SelectionPanel shows only primaryLabel and entity count. No HP bar. No stats (damage, armor, range, vision). No building production/research display. No multi-select breakdown.

### 1.17 BriefingOverlay -- DEGRADED

**Old (React BriefingDialogue):** Full StarCraft-style dialogue system with:
- Left/right portrait positioning based on speaker (responders on right)
- Typewriter text animation with per-character audio (chirpy 800Hz oscillator)
- Portrait rendering from canvas (getPortraitCanvas)
- Line counter (1/5, 2/5, etc.)
- "BEGIN MISSION" screen after all lines
- Space/Enter/Tap to advance or complete
- Mission name at top during dialogue
- Automatic close for mid-mission dialogue

**Old (React BriefingOverlay):** Manila folder aesthetic with paper grain, CLASSIFIED stamp, redacted bars, pawprint signature, fold line.

**New:** Static display of briefing lines and objectives. No typewriter animation. No portrait. No dialogue progression. No "BEGIN MISSION" screen. No interactive text advancement. Manila styling is present but degraded (no paper grain texture CSS).

### 1.18 CampaignView -- DEGRADED

**Old:** Read from Koota CampaignProgress trait. Difficulty display integrated. Missions unlocked based on campaign progress persistence. "VS" hero panel with faction descriptions. CommandPostShell with proper layout.

**New:** getMissionSlots() hardcodes mission 1 as "available" and all others as "locked". No campaign progress persistence integration. No difficulty display. No faction hero panel. Simpler layout.

### 1.19 MainMenu -- DEGRADED

**Old:** Full hero layout: faction descriptions ("Mud, discipline, and river crossings" vs "Entrenched chokepoints and brute attrition"), VS split panel, difficulty selection dropdown, Continue button with current mission name, completion counter, background radial gradients, "Copper-Silt Reach" campaign label.

**New:** Simple centered button list. No faction hero panel. No difficulty selection (jumps straight to briefing). No VS split panel. No background visual effects. No completion counter integrated.

### 1.20 SettingsPanel -- DEGRADED

**Old:** Persisted to Koota UserSettings trait. Had: music volume, SFX volume, camera speed, haptics toggle, show grid, reduce FX, skip tutorials. Settings applied to the game world immediately. "Operator Notes" panel with design philosophy text. Escape returns to menu.

**New:** All settings are local createSignal -- never persisted, never applied to the game world. Missing: camera speed, haptics toggle, skip tutorials. Has subtitles/reduce motion instead. No keyboard navigation (Escape to go back).

### 1.21 GameLayout -- COMPLETELY MISSING

**Old:** Full responsive game layout:
- Mobile portrait: canvas top, UI panel bottom (flex-col-reverse)
- Desktop: UI panel left (64w), canvas right
- UI panel had 3 sections: Minimap, Selection Info, Action Panel
- Resource strip overlay at top of canvas
- Boss health bar integration
- Build grid with emoji icons and cost display
- Context hints when units selected

**New:** RuntimeHost renders everything in a single div with absolute positioning. No sidebar layout. No responsive adaptation between mobile/desktop. No docked minimap or action panel.

### 1.22 Layout Shells (CommandPostShell, BriefingShell, TacticalShell) -- COMPLETELY MISSING

**Old:** Three responsive shell layouts:
- CommandPostShell: screen noise, radial gradients, decorative scanline, CommandHeader with badges
- BriefingShell: paper grain, separate styling
- TacticalShell: HUD grid with regions (hud-top, alerts, left-dock, center-dock, right-dock, battlefield-well), responsive layout resolution

**New:** No shell system. Each screen is a plain div with ad-hoc styling.

### 1.23 Viewport Profiling -- COMPLETELY MISSING

**Old:** ViewportProfile system classifying viewport into phone/tablet/desktop tiers. useViewportProfile() hook updated on resize/orientationchange. Shell layouts adapted based on viewport tier. TacticalHudLayout adapted (mobile/tablet/desktop).

**New:** MobileLayout component exists with formFactor signal but is not used by any screen. No viewport-based layout adaptation in practice.

### 1.24 CSS Themes -- COMPLETELY MISSING

**Old:** Three CSS theme files: briefing.css, command-post.css, tactical.css with custom properties and theme-specific styling (canvas-grain, riverine-camo, briefing-manila-paper, etc.).

**New:** No theme CSS files. Some Tailwind classes reference themed values but the actual CSS classes (canvas-grain, riverine-camo, briefing-manila-paper, briefing-paper-grain, etc.) are not defined.

### 1.25 Component Library (shadcn) -- COMPLETELY MISSING

**Old:** Full shadcn/ui component library: Badge, Button (variants: hud, accent, command, destructive, ghost), Card/CardContent/CardHeader/CardTitle, plus cn() utility. Consistent design tokens across all UI.

**New:** Raw Tailwind classes everywhere. No reusable Button component. No Badge. No Card. Inconsistent styling between components.

---

## 2. System Logic Regression (Koota to bitECS Port)

### 2.1 Missing Systems

| System | Old | New | Status |
|--------|-----|-----|--------|
| buildingSystem.ts | Full construction, placement, ghost preview | None | MISSING |
| researchSystem.ts | Queue research, progress tracking, completion effects | None | MISSING |
| saveLoadSystem.ts | Save/load game state to persistence | None | MISSING |
| scenarioSystem.ts | Scenario triggers, phase transitions, dialogue | None | MISSING |
| gameLoop.ts | Tick orchestration, pause/resume, speed control | None | MISSING (handled differently) |

### 2.2 GameBridge is a No-Op

`createGameBridge()` in gameBridge.ts has these empty methods:
- `saveGame()` -- empty body
- `startBuild(_buildingId)` -- empty body
- `queueUnit(_unitId)` -- empty body
- `issueResearch(_researchId)` -- empty body
- `setSkirmishSeed(_seedPhrase)` -- empty body
- `shuffleSkirmishSeed()` -- empty body

The SolidBridge's `emit` methods just push to a `commandQueue` that is never consumed by the game loop. Commands from the UI go nowhere.

### 2.3 Selection Does Not Feed Into Actions

The SelectionPanel shows action buttons but they have no onClick handlers. Selection data flows from world to UI but no commands flow back. Clicking "ATTACK" does nothing.

### 2.4 Build Placement Not Implemented

Old system: Click building -> ghost placement -> click to place -> workers rally to construct -> construction progress -> building complete event. New system: BuildMenu emits startBuild(id) into a queue that nothing reads.

### 2.5 Production Queue Not Visible or Functional

Old: Buildings with trains[] could queue units. Progress bar shown on UnitPanel. Completion emitted training-complete event. New: productionSystem.ts exists in engine but UnitPanel equivalent doesn't show queue or progress.

### 2.6 Research System Gone

Old: researchSystem.ts with queue, progress tracking, completion effects applying stat changes. Research panel in ActionBar. New: No researchSystem in engine systems. Research data definitions exist but nothing processes them.

### 2.7 No Building System

Old: buildingSystem.ts handled construction progress, placement validation, worker rally. New: No equivalent. Buildings referenced in data but no system manages construction.

### 2.8 Save/Load Gone

Old: saveLoadSystem.ts with Koota serialization. PauseOverlay had "Save Game" button. New: PauseOverlay removed Save Game button because there's nothing to save to. Persistence layer (database.ts, campaignPersistence.ts) exists but isn't wired.

### 2.9 Scenario/Trigger Engine Disconnected

Old: scenarioSystem.ts drove mission triggers, phase transitions, dialogue displays, objective updates. New: encounterSystemEngine.ts exists but the old comprehensive scenarioSystem with full mission phase management is gone.

---

## 3. Missing Design Doc Features

### 3.1 Game Design Doc (game-design.md)

| Feature | Doc Says | Code Status |
|---------|----------|-------------|
| Box selection (drag) | Click+drag box selection | Not implemented in new input system |
| Swarm harvest (click resource) | All idle workers swarm to harvest | Not implemented |
| Swarm attack (click enemy) | All idle combat units attack | Not implemented |
| Right click drag = camera pan | Primary camera control | May work via LittleJS but not confirmed |
| Mouse wheel zoom | Zoom control | LittleJS may handle |
| Build grid shows when nothing selected | Sidebar build grid | BuildMenu always shows, not context-sensitive |
| Click building = instant placement near lodge | Simplified build | No ghost placement at all |
| Workers auto-loop gather cycle | Gather -> return -> gather | Not confirmed working |
| Trees impassable harvestable | Harvest outer to reach inner | Not implemented |
| Lodge auto-retreat at 25% HP | Unit mechanic | Not confirmed in combatSystem |
| Fog of war: unexplored/explored/visible | Three-state fog | fogSystem exists but three states not confirmed visible |
| Escape closes overlays | Desktop accelerator | Not wired in game screen |
| Phone HUD: large tap targets, low density | Adaptive layout | No mobile layout adaptation in game screen |

### 3.2 Lore Doc (lore.md)

| Character/Element | Mentioned | In Code |
|-------------------|-----------|---------|
| The Captain (player) | Silent protagonist | Only referenced in docs, not in UI |
| Col. Bubbles | HQ tactical officer | Portrait exists but not used in new UI |
| FOXHOUND | Intel handler | Portrait exists but not used |
| Gen. Whiskers | Strategic command | Portrait exists but not used |
| Cpl. Splash | Water specialist | Hero definition exists |
| Sgt. Fang | Heavy melee specialist | Hero definition exists |
| Medic Marina | Medical officer | Hero definition exists |
| Pvt. Muskrat | Demolitions specialist | Hero definition exists |
| Kommandant Ironjaw | Final boss | Not in boss configs |
| Captain Scalebreak | Albino alligator | Not in code |
| Warden Fangrot | Prison commander | Not in code |
| Venom | King cobra | Not in code |
| The Broodmother | Monitor lizard | Not in code |
| "Otter Elite Force" terminology | Player-facing name | Code uses "ura" internally, inconsistent in UI |
| "Lodge" instead of "base" | Terminology | Code uses "command_post" not "lodge" |
| "Copper-Silt Reach" | Theater name | Used in some screens, missing in others |

### 3.3 Art Direction (art-direction.md)

| Standard | Doc Says | Reality |
|----------|----------|---------|
| Purchased sprite atlases | 12 animal sprite atlases with JSON | Atlases exist in public/assets/sprites/ |
| Kenney tiles | CC0 tile set | Tiles exist in public/assets/tiles/ |
| 3x scale (48x48 rendered) | Standard render size | Scale factor not confirmed in LittleJS runtime |
| Device-adaptive scale (2x phone, 3x tablet, 4x hi-DPI) | Adaptive scaling | Not implemented |
| Sprite construction rules (16x16 units, 32x32 buildings) | Anatomy standards | Sprites follow this |
| Animation system (idle, walk, attack, gather, death, build) | Frame counts defined | Not confirmed all wired in LittleJS |
| Directional facing (flip horizontal when moving left) | Standard | Not confirmed |
| Terrain painting (per-terrain paint rules) | Canvas background painting | terrainRenderer.ts exists but may not follow all rules |
| Visual QC checklist | 8-point checklist | Not validated |

### 3.4 Audio Design (audio-design.md)

| Feature | Doc Says | Reality |
|---------|----------|---------|
| Tone.js procedural SFX | All sounds generated at runtime | audio/engine.ts exists but... |
| UI sounds (click, select, deselect, error) | 4 UI SFX | SFX catalog defined but not confirmed playing |
| Gameplay sounds (12 types) | move_order through defeat | Defined but not confirmed wired to game events |
| Environment sounds (rain, monsoon, siphon_hum) | 3 ambient SFX | Not confirmed |
| Menu music track (D minor, 72 BPM) | Procedural track | musicController.ts exists |
| Combat music track (A minor, 120 BPM) | Triggered during combat | Music track switching not confirmed in new runtime |
| Briefing music track (G minor, 80 BPM) | Briefing screen music | playBriefingMusic() exists but not called by BriefingOverlay |
| Concurrent SFX limit (max 4) | Prevent cacophony | Not confirmed |
| Music cross-fade (1s transitions) | Smooth transitions | Not confirmed |
| Typewriter clack audio | Per-character during dialogue | Completely removed (old BriefingDialogue had it) |

### 3.5 Balance Framework (balance-framework.md)

| Feature | Doc Says | Reality |
|---------|----------|---------|
| Unit counter matrix | Complex rock-paper-scissors | combatSystem has damage but counters not confirmed |
| Economy curves (fish income per minute) | Specific rates | economySystem exists but rates not validated |
| Build order (Support difficulty, Mission 1) | Specific timing | No tutorial or guidance system |
| Timber scarcity (depletes at 3-4 min) | Tension mechanic | Not confirmed |
| Salvage from combat loot | Rewards aggression | lootSystem exists |
| Pop cap ceiling via Burrows | Strategic tradeoff | Simplified pop calc (each building +5) |
| Difficulty scaling (wave sizes) | Support/Tactical/Elite | difficultyScalingSystem exists |
| Par times per mission | Specific times for gold | scoringSystem exists but not connected to star rating |
| Research impact (meaningful stat changes) | Before/after comparison | No research system |
| Balance test simulations | Automated combat tests | Tests exist in __tests__ |

---

## 4. Missing Standard RTS Features

Based on Warcraft II, StarCraft, Command & Conquer, and Age of Empires:

### 4.1 Critical Missing (needed to feel like a game)

| Feature | Status | Impact |
|---------|--------|--------|
| **Rally points for buildings** | Not implemented | Units pop out of buildings with nowhere to go |
| **Attack-move (A-click)** | Not implemented | Can't advance through territory safely |
| **Unit grouping (Ctrl+1-9)** | Not implemented | Can't manage multiple squads |
| **Production queue management** | Not visible/functional | Can't queue units or see progress |
| **Victory/defeat conditions displayed** | RuntimeHost shows phase badge but no proper overlay | Win/lose feels anticlimactic |
| **Minimap interaction** | No minimap at all | Can't navigate large maps |
| **Fog of war visual feedback** | fogRenderer exists but not confirmed visible | Can't see explored vs unexplored |
| **"Unit under attack" alert with camera snap** | Old AlertBanner had this, new one doesn't | Player doesn't know they're being attacked |
| **Damage numbers floating** | Completely missing | Combat feels numb -- can't see what's happening |
| **Resource income rate display** | Not shown | Player can't plan economy |
| **Idle worker button** | Not implemented | Workers sit idle without player knowing |
| **Build queue with cancel** | Not implemented | Can't manage production |

### 4.2 Important Missing (needed to feel polished)

| Feature | Status | Impact |
|---------|--------|--------|
| Formation movement | Not implemented | Units clump and block each other |
| Patrol command | Button exists but not wired | Can't set patrol routes |
| Guard/follow command | Not implemented | Can't escort units |
| Upgrade indicators on units | Not implemented | Can't see which units are upgraded |
| Kill tracking/score | Not displayed | No sense of progress mid-mission |
| Production progress bars on buildings | UnitPanel had this, gone now | Can't see what's being built |
| Tech tree visualization | Not implemented | Can't plan research path |
| Tooltip system | Completely missing | Buttons are mysterious |
| Right-click context menu (attack/move/gather) | Not implemented | Right-click does nothing useful |
| Tab to cycle through unit types in selection | Not implemented | Can't switch focus in group |
| Double-click to select all of same type | Not implemented | Tedious to select all mudfoots |
| Waypoint queuing (shift+click) | Not implemented | Can't set movement paths |

### 4.3 Nice-to-Have Missing

| Feature | Status |
|---------|--------|
| Unit voice lines on selection | No voice system |
| Building placement preview (ghost) | No placement system |
| Health bars above units on map | Not implemented |
| Selection circle/highlight on selected units | May be handled by LittleJS |
| Camera bookmarks (F5-F8) | Not implemented |
| Game speed control (slow/normal/fast) | Not implemented |
| Replay system | Seed-based replay exists in skirmish tests but no UI |

---

## 5. Missing Content

### 5.1 Unit Definitions Present but Not Playable

All unit .ts files exist (river-rat, mudfoot, shellcracker, sapper, raftsman, mortar-otter, diver, plus all Scale-Guard units), but without a working build/train system, the player can only use whatever spawns at mission start.

### 5.2 Building Definitions Present but Not Buildable

All building .ts files exist (command-post, barracks, burrow, fish-trap, watchtower, sandbag-wall, armory, field-hospital, dock, gun-tower, minefield, stone-wall), but without a working build placement system, none can be constructed.

### 5.3 Research Definitions Present but Not Researchable

research.ts defines upgrades (Hardshell Armor, Fish Oil Arrows, Demolition Training, Fortified Walls, etc.) but no researchSystem processes them.

### 5.4 Missing Enemy Bosses

Lore defines 5 Scale-Guard commanders (Ironjaw, Scalebreak, Fangrot, Venom, Broodmother). None are defined as boss entities with phase configs.

### 5.5 Missing Props

Only tall-grass and toxic-sludge props defined. Missing: wreckage caches (salvage source), explosive barrels, fuel drums, supply crates, intel markers, prison cells, siphon structures.

---

## 6. Missing Audio

### 6.1 No Audio Playing in Game

The audioRuntime.ts module exists and can lazily load the engine, but:
- RuntimeHost never calls initAudioRuntime()
- No screen calls playMenuMusic(), playBriefingMusic(), etc.
- No game system calls playSfx() for combat/selection/building events
- Settings sliders don't sync to audio engine

### 6.2 Specific Missing Audio Wiring

| Trigger | SFX | Wired? |
|---------|-----|--------|
| Unit selected | unit_select | No |
| Unit deselected | unit_deselect | No |
| Move order | move_order | No |
| Attack order | attack_order | No |
| Melee hit | melee_hit | No |
| Ranged fire | ranged_fire | No |
| Unit death | unit_death | No |
| Building placed | building_place | No |
| Building complete | building_complete | No |
| Resource gather | resource_gather | No |
| Resource deposit | resource_deposit | No |
| Alert/under attack | alert | No |
| Victory | victory | No |
| Defeat | defeat | No |
| Invalid command | error | No (old ErrorFeedback played it) |
| Menu screen | menu music | No |
| Briefing screen | briefing music | No |
| Combat active | combat music | No |
| Typewriter text | click oscillator | No (was in old BriefingDialogue) |

---

## 7. Missing Visual Polish

### 7.1 CSS/Theme Gaps

| Visual | Doc/Old | Current |
|--------|---------|---------|
| canvas-grain texture | Used on all HUD cards | Not defined |
| riverine-camo pattern | Background pattern on overlays | Referenced in JSX but CSS class may not exist |
| screen-noise effect | Command-post shell overlay | Not applied |
| CRT phosphor-green minimap | Full CRT aesthetic | Minimap doesn't exist |
| briefing-manila-paper | Paper grain background | Partial -- gradient applied, no grain texture |
| radar-sweep animation | Minimap sweep | Minimap doesn't exist |
| PanelFrame corner brackets | Decorative on all panels | Not implemented |
| CLASSIFIED/TOP SECRET stamp | Rotated red stamp on briefings | Present in BriefingOverlay |
| Pawprint signature | Commander signature block | Present in BriefingOverlay |
| Fold line on briefing | Subtle vertical gradient | Present |
| Scanline overlays | CRT effect on multiple panels | Not applied |
| Spotlight vignette on portraits | Radial gradient on portrait display | Portraits not rendered |

### 7.2 Typography Gaps

The old codebase used a consistent font hierarchy:
- font-heading: Stencil font for titles
- font-body: Typewriter for body text
- font-mono: Terminal font for data

The new code references some of these (font-stencil, font-terminal, font-typewriter in RuntimeHost) but the Solid screen components use generic font-heading, font-body, font-mono without ensuring the fonts are loaded.

---

## 8. Mission-Specific Gaps

### Mission 1 (Beachhead) -- Tutorial mission
- **Missing:** Tutorial overlay prompts for gathering and building
- **Missing:** Bridge repair objective mechanic
- **Missing:** Phase progression (establish base -> repair bridge -> clear outpost)

### Mission 2 (Causeway) -- Escort mission
- **Missing:** Convoy entity type and movement along waypoints
- **Missing:** Convoy destruction/survival tracking
- **Missing:** Ambush trigger zones
- **Missing:** Waypoint reach notifications

### Mission 3 (Firebase Delta) -- Capture-hold mission
- **Missing:** Capture zone mechanic (move units into zone, hold for timer)
- **Missing:** Counter-attack wave generation after capture
- **Missing:** Multi-objective simultaneous tracking (3 hilltops)

### Mission 4 (Prison Break) -- Stealth/commando mission
- **Missing:** Alarm system (detection -> compound-wide alert)
- **Missing:** Searchlight/detection cone visuals
- **Missing:** Commando mode (no lodge, no base building)
- **Missing:** Prisoner rescue mechanic
- **Missing:** Extraction zone objective

### Mission 5 (Siphon Valley) -- Multi-objective assault
- **Missing:** Destructible siphon buildings (multi-hit)
- **Missing:** Toxic terrain damage-over-time
- **Missing:** Three separate objective markers

### Mission 6 (Monsoon Ambush) -- Defense wave survival
- **Missing:** Weather progression (clear -> rain -> monsoon)
- **Missing:** Weather effects on gameplay (visibility, movement)
- **Missing:** 8-wave defense timer
- **Missing:** 4-direction attack approaches

### Mission 7 (River Rats) -- Naval interdiction
- **Missing:** Barge entity type moving along river channels
- **Missing:** Crate capture mechanic
- **Missing:** Raft/water unit combat
- **Missing:** Three waterway channels

### Mission 8 (Underwater Cache) -- Commando water mission
- **Missing:** Underwater terrain layer
- **Missing:** Submerged unit visibility mechanics
- **Missing:** Hero rescue (Cpl. Splash) + vault recovery

### Mission 9 (Dense Canopy) -- Recon/fog mission
- **Missing:** Intel marker discovery mechanic
- **Missing:** Dense fog with limited vision
- **Missing:** Commando movement in concealment

### Mission 10 (Scorched Earth) -- Destruction mission
- **Missing:** Fuel tank destructible structures
- **Missing:** Fire spread mechanic
- **Missing:** Oil slick terrain

### Mission 11 (Entrenchment) -- Tidal siege
- **Missing:** Tidal system (low tide reveals land bridges, high tide floods them)
- **Missing:** tidalSystem exists but not wired to terrain changes
- **Missing:** Multi-phase assault across tidal flats

### Mission 12 (Fang Rescue) -- Assault with hero objectives
- **Missing:** Hero death = mission failure
- **Missing:** Breach Charge ability for Sgt. Fang
- **Missing:** Layered fortress defense mechanics

### Mission 13 (Great Siphon) -- Multi-stage destruction
- **Missing:** Multi-section destructible mega-structure
- **Missing:** Three concentric defense perimeters
- **Missing:** Shield Generator building

### Mission 14 (Iron Delta) -- Amphibious assault
- **Missing:** Full naval combat
- **Missing:** Island capture mechanics
- **Missing:** Deep channel/shallow water terrain types

### Mission 15 (Serpent's Lair) -- Boss fight
- **Missing:** 3-phase boss fight (Kommandant Ironjaw)
- **Missing:** Boss abilities (AoE, summon reinforcements)
- **Missing:** Concentric ring fortress penetration
- **Missing:** Toxic moat terrain

### Mission 16 (The Reckoning) -- Final mission
- **Missing:** Phase 1: 10-wave defense
- **Missing:** Phase 2: Counterattack to destroy enemy command post
- **Missing:** All named characters radio in
- **Missing:** Campaign finale sequence

---

## 9. Mobile/Touch Gaps

### 9.1 No Mobile Layout Active in Game

MobileLayout component exists but RuntimeHost doesn't use it. All HUD elements are absolute-positioned for desktop with no mobile adaptation.

### 9.2 Touch Target Sizes

Old mobile components enforced 44px minimum touch targets (US-061). New components have no such enforcement. RuntimeHost toolbar buttons are 28px (h-7 w-7).

### 9.3 Missing Mobile Components

| Component | Old | New | Status |
|-----------|-----|-----|--------|
| CommandButtons | 44px min-height touch strip | Not used | Dead code |
| SquadTabs | Horizontal tab bar for squad groups | Not used | Dead code |
| RadialMenu | Long-press radial command menu | Component exists but not wired | Unused |
| Mobile build palette | Bottom-docked build grid | Not implemented | Missing |

### 9.4 Two-Finger Drag Camera

Game design doc specifies two-finger drag for camera pan on mobile. Not confirmed that LittleJS handles this correctly.

### 9.5 Pinch Zoom

Game design doc specifies pinch-to-zoom. Not confirmed functional.

---

## 10. Priority Fix List (Ordered by Impact)

### Tier 1: "Without these, it's not a game" (Ship blockers)

1. **Wire action buttons to game commands** -- Selection, move, attack, stop must actually work. The SelectionPanel buttons do nothing. The bridge emit methods go to a dead command queue.

2. **Build placement system** -- Without building, there is no economy, no army, no game. Need ghost placement, worker rally, construction progress, completion.

3. **Production/training system visible** -- Must be able to train units from buildings and see queue progress.

4. **Minimap** -- Cannot play an RTS on a 128x128 map without a minimap. Port the old Minimap component or build a new one for the LittleJS canvas.

5. **Combat text overlay / damage feedback** -- Without floating numbers, the player has no idea what's happening in combat. Is my unit winning? Losing? Dead?

6. **Unit stats display (HP, damage, armor)** -- UnitPanel showing HP bar, attack, defense. Currently selection shows only a name.

7. **Box selection** -- Cannot select multiple units without it. Fundamental to RTS.

8. **Fog of war visual rendering** -- fogSystem exists but needs visual confirmation that it renders unexplored/explored/visible states.

### Tier 2: "Without these, it feels broken" (Quality gates)

9. **Alert system with camera snap** -- "Under attack!" with click-to-center.

10. **Audio wiring** -- At minimum: selection click, attack order, combat hits, building complete, victory/defeat music. The audio engine EXISTS -- just nothing calls it.

11. **Mission phase progression** -- Scenarios must advance through phases, show dialogue, update objectives. The old scenarioSystem is gone.

12. **Save/Load** -- PauseOverlay had Save button. Persistence layer exists. Wire it.

13. **Research system** -- Research definitions exist. No system processes them.

14. **Keyboard hotkeys** -- The old ActionBar showed hotkeys (A for attack, M for move). keyboardHotkeys.ts exists but needs confirmation it works with new input.

15. **Victory/defeat overlay** -- Proper screen transition on win/lose with star rating, stats, next mission.

16. **Briefing dialogue system** -- Typewriter text, portrait display, interactive advancement. Currently just static text.

### Tier 3: "Without these, it feels cheap" (Polish)

17. **PanelFrame decorations** -- Corner brackets and rivets on all HUD panels.

18. **CSS themes** -- canvas-grain, riverine-camo, CRT effects, paper grain.

19. **MilitaryTooltip system** -- Hover info on all buttons.

20. **Tutorial overlay** -- First-time player prompts for missions 1-4.

21. **Mobile layout adaptation** -- Phone/tablet/desktop responsive layouts.

22. **Star rating with score breakdown** -- Animated star reveal, Time/Survival/Bonus bars.

23. **Portrait rendering in dialogues** -- Load atlas, display sprite in transmission and briefing panels.

24. **Settings persistence** -- Settings must persist across sessions and actually affect the game.

25. **Campaign progress persistence** -- Completed missions, star ratings, current mission must persist.

### Tier 4: "Without these, it won't ship" (Content completeness)

26. **All 16 missions playable with correct mechanics** -- Each mission requires specific mechanics (escort, stealth, naval, boss fight, tidal, weather).

27. **Boss encounters** -- 3-phase bosses with abilities, summons, AoE.

28. **Enemy commander entities** -- Ironjaw, Scalebreak, Fangrot, Venom, Broodmother.

29. **Weather effects on gameplay** -- Rain reduces vision, monsoon reduces movement speed.

30. **Tidal mechanics** -- Land bridges appear/disappear with tide.

31. **Fire spread** -- Destructible terrain.

32. **All unit abilities** -- Sapper demolition charges, Diver stealth, Cpl. Splash underwater reveal, Sgt. Fang breach charge.

---

## Summary Statistics

| Category | Items |
|----------|-------|
| UI components completely missing | 8 (ActionBar, CombatTextOverlay, MilitaryTooltip, Minimap, PanelFrame, TutorialOverlay, TransmissionPortrait, Layout Shells) |
| UI components severely degraded | 7 (AlertBanner, BossHealthBar, CommandTransmission, ErrorFeedback, UnitPanel, BriefingDialogue, CampaignView) |
| UI components slightly degraded | 5 (BuildMenu, PauseOverlay, ResourceBar, MainMenu, SettingsPanel) |
| Engine systems missing | 5 (building, research, saveLoad, scenario, gameLoop) |
| Game bridge methods that are no-ops | 6 |
| Audio triggers not wired | 18+ |
| Standard RTS features missing | 23+ |
| Mission-specific mechanics not implemented | 30+ across 16 missions |
| Design doc standards not met | 20+ |
