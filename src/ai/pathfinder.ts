/**
 * Pathfinding service using Yuka A* on a tile grid graph.
 *
 * Features:
 * - A* search on Yuka Graph with Manhattan heuristic (better for grids)
 * - Request queue: max N pathfinding requests per frame tick
 * - Path caching: same (from, to) within one frame shares result
 *
 * Spec reference: §8.3 Pathfinding, §15 Performance Strategy
 */

import { AStar, type Graph, HeuristicPolicyManhattan, Vector3 } from "yuka";
import { indexToTile, tileToIndex } from "./graphBuilder";

export interface TileCoord {
	x: number;
	y: number;
}

export interface PathRequest {
	from: TileCoord;
	to: TileCoord;
	resolve: (path: Vector3[]) => void;
}

const MAX_REQUESTS_PER_TICK = 4;

/**
 * Find a path between two tile coordinates using Yuka A*.
 * Returns an array of Vector3 waypoints (x, 0, y) or empty if no path.
 */
export function findPath(graph: Graph, from: TileCoord, to: TileCoord, width: number): Vector3[] {
	const sourceIndex = tileToIndex(from.x, from.y, width);
	const targetIndex = tileToIndex(to.x, to.y, width);

	if (!graph.hasNode(sourceIndex) || !graph.hasNode(targetIndex)) {
		return [];
	}

	const astar = new AStar(graph, sourceIndex, targetIndex);
	astar.heuristic = HeuristicPolicyManhattan;
	astar.search();

	if (!astar.found) return [];

	const nodeIndices = astar.getPath();
	const waypoints: Vector3[] = [];

	for (const nodeIndex of nodeIndices) {
		const tile = indexToTile(nodeIndex, width);
		waypoints.push(new Vector3(tile.x, 0, tile.y));
	}

	return waypoints;
}

/**
 * Queued pathfinder that limits computation per frame.
 * Processes up to MAX_REQUESTS_PER_TICK requests each time processTick is called.
 * Caches results within a single tick for duplicate destinations.
 */
export class PathfindingQueue {
	private queue: PathRequest[] = [];
	private graph: Graph;
	private mapWidth: number;
	private frameCache = new Map<string, Vector3[]>();

	constructor(graph: Graph, mapWidth: number) {
		this.graph = graph;
		this.mapWidth = mapWidth;
	}

	/** Update the graph reference (e.g., after rebuild). */
	setGraph(graph: Graph): void {
		this.graph = graph;
	}

	/** Request a path. Returns a promise that resolves when the path is computed. */
	requestPath(from: TileCoord, to: TileCoord): Promise<Vector3[]> {
		return new Promise((resolve) => {
			this.queue.push({ from, to, resolve });
		});
	}

	/** Process up to MAX_REQUESTS_PER_TICK queued path requests. */
	processTick(): void {
		this.frameCache.clear();
		const batch = this.queue.splice(0, MAX_REQUESTS_PER_TICK);

		for (const request of batch) {
			const cacheKey = `${request.from.x},${request.from.y}->${request.to.x},${request.to.y}`;

			const cached = this.frameCache.get(cacheKey);
			if (cached) {
				request.resolve(cached);
				continue;
			}

			const path = findPath(this.graph, request.from, request.to, this.mapWidth);
			this.frameCache.set(cacheKey, path);
			request.resolve(path);
		}
	}

	/** Number of pending requests. */
	get pendingCount(): number {
		return this.queue.length;
	}

	/** Clear all pending requests (resolves them with empty paths). */
	clear(): void {
		for (const request of this.queue) {
			request.resolve([]);
		}
		this.queue.length = 0;
		this.frameCache.clear();
	}
}
