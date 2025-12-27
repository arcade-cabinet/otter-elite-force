# Project Brief: OTTER: ELITE FORCE

OTTER: ELITE FORCE (The Copper-Silt Reach) is a mobile-first, procedurally generated 3rd-person tactical shooter.

## Core Identity
- **Project Name**: OTTER: ELITE FORCE
- **Genre**: 3rd-person tactical shooter
- **Aesthetic**: "Full Metal Jacket" meets "Wind in the Willows"
- **Primary Goal**: Transform a monolithic POC into a modular, production-ready "Tactical Simulation" while preserving its procedural soul.

## Technical Constraints & Mandates
1. **Procedural Supremacy**: Absolutely no external asset files (.obj, .png, .mp3, etc.). Everything (models, textures, audio) must be generated via code at runtime.
2. **Mobile-First**: High performance (target 60fps) on mobile browsers with robust dual-stick touch controls.
3. **Single-File Heritage**: While developed in modules, the final build should maintain the zero-setup, highly portable spirit of the original POC.
4. **React 19 Baseline**: Use the latest stable React features for state and UI management.

## Strategic Objectives
- **Infinite Exploration**: Seed-based chunk generation for an endless, deterministic river environment.
- **Persistent Progression**: Campaign meta-progression (ranks, medals, character unlocks) saved via `localStorage`.
- **Advanced AI**: Coordinated pack-hunting predators using professional AI steering behaviors (Yuka).
- **Tactical Depth**: Strategic objectives (destroying siphons, capturing gas stockpiles) and environmental hazards (mud pits, oil slick ignition).
