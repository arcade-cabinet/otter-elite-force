# Architecture Overview

## Current Runtime Shape

OTTER: ELITE FORCE is now structured as a **campaign-first RTS** with a React command/UI layer and Phaser tactical runtime.

### Core stack

- **UI:** React 19 + shadcn/ui + Tailwind v4
- **Rendering:** Phaser 3
- **State:** Koota ECS + singleton traits
- **Simulation support:** Yuka
- **Audio:** Tone.js
- **Build:** Vite + TypeScript + pnpm

## Screen Flow

The active front-door flow is intentionally simple:

1. **Menu**
2. **Game**
3. **Mission Result**
4. **Menu** or **Next Mission**

There is no longer an active canteen/store loop, detached campaign-map start flow, or standalone pre-mission briefing screen in the main app path.

## UI Layer

### `src/app/App.tsx`

Owns:

- screen routing via `AppScreen`
- theme switching by screen
- tactical HUD shell composition
- mission completion / failure routing

### `src/ui/command-post/`

Owns command-post and front-door UX, especially:

- `MainMenu.tsx` — classic RTS landing structure
- `SettingsPanel.tsx` / `SettingsControls.tsx` — player settings and accessibility/readability controls

### `src/ui/hud/`

Owns tactical overlays such as:

- resource bar
- action bar
- minimap
- unit panel
- alert banner
- combat text
- command transmission panel for diegetic mission intro dialogue

## Gameplay Layer

### `src/Scenes/`

Phaser scenes own tactical runtime responsibilities such as:

- boot/loading
- map setup
- mission runtime state
- objective/event integration

`BootScene.ts` is responsible for selecting and loading the built atlas outputs under `public/assets/`.

## Campaign / Mission Data

### `src/entities/missions/`

Mission authoring lives in the typed mission registry.

That data defines:

- mission IDs and ordering
- subtitles and narrative framing
- objectives and scenario compilation inputs
- briefing/transmission lines used for mission intro dialogue

`App.tsx` and the tactical HUD now use the mission briefing data as **on-ground command dialogue**, rather than routing through a detached briefing screen.

## ECS State

### `src/ecs/traits/state.ts`

Key singleton traits include:

- `AppScreen`
- `CampaignProgress`
- `GamePhase`
- `UserSettings`
- `CompletedResearch`

Current product-facing screens are:

- `menu`
- `game`
- `victory`
- `settings`

## Asset Pipeline

### Source

Procedural and SP-DSL-authored asset source data lives under `src/entities/**`.

Important registries include:

- `asset-contracts.ts`
- `asset-families.ts`
- `asset-generator-presets.ts`
- `asset-variant-recipes.ts`

### Build

`scripts/build-sprites.ts` compiles source definitions into runtime outputs under `public/assets/`.

Outputs include:

- atlas PNG/JSON files by category and scale
- contract/family/preset/recipe manifest JSON files

## Current Product Principles Reflected In Architecture

- **new game means start the campaign immediately**
- **continue means resume the current campaign immediately**
- **progression is earned through play, not purchased in a shop**
- **dialogue should land inside the tactical experience when possible**
- **UI shell complexity should support readability, not concept-art theater**