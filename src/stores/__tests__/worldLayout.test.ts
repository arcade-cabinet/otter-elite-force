/**
 * World Layout Generator Tests
 *
 * Tests the intelligent procedural world generation algorithm
 */

import {
	DEFAULT_WORLD_CONFIG,
	findPathTo,
	generateWorldLayout,
	getConnectedPoints,
	getKeyCoordinateForChunk,
	getTerrainForChunk,
} from "../worldLayout";

describe("WorldLayout Generator", () => {
	describe("generateWorldLayout", () => {
		it("should generate a layout with the LZ at origin", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const lz = layout.points.get("0,0");

			expect(lz).toBeDefined();
			expect(lz?.type).toBe("LZ");
			expect(lz?.x).toBe(0);
			expect(lz?.z).toBe(0);
			expect(lz?.difficulty).toBe(0);
		});

		it("should generate consistent layouts with the same seed", () => {
			const config = { ...DEFAULT_WORLD_CONFIG, seed: 42 };
			const layout1 = generateWorldLayout(config);
			const layout2 = generateWorldLayout(config);

			expect(layout1.points.size).toBe(layout2.points.size);

			for (const [id, point1] of layout1.points) {
				const point2 = layout2.points.get(id);
				expect(point2).toBeDefined();
				expect(point1.x).toBe(point2?.x);
				expect(point1.z).toBe(point2?.z);
				expect(point1.type).toBe(point2?.type);
			}
		});

		it("should generate different layouts with different seeds", () => {
			const layout1 = generateWorldLayout({ ...DEFAULT_WORLD_CONFIG, seed: 111 });
			const layout2 = generateWorldLayout({ ...DEFAULT_WORLD_CONFIG, seed: 222 });

			// Check that at least some points differ (beyond the LZ)
			let differences = 0;
			for (const [id, point1] of layout1.points) {
				if (id === "0,0") continue;
				const point2 = layout2.points.get(id);
				if (!point2 || point1.type !== point2.type) {
					differences++;
				}
			}

			expect(differences).toBeGreaterThan(0);
		});

		it("should place all rescue characters", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);

			for (const character of DEFAULT_WORLD_CONFIG.rescueCharacters) {
				expect(layout.rescueLocations.has(character)).toBe(true);
			}
		});

		it("should create connected paths between all points", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);

			// Every point should have at least one connection
			for (const point of layout.points.values()) {
				if (layout.points.size > 1) {
					expect(point.connections.length).toBeGreaterThan(0);
				}
			}
		});

		it("should have increasing difficulty further from origin", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);

			const nearPoints: number[] = [];
			const farPoints: number[] = [];

			for (const point of layout.points.values()) {
				const dist = Math.sqrt(point.x * point.x + point.z * point.z);
				if (dist < 10) {
					nearPoints.push(point.difficulty);
				} else if (dist > 30) {
					farPoints.push(point.difficulty);
				}
			}

			if (nearPoints.length > 0 && farPoints.length > 0) {
				const avgNear = nearPoints.reduce((a, b) => a + b, 0) / nearPoints.length;
				const avgFar = farPoints.reduce((a, b) => a + b, 0) / farPoints.length;
				expect(avgFar).toBeGreaterThan(avgNear);
			}
		});
	});

	describe("getKeyCoordinateForChunk", () => {
		it("should return the POI at a key coordinate", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const lz = getKeyCoordinateForChunk(layout, 0, 0);

			expect(lz).toBeDefined();
			expect(lz?.type).toBe("LZ");
		});

		it("should return null for non-POI chunks", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			// A chunk far from any POI should return null
			const result = getKeyCoordinateForChunk(layout, 999, 999);

			expect(result).toBeNull();
		});
	});

	describe("getTerrainForChunk", () => {
		it("should return a valid terrain type", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const terrain = getTerrainForChunk(layout, 5, 5);

			expect(["RIVER", "MARSH", "DENSE_JUNGLE"]).toContain(terrain);
		});

		it("should return consistent terrain for the same chunk", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const terrain1 = getTerrainForChunk(layout, 10, 10);
			const terrain2 = getTerrainForChunk(layout, 10, 10);

			expect(terrain1).toBe(terrain2);
		});
	});

	describe("getConnectedPoints", () => {
		it("should return connected POIs from LZ", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const connected = getConnectedPoints(layout, "0,0");

			expect(connected.length).toBeGreaterThan(0);
		});

		it("should return empty array for non-existent chunk", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const connected = getConnectedPoints(layout, "999,999");

			expect(connected).toEqual([]);
		});
	});

	describe("findPathTo", () => {
		it("should find a path from LZ to any POI", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);

			// Get any non-LZ point
			let targetId: string | null = null;
			for (const id of layout.points.keys()) {
				if (id !== "0,0") {
					targetId = id;
					break;
				}
			}

			if (targetId) {
				const path = findPathTo(layout, "0,0", targetId);
				expect(path).not.toBeNull();
				expect(path?.length).toBeGreaterThan(0);
				expect(path?.[0]).toBe("0,0");
				expect(path?.[path.length - 1]).toBe(targetId);
			}
		});

		it("should return single-element path when from equals to", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);
			const path = findPathTo(layout, "0,0", "0,0");

			expect(path).toEqual(["0,0"]);
		});
	});

	describe("Terrain Distribution", () => {
		it("should have variety in terrain types", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);

			const terrainCounts = { RIVER: 0, MARSH: 0, DENSE_JUNGLE: 0 };

			// Sample a grid of chunks
			for (let x = -20; x <= 20; x += 5) {
				for (let z = -20; z <= 20; z += 5) {
					const terrain = getTerrainForChunk(layout, x, z);
					if (terrain in terrainCounts) {
						terrainCounts[terrain as keyof typeof terrainCounts]++;
					}
				}
			}

			// Should have at least some of each terrain type
			expect(terrainCounts.RIVER).toBeGreaterThan(0);
			expect(terrainCounts.MARSH).toBeGreaterThan(0);
			expect(terrainCounts.DENSE_JUNGLE).toBeGreaterThan(0);
		});
	});

	describe("POI Type Distribution", () => {
		it("should have various POI types distributed across the map", () => {
			const layout = generateWorldLayout(DEFAULT_WORLD_CONFIG);

			const typeCounts: Record<string, number> = {};

			for (const point of layout.points.values()) {
				typeCounts[point.type] = (typeCounts[point.type] || 0) + 1;
			}

			// Should have LZ
			expect(typeCounts.LZ).toBe(1);

			// Should have multiple types
			expect(Object.keys(typeCounts).length).toBeGreaterThan(3);
		});
	});
});
