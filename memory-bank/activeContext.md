# Active Context: OTTER: ELITE FORCE

## Current State

The project has successfully transitioned through a complex integration phase. The monolithic POC refactor has been decomposed into domain-specific modules and reassembled into a cohesive foundation. We are now focused on the **1.0 Milestone: Tactical Simulation** with emphasis on completing the open world architecture.

## Recent Accomplishments

- **Engine Stabilization**: Fixed memory leaks in `AudioEngine`, hardened `InputSystem` against ghost drags, and optimized the `GameLoop` input resets.
- **Combat Fidelity**: Implemented procedural muzzle flashes, projectile collisions, and environmental hazard (Oil Ignition) interactions.
- **Progression Loop**: Finalized the `Victory` extraction sequence and the `Canteen` meta-progression shop foundation.
- **Assembly Hardening**: Unified the store logic and constants following a domain-specific decomposition pass.
- **Memory Bank**: Established comprehensive documentation for agent context preservation.

## Current Work Focus

### Primary: Main Menu Redesign
The main menu must be updated to reflect the new **Game Loader Interface**:

1. **New Game Button**: Start fresh campaign with difficulty selection
2. **Continue/Load Game**: Resume persistent open world from save state  
3. **Canteen Access**: Meta-progression hub (should be accessible from menu)
4. **Difficulty Selection**: SUPPORT → TACTICAL → ELITE (escalation only)

### Secondary: Open World Implementation

Complete the shift from discrete "levels" to persistent open world:

- [ ] Remove all references to "level selection" from UI
- [ ] Implement chunk persistence in Zustand store
- [ ] Add coordinate-based HUD display (COORD: X, Y)
- [ ] Ensure discovered chunks are never regenerated
- [ ] Implement territory score tracking

### Tertiary: Base Building Foundation

The LZ at (0, 0) should support modular construction:

- [ ] Define base building component types (Floor, Wall, Roof, Stilt)
- [ ] Implement algorithmic snap-together building logic
- [ ] Create base state persistence in store
- [ ] First-objective tutorial: "Secure Your LZ"

## Immediate Next Steps

1. **Main Menu Overhaul**: Transform level-select into game-loader interface
2. **Difficulty System**: Implement three-tier escalation-only difficulty
3. **Territory Mechanics**: Add chunk securing and URA flag planting
4. **Base Building UI**: Create building placement interface at LZ
5. **Pack Hunting AI**: Finalize Gator coordination (Blackboard system)

## Active Decisions

### Confirmed Design Choices

| Decision | Status | Rationale |
|----------|--------|-----------|
| Open World (not levels) | ✅ CONFIRMED | Eliminates repetition, creates ownership |
| Fixed-on-discovery terrain | ✅ CONFIRMED | Makes exploration meaningful |
| Three victory verticals | ✅ CONFIRMED | Prevents gameplay monotony |
| Escalation-only difficulty | ✅ CONFIRMED | Adds weight to commitment |
| Rescue-based character unlocks | ✅ CONFIRMED | In-world goals, not store purchases |
| Base building at LZ | ✅ CONFIRMED | First objective, persistent progress |

### Pending Decisions

| Decision | Options | Notes |
|----------|---------|-------|
| Minimap implementation | Fog-of-war map vs. compass indicator | Mobile screen real estate concern |
| Weather system | Dynamic vs. zone-based | Performance impact TBD |
| Raft piloting | Full vehicle mode vs. speed boost only | Control complexity concern |

## Important Patterns and Preferences

### "Grit" Not "Sci-Fi"
- NO time travel, cyborgs, or chrome aesthetics
- YES mud, canvas, oil, analog military equipment
- Vietnam-era Mekong Delta atmosphere
- "High-noon bleached" color palette

### Three-Faction Balance
- **URA (Player)**: Liberation through occupation
- **Scale-Guard**: Industrial pollution cult  
- **Natives**: Caught in crossfire, awaiting rescue

### Economy Separation
- **Strategic Objectives**: Territory control (Siphons, Gas, Prisons)
- **Spoils of War**: Resources (Credits, Clams, Intel)

## Known Technical Debt

- [ ] Bullet tunneling at high framerates (needs continuous collision detection)
- [ ] `localStorage` quota handling (needs user-facing fail-state)
- [ ] Mobile safe-area padding in certain ultrawide aspect ratios
- [ ] Chunk hibernation for distant AI (CPU optimization)
- [ ] LOD system for dense enemy encounters

## Integration Milestones

| Milestone | Status | Date |
|-----------|--------|------|
| Domain Decomposition | ✅ Complete | 2025-12-27 |
| Feature Branch Merge | ✅ Complete | 2025-12-27 |
| Memory Bank Init | ✅ Complete | 2025-12-27 |
| Main Menu Redesign | 🔄 In Progress | - |
| Open World Persistence | 🔄 In Progress | - |
| Base Building v1 | ⏳ Pending | - |
| Difficulty System | ⏳ Pending | - |

## Agent Coordination Notes

- **Unified Store**: All strategic logic centralized in `src/stores/gameStore.ts`
- **Memory Bank Strategy**: Primary context preservation for all sessions
- **React 19 Stable**: Firmly established as project baseline
- **Modular Architecture**: 6 domain branches now unified in main
