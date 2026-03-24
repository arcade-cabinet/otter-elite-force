/**
 * Building System — Placement, construction, and ghost preview.
 *
 * Handles:
 * 1. Building placement: validate tile, deduct resources, spawn entity with
 *    ConstructionProgress trait.
 * 2. Construction tick: River Rat builders near incomplete buildings advance
 *    progress. At 100% the building activates.
 * 3. Ghost preview: returns placement validity for a given tile/building type.
 *
 * Runs every game tick via `buildingSystem(world, delta)`.
 */

import type { World } from "koota";
import { ConstructionProgress } from "../ecs/traits/economy";
import { Health } from "../ecs/traits/combat";
import { Faction, IsBuilding, UnitType } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { ConstructingAt, OwnedBy } from "../ecs/relations";
import { resourceStore } from "../stores/resourceStore";
import { ALL_BUILDINGS, type BuildingDef } from "../data/buildings";

/** Distance at which a builder can work on a building. */
const BUILD_RANGE = 1.5;

/** Base construction rate: percentage points per second per builder. */
const BASE_BUILD_RATE = 100; // A building with 30s build time: 100/30 = 3.33%/s per builder

/**
 * Terrain type for tile validation.
 */
export type TerrainType = "grass" | "dirt" | "mud" | "water" | "mangrove" | "bridge";

/**
 * Tile map interface for placement validation.
 * Can be replaced by the real tilemap once Task #7 lands.
 */
export interface TileMap {
	/** Get the terrain type at tile coordinates. */
	getTerrain(x: number, y: number): TerrainType | null;
	/** Check if a tile is occupied by another building. */
	isOccupied(x: number, y: number): boolean;
}

/**
 * Validate whether a building can be placed at the given tile.
 */
export function canPlaceBuilding(
	buildingId: string,
	x: number,
	y: number,
	tileMap: TileMap,
): { valid: boolean; reason?: string } {
	const def = ALL_BUILDINGS[buildingId];
	if (!def) return { valid: false, reason: "Unknown building type" };

	const terrain = tileMap.getTerrain(x, y);
	if (terrain === null) return { valid: false, reason: "Out of bounds" };

	if (tileMap.isOccupied(x, y)) return { valid: false, reason: "Tile occupied" };

	// Water tiles: only Dock and Fish Trap can be placed on water edge
	if (terrain === "water") {
		if (def.requiresWater) return { valid: true };
		return { valid: false, reason: "Cannot build on water" };
	}

	// Water-required buildings need water
	if (def.requiresWater && terrain !== "water") {
		return { valid: false, reason: "Must be placed on water edge" };
	}

	// Can't build on mangrove (dense trees)
	if (terrain === "mangrove") return { valid: false, reason: "Cannot build on mangrove" };

	// Check if player can afford
	if (!resourceStore.getState().canAfford(def.cost)) {
		return { valid: false, reason: "Insufficient resources" };
	}

	return { valid: true };
}

/**
 * Place a building at tile (x, y).
 * Deducts resources, spawns a Koota entity with ConstructionProgress.
 * Returns the spawned entity or null if placement failed.
 */
export function placeBuilding(
	world: World,
	buildingId: string,
	x: number,
	y: number,
	tileMap: TileMap,
	ownerFaction: ReturnType<World["spawn"]>,
) {
	const validation = canPlaceBuilding(buildingId, x, y, tileMap);
	if (!validation.valid) return null;

	const def = ALL_BUILDINGS[buildingId];

	// Deduct resources
	const deducted = resourceStore.getState().deductResources(def.cost);
	if (!deducted) return null;

	// Spawn building entity with construction progress
	const building = world.spawn(
		IsBuilding,
		UnitType({ type: buildingId }),
		Position({ x, y }),
		Health({ current: def.hp, max: def.hp }),
		ConstructionProgress({ progress: 0, buildTime: def.buildTime }),
		OwnedBy(ownerFaction),
	);

	return building;
}

/**
 * Main building system tick.
 * Advances construction progress for buildings being built by workers.
 */
export function buildingSystem(world: World, delta: number): void {
	processConstruction(world, delta);
}

/**
 * Process all builders (workers with ConstructingAt relation).
 * Each builder near an incomplete building advances its progress.
 */
function processConstruction(world: World, delta: number): void {
	// Find all workers that are constructing something
	const builders = world.query(Position, ConstructingAt("*"));

	for (const builder of builders) {
		const building = builder.targetFor(ConstructingAt);
		if (!building || !building.has(ConstructionProgress)) continue;

		const builderPos = builder.get(Position);
		const buildingPos = building.get(Position);

		const dx = builderPos.x - buildingPos.x;
		const dy = builderPos.y - buildingPos.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > BUILD_RANGE) continue;

		// Advance construction
		const cp = building.get(ConstructionProgress);
		if (cp.progress >= 100) continue;

		// Rate: 100 / buildTime per second per builder
		const rate = (BASE_BUILD_RATE / cp.buildTime) * delta;
		const newProgress = Math.min(100, cp.progress + rate);
		building.set(ConstructionProgress, { progress: newProgress });

		// When complete, remove ConstructionProgress and release builder
		if (newProgress >= 100) {
			building.remove(ConstructionProgress);
			builder.remove(ConstructingAt(building));
		}
	}
}
