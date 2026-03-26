---
title: Documentation Index
description: Map of all active documentation for Otter Elite Force
version: 1.0.0
updated: 2026-03-26
tags: [index, docs, navigation]
status: active
---

# Documentation Index

## Root Documents

| File | Purpose |
|------|---------|
| [README.md](../README.md) | Project overview, stack, setup |
| [CLAUDE.md](../CLAUDE.md) | Claude Code specific instructions |
| [AGENTS.md](../AGENTS.md) | Authoritative agentic context (AI agents start here) |
| [CHANGELOG.md](../CHANGELOG.md) | Version history (managed by release-please) |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Workflow, commit conventions, PR checklist |
| [SECURITY.md](../SECURITY.md) | Security policy and dependency management |

## Architecture

| Document | Tags | Description |
|----------|------|-------------|
| [architecture/overview.md](architecture/overview.md) | `architecture` `systems` | Stack, data flow, tech decisions |
| [engine-rewrite-plan.md](engine-rewrite-plan.md) | `architecture` `migration` | LittleJS + bitECS + SolidJS migration plan |

## Design

| Document | Tags | Description |
|----------|------|-------------|
| [design/game-design.md](design/game-design.md) | `design` `mechanics` `ux` | Core mechanics, interaction model, design pillars |
| [design/lore.md](design/lore.md) | `lore` `narrative` `factions` | World-building, characters, campaign arc |
| [design/art-direction.md](design/art-direction.md) | `design` `art` `visual` | Pixel art style, color palette, sprite conventions |
| [design/audio-design.md](design/audio-design.md) | `design` `audio` | Sound design, Tone.js procedural audio |
| [design/balance-framework.md](design/balance-framework.md) | `design` `balance` | Unit stats, resource pacing, difficulty scaling |

## Missions

16 mission design documents with full zone maps, trigger chains, dialogue scripts, and balance notes.

| Mission | Chapter | Type | Document |
|---------|---------|------|----------|
| 1-1 Beachhead | First Landing | tutorial | [01-beachhead.md](missions/01-beachhead.md) |
| 1-2 The Causeway | First Landing | escort | [02-causeway.md](missions/02-causeway.md) |
| 1-3 Firebase Delta | First Landing | capture-hold | [03-firebase-delta.md](missions/03-firebase-delta.md) |
| 1-4 Prison Break | First Landing | stealth | [04-prison-break.md](missions/04-prison-break.md) |
| 2-1 Siphon Valley | Deep Operations | assault | [05-siphon-valley.md](missions/05-siphon-valley.md) |
| 2-2 Monsoon Ambush | Deep Operations | defense | [06-monsoon-ambush.md](missions/06-monsoon-ambush.md) |
| 2-3 River Rats | Deep Operations | naval | [07-river-rats.md](missions/07-river-rats.md) |
| 2-4 Underwater Cache | Deep Operations | commando | [08-underwater-cache.md](missions/08-underwater-cache.md) |
| 3-1 Dense Canopy | Turning Tide | recon | [09-dense-canopy.md](missions/09-dense-canopy.md) |
| 3-2 Scorched Earth | Turning Tide | destruction | [10-scorched-earth.md](missions/10-scorched-earth.md) |
| 3-3 Entrenchment | Turning Tide | tidal | [11-entrenchment.md](missions/11-entrenchment.md) |
| 3-4 The Stronghold | Turning Tide | assault | [12-fang-rescue.md](missions/12-fang-rescue.md) |
| 4-1 The Great Siphon | Final Offensive | siege | [13-great-siphon.md](missions/13-great-siphon.md) |
| 4-2 Iron Delta | Final Offensive | amphibious | [14-iron-delta.md](missions/14-iron-delta.md) |
| 4-3 Serpent's Lair | Final Offensive | boss | [15-serpent-lair.md](missions/15-serpent-lair.md) |
| 4-4 The Reckoning | Final Offensive | finale | [16-last-stand.md](missions/16-last-stand.md) |

## References

| File | Purpose |
|------|---------|
| [references/poc_final.html](references/poc_final.html) | Original working POC — proven input/rendering in raw Canvas2D |

## Archive

Historical documents at `docs/archive/`. Not authoritative — may reference superseded technology (Phaser, Babylon, Expo).
