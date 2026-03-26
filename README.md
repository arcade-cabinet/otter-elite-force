# Otter: Elite Force

Campaign-first 2D RTS set in the Copper-Silt Reach. Command the Otter Elite Force against the Scale-Guard occupation across 16 story-driven missions.

## Status

**Active development.** Engine rewrite in progress — migrating to LittleJS + bitECS + SolidJS.

See [Engine Rewrite Plan](docs/engine-rewrite-plan.md) for architecture details.

## Play

- **Web:** [arcade-cabinet.github.io/otter-elite-force](https://arcade-cabinet.github.io/otter-elite-force/)
- **Android:** Debug APKs attached to [GitHub Releases](https://github.com/arcade-cabinet/otter-elite-force/releases)

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Rendering + Input | LittleJS | WebGL canvas, sprites, tiles, input, camera |
| ECS | bitECS | Data-oriented entity component system |
| UI | SolidJS | Sidebar, menus, briefing dialogue |
| AI | Yuka | Steering behaviors, pathfinding, FSM |
| Audio | Tone.js | Procedural sound effects |
| Build | Vite | Dev server, production builds |
| Mobile | Capacitor | Android/iOS wrapper |

## Project Structure

```
src/
  ecs/          — bitECS component definitions + world setup
  game/         — LittleJS game loop, input, rendering
  ui/           — SolidJS overlay components
  systems/      — ECS systems (combat, economy, movement, etc.)
  scenarios/    — Mission trigger engine + DSL
  entities/     — Mission definitions, unit/building data, registry
  ai/           — Pathfinding, steering, FSM profiles
docs/
  engine-rewrite-plan.md  — Current architecture plan
  missions/               — 16 mission design documents
public/
  assets/sprites/         — 12 animal sprite atlases + JSON
  assets/tiles/           — 138 Kenney tiles + 112 blend tiles
```

## Development

```bash
pnpm install
pnpm dev          # dev server
pnpm build        # production build
pnpm test         # unit tests
pnpm test:browser # browser tests (Chromium)
pnpm lint         # biome check
```

## Game Design

- **Player:** The Captain — silent protagonist commanding from the lodge (field HQ)
- **Command:** Col. Bubbles (HQ tactical), FOXHOUND (intel), Gen. Whiskers (strategic)
- **Enemy:** Scale-Guard — reptilian occupiers led by Kommandant Ironjaw
- **Resources:** Fish, timber, salvage
- **Campaign:** 4 chapters, 16 missions, 128x128+ tile maps, zone-based progression

## License

Private repository. All rights reserved.
