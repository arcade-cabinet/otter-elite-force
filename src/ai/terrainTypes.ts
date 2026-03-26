/**
 * RTS terrain types and their pathfinding cost weights.
 *
 * Spec reference: §8.1 Tilemap & Terrain, §8.3 Pathfinding
 */

export type TerrainType =
	| "grass"
	| "dirt"
	| "mud"
	| "water"
	| "bridge"
	| "mangrove"
	| "toxic_sludge"
	| "tall_grass"
	| "beach"
	| "sand"
	| "scorched";

/** Movement cost per terrain type. Infinity = impassable. */
export const TERRAIN_COST: Record<TerrainType, number> = {
	grass: 1,
	dirt: 1,
	mud: 2,
	water: Number.POSITIVE_INFINITY,
	bridge: 1,
	mangrove: 1,
	toxic_sludge: 1,
	tall_grass: 1,
	beach: 1,
	sand: 1,
	scorched: 1,
};

/** Returns true if a unit can walk on this terrain without special traits. */
export function isWalkable(terrain: TerrainType): boolean {
	return TERRAIN_COST[terrain] < Number.POSITIVE_INFINITY;
}

/**
 * Get movement cost for a terrain tile, considering unit capabilities.
 * Units with CanSwim treat water as cost 2 instead of impassable.
 */
export function getTerrainCost(terrain: TerrainType, canSwim = false): number {
	if (terrain === "water" && canSwim) return 2;
	return TERRAIN_COST[terrain];
}
