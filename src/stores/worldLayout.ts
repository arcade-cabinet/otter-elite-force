/**
 * World Layout Generator
 *
 * Intelligently generates the open world layout with:
 * - Poisson disc sampling for even POI distribution
 * - Difficulty-based radial placement
 * - Terrain coherence and biome clustering
 * - Graph-based connectivity for logical paths
 */

import type { TerrainType } from "./types";

// =============================================================================
// TYPES
// =============================================================================

export interface WorldPoint {
	x: number;
	z: number;
	type: PointOfInterestType;
	difficulty: number; // 0-1, affects enemy density and tier
	terrainType: TerrainType;
	connections: string[]; // IDs of connected points
	rescueCharacter?: string;
	isBossArea?: boolean;
	specialObjective?: string;
}

export type PointOfInterestType =
	| "LZ" // Landing zone / player spawn
	| "VILLAGE" // Friendly village with civilians
	| "HEALER_HUB" // Healer location
	| "PRISON_CAMP" // Rescue location
	| "ENEMY_OUTPOST" // Scale-Guard outpost
	| "SIPHON_CLUSTER" // Oil extraction points
	| "GAS_DEPOT" // Gas stockpile cluster
	| "BOSS_ARENA" // Major objective / boss
	| "WAYPOINT" // Path connection point
	| "RAFT_DOCK"; // River crossing point

export interface WorldLayout {
	seed: number;
	points: Map<string, WorldPoint>;
	rescueLocations: Map<string, WorldPoint>;
	paths: Array<{ from: string; to: string; terrainType: TerrainType }>;
	terrainZones: Map<string, TerrainType>; // chunk ID -> terrain type
}

export interface WorldLayoutConfig {
	seed: number;
	worldRadius: number; // How far the world extends from origin
	minPOIDistance: number; // Minimum distance between POIs
	villageCount: number;
	outpostCount: number;
	siphonClusterCount: number;
	rescueCharacters: string[]; // Characters to place in rescue locations
}

// =============================================================================
// SEEDED RANDOM
// =============================================================================

class SeededRandom {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	next(): number {
		this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
		return this.seed / 0x7fffffff;
	}

	range(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	int(min: number, max: number): number {
		return Math.floor(this.range(min, max + 1));
	}

	pick<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)];
	}

	shuffle<T>(array: T[]): T[] {
		const result = [...array];
		for (let i = result.length - 1; i > 0; i--) {
			const j = this.int(0, i);
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}
}

// =============================================================================
// POISSON DISC SAMPLING
// =============================================================================

/**
 * Generates evenly distributed points using Poisson Disc Sampling
 */
function poissonDiscSample(
	random: SeededRandom,
	width: number,
	height: number,
	minDistance: number,
	maxAttempts: number = 30,
): Array<{ x: number; z: number }> {
	const cellSize = minDistance / Math.sqrt(2);
	const gridWidth = Math.ceil(width / cellSize);
	const gridHeight = Math.ceil(height / cellSize);
	const grid: Array<{ x: number; z: number } | null> = new Array(gridWidth * gridHeight).fill(null);

	const points: Array<{ x: number; z: number }> = [];
	const active: Array<{ x: number; z: number }> = [];

	// Start with center point (offset so 0,0 is center)
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	const startX = 0;
	const startZ = 0;

	const startPoint = { x: startX, z: startZ };
	points.push(startPoint);
	active.push(startPoint);

	const gridX = Math.floor((startX + halfWidth) / cellSize);
	const gridZ = Math.floor((startZ + halfHeight) / cellSize);
	if (gridX >= 0 && gridX < gridWidth && gridZ >= 0 && gridZ < gridHeight) {
		grid[gridZ * gridWidth + gridX] = startPoint;
	}

	while (active.length > 0) {
		const idx = random.int(0, active.length - 1);
		const point = active[idx];
		let found = false;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const angle = random.next() * Math.PI * 2;
			const distance = minDistance + random.next() * minDistance;
			const newX = point.x + Math.cos(angle) * distance;
			const newZ = point.z + Math.sin(angle) * distance;

			// Check bounds
			if (newX < -halfWidth || newX >= halfWidth || newZ < -halfHeight || newZ >= halfHeight) {
				continue;
			}

			const newGridX = Math.floor((newX + halfWidth) / cellSize);
			const newGridZ = Math.floor((newZ + halfHeight) / cellSize);

			// Check nearby cells for conflicts
			let valid = true;
			for (let dz = -2; dz <= 2 && valid; dz++) {
				for (let dx = -2; dx <= 2 && valid; dx++) {
					const checkX = newGridX + dx;
					const checkZ = newGridZ + dz;
					if (checkX >= 0 && checkX < gridWidth && checkZ >= 0 && checkZ < gridHeight) {
						const neighbor = grid[checkZ * gridWidth + checkX];
						if (neighbor) {
							const dist = Math.sqrt((newX - neighbor.x) ** 2 + (newZ - neighbor.z) ** 2);
							if (dist < minDistance) {
								valid = false;
							}
						}
					}
				}
			}

			if (valid) {
				const newPoint = { x: newX, z: newZ };
				points.push(newPoint);
				active.push(newPoint);
				grid[newGridZ * gridWidth + newGridX] = newPoint;
				found = true;
				break;
			}
		}

		if (!found) {
			active.splice(idx, 1);
		}
	}

	return points;
}

// =============================================================================
// TERRAIN ZONE GENERATION
// =============================================================================

/**
 * Determines terrain type based on position and world features
 * Uses coherent noise-like patterns for natural-looking biomes
 */
function determineTerrainType(
	x: number,
	z: number,
	seed: number,
	riverPaths: Array<{ x: number; z: number }[]>,
): TerrainType {
	// Check if near a river path
	for (const path of riverPaths) {
		for (const point of path) {
			const dist = Math.sqrt((x - point.x) ** 2 + (z - point.z) ** 2);
			if (dist < 2) {
				return "RIVER";
			}
		}
	}

	// Use coherent pseudo-noise for biome assignment
	const noiseX = Math.sin(x * 0.1 + seed) * Math.cos(z * 0.15 + seed * 0.7);
	const noiseZ = Math.cos(x * 0.12 + seed * 0.5) * Math.sin(z * 0.08 + seed * 1.2);
	const combinedNoise = (noiseX + noiseZ) / 2;

	// Distance from origin affects terrain (jungles further out)
	const distFromOrigin = Math.sqrt(x * x + z * z);
	const distanceFactor = Math.min(1, distFromOrigin / 50);

	// Combine factors
	const terrainValue = combinedNoise + distanceFactor * 0.3;

	if (terrainValue < -0.2) {
		return "RIVER";
	}
	if (terrainValue < 0.3) {
		return "MARSH";
	}
	return "DENSE_JUNGLE";
}

// =============================================================================
// PATH GENERATION (Minimum Spanning Tree)
// =============================================================================

/**
 * Creates a connected graph of paths between points using Prim's MST algorithm
 * This ensures all areas are reachable
 */
function generatePaths(
	points: Map<string, WorldPoint>,
	random: SeededRandom,
): Array<{ from: string; to: string }> {
	const pointIds = Array.from(points.keys());
	if (pointIds.length < 2) return [];

	const edges: Array<{ from: string; to: string; weight: number }> = [];

	// Calculate all possible edges with weights (distance + randomness for variety)
	for (let i = 0; i < pointIds.length; i++) {
		for (let j = i + 1; j < pointIds.length; j++) {
			const p1 = points.get(pointIds[i])!;
			const p2 = points.get(pointIds[j])!;
			const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.z - p2.z) ** 2);
			// Add some randomness to avoid always picking the absolute shortest
			const weight = distance * (0.8 + random.next() * 0.4);
			edges.push({ from: pointIds[i], to: pointIds[j], weight });
		}
	}

	// Sort edges by weight
	edges.sort((a, b) => a.weight - b.weight);

	// Prim's algorithm for MST
	const mstEdges: Array<{ from: string; to: string }> = [];
	const inMST = new Set<string>();
	inMST.add(pointIds[0]); // Start from LZ

	while (inMST.size < pointIds.length) {
		// Find cheapest edge connecting MST to non-MST vertex
		for (const edge of edges) {
			const fromIn = inMST.has(edge.from);
			const toIn = inMST.has(edge.to);

			if (fromIn !== toIn) {
				// One end in MST, one end outside
				mstEdges.push({ from: edge.from, to: edge.to });
				inMST.add(edge.from);
				inMST.add(edge.to);
				break;
			}
		}
	}

	// Add a few extra edges for alternative routes (not strictly tree)
	const extraEdgeCount = Math.floor(pointIds.length * 0.2);
	const shuffledEdges = random.shuffle(edges);
	let added = 0;

	for (const edge of shuffledEdges) {
		if (added >= extraEdgeCount) break;

		// Check if this edge already exists
		const exists = mstEdges.some(
			(e) =>
				(e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from),
		);

		if (!exists && edge.weight < 30) {
			// Only add shorter alternate routes
			mstEdges.push({ from: edge.from, to: edge.to });
			added++;
		}
	}

	return mstEdges;
}

// =============================================================================
// RIVER PATH GENERATION
// =============================================================================

/**
 * Generates river paths that flow through the world
 * Rivers start from edges and flow toward center or across
 */
function generateRiverPaths(
	random: SeededRandom,
	worldRadius: number,
	riverCount: number = 3,
): Array<Array<{ x: number; z: number }>> {
	const rivers: Array<Array<{ x: number; z: number }>> = [];

	for (let i = 0; i < riverCount; i++) {
		const river: Array<{ x: number; z: number }> = [];

		// Start from edge
		const startAngle = random.range(0, Math.PI * 2);
		const x = Math.cos(startAngle) * worldRadius * 0.9;
		const z = Math.sin(startAngle) * worldRadius * 0.9;

		// Flow direction (generally toward center with meandering)
		const endAngle = startAngle + Math.PI + random.range(-0.5, 0.5);
		const endX = Math.cos(endAngle) * worldRadius * 0.7;
		const endZ = Math.sin(endAngle) * worldRadius * 0.7;

		const steps = 20 + random.int(0, 10);
		for (let step = 0; step <= steps; step++) {
			const t = step / steps;

			// Interpolate with meandering
			const baseX = x + (endX - x) * t;
			const baseZ = z + (endZ - z) * t;

			// Add meandering
			const meander = Math.sin(t * Math.PI * 4) * 5;
			const perpX = -(endZ - z);
			const perpZ = endX - x;
			const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ);

			river.push({
				x: baseX + (perpX / perpLen) * meander,
				z: baseZ + (perpZ / perpLen) * meander,
			});
		}

		rivers.push(river);
	}

	return rivers;
}

// =============================================================================
// DIFFICULTY CALCULATION
// =============================================================================

/**
 * Calculate difficulty based on distance from LZ and other factors
 */
function calculateDifficulty(x: number, z: number, worldRadius: number): number {
	const distFromOrigin = Math.sqrt(x * x + z * z);
	const normalizedDist = Math.min(1, distFromOrigin / worldRadius);

	// Difficulty increases with distance, with some variance
	return Math.min(1, normalizedDist * 1.2);
}

// =============================================================================
// MAIN WORLD LAYOUT GENERATOR
// =============================================================================

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

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export const DEFAULT_WORLD_CONFIG: WorldLayoutConfig = {
	seed: 12345,
	worldRadius: 50, // 50 chunks in each direction
	minPOIDistance: 8, // Minimum 8 chunks between POIs
	villageCount: 6,
	outpostCount: 5,
	siphonClusterCount: 4,
	rescueCharacters: ["whiskers", "splash", "fang", "marina", "muskrat"],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
