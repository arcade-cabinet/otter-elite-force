# Active Context: OTTER: ELITE FORCE

## Current State (2025-12-28)

All PRs have been merged or closed. The codebase is **clean with zero open PRs**.

### Recent Merges (2025-12-28)

| PR | Title | Status |
|----|-------|--------|
| #64 | Standardize Node.js 22 and pnpm 10 | ✅ Merged |
| #63 | Fix E2E blocking CI | ✅ Merged |
| #49 | Enemy health bars and suppression mechanics | ✅ Merged |
| #62 | Pull request integration workflow | ❌ Closed (approach reverted) |
| #41 | Test coverage 75% | ❌ Closed (needs cleanup) |

### CI/CD Status
- Main branch: All workflows passing
- GitHub Pages: Deploying successfully
- E2E tests: Non-blocking (continue-on-error enabled)

### Latest Features in Main
- **Enemy Health Bars**: Visual feedback for enemy damage
- **Suppression Mechanics**: Tactical suppression system
- **Damage Feedback UI**: Visual damage indicators
- **Territory State Display**: Chunk status (HOSTILE/NEUTRAL/SECURED) in HUD
- **Chunk Hibernation**: Performance optimization for distant chunks
- **Workflow Standardization**: Node.js 22, pnpm 10 across all workflows

---

## Historical Context

The project has successfully transitioned through a complex integration phase. The monolithic POC refactor has been decomposed into domain-specific modules and reassembled into a cohesive foundation. We are now focused on the **1.0 Milestone: Tactical Simulation** with emphasis on completing the open world architecture.

## Recent Accomplishments

- **@react-three/rapier Physics Integration**: Added proper physics engine for collisions, character controller, trigger volumes
- **UI/UX Target Audience Simulation**: Comprehensive playthrough scenarios (new player, returning player, combat, build mode, canteen)
- **HUD Improvements**: Visible joystick zones with labels, first-objective prompts for new players, directional damage indicators, haptic feedback on damage
- **Conditional Stats Display**: Empty stats hidden for new players (RANK, TERRITORY, PEACEKEEPING only show when > 0)
- **Movement Assessment**: Confirmed NOT tank controls - using world-space movement with smooth rotation interpolation
- **DRY Procedural Assembly System**: Complete component library with 45+ meshes, faction materials, universal character skeleton
- **ECS-Assembly Integration Bridge**: Seamless connection between Miniplex ECS and procedural generation
- **Modular Weapon Assembly**: Detachable weapon parts (receiver, barrel, stock, grip, magazine) with attachment system
- **Settlement Assembler**: Algorithmic village/outpost generation with 5 layout patterns (scattered, circular, linear, grid, defensive)
- **Build Mode Framework**: Snap points, placement validation, resource costs for player base construction
- **Canteen Loadout System**: Full weapon/equipment customization with stat calculation
- **ECS Slot Definitions**: Single source of truth for all slot types (equipment, attachments, gadgets, build categories) - no more scattered constants
- **ECS Data Templates**: Weapons, equipment, and buildables defined as ECS-centric templates replacing old constants approach
- **World Generator ECS Integration**: POIs automatically spawn proper ECS settlements via assembly bridge
- **499 Tests Passing**: Comprehensive coverage including ECS systems, AI, slots, data templates, assembly, and UI
- **SonarCloud Integration**: Automated PR comments for code quality, complexity, security hotspots, and technical debt tracking

## Current Work Focus

### Completed: Main Menu Redesign ✅
The main menu has been updated to a proper **Game Loader Interface**:

1. ✅ **New Game Button**: Start fresh campaign with difficulty selection
2. ✅ **Continue/Load Game**: Resume persistent open world from save state  
3. ✅ **Canteen Access**: Meta-progression hub accessible from menu
4. ✅ **Difficulty Selection**: SUPPORT → TACTICAL → ELITE (escalation only)
5. ✅ **Removed Level Select**: No more "MISSIONS" grid - pure open world

### Completed: Open World Implementation ✅

The shift from discrete "levels" to persistent open world is complete:

- [x] Removed all references to "level selection" from MainMenu UI
- [x] Chunk persistence in Zustand store (discoverChunk never regenerates)
- [x] Territory score tracking in store and displayed in menu
- [x] Peacekeeping score tracking
- [x] Constants updated with DIFFICULTY_CONFIGS and KEY_COORDINATES

### Completed: Testing Alignment ✅

All tests updated to verify open world design:

- [x] MainMenu unit tests verify NO level select exists
- [x] E2E tests use NEW GAME / CONTINUE pattern
- [x] Integration tests cover chunk persistence
- [x] Structure/Settlement assembler test suites
- [x] ECS systems tests (Movement, Combat, AI)
- [x] ECS data tests (weapons, buildables, slots)
- [x] Component library tests
- [x] All 497 tests passing

### Next: Base Building UI & Gameplay Polish

The store has base building primitives, but UI needs implementation:

- [ ] Build mode toggle in HUD when at LZ (0, 0)
- [ ] Component placement interface
- [ ] Visual feedback for placed components
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

- [ ] Bullet tunneling at high framerates (Rapier CCD available, needs wiring)
- [ ] `localStorage` quota handling (needs user-facing fail-state)
- [x] ~~Mobile safe-area padding~~ → FIXED: Visible joystick zones with labels
- [x] ~~Chunk hibernation for distant AI~~ → FIXED: hibernateDistantChunks action in gameStore
- [ ] LOD system for dense enemy encounters
- [ ] Canteen UI not wired to ECS weapon templates (full system exists, needs UI)
- [x] ~~Enemy health bars not visible to player~~ → FIXED: EnemyHealthBars.tsx added
- [ ] Build mode ghost preview not implemented

## Integration Milestones

| Milestone | Status | Date |
|-----------|--------|------|
| Domain Decomposition | ✅ Complete | 2025-12-27 |
| Feature Branch Merge | ✅ Complete | 2025-12-27 |
| Memory Bank Init | ✅ Complete | 2025-12-27 |
| Miniplex ECS Architecture | ✅ Complete | 2025-12-27 |
| Intelligent World Layout | ✅ Complete | 2025-12-27 |
| DRY Component Library | ✅ Complete | 2025-12-27 |
| ECS-Assembly Integration | ✅ Complete | 2025-12-27 |
| Modular Weapon Assembly | ✅ Complete | 2025-12-27 |
| ECS Slot Definitions | ✅ Complete | 2025-12-27 |
| ECS Data Templates | ✅ Complete | 2025-12-27 |
| WorldGen ECS Integration | ✅ Complete | 2025-12-27 |
| @react-three/rapier Physics | ✅ Complete | 2025-12-27 |
| Movement Assessment (NOT tank) | ✅ Complete | 2025-12-27 |
| UI/UX Simulation Pass | ✅ Complete | 2025-12-27 |
| HUD Improvements | ✅ Complete | 2025-12-27 |
| 499 Tests Passing | ✅ Complete | 2025-12-27 |
| Main Menu Redesign | ✅ Complete | 2025-12-27 |
| Open World Persistence | 🔄 In Progress | - |
| Physics Integration | 🔄 In Progress | - |
| Base Building v1 | ⏳ Pending | - |
| Difficulty System | ⏳ Pending | - |
| Canteen UI Wire-up | ⏳ Pending | - |

## Agent Coordination Notes

- **Unified Store**: All strategic logic centralized in `src/stores/gameStore.ts`
- **Memory Bank Strategy**: Primary context preservation for all sessions
- **React 19 Stable**: Firmly established as project baseline
- **Modular Architecture**: 6 domain branches now unified in main
