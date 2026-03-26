---
title: Architecture Overview
description: System architecture, data flow, technology decisions
version: 1.0.0
updated: 2026-03-26
tags: [architecture, systems, dataflow]
status: active
---

# Architecture Overview

## Target Stack

See [Engine Rewrite Plan](../engine-rewrite-plan.md) for full migration details.

```
SolidJS → UI overlay (sidebar, menus, briefing)
    ↕ signals (bridge.ts)
LittleJS → game canvas (rendering, input, animations, tiles)
    ↕ direct array access
bitECS → state (components, queries, relations)
    ↕ direct function calls
Systems → game logic (combat, economy, movement, scenarios)
    ↕ library calls
Yuka → AI (steering, pathfinding, FSM)
```

## Data Flow

1. **Input** → LittleJS reads `mousePos`, `mouseWasPressed()`, `keyIsDown()`
2. **Commands** → input handler writes to bitECS OrderQueue components
3. **Systems** → game loop processes orders, moves units, resolves combat
4. **Rendering** → LittleJS reads bitECS Position/UnitType/Health, draws sprites
5. **UI sync** → game loop pushes selected unit/resources to SolidJS signals

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LittleJS over Konva | Built-in input, camera, tiles, animations. Wendol proves it works for RTS. |
| bitECS over Koota | SoA storage, no framework bindings needed, faster queries. |
| SolidJS over React | Fine-grained reactivity, no virtual DOM overhead for game UI. |
| Purchased sprites over procedural | Visual quality. 12 animal atlases with 465 animation frames. |
| Kenney tiles over procedural terrain | Consistent art style, proper edge transitions, CC0 licensed. |
| POC input pattern | 100 lines, proven on mobile+desktop, no gesture detector needed. |
