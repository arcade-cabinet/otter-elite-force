/**
 * Builds a Yuka navigation Graph from a 2D tilemap.
 *
 * Each walkable tile becomes a NavNode. Edges connect adjacent tiles
 * (4-directional) with costs based on terrain type.
 *
 * Spec reference: §8.3 Pathfinding, §10 Yuka AI Integration
 */

import { Graph, NavEdge, NavNode, Vector3 } from "yuka";
import { getTerrainCost, type TerrainType } from "./terrainTypes";

/** 4-way directional offsets: right, left, down, up */
const NEIGHBORS_4 = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
] as const;

/** 8-way directional offsets (4-way + diagonals) */
const NEIGHBORS_8 = [...NEIGHBORS_4, [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

export interface GraphBuildOptions {
	/** Use 8-directional movement (default: false = 4-way) */
	eightWay?: boolean;
	/** Whether units can swim (water becomes traversable) */
	canSwim?: boolean;
}

/** Convert tile coordinates to a flat node index. */
export function tileToIndex(x: number, y: number, width: number): number {
	return y * width + x;
}

/** Convert a flat node index back to tile coordinates. */
export function indexToTile(index: number, width: number): { x: number; y: number } {
	return { x: index % width, y: Math.floor(index / width) };
}

/**
 * Build a Yuka Graph from a 2D tile grid.
 *
 * tiles[y][x] = TerrainType. Maps tile (x, y) to Yuka Vector3(x, 0, y)
 * per the Y-up convention (spec §10).
 */
export function buildGraphFromTilemap(
	tiles: TerrainType[][],
	options: GraphBuildOptions = {},
): Graph {
	const { eightWay = false, canSwim = false } = options;
	const height = tiles.length;
	if (height === 0) return new Graph();
	const width = tiles[0].length;

	const graph = new Graph();
	graph.digraph = true; // We add both directions explicitly

	// Add nodes for all tiles (including impassable, to preserve index mapping)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = tileToIndex(x, y, width);
			const position = new Vector3(x, 0, y);
			const node = new NavNode(index, position, {
				terrain: tiles[y][x],
			});
			graph.addNode(node);
		}
	}

	// Add edges between adjacent walkable tiles
	const directions = eightWay ? NEIGHBORS_8 : NEIGHBORS_4;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const fromCost = getTerrainCost(tiles[y][x], canSwim);
			if (fromCost >= Number.POSITIVE_INFINITY) continue; // skip impassable source

			const fromIndex = tileToIndex(x, y, width);

			for (const [dx, dy] of directions) {
				const nx = x + dx;
				const ny = y + dy;

				if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

				const toCost = getTerrainCost(tiles[ny][nx], canSwim);
				if (toCost >= Number.POSITIVE_INFINITY) continue; // skip impassable target

				// Edge cost = average of source and destination terrain costs
				// For diagonals, multiply by sqrt(2) for accurate distance
				const isDiagonal = dx !== 0 && dy !== 0;
				const baseCost = (fromCost + toCost) / 2;
				const cost = isDiagonal ? baseCost * Math.SQRT2 : baseCost;

				const toIndex = tileToIndex(nx, ny, width);
				const edge = new NavEdge(fromIndex, toIndex, cost);
				graph.addEdge(edge);
			}
		}
	}

	return graph;
}

/**
 * Rebuild graph edges around a specific tile.
 * Used when buildings are placed or destroyed, changing walkability.
 */
export function rebuildTileEdges(
	graph: Graph,
	tiles: TerrainType[][],
	tileX: number,
	tileY: number,
	options: GraphBuildOptions = {},
): void {
	const { eightWay = false, canSwim = false } = options;
	const height = tiles.length;
	const width = tiles[0].length;
	const directions = eightWay ? NEIGHBORS_8 : NEIGHBORS_4;

	// Remove all existing edges from/to this tile
	const centerIndex = tileToIndex(tileX, tileY, width);
	const existingEdges: Array<{ from: number; to: number }> = [];
	const edgeBuffer: Array<{ from: number; to: number; cost: number }> = [];

	// Collect edges to remove (from center node)
	const centerEdges: Array<{ from: number; to: number; cost: number }> = [];
	graph.getEdgesOfNode(centerIndex, centerEdges as never[]);

	for (const edge of centerEdges) {
		existingEdges.push({ from: edge.from, to: edge.to });
	}

	// Also collect edges from neighbors pointing to center
	for (const [dx, dy] of directions) {
		const nx = tileX + dx;
		const ny = tileY + dy;
		if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
		const neighborIndex = tileToIndex(nx, ny, width);
		const neighborEdges: Array<{ from: number; to: number; cost: number }> = [];
		graph.getEdgesOfNode(neighborIndex, neighborEdges as never[]);
		for (const edge of neighborEdges) {
			if (edge.to === centerIndex) {
				existingEdges.push({ from: edge.from, to: edge.to });
			}
		}
	}

	// Remove old edges
	for (const { from, to } of existingEdges) {
		const edge = graph.getEdge(from, to);
		if (edge) graph.removeEdge(edge);
	}

	// Re-add edges if tile is now walkable
	const centerCost = getTerrainCost(tiles[tileY][tileX], canSwim);
	if (centerCost >= Number.POSITIVE_INFINITY) return;

	for (const [dx, dy] of directions) {
		const nx = tileX + dx;
		const ny = tileY + dy;
		if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

		const neighborCost = getTerrainCost(tiles[ny][nx], canSwim);
		if (neighborCost >= Number.POSITIVE_INFINITY) continue;

		const isDiagonal = dx !== 0 && dy !== 0;
		const baseCost = (centerCost + neighborCost) / 2;
		const cost = isDiagonal ? baseCost * Math.SQRT2 : baseCost;

		const neighborIndex = tileToIndex(nx, ny, width);
		edgeBuffer.push({ from: centerIndex, to: neighborIndex, cost });
	}

	for (const { from, to, cost } of edgeBuffer) {
		graph.addEdge(new NavEdge(from, to, cost));
	}
}
