# OTTER: ELITE FORCE — RTS Canon, Responsive UX, and Asset Overhaul Plan

**Date:** 2026-03-24  
**Status:** Authoritative Phase 0 / Phase 1 plan  
**Scope:** Canon lock, source-of-truth cleanup, responsive/cross-platform baseline, mission-system direction, and asset-generation overhaul.

---

## 1. Executive decisions

1. **The game is campaign-first.** Authored RTS missions are the flagship mode.
2. **Procedural content is secondary.** Use it for Operations / Skirmish / replayability, not as the core identity.
3. **The player-facing faction is Otter Elite Force.** `URA` may remain as background lore only.
4. **The war is about control, occupation, logistics, and liberation.** Not a central “water theft / siphon theology” plot.
5. **Responsive playability is Phase 0 / Phase 1 work.** If the game is not genuinely usable on phone, tablet, and desktop, the overhaul has failed.
6. **The asset pipeline serves the visual target.** Portraits and hero visuals may be more bespoke than unit/building sprites.

---

## 2. Canonical game statement

**OTTER: ELITE FORCE is a scripted 2D RTS campaign about Sgt. Bubbles and the Otter Elite Force conducting a river-jungle liberation campaign against the entrenched Scale-Guard across the Copper-Silt Reach.**

Primary fantasy pillars:

- classic Warcraft-style mission pacing
- authored briefings and in-mission story beats
- hero rescues and escalating command drama
- strong riverine / jungle warfare identity
- premium portrait storytelling
- readable, tactile, cross-platform RTS play

---

## 3. Canon that is no longer primary

These should no longer be treated as active canonical direction for the RTS:

- open-world 3D tactical-shooter framing
- fixed-on-discovery world / LZ-base campaign framing
- water exploitation as the central thesis of the war
- sludge/siphon mythology as the main villain identity

These may survive only as historical repo context or localized mission elements.

---

## 4. Faction and conflict direction

### Player
- **Primary identity:** Otter Elite Force
- **Core leaders:** Sgt. Bubbles, Gen. Whiskers, FOXHOUND
- **Doctrine:** mobile, disciplined, river-jungle combined arms

### Enemy
- **Primary identity:** Scale-Guard
- **Role:** entrenched occupying crocodilian military power / warlord bloc
- **Doctrine:** fortified, brutal, attritional, chokepoint control

### Shared world logic
Both factions are believable river-war societies. They both want:

- crossings
- depots
- settlements
- food and salvage routes
- marsh control
- defensible strongpoints

The asymmetry comes from doctrine, brutality, and methods of war — not from one side having a nonsensical species-level relationship to water.

---

## 5. Product structure

### Mode 1 — Campaign (primary)
- 16 authored missions
- 4 chapters
- briefings, portraits, hero rescues, scripted escalation

### Mode 2 — Operations (secondary)
- procedural or semi-procedural scenarios
- capture the flag, king of the hill, holdout, escort, sabotage, siege, direct clash
- intended for replayability after campaign identity is locked

### Mode 3 — Skirmish (optional later)
- broader sandbox / challenge layer

---

## 6. Campaign structure direction

### Chapter 1 — First Landing
- beachhead / build-up
- convoy / causeway defense
- firebase hold
- prison camp rescue

### Chapter 2 — River War
- industrial poisonworks or war-infrastructure strike
- monsoon defense
- river supply raid
- underwater extraction / specialist rescue

### Chapter 3 — Heart of Darkness
- fog-war pressure
- village liberation
- heavy entrenchment / holdout
- fortress rescue assault

### Chapter 4 — Final Offensive
- supply lines
- gas depot sabotage
- mass battle across the delta
- final citadel assault / reckoning

`Siphon` may remain only as a localized industrial target or final-fortress machine, not the singular spine of the whole campaign.

---

## 7. Phase 0 and Phase 1 must include cross-platform playability

This is non-negotiable. The current app already shows responsive and thematic failures:

- current UI copy still contains obsolete open-world language
- the command-post shell is too verbose and desktop-dense compared to the POC HTML bar
- the tactical HUD stacks docks vertically on small screens, which risks obscuring play space
- Phaser currently runs at a fixed 1280×720 FIT canvas without a gameplay-safe responsive HUD contract
- mobile gameplay usability is not yet being treated as a blocking product requirement

### Phase 0 requirement
Define the responsive UX bar and make it canonical.

### Phase 1 requirement
Start implementation work that makes the game genuinely usable at phone, tablet, and desktop sizes.

---

## 8. POC-derived UX principles

The HTML POCs show the right macro lesson: **one dominant play surface with compact, legible RTS chrome**.

### Required principles
1. The map/canvas must remain the dominant surface.
2. HUD chrome must be compact, predictable, and edge-anchored.
3. Information hierarchy must beat decoration.
4. Mobile must not get a shrunken desktop screen.
5. Touch targets must be large, simple, and few.
6. Menu / briefing / tactical each need a responsive layout contract, not just theme colors.

### Gameplay layout targets
- **Desktop:** sidebar or edge-docked RTS chrome is acceptable.
- **Tablet:** condensed docks, fewer concurrent panels, stable minimap + commands.
- **Mobile gameplay:** landscape-first, compressed HUD, modal/drawer secondary info, never three tall stacked panels over the battlefield.
- **Mobile menu/briefing:** portrait is allowed, but density must collapse cleanly.

### Minimum interaction rules
- 48–56px touch targets for critical controls
- no critical action below the fold during gameplay
- no panel cluster may cover excessive battlefield area on phone
- key HUD values must remain legible at narrow widths

---

## 9. Phase 0 deliverables

1. **Canon lock document** (this plan)
2. **One active source-of-truth rule** for campaign content
3. **Responsive UX doctrine** for menu, briefing, and tactical screens
4. **De-authorize obsolete open-world RTS-incompatible repo guidance**
5. **Adopt POC HTMLs as benchmark references for density, hierarchy, and play-surface dominance**

---

## 10. Phase 1 deliverables

### Source-of-truth cleanup
- choose one mission content model as the future canonical schema
- treat parallel layers in `src/entities/missions`, `src/scenarios/definitions`, and `src/maps/missions` as migration sources, not coequal truth

### Responsive implementation baseline
- replace current shell assumptions with explicit desktop/tablet/mobile layout variants
- define HUD safe areas for tactical play
- connect Phaser scaling and camera presentation to viewport realities
- remove obsolete open-world/LZ copy from current UI
- add viewport acceptance checks for phone/tablet/desktop

### Validation matrix
- phone portrait menu/briefing
- phone landscape gameplay
- tablet portrait/landscape
- desktop standard width

---

## 11. Asset pipeline end-state

### Lane A — Gameplay sprites
Archetype/reference-class driven:

- otter infantry archetypes
- croc infantry archetypes
- faction structure archetypes
- semantic overrides for role, gear, palette, build, damage, and faction accents

### Lane B — Premium portraits
Portraits may use a more bespoke lane:

- bust archetypes
- lighting/expression presets
- authored refinement and paintover tolerance
- stricter visual quality control than gameplay sprites

### Lane C — UI/narrative graphics
- campaign map markings
- dossier framing
- field stamps / emblems / insignia

### Role of SP-DSL
SP-DSL remains the **semantic intermediate representation**, not the place every asset must be invented from scratch.

Runtime output remains:

- compiled PNG atlases
- JSON metadata
- canonical dimensions per category

---

## 12. Asset quality gates

### Units
- silhouette readable at gameplay zoom
- unmistakably otter/croc, not generic stick figures
- visible depth/shadow/weight

### Buildings
- clear roof/wall/foundation read
- strong faction identity
- believable military function

### Portraits
- strong anatomy/expression/material separation
- classic painted-briefing feel
- no uncanny placeholder faces

If an asset class repeatedly fails, the authoring method for that class must change.

---

## 13. Recommended migration order

1. Canon + responsive doctrine lock
2. Source-of-truth cleanup for mission content
3. Responsive shell/HUD baseline repair
4. Archetype generator schema
5. Golden reference slice:
   - one otter unit
   - one croc unit
   - one OEF building
   - one Scale-Guard building
   - one hero portrait
6. One fully realized mission vertical slice
7. Campaign batch migration
8. Operations mode

---

## 14. Immediate next implementation steps

1. Remove obsolete open-world language from the current UI and active docs.
2. Decide the single future mission schema.
3. Define responsive layout variants for command-post, briefing, and tactical shells.
4. Add viewport-based validation criteria and cross-platform screenshots/smoke checks.
5. Define the first archetype/reference-class contracts for units, buildings, and portraits.

This document is now the working baseline for the overhaul.