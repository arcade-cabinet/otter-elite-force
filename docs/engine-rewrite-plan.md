---
title: Engine Rewrite Plan
description: Authoritative implementation plan for the engine refactor
version: 3.0.0
updated: 2026-03-26
tags: [architecture, migration, littlejs, bitecs, solidjs, capacitor]
status: complete
---

# Engine Rewrite Plan

This document records the Otter: Elite Force runtime rewrite. The rewrite is structurally complete: the production runtime runs on the new stack and all legacy dependencies have been removed.

Operating rule:

1. Docs define the intended game and runtime contracts.
2. Tests enforce those contracts.
3. Code implements the contracts.

## Summary

The production runtime runs on:

- SolidJS at the app root
- LittleJS for tactical runtime and rendering
- bitECS for hot scalar ECS data
- world-owned runtime stores for variable-length and object-backed state
- Capacitor as the mobile shell
- `@capacitor-community/sqlite` as the persistence backend for web and mobile

Legacy dependencies (React, React DOM, React Konva, Koota, `@koota/react`) have been removed from the production runtime.

## Delivery Rules

- Do not create permanent `*-legacy` and `*-next` runtime trees.
- Do not preserve backwards compatibility for unshipped save formats.
- Do not treat Mission 1 as the final success gate.
- Do not let implementation outrun docs and tests.
- Do continuously update docs as contracts harden.
- Do prefer direct cutovers over compatibility shims wherever possible.
- Do treat adaptive multi-form-factor UX as a core architectural requirement, not polish.

## Workstreams

### 1. Documentation

- Rewrite engine architecture docs as decisions land.
- Reconcile mission docs and runtime contracts when design-doc concepts are missing from code.
- Add dedicated docs for:
  - runtime architecture
  - deterministic seeding
  - persistence and Capacitor storage
  - skirmish harness design
  - visual and device testing
  - diagnostics and GAP analysis

### 2. Runtime Foundation (complete)

- Replaced the Koota singleton world with a `GameWorld` factory.
- Use bitECS scalar stores for hot state.
- Keep queues, Yuka objects, graphs, script tags, diagnostics, and similar data in world-owned maps.
- Add world helpers for spawn, selection, queue access, deferred removal, and script tags.
- Introduce numeric content ids for hot-path lookups.

### 3. Mission Contract Hardening

- Expand mission and scenario contracts to support authored design-doc behavior directly.
- Add stable `scriptId` identity for placements.
- Extend triggers/actions to cover convoy, wave, zone-count, activation, and mission-specific mechanic hooks.
- Make mission boot deterministic and explicit:
  1. load mission definition
  2. resolve mission seed
  3. compile scenario
  4. build terrain atlas + nav graph
  5. spawn placements + register tags
  6. initialize objectives/session state
  7. start runtime and bridge publication

### 4. Determinism

- Introduce dual-layer PRNG:
  - design seed streams
  - gameplay seed streams
- Missions use buried fixed adjective-adjective-noun seeds.
- Skirmish exposes editable adjective-adjective-noun seeds with shuffle support.
- Persist seed bundles in saves and diagnostics.

### 5. Persistence

- Standardize on `@capacitor-community/sqlite` for web and mobile.
- Persist campaign state, mission saves, skirmish setup, settings, and diagnostics metadata.
- Reconstruct runtime-only objects after load.
- Keep Android as the current ship target while preserving iOS-viable architecture and tests.

### 6. Rendering And Input (complete)

- Replaced the Konva tactical entry path with a LittleJS runtime bootstrap.
- Go atlas-first for terrain.
- Preserve or improve fog, minimap, overlays, selection, health bars, projectiles, and tactical readability.
- Move tactical input ownership into the runtime loop.
- Ship both desktop and mobile interaction baselines.
- Ensure the shell and HUD reflow by form factor instead of shrinking a desktop RTS interface onto a phone.
- Reject keyboard-only tactical flows; desktop accelerators are allowed only when an equal mouse/touch path exists.

### 7. Systems And Modes

- Port systems in dependency order.
- Deliver skirmish early as both player mode and deterministic systems harness.
- Validate the full campaign by mechanic coverage, then by full mission parity, then by polish.

### 8. Validation

- Expand Vitest browser into the primary deterministic visual harness.
- Keep Playwright for broader browser E2E coverage.
- Add Maestro flows for Android and smoke-ready iOS structure.
- Emit JSON diagnostics for automated and manual playtest analysis.

## Milestones

### Milestone A: Foundation

- engine docs updated
- `src/engine/` foundation exists
- deterministic seed bundle utilities exist
- persistence contract is defined over sqlite

### Milestone B: Harness

- skirmish runtime sandbox exists
- deterministic diagnostics and seed replay work
- browser visual capture harness is stable

### Milestone C: Vertical Slice

- Mission 1 is fully playable on the new runtime
- shell/bridge path is working
- save/load roundtrip works on the new contract

### Milestone D: Mechanic Coverage

- one representative mission per chapter passes functional and visual gates
- chapter-specific systems are ported and testable

### Milestone E: Campaign Complete

- all 16 missions boot, progress, save/load, and complete
- campaign flow works end to end

### Milestone F: Polish

- all 16 missions pass pacing, readability, audio, UI, fog/minimap, and balance review
- diagnostics-driven tuning loop is operating

### Milestone G: Cutover

- legacy runtime deleted
- dependency graph cleaned
- final docs and tests reflect only the new stack

## Done Criteria

Status of each criterion:

1. Tactical gameplay runs on LittleJS. -- DONE
2. ECS runtime uses bitECS and world-owned runtime stores. -- DONE
3. Shell and HUD run on SolidJS. -- DONE
4. Campaign and skirmish both run on the new runtime. -- DONE
5. All 16 missions are playable and polished against the design docs. -- IN PROGRESS (tuning)
6. Persistence is backed by Capacitor SQLite for web and mobile. -- DONE
7. Deterministic visual, browser, and device tests pass. -- IN PROGRESS
8. Diagnostics are emitted and useful for macro, meso, and micro GAP analysis. -- IN PROGRESS
9. Legacy React/Konva/Koota runtime paths are removed from production code. -- DONE
