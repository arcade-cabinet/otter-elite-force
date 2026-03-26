# OTTER: ELITE FORCE — Comprehensive Roadmap

> **Single source of truth for all remaining work.**
> Replaces all prior phase plans, implementation plans, and scattered TODOs.
> Last updated: 2026-03-25

---

## How to read this

- **Macro** = major feature area or system (weeks of work)
- **Meso** = discrete feature slice within a macro area (days of work)
- **Micro** = individual polish task, bug fix, or validation (hours of work)

Status key: `[ ]` not started · `[~]` partially done · `[x]` done

---

## 1 · GAMEPLAY LOOP INTEGRATION (Macro)

> Systems exist and pass unit tests in isolation. They have never been validated working together in the Phaser game loop in a browser. This is the single highest-priority macro area.

### 1.1 Wire game loop to all systems
- [ ] Wire aiSystem to game loop (TODO in `src/systems/gameLoop.ts:77`)
- [ ] Wire economySystem (gather/deposit/income) to game loop
- [ ] Wire buildingSystem (placement/construction/completion) to game loop
- [ ] Wire productionSystem (training queue/spawn) to game loop
- [ ] Wire combatSystem (targeting/damage/death) to game loop
- [ ] Wire fogSystem visual rendering to game loop
- [ ] Wire weatherSystem visual effects to game loop
- [ ] Wire orderSystem (command dispatch) to game loop
- [ ] Wire stealthSystem to game loop
- [ ] Wire scoringSystem to mission completion

### 1.2 Gather → Build → Train → Fight end-to-end
- [ ] Workers right-click resource → walk → harvest timer → carry → deposit → repeat
- [ ] Floating "+10 Fish" text on deposit
- [ ] Select worker → click build button → ghost placement → construction → completion
- [ ] Select building → click train button → dequeue resources → spawn unit → rally walk
- [ ] Right-click enemy → chase → attack → damage → death → loot drop
- [ ] Floating "-6 HP" on hit
- [ ] Victory/defeat detection → result overlay → campaign progression

### 1.3 Camera and input wiring
- [ ] Selection rectangle visual in Phaser (green box + translucent fill)
- [ ] Right-click context-sensitive commands (move / attack / gather / build / rally)
- [ ] Minimap → camera sync (click-to-snap, drag-to-pan, unit pips)
- [ ] Edge scroll with mouse-in detection
- [ ] Camera zoom limits per device tier (phone/tablet/desktop)

---

## 2 · MISSION RUNTIME (Macro)

### 2.1 Mission 1 full playthrough
- [ ] Paper-playtest mission 1 start-to-finish in browser
- [ ] Verify all mission 1 objectives fire and complete
- [ ] Verify mission 1 triggers (reinforcement spawns, dialogue events)
- [ ] Verify mission 1 victory → result screen → menu return

### 2.2 Campaign progression
- [ ] Mission completion → unlock next mission in campaign state
- [ ] "Continue" button resumes current mission
- [ ] Difficulty mode selection before campaign start
- [ ] Mission briefing dialogue plays via CommandTransmissionPanel
- [ ] Star rating display on mission completion

### 2.3 Missions 2–16 scenario polish
- [ ] Mission 2 — Causeway escort scripting + validation
- [ ] Mission 3 — Firebase Delta capture-point scripting + validation
- [ ] Mission 4 — Prison Break stealth/hero scripting + validation
- [ ] Mission 5 — Siphon Valley destroy objectives + validation
- [ ] Mission 6 — Monsoon Ambush wave/weather scripting + validation
- [ ] Mission 7 — River Rats CTF + water traversal + validation
- [ ] Mission 8 — Underwater Cache hero/stealth + validation
- [ ] Mission 9 — Dense Canopy fog skirmish + validation
- [ ] Mission 10 — Healer's Grove liberation + validation
- [ ] Mission 11 — Entrenchment defense waves + validation
- [ ] Mission 12 — The Stronghold siege + validation
- [ ] Mission 13 — Supply Lines multi-base + canonical "good enough" base state (not M11 save)
- [ ] Mission 14 — Gas Depot demolition hero + validation
- [ ] Mission 15 — Sacred Sludge sludge flood + validation
- [ ] Mission 16 — The Reckoning 3-phase boss + validation

---

## 3 · HUD & TACTICAL UI (Macro)

### 3.1 Functional wiring
- [~] Minimap component exists — needs camera sync + unit pips + click interaction
- [~] ResourceBar exists — needs live Koota binding validation
- [~] UnitPanel exists — needs selection → ECS trait binding
- [~] ActionBar exists — needs context-sensitive commands based on selection
- [~] BuildMenu exists — needs affordability gating + ghost placement trigger
- [~] AlertBanner exists — needs event wiring (enemy spotted, under attack)
- [ ] Research UI — display available research, costs, progress
- [ ] Tech tree visualization (optional, could be in-Armory panel)
- [ ] Building training queue progress indicator
- [ ] Spawn queue progress bar under training buildings

### 3.2 Visual polish
- [ ] Building placement ghost (translucent preview + green/red overlay)
- [ ] Construction progress visual (opacity rise from foundation)
- [ ] Rally point visualization (dashed line from building to point)
- [ ] Day/night cycle visual overlay
- [ ] Game clock display in top bar
- [ ] Resource carrying indicator (colored pip above worker)
- [ ] HP bar color gradient (green → yellow → red)
- [ ] Projectile particle trails
- [ ] Victory/defeat full-screen overlay with sound

### 3.3 Theme & art direction
- [ ] Manila folder / dossier visual treatment on briefing
- [ ] Typewriter character-by-character animation for dialogue
- [ ] Phosphor-green minimap styling with CRT grid lines
- [ ] Canvas/metal texture overlays on HUD panels
- [ ] Rivet/bracket panel corner decorations
- [ ] Verify stencil/typewriter typography matches Copilot spec
- [ ] Verify `border-radius: 0` across all tactical components

---

## 4 · AUDIO (Macro)

### 4.1 Event wiring
- [ ] Audio unlock — `Tone.start()` on first pointer event
- [ ] Wire all SFX to gameplay events (hit, gather, build, select, deselect, error, etc.)
- [ ] Wire combat music fade-in when fighting starts
- [ ] Wire ambient/menu music to screen state
- [ ] Briefing track during mission intro dialogue

### 4.2 Polish
- [ ] Concurrent SFX limit (max 4 simultaneous)
- [ ] Music cross-fade transitions (1s)
- [ ] Unit voice barks on select/command (short synth chirps)
- [ ] Volume settings wired to UserSettings trait


---

## 5 · MOBILE & RESPONSIVE (Macro)

### 5.1 Input wiring
- [~] Mobile input components exist (RadialMenu, CommandButtons, SquadTabs)
- [ ] Touch → game command dispatch integration test
- [ ] Two-finger drag for camera pan
- [ ] Pinch-to-zoom
- [ ] Long-press for move/attack command
- [ ] Minimap tap-to-enlarge (40% screen on mobile)
- [ ] Landscape lock via Capacitor ScreenOrientation during gameplay

### 5.2 Layout validation
- [ ] Touch target sizing validation (44px minimum)
- [ ] HUD layout at phone breakpoint (< 600px)
- [ ] HUD layout at tablet breakpoint (600–1024px)
- [ ] HUD layout at desktop breakpoint (> 1024px)
- [ ] Resource bar readability at all breakpoints
- [ ] Action bar usability at all breakpoints

### 5.3 Native builds
- [ ] Capacitor iOS build
- [ ] Capacitor Android build
- [ ] SQLite persistence via @capacitor-community/sqlite
- [ ] Touch haptics for combat/selection

---

## 6 · PERSISTENCE & SAVE/LOAD (Macro)

- [~] SQLite schema and repos exist in `src/persistence/`
- [~] saveLoadSystem exists (359 lines)
- [ ] Wire save/load to game state (snapshot Koota world)
- [ ] Auto-save on mission complete
- [ ] Manual save slots (1–3)
- [ ] "Continue" button loads latest save
- [ ] Campaign progress persistence across sessions
- [ ] Settings persistence across sessions
- [ ] Unlock state (units, buildings, research) persistence

---

## 7 · SPRITE & ASSET QUALITY (Macro)

### 7.1 Visual QC
- [ ] Render every SP-DSL sprite at game zoom (1x, 2x, 3x) — visual inspection
- [ ] Faction color readability: URA blue vs SG red instantly distinguishable
- [ ] Building silhouette distinctness per type
- [ ] Unit silhouette distinctness per role
- [ ] Animation frame transition smoothness
- [ ] Portrait: eyes visible, expression readable
- [ ] Tile seam QC at game zoom (no visible grid lines)

### 7.2 Asset gaps
- [ ] Verify all 16 mission briefing dialogues are authored
- [ ] Verify all entity types have walk + attack + idle animations
- [ ] Verify all portraits have consistent quality level
- [ ] Add recon-photo-style images for briefings (Copilot spec)
- [ ] Add "TOP SECRET" stamp overlay and pawprint signature (Copilot spec)

---

## 8 · AI & PLAYTESTING (Macro)

### 8.1 Enemy AI
- [ ] Wire Yuka FSM profiles to game entities
- [ ] Gator: idle → patrol → alert → ambush → chase → attack
- [ ] Viper: idle → patrol → snipe → flee
- [ ] Scout Lizard: patrol → spot → signal → flee
- [ ] Croc Champion: patrol → engage → berserk
- [ ] Siphon Drone: approach → drain → retreat
- [ ] Wave spawner escalation for defense missions
- [ ] AI difficulty scaling per mode (Support/Tactical/Elite)

### 8.2 Per-mission Yuka GOAP profiles
- [ ] M1: gather/build/attack goal graph
- [ ] M2: escort-protect steering
- [ ] M3: capture-zone occupation
- [ ] M4: stealth avoidance (hero solo)
- [ ] M5: multi-objective destroy
- [ ] M6: wave defense + weather awareness
- [ ] M7: CTF flag-carry + water traversal
- [ ] M8: submerged stealth
- [ ] M9: fog-of-war cautious advance
- [ ] M10: liberation sweep (5 villages)
- [ ] M11: 12-wave defense + fortify/repair
- [ ] M12: siege assault + breach walls
- [ ] M13: multi-base logistics
- [ ] M14: hero demolition (Sapper)
- [ ] M15: evacuation under sludge timer
- [ ] M16: 3-phase boss coordination

### 8.3 AI playtester
- [x] AIPlaytester framework with tick timing
- [x] GameStateReader from Koota singletons
- [x] Scene attachment bridge
- [ ] Full mission 1 automated paper-playtest
- [ ] Playtester strategy profiles (aggressive, defensive, economic)
- [ ] Automated balance validation from balance-framework.md
- [ ] Combat simulation tests (3 Mudfoots vs 2 Gators, etc.)
- [ ] E2E automated playthrough for ALL 16 missions (3× par time timeout)

---

## 9 · SKIRMISH MODE (Macro)

- [ ] Skirmish map selection UI
- [ ] 3 hand-tuned map templates (small/medium/large)
- [ ] Procedural map generation (terrain noise + resource seeding + symmetry)
- [ ] Shareable map seeds (display on results, allow seed input)
- [ ] AI opponent for single-player skirmish (shares FSM base, adds economy/tech layer)
- [ ] Difficulty selection (Easy/Medium/Hard/Brutal)
- [ ] Play-as-Scale-Guard option (mirror units)
- [ ] Win condition: destroy enemy Command Post
- [ ] Campaign star unlocks for skirmish maps

---

## 10 · TESTING & QUALITY (Macro)

### 10.1 Test gaps
- [ ] Fix pre-existing unit-panel test failures
- [ ] Fix pre-existing resource-bar test failures
- [ ] E2E Playwright: menu → new game → mission 1 loads
- [ ] E2E Playwright: settings panel opens and saves
- [ ] Browser test: full gather loop (worker → resource → deposit)
- [ ] Browser test: combat (unit attacks enemy, damage applies)
- [ ] Browser test: building placement + construction
- [ ] Browser test: unit training + spawn

### 10.2 Performance
- [ ] Pathfinding stagger queue (max 4 requests/frame)
- [ ] Path caching for group movement to same destination
- [ ] Profile and optimize large battle scenarios (20+ units)
- [ ] Bundle size audit and optimization
- [ ] Loading screen with progress bar

### 10.3 Accessibility
- [ ] WCAG AA contrast validation for all text/bg combos
- [ ] Reduced motion preference support
- [ ] Screen reader labels for major UI elements
- [ ] Keyboard navigation for menus

---

## 11 · DOCS & REPO HYGIENE (Macro)

- [x] Create this comprehensive roadmap
- [ ] Delete obsolete docs (table below)
- [ ] Keep canonical docs accurate as implementation progresses

---

## Obsolete Docs — Delete

| File | Reason |
|------|--------|
| `docs/DESIGN-SYSTEM.md` | jbcom multi-repo design system — zero relevance to OEF |
| `docs/DOMAIN-STANDARD.md` | agentic.dev subdomain standard — zero relevance |
| `docs/ECOSYSTEM.md` | @agentic/control workflows — zero relevance |
| `docs/BUNDLE_SIZE.md` | References Three.js, Zustand, @react-three — wrong stack entirely |
| `docs/superpowers/specs/2026-03-23-rts-pivot-design.md` | Superseded by 03-24 canon spec. Says "no React", "Zustand", ".sprite TOML" |
| `docs/superpowers/specs/2026-03-24-entity-architecture-design.md` | Says "no build pipeline" — superseded by SP-DSL build pipeline |
| `docs/superpowers/plans/2026-03-23-master-index.md` | Pointer to obsolete phase plans |
| `docs/superpowers/plans/2026-03-23-phase-1-foundation.md` | Old phase plan — valid work absorbed into this roadmap |
| `docs/superpowers/plans/2026-03-23-phase-2-depth.md` | Old phase plan — valid work absorbed into this roadmap |
| `docs/superpowers/plans/2026-03-23-phase-3-scale.md` | Old phase plan — valid work absorbed into this roadmap |
| `docs/superpowers/plans/2026-03-23-phase-4-culmination.md` | Old phase plan — valid work absorbed into this roadmap |
| `docs/superpowers/plans/2026-03-24-entity-architecture.md` | Entity plan — done differently, absorbed into this roadmap |
| `docs/superpowers/plans/2026-03-24-ui-spdsl-implementation.md` | UI/SP-DSL plan — partially done, absorbed into this roadmap |

## Canonical Docs — Keep

| File | Role |
|------|------|
| `docs/README.md` | Project overview |
| `docs/ROADMAP.md` | **This file** — single planning source of truth |
| `docs/architecture/overview.md` | Current architecture reference |
| `docs/architecture/testing-strategy.md` | Testing approach |
| `docs/design/game-design-document.md` | Core GDD |
| `docs/design/art-direction.md` | SP-DSL art bible |
| `docs/design/audio-design.md` | Audio spec |
| `docs/design/balance-framework.md` | Balance spec |
| `docs/design/mission-design-guide.md` | Mission authoring guide |
| `docs/analysis/gap-analysis.md` | Gap analysis (action items still valid) |
| `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md` | Canonical RTS spec |
| `docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md` | UI + SP-DSL architecture ref |
| `docs/references/*` | POC files, design bible, screenshots — permanent reference |
| `LORE.md` | Canonical faction/world lore |
| `TESTING.md` | Testing command reference |
| `AGENTS.md` / `CLAUDE.md` | Agent operating instructions |