import { describe, expect, it } from "vitest";
import { FACTION_IDS } from "@/engine/content/ids";
import { Faction, VisionRadius } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import type { FogRuntime } from "./fogSystem";
import {
	createFogGrid,
	FOG_EXPLORED,
	FOG_UNEXPLORED,
	FOG_VISIBLE,
	getFogState,
	runFogSystem,
} from "./fogSystem";

function makeWorld(width: number, height: number) {
	const world = createGameWorld();
	world.navigation.width = width;
	world.navigation.height = height;
	(world.runtime as FogRuntime).fogGrid = createFogGrid(width, height);
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/fogSystem", () => {
	it("createFogGrid initializes all tiles as unexplored", () => {
		const grid = createFogGrid(10, 10);
		expect(grid.length).toBe(100);
		for (let i = 0; i < grid.length; i++) {
			expect(grid[i]).toBe(FOG_UNEXPLORED);
		}
	});

	it("marks tiles around player entities as visible", () => {
		const world = makeWorld(20, 20);

		const unit = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		VisionRadius.value[unit] = 3;

		runFogSystem(world);

		// Tile at (10, 10) should be visible
		expect(getFogState(world, 10, 10)).toBe(FOG_VISIBLE);
		// Tile at (11, 10) should be visible (within radius 3)
		expect(getFogState(world, 11, 10)).toBe(FOG_VISIBLE);
		// Tile at (0, 0) should be unexplored (far away)
		expect(getFogState(world, 0, 0)).toBe(FOG_UNEXPLORED);
	});

	it("demotes previously visible tiles to explored", () => {
		const world = makeWorld(20, 20);

		const unit = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		VisionRadius.value[unit] = 2;

		// First tick: marks tiles visible
		runFogSystem(world);
		expect(getFogState(world, 10, 10)).toBe(FOG_VISIBLE);

		// Move the unit away — change its faction so it no longer reveals
		Faction.id[unit] = FACTION_IDS.scale_guard;

		// Second tick: visible tiles become explored
		runFogSystem(world);
		expect(getFogState(world, 10, 10)).toBe(FOG_EXPLORED);
	});

	it("does not reveal tiles for enemy faction entities", () => {
		const world = makeWorld(20, 20);

		const enemy = spawnUnit(world, { x: 10, y: 10, faction: "scale_guard" });
		VisionRadius.value[enemy] = 5;

		runFogSystem(world);

		expect(getFogState(world, 10, 10)).toBe(FOG_UNEXPLORED);
	});

	it("handles edge tiles without going out of bounds", () => {
		const world = makeWorld(10, 10);

		const unit = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		VisionRadius.value[unit] = 3;

		// Should not throw
		runFogSystem(world);

		expect(getFogState(world, 0, 0)).toBe(FOG_VISIBLE);
		// Out of bounds should return unexplored
		expect(getFogState(world, -1, -1)).toBe(FOG_UNEXPLORED);
	});

	it("returns unexplored for out-of-bounds queries", () => {
		const world = makeWorld(10, 10);
		expect(getFogState(world, 100, 100)).toBe(FOG_UNEXPLORED);
		expect(getFogState(world, -5, -5)).toBe(FOG_UNEXPLORED);
	});

	it("does nothing when fogGrid is not set", () => {
		const world = createGameWorld();
		world.navigation.width = 10;
		world.navigation.height = 10;
		world.time.deltaMs = 16;

		// Should not throw
		runFogSystem(world);
	});

	it("skips entities with zero vision radius", () => {
		const world = makeWorld(20, 20);

		const unit = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		VisionRadius.value[unit] = 0;

		runFogSystem(world);

		expect(getFogState(world, 10, 10)).toBe(FOG_UNEXPLORED);
	});
});
