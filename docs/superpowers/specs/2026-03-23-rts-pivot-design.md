# OTTER: ELITE FORCE — RTS Pivot Design Specification

**Date:** 2026-03-23
**Status:** Draft v2 — Post-Review Revision
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
| **State** | Zustand | 5.x | Campaign persistence, settings, Phaser scene communication |
| **Persistence** | @capacitor-community/sqlite (native + web via jeep-sqlite) | 8.x | Save games, settings, campaign progress |
| **Audio** | Tone.js | 15.x | Procedural synth music and SFX |
| **Quality** | Biome + Vitest + Playwright | latest | Lint/format, unit tests, E2E |

### Platform Persistence Strategy

**One library, all platforms:** `@capacitor-community/sqlite` provides:
- **Native (iOS/Android):** Real SQLite via Capacitor plugin
- **Web:** jeep-sqlite (WASM-based SQLite, built into the same package)

No sql.js, no Drizzle, no separate web fallback. One SQLite API everywhere. Configure in `capacitor.config.ts`:

```typescript
plugins: {
  CapacitorSQLite: {
    iosDatabaseLocation: 'Library/CapacitorDatabase',
    iosIsEncryption: false,
    androidIsEncryption: false,
  }
}
```

### Architecture Layers

**Pure Phaser — no React.** Phaser owns ALL rendering including UI. This eliminates the hardest integration problem (two-event-system arbitration between React DOM and Phaser canvas). The UI IS the game — hand-painted ASCII panels that match the art style, not web-framework buttons.

```
┌──────────────────────────────────────────────────────┐
│              Phaser (ALL visual output)               │
│  Game Scene: Tilemap, Sprites, Fog, Particles, Camera│
│  HUD Scene:  Resources, Minimap, Unit Panel, Actions │
│  Menu Scene: Campaign Select, Briefings, Portraits   │
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

**Why no React:** Phaser's Scene system natively supports layered UI (HUD Scene over Game Scene). Phaser Text, Graphics, Container, and BitmapText handle all UI elements. Briefings are just: background + portrait sprite + text box + button — all Phaser-native. Dropping React removes ~150KB of bundle and eliminates DOM↔Canvas input conflicts entirely.

---

## 3. Art Direction: The ASCII Sprite Factory

**All visual assets are procedurally generated from ASCII art definitions.** No external image files.

### Pipeline

```
Design Time                    Build Time                  Runtime
┌───────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│ ASCII Sprite Editor│    │ Vite Plugin/Script    │    │ Phaser loads     │
│ (visual painting   │───▶│ Reads .sprite.json    │───▶│ pre-compiled     │
│  tool in browser)  │    │ Outputs pixel buffers  │    │ texture atlases  │
└───────────────────┘    │ + spritesheet atlases  │    └─────────────────┘
         │               └──────────────────────┘
         ▼
  .sprite.json files
  (source of truth)
```

### Storage Format (.sprite)

Sprites use a human-readable `.sprite` format: TOML header for metadata, then the raw ASCII grid IS the art. You can open the file and literally see the sprite.

```toml
# mudfoot.sprite

[meta]
name = "mudfoot"
width = 16
height = 16

[palette]
# char = "fg_hex"  (bg always transparent unless specified as "fg;bg")
"#" = "#8B6914"     # brown fur
"@" = "#6B4912"     # dark fur / shadow
"." = "#FFFFFF"     # eye glint
"=" = "#1E3A8A"     # blue uniform
"-" = "#3B82F6"     # light blue detail
"o" = "#FFCC99"     # skin
"^" = "#4B5563"     # helmet metal

[animations]
idle = { frames = [0], rate = 1 }
walk = { frames = [0, 1, 2, 1], rate = 8 }

[frame.0]
art = """


      ^^^^
     ^@@@@^
     ^.@@.^
      oooo
     o=--=o
     ======
     =#==#=
     =-==-=
      ====
     ##  ##
     ##  ##
     ##  ##


"""
```

**Why this format:**
1. **The art is visible in the source file.** Open `mudfoot.sprite` and you SEE the otter. No JSON array parsing needed to visualize it.
2. **TOML is human-editable.** Palette definitions are readable. Animation configs are clean.
3. **Git-friendly.** Diffs show exactly which pixels changed. JSON pixel arrays produce unreadable diffs.
4. **AI-authorable.** Claude can read, write, and modify `.sprite` files naturally — the art is just text.
5. **Editor-compatible.** The visual editor reads/writes this format. The raw file is also editable in any text editor.

The build-time compiler maps character density (`#` = solid, `@` = dense, `.` = light, ` ` = transparent) combined with the palette colors to produce pixel buffers.

### Dev Tooling

A browser-based ASCII sprite editor (forked from or inspired by tools like `ascii-sprite-editor`) provides:
- Visual grid painting with character + color selection per cell
- Live preview at target resolution (1x, 2x, 4x)
- Animation frame editing (multi-frame sprites)
- Read/write `.sprite` files (TOML + ASCII grid)
- Gallery view of all game assets
- Palette management (per-sprite and shared palettes)

This tool is dev-only (not shipped in the game). It runs as a separate Vite dev server or as a Phaser Scene in a dev mode.

**Workflow:** Paint in editor → save as `.sprite` → build-time Vite plugin compiles to texture atlases → Phaser loads atlases at boot. The `.sprite` files are the source of truth, checked into git alongside the code.

### Why ASCII-as-Pixels

1. **Pixel-level control** — Each character maps to a pixel with density (glyph shape) AND color. A `#` in brown is fur texture. A `.` in white is an eye glint. Two channels of visual information per pixel.
2. **Human-authorable** — Sprites are painted visually in an editor, stored as JSON. No opaque binary formats.
3. **Resolution-independent** — Same source renders at 1x, 2x, 4x by changing pixel scale. Cross-platform scaling for free.
4. **No external assets** — JSON definitions are checked into git. No PNGs, no asset CDN. Everything compiles from source.
5. **AI-authorable** — Claude can read and write `.sprite.json` files directly, enabling AI-assisted art creation.

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
| Unit | Role | Cost | HP | Armor | Damage | Range | Speed | Pop | Unlock | Train At |
|------|------|------|----|-------|--------|-------|-------|-----|--------|----------|
| **River Rat** | Worker — gathers, builds, repairs | 50 Fish | 40 | 0 | 5 (melee) | 1 | 10 | 1 | Mission 1 | Command Post |
| **Mudfoot** | Melee infantry — front line | 80 Fish, 20 Salvage | 80 | 2 | 12 (melee) | 1 | 8 | 1 | Mission 1 | Barracks |
| **Shellcracker** | Ranged infantry — DPS | 70 Fish, 30 Salvage | 50 | 0 | 10 (ranged) | 5 | 9 | 1 | Mission 3 | Barracks |
| **Sapper** | Anti-building siege | 100 Fish, 50 Salvage | 60 | 1 | 30 vs buildings, 8 vs units | 1 | 7 | 1 | Mission 5 | Armory |
| **Raftsman** | Water transport (carries 4) | 60 Timber, 20 Salvage | 100 | 3 | 0 (no attack) | — | 6 | 1 | Mission 7 | Dock |
| **Mortar Otter** | Long range AoE | 80 Fish, 60 Salvage | 45 | 0 | 20 (AoE, 2-tile splash) | 7 | 5 | 1 | Mission 9 | Armory |
| **Diver** | Underwater scout | 60 Fish, 40 Salvage | 35 | 0 | 8 (melee) | 1 | 12 | 1 | Mission 9+ (requires Mission 8 completion) | Dock |

**Buildings:**

| Building | Function | Cost | HP | Build Time | Unlock |
|----------|----------|------|----|------------|--------|
| **Command Post** | Workers, resource depot. One per base. | Starting / 400 Timber, 200 Salvage | 600 | 60s | Mission 1 |
| **Barracks** | Trains Mudfoots, Shellcrackers | 200 Timber | 350 | 30s | Mission 1 |
| **Armory** | Trains Sappers, Mortar Otters. Research. | 300 Timber, 100 Salvage | 400 | 40s | Mission 5 |
| **Watchtower** | Detection radius (8 tiles), light ranged defense (6 dmg) | 150 Timber | 200 | 20s | Mission 1 |
| **Fish Trap** | Passive fish income (+3 fish/10s) | 100 Timber | 80 | 15s | Mission 1 |
| **Burrow** | +6 population cap | 80 Timber | 100 | 10s | Mission 1 |
| **Dock** | Trains Raftsmen, Divers. Must be on water edge. | 250 Timber, 50 Salvage | 300 | 35s | Mission 7 |
| **Field Hospital** | Heals nearby units (+2 HP/s in 3-tile radius) | 200 Timber, 100 Salvage | 250 | 30s | Mission 10 |
| **Sandbag Wall** | Barrier, blocks pathing | 50 Timber | 150 | 5s | Mission 1 |
| **Stone Wall** | Stronger barrier (requires Fortified Walls research) | 100 Timber, 50 Salvage | 400 | 10s | Mission 11 |
| **Gun Tower** | Upgraded tower, 12 dmg ranged attack (requires research) | 200 Timber, 100 Salvage | 350 | 25s | Mission 11 |
| **Minefield** | One-time trap, 40 dmg to first unit that crosses | 80 Salvage | 1 (invisible) | 8s | Mission 11 |

**Key change from draft v1:** Fish Trap and population cap are now **split into separate buildings.** Fish Traps provide income only. **Burrows** provide population cap only (+6 per burrow). This creates a genuine economic tradeoff: spend Timber on income generation OR army capacity, not both at once.

### Scale-Guard Militia — Enemy Faction

**Doctrine:** Ambush, area-denial, attrition. "Sacred Sludge" ideology.

| Unit | Role | HP | Armor | Damage | Range | Speed | Behavior |
|------|------|----|-------|--------|-------|-------|----------|
| **Skink** | Worker | 30 | 0 | 4 | 1 | 10 | Gathers, builds Scale-Guard structures |
| **Gator** | Melee tank | 120 | 4 | 18 | 1 | 5 | Slow, hard-hitting, can submerge briefly for ambush |
| **Viper** | Ranged poison | 35 | 0 | 8 + 4 DoT (3s) | 5 | 8 | Glass cannon, poison damage over time |
| **Snapper** | Turret | 80 | 3 | 14 | 6 | 0 | Anchored, high sustained DPS, cannot move |
| **Scout Lizard** | Recon | 25 | 0 | 3 | 1 | 14 | Fast, reveals fog, calls reinforcements on sight |
| **Croc Champion** | Elite | 200 | 5 | 25 | 1 | 6 | Mini-boss, heavy armor + damage, spawns in later missions |
| **Siphon Drone** | Harass | 40 | 1 | 0 | 3 | 7 | Drains 2 fish/sec from nearest player building within range |

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

Mobile/Tablet (LANDSCAPE ONLY — portrait not supported for gameplay):
┌───────────────────────────────────────────────┐
│ [Resources]                    [Clock/Score]  │
├──────┬────────────────────────────┬───────────┤
│      │                            │ Unit Info │
│ Mini │       Game Canvas          │           │
│ map  │                            │ Actions / │
│      │                            │ Build     │
├──────┴────────────────────────────┴───────────┤
│ [Squad Tabs 1-4]              [Move][Attack]  │
└───────────────────────────────────────────────┘

Note: Capacitor ScreenOrientation plugin locks to landscape during gameplay.
Portrait orientation is used ONLY for the campaign menu/briefing screens.
```

---

## 8. Core Game Systems

### 8.1 Tilemap & Terrain

- **Tile size:** 32×32 pixels (rendered from ASCII tile definitions)
- **No fixed map sizes.** Each mission's map is exactly the size its content requires. A tight commando infiltration (Mission 4) might be 30×25 tiles. An all-out war (Mission 15) might be 120×90. The map serves the mission, not the other way around.
- **Responsive viewport:** The camera shows a segment of the map. On larger screens, more tiles are visible. On smaller screens, fewer. The map is always the same; only the viewport window changes. Phaser's camera zoom + ScaleManager handle this automatically.
- **Terrain types:** Grass, dirt, mud (slow), water (impassable without raft/swim), mangrove (blocks LOS, harvestable), toxic sludge (damages), bridge, tall grass (concealment)
- **Phaser TilemapLayer:** Orthogonal view, top-down perspective
- **Hand-painted campaign maps:** Each of the 16 campaign missions has a hand-crafted map defined as a tilemap data file. Every chokepoint, resource node, trigger zone, and scenic detail is intentionally placed for that mission's narrative and gameplay flow. No procedural terrain generation for campaign.
- **Procedural generation (Skirmish only):** Skirmish mode uses procedural map generation with terrain noise, resource seeding, and symmetry constraints for balanced PvE/PvP. Campaign maps are NEVER procedurally generated.

### 8.2 Fog of War

- **Three states:** Unexplored (black), Explored (greyed, shows terrain but not units), Visible (full color, real-time)
- **Implementation:** Phaser RenderTexture overlay. Each unit has a vision radius. Update fog per frame based on all friendly unit positions.
- **Fog memory:** Explored areas retain last-seen state of buildings/terrain.

### 8.3 Pathfinding

- **Single AI library:** Yuka handles BOTH pathfinding AND steering (no EasyStarJS)
- **Tile-grid pathfinding:** Build a Yuka `Graph` from the tilemap (each tile = `Node`, edges = adjacent walkable tiles with cost weights). Use Yuka's `AStar` to find paths on this graph. Rebuild affected graph edges when buildings are placed/destroyed.
- **Terrain costs:** Grass=1, Dirt=1, Mud=2, Bridge=1, Water=∞ (unless unit has `CanSwim` trait)
- **Movement execution:** Yuka `FollowPathBehavior` converts A* waypoints into smooth steering
- **Dynamic obstacle avoidance:** Yuka `SeparationBehavior` + `ObstacleAvoidanceBehavior` for unit-to-unit and unit-to-building collision avoidance
- **Flow fields** for large group movement (optimization for 20+ units moving to same target — custom implementation layered on Yuka's steering)

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
| **Hardshell Armor** | 150 Salvage, 20s | +20 HP to all Mudfoots (80→100) | Mission 5 |
| **Fish Oil Arrows** | 100 Salvage, 15s | +3 damage to Shellcrackers (10→13) | Mission 5 |
| **Fortified Walls** | 200 Salvage, 25s | Unlocks Stone Walls (150→400 HP) | Mission 9 |
| **Gun Emplacements** | 250 Salvage, 30s | Unlocks Gun Towers (6→12 dmg) | Mission 9 |
| **Demolition Training** | 150 Salvage, 20s | +50% Sapper damage vs buildings (30→45) | Mission 9 |
| **Advanced Rafts** | 100 Salvage, 15s | +30% Raftsman speed, +2 carry capacity (4→6) | Mission 7 |
| **Mortar Precision** | 200 Salvage, 25s | −30% Mortar Otter scatter radius | Mission 9 |
| **Combat Medics** | 150 Salvage, 20s | Field Hospital heal rate +50% (+2→+3 HP/s) | Mission 10 |
| **Diving Gear** | 100 Salvage, 15s | Divers can attack while submerged | Mission 9 |

**Research timing note:** Research items are queued at the Armory one at a time. The research time creates a strategic decision: do you research upgrades NOW or save the Armory production slot for training Sappers/Mortar Otters? Fortified Walls and Gun Emplacements unlock at Mission 9 (not 11) to give the player time to experiment with them in Missions 9-10 before the Entrenchment defense mission (11) where they're essential.

---

## 13. Post-Campaign: Skirmish Mode

After completing the campaign (or specific missions), unlock Skirmish mode:

- **Map selection:** All 16 campaign maps + procedurally generated maps
- **Difficulty:** Easy / Medium / Hard / Brutal (AI behavior + resource bonus)
- **Faction:** Play as URA (default) or Scale-Guard (mirror units)
- **Victory condition:** Destroy enemy Command Post
- **Replayability driver:** Star ratings on campaign missions + skirmish leaderboards

---

## 14. Koota ↔ Phaser Sync Layer

Koota is the authoritative state. Phaser sprites are visual representations. No React — Phaser owns all rendering and input.

### Entity Lifecycle

1. When a Koota entity gains `Position` + `UnitType` → create a Phaser Sprite, store sprite reference in an AoS trait
2. Each frame: sync Koota `Position` → Phaser sprite `x, y`
3. When a Koota entity is destroyed → destroy corresponding Phaser sprite
4. Phaser input events (click on sprite) → resolve to Koota entity ID → update Koota selection state

```typescript
const PhaserSprite = trait(() => null as Phaser.GameObjects.Sprite | null);

// Sync system — runs in Phaser Scene update()
function syncKootaToPhaser(world: World, scene: Phaser.Scene) {
  // Handle new entities (need sprite creation)
  world.query(Added(Position), UnitType).forEach(entity => {
    const pos = entity.get(Position);
    const type = entity.get(UnitType);
    const sprite = scene.add.sprite(pos.x * 32, pos.y * 32, type.type);
    sprite.setInteractive();
    sprite.setData('kootaEntity', entity);  // Back-reference for input
    entity.add(PhaserSprite(sprite));
  });

  // Sync positions
  world.query(Position, PhaserSprite).updateEach(([pos, sprite]) => {
    if (sprite) {
      sprite.x = pos.x * 32;
      sprite.y = pos.y * 32;
    }
  });

  // Handle removed entities
  world.query(Removed(Position), PhaserSprite).forEach(entity => {
    const sprite = entity.get(PhaserSprite);
    if (sprite) sprite.destroy();
  });
}
```

### Phaser Scene Architecture

```
Phaser.Game
├── BootScene          — Load ASCII sprite textures from compiled atlases
├── MenuScene          — Campaign select, settings, difficulty
├── BriefingScene      — Portrait + dialogue (Phaser Text + Sprite)
├── GameScene          — Tilemap, units, fog of war, combat
├── HUDScene           — Resources, minimap, unit panel, actions (parallel to GameScene)
├── PauseScene         — Pause overlay
└── VictoryScene       — Mission complete, star rating
```

HUDScene runs **in parallel** with GameScene via `this.scene.launch('HUD')`. HUD elements are Phaser GameObjects (Text, Graphics, Containers) — NOT DOM elements. This means all UI matches the pixel art aesthetic perfectly.

### Zustand Role (Without React)

Zustand still serves as the persistence bridge and global state, but is accessed via `getState()` / `subscribe()` instead of React hooks:

```typescript
// Phaser scene reads campaign state
const campaignState = useCampaignStore.getState();
if (campaignState.missions[4].status === 'completed') {
  // Gen. Whiskers delivers briefing instead of FOXHOUND
}

// Phaser scene writes to state on mission complete
useCampaignStore.setState({ missions: { ...missions, [id]: { status: 'completed', stars: 3 } } });
```

---

## 15. Pathfinding Performance Strategy

Yuka's A* on a dense tile grid (100×100 = 10,000 nodes) may be slow for many simultaneous pathfinding requests. Mitigations:

1. **Staggered pathfinding:** Don't compute all paths in one frame. Use a queue: max 4 pathfinding requests per frame, distribute over multiple frames.
2. **Path caching:** If multiple units are moving to the same destination, compute path once and share waypoints (with offset for formation).
3. **Hierarchical pathfinding:** For large maps, divide into sectors. A* between sectors first, then within-sector pathfinding.
4. **Early termination:** If the path target is >50 tiles away, pathfind to an intermediate waypoint first.
5. **Fallback:** If Yuka's Graph A* proves too slow in profiling, replace the pathfinder with a custom typed-array A* implementation while keeping Yuka for steering only.

---

## 16. Codebase Migration Plan

### What Gets Discarded

The RTS pivot is a full engine swap. The following existing code is **not reusable:**

| Directory/System | Reason |
|-----------------|--------|
| `src/ecs/` (Miniplex) | Replaced by Koota ECS |
| `src/Entities/` (R3F components) | Replaced by Phaser sprites |
| `src/Scenes/` (R3F Canvas) | Replaced by Phaser scenes |
| `src/UI/HUD.tsx` | Rebuilt with DaisyUI for RTS HUD |
| Three.js, R3F, Drei, Rapier, GSAP | Not needed for 2D Phaser game |
| `src/Core/InputSystem.ts` (nipplejs) | Replaced by Phaser input + Capacitor |
| `src/stores/worldGenerator.ts` | Open-world chunks → hand-painted tilemaps |

### What Gets Reused

| Module | How It's Reused |
|--------|----------------|
| Zustand store pattern | Adapted for campaign state + Phaser scene communication |
| Tone.js AudioEngine | Carried forward for procedural synth |
| Yuka AI integration pattern | Adapted for RTS unit AI (steering + FSM) |
| Zod schema validation | Used for scenario definition validation |
| Biome, Vitest, Playwright config | Build/test tooling unchanged |
| Vite config | Adapted for Phaser + Capacitor |
| Lore & character definitions | Direct transfer to campaign briefings |
| Existing DDL schemas | Adapted for RTS entity definitions |

---

## 17. Phased Delivery Plan

### Phase 1: Foundation (MVP — Missions 1-4)
- Vite + Phaser + Capacitor scaffold
- `.sprite` format parser + build-time compiler (Vite plugin)
- ASCII Sprite Factory proof-of-concept (unit sprites + 1 portrait)
- Koota ECS with core traits (Position, Health, UnitType, Faction)
- Koota↔Phaser sync layer
- Tilemap renderer with hand-painted Mission 1 map
- Resource gathering (Fish, Timber, Salvage)
- Building placement (Command Post, Barracks, Watchtower, Fish Trap, Burrow)
- Unit training (River Rat, Mudfoot)
- Basic combat (melee + ranged)
- Fog of war (RenderTexture)
- Yuka A* pathfinding on tile grid + steering behaviors
- Desktop input (click/drag select, right-click move)
- Phaser HUD Scene (resources, minimap, unit panel — all in-engine, no DOM)
- Briefing Scene (1 portrait — Gen. Whiskers or FOXHOUND)
- Missions 1-4 playable
- @capacitor-community/sqlite persistence (save/load mid-mission)
- **Deliverable:** Playable 4-mission demo on desktop web

### Phase 2: Depth (Missions 5-8)
- Mobile input (touch pan/select, landscape lock)
- Capacitor iOS/Android builds
- Weather system (monsoon)
- Water traversal (Raftsman, Dock)
- Siphon destruction mechanic
- CTF objective type
- Hero missions with stealth/detection
- Cpl. Splash + underwater layer
- Sapper + Armory + tech research
- Missions 5-8 playable
- Full portrait gallery (all 6 heroes + FOXHOUND)
- **Deliverable:** 8-mission game on desktop + mobile

### Phase 3: Scale (Missions 9-12)
- Mortar Otter + AoE combat
- Village liberation / territory control
- Defensive buildings (Stone Walls, Gun Towers, Minefields)
- Field Hospital + Medic Marina
- Sgt. Fang rescue + siege mechanics
- Full Scale-Guard AI (all unit types)
- Combined arms recon→strike gameplay
- Missions 9-12 playable
- **Deliverable:** 12-mission game with full unit roster

### Phase 4: Culmination (Missions 13-16 + Skirmish)
- Multi-base management
- Supply line logistics
- Demolition mechanics (Pvt. Muskrat)
- The Great Siphon boss encounter
- Sludge flood doomsday mechanic
- Mission scoring (Bronze/Silver/Gold)
- Skirmish mode with AI opponent
- Procedural map generation (Skirmish only)
- Audio polish (unit acknowledgments, ambient music)
- Performance optimization
- **Deliverable:** Complete game

---

## 18. Design Anti-Patterns (REJECTED)

- ❌ External asset files (PNG, MP3, GLB, etc.)
- ❌ Sci-fi aesthetics, chrome, cyborgs, lasers
- ❌ Pay-to-win or microtransactions
- ❌ Always-online requirement
- ❌ Desktop-first with mobile afterthought
- ❌ Canvas shape primitives for art (only ASCII pixel painting)
- ❌ Level-select without narrative context
- ❌ Procedurally generated campaign maps
- ❌ Portrait orientation during gameplay

---

## 19. Open Questions

1. **Multiplayer:** Is local or online multiplayer in scope for v1? (Assumed: no, campaign only)
2. **Music:** Full procedural soundtrack per mission, or ambient loops?
3. **Localization:** English only for v1?
4. **Analytics:** Track play metrics for balancing?
