# Progress: OTTER: ELITE FORCE

## Status: Open World Foundation In Progress

The project is currently at **Version 8.0 (Modular Refactor Stage)**. The technical foundation is solid and the game is playable from menu to extraction. Focus has shifted to implementing the full open world vision.

## Milestone Checklist

### 1. Core Foundations ✅
- [x] pnpm/Vite/TS Infrastructure
- [x] Biome/Vitest/Playwright Tooling
- [x] Tone.js Audio Engine
- [x] Nipplejs/Gyro Input System
- [x] Zustand Persistence (v8 schema)
- [x] Memory Bank documentation system

### 2. Gameplay Mechanics (Partial) 🔄
- [x] Procedural Otter Rig (Sgt. Bubbles)
- [x] Swappable Weapon System
- [x] Predator AI (Gator, Snake, Snapper)
- [x] Tactical Objectives (Siphons, Gas, Clams)
- [x] Environmental Hazards (Mud, Oil Ignition)
- [x] Raft Piloting & Villager Escort
- [ ] Pack Hunting AI coordination
- [ ] Climbing mechanics refinement
- [ ] Weapon suppression effects

### 3. Open World System 🔄
- [x] Chunk-based procedural generation
- [x] Deterministic seed-based terrain
- [x] **Intelligent World Layout Algorithm** (Poisson Disc + MST + Coherent Terrain)
- [x] **Difficulty-based radial POI placement** (harder content further from LZ)
- [x] **Path connectivity graph** (all POIs reachable via MST)
- [x] **POI-specific content generation** (rescue cages, boss arenas, siphon clusters)
- [ ] Fixed-on-discovery persistence (chunks never regenerate)
- [ ] Territory control state tracking
- [ ] Coordinate HUD display
- [ ] Fog-of-war / discovered area visualization
- [ ] Chunk hibernation for distant AI

### 4. Main Menu / Game Loader ✅
- [x] Basic Main Menu screen
- [x] **New Game button with difficulty selection**
- [x] **Continue/Load Game from save state**
- [x] **Canteen access from main menu**
- [x] Remove legacy "level select" entirely
- [x] Difficulty escalation UI (can go up, not down)
- [x] Territory and peacekeeping scores displayed
- [x] Rescue-based character unlock messaging

### 5. Difficulty System ⏳
- [ ] SUPPORT mode implementation
  - [ ] Supply drops from anywhere
  - [ ] Extraction from any coordinate
- [ ] TACTICAL mode implementation
  - [ ] "The Fall" mechanic at 30% HP
  - [ ] Must return to LZ for extraction
  - [ ] Base damage risk during Fall
- [ ] ELITE mode implementation
  - [ ] Permadeath enabled
  - [ ] Save purge on death
- [ ] Escalation lock (no downgrade)

### 6. Base Building at LZ 🔄
- [x] **DRY Component Library** (45+ reusable mesh definitions)
- [x] **Modular component system** (Floor, Wall, Roof, Stilt, Ladder, etc.)
- [x] **Algorithmic snap-together building** (validation + snap point detection)
- [x] **Structure Assembler** (Huts, Platforms, Watchtowers)
- [x] **Settlement Assembler** (Villages, Outposts, Camps with layout patterns)
- [x] **Buildable Items Catalog** (player construction with resource costs)
- [ ] Base state persistence
- [ ] "Secure Your LZ" first objective
- [ ] Defensive structures (Tower, Barricade) - *logic exists, needs integration*
- [ ] Resource storage and processing

### 7. Territory Control (CTF Mechanics) 🔄
- [x] Industrial Siphon destruction
- [x] URA Flag visual on secured territory
- [ ] Territory score tracking in HUD
- [ ] Gas Stockpile capture objectives
- [ ] Prison Camp rescue missions
- [ ] Three victory condition tracking

### 8. Three Victory Verticals 🔄
- [ ] **Vertical 1: Platoon Rescues**
  - [ ] Character positions at specific coordinates
  - [ ] Prison cage interaction
  - [ ] Character unlock on rescue
- [x] **Vertical 2: Arsenal Upgrades**
  - [x] Canteen shop foundation
  - [x] Credit economy
  - [x] **Modular Weapon Assembly** (receiver + barrel + stock + grip + magazine)
  - [x] **Weapon Attachments** (optics, barrels, grips, mags with stat modifiers)
  - [x] **Equipment Customization** (headgear, vests, backpacks)
  - [x] **Canteen Loadout System** (full loadout management)
- [ ] **Vertical 3: Intel System**
  - [ ] Peacekeeping score tracking
  - [ ] Intel rewards at thresholds
  - [ ] Map POI reveals

### 9. UI/UX Polish 🔄
- [x] Over-the-shoulder camera
- [x] Touch joystick controls
- [x] Basic HUD (HP, Objectives)
- [ ] Mobile safe-area compliance
- [ ] Coordinate display (COORD: X, Y)
- [ ] Territory/Peacekeeping counters
- [ ] Difficulty indicator
- [ ] Base building interface

### 10. Testing & Quality ✅
- [x] Unit tests for core systems
- [x] E2E smoke tests
- [x] Visual regression tests
- [x] CI/CD pipeline
- [ ] Performance benchmarks
- [ ] Mobile device testing matrix

## Path to 1.0 (Tactical Simulation)

### Phase 1: Main Menu & Difficulty (Priority: HIGH)
- [ ] Transform menu into game loader interface
- [ ] Implement three difficulty modes
- [ ] Add difficulty escalation lock

### Phase 2: Open World Persistence (Priority: HIGH)
- [ ] Complete chunk persistence system
- [ ] Remove all "level" references
- [ ] Add territory tracking

### Phase 3: Base Building (Priority: MEDIUM)
- [ ] Implement modular construction
- [ ] Create LZ securing objective
- [ ] Add build mode interface

### Phase 4: Victory Verticals (Priority: MEDIUM)
- [ ] Character rescue at specific coords
- [ ] Intel reveal system
- [ ] Three win condition tracking

### Phase 5: AI & Combat Polish (Priority: MEDIUM)
- [ ] Pack hunting coordination
- [ ] Tactical flanking maneuvers
- [ ] Suppression mechanics

### Phase 6: Environmental Depth (Priority: LOW)
- [ ] Weather system (Rain/Fog)
- [ ] Day/night transitions
- [ ] Advanced hazards

## Known Issues

### Critical
- [x] ~~Main menu still shows legacy "level select"~~ → FIXED: Game loader interface
- [ ] Chunks may regenerate on revisit (persistence incomplete)

### High Priority
- [ ] Bullet tunneling at high framerates → Rapier CCD available but not wired
- [ ] `localStorage` quota error handling
- [ ] Missing difficulty mode implementation (SUPPORT/TACTICAL/ELITE logic)
- [ ] Canteen UI not wired to ECS weapon templates (code exists, needs UI)

### Medium Priority
- [x] ~~Mobile safe-area padding issues~~ → FIXED: Visible joystick zones
- [ ] Base building ghost preview missing
- [ ] Pack hunting AI not coordinated
- [ ] Enemy health bars not visible to player

### Low Priority
- [ ] LOD missing for dense enemy encounters
- [ ] Chunk hibernation for distant AI
- [ ] Weather effects not implemented
- [ ] Haptics only on damage, not on other interactions

## Recent Integration Victories

- **@react-three/rapier Physics Integration** - Added proper physics engine for collisions, character controller, trigger volumes
- **UI/UX Target Audience Simulation** - Comprehensive playthrough scenarios (new player, returning player, combat, build mode, canteen)
- **HUD Improvements** - Visible joystick zones, first-objective prompts, directional damage indicators, haptic feedback
- **Conditional Stats Display** - Empty stats hidden for new players, reducing UI clutter
- **DRY Procedural Assembly System** - Component Library with 45+ meshes, faction materials, universal skeleton
- **Structure/Settlement Assemblers** - Algorithmic building generation with layout patterns
- **Build Mode Framework** - Snap points, placement validation, resource costs
- **Modular Weapon Assembly** - Detachable weapon parts, attachments, stat calculation
- **ECS-Assembly Bridge** - Seamless integration between ECS and procedural generation
- **Intelligent World Layout Algorithm** - Poisson Disc Sampling + MST paths + coherent terrain
- **Difficulty-based Content Scaling** - Enemy counts/types scale with distance from LZ
- **POI-specific Content Generation** - Boss arenas, prison camps, siphon clusters
- **ECS Slot Definitions** - Single source of truth for all slot types (equipment, attachments, gadgets, build categories)
- **ECS Data Templates** - Weapons, equipment, buildables defined as ECS-centric templates (replacing old constants)
- **World Generator ECS Integration** - POIs automatically spawn ECS settlements via assembly bridge
- **499 Tests Passing** - Comprehensive coverage including ECS systems, AI, slots, data templates, assembly, UI
- **55%+ Statement Coverage** - Key systems (stores, ECS data, assembly) at 75-95%
- **Type Modularization** - `SaveData`, `ChunkData`, `PlacedComponent` centralized in `types.ts`, no duplicates
- **Shared Test Fixtures** - `src/test/fixtures.ts` provides `createMockSaveData()`, `createMockChunk()` helpers
- **Biome Config** - Test files exempt from `noExplicitAny` rule for valid edge case testing
- **SonarCloud Integration** - Automated PR comments for code quality, complexity, security hotspots, and technical debt
- Unified domain-specific PRs into hardened `main`
- Resolved "shaky" assembly bugs in state management
- Verified all unit tests passing after modular re-integration
- Established comprehensive Memory Bank for agent alignment
- Created testing strategy documentation

## Evolution of Project Decisions

| Date | Decision | Impact |
|------|----------|--------|
| 2025-12-26 | "No levels, open world" | Fundamental architecture shift |
| 2025-12-26 | "Fixed on discovery" terrain | Eliminates regeneration, adds ownership |
| 2025-12-26 | Three victory verticals | Prevents gameplay monotony |
| 2025-12-26 | Escalation-only difficulty | Adds commitment weight |
| 2025-12-26 | Rescue-based unlocks | Characters are goals, not purchases |
| 2025-12-26 | Base building at LZ | First objective, persistent progress |
| 2025-12-27 | Domain decomposition | 6 PRs for cleaner review |
| 2025-12-27 | Memory Bank adoption | Agent context preservation |
| 2025-12-27 | Miniplex ECS architecture | Modular game logic separation |
| 2025-12-27 | Intelligent world layout | Poisson Disc + MST + difficulty scaling |
| 2025-12-27 | DRY Component Library | Maximum asset reuse, faction-based reskinning |
| 2025-12-27 | Universal Character Skeleton | Shared rig for all characters (35 joints) |
| 2025-12-27 | Modular Weapon Assembly | Weapons detached from characters, interchangeable parts |
| 2025-12-27 | ECS-Assembly Bridge | Procedural generation feeds directly into ECS |
| 2025-12-27 | ECS Slot Definitions | Single source of truth for slots replaces scattered constants |
| 2025-12-27 | ECS Data Templates | Weapons/equipment/buildables as proper ECS entities |
| 2025-12-27 | WorldGenerator ECS Integration | POIs spawn ECS settlements automatically |
| 2025-12-27 | @react-three/rapier | Physics engine for proper collisions, character controller |
| 2025-12-27 | UI/UX Simulation Pass | Target audience playthrough scenarios identified gaps |
| 2025-12-27 | Movement Assessment | Confirmed NOT tank controls - world-space movement |
| 2025-12-27 | HUD Improvements | Visible joysticks, first objective, damage direction |
