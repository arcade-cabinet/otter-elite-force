# Campaign Mission Design Document

## Design Philosophy

Every mission is a **dense, story-driven experience** on a 128x128 tile map (4096x4096 pixels).
The player (Captain) commands from a lodge. Named COs radio in with briefings, intel, and orders.
Ground units are anonymous grunts. The map UNFOLDS through zone-based progression with scripted events.

## Map Standard

- **Size**: 128x128 tiles (4096x4096px) — minimum. Can be 160x128 for wider missions.
- **Zones**: 4-8 named zones per mission, each with discovery triggers
- **Fog**: Unexplored zones are fully fogged. Scouting reveals them.
- **Phases**: 2-4 phases per mission, each unlocking new zones/objectives/enemies

## Command Structure

- **Gen. Whiskers** — HQ strategic command, campaign-level orders
- **Col. Bubbles** — Tactical officer at HQ, mission briefings, primary radio contact
- **FOXHOUND** — Signals intelligence, enemy disposition, threat warnings
- **Medic Marina** — Medical officer, field hospital updates, casualty reports
- **YOU (Captain)** — Silent protagonist, field commander inside the lodge

## Mission Design Template

```
MISSION [chapter]-[number]: [NAME]
Map: [width]x[height] tiles
Setting: [terrain description]
Win: [primary victory condition]
Lose: Lodge destroyed OR [secondary fail condition]

ZONES:
  zone_a (x,y,w,h) — [description, terrain type]
  zone_b (x,y,w,h) — [description, terrain type]
  ...

PHASES:
  Phase 1: [name]
    Start: [initial state]
    Objectives: [what player must do]
    Triggers: [what happens when objectives met]
    Radio: [dialogue that plays]

  Phase 2: [name]
    Unlocked by: [what triggers this phase]
    New zones: [what becomes accessible]
    ...

PLACEMENTS:
  Player: [starting units + lodge position]
  Enemy: [per-zone enemy composition]
  Resources: [per-zone resource nodes]

DIALOGUE SCRIPT:
  [trigger_id]: [speaker] — "[line]"
```

---

## CHAPTER 1: FIRST LANDING

### Mission 1-1: BEACHHEAD
**Map**: 128x96 tiles
**Setting**: Southern coast of Copper-Silt Reach. Beach gives way to jungle, river crossing in the center, enemy outpost in the north.
**Win**: Establish command post + clear enemy outpost
**Lose**: Lodge destroyed

**ZONES:**
- `landing_zone` (48,72, 32,24) — sandy beach, your insertion point
- `jungle_south` (16,52, 96,20) — dense mangrove, timber resources
- `river_banks` (0,40, 128,12) — mud banks flanking the river
- `river` (0,44, 128,8) — impassable water with one bridge
- `bridge_crossing` (56,42, 16,12) — the critical bridge (damaged, needs repair)
- `jungle_north` (16,20, 96,20) — enemy-controlled jungle
- `enemy_outpost` (48,4, 32,16) — Scale-Guard forward base
- `salvage_field` (96,56, 28,16) — wreckage with salvage resources

**PHASES:**

Phase 1: LANDFALL (0:00-3:00)
- Start: Lodge at (64,80), 4 River Rats, 100 fish / 50 timber
- Objectives: "Gather 100 timber from the mangrove"
- Radio at 0:15 — FOXHOUND: "Captain, you're on the ground. Mangrove grove to the northwest has timber. Get your workers moving."
- Radio at 0:30 — Col. Bubbles: "Priority one: establish resource flow. We need materials before we can build."
- Tutorial hint: Click mangrove trees to auto-harvest

Phase 2: BASE BUILDING (3:00-8:00)
- Unlocked by: 100 timber gathered
- Objectives: "Build a Command Post", "Build a Barracks"
- Radio — Col. Bubbles: "Good work, Captain. You've got materials. Build a Command Post for logistics, then a Barracks for infantry."
- Enemy scout patrol appears near river at 5:00 (2 Skinks, non-aggressive unless provoked)
- Radio at 5:00 — FOXHOUND: "Movement near the river. Scale-Guard scouts. They haven't spotted you yet."

Phase 3: THE CROSSING (8:00-15:00)
- Unlocked by: Command Post + Barracks built
- Objectives: "Repair the bridge", "Cross the river"
- Bridge zone becomes interactable — send a River Rat to repair
- Radio — FOXHOUND: "Bridge is damaged but structurally sound. Your engineers can patch it."
- Enemy reinforcements spawn north of river when bridge repair starts (4 Gators, 2 Skinks)
- Radio — Col. Bubbles: "They know we're here. Expect resistance at the crossing."

Phase 4: CLEAR THE OUTPOST (15:00+)
- Unlocked by: Any URA unit crosses river
- Objectives: "Destroy the enemy outpost"
- Enemy outpost has: Flag Post, 6 Gators, 2 Vipers, 1 Watchtower
- Radio on entering `jungle_north` — FOXHOUND: "Enemy positions ahead. Multiple contacts."
- Radio on clearing outpost — Gen. Whiskers: "Beachhead secured, Captain. Outstanding work. The Reach campaign begins."
- BONUS: "Recover salvage from the eastern wreckage" (enter `salvage_field`)
- Victory when all primary objectives complete

**DIALOGUE SCRIPT:**
```
briefing-1: FOXHOUND — "Captain, welcome to the Copper-Silt Reach. Intelligence shows minimal Scale-Guard presence at this landing site."
briefing-2: Col. Bubbles — "Your orders: establish a forward operating base. Build it up, secure resources, and prepare to push north."
briefing-3: FOXHOUND — "Fish in the river, timber in the mangroves. There's also wreckage to the east — salvage if you can get to it."
briefing-4: Col. Bubbles — "Bridge crossing is your critical path. Get your base up, train some Mudfoots, and take that bridge. HQ out."

tutorial-gather: FOXHOUND — "Click on the mangrove trees to send workers to harvest timber. They'll auto-return to the lodge."
tutorial-build: Col. Bubbles — "You have enough materials. Open the build menu and place a Command Post."
scout-warning: FOXHOUND — "Scale-Guard scouts spotted near the river. They haven't seen you yet — proceed carefully."
bridge-start: FOXHOUND — "Bridge repair underway. This will draw attention, Captain."
bridge-attack: Col. Bubbles — "Contacts crossing from the north! Defend that bridge!"
north-entry: FOXHOUND — "Entering enemy territory. Multiple contacts on approach."
outpost-clear: Gen. Whiskers — "Beachhead established. Well done, Captain. Prepare for the next push."
```

---

### Mission 1-2: THE CAUSEWAY
**Map**: 128x128 tiles
**Setting**: Dense jungle road leading east. Convoy escort through hostile territory with ambush points.
**Win**: Escort supply convoy to destination
**Lose**: Lodge destroyed OR all convoy vehicles destroyed

**ZONES:**
- `staging_area` (8,96, 32,28) — starting base, convoy assembles here
- `causeway_west` (8,64, 40,32) — first stretch of jungle road
- `ambush_1` (48,64, 24,24) — first ambush site (narrow ravine)
- `causeway_mid` (48,40, 32,24) — middle stretch, wider terrain
- `ambush_2` (80,32, 24,24) — second ambush (dense mangrove)
- `river_ford` (72,16, 32,16) — shallow river crossing point
- `destination` (96,4, 28,20) — convoy destination (allied outpost)

**PHASES:**

Phase 1: MUSTER (0:00-2:00)
- Start: Lodge at (16,108), 3 River Rats, 2 Mudfoots, supply convoy (3 carts — scripted entities)
- Objectives: "Prepare defenses before moving out"
- Col. Bubbles: "Captain, you're escorting a supply convoy east through the jungle. Scale-Guard have patrols in the area."
- Convoy won't move until player clicks "MOVE OUT" (or sends units to first waypoint)

Phase 2: FIRST LEG (2:00+)
- Unlocked by: Any URA unit enters `causeway_west`
- Convoy begins moving along predefined path
- FOXHOUND: "Convoy is rolling. Keep your units close."
- Ambush 1 triggers when convoy reaches midpoint: 4 Gators + 2 Skinks spawn in `ambush_1`
- Col. Bubbles: "Ambush! Hostiles in the ravine! Protect those carts!"

Phase 3: DEEP JUNGLE (after ambush 1 cleared)
- Unlocked by: All enemies in ambush_1 zone killed
- Convoy resumes to `causeway_mid`
- Resource nodes scattered — opportunity to gather while moving
- Ambush 2 at `ambush_2`: 3 Vipers + 3 Gators + 1 Snapper (heavy)
- FOXHOUND: "Second ambush, Captain. They were waiting for us."

Phase 4: RIVER CROSSING (after ambush 2)
- Convoy must cross shallow ford at `river_ford`
- Enemy patrol guards the far bank: 4 Gators
- Col. Bubbles: "Clear that ford! Convoy can't cross under fire."
- On clearing: "Ford is clear. Convoy moving through."

Phase 5: DELIVERY
- Convoy reaches `destination`
- Gen. Whiskers: "Supply line established. We can sustain operations in the Reach. Outstanding, Captain."
- BONUS: "No convoy vehicles lost" (all 3 carts survive)

---

### Mission 1-3: FIREBASE DELTA
**Map**: 128x128 tiles
**Setting**: Three strategic hilltops overlooking river valley. Capture-and-hold with counter-attacks.
**Win**: Hold all 3 hilltops for 2 minutes simultaneously
**Lose**: Lodge destroyed

**ZONES:**
- `base_camp` (48,104, 32,24) — starting position in valley
- `hill_alpha` (16,64, 24,24) — western hilltop (weakly defended)
- `hill_bravo` (52,48, 24,24) — central hilltop (medium defense)
- `hill_charlie` (92,56, 24,24) — eastern hilltop (heavily defended)
- `valley_floor` (16,80, 96,24) — connecting terrain between base and hills
- `enemy_staging` (48,8, 32,24) — enemy counter-attack staging area (north, hidden)
- `river_valley` (0,40, 128,8) — river separating hills from enemy territory

**PHASES:**

Phase 1: ADVANCE (0:00-5:00)
- Start: Lodge at (64,112), 4 River Rats, 3 Mudfoots, 1 Shellcracker
- Objectives: "Capture Hill Alpha", "Capture Hill Bravo", "Capture Hill Charlie"
- Col. Bubbles: "Three hilltops control this valley, Captain. Take them all and we own the river."
- Hill Alpha: 2 Skinks, 1 Flag Post
- FOXHOUND on taking Alpha: "Hill Alpha secured. Two more to go."

Phase 2: ESCALATION
- Unlocked by: Hill Alpha captured (area entered + enemies cleared)
- Hill Bravo: 3 Gators, 2 Skinks, 1 Watchtower
- Enemy sends probe from Bravo when you approach: "They know we're coming."
- Hill Charlie visible through fog after Bravo taken

Phase 3: COUNTERATTACK
- Unlocked by: All 3 hills captured
- Objectives: "Hold all hilltops for 120 seconds"
- Timer starts. Enemy waves from `enemy_staging`:
  - Wave 1 (0:00): 4 Gators attack Hill Alpha
  - Wave 2 (0:30): 3 Gators + 2 Vipers attack Hill Charlie
  - Wave 3 (1:00): 6 Gators + 2 Snappers attack Hill Bravo (the big push)
- Col. Bubbles: "Counterattack! They want those hills back! HOLD THE LINE, Captain!"
- FOXHOUND updates which hill is under attack
- Victory when timer expires with all 3 hills still under URA control

---

### Mission 1-4: PRISON BREAK
**Map**: 128x128 tiles
**Setting**: Scale-Guard compound deep in jungle. Stealth/infiltration into rescue mission.
**Win**: Rescue Gen. Whiskers and evacuate
**Lose**: Lodge destroyed OR Whiskers killed

**ZONES:**
- `insertion_point` (8,112, 24,16) — jungle clearing, no lodge (commando mission)
- `jungle_approach` (8,80, 48,32) — dense jungle with patrol routes
- `outer_wall` (56,48, 40,8) — compound perimeter wall
- `compound_yard` (56,56, 40,40) — open yard with guard towers
- `prison_block` (68,64, 16,16) — where Whiskers is held
- `evac_zone` (104,96, 20,20) — helicopter/boat extraction point
- `patrol_route_1` (24,72, 8,40) — enemy patrol path
- `patrol_route_2` (40,56, 16,8) — second patrol path

**PHASES:**

Phase 1: INFILTRATION (0:00+)
- Start: NO lodge (commando mission). 3 Mudfoots, 1 Sapper, 1 Diver
- Objectives: "Reach the compound undetected"
- Col. Bubbles: "This is a black op, Captain. Gen. Whiskers was captured during a recon mission. Get him out."
- Patrols move along set routes. Detection = alarm triggers reinforcements.
- FOXHOUND: "Patrols every 30 seconds on the western approach. Time your movement."

Phase 2: BREACH (enter outer_wall zone)
- Unlocked by: URA unit reaches `outer_wall`
- Objectives: "Breach the compound wall"
- Sapper can plant charge on wall section
- Col. Bubbles: "Wall charge set. Three... two... one..."
- Explosion triggers alarm — all remaining enemies go aggressive
- 6 Gators + 2 Croc Champions spawn in compound

Phase 3: RESCUE
- Unlocked by: Any URA unit enters `prison_block`
- Gen. Whiskers joins as controllable unit (weakened: 50% HP, slow)
- Whiskers: "About time, Captain. These Scale-Guard don't treat their guests well."
- Objectives: "Evacuate Gen. Whiskers to the extraction zone"
- Enemy reinforcements start arriving from the north every 60 seconds

Phase 4: EXTRACTION
- Unlocked by: Whiskers enters `evac_zone`
- Gen. Whiskers: "I'm out. Thank you, Captain. I owe you one."
- Col. Bubbles: "Mission complete. Gen. Whiskers is safe. Extraordinary work."
- BONUS: "Complete without triggering the alarm" (stealth approach)

---

## CHAPTER 2: DEEP OPERATIONS

### Mission 2-1: SIPHON VALLEY
**Map**: 160x128 tiles
**Setting**: Wide valley with 3 toxic siphon installations draining the river. Industrial Scale-Guard territory.
**Win**: Destroy all 3 siphon installations
**Lose**: Lodge destroyed

**ZONES:**
- `forward_base` (16,96, 32,28) — player starting base
- `siphon_alpha` (24,48, 24,20) — western siphon (lightly defended)
- `siphon_bravo` (72,32, 24,20) — central siphon (medium defense + toxic sludge)
- `siphon_charlie` (120,40, 32,24) — eastern siphon (heavily fortified)
- `toxic_river` (0,60, 160,8) — polluted river, deals damage to units
- `supply_depot` (100,80, 20,16) — enemy supply cache (bonus)
- `northern_ridge` (40,8, 80,24) — enemy reinforcement staging

**PHASES:**

Phase 1: RECON (0:00-5:00)
- Lodge at (24,108), 4 River Rats, 2 Mudfoots, 1 Mortar Otter
- FOXHOUND: "Three siphon installations are poisoning the Copper-Silt river. Take them out, Captain."
- Siphon Alpha visible from start. Others fogged.

Phase 2: FIRST SIPHON
- Clear Siphon Alpha (2 Gators, 1 Siphon Drone, 1 Fuel Tank building)
- FOXHOUND: "First siphon destroyed. Water quality improving. Two more."
- Siphon Bravo location revealed

Phase 3: TOXIC TERRAIN
- Siphon Bravo surrounded by toxic_sludge tiles (damage per second)
- Col. Bubbles: "That area is contaminated. Move quickly through the sludge."
- Heavier defense: 4 Gators, 2 Siphon Drones, 1 Venom Spire
- Destroying Bravo reveals Charlie + triggers enemy reinforcements from north

Phase 4: FORTRESS SIPHON
- Siphon Charlie is a fortified compound: walls, watchtower, 6+ defenders
- Col. Bubbles: "Last one. They've fortified it. Plan your assault carefully."
- BONUS: "Capture the supply depot" (enter `supply_depot`, gain 200 salvage)

---

### Mission 2-2: MONSOON AMBUSH
**Map**: 128x128 tiles
**Setting**: Defensive mission during monsoon season. Waves of enemies attack from multiple directions.
**Win**: Survive 8 attack waves
**Lose**: Lodge destroyed

**ZONES:**
- `base` (48,48, 32,32) — central fortified position
- `approach_north` (48,0, 32,24) — northern attack corridor
- `approach_east` (96,48, 32,32) — eastern attack corridor
- `approach_south` (48,96, 32,32) — southern attack corridor
- `approach_west` (0,48, 24,32) — western attack corridor
- `resource_grove` (16,16, 24,24) — timber grove (contested)
- `fish_pond` (88,88, 24,24) — fish resource (contested)

**PHASES:**

Phase 1: FORTIFY (0:00-3:00)
- Lodge at (56,56), 5 River Rats, 3 Mudfoots
- Col. Bubbles: "Monsoon is coming, Captain. Scale-Guard will use the weather as cover. Dig in."
- Build phase: construct walls, watchtowers, barracks
- Weather: Clear → transitioning to rain

Phase 2: WAVES 1-3 (3:00-8:00)
- Wave 1: 4 Skinks from north
- Wave 2: 6 Gators from east + west simultaneously
- Wave 3: 4 Gators + 2 Vipers from south
- Weather shifts to monsoon — visibility reduced, movement slowed
- FOXHOUND announces each wave direction

Phase 3: WAVES 4-6 (8:00-15:00)
- Escalating difficulty, multi-directional attacks
- Wave 4: 8 Gators from north + east
- Wave 5: 4 Snappers (heavy) from south
- Wave 6: Mixed force from all directions
- Col. Bubbles: "They're throwing everything at us! Hold fast!"
- Brief lull between 6 and 7 — opportunity to rebuild/gather

Phase 4: FINAL WAVES 7-8 (15:00+)
- Wave 7: Massive assault — 12 Gators + 4 Vipers + 2 Croc Champions from north
- Wave 8: All remaining enemy forces from all directions + 1 Serpent King
- Gen. Whiskers: "Last push, Captain. If you hold this, we break their offensive."
- Victory after wave 8 cleared
- BONUS: "Lose no buildings during the monsoon"

---

### Mission 2-3: RIVER RATS
**Map**: 128x128 tiles
**Setting**: River-centric map. Capture enemy supply crates being transported by boat. Naval focus.
**Win**: Capture 5 supply crates
**Lose**: Lodge destroyed

[Abbreviated — similar zone/phase structure]
- Focus: Raftsmen and Divers as key units
- River as main terrain feature (can swim with Diver/Raftsman)
- Supply crates move along river on scripted paths
- Intercept + capture mechanic
- Enemy patrols on both riverbanks

---

### Mission 2-4: THE UNDERWATER CACHE
**Map**: 128x128 tiles
**Setting**: Submerged munitions cache in a flooded ruin. Rescue Cpl. Splash and recover the cache.
**Win**: Rescue Cpl. Splash + recover cache
**Lose**: Lodge destroyed OR Splash killed

[Abbreviated]
- Commando-style + water terrain focus
- Cpl. Splash found in underwater zone
- Need Divers to access submerged areas
- Cache must be escorted back to base

---

## CHAPTER 3: TURNING TIDE

### Mission 3-1: DENSE CANOPY (Fog of War)
128x128, heavy fog, scout 4 intel markers. Minimal combat, maximum exploration.

### Mission 3-2: THE HEALER'S GROVE (Scorched Earth)
128x128, destroy 4 enemy fuel depots. Terrain destruction mechanic.

### Mission 3-3: ENTRENCHMENT (Tidal Fortress)
160x128, storm island fortress during low tide windows. Time-gated access.

### Mission 3-4: THE STRONGHOLD (Fang Rescue)
128x128, infiltrate Scale-Guard stronghold, rescue Sgt. Fang.

---

## CHAPTER 4: FINAL OFFENSIVE

### Mission 4-1: SUPPLY LINES (Great Siphon)
160x128, assault Scale-Guard HQ, destroy the Great Siphon mega-structure.

### Mission 4-2: GAS DEPOT (Iron Delta)
160x160, capture 3 island outposts across the delta. Amphibious warfare.

### Mission 4-3: SERPENT'S LAIR
128x128, breach the citadel, defeat the Serpent King in final boss battle.

### Mission 4-4: THE RECKONING (Last Stand)
160x160, final massive battle. All unlocked units/buildings available.
Two-phase: defend → counterattack. Destroy Scale-Guard command post to win the war.

---

## NEW SCENARIO ACTIONS NEEDED

To support these designs, add to the DSL:

```typescript
// Zone management
act.revealZone(zoneId: string)          // Remove fog from zone
act.lockZone(zoneId: string)            // Prevent unit entry
act.unlockZone(zoneId: string)          // Allow unit entry

// Camera
act.panCamera(x: number, y: number, duration: number)  // Cinematic pan

// Objectives (dynamic)
act.addObjective(id: string, description: string, type: "primary" | "bonus")

// Phases
act.startPhase(phaseName: string)       // Named phase transitions

// Environment
act.changeWeather(type: string)         // Trigger weather change
act.damageZone(zoneId: string)          // Terrain destruction

// Units
act.setPatrol(zoneId: string, units: string[])  // Assign patrol routes
```

## IMPLEMENTATION PRIORITY

1. **Expand Mission 1 to 128x96** with full zone/phase system — TEMPLATE
2. **Add missing DSL actions** (revealZone, panCamera, addObjective)
3. **Implement all 4 Chapter 1 missions** using the template
4. **Playtest Chapter 1** end-to-end
5. **Build Chapter 2-4** progressively
