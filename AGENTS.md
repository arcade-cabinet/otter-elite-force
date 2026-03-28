---
title: Agentic Context
description: Source of truth for AI agents working on Otter Elite Force
---

# AGENTS.md

Authoritative context for AI coding agents (Claude, Codex, Gemini, etc.) working on this repository.

## Project Identity

**Otter: Elite Force** — campaign-first 2D RTS. 16 missions across 4 chapters. Player is the Captain commanding from a lodge. Otters vs Scale-Guard reptilian occupiers in the Copper-Silt Reach.

The design target is not a literal 1990s RTS replica. It is a modern game that is emblematic of 1990s RTS ideas. Nostalgic strategy, pacing, readability, and fantasy are desired. Outdated ergonomics are not.

## Architecture

| Layer | Stack |
|-------|-------|
| Rendering | **LittleJS** (Canvas2D tactical runtime) |
| ECS | **bitECS** (scalar stores) + world-owned maps |
| UI Shell | **SolidJS** (screens, HUD, mobile) |
| AI | Yuka |
| Audio | Tone.js |
| Persistence | **@capacitor-community/sqlite** |
| Build | Vite 8 |

See [docs/engine-rewrite-plan.md](docs/engine-rewrite-plan.md) for full architecture details.

## Reference Codebases

Available at `~/src/reference-codebases/`:
- `LittleJS/` — game engine (rendering, input, tiles, audio)
- `wendol-village/` — Warcraft-style RTS built on LittleJS
- `bitECS/` — data-oriented ECS library
- `phaser/` — game framework reference

## Code Principles

1. **No stubs, no fallbacks, no placeholders.** If it doesn't work, it fails hard.
2. **No `as any`, no `!` assertions.** Proper null guards with early return.
3. **No backward compatibility.** Refactor cleanly, break cleanly.
4. **Verify before merging.** Run locally, check deployed site, wait for feedback.
5. **Play the game.** TypeScript compiling does not mean it works.
6. **Conventional commits.** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`

## Interaction Contract

1. **Mouse/touch parity is mandatory.** If a core gameplay action cannot be performed with mouse/tap/drag, the interaction model has failed and must be redesigned.
2. **Do not make keyboard-only gameplay primary.** Keyboard shortcuts may accelerate existing actions, but they cannot be the only sane path for tactical play.
3. **Camera movement must be pointer-first.** Drag, minimap, tap, and gesture controls are the source of truth. Do not add or preserve arrow-key / WASD camera pan as a primary interaction.
4. **Escape may exist only as an accelerator.** If `Escape` deselects or closes something, the same action must also be available as an on-screen control.
5. **Prefer direct cuts over compatibility shims.** For the rewrite branch, deleting or temporarily excluding unfinished code is better than preserving legacy wrappers that slow the cutover.
6. **Adaptive UX is mandatory.** The UI must rearrange and re-prioritize itself so the same game works well on phones, tablets, and desktop monitors. If an interface only makes sense on desktop, it is not finished.

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

## Playtester

`src/engine/playtester/` contains a headless AI governor that plays every mission:
- `governor.ts` -- perceive-decide-act loop
- `goals.ts` -- priority-ordered goal hierarchy (survive > gather > build > train > scout > attack)
- `actions.ts` -- execute decisions against GameWorld
- `perception.ts` -- read world state into structured snapshot
- `runner.ts` -- run a full mission headless and produce a PlaytestReport
- `allMissions.test.ts` -- validate all 16 missions boot and run

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
