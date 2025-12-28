/**
 * World Layout Generator
 */

import { generatePaths } from "./game/world/paths";
import { poissonDiscSample } from "./game/world/poisson";
import { SeededRandom } from "./game/world/random";
import { generateRiverPaths } from "./game/world/rivers";
import { determineTerrainType } from "./game/world/terrain";
import type { 
	PointOfInterestType,
	WorldLayout,
	WorldLayoutConfig,
	WorldPoint
} from "./game/world/types";
import type { TerrainType } from "./types";

// Re-exports
export type { WorldLayout, WorldLayoutConfig, WorldPoint, PointOfInterestType };

/**
 * Calculate difficulty based on distance from LZ and other factors
 */
function calculateDifficulty(x: number, z: number, worldRadius: number): number {
	const distFromOrigin = Math.sqrt(x * x + z * z);
	const normalizedDist = Math.min(1, distFromOrigin / worldRadius);

	// Difficulty increases with distance, with some variance
	return Math.min(1, normalizedDist * 1.2);
}

export function generateWorldLayout(config: WorldLayoutConfig): WorldLayout {
	const random = new SeededRandom(config.seed);

	// Generate base points using Poisson disc sampling
	const basePoints = poissonDiscSample(
		random,
		config.worldRadius * 2,
		config.worldRadius * 2,
		config.minPOIDistance,
	);

	// Generate river paths for terrain coherence
	const riverPaths = generateRiverPaths(random, config.worldRadius);

	// Create point ID helper
	const pointId = (x: number, z: number) => `${Math.round(x)},${Math.round(z)}`;

	// Initialize points map
	const points = new Map<string, WorldPoint>();
	const rescueLocations = new Map<string, WorldPoint>();

	// First, place the LZ at origin
	const lzPoint: WorldPoint = {
		x: 0,
		z: 0,
		type: "LZ",
		difficulty: 0,
		terrainType: "RIVER", // LZ is always at river for extraction
		connections: [],
	};
	points.set(pointId(0, 0), lzPoint);

	// Sort remaining points by distance from origin for difficulty-based assignment
	const sortedPoints = basePoints
		.filter((p) => Math.abs(p.x) > 3 || Math.abs(p.z) > 3) // Exclude points too close to LZ
		.sort((a, b) => {
			const distA = Math.sqrt(a.x * a.x + a.z * a.z);
			const distB = Math.sqrt(b.x * b.x + b.z * b.z);
			return distA - distB;
		});

	// Assign POI types based on distance and quota
	let villagesPlaced = 0;
	let outpostsPlaced = 0;
	let siphonsPlaced = 0;
	let rescuesPlaced = 0;
	const shuffledRescueChars = random.shuffle([...config.rescueCharacters]);

	for (const basePoint of sortedPoints) {
		const x = Math.round(basePoint.x);
		const z = Math.round(basePoint.z);
		const id = pointId(x, z);
		const difficulty = calculateDifficulty(x, z, config.worldRadius);
		const terrainType = determineTerrainType(x, z, config.seed, riverPaths);

		let poiType: PointOfInterestType;
		let rescueChar: string | undefined;
		let isBoss = false;
		let specialObj: string | undefined;

		// Assign type based on difficulty and quotas
		if (difficulty < 0.3 && villagesPlaced < config.villageCount) {
			// Easy areas get villages
			if (random.next() > 0.7 && rescuesPlaced < shuffledRescueChars.length) {
				poiType = "HEALER_HUB";
				rescueChar = shuffledRescueChars[rescuesPlaced++];
			} else {
				poiType = "VILLAGE";
				villagesPlaced++;
			}
		} else if (difficulty > 0.7 && outpostsPlaced < config.outpostCount) {
			// Hard areas get outposts
			if (random.next() > 0.6 && rescuesPlaced < shuffledRescueChars.length) {
				poiType = "PRISON_CAMP";
				rescueChar = shuffledRescueChars[rescuesPlaced++];
			} else if (random.next() > 0.8) {
				poiType = "BOSS_ARENA";
				isBoss = true;
				specialObj = "boss_encounter";
			} else {
				poiType = "ENEMY_OUTPOST";
				outpostsPlaced++;
			}
		} else if (difficulty > 0.4 && siphonsPlaced < config.siphonClusterCount) {
			// Mid-difficulty gets siphons
			if (random.next() > 0.5) {
				poiType = "SIPHON_CLUSTER";
				siphonsPlaced++;
			} else if (random.next() > 0.6) {
				poiType = "GAS_DEPOT";
				specialObj = "gas_cluster";
			} else {
				poiType = "WAYPOINT";
			}
		} else if (terrainType === "RIVER" && random.next() > 0.6) {
			poiType = "RAFT_DOCK";
		} else {
			poiType = "WAYPOINT";
		}

		const point: WorldPoint = {
			x,
			z,
			type: poiType,
			difficulty,
			terrainType,
			connections: [],
			rescueCharacter: rescueChar,
			isBossArea: isBoss,
			specialObjective: specialObj,
		};

		points.set(id, point);

		if (rescueChar) {
			rescueLocations.set(rescueChar, point);
		}
	}

	// Generate paths connecting all points
	const pathEdges = generatePaths(points, random);

	// Update point connections
	for (const edge of pathEdges) {
		const fromPoint = points.get(edge.from);
		const toPoint = points.get(edge.to);
		if (fromPoint && toPoint) {
			fromPoint.connections.push(edge.to);
			toPoint.connections.push(edge.from);
		}
	}

	// Generate terrain zones for all chunks in the world
	const terrainZones = new Map<string, TerrainType>();
	for (let x = -config.worldRadius; x <= config.worldRadius; x++) {
		for (let z = -config.worldRadius; z <= config.worldRadius; z++) {
			const chunkId = `${x},${z}`;
			terrainZones.set(chunkId, determineTerrainType(x, z, config.seed, riverPaths));
		}
	}

	// Create path array with terrain types
	const paths = pathEdges.map((edge) => {
		const fromPoint = points.get(edge.from)!;
		const toPoint = points.get(edge.to)!;
		// Path terrain is based on the more difficult terrain of the two endpoints
		const terrainType: TerrainType =
			fromPoint.terrainType === "DENSE_JUNGLE" || toPoint.terrainType === "DENSE_JUNGLE"
				? "DENSE_JUNGLE"
				: fromPoint.terrainType === "MARSH" || toPoint.terrainType === "MARSH"
					? "MARSH"
					: "RIVER";
		return { from: edge.from, to: edge.to, terrainType };
	});

	return {
		seed: config.seed,
		points,
		rescueLocations,
		paths,
		terrainZones,
	};
}

export const DEFAULT_WORLD_CONFIG: WorldLayoutConfig = {
	seed: 12345,
	worldRadius: 50, // 50 chunks in each direction
	minPOIDistance: 8, // Minimum 8 chunks between POIs
	villageCount: 6,
	outpostCount: 5,
	siphonClusterCount: 4,
	rescueCharacters: ["whiskers", "splash", "fang", "marina", "muskrat"],
};

/**
 * Get the key coordinate info for a chunk
 */
export function getKeyCoordinateForChunk(
	layout: WorldLayout,
	x: number,
	z: number,
): WorldPoint | null {
	const id = `${x},${z}`;
	return layout.points.get(id) ?? null;
}

/**
 * Get terrain type for a chunk from the layout
 */
export function getTerrainForChunk(layout: WorldLayout, x: number, z: number): TerrainType {
	const id = `${x},${z}`;
	return layout.terrainZones.get(id) ?? "MARSH";
}

/**
 * Check if there's a path between two chunks
 */
export function hasPathBetween(layout: WorldLayout, from: string, to: string): boolean {
	return layout.paths.some(
		(p) => (p.from === from && p.to === to) || (p.from === to && p.to === from),
	);
}

/**
 * Get all connected points from a location
 */
export function getConnectedPoints(layout: WorldLayout, chunkId: string): WorldPoint[] {
	const point = layout.points.get(chunkId);
	if (!point) return [];

	return point.connections.map((id) => layout.points.get(id)).filter(Boolean) as WorldPoint[];
}

/**
 * Find path from current location to target (BFS)
 */
export function findPathTo(layout: WorldLayout, from: string, to: string): string[] | null {
	if (from === to) return [from];

	const visited = new Set<string>();
	const queue: Array<{ id: string; path: string[] }> = [{ id: from, path: [from] }];

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (visited.has(current.id)) continue;
		visited.add(current.id);

		const point = layout.points.get(current.id);
		if (!point) continue;

		for (const neighborId of point.connections) {
			if (neighborId === to) {
				return [...current.path, neighborId];
			}
			if (!visited.has(neighborId)) {
				queue.push({ id: neighborId, path: [...current.path, neighborId] });
			}
		}
	}

	return null; // No path found
}
