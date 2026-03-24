/**
 * ============================================================================
 * INTEGRATION NOTES: Wiring Entity Architecture into Phaser Scenes
 * ============================================================================
 *
 * This file documents the changes needed to wire the new entity architecture
 * (types.ts, palette.ts, renderer.ts, spawner.ts, terrain/) into the existing
 * Phaser scenes. It is a reference for Task #20 (F1) — DO NOT import this file.
 *
 * ============================================================================
 * 1. BootScene (src/Scenes/BootScene.ts)
 * ============================================================================
 *
 * CURRENT STATE:
 *   - createPlaceholderTextures() generates 19 solid-color rectangles via
 *     Phaser Graphics (gfx.generateTexture). These are keyed with hyphenated
 *     names: "river-rat", "command-post", "portrait-foxhound", etc.
 *   - No real sprites are rendered — every entity is a colored rectangle.
 *
 * WHAT CHANGES:
 *   - DELETE createPlaceholderTextures() entirely.
 *   - REPLACE with a new method renderAllTextures() that:
 *     1. Imports the entity registry (src/entities/registry.ts, Task #18).
 *        The registry re-exports every UnitDef, HeroDef, BuildingDef,
 *        ResourceDef, PortraitDef as flat Maps keyed by entity id.
 *     2. Calls getScaleFactor() once per size class (16, 32, 64).
 *     3. For each entity definition, calls renderSprite(id, def.sprite, scale).
 *     4. Calls registerTextures(this.textures, rendered) to register all
 *        generated Canvas elements with Phaser's TextureManager.
 *   - This runs synchronously in preload() or create(). No async loading.
 *   - Loading bar stays as-is (it can show synthetic progress by counting
 *     entities rendered vs total).
 *
 * KEY NAMING MIGRATION:
 *   Old placeholders used hyphenated keys: "river-rat", "command-post"
 *   New keys use underscored ids:          "river_rat", "command_post"
 *   The sync layer (src/systems/syncSystem.ts) and any sprite creation code
 *   must be updated to use the new key convention. Search for hyphenated
 *   texture keys in: syncSystem.ts, GameScene.ts, BriefingScene.ts, HUDScene.
 *
 * IMPORTS NEEDED:
 *   import { renderSprite, registerTextures, getScaleFactor } from "@/entities/renderer";
 *   import { ALL_ENTITY_DEFS } from "@/entities/registry"; // Task #18
 *
 * ============================================================================
 * 2. GameScene (src/Scenes/GameScene.ts)
 * ============================================================================
 *
 * CURRENT STATE:
 *   - Imports ALL_UNITS from src/data/units.ts (old data module).
 *   - spawnMapEntities() manually calls world.spawn() with inline trait
 *     composition — duplicating the logic that spawner.ts now encapsulates.
 *   - handleScenarioAction("spawnUnits"|"spawnReinforcements") also has
 *     duplicated inline spawning with hardcoded defaults (visionRadius: 5,
 *     cooldown: 1.0).
 *   - Uses loadMission() from src/maps/loader.ts which builds a Phaser
 *     Tilemap from a numeric TerrainType[][] grid.
 *   - Mission data comes from src/maps/missions/ (old MissionMapData format).
 *
 * WHAT CHANGES:
 *
 *   A) Entity Spawning → Use spawner.ts
 *      - DELETE spawnMapEntities() method.
 *      - REPLACE with a method that reads MissionDef.placements[] and calls:
 *        - spawnUnit(world, unitDefs[p.type], p.x, p.y, p.faction)
 *        - spawnBuilding(world, buildingDefs[p.type], p.x, p.y, p.faction)
 *        - spawnResource(world, resourceDefs[p.type], p.x, p.y)
 *      - For zone-based placements (p.zone + p.count), scatter entities
 *        randomly within the zone rect from MissionDef.zones[p.zone].
 *      - handleScenarioAction "spawnUnits"/"spawnReinforcements" should also
 *        call spawnUnit() instead of inline world.spawn().
 *
 *   B) Map Loading → Use paintMap()
 *      - DELETE the loadMission() call from src/maps/loader.ts.
 *      - REPLACE with:
 *        1. paintMap(missionDef.terrain, tileSize) → returns a Canvas.
 *        2. Register it: this.textures.addCanvas("terrain-bg", canvas).
 *        3. Create a Phaser Image from it: this.add.image(0, 0, "terrain-bg").setOrigin(0, 0).
 *        4. For collision/pathfinding, build a lightweight cost grid from
 *           the terrain regions + TERRAIN_TILES[id].movementCost. This
 *           replaces the Phaser Tilemap collision layer.
 *      - Camera bounds: canvas.width x canvas.height.
 *
 *   C) Mission Data Source
 *      - DELETE imports of mission01Beachhead..mission04PrisonBreak from
 *        src/maps/missions/.
 *      - REPLACE with imports from src/entities/missions/ (new MissionDef
 *        format, Task #21/#23).
 *      - The MISSION_MAPS registry changes from Record<number, MissionMapData>
 *        to Record<string, MissionDef>, keyed by mission id string.
 *
 *   D) Imports to Change:
 *      - REMOVE: ALL_UNITS from "@/data/units"
 *      - REMOVE: loadMission, TILE_SIZE from "@/maps/loader"
 *      - REMOVE: mission01..04 from "@/maps/missions/*"
 *      - REMOVE: MapEntity, MissionMapData from "@/maps/types"
 *      - ADD: spawnUnit, spawnBuilding, spawnResource from "@/entities/spawner"
 *      - ADD: paintMap from "@/entities/terrain/map-painter"
 *      - ADD: TERRAIN_TILES from "@/entities/terrain/tiles"
 *      - ADD: Mission definitions from "@/entities/missions/*"
 *      - ADD: Entity registry for lookup from "@/entities/registry"
 *
 * ============================================================================
 * 3. BriefingScene (src/Scenes/BriefingScene.ts)
 * ============================================================================
 *
 * CURRENT STATE:
 *   - Hardcoded MISSION_BRIEFINGS Record<number, { title, lines[] }>.
 *   - Portrait rendering: checks textures.exists("portrait-foxhound"),
 *     draws at scale 2 — currently renders the placeholder colored rect.
 *   - Speaker names are plain strings with no portrait-per-speaker logic.
 *
 * WHAT CHANGES:
 *
 *   A) Briefing Data → Read from MissionDef
 *      - DELETE the hardcoded MISSION_BRIEFINGS constant.
 *      - REPLACE: Load MissionDef by id, read missionDef.briefing.lines[].
 *      - Mission title comes from missionDef.name + missionDef.subtitle.
 *
 *   B) Portrait Rendering → Use rendered portrait textures
 *      - In createPortrait(), the texture key changes:
 *        Old: "portrait-foxhound"
 *        New: missionDef.briefing.portraitId (e.g., "portrait_foxhound")
 *      - BootScene will have already rendered and registered all portrait
 *        textures from PortraitDef definitions, so textures.exists() will
 *        return true for real pixel art.
 *      - Speaker-specific portraits: when the speaker changes between
 *        dialogue lines, swap the portrait image. Each speaker's portraitId
 *        can be looked up from the hero/portrait registry.
 *
 *   C) Dialogue Color
 *      - PortraitDef includes dialogueColor. Use it for the speaker name
 *        text color instead of hardcoded "#c4a43a".
 *
 * ============================================================================
 * 4. Sync Layer (src/systems/syncSystem.ts)
 * ============================================================================
 *
 * The sync layer creates Phaser sprites from Koota entities. It currently
 * uses the UnitType.type field to look up a Phaser texture key. Since the
 * new entity ids use underscores (river_rat) and old textures used hyphens
 * (river-rat), the sync layer must:
 *   - Use the entity id directly as the texture key (no hyphen conversion).
 *   - BootScene guarantees all entity textures are registered under their
 *     definition id before GameScene starts.
 *
 * ============================================================================
 * 5. Pathfinding Cost Grid
 * ============================================================================
 *
 * Currently, pathfinding uses the Phaser Tilemap's collision data. With
 * the new painted-canvas terrain, we need a separate cost grid:
 *
 *   function buildCostGrid(terrain: MissionDef["terrain"]): number[][] {
 *     const grid = Array.from({ length: terrain.height }, () =>
 *       new Array(terrain.width).fill(1) // default grass
 *     );
 *     // Apply regions: for each tile in each region, set cost from
 *     // TERRAIN_TILES[region.terrainId].movementCost
 *     // Apply overrides similarly
 *     return grid;
 *   }
 *
 * This grid feeds into the existing pathfinder (src/ai/pathfinder.ts).
 *
 * ============================================================================
 * 6. Deletion Candidates (after F1 is wired)
 * ============================================================================
 *
 * Once scenes use the new architecture, these become dead code:
 *   - src/data/units.ts, buildings.ts, research.ts, factions.ts
 *   - src/maps/loader.ts
 *   - src/maps/missions/ (all 4 old-format mission files)
 *   - src/maps/types.ts (TerrainType enum, MissionMapData, MapEntity)
 *   - src/sprites/ (entire directory — parser, compiler, atlas, vitePlugin)
 *   - BootScene.createPlaceholderTextures()
 *
 * These deletions are tracked in Task #24 (G1).
 *
 * ============================================================================
 */

export {};
