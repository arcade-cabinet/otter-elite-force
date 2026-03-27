/**
 * Multi-Base System Tests — ported from old Koota codebase.
 *
 * Tests tracking of multiple player bases and all-bases-lost detection.
 */

import { describe, expect, it } from "vitest";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import { runMultiBaseSystem } from "@/engine/systems/multiBaseSystem";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	world.session.phase = "playing";
	return world;
}

describe("engine/systems/multiBaseSystem", () => {
	it("emits all-bases-lost when no player bases remain", () => {
		const world = makeWorld();
		// No buildings at all

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(true);
	});

	it("does not emit when player has a command_post", () => {
		const world = makeWorld();

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 600, max: 600 },
		});

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(false);
	});

	it("does not emit when player has a burrow", () => {
		const world = makeWorld();

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "burrow",
			health: { current: 400, max: 400 },
		});

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(false);
	});

	it("ignores non-base buildings (barracks, watchtower, etc.)", () => {
		const world = makeWorld();

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "barracks",
			health: { current: 350, max: 350 },
		});

		runMultiBaseSystem(world);

		// Barracks is not a base — should still emit all-bases-lost
		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(true);
	});

	it("ignores enemy bases", () => {
		const world = makeWorld();

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			buildingType: "command_post",
			health: { current: 600, max: 600 },
		});

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(true);
	});

	it("does not emit when phase is not 'playing'", () => {
		const world = makeWorld();
		world.session.phase = "loading";
		// No buildings

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(false);
	});

	it("tracks multiple bases correctly", () => {
		const world = makeWorld();

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 600, max: 600 },
		});
		spawnBuilding(world, {
			x: 300,
			y: 300,
			faction: "ura",
			buildingType: "burrow",
			health: { current: 400, max: 400 },
		});

		runMultiBaseSystem(world);

		expect(world.events.some((e) => e.type === "all-bases-lost")).toBe(false);
	});
});
