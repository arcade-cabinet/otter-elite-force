# Phase 2: Depth — Implementation Plan (Missions 5-8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 8-mission game running on desktop + mobile with weather, water, stealth, and CTF mechanics

**Depends on:** Phase 1 complete (v0.2.0-phase1-complete)

**Spec:** `docs/superpowers/specs/2026-03-23-rts-pivot-design.md` §6 Chapter 2, §8.5-8.6

---

## Task 1: Mobile Input System

**Owner:** ui-engineer
**Files:**
- Create: `src/input/mobileInput.ts`
- Modify: `src/input/selectionManager.ts`, `src/input/commandDispatcher.ts`
- Modify: `src/scenes/GameScene.ts`, `src/scenes/HUDScene.ts`

- [ ] **Step 1:** Implement two-finger drag → camera pan (Phaser pointer events with multi-touch)
- [ ] **Step 2:** Implement one-finger drag → selection rectangle (when starting on unit area)
- [ ] **Step 3:** Implement long-press → move/attack command on destination
- [ ] **Step 4:** Implement pinch zoom (Phaser camera zoom with pinch gesture)
- [ ] **Step 5:** Add squad tabs to HUD bottom bar (replace keyboard hotkeys)
- [ ] **Step 6:** Add "Move" and "Attack" explicit buttons for mobile command dispatch
- [ ] **Step 7:** Implement Capacitor ScreenOrientation lock to landscape during gameplay
- [ ] **Step 8:** Test on iOS Safari + Android Chrome via Capacitor dev builds
- [ ] **Step 9:** Commit: `✨ feat(ui): implement mobile touch input with pan/select/command`

---

## Task 2: Capacitor Native Builds

**Owner:** scaffold-architect
**Files:**
- Modify: `capacitor.config.ts`
- Create: `ios/`, `android/` directories via `npx cap add`

- [ ] **Step 1:** `npx cap add ios` + `npx cap add android`
- [ ] **Step 2:** Configure CapacitorSQLite plugin for native platforms
- [ ] **Step 3:** Build web: `pnpm build` → `npx cap sync`
- [ ] **Step 4:** Test on iOS simulator and Android emulator
- [ ] **Step 5:** Fix any platform-specific issues (WebAudio unlock, touch events, viewport)
- [ ] **Step 6:** Commit: `✨ feat(scaffold): add Capacitor iOS and Android native builds`

---

## Task 3: Weather System

**Owner:** combat-engineer
**Files:**
- Create: `src/systems/weatherSystem.ts`
- Modify: `src/scenes/GameScene.ts` (visual effects)
- Test: `src/__tests__/systems/weatherSystem.test.ts`

- [ ] **Step 1:** Define WeatherState enum: CLEAR, RAIN, MONSOON
- [ ] **Step 2:** Implement weatherSystem(world, delta) — apply visibility/accuracy/speed modifiers based on current weather
- [ ] **Step 3:** Implement weather schedule: scenarios define weather transitions with timings
- [ ] **Step 4:** Implement visual effects: rain particles (Phaser ParticleEmitter), screen darkening overlay, fog density increase
- [ ] **Step 5:** Implement audio: rain ambient loop via Tone.js
- [ ] **Step 6:** Test weather modifiers on unit stats. Commit: `✨ feat(combat): implement weather system with rain and monsoon`

---

## Task 4: Sapper + Armory + Tech Research

**Owner:** economy-engineer
**Files:**
- Create: `src/sprites/assets/units/sapper.sprite`, `src/sprites/assets/buildings/armory.sprite`
- Modify: `src/systems/productionSystem.ts`
- Create: `src/systems/researchSystem.ts`

- [ ] **Step 1:** Add Sapper unit sprite and data definition
- [ ] **Step 2:** Add Armory building sprite and data definition
- [ ] **Step 3:** Implement Armory: trains Sappers, processes research queue
- [ ] **Step 4:** Implement researchSystem: Armory with active research → tick progress → when complete, apply global effect (e.g., Hardshell Armor → modify all Mudfoot entities' max HP)
- [ ] **Step 5:** Wire research UI in HUD: when Armory selected, show available research items
- [ ] **Step 6:** Test: research Hardshell Armor, verify Mudfoot HP changes. Commit: `✨ feat(economy): implement Armory building with research system`

---

## Task 5: Siphon Destruction Mechanic

**Owner:** scenario-designer
**Files:**
- Create: `src/sprites/assets/buildings/siphon.sprite`
- Modify: `src/systems/scenarioSystem.ts`

- [ ] **Step 1:** Define Siphon as Scale-Guard building: high HP (500), no attack, drains fish from nearby player buildings
- [ ] **Step 2:** Implement area effect: active Siphon → nearby water tiles turn toxic (visual tint), Fish Traps within 5 tiles produce 0
- [ ] **Step 3:** Implement destruction restoration: when Siphon destroyed → water clears, Fish Traps resume, area liberated
- [ ] **Step 4:** Create Siphon sprite asset
- [ ] **Step 5:** Test environmental effects. Commit: `✨ feat(scenario): implement Siphon destruction with environmental restoration`

---

## Task 6: Water Traversal (Dock + Raftsman)

**Owner:** phaser-engineer + economy-engineer
**Files:**
- Create: `src/sprites/assets/units/raftsman.sprite`, `src/sprites/assets/buildings/dock.sprite`
- Modify: `src/ai/graphBuilder.ts` (water tile handling)
- Modify: `src/ecs/traits/water.ts`

- [ ] **Step 1:** Add Dock building: must be placed adjacent to water tile. Trains Raftsmen.
- [ ] **Step 2:** Add Raftsman unit: can traverse water tiles. Carries up to 4 units.
- [ ] **Step 3:** Implement boarding: units near Raftsman can "board" (GarrisonedIn relation). Raftsman moves, passengers move with it.
- [ ] **Step 4:** Implement disembarking: Raftsman near land → passengers exit
- [ ] **Step 5:** Update pathfinding: Raftsman has CanSwim trait → water tiles cost 1 instead of ∞
- [ ] **Step 6:** Test water crossing. Commit: `✨ feat(economy): implement Dock and Raftsman water transport`

---

## Task 7: Stealth & Detection System

**Owner:** combat-engineer
**Files:**
- Create: `src/systems/stealthSystem.ts`
- Modify: `src/ecs/traits/stealth.ts`
- Test: `src/__tests__/systems/stealthSystem.test.ts`

- [ ] **Step 1:** Implement detection check: each frame, for each enemy unit, check if any player unit is within DetectionRadius. If so → set alert.
- [ ] **Step 2:** Implement concealment zones: tiles with tall grass/mangrove → entities on those tiles get Concealed tag → detection radius reduced 75%
- [ ] **Step 3:** Implement crouch toggle: player can set scouts to Crouching → speed halved, detection radius halved
- [ ] **Step 4:** Implement alert cascade: when enemy spots player → nearby enemies within 10 tiles converge
- [ ] **Step 5:** Implement detection cones (visual): Watchtowers and patrolling guards show visible detection arcs (Phaser Graphics)
- [ ] **Step 6:** Test stealth mechanics. Commit: `✨ feat(combat): implement stealth and detection system`

---

## Task 8: Hero Mission Mechanics

**Owner:** scenario-designer
**Files:**
- Modify: `src/scenarios/engine.ts`
- Create: `src/sprites/assets/portraits/whiskers.sprite`, `splash.sprite`

- [ ] **Step 1:** Implement hero unit spawning with IsHero tag (no pop cost, persists across missions)
- [ ] **Step 2:** Implement hero-only missions: scenario flag `heroOnly: true` → disable building/training
- [ ] **Step 3:** Create Gen. Whiskers portrait (64×96 ASCII)
- [ ] **Step 4:** Create Cpl. Splash portrait
- [ ] **Step 5:** Implement underwater layer for Splash missions: water tiles have "above" and "below" states. Submerged units invisible to surface. Splash has CanSwim+CanSubmerge.
- [ ] **Step 6:** Commit: `✨ feat(scenario): implement hero missions and underwater layer`

---

## Task 9: CTF Objective Type

**Owner:** scenario-designer
**Files:**
- Modify: `src/scenarios/types.ts`, `src/systems/scenarioSystem.ts`

- [ ] **Step 1:** Define CTF objective: supply crate entities on map. Player unit moves to crate → picks up (Gatherer trait reuse). Returns to base → scores.
- [ ] **Step 2:** Implement crate pickup: unit enters crate tile → crate attaches (visible on unit sprite)
- [ ] **Step 3:** Implement crate delivery: unit reaches Command Post → crate deposited, score increments
- [ ] **Step 4:** Implement enemy counter-play: Scale-Guard also tries to grab player crates
- [ ] **Step 5:** Test CTF mechanics. Commit: `✨ feat(scenario): implement Capture the Flag objective type`

---

## Task 10: Chapter 2 Missions + Portrait Gallery

**Owner:** scenario-designer + sprite-engineer
**Depends on:** Tasks 3-9

- [ ] **Step 1:** Hand-paint Mission 5-8 maps
- [ ] **Step 2:** Define Mission 5 (Siphon Valley) scenario
- [ ] **Step 3:** Define Mission 6 (Monsoon Ambush) scenario with weather schedule
- [ ] **Step 4:** Define Mission 7 (River Rats) scenario with CTF objectives
- [ ] **Step 5:** Define Mission 8 (Underwater Cache) scenario with hero stealth
- [ ] **Step 6:** Create remaining portrait sprites: Sgt. Fang, Medic Marina, Pvt. Muskrat
- [ ] **Step 7:** Play-test all 8 missions end-to-end on desktop and mobile
- [ ] **Step 8:** Commit: `✨ feat(scenario): add Chapter 2 missions — 8 total playable`
- [ ] **Step 9:** Tag: `git tag v0.3.0-phase2-complete`
