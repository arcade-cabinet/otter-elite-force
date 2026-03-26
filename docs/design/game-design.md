---
title: Game Design Document
description: Core mechanics, interaction model, design pillars
version: 1.0.0
updated: 2026-03-26
tags: [design, mechanics, interaction, ux]
status: active
---

# Game Design Document

## Design Pillars

1. **Campaign first** — every mission tells a story through zones, triggers, and radio dialogue
2. **Desktop AND mobile** — identical experience on mouse and touch
3. **Every pixel counts** — purchased sprite art, Kenney tiles, zero procedural placeholders
4. **The war is about logistics** — crossings, depots, settlements, salvage, and control
5. **Modern lens, nostalgic core** — build a modern adaptive strategy UX that evokes 90s RTS ideas without copying their ergonomic limitations

## Interaction Model

Interaction rule:

- If a tactical action cannot be performed cleanly with mouse and touch, the UX is wrong and must be redesigned.
- Desktop may have accelerators, but the primary model must also work on a phone.
- Layout, spacing, HUD density, and affordance placement must adapt by form factor rather than shrinking a desktop UI onto mobile.

### Desktop
- **Left click** on unit → select it
- **Left click + drag** → box selection (extends from click point)
- **Left click** on ground (with selection) → move command
- **Left click** on resource → swarm harvest (all idle workers)
- **Left click** on enemy → swarm attack (all idle combat units)
- **Right click drag** → camera pan
- **Middle click drag** → camera pan
- **Mouse wheel** → zoom
- **NO edge scroll** — mouse at viewport edge does nothing
- **No keyboard-only camera movement** — desktop interaction must map cleanly to touch/mobile equivalents

### Mobile
- **Tap** on unit → select it
- **Tap + hold + drag** → extends selection box
- **Tap** on ground/resource/enemy → same as left click
- **Two-finger drag** → camera pan
- **Pinch** → zoom

### Layout Adaptation
- Phone HUD must prioritize large tap targets, lower information density, and quick access to primary actions
- Tablet HUD may expose more persistent tactical information, but must still remain touch-first
- Desktop HUD may show richer persistent panels, but cannot depend on hover-only or keyboard-only core flows

### Build System
- Sidebar shows build grid when nothing selected
- Click building button → instant placement near lodge
- All idle workers rally to construct

## Resources

| Resource | Source | Used For |
|----------|--------|----------|
| Fish | River fish spots | Units, basic buildings |
| Timber | Mangrove trees | Buildings, walls |
| Salvage | Wreckage caches | Advanced buildings, upgrades |

## Mission Structure

- **Map:** 128x128 to 160x160 tiles
- **Zones:** 4-8 named areas with discovery triggers
- **Phases:** 2-5, unlocking progressively
- **Win:** Complete all primary objectives
- **Lose:** Lodge destroyed (commando missions: all units killed)
- **Bonus:** Optional objectives for extra rewards

## Unit Mechanics

- Lodge = player's command presence (losing it = mission failure)
- Units auto-retreat to lodge at 25% HP
- Workers auto-loop: gather → return to lodge → gather
- Trees are impassable harvestable resources (harvest outer to reach inner)
- Fog of war: unexplored (black), explored (dimmed), visible (clear)
- Escape may act as a desktop accelerator for deselection or closing overlays, but every such action must also have a visible on-screen control
