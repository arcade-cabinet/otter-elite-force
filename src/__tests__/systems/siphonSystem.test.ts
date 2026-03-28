/**
 * Siphon System Tests — ported from old Koota codebase.
 *
 * Tests enemy siphon building resource drain mechanic.
 */

import { describe, expect, it } from "vitest";
import { runSiphonSystem } from "@/engine/systems/siphonSystem";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/siphonSystem", () => {
	it("drains player fish when enemy siphon building exists", () => {
		const world = makeWorld(1000);
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "siphon_tower",
			health: { current: 200, max: 200 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.fish).toBeLessThan(100);
	});

	it("drains player timber when enemy siphon building exists", () => {
		const world = makeWorld(1000);
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "siphon_tower",
			health: { current: 200, max: 200 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.timber).toBeLessThan(100);
	});

	it("drains more with multiple siphon buildings", () => {
		const world = makeWorld(1000);
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "siphon_tower",
			health: { current: 200, max: 200 },
		});
		spawnBuilding(world, {
			x: 200,
			y: 200,
			faction: "scale_guard",
			buildingType: "great_siphon",
			health: { current: 400, max: 400 },
		});

		runSiphonSystem(world);

		// With 2 siphons, drain = 1 * 1 * 2 = 2 per resource
		expect(world.session.resources.fish).toBe(98);
	});

	it("does not drain resources when no siphon buildings exist", () => {
		const world = makeWorld(1000);
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		// Non-siphon enemy building
		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "wall",
			health: { current: 150, max: 150 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.fish).toBe(100);
		expect(world.session.resources.timber).toBe(100);
	});

	it("does not drain below zero", () => {
		const world = makeWorld(10000); // 10 seconds
		world.session.resources = { fish: 1, timber: 1, salvage: 50 };

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "siphon_tower",
			health: { current: 200, max: 200 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.fish).toBe(0);
		expect(world.session.resources.timber).toBe(0);
	});

	it("does not drain when deltaMs is 0", () => {
		const world = makeWorld(0);
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "siphon_tower",
			health: { current: 200, max: 200 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.fish).toBe(100);
	});

	it("does not count player-owned siphon buildings", () => {
		const world = makeWorld(1000);
		world.session.resources = { fish: 100, timber: 100, salvage: 50 };

		// Player-owned building with "siphon" in name should not drain
		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "captured_siphon",
			health: { current: 200, max: 200 },
		});

		runSiphonSystem(world);

		expect(world.session.resources.fish).toBe(100);
	});
});
