import { describe, expect, it, vi } from "vitest";
import { TerrainTypeId } from "@/engine/content/terrainTypes";
import { Health } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import {
	type ActiveFire,
	type FireRuntime,
	igniteFireAt,
	resetFireState,
	runFireSystem,
} from "./fireSystem";

function makeWorld(deltaMs: number, elapsedMs = 0) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	world.time.elapsedMs = elapsedMs;
	return world;
}

/** Create a 10x10 terrain grid filled with a given terrain type. */
function createGrid(fill: number = TerrainTypeId.grass): number[][] {
	return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => fill));
}

/** Add active fires to the world runtime. */
function addFires(world: ReturnType<typeof createGameWorld>, fires: ActiveFire[]) {
	const runtime = world.runtime as unknown as FireRuntime;
	runtime.activeFires = [...fires];
}

describe("engine/systems/fireSystem", () => {
	it("damages entities standing on burning tiles", () => {
		const world = makeWorld(1000, 5000); // 1s delta, 5s elapsed
		world.runtime.terrainGrid = createGrid();

		addFires(world, [{ x: 3, y: 3, startTime: 0, duration: 20 }]);

		const eid = spawnUnit(world, {
			x: 3,
			y: 3,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runFireSystem(world);

		// 3 DPS * 1s = 3 damage
		expect(Health.current[eid]).toBeCloseTo(97, 0);
	});

	it("does not damage entities outside burning tiles", () => {
		const world = makeWorld(1000, 5000);
		world.runtime.terrainGrid = createGrid();

		addFires(world, [{ x: 3, y: 3, startTime: 0, duration: 20 }]);

		const eid = spawnUnit(world, {
			x: 7,
			y: 7,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runFireSystem(world);

		expect(Health.current[eid]).toBe(100);
	});

	it("extinguishes fires after duration expires and scorches terrain", () => {
		const world = makeWorld(1000, 15000); // elapsed=15s
		const grid = createGrid(TerrainTypeId.mangrove);
		world.runtime.terrainGrid = grid;

		// Fire started at t=0 with 10s duration -> expired at t=10
		addFires(world, [{ x: 3, y: 3, startTime: 0, duration: 10 }]);

		runFireSystem(world);

		// Terrain should be scorched
		expect(grid[3][3]).toBe(TerrainTypeId.scorched);

		// Fire-extinguished event should be emitted
		const extEvents = world.events.filter((e) => e.type === "fire-extinguished");
		expect(extEvents).toHaveLength(1);
		expect(extEvents[0].payload?.x).toBe(3);
		expect(extEvents[0].payload?.y).toBe(3);

		// Active fires should be empty
		const runtime = world.runtime as unknown as FireRuntime;
		expect(runtime.activeFires).toHaveLength(0);
	});

	it("keeps fires alive when not yet expired", () => {
		const world = makeWorld(1000, 5000); // elapsed=5s
		world.runtime.terrainGrid = createGrid();

		addFires(world, [{ x: 3, y: 3, startTime: 0, duration: 20 }]);

		runFireSystem(world);

		const runtime = world.runtime as unknown as FireRuntime;
		expect(runtime.activeFires).toHaveLength(1);
	});

	it("spreads fire to adjacent flammable tiles with seeded random", () => {
		const world = makeWorld(1000, 5000);
		const grid = createGrid(TerrainTypeId.mangrove); // all flammable
		world.runtime.terrainGrid = grid;

		addFires(world, [{ x: 5, y: 5, startTime: 0, duration: 30 }]);

		// Force Math.random to always return < 0.02 so fire always spreads
		const originalRandom = Math.random;
		Math.random = vi.fn(() => 0.01);

		try {
			runFireSystem(world);

			const runtime = world.runtime as unknown as FireRuntime;
			// Original fire + up to 8 neighbors
			expect(runtime.activeFires!.length).toBeGreaterThan(1);

			// Fire-started events should be emitted for new fires
			const startedEvents = world.events.filter((e) => e.type === "fire-started");
			expect(startedEvents.length).toBeGreaterThan(0);
		} finally {
			Math.random = originalRandom;
		}
	});

	it("does not spread fire to non-flammable terrain", () => {
		const world = makeWorld(1000, 5000);
		const grid = createGrid(TerrainTypeId.stone); // non-flammable
		// Only the fire tile itself is mangrove
		grid[5][5] = TerrainTypeId.mangrove;
		world.runtime.terrainGrid = grid;

		addFires(world, [{ x: 5, y: 5, startTime: 0, duration: 30 }]);

		const originalRandom = Math.random;
		Math.random = vi.fn(() => 0.01); // Would spread if terrain was flammable

		try {
			runFireSystem(world);

			const runtime = world.runtime as unknown as FireRuntime;
			// Only the original fire should remain
			expect(runtime.activeFires).toHaveLength(1);
		} finally {
			Math.random = originalRandom;
		}
	});

	it("does not spread when random is above threshold", () => {
		const world = makeWorld(1000, 5000);
		const grid = createGrid(TerrainTypeId.mangrove);
		world.runtime.terrainGrid = grid;

		addFires(world, [{ x: 5, y: 5, startTime: 0, duration: 30 }]);

		const originalRandom = Math.random;
		Math.random = vi.fn(() => 0.99); // Above 0.02 threshold

		try {
			runFireSystem(world);

			const runtime = world.runtime as unknown as FireRuntime;
			expect(runtime.activeFires).toHaveLength(1); // No spread
		} finally {
			Math.random = originalRandom;
		}
	});

	it("marks entities for removal when fire kills them", () => {
		const world = makeWorld(1000, 5000);
		world.runtime.terrainGrid = createGrid();

		addFires(world, [{ x: 3, y: 3, startTime: 0, duration: 20 }]);

		const eid = spawnUnit(world, {
			x: 3,
			y: 3,
			faction: "ura",
			health: { current: 2, max: 100 },
		});

		runFireSystem(world);

		expect(world.runtime.removals.has(eid)).toBe(true);
	});

	describe("igniteFireAt", () => {
		it("adds a new fire at the specified position", () => {
			const world = makeWorld(0, 10000);

			igniteFireAt(world, 5, 5, 15);

			const runtime = world.runtime as unknown as FireRuntime;
			expect(runtime.activeFires).toHaveLength(1);
			expect(runtime.activeFires![0].x).toBe(5);
			expect(runtime.activeFires![0].y).toBe(5);
			expect(runtime.activeFires![0].duration).toBe(15);
		});

		it("does not ignite duplicate fires at the same position", () => {
			const world = makeWorld(0, 10000);

			igniteFireAt(world, 5, 5, 15);
			igniteFireAt(world, 5, 5, 20);

			const runtime = world.runtime as unknown as FireRuntime;
			expect(runtime.activeFires).toHaveLength(1);
		});

		it("emits fire-started event", () => {
			const world = makeWorld(0, 10000);

			igniteFireAt(world, 5, 5, 15);

			const startedEvents = world.events.filter((e) => e.type === "fire-started");
			expect(startedEvents).toHaveLength(1);
		});
	});

	it("resets fire state cleanly", () => {
		const world = makeWorld(0);
		addFires(world, [{ x: 1, y: 1, startTime: 0, duration: 10 }]);

		resetFireState(world);

		const runtime = world.runtime as unknown as FireRuntime;
		expect(runtime.activeFires).toBeUndefined();
	});

	it("skips processing when no active fires", () => {
		const world = makeWorld(1000);
		world.runtime.terrainGrid = createGrid();

		const eid = spawnUnit(world, {
			x: 3,
			y: 3,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		// No fires added
		runFireSystem(world);

		expect(Health.current[eid]).toBe(100);
		expect(world.events).toHaveLength(0);
	});
});
