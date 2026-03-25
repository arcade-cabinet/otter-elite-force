# 🦦 AGENTS.md — OTTER: ELITE FORCE

## Status

The old open-world tactical-shooter / chunk-persistence direction is **legacy**. The active source of truth is:

- `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md`
- `docs/references/Copilot-Copilot_Chat_VT91k21R.md`
- `docs/README.md`

## Canonical Game Statement

**OTTER: ELITE FORCE is a campaign-first RTS about the Otter Elite Force conducting a river-jungle liberation campaign against the entrenched Scale-Guard across the Copper-Silt Reach.**

## Non-Negotiables

1. **Campaign first** — authored RTS missions are the flagship mode
2. **Mobile-aware RTS** — phone, tablet, and desktop usability all matter
3. **OEF is the player-facing identity** — `URA` may survive as background lore only
4. **The war is about control, logistics, occupation, and liberation**
5. **Siphons/sludge/water are not the singular thesis of the setting**
6. **No sci-fi drift** — keep the analog jungle-war tone
7. **Keep the asset pipeline procedural/code-authored**

## Current Architecture Summary

- **UI:** React 19 + shadcn/ui + Tailwind v4
- **Game rendering:** Phaser 3
- **State:** Koota ECS + singleton traits
- **Simulation support:** Yuka + authored scenario systems
- **Audio:** Tone.js
- **Asset pipeline:** `pnpm build:sprites` compiles SP-DSL and legacy sprite defs into PNG + JSON atlases and manifest files under `public/assets/`

Key runtime files:

- `src/app/App.tsx` — screen routing + theme switching
- `src/ui/command-post/MainMenu.tsx` — landing page and dossier overlays
- `src/Scenes/BootScene.ts` — atlas loading
- `scripts/build-sprites.ts` — sprite build pipeline

## UX Direction

The front door should feel like:

- jungle camo meets riverine warfare with animals
- a pulp military command post
- dossier tabs, stamped labels, typewriter cues
- fewer words, clearer next steps, stronger hierarchy

Do not treat shadcn as the visual style. Treat it as the component baseline supporting the project’s own military UI language.

## Faction / Conflict Guidance

### Preferred player-facing names

- **Otter Elite Force (OEF)**
- **Scale-Guard**

### World logic

Both sides want believable material goals:

- crossings
- depots
- settlements
- salvage
- marsh control
- defensible strongpoints

The asymmetry comes from doctrine and brutality, not from one side having a mystical monopoly on water.

## Agent Rules

### Do

- update docs when changing canon, UI direction, or pipeline behavior
- preserve responsive playability and tactical readability
- keep authored mission flow coherent across code and docs
- preserve premium portrait ambitions and silhouette readability
- validate changes with the smallest relevant tests/builds

### Don’t

- reintroduce open-world/LZ/base-building campaign framing as active truth
- make `siphon` or `sludge` the entire reason the war exists
- add external production asset packs as a shortcut around the pipeline
- let docs contradict the current code for long-lived architectural facts
- drift into generic fantasy or chrome-heavy sci-fi styling

## Documentation Rule

If docs disagree:

1. use the 2026-03-24 RTS canon spec
2. then the design bible in `docs/references/Copilot-Copilot_Chat_VT91k21R.md`
3. then `README.md` / `docs/README.md`
4. then current implementation

## Current Priorities

1. maintain one unified RTS canon across the repo
2. keep polishing the responsive command-post / dossier UX
3. improve portrait and sprite quality without abandoning SP-DSL
4. keep build-pipeline docs, asset manifests, and runtime loading aligned
