# OTTER: ELITE FORCE

Campaign-first RTS set in the Copper-Silt Reach: a river-jungle war between the **Otter Elite Force** and the entrenched **Scale-Guard**. The game targets a classic 90s RTS rhythm with authored briefings, premium portraits, mobile-aware tactical UX, and a procedural asset pipeline that compiles SP-DSL sprite definitions into runtime atlases.

## Current Product Direction

- **Primary mode:** authored campaign RTS missions
- **Primary player-facing faction:** **Otter Elite Force (OEF)**
- **Conflict:** control, occupation, logistics, liberation, and survival in the Reach
- **Not the core thesis anymore:** open-world shooter framing, LZ/base-building campaign structure, or a “water theft / siphon theology” plot
- **UX direction:** pulp jungle military, riverine warfare, manila-dossier command surfaces, and clearer action hierarchy

## Design Pillars

1. **Campaign-first RTS** — authored missions are the flagship product
2. **Cross-platform clarity** — phone, tablet, and desktop must all feel intentional
3. **One coherent war fantasy** — OEF vs Scale-Guard, not competing canon layers
4. **Procedural asset production** — source art stays code-authored and build-generated
5. **Readable tactical drama** — strong silhouettes, premium portraits, concise UI, clear hierarchy

## Tech Stack

| Layer | Current stack |
|---|---|
| UI | React 19 + shadcn/ui + Tailwind v4 |
| Game rendering | Phaser 3 |
| State | Koota ECS + singleton traits |
| AI / simulation support | Yuka + authored scenario systems |
| Audio | Tone.js |
| Build | Vite + TypeScript + pnpm |
| Quality | Biome + Vitest + Playwright |

## Runtime Architecture

- `src/app/App.tsx` routes between `menu`, `campaign`, `briefing`, `game`, `victory`, `settings`, and `canteen`
- `src/ui/` owns the React UI layer, including the redesigned command-post landing page and dossier overlays
- `src/Scenes/BootScene.ts` loads prebuilt sprite atlases from `public/assets`
- `src/entities/` holds campaign content, sprites, palettes, asset contracts, families, presets, and variant recipes
- `src/ecs/` and `src/scenarios/` hold gameplay state and authored mission flow

## UI Direction

The front door is now a cleaner **New Game / Continue Game / Settings** landing page with supporting flows moved into **dossier-style overlays** instead of extra full-screen hops.

Visual target:

- jungle camo meets riverine warfare with animals
- manila dossier tabs, stamped labels, typewriter copy
- clearer information hierarchy, less menu churn, fewer walls of text
- shadcn added as a component baseline, not as a generic visual replacement

Typography currently centers on:

- `Black Ops One`
- `Special Elite`
- `Share Tech Mono`

## SP-DSL Asset Pipeline

The sprite pipeline is code-authored and build-generated.

### Source

- entity definitions in `src/entities/**`
- palettes in `src/entities/palettes.ts`
- contracts / families / presets / variant recipes in:
  - `src/entities/asset-contracts.ts`
  - `src/entities/asset-families.ts`
  - `src/entities/asset-generator-presets.ts`
  - `src/entities/asset-variant-recipes.ts`

### Build

Run:

```bash
pnpm build:sprites
```

This script:

1. imports the entity registry
2. resolves legacy and SP-DSL sprite definitions
3. renders frames at `1x`, `2x`, and `3x`
4. packs category atlases for `units`, `buildings`, `resources`, `props`, `terrain`, and `portraits`
5. emits manifest files:
   - `public/assets/asset-contracts.json`
   - `public/assets/asset-families.json`
   - `public/assets/asset-generator-presets.json`
   - `public/assets/asset-variant-recipes.json`
6. emits scale-specific atlas PNG + JSON files in `public/assets/<category>/`

`BootScene` then selects the best atlas scale for the device and loads the generated atlases at runtime.

## Development Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:browser
pnpm test:e2e
pnpm build:sprites
```

## Documentation Map

### Canonical / start here

- `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md`
- `docs/references/Copilot-Copilot_Chat_VT91k21R.md`
- `docs/README.md`
- `AGENTS.md`
- `CLAUDE.md`

### Supporting docs

- `docs/architecture/overview.md`
- `docs/architecture/testing-strategy.md`
- `docs/design/game-design-document.md`
- `TESTING.md`
- `LORE.md`

### Historical / non-authoritative unless explicitly revived

- `CHUNK_PERSISTENCE.md`
- `docs/superpowers/specs/2026-03-23-rts-pivot-design.md`
- `docs/superpowers/plans/2026-03-23-*.md`

If two docs disagree, prefer the **2026-03-24 RTS canon spec** and the **current implementation**.

## Repo Priorities Right Now

1. keep the RTS canon and wording coherent across the repo
2. continue polishing the responsive command-post / tactical UI
3. improve portrait and sprite quality while preserving the SP-DSL pipeline
4. keep authored missions, campaign flow, and asset manifests aligned

## Guidance For Contributors

- Do not reintroduce the old open-world shooter as active canon
- Do not make `siphons`, `sludge`, or `water` the sole metaphysical reason for the war
- Prefer **Otter Elite Force** in player-facing copy; treat `URA` as background lore only
- Keep mobile-first responsiveness and play-surface clarity as blocking quality bars
- When changing the pipeline or product direction, update docs in the same pass
