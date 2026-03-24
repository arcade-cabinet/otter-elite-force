# OTTER: ELITE FORCE — RTS Pivot Design Specification

**Date:** 2026-03-23
**Status:** Draft — Pending Review
**Tag:** v0.1.0-ddl-snapshot (pre-pivot baseline)

---

## 1. Vision Statement

Transform Otter: Elite Force from a 3D open-world action game into a **campaign-driven 2D RTS** inspired by the golden age of 90s strategy games (Warcraft, C&C, StarCraft, Age of Empires). The game reimagines famous jungle campaigns of the 20th century — Korea, Vietnam, Burma, Malaya — through the lens of the otter military universe already established in the existing lore.

The player commands Sgt. Bubbles, a Rambo-style warrior-leader of an elite otter squad under the gruff, cigar-smoking Gen. Whiskers. Through 16 scripted campaign missions with diverse objectives, the player builds bases, gathers resources, trains armies, and liberates the Copper-Silt Reach from the Scale-Guard Militia.

**Core design mandate:** Every decision must ensure the game is **equally fun and playable on desktop, tablet, and mobile.** No platform is secondary.

---

## 2. Technology Stack

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| **Platform** | Capacitor | 8.x | Native iOS/Android wrapper + web |
| **Build** | Vite | 7.x | Dev server, bundling, HMR |
| **Game Engine** | Phaser | 3.90+ | Canvas/WebGL rendering, input, cameras, tilemaps |
| **ECS** | Koota | latest | Entity/trait/query state management |
| **AI** | Yuka | 0.7.x | Steering, pathfinding, FSM, goal-driven behavior |
| **UI** | React 19 + DaisyUI | latest | HUD, menus, briefings, portraits (DOM overlay) |
| **State Bridge** | Zustand | 5.x | Campaign persistence, React↔Phaser communication |
| **Persistence** | sql.js + Drizzle (web) / @capacitor-community/sqlite (native) | 8.x | Save games, settings, campaign progress |
| **Audio** | Tone.js | 15.x | Procedural synth music and SFX |
| **Quality** | Biome + Vitest + Playwright | latest | Lint/format, unit tests, E2E |

### Platform Persistence Strategy (Bok Pattern)

```
DatabaseAdapter interface
├── Web: sql.js (WASM) + Drizzle ORM, persisted to localStorage
└── Native: @capacitor-community/sqlite (real SQLite via Capacitor plugin)

Platform detection: Capacitor.isNativePlatform()
Dynamic imports keep native code out of web bundles.
```

### Architecture Layers

```
┌──────────────────────────────────────────────────────┐
│                    React + DaisyUI                    │
│  (HUD, Menus, Briefings, Portraits — DOM overlay)    │
├──────────────────────────────────────────────────────┤
│                    Phaser Canvas                      │
│  (Tilemap, Sprites, Fog of War, Particles, Camera)   │
├──────────────────────────────────────────────────────┤
│                    Koota ECS World                    │
│  (Entities, Traits, Queries, Relations, Systems)      │
├──────────────────┬───────────────────────────────────┤
│   Yuka AI        │        Game Systems               │
│   (Steering,     │  (Combat, Economy, Building,      │
│    Pathfinding,  │   Weather, Territory, Scenario)    │
│    FSM, Goals)   │                                    │
├──────────────────┴───────────────────────────────────┤
│              Zustand + SQLite Persistence             │
│  (Campaign progress, save states, settings)           │
└──────────────────────────────────────────────────────┘
```

---

## 3. Art Direction: The ASCII Sprite Factory

**All visual assets are procedurally generated from ASCII art definitions.** No external image files.

### Pipeline

```
ASCII Art Definition (text grid + color map)
         │
         ▼
   Sprite Factory (converts to pixel buffer)
         │
         ▼
   Phaser Texture (loaded as spritesheet)
         │
         ▼
   Game renders at target resolution
```

### Why ASCII-as-Pixels

1. **Pixel-level control** — Each character maps to a pixel with density (glyph shape) AND color. A `#` in brown is fur texture. A `.` in white is an eye glint. Two channels of visual information per pixel.
2. **Human-authorable** — Portraits and sprites are typed in a text editor. Most ergonomic pixel art format possible.
3. **Resolution-independent** — Same ASCII source renders at 1x, 2x, 4x by changing pixel scale. Cross-platform scaling for free.
4. **No external assets** — Consistent with existing design mandate.

### Asset Scale Tiers

| Asset Type | Grid Size | Examples |
|-----------|-----------|---------|
| **Unit sprites** | 16×16 | Mudfoot, River Rat, Gator |
| **Building sprites** | 32×32 | Barracks, Command Post, Watchtower |
| **Terrain tiles** | 16×16 | Grass, water, mud, mangrove |
| **Portraits** | 64×96 | Sgt. Bubbles, Gen. Whiskers (SCUMM-quality) |
| **Cutscene paintings** | 128×96+ | Briefing scenes, key narrative moments |

### Aesthetic

"Full Metal Jacket meets Wind in the Willows" — gritty 1960s Mekong Delta riverine warfare with cartoon otter soldiers. **No sci-fi. No chrome. Analog military.**

Color palette: Bleached Ektachrome whites, silt-brown water, burnt orange sunsets, deep jungle greens, oil-black hazards.

---

## 4. Factions

### United River Alliance (URA) — Player Faction

**Doctrine:** Liberation through combined arms. Build, gather, train, liberate.

**Hero Units:**

| Hero | Unlocked | Stats | Special |
|------|----------|-------|---------|
| **Sgt. Bubbles** | Start | 120 HP, speed 14 | Rambo-style warrior-leader. Available every mission. |
| **Gen. Whiskers** | Mission 4 rescue | 200 HP, speed 10 | Becomes briefing officer. Playable in Mission 15-16. |
| **Cpl. Splash** | Mission 8 rescue | 80 HP, speed 18 | Underwater capability. Unlocks Diver scouts. |
| **Sgt. Fang** | Mission 12 rescue | 150 HP, speed 12 | Siege specialist. Bonus damage vs buildings. |
| **Medic Marina** | Mission 10 rescue | 80 HP, speed 16 | Heals nearby units. Unlocks Field Hospital upgrade. |
| **Pvt. Muskrat** | Mission 14 hero mission | 120 HP, speed 11 | Demolition expert. Plants timed charges. |

**Trainable Units:**

| Unit | Role | Cost | Unlock | Train At |
|------|------|------|--------|----------|
| **River Rat** | Worker — gathers, builds, repairs | 50 Fish | Mission 1 | Command Post |
| **Mudfoot** | Melee infantry | 80 Fish, 20 Salvage | Mission 1 | Barracks |
| **Shellcracker** | Ranged infantry | 70 Fish, 30 Salvage | Mission 3 | Barracks |
| **Sapper** | Anti-building siege | 100 Fish, 50 Salvage | Mission 5 | Armory |
| **Raftsman** | Water transport | 60 Timber, 20 Salvage | Mission 7 | Dock |
| **Mortar Otter** | Long range AoE | 80 Fish, 60 Salvage | Mission 9 | Armory |
| **Diver** | Underwater scout | 60 Fish, 40 Salvage | Mission 8 (after Splash rescue) | Dock |

**Buildings:**

| Building | Function | Cost | Unlock |
|----------|----------|------|--------|
| **Command Post** | Workers, resource depot. One per base. | Starting / 400 Timber, 200 Salvage | Mission 1 |
| **Barracks** | Trains Mudfoots, Shellcrackers | 200 Timber | Mission 1 |
| **Armory** | Trains Sappers, Mortar Otters. Research upgrades. | 300 Timber, 100 Salvage | Mission 5 |
| **Watchtower** | Detection radius, ranged defense | 150 Timber | Mission 1 |
| **Fish Trap** | Passive fish income. +4 population cap. | 100 Timber | Mission 1 |
| **Dock** | Trains Raftsmen, Divers. Water access. | 250 Timber, 50 Salvage | Mission 7 |
| **Field Hospital** | Heals nearby units over time | 200 Timber, 100 Salvage | Mission 10 |
| **Sandbag Wall** | Barrier, blocks pathing | 50 Timber | Mission 1 |
| **Stone Wall** | Stronger barrier (Armory upgrade) | 100 Timber, 50 Salvage | Mission 11 |
| **Gun Tower** | Watchtower upgrade, adds ranged attack | 200 Timber, 100 Salvage | Mission 11 |
| **Minefield** | One-time trap, damages first unit | 80 Salvage | Mission 11 |

### Scale-Guard Militia — Enemy Faction

**Doctrine:** Ambush, area-denial, attrition. "Sacred Sludge" ideology.

| Unit | Role | Behavior |
|------|------|----------|
| **Skink** | Worker | Gathers, builds Scale-Guard structures |
| **Gator** | Melee tank | Slow, hard-hitting, can submerge briefly |
| **Viper** | Ranged poison | DoT damage, glass cannon |
| **Snapper** | Turret | Anchored, high sustained DPS |
| **Scout Lizard** | Recon | Fast, reveals fog, calls reinforcements on sight |
| **Croc Champion** | Elite | Mini-boss, heavy armor + damage |
| **Siphon Drone** | Harass | Drains resources from nearby player buildings |

**Scale-Guard Buildings:** Sludge Pit (town hall), Spawning Pool (barracks), Venom Spire (tower), Siphon (resource drain / objective), Scale Wall.

### Neutral — Native Villagers

- Mustelid civilians in occupied hamlets
- Liberation mechanic: clear garrison → village flips to URA
- Liberated villages provide: trickle fish income, healing zone, fog reveal radius, intel
- Scale-Guard can recapture undefended villages

---

## 5. Resource Economy

### Three Resources

| Resource | Gathered From | Used For | Analogue |
|----------|--------------|----------|----------|
| **Fish** | Fishing spots, Fish Traps, liberated villages | Unit production, population cap (via Fish Traps) | Food/Gold |
| **Timber** | Mangrove trees (finite, regrow slowly) | Buildings, walls, basic structures | Wood |
| **Salvage** | Wreckage caches, enemy drops, mission rewards | Upgrades, advanced units, tech research | Gold/Ore |

### Population System

- Each Fish Trap provides +4 population cap
- Each unit costs 1 population (heroes cost 0)
- Starting cap: 4 (tutorial mission), max possible: ~60

### Economy Flow

River Rats gather Fish/Timber/Salvage → deposit at Command Post → spend to train units / build structures / research upgrades.

---

## 6. Campaign: "The Copper-Silt War"

### Structure: 4 Chapters × 4 Missions = 16 Missions

**Briefing system:** Before each mission, a hand-painted ASCII portrait of the briefing officer delivers context, objectives, and flavor. Missions 1-3: field radio operator ("FOXHOUND"). Missions 4+: Gen. Whiskers (after his rescue).

**Scoring:** Each mission awards Bronze/Silver/Gold stars based on time, units lost, and bonus objectives. Stars unlock Skirmish mode maps.

### Chapter 1: "First Landing" (Korea / Inchon-Inspired)

**Narrative:** The URA deploys to the Copper-Silt Reach. Sgt. Bubbles leads the first wave.

| # | Mission | Type | Start | Teaches | Win Condition |
|---|---------|------|-------|---------|---------------|
| 1 | **Beachhead** | Tutorial/Build | 3 River Rats, nothing built | Gather, build, train | Build Command Post + Barracks, train 4 Mudfoots |
| 2 | **The Causeway** | Escort/Defend | Pre-built outpost, supply convoy incoming | Combat, defense | Escort convoy to base (3/3 wagons survive) |
| 3 | **Firebase Delta** | King of the Hill | Small base, 3 capture points | Multi-front warfare, Shellcrackers | Hold all 3 points for 2 minutes simultaneously |
| 4 | **Prison Break** | Commando/Rescue | Sgt. Bubbles + 2 scouts only | Stealth, detection, hero abilities | Rescue Gen. Whiskers, escape to extraction |

**Chapter 1 new mechanics introduced:** Resource gathering, building, training, combat, escort AI, capture points, stealth/detection.

### Chapter 2: "Into the Soup" (Vietnam / Mekong Delta-Inspired)

**Narrative:** The war deepens. Scale-Guard siphons poison the river. Gen. Whiskers takes command of briefings.

| # | Mission | Type | Start | Teaches | Win Condition |
|---|---------|------|-------|---------|---------------|
| 5 | **Siphon Valley** | Base Build + Destroy | Full base building, 3 siphons on map | Sappers, siphon mechanics | Destroy all 3 siphons |
| 6 | **Monsoon Ambush** | Survival/Timed | Pre-built base, monsoon weather | Weather system, defense, rally points | Survive 8 waves across 3 monsoon cycles |
| 7 | **River Rats** | Capture the Flag | Medium base, water-divided map | Raftsmen, water traversal | Capture 5 enemy supply crates, return to base |
| 8 | **The Underwater Cache** | Hero + Stealth | Cpl. Splash hero mission | Underwater layer, stealth | Rescue Cpl. Splash, retrieve cache |

**Chapter 2 new mechanics introduced:** Siphon destruction (environmental restoration), weather effects (monsoon), water traversal, underwater gameplay, CTF objectives.

### Chapter 3: "Heart of Darkness" (Burma / Malaya-Inspired)

**Narrative:** Deep in Scale-Guard territory. The jungle itself is hostile.

| # | Mission | Type | Start | Teaches | Win Condition |
|---|---------|------|-------|---------|---------------|
| 9 | **Dense Canopy** | Fog Skirmish | Equal pre-built bases | Mortar Otters, recon→strike loop | Destroy enemy Command Post |
| 10 | **The Healer's Grove** | Liberation | Small base, 5 occupied villages | Territory control, village mechanics | Liberate all 5 villages, rescue Medic Marina |
| 11 | **Entrenchment** | Heavy Defense | Build from scratch, waves escalate | Defensive buildings, Stone Walls, Gun Towers, Mines | Survive 12 waves, keep Command Post alive |
| 12 | **The Stronghold** | Siege Assault | Full army, pre-built base | Siege tactics, combined arms | Breach fortress, rescue Sgt. Fang |

**Chapter 3 new mechanics introduced:** Combined recon+strike, village liberation/territory, defensive upgrades (stone walls, gun towers, mines), siege warfare.

### Chapter 4: "The Great Siphon" (Culmination)

**Narrative:** The final push. Every mechanic converges.

| # | Mission | Type | Start | Teaches | Win Condition |
|---|---------|------|-------|---------|---------------|
| 13 | **Supply Lines** | Logistics/Multi-base | 3 base locations, supply routes | Multi-base management, supply caravans | Establish supply chain, hold for 5 minutes |
| 14 | **Gas Depot** | Demolition/Hero | Pvt. Muskrat hero mission | Timed charges, chain explosions | Plant 4 charges, escape before detonation |
| 15 | **Sacred Sludge** | All-out War | Full army, massive map | Everything | Destroy enemy main base before sludge flood reaches yours |
| 16 | **The Reckoning** | Final Boss + Base | Full army + all heroes | Combined mastery | Destroy The Great Siphon (3-phase boss encounter) |

**The Reckoning phases:**
- Phase 1: Destroy outer defensive perimeter (walls, towers, garrison)
- Phase 2: Elite Croc Champions counterattack from 3 directions simultaneously
- Phase 3: Siphon activates doomsday mode — sludge flood spreads from center. Race to destroy core before map is consumed.

---

## 7. Cross-Platform Input Design

### The Camera Pan vs. Drag-Select Problem

On desktop, camera panning (edge scroll / WASD) and unit selection (click/drag) use different input channels. On mobile touchscreen, both would use finger drag. This is the single most important UX challenge.

**Solution: Context-sensitive input with mode toggle.**

| Input | Desktop | Mobile/Tablet |
|-------|---------|---------------|
| **Select single unit** | Left click | Tap |
| **Select group** | Left click + drag rectangle | One-finger drag on units |
| **Camera pan** | WASD / edge scroll / middle-mouse drag | Two-finger drag |
| **Camera zoom** | Scroll wheel | Pinch |
| **Move/attack command** | Right click | Long press on destination / "Move" button tap then tap destination |
| **Build placement** | Click after selecting building | Tap after selecting building |
| **Hotkey groups** | Ctrl+1-9 to assign, 1-9 to recall | Bottom bar tabs (Squad 1, Squad 2, etc.) |
| **Minimap navigation** | Click minimap | Tap minimap |
| **Deselect** | Click empty ground | Tap empty ground |

### Mobile-Specific UI Enhancements

- **Bottom action bar** (DaisyUI) — Shows selected unit/building actions. 48px minimum touch targets.
- **Squad tabs** — Horizontal scrollable tabs replacing keyboard hotkeys.
- **Auto-attack zones** — Garrisoned units auto-engage. Reduces micro demands.
- **Rally point markers** — Visible rally flags. Newly trained units auto-move there.
- **Minimap enlargement** — On mobile, tap minimap to expand to 40% of screen for navigation.
- **Confirmation for destructive actions** — "Destroy building?" modal before demolishing own structures.

### Adaptive Layout

```
Desktop (>1024px):
┌─────────────────────────────────────────────────┐
│ [Resources]              [Clock/Score]          │
├────────────┬────────────────────────────────────┤
│            │                                     │
│  Minimap   │         Game Canvas                 │
│            │                                     │
│  Unit Info │                                     │
│            │                                     │
├────────────┼────────────────────────────────────┤
│ [Actions]  │ [Build Menu / Command Queue]        │
└────────────┴────────────────────────────────────┘

Mobile (portrait):
┌─────────────────────┐
│ [Resources] [Score] │
├──────┬──────────────┤
│ Mini │               │
│ map  │  Game Canvas  │
│      │               │
│      │               │
├──────┴──────────────┤
│ [Unit Info + Stats] │
├─────────────────────┤
│ [Actions / Build]   │
│ [Squad Tabs 1-4]    │
└─────────────────────┘
```

---

## 8. Core Game Systems

### 8.1 Tilemap & Terrain

- **Tile size:** 32×32 pixels (rendered from ASCII)
- **Map sizes:** Small (40×40), Medium (60×60), Large (80×80), Epic (100×100)
- **Terrain types:** Grass, dirt, mud (slow), water (impassable without raft/swim), mangrove (blocks LOS, harvestable), toxic sludge (damages), bridge
- **Phaser TilemapLayer:** Orthogonal view, top-down perspective
- **Procedural generation** for terrain noise; mission-specific layouts are hand-designed tilemap definitions

### 8.2 Fog of War

- **Three states:** Unexplored (black), Explored (greyed, shows terrain but not units), Visible (full color, real-time)
- **Implementation:** Phaser RenderTexture overlay. Each unit has a vision radius. Update fog per frame based on all friendly unit positions.
- **Fog memory:** Explored areas retain last-seen state of buildings/terrain.

### 8.3 Pathfinding

- **Grid-based A*** via EasyStarJS on the tilemap
- **Terrain costs:** Grass=1, Dirt=1, Mud=2, Bridge=1, Water=∞ (unless swimmer)
- **Dynamic obstacle avoidance:** Yuka steering behaviors for unit-to-unit collision avoidance
- **Flow fields** for large group movement (optimization for 20+ units moving to same target)

### 8.4 Combat System

- **Damage model:** Attack damage − armor = effective damage (minimum 1)
- **Attack speed:** Per-unit cooldown between attacks
- **Range:** Melee (adjacent tile) vs. ranged (configurable radius)
- **Aggro:** Units auto-attack nearest enemy within aggro range
- **Priority targeting:** Can be overridden by player command
- **Projectile travel:** Ranged attacks spawn visible projectile sprites

### 8.5 Stealth & Detection

- **Detection radius** per unit (configurable)
- **Concealment zones:** Tall grass, mangrove thickets reduce detection radius by 75%
- **Stealth units:** Scouts can crouch (toggle), reducing their visibility and speed
- **Guard detection cones:** Watchtowers/patrols have visible detection arcs
- **Alert cascade:** Spotted unit triggers alarm → nearby enemies converge

### 8.6 Weather System

- **Clear:** Normal visibility and unit stats
- **Rain:** Visibility reduced 30%, ranged attack accuracy reduced 20%
- **Monsoon/Storm:** Visibility reduced 60%, ranged accuracy reduced 40%, movement speed reduced 15%
- **Cycles:** Weather changes over time per mission. Some missions have scripted weather.

### 8.7 Scenario Scripting Engine

Each mission is a JSON/TS definition containing:
```typescript
interface Scenario {
  id: string;
  chapter: number;
  mission: number;
  name: string;
  briefing: BriefingDefinition;     // Portrait + dialogue lines
  map: TilemapDefinition;           // Tile layout
  startConditions: StartConditions; // Pre-placed buildings, units, resources
  objectives: Objective[];          // Primary + bonus
  triggers: ScenarioTrigger[];      // Event-driven scripting
  weather?: WeatherSchedule;
  unitUnlocks?: string[];           // New units available this mission
  buildingUnlocks?: string[];       // New buildings available this mission
}

interface ScenarioTrigger {
  condition: TriggerCondition;      // timer, unitCount, areaEntered, buildingDestroyed, etc.
  action: TriggerAction;            // spawnUnits, dialogue, weather, reinforcements, etc.
  once: boolean;                    // Fire once or repeating
}
```

---

## 9. Koota ECS Architecture

### Core Traits

```typescript
// Identity
const UnitType = trait({ type: '' });         // 'mudfoot', 'river_rat', 'gator', etc.
const Faction = trait({ id: '' });             // 'ura', 'scale_guard', 'neutral'
const IsHero = trait();                        // Tag
const IsBuilding = trait();                    // Tag
const IsProjectile = trait();                  // Tag
const IsResource = trait();                    // Tag (fish spot, tree, wreckage)

// Spatial
const Position = trait({ x: 0, y: 0 });       // Tile coordinates
const Velocity = trait({ x: 0, y: 0 });       // Movement vector
const FacingDirection = trait({ angle: 0 });

// Combat
const Health = trait({ current: 100, max: 100 });
const Attack = trait({ damage: 10, range: 1, cooldown: 1.0, timer: 0 });
const Armor = trait({ value: 0 });
const VisionRadius = trait({ radius: 5 });

// AI
const AIState = trait(() => ({ state: 'idle', target: null, alertLevel: 0 }));
const SteeringAgent = trait(() => null);       // Yuka Vehicle reference

// Orders
const OrderQueue = trait(() => []);            // Array of commands
const RallyPoint = trait({ x: 0, y: 0 });

// Economy
const Gatherer = trait({ carrying: '', amount: 0, capacity: 10 });
const ResourceNode = trait({ type: '', remaining: 100 });
const ProductionQueue = trait(() => []);       // Buildings train units
const PopulationCost = trait({ cost: 1 });

// Stealth
const Concealed = trait();                     // Tag: in concealment zone
const Crouching = trait();                     // Tag: voluntarily stealthed
const DetectionRadius = trait({ radius: 6 });

// Water
const CanSwim = trait();                       // Tag: can traverse water tiles
const Submerged = trait();                     // Tag: currently underwater
```

### Relations

```typescript
const BelongsToSquad = relation();             // unit → squad entity
const OwnedBy = relation();                    // unit/building → faction entity
const Targeting = relation({ exclusive: true }); // unit → enemy (single target)
const GatheringFrom = relation();              // worker → resource node
const TrainingAt = relation({ store: { progress: 0, unitType: '' } }); // building → unit type
const GarrisonedIn = relation();               // unit → building
```

### Key Queries

```typescript
const playerUnits = createQuery(UnitType, Position, OwnedBy);
const enemiesInVision = createQuery(UnitType, Position, Health, Faction);
const idleWorkers = createQuery(Gatherer, Not(GatheringFrom));
const buildingsTraining = createQuery(IsBuilding, TrainingAt);
const damagedUnits = createQuery(Health, Changed(Health));
```

---

## 10. Yuka AI Integration

### Bridge Pattern

Yuka manages steering/pathfinding/FSM. Koota manages game state. A thin sync layer copies position/velocity each tick.

```typescript
// AoS trait holding Yuka Vehicle reference
const YukaAgent = trait(() => null as Vehicle | null);

// Sync system (runs each frame)
function syncYukaToKoota(world: World, delta: number) {
  world.query(YukaAgent, Position, Velocity).updateEach(([agent, pos, vel]) => {
    if (!agent) return;
    pos.x = agent.position.x;
    pos.y = agent.position.z;  // Yuka uses Y-up 3D; we map Z→Y for 2D
    vel.x = agent.velocity.x;
    vel.y = agent.velocity.z;
  });
}
```

### Enemy AI Profiles

| Enemy | FSM States | Steering Behaviors |
|-------|-----------|-------------------|
| **Gator** | idle → patrol → alert → ambush → chase → attack | Seek, Arrive, Separation |
| **Viper** | idle → patrol → snipe → flee | Flee (when approached), Arrive (to snipe range) |
| **Scout Lizard** | patrol → spot → signal → flee | Wander, Flee, FollowPath |
| **Croc Champion** | patrol → engage → berserk | Pursuit, Interpose (bodyguard behavior) |
| **Siphon Drone** | approach → drain → retreat | Seek (nearest player building), Flee (when damaged) |

---

## 11. Persistence (SQLite Schema)

### Campaign Progress

```sql
CREATE TABLE campaign_progress (
  mission_id TEXT PRIMARY KEY,
  chapter INTEGER NOT NULL,
  mission INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',  -- locked, available, completed
  stars INTEGER NOT NULL DEFAULT 0,       -- 0-3 (bronze, silver, gold)
  best_time_ms INTEGER,
  units_lost INTEGER,
  completed_at INTEGER
);

CREATE TABLE save_state (
  id INTEGER PRIMARY KEY,
  slot INTEGER NOT NULL,                  -- 1-3 save slots
  mission_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,             -- Full Koota world serialization
  saved_at INTEGER NOT NULL
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY,
  music_volume REAL NOT NULL DEFAULT 0.7,
  sfx_volume REAL NOT NULL DEFAULT 1.0,
  haptics_enabled INTEGER NOT NULL DEFAULT 1,
  camera_speed REAL NOT NULL DEFAULT 1.0,
  touch_mode TEXT NOT NULL DEFAULT 'auto', -- auto, one_finger_select, two_finger_pan
  show_grid INTEGER NOT NULL DEFAULT 0,
  reduce_fx INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE unlocked_units (
  unit_type TEXT PRIMARY KEY,
  unlocked_at_mission TEXT NOT NULL
);

CREATE TABLE unlocked_buildings (
  building_type TEXT PRIMARY KEY,
  unlocked_at_mission TEXT NOT NULL
);

CREATE TABLE research (
  research_id TEXT PRIMARY KEY,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at_mission TEXT
);
```

---

## 12. Tech Tree / Research

Researched at the Armory. Each upgrade is permanent within a campaign save.

| Research | Cost | Effect | Available |
|----------|------|--------|-----------|
| **Hardshell Armor** | 150 Salvage | +2 HP to all Mudfoots | Mission 5 |
| **Fish Oil Arrows** | 100 Salvage | +1 damage to Shellcrackers | Mission 5 |
| **Fortified Walls** | 200 Salvage | Unlocks Stone Walls | Mission 11 |
| **Gun Emplacements** | 250 Salvage | Unlocks Gun Towers | Mission 11 |
| **Demolition Training** | 150 Salvage | +25% Sapper damage vs buildings | Mission 9 |
| **Advanced Rafts** | 100 Salvage | +30% Raftsman speed | Mission 7 |
| **Mortar Precision** | 200 Salvage | −20% Mortar Otter scatter radius | Mission 9 |
| **Combat Medics** | 150 Salvage | Field Hospital heal rate +50% | Mission 10 |
| **Diving Gear** | 100 Salvage | Divers can attack while submerged | Mission 8 |

---

## 13. Post-Campaign: Skirmish Mode

After completing the campaign (or specific missions), unlock Skirmish mode:

- **Map selection:** All 16 campaign maps + procedurally generated maps
- **Difficulty:** Easy / Medium / Hard / Brutal (AI behavior + resource bonus)
- **Faction:** Play as URA (default) or Scale-Guard (mirror units)
- **Victory condition:** Destroy enemy Command Post
- **Replayability driver:** Star ratings on campaign missions + skirmish leaderboards

---

## 14. Design Anti-Patterns (REJECTED)

- ❌ External asset files (PNG, MP3, GLB, etc.)
- ❌ Sci-fi aesthetics, chrome, cyborgs, lasers
- ❌ Pay-to-win or microtransactions
- ❌ Always-online requirement
- ❌ Desktop-first with mobile afterthought
- ❌ Canvas shape primitives for art (only ASCII pixel painting)
- ❌ Level-select without narrative context

---

## 15. Open Questions

1. **Multiplayer:** Is local or online multiplayer in scope for v1? (Assumed: no, campaign only)
2. **Procedural maps for skirmish:** How much generation vs. hand-design?
3. **Music:** Full procedural soundtrack per mission, or ambient loops?
4. **Localization:** English only for v1?
5. **Analytics:** Track play metrics for balancing?
