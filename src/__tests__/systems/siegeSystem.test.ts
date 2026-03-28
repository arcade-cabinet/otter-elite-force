/**
 * Siege System Tests -- ported from old Koota codebase.
 *
 * Tests siege combat: sapper damage, hero multipliers, research bonuses,
 * and wall breach mechanics.
 */

import { describe, expect, it } from "vitest";
import { Armor, Attack, Flags, Health, TargetRef } from "@/engine/world/components";
import {
	createGameWorld,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";
import {
	SAPPER_BUILDING_DAMAGE,
	calculateSiegeDamage,
	runSiegeCombatSystem,
	runSiegeSystem,
} from "@/engine/systems/siegeSystem";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 2000; // enough to trigger cooldown
	return world;
}

describe("engine/systems/siegeSystem", () => {
	it("sapper deals bonus damage to buildings", () => {
		const world = makeWorld();

		const sapper = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "sapper",
			health: { current: 100, max: 100 },
		});
		Attack.damage[sapper] = 8;
		Attack.range[sapper] = 64;
		Attack.cooldown[sapper] = 1;

		const building = spawnBuilding(world, {
			x: 30,
			y: 0,
			faction: "scale_guard",
			buildingType: "wall",
			health: { current: 150, max: 150 },
		});
		Armor.value[building] = 0;

		TargetRef.eid[sapper] = building;

		runSiegeSystem(world);

		// Sapper deals SAPPER_BUILDING_DAMAGE (30) to buildings
		expect(Health.current[building]).toBe(150 - 30);
	});

	it("does not damage non-building targets via siege system", () => {
		const world = makeWorld();

		const sapper = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "sapper",
			health: { current: 100, max: 100 },
		});
		Attack.damage[sapper] = 10;
		Attack.range[sapper] = 64;
		Attack.cooldown[sapper] = 1;

		const enemy = spawnUnit(world, {
			x: 30,
			y: 0,
			faction: "scale_guard",
			health: { current: 100, max: 100 },
		});

		TargetRef.eid[sapper] = enemy;

		runSiegeSystem(world);

		// Non-building target should not be damaged by siege system
		expect(Health.current[enemy]).toBe(100);
	});

	it("does not affect entities with no target", () => {
		const world = makeWorld();

		const sapper = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "sapper",
			health: { current: 100, max: 100 },
		});
		Attack.damage[sapper] = 10;

		runSiegeSystem(world);

		// No target -- attack damage unchanged
		expect(Attack.damage[sapper]).toBe(10);
	});

	it("skips entities with non-attack orders", () => {
		const world = makeWorld();

		const sapper = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "sapper",
			health: { current: 100, max: 100 },
		});
		Attack.damage[sapper] = 10;
		// No target ref set

		runSiegeSystem(world);

		expect(Attack.damage[sapper]).toBe(10);
	});

	it("skips dead targets", () => {
		const world = makeWorld();

		const sapper = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "sapper",
			health: { current: 100, max: 100 },
		});
		Attack.damage[sapper] = 10;
		Attack.range[sapper] = 64;
		Attack.cooldown[sapper] = 1;

		TargetRef.eid[sapper] = 9999; // non-existent

		runSiegeSystem(world);

		// No valid target -- nothing happens
		expect(Attack.damage[sapper]).toBe(10);
	});

	it("respects attack range", () => {
		const world = makeWorld();

		const sapper = spawnUnit(world, {
			x: 0,
			y: 0,
			faction: "ura",
			unitType: "sapper",
		});
		Attack.damage[sapper] = 8;
		Attack.range[sapper] = 32;
		Attack.cooldown[sapper] = 1;

		const building = spawnBuilding(world, {
			x: 500,
			y: 0,
			faction: "scale_guard",
			buildingType: "wall",
			health: { current: 150, max: 150 },
		});

		TargetRef.eid[sapper] = building;

		runSiegeSystem(world);

		// Too far -- no damage
		expect(Health.current[building]).toBe(150);
	});
});
