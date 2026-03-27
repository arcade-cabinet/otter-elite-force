import { beforeEach, describe, expect, it } from "vitest";
import { TerrainTypeId } from "@/engine/content/terrainTypes";
import { Flags, Health } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import { phaseAtTime, resetTidalState, runTidalSystem, type TidalRuntime } from "./tidalSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

/** Set up tidal zones on the world. */
function configureTidalZone(
	world: ReturnType<typeof createGameWorld>,
	zone: { x: number; y: number; width: number; height: number },
	cycleTime = 120,
) {
	const runtime = world.runtime as unknown as TidalRuntime;
	runtime.tidalZones = [zone];
	runtime.tidalCycleTime = cycleTime;
}

/** Create a 10x10 terrain grid filled with beach tiles. */
function createBeachGrid(): number[][] {
	return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => TerrainTypeId.beach));
}

describe("engine/systems/tidalSystem", () => {
	beforeEach(() => {
		// Reset is handled per-world
	});

	describe("phaseAtTime", () => {
		it("returns low at the start of the cycle", () => {
			expect(phaseAtTime(0, 100)).toBe("low");
		});

		it("returns rising at 35% of cycle", () => {
			expect(phaseAtTime(36, 100)).toBe("rising");
		});

		it("returns high at 50% of cycle", () => {
			expect(phaseAtTime(51, 100)).toBe("high");
		});

		it("returns falling at 85% of cycle", () => {
			expect(phaseAtTime(86, 100)).toBe("falling");
		});

		it("wraps around at the end of a cycle", () => {
			expect(phaseAtTime(100, 100)).toBe("low");
		});
	});

	it("initializes tidal state on first tick", () => {
		const world = makeWorld(100);
		runTidalSystem(world);

		const runtime = world.runtime as unknown as TidalRuntime;
		expect(runtime.tidalPhase).toBe("low");
		expect(runtime.tidalElapsed).toBeGreaterThan(0);
	});

	it("does not emit events when phase has not changed", () => {
		const world = makeWorld(100); // 0.1s -- still in low phase
		configureTidalZone(world, { x: 0, y: 0, width: 5, height: 5 }, 120);

		runTidalSystem(world);
		// First tick initializes (phase undefined -> low), emits no transition since init
		// Second tick also stays in low
		world.events.length = 0;
		runTidalSystem(world);

		const tidalEvents = world.events.filter((e) => e.type === "tidal-change");
		expect(tidalEvents).toHaveLength(0);
	});

	it("emits tidal-change event on phase transition", () => {
		const world = makeWorld(0);
		configureTidalZone(world, { x: 0, y: 0, width: 5, height: 5 }, 100);

		// Initialize at time 0 (low phase)
		world.time.deltaMs = 1;
		runTidalSystem(world);
		world.events.length = 0;

		// Jump to 36s -> should transition to "rising"
		const runtime = world.runtime as unknown as TidalRuntime;
		runtime.tidalElapsed = 34;
		world.time.deltaMs = 2000; // 2 seconds
		runTidalSystem(world);

		const tidalEvents = world.events.filter((e) => e.type === "tidal-change");
		expect(tidalEvents).toHaveLength(1);
		expect(tidalEvents[0].payload?.phase).toBe("rising");
	});

	it("converts terrain to water on high tide", () => {
		const world = makeWorld(0);
		const grid = createBeachGrid();
		world.runtime.terrainGrid = grid;
		configureTidalZone(world, { x: 2, y: 2, width: 3, height: 3 }, 100);

		// Initialize
		world.time.deltaMs = 1;
		runTidalSystem(world);

		// Jump to high phase (50% = 50s)
		const runtime = world.runtime as unknown as TidalRuntime;
		runtime.tidalElapsed = 49;
		world.time.deltaMs = 2000;
		runTidalSystem(world);

		// Tiles in the tidal zone should be water
		expect(grid[2][2]).toBe(TerrainTypeId.water);
		expect(grid[3][3]).toBe(TerrainTypeId.water);
		expect(grid[4][4]).toBe(TerrainTypeId.water);

		// Tiles outside should remain beach
		expect(grid[0][0]).toBe(TerrainTypeId.beach);
		expect(grid[5][5]).toBe(TerrainTypeId.beach);
	});

	it("converts terrain back to beach on low tide", () => {
		const world = makeWorld(0);
		const grid = createBeachGrid();
		// Pre-fill zone with water (simulating already high)
		for (let y = 2; y < 5; y++) {
			for (let x = 2; x < 5; x++) {
				grid[y][x] = TerrainTypeId.water;
			}
		}
		world.runtime.terrainGrid = grid;
		configureTidalZone(world, { x: 2, y: 2, width: 3, height: 3 }, 100);

		// Initialize as high phase
		world.time.deltaMs = 1;
		runTidalSystem(world);
		const runtime = world.runtime as unknown as TidalRuntime;
		runtime.tidalPhase = "high";

		// Advance past falling to low (need to pass 100% boundary)
		runtime.tidalElapsed = 99;
		world.time.deltaMs = 2000;
		runTidalSystem(world);

		// Should convert back to beach
		expect(grid[2][2]).toBe(TerrainTypeId.beach);
		expect(grid[3][3]).toBe(TerrainTypeId.beach);
	});

	it("deals displacement damage to non-swimming units in tidal zone on high tide", () => {
		const world = makeWorld(0);
		const grid = createBeachGrid();
		world.runtime.terrainGrid = grid;
		configureTidalZone(world, { x: 0, y: 0, width: 5, height: 5 }, 100);

		// Spawn a non-swimmer in the tidal zone
		const soldier = spawnUnit(world, {
			x: 2,
			y: 2,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		// Spawn a swimmer in the tidal zone
		const swimmer = spawnUnit(world, {
			x: 3,
			y: 3,
			faction: "ura",
			health: { current: 100, max: 100 },
		});
		Flags.canSwim[swimmer] = 1;

		// Initialize
		world.time.deltaMs = 1;
		runTidalSystem(world);

		// Jump to high phase
		const runtime = world.runtime as unknown as TidalRuntime;
		runtime.tidalElapsed = 49;
		world.time.deltaMs = 2000;
		runTidalSystem(world);

		// Non-swimmer should take 15 displacement damage
		expect(Health.current[soldier]).toBe(85);

		// Swimmer should be unharmed
		expect(Health.current[swimmer]).toBe(100);
	});

	it("emits nav-rebuild-needed on high/low transitions", () => {
		const world = makeWorld(0);
		const grid = createBeachGrid();
		world.runtime.terrainGrid = grid;
		configureTidalZone(world, { x: 0, y: 0, width: 3, height: 3 }, 100);

		// Initialize
		world.time.deltaMs = 1;
		runTidalSystem(world);
		world.events.length = 0;

		// Jump to high phase
		const runtime = world.runtime as unknown as TidalRuntime;
		runtime.tidalElapsed = 49;
		world.time.deltaMs = 2000;
		runTidalSystem(world);

		const navEvents = world.events.filter((e) => e.type === "nav-rebuild-needed");
		expect(navEvents).toHaveLength(1);
		expect(navEvents[0].payload?.phase).toBe("high");
	});

	it("resets tidal state cleanly", () => {
		const world = makeWorld(1000);
		configureTidalZone(world, { x: 0, y: 0, width: 3, height: 3 });
		runTidalSystem(world);

		resetTidalState(world);

		const runtime = world.runtime as unknown as TidalRuntime;
		expect(runtime.tidalPhase).toBeUndefined();
		expect(runtime.tidalElapsed).toBeUndefined();
	});
});
