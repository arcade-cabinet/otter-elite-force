/**
 * Tests for Yuka tile-grid pathfinding, graph builder, and steering factory.
 *
 * Uses real Yuka classes (unmocked) to verify actual A* behavior.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Unmock yuka so we use the real implementation
vi.unmock("yuka");

import { Vector3 } from "yuka";
import type { TerrainType } from "@/ai/terrainTypes";
import {
	buildGraphFromTilemap,
	tileToIndex,
	indexToTile,
	rebuildTileEdges,
} from "@/ai/graphBuilder";
import { findPath, PathfindingQueue } from "@/ai/pathfinder";
import { createSteeringVehicle, setVehiclePath, isPathComplete } from "@/ai/steeringFactory";

/** Helper: create a grid of a single terrain type */
function makeGrid(width: number, height: number, fill: TerrainType = "grass"): TerrainType[][] {
	return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

describe("graphBuilder", () => {
	describe("tileToIndex / indexToTile", () => {
		it("should convert coordinates to index and back", () => {
			const width = 10;
			expect(tileToIndex(0, 0, width)).toBe(0);
			expect(tileToIndex(9, 0, width)).toBe(9);
			expect(tileToIndex(0, 1, width)).toBe(10);
			expect(tileToIndex(5, 3, width)).toBe(35);

			expect(indexToTile(0, width)).toEqual({ x: 0, y: 0 });
			expect(indexToTile(35, width)).toEqual({ x: 5, y: 3 });
		});
	});

	describe("buildGraphFromTilemap", () => {
		it("should create nodes for all tiles in a 10x10 grid", () => {
			const tiles = makeGrid(10, 10);
			const graph = buildGraphFromTilemap(tiles);
			expect(graph.getNodeCount()).toBe(100);
		});

		it("should create edges for walkable adjacent tiles", () => {
			const tiles = makeGrid(3, 3);
			const graph = buildGraphFromTilemap(tiles);

			// Corner tile (0,0) should have 2 edges (right, down)
			const cornerEdges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(0, 0, 3), cornerEdges);
			expect(cornerEdges.length).toBe(2);

			// Center tile (1,1) should have 4 edges
			const centerEdges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(1, 1, 3), centerEdges);
			expect(centerEdges.length).toBe(4);
		});

		it("should not create edges to water tiles", () => {
			const tiles = makeGrid(3, 1);
			tiles[0][1] = "water"; // middle tile is water
			const graph = buildGraphFromTilemap(tiles);

			// Tile (0,0) should have no edges (water blocks path to (1,0), nothing to the left)
			const edges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(0, 0, 3), edges);
			expect(edges.length).toBe(0);
		});

		it("should allow water traversal when canSwim is true", () => {
			const tiles = makeGrid(3, 1);
			tiles[0][1] = "water";
			const graph = buildGraphFromTilemap(tiles, { canSwim: true });

			const edges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(0, 0, 3), edges);
			expect(edges.length).toBe(1); // can reach water tile
		});

		it("should use correct cost for mud terrain", () => {
			const tiles: TerrainType[][] = [["grass", "mud"]];
			const graph = buildGraphFromTilemap(tiles);

			const edge = graph.getEdge(tileToIndex(0, 0, 2), tileToIndex(1, 0, 2));
			expect(edge).not.toBeNull();
			// cost = (1 + 2) / 2 = 1.5
			expect(edge!.cost).toBe(1.5);
		});

		it("should support 8-way movement", () => {
			const tiles = makeGrid(3, 3);
			const graph = buildGraphFromTilemap(tiles, { eightWay: true });

			// Center tile (1,1) should have 8 edges
			const centerEdges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(1, 1, 3), centerEdges);
			expect(centerEdges.length).toBe(8);

			// Corner tile (0,0) should have 3 edges (right, down, diagonal)
			const cornerEdges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(0, 0, 3), cornerEdges);
			expect(cornerEdges.length).toBe(3);
		});
	});

	describe("rebuildTileEdges", () => {
		it("should remove edges when a tile becomes water", () => {
			const tiles = makeGrid(3, 3);
			const graph = buildGraphFromTilemap(tiles);

			// Center tile has 4 edges
			let centerEdges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(1, 1, 3), centerEdges);
			expect(centerEdges.length).toBe(4);

			// Place a building (water = impassable)
			tiles[1][1] = "water";
			rebuildTileEdges(graph, tiles, 1, 1);

			// Now center tile should have no edges
			centerEdges = [];
			graph.getEdgesOfNode(tileToIndex(1, 1, 3), centerEdges);
			expect(centerEdges.length).toBe(0);
		});

		it("should restore edges when a tile becomes walkable again", () => {
			const tiles = makeGrid(3, 3);
			tiles[1][1] = "water";
			const graph = buildGraphFromTilemap(tiles);

			// Center tile starts with no edges
			let centerEdges: unknown[] = [];
			graph.getEdgesOfNode(tileToIndex(1, 1, 3), centerEdges);
			expect(centerEdges.length).toBe(0);

			// Remove building (back to grass)
			tiles[1][1] = "grass";
			rebuildTileEdges(graph, tiles, 1, 1);

			centerEdges = [];
			graph.getEdgesOfNode(tileToIndex(1, 1, 3), centerEdges);
			expect(centerEdges.length).toBe(4);
		});
	});
});

describe("pathfinder", () => {
	describe("findPath", () => {
		it("should find a direct path on an open 10x10 grid", () => {
			const tiles = makeGrid(10, 10);
			const graph = buildGraphFromTilemap(tiles);
			const path = findPath(graph, { x: 0, y: 0 }, { x: 9, y: 9 }, 10);

			expect(path.length).toBeGreaterThan(0);
			// First waypoint = start
			expect(path[0].x).toBe(0);
			expect(path[0].z).toBe(0);
			// Last waypoint = destination
			expect(path[path.length - 1].x).toBe(9);
			expect(path[path.length - 1].z).toBe(9);
		});

		it("should find path around a water obstacle", () => {
			const tiles = makeGrid(10, 10);
			// Place a wall of water across row 5, columns 0-8 (leave column 9 open)
			for (let x = 0; x < 9; x++) {
				tiles[5][x] = "water";
			}
			const graph = buildGraphFromTilemap(tiles);
			const path = findPath(graph, { x: 0, y: 0 }, { x: 0, y: 9 }, 10);

			expect(path.length).toBeGreaterThan(0);
			expect(path[path.length - 1].x).toBe(0);
			expect(path[path.length - 1].z).toBe(9);

			// Path should not cross any water tile
			for (const wp of path) {
				const tileX = Math.round(wp.x);
				const tileY = Math.round(wp.z);
				expect(tiles[tileY][tileX]).not.toBe("water");
			}
		});

		it("should return empty path when no route exists", () => {
			const tiles = makeGrid(10, 10);
			// Complete wall of water across row 5
			for (let x = 0; x < 10; x++) {
				tiles[5][x] = "water";
			}
			const graph = buildGraphFromTilemap(tiles);
			const path = findPath(graph, { x: 0, y: 0 }, { x: 0, y: 9 }, 10);

			expect(path.length).toBe(0);
		});

		it("should return empty path for invalid coordinates", () => {
			const tiles = makeGrid(5, 5);
			const graph = buildGraphFromTilemap(tiles);
			const path = findPath(graph, { x: 0, y: 0 }, { x: 99, y: 99 }, 5);

			expect(path.length).toBe(0);
		});

		it("should prefer grass over mud terrain", () => {
			// Create a 5-wide corridor: row 0-2 are grass, but direct path goes through mud
			const tiles = makeGrid(5, 3);
			// Middle row is mud
			for (let x = 0; x < 5; x++) {
				tiles[1][x] = "mud";
			}
			const graph = buildGraphFromTilemap(tiles);

			// Path from (0,0) to (4,2) — going through row 1 (mud) costs more
			const path = findPath(graph, { x: 0, y: 0 }, { x: 4, y: 2 }, 5);
			expect(path.length).toBeGreaterThan(0);
			expect(path[path.length - 1].x).toBe(4);
			expect(path[path.length - 1].z).toBe(2);
		});

		it("should use all waypoints as Vector3 with y=0", () => {
			const tiles = makeGrid(5, 5);
			const graph = buildGraphFromTilemap(tiles);
			const path = findPath(graph, { x: 0, y: 0 }, { x: 4, y: 4 }, 5);

			for (const wp of path) {
				expect(wp).toBeInstanceOf(Vector3);
				expect(wp.y).toBe(0);
			}
		});
	});

	describe("PathfindingQueue", () => {
		let tiles: TerrainType[][];
		let queue: PathfindingQueue;

		beforeEach(() => {
			tiles = makeGrid(10, 10);
			const graph = buildGraphFromTilemap(tiles);
			queue = new PathfindingQueue(graph, 10);
		});

		it("should process up to 4 requests per tick", async () => {
			const promises = [];
			for (let i = 0; i < 6; i++) {
				promises.push(queue.requestPath({ x: 0, y: 0 }, { x: i, y: i }));
			}
			expect(queue.pendingCount).toBe(6);

			queue.processTick();
			expect(queue.pendingCount).toBe(2);

			queue.processTick();
			expect(queue.pendingCount).toBe(0);

			const results = await Promise.all(promises);
			for (const path of results) {
				expect(path.length).toBeGreaterThan(0);
			}
		});

		it("should cache paths for same source/destination within a tick", async () => {
			const p1 = queue.requestPath({ x: 0, y: 0 }, { x: 5, y: 5 });
			const p2 = queue.requestPath({ x: 0, y: 0 }, { x: 5, y: 5 });

			queue.processTick();

			const [path1, path2] = await Promise.all([p1, p2]);
			// Same reference from cache
			expect(path1).toBe(path2);
		});

		it("should clear pending requests with empty paths", async () => {
			const p = queue.requestPath({ x: 0, y: 0 }, { x: 5, y: 5 });
			queue.clear();

			const result = await p;
			expect(result).toEqual([]);
			expect(queue.pendingCount).toBe(0);
		});
	});
});

describe("steeringFactory", () => {
	it("should create a vehicle with all three steering behaviors", () => {
		const { vehicle, followPath, separation, obstacleAvoidance } = createSteeringVehicle();

		expect(vehicle).toBeDefined();
		expect(vehicle.maxSpeed).toBe(2);
		expect(followPath).toBeDefined();
		expect(separation).toBeDefined();
		expect(obstacleAvoidance).toBeDefined();
	});

	it("should respect custom config values", () => {
		const { vehicle, followPath, separation } = createSteeringVehicle({
			maxSpeed: 5,
			maxForce: 20,
			mass: 2,
			followPathWeight: 2,
			separationWeight: 1,
		});

		expect(vehicle.maxSpeed).toBe(5);
		expect(vehicle.maxForce).toBe(20);
		expect(vehicle.mass).toBe(2);
		expect(followPath.weight).toBe(2);
		expect(separation.weight).toBe(1);
	});

	it("should set waypoints on a vehicle path", () => {
		const sv = createSteeringVehicle();
		const waypoints = [new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(2, 0, 0)];

		setVehiclePath(sv, waypoints);

		const current = sv.followPath.path.current();
		expect(current.x).toBe(0);
		expect(current.z).toBe(0);
	});

	it("should report path completion", () => {
		const sv = createSteeringVehicle();
		const waypoints = [new Vector3(0, 0, 0)];
		setVehiclePath(sv, waypoints);

		// Single waypoint path is immediately at the last waypoint
		expect(isPathComplete(sv)).toBe(true);
	});

	it("should integrate path following with pathfinder results", () => {
		const tiles = makeGrid(10, 10);
		const graph = buildGraphFromTilemap(tiles);
		const path = findPath(graph, { x: 0, y: 0 }, { x: 5, y: 5 }, 10);

		const sv = createSteeringVehicle();
		setVehiclePath(sv, path);

		expect(path.length).toBeGreaterThan(1);
		expect(isPathComplete(sv)).toBe(false);

		const current = sv.followPath.path.current();
		expect(current.x).toBe(0);
		expect(current.z).toBe(0);
	});
});
