# Phase 3: Scale — Implementation Plan (Missions 9-12)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 12-mission game with full unit roster, territory control, defensive buildings, and siege mechanics

**Depends on:** Phase 2 complete (v0.3.0-phase2-complete)

**Spec:** `docs/superpowers/specs/2026-03-23-rts-pivot-design.md` §6 Chapter 3, §12

---

## Task 1: Mortar Otter + AoE Combat

**Owner:** combat-engineer
- [ ] Add Mortar Otter sprite (16×16), data definition (45 HP, 20 dmg, 7 range, 2-tile splash)
- [ ] Implement AoE damage: when projectile lands → find all entities within splash radius → apply damage
- [ ] Implement scatter: projectile landing point offset by random amount within scatter radius
- [ ] Test AoE damage. Commit: `✨ feat(combat): implement Mortar Otter with AoE splash damage`

---

## Task 2: Village Liberation / Territory System

**Owner:** scenario-designer + ecs-architect
- [ ] Define Village entity: IsBuilding + Faction('scale_guard') + garrison of 2-3 Gators
- [ ] Implement liberation: all garrison units killed → village Faction flips to 'ura'
- [ ] Implement village benefits: trickle fish income, fog reveal radius, healing zone
- [ ] Implement recapture: if Scale-Guard units reach undefended village → flips back to 'scale_guard'
- [ ] Create `src/systems/territorySystem.ts` — track liberated vs occupied villages
- [ ] Create village sprite (32×32). Commit: `✨ feat(scenario): implement village liberation and territory control`

---

## Task 3: Defensive Buildings (Stone Wall, Gun Tower, Minefield)

**Owner:** economy-engineer
- [ ] Create Stone Wall sprite, Gun Tower sprite, Minefield sprite
- [ ] Implement research gate: Stone Wall requires Fortified Walls research, Gun Tower requires Gun Emplacements
- [ ] Implement Gun Tower: IsBuilding + Attack (12 dmg, 6 range) — auto-attacks nearest enemy
- [ ] Implement Minefield: invisible to enemy, triggers once on first enemy unit → 40 dmg → destroyed
- [ ] Test defensive buildings. Commit: `✨ feat(economy): implement Stone Walls, Gun Towers, and Minefields`

---

## Task 4: Field Hospital + Medic Marina

**Owner:** economy-engineer + scenario-designer
- [ ] Create Field Hospital sprite (32×32)
- [ ] Implement healing aura: Field Hospital heals all friendly units within 3 tiles at +2 HP/s (or +3 with Combat Medics research)
- [ ] Implement Medic Marina hero: heals nearby units passively, unlocks Field Hospital building
- [ ] Create Medic Marina hero sprite. Commit: `✨ feat(economy): implement Field Hospital healing and Medic Marina hero`

---

## Task 5: Full Scale-Guard AI (All Unit Types)

**Owner:** ai-engineer
- [ ] Implement Viper AI: idle → patrol → snipe (approach to range 5, attack, flee if approached within 2)
- [ ] Implement Snapper AI: static turret, rotate to track nearest enemy, constant fire
- [ ] Implement Scout Lizard AI: patrol → spot player → signal (broadcast alert) → flee
- [ ] Implement Croc Champion AI: patrol → engage → berserk (below 50% HP → damage+speed increase)
- [ ] Implement Siphon Drone AI: approach nearest player building → drain resources → retreat when damaged
- [ ] Create sprites for Viper, Snapper, Scout Lizard, Croc Champion, Siphon Drone
- [ ] Test all AI profiles. Commit: `✨ feat(ai): implement full Scale-Guard AI with all unit types`

---

## Task 6: Sgt. Fang + Siege Mechanics

**Owner:** scenario-designer + combat-engineer
- [ ] Create Sgt. Fang hero sprite + portrait
- [ ] Implement siege bonus: Sgt. Fang deals 2x damage to buildings
- [ ] Implement wall breaching: Sappers and Fang can target wall segments, creating gaps
- [ ] Implement gate mechanic: Scale-Guard fortress has gates that must be destroyed to enter
- [ ] Test siege assault flow. Commit: `✨ feat(scenario): implement siege mechanics and Sgt. Fang hero`

---

## Task 7: Chapter 3 Missions (9-12)

**Owner:** scenario-designer
- [ ] Hand-paint Mission 9-12 maps
- [ ] Mission 9 (Dense Canopy): equal pre-built bases, heavy fog, recon→strike loop
- [ ] Mission 10 (Healer's Grove): 5 villages to liberate, Medic Marina rescue
- [ ] Mission 11 (Entrenchment): build from scratch, 12 escalating waves — save base state for Mission 13
- [ ] Mission 12 (The Stronghold): siege assault on Scale-Guard fortress, rescue Sgt. Fang
- [ ] Play-test Missions 9-12. Commit: `✨ feat(scenario): add Chapter 3 missions — 12 total playable`
- [ ] Tag: `git tag v0.4.0-phase3-complete`
