/**
 * Procedural Skirmish Map Generator (US-079)
 *
 * Generates terrain grids for single-player skirmish using simplex-style
 * noise with biome blending, symmetric starting positions, evenly seeded
 * resource nodes, natural chokepoints, and pathfinding validation.
 *
 * Inputs:
 *   - size: "small" | "medium" | "large"
 *   - terrainType: "jungle" | "swamp" | "river"
 *   - seed (optional): numeric seed for deterministic output
 *
 * Output: SkirmishMapData with terrain grid, starting positions, resource
 * nodes, and chokepoints.
 */

import { TerrainType } from "./types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SkirmishMapSize = "small" | "medium" | "large";
export type SkirmishTerrainType = "jungle" | "swamp" | "river";

export interface MapPosition {
	tileX: number;
	tileY: number;
}

export interface ResourceNode {
	position: MapPosition;
	resourceType: "fish" | "timber" | "salvage";
}

export interface Chokepoint {
	position: MapPosition;
	type: "bridge" | "pass";
}

export interface SkirmishMapData {
	cols: number;
	rows: number;
	terrain: TerrainType[][];
	playerStart: MapPosition;
	aiStart: MapPosition;
	resourceNodes: ResourceNode[];
	chokepoints: Chokepoint[];
	seed: number;
}

export interface SkirmishMapOptions {
	size: SkirmishMapSize;
	terrainType: SkirmishTerrainType;
	seed?: number;
}

// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------

const SIZE_CONFIG: Record<SkirmishMapSize, { cols: number; rows: number }> = {
	small: { cols: 40, rows: 40 },
	medium: { cols: 64, rows: 64 },
	large: { cols: 96, rows: 96 },
};

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------------------------------------------------------------------------
// Simple value noise (grid-interpolated, good enough for tile-level biomes)
// ---------------------------------------------------------------------------

function createNoiseGrid(cols: number, rows: number, scale: number, rng: () => number): number[][] {
	// Generate random values on a coarse grid, then bilinearly interpolate
	const gCols = Math.ceil(cols / scale) + 2;
	const gRows = Math.ceil(rows / scale) + 2;
	const grid: number[][] = [];
	for (let y = 0; y < gRows; y++) {
		const row: number[] = [];
		for (let x = 0; x < gCols; x++) {
			row.push(rng());
		}
		grid.push(row);
	}

	const result: number[][] = [];
	for (let y = 0; y < rows; y++) {
		const row: number[] = [];
		for (let x = 0; x < cols; x++) {
			const gx = x / scale;
			const gy = y / scale;
			const ix = Math.floor(gx);
			const iy = Math.floor(gy);
			const fx = gx - ix;
			const fy = gy - iy;

			const v00 = grid[iy][ix];
			const v10 = grid[iy][ix + 1];
			const v01 = grid[iy + 1][ix];
			const v11 = grid[iy + 1][ix + 1];

			const top = v00 + (v10 - v00) * fx;
			const bottom = v01 + (v11 - v01) * fx;
			row.push(top + (bottom - top) * fy);
		}
		result.push(row);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Terrain assignment per biome
// ---------------------------------------------------------------------------

interface BiomeThresholds {
	water: number;
	mud: number;
	mangrove: number;
	tallGrass: number;
	dirt: number;
}

const BIOME_THRESHOLDS: Record<SkirmishTerrainType, BiomeThresholds> = {
	jungle: { water: 0.2, mud: 0.28, mangrove: 0.42, tallGrass: 0.55, dirt: 0.7 },
	swamp: { water: 0.3, mud: 0.42, mangrove: 0.5, tallGrass: 0.6, dirt: 0.75 },
	river: { water: 0.25, mud: 0.32, mangrove: 0.38, tallGrass: 0.48, dirt: 0.65 },
};

function terrainFromNoise(value: number, thresholds: BiomeThresholds): TerrainType {
	if (value < thresholds.water) return TerrainType.Water;
	if (value < thresholds.mud) return TerrainType.Mud;
	if (value < thresholds.mangrove) return TerrainType.Mangrove;
	if (value < thresholds.tallGrass) return TerrainType.TallGrass;
	if (value < thresholds.dirt) return TerrainType.Dirt;
	return TerrainType.Grass;
}

// ---------------------------------------------------------------------------
// Flood-fill reachability check
// ---------------------------------------------------------------------------

function isWalkable(t: TerrainType): boolean {
	return t !== TerrainType.Water;
}

function floodFill(
	terrain: TerrainType[][],
	startX: number,
	startY: number,
	rows: number,
	cols: number,
): Set<string> {
	const visited = new Set<string>();
	const stack: [number, number][] = [[startX, startY]];
	const key = (x: number, y: number) => `${x},${y}`;

	while (stack.length > 0) {
		const [x, y] = stack.pop()!;
		const k = key(x, y);
		if (visited.has(k)) continue;
		if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
		if (!isWalkable(terrain[y][x])) continue;

		visited.add(k);
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}
	return visited;
}

// ---------------------------------------------------------------------------
// Bridge / pass placement for chokepoints
// ---------------------------------------------------------------------------

function placeBridges(
	terrain: TerrainType[][],
	rows: number,
	cols: number,
	rng: () => number,
): Chokepoint[] {
	const chokepoints: Chokepoint[] = [];
	const midY = Math.floor(rows / 2);

	// Scan the horizontal midline for water tiles that could become bridges
	const candidates: MapPosition[] = [];
	for (let x = 4; x < cols - 4; x++) {
		if (terrain[midY][x] === TerrainType.Water) {
			// Check if land exists on both sides (within 3 tiles vertically)
			const hasLandAbove = [1, 2, 3].some(
				(dy) => midY - dy >= 0 && isWalkable(terrain[midY - dy][x]),
			);
			const hasLandBelow = [1, 2, 3].some(
				(dy) => midY + dy < rows && isWalkable(terrain[midY + dy][x]),
			);
			if (hasLandAbove && hasLandBelow) {
				candidates.push({ tileX: x, tileY: midY });
			}
		}
	}

	// Also scan vertical midline
	const midX = Math.floor(cols / 2);
	for (let y = 4; y < rows - 4; y++) {
		if (terrain[y][midX] === TerrainType.Water) {
			const hasLandLeft = [1, 2, 3].some(
				(dx) => midX - dx >= 0 && isWalkable(terrain[y][midX - dx]),
			);
			const hasLandRight = [1, 2, 3].some(
				(dx) => midX + dx < cols && isWalkable(terrain[y][midX + dx]),
			);
			if (hasLandLeft && hasLandRight) {
				candidates.push({ tileX: midX, tileY: y });
			}
		}
	}

	// Place up to 3 bridges, spaced apart
	const MIN_BRIDGE_DIST = 6;
	for (const c of candidates) {
		if (chokepoints.length >= 3) break;
		const tooClose = chokepoints.some(
			(cp) =>
				Math.abs(cp.position.tileX - c.tileX) + Math.abs(cp.position.tileY - c.tileY) <
				MIN_BRIDGE_DIST,
		);
		if (tooClose) continue;

		// Place a 3-wide bridge
		for (let dx = -1; dx <= 1; dx++) {
			const bx = c.tileX + dx;
			if (bx >= 0 && bx < cols) {
				terrain[c.tileY][bx] = TerrainType.Bridge;
			}
		}
		chokepoints.push({ position: c, type: "bridge" });
	}

	// If no bridge candidates, create dirt passes through mangrove belts
	if (chokepoints.length === 0) {
		const passX = Math.floor(cols * 0.3 + rng() * cols * 0.4);
		const passY = midY;
		for (let dy = -1; dy <= 1; dy++) {
			const py = passY + dy;
			if (py >= 0 && py < rows) {
				terrain[py][passX] = TerrainType.Dirt;
			}
		}
		chokepoints.push({ position: { tileX: passX, tileY: passY }, type: "pass" });
	}

	return chokepoints;
}

// ---------------------------------------------------------------------------
// Resource node placement
// ---------------------------------------------------------------------------

function placeResourceNodes(
	terrain: TerrainType[][],
	rows: number,
	cols: number,
	playerStart: MapPosition,
	aiStart: MapPosition,
	rng: () => number,
): ResourceNode[] {
	const nodes: ResourceNode[] = [];
	const resourceTypes: Array<"fish" | "timber" | "salvage"> = ["fish", "timber", "salvage"];

	// Place resources symmetrically near each base
	for (const base of [playerStart, aiStart]) {
		for (const resType of resourceTypes) {
			let placed = false;
			for (let attempt = 0; attempt < 50 && !placed; attempt++) {
				const ox = Math.floor(rng() * 10) - 5;
				const oy = Math.floor(rng() * 10) - 5;
				const tx = Math.max(1, Math.min(cols - 2, base.tileX + ox));
				const ty = Math.max(1, Math.min(rows - 2, base.tileY + oy));

				if (isWalkable(terrain[ty][tx])) {
					// Don't place on starting positions
					const onStart =
						(tx === playerStart.tileX && ty === playerStart.tileY) ||
						(tx === aiStart.tileX && ty === aiStart.tileY);
					if (!onStart) {
						nodes.push({ position: { tileX: tx, tileY: ty }, resourceType: resType });
						placed = true;
					}
				}
			}
		}
	}

	// Place a few contested resources near the center
	const cx = Math.floor(cols / 2);
	const cy = Math.floor(rows / 2);
	for (let i = 0; i < 2; i++) {
		const resType = resourceTypes[Math.floor(rng() * resourceTypes.length)];
		for (let attempt = 0; attempt < 50; attempt++) {
			const tx = cx + Math.floor(rng() * 8) - 4;
			const ty = cy + Math.floor(rng() * 8) - 4;
			if (tx >= 0 && tx < cols && ty >= 0 && ty < rows && isWalkable(terrain[ty][tx])) {
				nodes.push({ position: { tileX: tx, tileY: ty }, resourceType: resType });
				break;
			}
		}
	}

	return nodes;
}

// ---------------------------------------------------------------------------
// Clear starting areas
// ---------------------------------------------------------------------------

function clearArea(
	terrain: TerrainType[][],
	cx: number,
	cy: number,
	radius: number,
	rows: number,
	cols: number,
): void {
	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			const x = cx + dx;
			const y = cy + dy;
			if (x >= 0 && x < cols && y >= 0 && y < rows) {
				if (dx * dx + dy * dy <= radius * radius) {
					terrain[y][x] = TerrainType.Grass;
				}
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateSkirmishMap(options: SkirmishMapOptions): SkirmishMapData {
	const { size, terrainType, seed: userSeed } = options;
	const seed = userSeed ?? Math.floor(Math.random() * 2 ** 32);
	const rng = mulberry32(seed);

	const { cols, rows } = SIZE_CONFIG[size];
	const thresholds = BIOME_THRESHOLDS[terrainType];

	// Generate two octaves of noise and blend
	const noise1 = createNoiseGrid(cols, rows, 8, rng);
	const noise2 = createNoiseGrid(cols, rows, 4, rng);

	const terrain: TerrainType[][] = [];
	for (let y = 0; y < rows; y++) {
		const row: TerrainType[] = [];
		for (let x = 0; x < cols; x++) {
			const value = noise1[y][x] * 0.6 + noise2[y][x] * 0.4;
			row.push(terrainFromNoise(value, thresholds));
		}
		terrain.push(row);
	}

	// Starting positions: symmetric, corners
	const margin = Math.max(4, Math.floor(Math.min(cols, rows) * 0.1));
	const playerStart: MapPosition = { tileX: margin, tileY: rows - margin };
	const aiStart: MapPosition = { tileX: cols - margin, tileY: margin };

	// Clear starting areas (radius 4 for building room)
	clearArea(terrain, playerStart.tileX, playerStart.tileY, 4, rows, cols);
	clearArea(terrain, aiStart.tileX, aiStart.tileY, 4, rows, cols);

	// Place chokepoints (bridges / passes)
	const chokepoints = placeBridges(terrain, rows, cols, rng);

	// Place resource nodes
	const resourceNodes = placeResourceNodes(terrain, rows, cols, playerStart, aiStart, rng);

	// Pathfinding validation: ensure player can reach AI start
	const reachable = floodFill(terrain, playerStart.tileX, playerStart.tileY, rows, cols);
	const aiKey = `${aiStart.tileX},${aiStart.tileY}`;

	if (!reachable.has(aiKey)) {
		// Carve a dirt corridor between the two bases
		carveCorridor(terrain, playerStart, aiStart, rows, cols);
	}

	return {
		cols,
		rows,
		terrain,
		playerStart,
		aiStart,
		resourceNodes,
		chokepoints,
		seed,
	};
}

// ---------------------------------------------------------------------------
// Emergency corridor carving (fallback connectivity)
// ---------------------------------------------------------------------------

function carveCorridor(
	terrain: TerrainType[][],
	from: MapPosition,
	to: MapPosition,
	rows: number,
	cols: number,
): void {
	let x = from.tileX;
	let y = from.tileY;

	while (x !== to.tileX || y !== to.tileY) {
		if (x < to.tileX) x++;
		else if (x > to.tileX) x--;
		if (y < to.tileY) y++;
		else if (y > to.tileY) y--;

		if (x >= 0 && x < cols && y >= 0 && y < rows) {
			if (!isWalkable(terrain[y][x])) {
				terrain[y][x] = TerrainType.Dirt;
			}
		}
	}
}
