/**
 * Terrain type IDs — shared numeric constants for terrain grid cells.
 *
 * Used by missionBootstrap, TileLayer construction, minimap, and pathfinding.
 * Extracted from the old rendering/terrainRenderer to keep terrain data
 * independent of the rendering backend.
 */

export const TerrainTypeId = {
	grass: 0,
	water: 1,
	sand: 2,
	forest: 3,
	dirt: 4,
	stone: 5,
	mud: 6,
	mangrove: 7,
	bridge: 8,
	beach: 9,
	toxic_sludge: 10,
	scorched: 11,
} as const;

export type TerrainTypeIdValue = (typeof TerrainTypeId)[keyof typeof TerrainTypeId];
