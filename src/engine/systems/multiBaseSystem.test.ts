import { beforeEach, describe, expect, it } from "vitest";
import { FACTION_IDS } from "@/engine/content/ids";
import { Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import {
	type MultiBaseRuntime,
	canPlaceSecondaryCP,
	createSupplyCaravan,
	findNearestCPGlobal,
	findNearestCPInRadius,
	getCaravanCargo,
	registerCommandPost,
	resetMultiBaseState,
	runMultiBaseSystem,
} from "./multiBaseSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	world.session.phase = "playing";
	return world;
}

/** Create a command post building at the given position. */
function createCP(
	world: ReturnType<typeof createGameWorld>,
	x: number,
	y: number,
	faction: string = "ura",
) {
	return spawnBuilding(world, {
		x,
		y,
		faction,
		buildingType: "command_post",
		health: { current: 500, max: 500 },
	});
}

describe("engine/systems/multiBaseSystem", () => {
	describe("findNearestCPInRadius", () => {
		it("finds nearest CP within collection radius", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 10, 10);
			registerCommandPost(world, cp1, 8);

			const cp2 = createCP(world, 30, 30);
			registerCommandPost(world, cp2, 8);

			// Worker near CP1
			const result = findNearestCPInRadius(world, 12, 10);
			expect(result).toBe(cp1);
		});

		it("returns -1 when no CP covers the worker position", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 10, 10);
			registerCommandPost(world, cp1, 5);

			// Worker far from CP
			const result = findNearestCPInRadius(world, 50, 50);
			expect(result).toBe(-1);
		});

		it("skips dead command posts", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 10, 10);
			registerCommandPost(world, cp1, 15);
			Health.current[cp1] = 0; // Dead

			const result = findNearestCPInRadius(world, 10, 10);
			expect(result).toBe(-1);
		});
	});

	describe("findNearestCPGlobal", () => {
		it("finds nearest CP regardless of radius", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 10, 10);
			const cp2 = createCP(world, 50, 50);

			const result = findNearestCPGlobal(world, 12, 10);
			expect(result).toBe(cp1);
		});

		it("returns -1 when no CPs exist", () => {
			const world = makeWorld(0);
			const result = findNearestCPGlobal(world, 10, 10);
			expect(result).toBe(-1);
		});

		it("skips dead command posts", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 10, 10);
			Health.current[cp1] = 0;

			const result = findNearestCPGlobal(world, 10, 10);
			expect(result).toBe(-1);
		});
	});

	describe("canPlaceSecondaryCP", () => {
		it("allows placement at valid location with no nearby CPs", () => {
			const world = makeWorld(0);

			const runtime = world.runtime as unknown as MultiBaseRuntime;
			runtime.cpLocations = [{ id: "outpost_alpha", x: 50, y: 50 }];

			expect(canPlaceSecondaryCP(world, "outpost_alpha")).toBe(true);
		});

		it("rejects placement for unknown location ID", () => {
			const world = makeWorld(0);

			const runtime = world.runtime as unknown as MultiBaseRuntime;
			runtime.cpLocations = [{ id: "outpost_alpha", x: 50, y: 50 }];

			expect(canPlaceSecondaryCP(world, "nonexistent")).toBe(false);
		});

		it("rejects placement when CP already exists at location", () => {
			const world = makeWorld(0);

			const runtime = world.runtime as unknown as MultiBaseRuntime;
			runtime.cpLocations = [{ id: "outpost_alpha", x: 50, y: 50 }];

			createCP(world, 50, 50);

			expect(canPlaceSecondaryCP(world, "outpost_alpha")).toBe(false);
		});

		it("returns false when no locations are configured", () => {
			const world = makeWorld(0);
			expect(canPlaceSecondaryCP(world, "anything")).toBe(false);
		});
	});

	describe("supply caravans", () => {
		it("creates a caravan at the first CP position", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 10, 10);
			const cp2 = createCP(world, 50, 50);

			const caravanEid = createSupplyCaravan(world, [cp1, cp2]);

			expect(Position.x[caravanEid]).toBe(10);
			expect(Position.y[caravanEid]).toBe(10);
			expect(world.runtime.entityTypeIndex.get(caravanEid)).toBe("supply_caravan");
		});

		it("throws when route has fewer than 2 CPs", () => {
			const world = makeWorld(0);
			const cp1 = createCP(world, 10, 10);

			expect(() => createSupplyCaravan(world, [cp1])).toThrow();
		});

		it("moves caravan toward destination CP", () => {
			const world = makeWorld(1000); // 1s delta

			const cp1 = createCP(world, 0, 0);
			const cp2 = createCP(world, 100, 0);

			const caravanEid = createSupplyCaravan(world, [cp1, cp2], 10);

			runMultiBaseSystem(world);

			// Should have moved toward cp2 (right)
			expect(Position.x[caravanEid]).toBeGreaterThan(0);
			expect(Position.y[caravanEid]).toBe(0);
		});

		it("delivers cargo when caravan arrives at destination", () => {
			const world = makeWorld(100); // small delta

			const cp1 = createCP(world, 0, 0);
			const cp2 = createCP(world, 0.5, 0); // Very close

			world.session.resources.fish = 50;

			const caravanEid = createSupplyCaravan(world, [cp1, cp2], 10, 20);

			// First tick: caravan picks up from cp1 area (fish=50, picks up 20)
			// and moves to cp2. Since they're very close, it should arrive.
			// But the caravan starts at cp1 heading to cp2.

			// Manually set cargo for delivery test
			const runtime = world.runtime as unknown as MultiBaseRuntime;
			runtime.caravans![0].carryingType = "fish";
			runtime.caravans![0].carryingAmount = 15;

			// Position caravan at cp2
			Position.x[caravanEid] = 0.5;
			Position.y[caravanEid] = 0;

			runMultiBaseSystem(world);

			// Should have delivered 15 fish
			const deliverEvents = world.events.filter((e) => e.type === "caravan-delivered");
			expect(deliverEvents).toHaveLength(1);
			expect(deliverEvents[0].payload?.amount).toBe(15);
		});

		it("picks up most abundant resource", () => {
			const world = makeWorld(100);

			const cp1 = createCP(world, 0, 0);
			const cp2 = createCP(world, 0.5, 0);

			world.session.resources.fish = 10;
			world.session.resources.timber = 30;
			world.session.resources.salvage = 5;

			const caravanEid = createSupplyCaravan(world, [cp1, cp2], 10, 20);

			// Position at cp2 with empty cargo (will trigger pickup after delivery check)
			Position.x[caravanEid] = 0.5;
			Position.y[caravanEid] = 0;

			runMultiBaseSystem(world);

			// Should pick up timber (most abundant)
			const pickupEvents = world.events.filter((e) => e.type === "caravan-pickup");
			expect(pickupEvents).toHaveLength(1);
			expect(pickupEvents[0].payload?.resourceType).toBe("timber");
			expect(pickupEvents[0].payload?.amount).toBe(20);

			// Timber should be deducted
			expect(world.session.resources.timber).toBe(10);
		});

		it("loses cargo when caravan is destroyed", () => {
			const world = makeWorld(100);

			const cp1 = createCP(world, 0, 0);
			const cp2 = createCP(world, 100, 0);

			const caravanEid = createSupplyCaravan(world, [cp1, cp2]);

			// Give caravan some cargo
			const runtime = world.runtime as unknown as MultiBaseRuntime;
			runtime.caravans![0].carryingType = "fish";
			runtime.caravans![0].carryingAmount = 15;

			// Kill the caravan
			world.runtime.alive.delete(caravanEid);

			runMultiBaseSystem(world);

			const destroyEvents = world.events.filter((e) => e.type === "caravan-destroyed");
			expect(destroyEvents).toHaveLength(1);
			expect(destroyEvents[0].payload?.lostAmount).toBe(15);

			// Caravan should be removed from tracking
			expect(runtime.caravans).toHaveLength(0);
		});

		it("skips destroyed destination CPs", () => {
			const world = makeWorld(1000);

			const cp1 = createCP(world, 0, 0);
			const cp2 = createCP(world, 50, 0);
			const cp3 = createCP(world, 100, 0);

			const caravanEid = createSupplyCaravan(world, [cp1, cp2, cp3], 5);

			// Destroy cp2
			Health.current[cp2] = 0;

			runMultiBaseSystem(world);

			// Caravan should skip cp2 and head toward cp3
			const runtime = world.runtime as unknown as MultiBaseRuntime;
			expect(runtime.caravans![0].routeIndex).toBe(2);
		});

		it("getCaravanCargo returns current cargo", () => {
			const world = makeWorld(0);

			const cp1 = createCP(world, 0, 0);
			const cp2 = createCP(world, 100, 0);

			const caravanEid = createSupplyCaravan(world, [cp1, cp2]);

			const runtime = world.runtime as unknown as MultiBaseRuntime;
			runtime.caravans![0].carryingType = "timber";
			runtime.caravans![0].carryingAmount = 10;

			const cargo = getCaravanCargo(world, caravanEid);
			expect(cargo.type).toBe("timber");
			expect(cargo.amount).toBe(10);
		});

		it("getCaravanCargo returns empty for unknown eid", () => {
			const world = makeWorld(0);
			const cargo = getCaravanCargo(world, 9999);
			expect(cargo.type).toBe("");
			expect(cargo.amount).toBe(0);
		});
	});

	describe("all-bases-lost detection", () => {
		it("emits all-bases-lost when no player bases remain", () => {
			const world = makeWorld(1000);

			// No player buildings at all
			runMultiBaseSystem(world);

			const lostEvents = world.events.filter((e) => e.type === "all-bases-lost");
			expect(lostEvents).toHaveLength(1);
		});

		it("does not emit when player bases exist", () => {
			const world = makeWorld(1000);

			createCP(world, 10, 10, "ura");

			runMultiBaseSystem(world);

			const lostEvents = world.events.filter((e) => e.type === "all-bases-lost");
			expect(lostEvents).toHaveLength(0);
		});

		it("does not emit when game is not in playing phase", () => {
			const world = makeWorld(1000);
			world.session.phase = "victory";

			runMultiBaseSystem(world);

			const lostEvents = world.events.filter((e) => e.type === "all-bases-lost");
			expect(lostEvents).toHaveLength(0);
		});
	});

	it("resets multi-base state cleanly", () => {
		const world = makeWorld(0);

		const cp1 = createCP(world, 0, 0);
		registerCommandPost(world, cp1);

		resetMultiBaseState(world);

		const runtime = world.runtime as unknown as MultiBaseRuntime;
		expect(runtime.cpRadii).toBeUndefined();
		expect(runtime.caravans).toBeUndefined();
		expect(runtime.cpLocations).toBeUndefined();
	});
});
