# 🤖 CLAUDE MISSION CONTROL: OTTER ELITE FORCE

> **Historical note (2026-03-24):** The open-world tactical-simulation direction below is legacy context. Active RTS canon is now defined by `docs/superpowers/specs/2026-03-24-rts-canon-responsive-asset-overhaul-plan.md` and the campaign-first RTS specs.

## 🎯 Current Operational Goal

Transform from **Technical Demo** to **Open World Tactical Simulation**. The modular foundation is built, now we must implement the persistent open world architecture, game loader interface, and base building systems.

## 🗺️ Open World Architecture (CRITICAL)

**NO LEVELS. ONE PERSISTENT WORLD.**

The game consists of a single, infinite open world — NOT discrete levels:

- **Chunk-Based Generation**: World generates as player explores
- **Fixed On Discovery**: Once visited, terrain is PERMANENT in Zustand
- **Never Regenerates**: Return to chunk (x:5, z:3) = same layout as before
- **Deterministic Seeds**: Coordinates → reproducible chunk content

### Main Menu = Game Loader

The menu is a **Campaign Command Interface**:
1. **New Game**: Fresh deployment with difficulty selection
2. **Continue**: Resume persistent world from save state
3. **Canteen**: Meta-progression hub for permanent upgrades

## 🏁 Three Victory Verticals

To prevent monotony, players have three paths to victory:

### Vertical 1: The Platoon (In-World Rescues)
- Characters are NOT purchased — they must be **rescued**
- Gen. Whiskers: Prison Camp at (x:5, z:5)
- Cpl. Splash: Underwater cache at (x:-10, z:15)
- Sgt. Fang: Scale-Guard stronghold at (x:10, z:-10)

### Vertical 2: The Arsenal (Canteen Upgrades)
- **Economic sink** for Supply Credits
- Muzzle velocity, armor plating, grenades
- Permanent unlocks persist across sessions

### Vertical 3: Intel (Peacekeeping Rewards)
- High Peacekeeping scores reveal **Points of Interest**
- Map coordinates of trapped allies, hidden caches, boss encounters
- Narrative-driven exploration incentives

## 🎖️ Three Difficulty Modes (Escalation Only)

Once committed to higher difficulty, **NO GOING BACK**:

| Mode | Supply Drops | Extraction | Special Mechanic |
|------|-------------|------------|------------------|
| **SUPPORT** | Anywhere | Any coordinate | Safety net |
| **TACTICAL** | LZ only | LZ only | "The Fall" at 30% HP |
| **ELITE** | LZ only | LZ only | Permadeath |

### "The Fall" Mechanic (TACTICAL Mode)
If integrity drops below 30%:
1. Emergency state triggers
2. Must navigate back to LZ (0, 0)
3. Risk that base is damaged while you're down
4. Reach LZ = salvage position and continue

## 🏗️ Base Building at LZ

**First Objective**: Secure and fortify your Landing Zone at (0, 0)

- **Modular Components**: Stilts, floors, walls, roofs
- **Algorithmic Snapping**: Components connect logically
- **Persistent State**: Base saves across sessions
- **Expansion**: Build outward as you gather resources

## 🪖 Tactical Verticals (Combat)

### 1. Squad Intelligence (Priority: HIGH)
- **Problem**: Predators are individually smart but collectively dumb
- **Solution**: Implement "Pack Logic" where Scale-Guard scouts signal heavy gators
- Use Yuka's `EntityManager` to coordinate pincer maneuvers

### 2. Environmental Hazards (Priority: MEDIUM)
- **Oil Slicks**: High slip, flammability logic (IMPLEMENTED)
- **Toxic Sludge**: Health drain in Scale-Guard territory
- **Monsoon Rain**: Visual haze, reduced muzzle velocity

### 3. Destruction & Explosives (Priority: MEDIUM)
- **Claymore Clams**: Booby-trapped spoils
- **Grenade Launchers**: Area denial weapons
- **Destructible Huts**: Modular components can be splintered

### 4. Rescue & Extraction (Priority: HIGH)
- **Loop**: Rescue Ally → Escort to LZ → Specialist Unlocked
- **Vertical**: Map characters to specific high-threat chunks

## 🛠️ Tech Stack & Bulwarks

- **Frontend**: React 19 + R3F + Drei
- **AI**: Yuka (FSM, Steering)
- **Audio**: Tone.js (Procedural Synth)
- **State**: Zustand (Persistent Save Data)
- **Quality**: Biome (Lint/Format), Vitest (Logic), Playwright (E2E)

## 🕵️ AI Self-Improvement Loops

When performing a loop, Claude must:

1. **Analyze Store Impact**: Does this mechanic need to save state?
2. **Verify Performance**: Test with high-density `InstancedMesh`
3. **Audit Grit**: Does it look like *Full Metal Jacket* or *Tron*? **Reject sci-fi drift.**
4. **Haptic Sync**: Ensure impacts trigger vibration API where supported
5. **Check Open World Alignment**: Does this respect fixed-on-discovery?

## 🚫 Design Anti-Patterns

**REJECT these patterns:**
- ❌ Level select screens
- ❌ Regenerating terrain on revisit
- ❌ Cyborgs, time travel, chrome aesthetics
- ❌ Characters as store purchases
- ❌ Difficulty downgrade options
- ❌ External asset files

**EMBRACE these patterns:**
- ✅ Open world chunk persistence
- ✅ Territory occupation and liberation
- ✅ Gritty, analog military aesthetic
- ✅ Rescue-based character progression
- ✅ Base building as first objective
- ✅ Escalation-only difficulty commitment

## 🗺️ Persistent Coordinates of Interest

| Coordinate (x, z) | Location | Significance |
|-------------------|----------|--------------|
| (0, 0) | Landing Zone / Base | Starting point, extraction hub |
| (5, 5) | Prison Camp | Gen. Whiskers rescue |
| (10, -10) | The Great Siphon | Scale-Guard HQ, boss encounter |
| (-15, 20) | Healer's Grove | Peacekeeping hub, medical upgrades |
| (-10, 15) | Underwater Cache | Cpl. Splash rescue |
| (8, 8) | Gas Depot | Strategic objective cluster |

## 📋 Immediate Implementation Priorities

1. **Main Menu → Game Loader**: Remove level select, add New/Continue/Canteen
2. **Difficulty Selection UI**: Three modes with escalation warning
3. **Chunk Persistence**: Ensure discovered chunks never regenerate
4. **Territory Tracking**: HUD shows secured vs. total chunks
5. **Base Building v1**: Simple placement interface at LZ
