# Project Brief: OTTER: ELITE FORCE

OTTER: ELITE FORCE (The Copper-Silt Reach) is a mobile-first, procedurally generated 3rd-person tactical shooter set in an open world riverine environment.

## Core Identity
- **Project Name**: OTTER: ELITE FORCE
- **Genre**: 3rd-person tactical shooter with territory control and base building
- **Aesthetic**: "Full Metal Jacket" meets "Wind in the Willows"
- **Setting**: The Copper-Silt Reach — a humid, high-noon riverine warzone
- **Primary Goal**: Transform a monolithic POC into an open world "Tactical Simulation" with persistent progression and strategic depth.

## Game Structure: Open World, Not Levels

**CRITICAL DESIGN DECISION**: We have eliminated the concept of discrete "levels" in favor of a single, persistent open world.

- **Procedural Generation**: The world is generated chunk-by-chunk as the player explores
- **Fixed on Discovery**: Once a chunk is discovered, its terrain, entities, and objectives are fixed in Zustand state and persisted to localStorage
- **Never Regenerated**: Returning to a discovered coordinate shows the exact same layout (no regeneration)
- **Infinite but Consistent**: Deterministic seed-based generation ensures the world is vast but repeatable

## Main Menu: Game Loader Interface

The main menu serves as a **New Game / Saved Game Loader + Canteen Hub**:
1. **New Game**: Start fresh in the Copper-Silt Reach with default loadout
2. **Continue/Load Game**: Resume a persistent open world campaign from save state
3. **Canteen Access**: Meta-progression hub for permanent upgrades between sessions

## Three-Faction Conflict

1. **URA Peacekeepers** (Player): Elite otter platoon on a liberation mission
2. **Scale-Guard Militia** (Enemy): Fundamentalist predator cult controlling the Reach via industrial siphons
3. **Native Inhabitants** (Neutral): Mustelid villagers caught in the crossfire, awaiting liberation

## Capture the Flag: Territory Control Mechanics

Each game is an open world with **Capture the Flag** style strategic objectives:

### Strategic Objectives (Territory Control)
- **Industrial Siphons**: Destroy to liberate coordinates and plant URA flags
- **Marsh Gas Stockpiles**: Capture to disrupt enemy logistics
- **Prison Camps**: Rescue captured platoon members at specific high-threat coordinates

### Spoils of War (Resource Economy)
- **Clam Baskets**: Supply credits (may be booby-trapped)
- **Village Liberation**: Peacekeeping points and intel rewards
- **Civilian Rescue**: Credits and narrative progression

## Three Victory Verticals

To prevent the game from becoming "boring" and ensure progression variety:

### Vertical 1: The Platoon (In-World Rescues)
- Characters are NOT purchased — they must be **rescued** from specific coordinates
- Gen. Whiskers is held in a Prison Camp at COORD (x:5, z:5)
- Discovering trapped allies provides long-term exploration goals

### Vertical 2: The Arsenal (Canteen Upgrades)
- Supply Credits are spent at the FOB Canteen on **permanent gear upgrades**
- Muzzle velocity, armor plating, grenade types, medical supplies
- This is the primary economic sink

### Vertical 3: Intel (Peacekeeping Rewards)
- High Peacekeeping scores reveal **Points of Interest** on the map
- Coordinates of trapped allies, hidden caches, or boss encounters
- Creates narrative-driven exploration incentives

## Base Building at the LZ

**First Objective**: Secure your Landing Zone at COORD (x:0, z:0)

- **Modular Construction**: Use algorithmic building system (stilts, floors, walls, roofs)
- **Base Expansion**: Build defensive structures and resource processing
- **Strategic Hub**: All extractions and supply drops originate from your LZ
- **Permanent Progress**: Base state is saved and persists across sessions

## Three Difficulty Modes (Escalation Only)

Difficulty can go **UP but NOT DOWN** — once committed, no going back:

### 1. SUPPORT Mode (Base Tier)
- **Supply Drops**: Can be called anywhere in the Reach
- **Extraction**: Available from any coordinate
- **Safety Net**: Lowest risk, best for learning the mechanics

### 2. TACTICAL Mode (Mid Tier)
- **"The Fall" Mechanic**: If integrity drops below 30%, triggers emergency extraction
- **Must Return to LZ**: Navigate back to (x:0, z:0) for evacuation to salvage position
- **Risk Factor**: Chance that your base is damaged by enemy while you're down
- **Cannot downgrade to SUPPORT**

### 3. ELITE Mode (Permadeath)
- **One Life**: Death purges save data entirely
- **Start from Scratch**: Expelled from the Reach, begin new campaign
- **Ultimate Challenge**: Every decision carries permanent weight
- **Cannot downgrade to TACTICAL or SUPPORT**

## Technical Constraints & Mandates

1. **Procedural Supremacy**: Absolutely no external asset files (.obj, .png, .mp3, etc.). Everything must be generated via code at runtime.
2. **Mobile-First**: High performance (target 60fps) on mobile browsers with robust dual-stick touch controls.
3. **Single-File Heritage**: While developed in modules, maintain the zero-setup, highly portable spirit of the original POC.
4. **React 19 Baseline**: Use the latest stable React features for state and UI management.
5. **Open World Persistence**: Zustand store with localStorage persistence for world state.

## Strategic Objectives Summary

- **Infinite Exploration**: Seed-based chunk generation for an endless, deterministic river environment
- **Persistent Progression**: Territory control, base building, and character unlocks saved permanently
- **Advanced AI**: Coordinated pack-hunting predators using Yuka steering behaviors
- **Tactical Depth**: Strategic objectives, environmental hazards, and three-faction dynamics
- **Victory Conditions**: Liberation through occupation — plant the flag, secure the Reach
