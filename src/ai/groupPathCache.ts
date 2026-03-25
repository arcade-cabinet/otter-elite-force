/**
 * Group Path Cache — US-087: Path caching for group movement.
 *
 * Multiple units moving to the same destination share one pathfinding
 * calculation. The cached path is shared with a slight per-unit offset
 * for formation spread. Cache entries expire after a configurable TTL.
 *
 * Invalidation triggers:
 * - Terrain changes (building placed/destroyed) via invalidate()
 * - Cache TTL expiration (default 5 seconds)
 *
 * Usage:
 *   const cache = new GroupPathCache(findPathFn);
 *   const path = cache.getPath(from, to, unitIndex, groupSize, currentTimeMs);
 */

import type { Vector3 } from "yuka";
import type { TileCoord } from "./pathfinder";

/** Function signature for computing a raw path. */
export type PathFinder = (from: TileCoord, to: TileCoord) => Vector3[];

/** A cached path entry with expiration metadata. */
export interface CachedPath {
	/** The base path (shared reference). */
	path: Vector3[];
	/** Timestamp (ms) when this entry was created. */
	createdAt: number;
	/** Source tile coordinates (for invalidation). */
	from: TileCoord;
	/** Destination tile coordinates. */
	to: TileCoord;
}

/** Configuration for the group path cache. */
export interface GroupPathCacheConfig {
	/** Cache TTL in milliseconds. Default: 5000 (5 seconds). */
	ttlMs: number;
	/** Maximum formation spread offset per unit (in tiles). Default: 1.5. */
	formationSpread: number;
}

const DEFAULT_CONFIG: GroupPathCacheConfig = {
	ttlMs: 5000,
	formationSpread: 1.5,
};

/**
 * Create a cache key from source and destination tile coordinates.
 */
function makeCacheKey(from: TileCoord, to: TileCoord): string {
	return `${from.x},${from.y}->${to.x},${to.y}`;
}

/**
 * Compute a formation offset for a unit based on its index in a group.
 * Units spread out in a roughly circular pattern around the destination.
 */
export function computeFormationOffset(
	unitIndex: number,
	groupSize: number,
	spread: number,
): { dx: number; dy: number } {
	if (groupSize <= 1) return { dx: 0, dy: 0 };

	const angle = (2 * Math.PI * unitIndex) / groupSize;
	// Scale radius based on group size (larger groups spread more)
	const radius = spread * Math.min(1, (unitIndex + 1) / groupSize);
	return {
		dx: Math.cos(angle) * radius,
		dy: Math.sin(angle) * radius,
	};
}

/**
 * Group Path Cache — shares A* calculations across units moving
 * to the same destination, with formation-spread offsets.
 */
export class GroupPathCache {
	private cache = new Map<string, CachedPath>();
	private pathFinder: PathFinder;
	private config: GroupPathCacheConfig;

	constructor(pathFinder: PathFinder, config: Partial<GroupPathCacheConfig> = {}) {
		this.pathFinder = pathFinder;
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Get a path for a unit in a group.
	 *
	 * If a cached path exists for the same (from, to) and hasn't expired,
	 * it is reused. Otherwise a new path is computed and cached.
	 *
	 * The final waypoint is offset by a formation spread based on unitIndex.
	 *
	 * @param from       Source tile
	 * @param to         Destination tile
	 * @param unitIndex  Index of this unit within the group (0-based)
	 * @param groupSize  Total units in the group
	 * @param currentMs  Current game time in milliseconds
	 * @returns Array of Vector3 waypoints (may be empty if no path found)
	 */
	getPath(
		from: TileCoord,
		to: TileCoord,
		unitIndex: number,
		groupSize: number,
		currentMs: number,
	): Vector3[] {
		const key = makeCacheKey(from, to);
		let entry = this.cache.get(key);

		// Check if cached entry is still valid
		if (entry && currentMs - entry.createdAt < this.config.ttlMs) {
			return this.applyFormationOffset(entry.path, unitIndex, groupSize);
		}

		// Compute new path
		const path = this.pathFinder(from, to);

		// Cache the result
		this.cache.set(key, {
			path,
			createdAt: currentMs,
			from,
			to,
		});

		return this.applyFormationOffset(path, unitIndex, groupSize);
	}

	/**
	 * Invalidate all cached paths.
	 * Call when terrain changes (building placed/destroyed).
	 */
	invalidate(): void {
		this.cache.clear();
	}

	/**
	 * Invalidate cached paths that pass through a specific tile.
	 * More targeted than full invalidation.
	 */
	invalidateNear(tileX: number, tileY: number, radius = 3): void {
		for (const [key, entry] of this.cache) {
			// Invalidate if source or destination is near the changed tile
			const fromDist = Math.abs(entry.from.x - tileX) + Math.abs(entry.from.y - tileY);
			const toDist = Math.abs(entry.to.x - tileX) + Math.abs(entry.to.y - tileY);
			if (fromDist <= radius || toDist <= radius) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Remove expired entries from the cache.
	 * Call periodically to prevent memory leaks.
	 */
	prune(currentMs: number): void {
		for (const [key, entry] of this.cache) {
			if (currentMs - entry.createdAt >= this.config.ttlMs) {
				this.cache.delete(key);
			}
		}
	}

	/** Number of entries in the cache. */
	get size(): number {
		return this.cache.size;
	}

	/** Get the configured TTL in milliseconds. */
	get ttlMs(): number {
		return this.config.ttlMs;
	}

	/**
	 * Apply formation offset to the last waypoint of a path.
	 * Returns a new array (does not mutate the cached path).
	 */
	private applyFormationOffset(
		basePath: Vector3[],
		unitIndex: number,
		groupSize: number,
	): Vector3[] {
		if (basePath.length === 0) return [];

		// Clone the path so we don't mutate the cached original
		const result = basePath.map((wp) => wp.clone());

		if (groupSize > 1 && result.length > 0) {
			const offset = computeFormationOffset(
				unitIndex,
				groupSize,
				this.config.formationSpread,
			);
			const last = result[result.length - 1];
			last.x += offset.dx;
			last.z += offset.dy; // z maps to our y in Yuka coordinates
		}

		return result;
	}
}
