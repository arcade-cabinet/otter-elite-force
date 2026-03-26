# Runtime Architecture

This document defines the target runtime architecture for the rewrite branch.

## Layers

- Solid shell
  - routing
  - menus
  - campaign flow
  - settings
  - HUD and overlays
- Runtime host boundary
  - one tactical mounting surface for campaign and skirmish
  - engine-owned run metadata, seed summary, map summary, diagnostics identity
- Runtime-owned projection models
  - `cameraProjection`
  - `loopProjection`
  - pure camera clamping, panning, bounds, and zoom behavior owned under `engine/runtime`
  - loop projection owns frame delta capping, pause semantics, fps smoothing, and `GameClock` projection
  - authored mission actions flow through a runtime event queue, not app-level shims
- LittleJS tactical runtime
  - frame clock
  - input sampling
  - camera
  - render passes
  - tactical container ownership
- bitECS world
  - hot scalar data only
- world-owned runtime stores
  - queues
  - script tags
  - Yuka references
  - navigation graph
  - dialogue
  - diagnostics
  - transient runtime caches

## Data Ownership

- Simulation truth lives in `GameWorld`.
- UI reads only from `GameBridge` projections.
- Tactical HUD projection includes mission-critical weather and boss encounter state, not just generic shell chrome.
- Runtime-only objects never live in persistence DTOs.
- Script identity comes from authored `scriptId`, not inferred content strings.
- Session descriptors define world size, camera focus, seed metadata, and run summary for both campaign and skirmish.
- App routing mounts tactical play through `RuntimeHost`; campaign and skirmish share the same LittleJS-first tactical entry path with no live Konva bridge.
- Scenario actions that affect presentation or tactical state, such as weather shifts, zone reveals, camera focus, reinforcements, and boss spawns, update `GameWorld` directly and are consumed by the active runtime from the event queue.
- Campaign result resolution is runtime-driven and stored separately from campaign progression so result overlays and replay flows refer to the mission that just ended, not the mission that was already advanced.
- Locked authored zones are gameplay constraints in the active runtime, not just HUD notices.

## Removal Policy

- Gameplay code marks entities for removal.
- Runtime flushes removals at the end of the frame.
- Immediate destruction is not allowed in gameplay systems.
