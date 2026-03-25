/**
 * US-087: Path caching for group movement tests.
 *
 * Validates:
 * - Shared pathfinding for units with same destination
 * - Formation spread offsets per unit
 * - Cache TTL expiration (5s default)
 * - Cache invalidation on terrain changes
 */

import { describe, expect, it, vi } from "vitest";

vi.unmock("yuka");

import { Vector3 } from "yuka";
import {
	GroupPathCache,
	computeFormationOffset,
} from "../../ai/groupPathCache";
import type { TileCoord } from "../../ai/pathfinder";

/** Create a mock path finder that returns a straight line. */
function makeMockPathFinder() {
	const fn = vi.fn((from: TileCoord, to: TileCoord): Vector3[] => {
		const path: Vector3[] = [];
		const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) || 1;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			path.push(
				new Vector3(
					from.x + (to.x - from.x) * t,
					0,
					from.y + (to.y - from.y) * t,
				),
			);
		}
		return path;
	});
	return fn;
}

describe("computeFormationOffset", () => {
	it("should return zero offset for single unit", () => {
		const offset = computeFormationOffset(0, 1, 1.5);
		expect(offset.dx).toBe(0);
		expect(offset.dy).toBe(0);
	});

	it("should spread units in a circular pattern", () => {
		const offsets = [];
		for (let i = 0; i < 4; i++) {
			offsets.push(computeFormationOffset(i, 4, 1.0));
		}

		// First unit should be offset to the right (angle=0)
		expect(offsets[0].dx).toBeGreaterThan(0);
		expect(Math.abs(offsets[0].dy)).toBeLessThan(0.01);

		// Second unit should be offset upward (angle=PI/2)
		expect(Math.abs(offsets[1].dx)).toBeLessThan(0.01);
		expect(offsets[1].dy).toBeGreaterThan(0);

		// Third unit should be offset to the left (angle=PI)
		expect(offsets[2].dx).toBeLessThan(0);
		expect(Math.abs(offsets[2].dy)).toBeLessThan(0.01);

		// Fourth unit should be offset downward (angle=3PI/2)
		expect(Math.abs(offsets[3].dx)).toBeLessThan(0.01);
		expect(offsets[3].dy).toBeLessThan(0);
	});

	it("should scale radius based on spread parameter", () => {
		const smallSpread = computeFormationOffset(0, 2, 0.5);
		const largeSpread = computeFormationOffset(0, 2, 2.0);

		expect(Math.abs(largeSpread.dx)).toBeGreaterThan(Math.abs(smallSpread.dx));
	});
});

describe("GroupPathCache", () => {
	describe("path sharing", () => {
		it("should compute a path only once for the same destination", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			const from = { x: 0, y: 0 };
			const to = { x: 5, y: 5 };

			// Request paths for 4 units in a group
			for (let i = 0; i < 4; i++) {
				cache.getPath(from, to, i, 4, 1000);
			}

			// Path finder should only be called once
			expect(finder).toHaveBeenCalledTimes(1);
		});

		it("should return valid paths for each unit in the group", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			const from = { x: 0, y: 0 };
			const to = { x: 5, y: 5 };

			const paths = [];
			for (let i = 0; i < 3; i++) {
				paths.push(cache.getPath(from, to, i, 3, 1000));
			}

			// All paths should have waypoints
			for (const path of paths) {
				expect(path.length).toBeGreaterThan(0);
			}
		});

		it("should NOT share paths for different destinations", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			cache.getPath({ x: 0, y: 0 }, { x: 10, y: 10 }, 0, 1, 1000);

			expect(finder).toHaveBeenCalledTimes(2);
		});
	});

	describe("formation spread", () => {
		it("should offset final waypoints for multi-unit groups", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			const from = { x: 0, y: 0 };
			const to = { x: 5, y: 5 };

			const path0 = cache.getPath(from, to, 0, 3, 1000);
			const path1 = cache.getPath(from, to, 1, 3, 1000);

			const last0 = path0[path0.length - 1];
			const last1 = path1[path1.length - 1];

			// Final waypoints should differ due to formation offset
			expect(last0.x).not.toBe(last1.x);
		});

		it("should NOT offset for single-unit groups", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			const path = cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			const last = path[path.length - 1];

			// Should be exactly at destination (no offset)
			expect(last.x).toBe(5);
			expect(last.z).toBe(5);
		});

		it("should not mutate the cached base path", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			const from = { x: 0, y: 0 };
			const to = { x: 5, y: 5 };

			const path1 = cache.getPath(from, to, 0, 3, 1000);
			const path2 = cache.getPath(from, to, 1, 3, 1000);

			// Both paths should be independent arrays
			expect(path1).not.toBe(path2);
			// Modifying one should not affect the other
			path1[0].x = 999;
			expect(path2[0].x).toBe(0);
		});
	});

	describe("TTL expiration", () => {
		it("should recompute path after TTL expires", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder, { ttlMs: 5000 });

			const from = { x: 0, y: 0 };
			const to = { x: 5, y: 5 };

			cache.getPath(from, to, 0, 1, 1000);
			expect(finder).toHaveBeenCalledTimes(1);

			// Before TTL: should use cache
			cache.getPath(from, to, 0, 1, 5999);
			expect(finder).toHaveBeenCalledTimes(1);

			// After TTL: should recompute
			cache.getPath(from, to, 0, 1, 6001);
			expect(finder).toHaveBeenCalledTimes(2);
		});

		it("should default to 5 second TTL", () => {
			const cache = new GroupPathCache(makeMockPathFinder());
			expect(cache.ttlMs).toBe(5000);
		});

		it("should accept custom TTL", () => {
			const cache = new GroupPathCache(makeMockPathFinder(), { ttlMs: 2000 });
			expect(cache.ttlMs).toBe(2000);
		});
	});

	describe("cache invalidation", () => {
		it("should clear all entries on invalidate()", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			cache.getPath({ x: 0, y: 0 }, { x: 10, y: 10 }, 0, 1, 1000);
			expect(cache.size).toBe(2);

			cache.invalidate();
			expect(cache.size).toBe(0);

			// Next request should recompute
			cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			expect(finder).toHaveBeenCalledTimes(3); // 2 original + 1 recompute
		});

		it("should invalidate entries near a changed tile", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder);

			cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			cache.getPath({ x: 0, y: 0 }, { x: 20, y: 20 }, 0, 1, 1000);
			expect(cache.size).toBe(2);

			// Invalidate near (5, 5) — should remove first entry but not second
			cache.invalidateNear(5, 5, 3);
			expect(cache.size).toBe(1);
		});

		it("should prune expired entries", () => {
			const finder = makeMockPathFinder();
			const cache = new GroupPathCache(finder, { ttlMs: 1000 });

			cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 100);
			cache.getPath({ x: 0, y: 0 }, { x: 10, y: 10 }, 0, 1, 500);
			expect(cache.size).toBe(2);

			// Prune at 1200ms — first entry expired, second still valid
			cache.prune(1200);
			expect(cache.size).toBe(1);

			// Prune at 1600ms — both expired
			cache.prune(1600);
			expect(cache.size).toBe(0);
		});
	});

	describe("empty paths", () => {
		it("should cache and return empty paths (no route found)", () => {
			const finder = vi.fn(() => [] as Vector3[]);
			const cache = new GroupPathCache(finder);

			const path = cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			expect(path).toEqual([]);

			// Should still be cached
			cache.getPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 0, 1, 1000);
			expect(finder).toHaveBeenCalledTimes(1);
		});
	});
});
