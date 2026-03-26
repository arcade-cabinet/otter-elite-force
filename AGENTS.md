---
title: Agentic Context
description: Source of truth for AI agents working on Otter Elite Force
---

# AGENTS.md

Authoritative context for AI coding agents (Claude, Codex, Gemini, etc.) working on this repository.

## Project Identity

**Otter: Elite Force** — campaign-first 2D RTS. 16 missions across 4 chapters. Player is the Captain commanding from a lodge. Otters vs Scale-Guard reptilian occupiers in the Copper-Silt Reach.

## Architecture (Target)

Engine rewrite in progress. See [docs/engine-rewrite-plan.md](docs/engine-rewrite-plan.md).

| Layer | Current | Target |
|-------|---------|--------|
| Rendering | react-konva (Konva.js) | **LittleJS** |
| ECS | Koota | **bitECS** |
| UI | React 19 | **SolidJS** |
| AI | Yuka | Yuka (unchanged) |
| Audio | Tone.js | Tone.js (unchanged) |
| Build | Vite 8 | Vite (unchanged) |

## Reference Codebases

Available at `~/src/reference-codebases/`:
- `LittleJS/` — game engine (rendering, input, tiles, audio)
- `wendol-village/` — Warcraft-style RTS built on LittleJS
- `bitECS/` — data-oriented ECS library
- `koota/` — current ECS (being replaced)
- `konva/` — current renderer (being replaced)
- `phaser/` — game framework reference
- `template-react-ts/` — Phaser + React integration template

## Code Principles

1. **No stubs, no fallbacks, no placeholders.** If it doesn't work, it fails hard.
2. **No `as any`, no `!` assertions.** Proper null guards with early return.
3. **No backward compatibility.** Refactor cleanly, break cleanly.
4. **Verify before merging.** Run locally, check deployed site, wait for feedback.
5. **Play the game.** TypeScript compiling does not mean it works.
6. **Conventional commits.** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`

## Command Structure (Lore)

| Character | Rank | Role | Speaks in |
|-----------|------|------|-----------|
| Player | Captain | Silent protagonist, field commander | — |
| Col. Bubbles | Colonel | HQ tactical officer | Mission briefings, orders |
| FOXHOUND | Intel handler | Signals intelligence | Threat warnings, zone intel |
| Gen. Whiskers | General | Strategic command | Campaign moments, victory |
| Medic Marina | Medical officer | Field hospital | Casualty reports |

All radio contacts are HIGHER rank or orthogonal to Captain. Ground units (River Rat, Mudfoot, etc.) are anonymous grunts.

## Asset Pipeline

- **Sprites:** 12 purchased animal sprite sheets with Aseprite JSON atlases in `public/assets/sprites/`
- **Tiles:** 138 Kenney CC0 tiles + 112 procedural blend tiles in `public/assets/tiles/`
- **Portraits:** Procedural Canvas2D rendering (only remaining procedural art)
- **Atlas generator:** `scripts/generate-atlases.py`
- **Tile curation:** `scripts/curate-tiles.py`
- **Blend tile generator:** `scripts/generate-blend-tiles.py`

## Mission System

16 missions defined in `src/entities/missions/chapter{1-4}/`. Design docs in `docs/missions/`.

Each mission has: 128x128+ tile map, 4-8 named zones, 2-5 phases, triggers with dialogue, explicit unit placements.

Scenario engine at `src/scenarios/engine.ts` evaluates triggers per frame. DSL helpers at `src/entities/missions/dsl.ts`.

## Key Files

| File | Purpose |
|------|---------|
| `docs/engine-rewrite-plan.md` | Architecture plan (read first) |
| `docs/missions/00-framework.md` | Mission design template |
| `CLAUDE.md` | Claude Code specific instructions |
| `src/scenarios/engine.ts` | Trigger evaluation engine |
| `src/entities/missions/dsl.ts` | Mission scripting DSL |

## Cursor Cloud specific instructions

### Environment

- **Node 24 LTS** via nvm (see `.nvmrc`). Run `source ~/.nvm/nvm.sh && nvm use 24` before any Node/pnpm commands if the shell hasn't activated it.
- **pnpm 10.26.2** via corepack (`corepack enable && corepack prepare pnpm@10.26.2 --activate`).
- **xvfb** is pre-installed for headed browser testing in headless CI environments.
- **Playwright Chromium** is pre-installed at `~/.cache/ms-playwright/` (full browser + headless shell + ffmpeg).

### Running the app

- `pnpm dev` — starts Vite dev server (default port 5173, use `--port 8081` for E2E).
- No backend services, databases, or external dependencies required — this is a fully client-side game.

### Commands reference

See `README.md` "Development" section. Key commands: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`.

### Visual / headed E2E testing

Use `xvfb-run` to run Playwright in headed mode for screenshot and video capture:

```
xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" npx playwright test --project "Desktop Chrome" --headed
```

The Playwright config (`playwright.config.ts`) adds WebGL/SwiftShader flags automatically. Screenshots are captured on every test (`screenshot: "on"` in config).

### Known issues (pre-existing)

- `pnpm build` fails at the `tsc` step due to unused-import errors in `src/canvas/usePointerInput.ts`. The Vite build itself succeeds — use `npx vite build` to skip tsc if needed.
- `pnpm lint` reports pre-existing Biome errors/warnings (4 errors, 7 warnings, 170 infos). The lint tool itself works correctly.
- E2E smoke test "app renders without critical console errors" fails due to a 404 resource fetch — a pre-existing issue, not an environment problem.
