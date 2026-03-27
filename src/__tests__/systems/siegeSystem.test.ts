/**
 * Siege System Tests — ported from old Koota codebase.
 *
 * Tests siege damage multiplier for siege-tagged entities attacking buildings.
 */

import { describe, expect, it } from "vitest";
import { Attack, Flags, Health } from "@/engine/world/components";
import {
	createGameWorld,
	getOrderQueue,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { runSiegeSystem } from "@/engine/systems/siegeSystem";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/siegeSystem", () => {
	it("doubles damage for siege-tagged entities attacking buildings", () => {
		const world = makeWorld();

		const siegeUnit = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "siege_ram",
			health: { current: 100, max: 100 },
		});
		Attack.damage[siegeUnit] = 10;

		const building = spawnBuilding(world, {
			x: 30,
			y: 0,
			faction: "scale_guard",
			buildingType: "wall",
			health: { current: 150, max: 150 },
		});

		const orders = getOrderQueue(world, siegeUnit);
		orders.push({ type: "attack", targetEid: building });

		runSiegeSystem(world);

		// Damage should be doubled (10 * 2.0 = 20)
		expect(Attack.damage[siegeUnit]).toBe(20);
	});

	it("does not boost damage against non-building targets", () => {
		const world = makeWorld();

		const siegeUnit = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "siege_ram",
			health: { current: 100, max: 100 },
		});
		Attack.damage[siegeUnit] = 10;

		const enemy = spawnUnit(world, {
			x: 30,
			y: 0,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		const orders = getOrderQueue(world, siegeUnit);
		orders.push({ type: "attack", targetEid: enemy });

		runSiegeSystem(world);

		// Damage should NOT be boosted (target is not a building)
		expect(Attack.damage[siegeUnit]).toBe(10);
	});

	it("does not affect non-siege units", () => {
		const world = makeWorld();

		const normalUnit = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "mudfoot",
			health: { current: 100, max: 100 },
		});
		Attack.damage[normalUnit] = 12;

		const building = spawnBuilding(world, {
			x: 30,
			y: 0,
			faction: "scale_guard",
			buildingType: "wall",
			health: { current: 150, max: 150 },
		});

		const orders = getOrderQueue(world, normalUnit);
		orders.push({ type: "attack", targetEid: building });

		runSiegeSystem(world);

		// Non-siege unit should not get bonus
		expect(Attack.damage[normalUnit]).toBe(12);
	});

	it("skips entities with no orders", () => {
		const world = makeWorld();

		const siegeUnit = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "siege_ram",
			health: { current: 100, max: 100 },
		});
		Attack.damage[siegeUnit] = 10;

		// No orders
		runSiegeSystem(world);

		expect(Attack.damage[siegeUnit]).toBe(10);
	});

	it("skips entities with non-attack orders", () => {
		const world = makeWorld();

		const siegeUnit = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "siege_ram",
			health: { current: 100, max: 100 },
		});
		Attack.damage[siegeUnit] = 10;

		const orders = getOrderQueue(world, siegeUnit);
		orders.push({ type: "move", targetX: 100, targetY: 0 });

		runSiegeSystem(world);

		expect(Attack.damage[siegeUnit]).toBe(10);
	});

	it("skips dead targets", () => {
		const world = makeWorld();

		const siegeUnit = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "siege_ram",
			health: { current: 100, max: 100 },
		});
		Attack.damage[siegeUnit] = 10;

		const orders = getOrderQueue(world, siegeUnit);
		orders.push({ type: "attack", targetEid: 9999 }); // non-existent

		runSiegeSystem(world);

		expect(Attack.damage[siegeUnit]).toBe(10);
	});
});
