# Active Context: OTTER: ELITE FORCE

## Current State
The project has successfully transitioned through a complex integration phase. The monolithic monolithic POC refactor has been stabilized and decomposed into manageable domains. We are now focused on the **1.0 Milestone: Tactical Simulation**.

## Recent Accomplishments
- **Engine Stabilization**: Fixed memory leaks in `AudioEngine`, hardened `InputSystem` against ghost drags, and optimized the `GameLoop` input resets.
- **Combat Fidelity**: Implemented procedural muzzle flashes, projectile collisions, and environmental hazard (Oil Ignition) interactions.
- **Progression Loop**: Finalized the `Victory` extraction sequence and the `Canteen` meta-progression shop.
- **Assembly Hardening**: Unified the store logic and constants following a domain-specific decomposition pass.

## Current Work Focus
Consolidating the consolidated foundation. All functional domains are now merged into `main` (via the latest rebase of the original PR). The focus is now on polishing the gameplay experience and preparing for advanced features.

## Immediate Next Steps
1. **AI Coordination**: Finalize the design for "Pack Hunting" logic (Blackboard system) where Gators flank the player rather than circling individually.
2. **Narrative Layer**: Implement the procedural dialogue injection for mission cutscenes.
3. **Environmental variety**: Add weather-based visibility and sound modifiers (Rain/Fog).
4. **Performance Profiling**: Stress-test "Dense Jungle" chunks on mid-range mobile hardware.

## Active Decisions
- **Unified Store**: All strategic logic is now centralized in `src/stores/gameStore.ts`.
- **Memory Bank Strategy**: Adopted as the primary context preservation method for all future sessions.
- **React 19 Stable**: Firmly established as the project baseline.
