# Phase 4: Culmination — Implementation Plan (Missions 13-16 + Skirmish)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete game with all 16 campaign missions, Skirmish mode, scoring, and audio polish

**Depends on:** Phase 3 complete (v0.4.0-phase3-complete)

**Spec:** `docs/superpowers/specs/2026-03-23-rts-pivot-design.md` §6 Chapter 4, §13

---

## Task 1: Multi-Base Management

**Owner:** economy-engineer
- [ ] Implement Secondary Command Post: placeable at predetermined map locations (defined in scenario)
- [ ] Each Command Post has its own resource collection radius
- [ ] Implement supply caravan: automated Raftsmen carry resources between bases on a set route
- [ ] Implement supply line vulnerability: caravans can be ambushed, resources lost
- [ ] Test multi-base economy. Commit: `✨ feat(economy): implement multi-base management with supply lines`

---

## Task 2: Demolition Mechanics (Pvt. Muskrat)

**Owner:** combat-engineer + scenario-designer
- [ ] Create Pvt. Muskrat hero sprite + portrait
- [ ] Implement timed charges: Muskrat places charge at building → 10s countdown → explosion (AoE 3-tile, 100 dmg)
- [ ] Implement chain explosions: explosive buildings (Gas Depot) explode when destroyed, damaging nearby
- [ ] Implement escape timer: after planting, player must evacuate Muskrat before detonation
- [ ] Test demolition mechanics. Commit: `✨ feat(combat): implement demolition charges and chain explosions`

---

## Task 3: The Great Siphon Boss Encounter

**Owner:** scenario-designer + combat-engineer
- [ ] Design The Great Siphon as multi-stage destructible (phase 1: perimeter, phase 2: champions, phase 3: core)
- [ ] Implement phase transitions: when perimeter HP → 0, spawn Croc Champions from 3 directions
- [ ] Implement doomsday mode: phase 3 activates sludge flood — toxic terrain spreads from center at 1 tile/10s
- [ ] Implement victory condition: destroy core before sludge reaches player base
- [ ] Implement failure condition: player Command Post covered by sludge
- [ ] Create Great Siphon sprite (64×64 — largest building). Commit: `✨ feat(scenario): implement The Great Siphon 3-phase boss encounter`

---

## Task 4: Sludge Flood Mechanic

**Owner:** phaser-engineer
- [ ] Implement expanding toxic terrain: from center point, flood fills outward at configurable rate
- [ ] Sludge tiles damage all units (including Scale-Guard) at 5 HP/s
- [ ] Sludge tiles kill Fish Traps and destroy buildings over 30s
- [ ] Visual: sludge overlay animation (Phaser particles + tint)
- [ ] Test sludge expansion. Commit: `✨ feat(phaser): implement expanding sludge flood mechanic`

---

## Task 5: Mission Scoring (Bronze/Silver/Gold)

**Owner:** ui-engineer + persistence-engineer
- [ ] Define scoring formula per mission: time_score (40%) + units_lost_score (30%) + bonus_objectives (30%)
- [ ] Implement star calculation: Bronze ≥ 50%, Silver ≥ 75%, Gold ≥ 90%
- [ ] Display star rating on VictoryScene with breakdown
- [ ] Save best scores to campaign_progress table
- [ ] Display stars on campaign map. Commit: `✨ feat(ui): implement Bronze/Silver/Gold mission scoring`

---

## Task 6: Campaign Map Screen

**Owner:** sprite-engineer + ui-engineer
- [ ] Hand-paint ASCII campaign map of the Copper-Silt Reach (128×96 or larger)
- [ ] Implement campaign map scene: show territory (blue=liberated, red=occupied)
- [ ] Animate mission locations: pulsing marker on next mission, star ratings on completed
- [ ] Wire into MenuScene flow: Menu → CampaignMap → BriefingScene → GameScene
- [ ] Commit: `✨ feat(ui): implement campaign map with territory visualization`

---

## Task 7: Returning Base Mechanic

**Owner:** persistence-engineer + scenario-designer
- [ ] After Mission 11 (Entrenchment) completion: serialize player's base state (buildings, positions, HP)
- [ ] Mission 13 (Supply Lines) loads this serialized base as starting condition
- [ ] If no Mission 11 save exists: Mission 13 uses a default base layout
- [ ] Test base persistence between missions. Commit: `✨ feat(persistence): implement returning base mechanic between missions`

---

## Task 8: Skirmish Mode

**Owner:** ai-engineer + scenario-designer
- [ ] Implement Skirmish AI opponent: economic decision loop (build workers → gather → build army → expand → attack)
- [ ] Implement difficulty scaling: Easy (slow AI, no bonus), Medium, Hard (fast AI, +25% resources), Brutal (+50% resources, aggressive)
- [ ] Implement procedural map generation for Skirmish: Perlin noise terrain, symmetric resource placement, balanced start positions
- [ ] Implement skirmish settings UI: map select, difficulty, faction choice
- [ ] Implement victory condition: destroy enemy Command Post
- [ ] Unlock skirmish maps based on campaign progress (complete mission N → unlock map N)
- [ ] Test Skirmish mode. Commit: `✨ feat(scenario): implement Skirmish mode with AI opponent and procedural maps`

---

## Task 9: Chapter 4 Missions (13-16)

**Owner:** scenario-designer
- [ ] Hand-paint Mission 13-16 maps (Mission 15 is the largest map in the game)
- [ ] Mission 13 (Supply Lines): 3 base locations, supply caravan routes, returning base from Mission 11
- [ ] Mission 14 (Gas Depot): Pvt. Muskrat hero mission, 4 charges, escape timer
- [ ] Mission 15 (Sacred Sludge): largest map, full army vs full army, sludge flood timer
- [ ] Mission 16 (The Reckoning): 3-phase Great Siphon boss, all heroes available
- [ ] Play-test complete campaign start to finish. Commit: `✨ feat(scenario): add Chapter 4 missions — all 16 playable`

---

## Task 10: Audio Polish

**Owner:** scenario-designer (audio)
- [ ] Create unit acknowledgment SFX per unit type (Tone.js synth variations)
- [ ] Create building construction sounds
- [ ] Create ambient music per mission theme (jungle, rain, combat intensity)
- [ ] Create briefing music (military drum + brass feel via synth)
- [ ] Create victory/defeat stingers
- [ ] Test audio across all missions. Commit: `🎨 feat(audio): add full audio design with per-unit SFX and mission music`

---

## Task 11: Performance Optimization

**Owner:** phaser-engineer + ecs-architect
- [ ] Profile with Chrome DevTools: identify rendering bottlenecks
- [ ] Implement sprite culling: off-screen entities skip rendering
- [ ] Implement pathfinding throttle: verify max 4 requests/frame is sufficient
- [ ] Test performance with 60+ units on largest map (Mission 15)
- [ ] Target: 60fps on mid-range mobile device, 60fps on desktop
- [ ] Commit: `⚡️ perf: optimize rendering and pathfinding for 60fps on mobile`

---

## Task 12: Final Integration & Release

**Owner:** ALL
- [ ] Complete E2E playthrough of all 16 missions + skirmish
- [ ] Run full test suite: unit + E2E
- [ ] Build production: `pnpm build`
- [ ] Test Capacitor builds: iOS + Android + web
- [ ] Fix platform-specific bugs
- [ ] Update CLAUDE.md with new project structure
- [ ] Tag: `git tag v1.0.0`
- [ ] Commit: `🚀 feat: v1.0.0 — OTTER: ELITE FORCE RTS complete`
