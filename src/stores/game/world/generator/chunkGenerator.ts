import type { ChunkData } from "../../../types";
import { getSeededRandom, generateChunkEntities } from "./entityGenerator";
import { getWorldLayout, getKeyCoordinateForChunk, getTerrainForChunk } from "../../../worldGenerator";

/**
 * Procedural chunk generation logic
 */
export const generateChunk = (x: number, z: number): ChunkData => {
	const id = `${x},${z}`;
	const seed = Math.abs(x * 31 + z * 17);
	
	// Get world layout for intelligent placement
	const layout = getWorldLayout();
	const keyCoord = getKeyCoordinateForChunk(layout, x, z);
	const terrainType = getTerrainForChunk(layout, x, z);
	const difficulty = keyCoord?.difficulty ?? Math.min(1, Math.sqrt(x * x + z * z) / 50);
	const isPOI = !!(keyCoord && keyCoord.type !== "WAYPOINT");

	const entities = generateChunkEntities(x, z, id, difficulty, terrainType, isPOI, keyCoord);

	return {
		id,
		x,
		z,
		seed,
		terrainType,
		secured: false,
		entities,
		decorations: [
			{ id: `${id}-dec-0`, type: "REED", count: Math.floor(getSeededRandom(x, z, 100) * 20) + 10 },
			{ id: `${id}-dec-1`, type: "LILYPAD", count: Math.floor(getSeededRandom(x, z, 101) * 15) + 5 },
			{ id: `${id}-dec-2`, type: "DEBRIS", count: Math.floor(getSeededRandom(x, z, 102) * 5) },
			{ id: `${id}-dec-3`, type: "BURNT_TREE", count: terrainType === "DENSE_JUNGLE" ? 15 : 5 },
			{ id: `${id}-dec-4`, type: "MANGROVE", count: terrainType === "DENSE_JUNGLE" ? 20 : 10 },
			{ id: `${id}-dec-5`, type: "DRUM", count: Math.floor(getSeededRandom(x, z, 105) * 3) },
		],
	};
};
