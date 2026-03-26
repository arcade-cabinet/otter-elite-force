# CLAUDE.md

Claude Code instructions for this repository. For full agentic context, see [AGENTS.md](AGENTS.md).

## Quick Reference

- **Stack:** LittleJS (rendering/input) + bitECS (ECS) + SolidJS (UI) — see [engine rewrite plan](docs/engine-rewrite-plan.md)
- **Commands:** `pnpm dev` / `pnpm build` / `pnpm test` / `pnpm lint`
- **Node:** 24 LTS (see `.nvmrc`)
- **Lint:** Biome (`biome check .`)
- **Tests:** Vitest (`pnpm test` + `pnpm test:browser`)

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`)
- No `as any`, no `!` non-null assertions, no stubs, no fallbacks — errors fail hard
- No backward compatibility hacks — refactor cleanly, break cleanly
- No edge scroll — camera pans via click+drag, arrow keys, two-finger drag only
- All sprites from purchased atlases or Kenney CC0 tiles — zero procedural rendering except portraits
- Faction IDs: `ura` (player), `scale_guard` (enemy), `neutral`

## Command Structure (Lore)

- **Player** = the Captain (silent protagonist, commands from lodge)
- **Col. Bubbles** = HQ tactical officer (gives mission briefings/orders, HIGHER rank than player)
- **FOXHOUND** = intel handler (enemy positions, threat warnings)
- **Gen. Whiskers** = strategic command (campaign-level decisions)
- All radio contacts must be higher rank or orthogonal to Captain
- Ground units are anonymous grunts (River Rat, Mudfoot, etc.)

## Key Directories

```
src/engine/                   — Runtime core (world, systems, rendering, session, bridge)
src/engine/world/             — GameWorld factory, bitECS components
src/engine/systems/           — All gameplay systems (movement, combat, economy, etc.)
src/engine/rendering/         — Terrain, sprite, fog renderers
src/engine/runtime/           — LittleJS runtime shell, camera, loop, input
src/engine/session/           — Mission bootstrap, scenario runtime, campaign flow
src/engine/bridge/            — SolidJS reactive bridge (signals/stores)
src/solid/                    — SolidJS shell (screens, HUD, mobile)
src/entities/missions/        — 16 mission TypeScript implementations
src/scenarios/                — Trigger engine + DSL
docs/engine-rewrite-plan.md   — Architecture plan
docs/missions/                — 16 mission design docs
public/assets/sprites/        — 12 animal sprite atlases with JSON
public/assets/tiles/          — Kenney tiles + procedural blend tiles
```

## Do NOT

- Use edge scroll (mouse at viewport edge)
- Add procedural sprite fallbacks
- Use `as any` or non-null assertions
- Merge PRs without verifying locally AND on deployed site
- Assume TypeScript compiling = working — play the game
- Reference archived docs in `docs/archive/` as current
