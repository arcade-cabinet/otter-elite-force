/**
 * Procedural Skirmish Map Generator — unit tests (US-079)
 *
 * Validates terrain generation, starting positions, resource placement,
 * chokepoints, and pathfinding reachability.
 */

import { describe, expect, it } from "vitest";
import { generateSkirmishMap } from "../../maps/skirmishMapGenerator";
import { TerrainType } from "../../maps/types";

// ---------------------------------------------------------------------------
// Helpers
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
	while (stack.length > 0) {
		const [x, y] = stack.pop()!;
		const k = `${x},${y}`;
		if (visited.has(k)) continue;
		if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
		if (!isWalkable(terrain[y][x])) continue;
		visited.add(k);
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}
	return visited;
}

// ---------------------------------------------------------------------------
// Size configurations
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Size", () => {
	it("generates small maps (40x40)", () => {
		const map = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 42 });
		expect(map.cols).toBe(40);
		expect(map.rows).toBe(40);
		expect(map.terrain.length).toBe(40);
		expect(map.terrain[0].length).toBe(40);
	});

	it("generates medium maps (64x64)", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "swamp", seed: 42 });
		expect(map.cols).toBe(64);
		expect(map.rows).toBe(64);
	});

	it("generates large maps (96x96)", () => {
		const map = generateSkirmishMap({ size: "large", terrainType: "river", seed: 42 });
		expect(map.cols).toBe(96);
		expect(map.rows).toBe(96);
	});
});

// ---------------------------------------------------------------------------
// Terrain generation
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Terrain", () => {
	it("produces only valid terrain types", () => {
		const map = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 123 });
		const validTypes = new Set([
			TerrainType.Grass,
			TerrainType.Dirt,
			TerrainType.Mud,
			TerrainType.Water,
			TerrainType.Mangrove,
			TerrainType.Bridge,
			TerrainType.ToxicSludge,
			TerrainType.TallGrass,
		]);
		for (let y = 0; y < map.rows; y++) {
			for (let x = 0; x < map.cols; x++) {
				expect(validTypes.has(map.terrain[y][x])).toBe(true);
			}
		}
	});

	it("generates different terrain distribution per biome type", () => {
		const jungle = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 99 });
		const swamp = generateSkirmishMap({ size: "small", terrainType: "swamp", seed: 99 });

		// Count water tiles — swamp should have more
		let jungleWater = 0;
		let swampWater = 0;
		for (let y = 0; y < jungle.rows; y++) {
			for (let x = 0; x < jungle.cols; x++) {
				if (jungle.terrain[y][x] === TerrainType.Water) jungleWater++;
				if (swamp.terrain[y][x] === TerrainType.Water) swampWater++;
			}
		}
		expect(swampWater).toBeGreaterThanOrEqual(jungleWater);
	});

	it("produces deterministic output with same seed", () => {
		const a = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 777 });
		const b = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 777 });
		expect(a.terrain).toEqual(b.terrain);
		expect(a.playerStart).toEqual(b.playerStart);
		expect(a.aiStart).toEqual(b.aiStart);
	});

	it("produces different output with different seeds", () => {
		const a = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 1 });
		const b = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 2 });
		// At least some tiles should differ
		let diffs = 0;
		for (let y = 0; y < a.rows; y++) {
			for (let x = 0; x < a.cols; x++) {
				if (a.terrain[y][x] !== b.terrain[y][x]) diffs++;
			}
		}
		expect(diffs).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// Starting positions
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Starting Positions", () => {
	it("places player and AI starts on walkable terrain", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "river", seed: 42 });
		const playerTerrain = map.terrain[map.playerStart.tileY][map.playerStart.tileX];
		const aiTerrain = map.terrain[map.aiStart.tileY][map.aiStart.tileX];
		expect(isWalkable(playerTerrain)).toBe(true);
		expect(isWalkable(aiTerrain)).toBe(true);
	});

	it("places starts in opposite corners (symmetric)", () => {
		const map = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 42 });
		// Player should be in bottom-left area, AI in top-right area
		expect(map.playerStart.tileX).toBeLessThan(map.cols / 2);
		expect(map.playerStart.tileY).toBeGreaterThan(map.rows / 2);
		expect(map.aiStart.tileX).toBeGreaterThan(map.cols / 2);
		expect(map.aiStart.tileY).toBeLessThan(map.rows / 2);
	});

	it("clears area around starting positions", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "swamp", seed: 42 });
		// Immediate neighbors of player start should be walkable
		const px = map.playerStart.tileX;
		const py = map.playerStart.tileY;
		for (let dy = -2; dy <= 2; dy++) {
			for (let dx = -2; dx <= 2; dx++) {
				const x = px + dx;
				const y = py + dy;
				if (x >= 0 && x < map.cols && y >= 0 && y < map.rows) {
					expect(isWalkable(map.terrain[y][x])).toBe(true);
				}
			}
		}
	});
});

// ---------------------------------------------------------------------------
// Resource nodes
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Resource Nodes", () => {
	it("places at least 6 resource nodes (3 per base)", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "jungle", seed: 42 });
		expect(map.resourceNodes.length).toBeGreaterThanOrEqual(6);
	});

	it("includes all three resource types", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "jungle", seed: 42 });
		const types = new Set(map.resourceNodes.map((n) => n.resourceType));
		expect(types.has("fish")).toBe(true);
		expect(types.has("timber")).toBe(true);
		expect(types.has("salvage")).toBe(true);
	});

	it("places resource nodes on walkable terrain", () => {
		const map = generateSkirmishMap({ size: "small", terrainType: "river", seed: 42 });
		for (const node of map.resourceNodes) {
			const t = map.terrain[node.position.tileY][node.position.tileX];
			expect(isWalkable(t)).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// Chokepoints
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Chokepoints", () => {
	it("places at least one chokepoint", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "river", seed: 42 });
		expect(map.chokepoints.length).toBeGreaterThanOrEqual(1);
	});

	it("chokepoint types are bridge or pass", () => {
		const map = generateSkirmishMap({ size: "medium", terrainType: "river", seed: 42 });
		for (const cp of map.chokepoints) {
			expect(["bridge", "pass"]).toContain(cp.type);
		}
	});
});

// ---------------------------------------------------------------------------
// Pathfinding validation (critical requirement)
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Pathfinding Validation", () => {
	it("player start can reach AI start (no unreachable areas)", () => {
		// Test multiple seeds to ensure robustness
		for (const seed of [1, 42, 100, 999, 12345]) {
			const map = generateSkirmishMap({ size: "small", terrainType: "jungle", seed });
			const reachable = floodFill(
				map.terrain,
				map.playerStart.tileX,
				map.playerStart.tileY,
				map.rows,
				map.cols,
			);
			const aiKey = `${map.aiStart.tileX},${map.aiStart.tileY}`;
			expect(reachable.has(aiKey)).toBe(true);
		}
	});

	it("validates connectivity for swamp terrain type", () => {
		for (const seed of [7, 77, 777]) {
			const map = generateSkirmishMap({ size: "medium", terrainType: "swamp", seed });
			const reachable = floodFill(
				map.terrain,
				map.playerStart.tileX,
				map.playerStart.tileY,
				map.rows,
				map.cols,
			);
			const aiKey = `${map.aiStart.tileX},${map.aiStart.tileY}`;
			expect(reachable.has(aiKey)).toBe(true);
		}
	});

	it("validates connectivity for river terrain type", () => {
		for (const seed of [3, 33, 333]) {
			const map = generateSkirmishMap({ size: "large", terrainType: "river", seed });
			const reachable = floodFill(
				map.terrain,
				map.playerStart.tileX,
				map.playerStart.tileY,
				map.rows,
				map.cols,
			);
			const aiKey = `${map.aiStart.tileX},${map.aiStart.tileY}`;
			expect(reachable.has(aiKey)).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// Seed handling
// ---------------------------------------------------------------------------

describe("SkirmishMapGenerator — Seed", () => {
	it("stores the seed in the output", () => {
		const map = generateSkirmishMap({ size: "small", terrainType: "jungle", seed: 42 });
		expect(map.seed).toBe(42);
	});

	it("generates a random seed when none is provided", () => {
		const map = generateSkirmishMap({ size: "small", terrainType: "jungle" });
		expect(typeof map.seed).toBe("number");
		expect(map.seed).toBeGreaterThanOrEqual(0);
	});
});
