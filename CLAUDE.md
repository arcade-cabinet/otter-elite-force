# 🤖 CLAUDE MISSION CONTROL — OTTER: ELITE FORCE

## Active Mission

Keep the repo aligned around a **campaign-first RTS** with a strong river-jungle war identity, responsive tactical UX, premium portrait ambitions, and a coherent SP-DSL asset pipeline.

Primary references:

- `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md`
- `docs/references/Copilot-Copilot_Chat_VT91k21R.md`
- `docs/README.md`

## Strategic Truths

1. **The game is an RTS first**
2. **Otter Elite Force is the player-facing faction**
3. **Scale-Guard is the entrenched occupier / enemy bloc**
4. **The war is about crossings, depots, settlements, salvage, and control**
5. **Siphons and sludge may exist, but they are not the entire cosmology of the setting**
6. **UI must be clearer, tighter, and more responsive than before**

## Current Stack

- React 19 + shadcn/ui + Tailwind v4
- Phaser 3 for tactical rendering
- Koota ECS for app/game state
- Tone.js for procedural audio
- Yuka for AI/simulation support
- Radix UI for tooltips and dialogs
- Biome + Vitest + Playwright for quality

## Accessibility Systems

- WCAG AA contrast validated across tactical, command-post, briefing themes
- `prefers-reduced-motion` support (disables typewriter, animations, particles)
- `aria-label` on major UI regions and live resource readouts
- Keyboard navigation (Tab, Enter, Escape) for menus and settings
- Focus-visible indicators on all interactive elements
- Tutorial prompts for missions 1-4 (dismissible, skip in settings)
- MilitaryTooltip for hover data on train/build/research buttons
- ErrorFeedback for invalid command buzzes (1-second auto-dismiss)

## UI Command Intent

The menu/front door should communicate:

- **New Game**
- **Continue Game**
- **Settings**

Complex setup belongs in **dossier-style overlays**, not page mazes.

Visual bar:

- jungle camo
- riverine military grit
- manila dossier tabs
- stamped labels
- typewriter typography
- strong action hierarchy

## Narrative Guardrails

Prefer these terms:

- **Otter Elite Force / OEF**
- **Scale-Guard**
- **Copper-Silt Reach**

Avoid making the entire setting hinge on:

- mystical water logic
- species-wide water theology
- open-world LZ/base-building campaign assumptions

## Operational Checks For Changes

Before landing work, ask:

1. does this reinforce the campaign-first RTS direction?
2. does it improve phone/tablet/desktop clarity?
3. does it preserve the repo’s analog military tone?
4. does it keep docs aligned with the code?
5. does it help rather than muddy the OEF vs Scale-Guard fantasy?

## Red Flags

- reviving the old open-world shooter as active truth
- using `URA` everywhere in player-facing copy instead of OEF
- centering the war on siphons/water rather than logistics and occupation
- describing outdated architecture as if it is current
- letting build-pipeline docs drift away from `scripts/build-sprites.ts`
