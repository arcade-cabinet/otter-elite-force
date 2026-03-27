import { describe, expect, it } from "vitest";
import { Armor, Attack, Flags, Health, Position, TargetRef } from "@/engine/world/components";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import {
	DEMOLITION_TRAINING_MULTIPLIER,
	SAPPER_BUILDING_DAMAGE,
	SGT_FANG_BUILDING_MULTIPLIER,
	calculateSiegeDamage,
	runSiegeCombatSystem,
	runSiegeSystem,
	runWallBreachSystem,
} from "./siegeSystem";

describe("engine/systems/siegeSystem", () => {
	describe("calculateSiegeDamage", () => {
		it("returns sapper building damage for sapper units", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 8,
				targetArmor: 5,
				unitType: "sapper",
				isHero: false,
				completedResearch: new Set(),
			});
			// SAPPER_BUILDING_DAMAGE (30) - armor (5) = 25
			expect(dmg).toBe(25);
		});

		it("applies demolition training multiplier to sapper damage", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 8,
				targetArmor: 0,
				unitType: "sapper",
				isHero: false,
				completedResearch: new Set(["demolition_training"]),
			});
			// 30 * 1.5 = 45
			expect(dmg).toBe(SAPPER_BUILDING_DAMAGE * DEMOLITION_TRAINING_MULTIPLIER);
		});

		it("applies sgt_fang hero multiplier", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 10,
				targetArmor: 0,
				unitType: "sgt_fang",
				isHero: true,
				completedResearch: new Set(),
			});
			// 10 * 2 = 20
			expect(dmg).toBe(10 * SGT_FANG_BUILDING_MULTIPLIER);
		});

		it("applies normal damage for regular units", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 10,
				targetArmor: 3,
				unitType: "mudfoot",
				isHero: false,
				completedResearch: new Set(),
			});
			// 10 - 3 = 7
			expect(dmg).toBe(7);
		});

		it("enforces minimum 1 damage", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 2,
				targetArmor: 100,
				unitType: "mudfoot",
				isHero: false,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(1);
		});
	});

	describe("runSiegeCombatSystem", () => {
		it("applies siege damage to building targets with cooldown", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000; // 2 seconds

			const sapper = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				unitType: "sapper",
			});
			Attack.damage[sapper] = 8;
			Attack.range[sapper] = 64;
			Attack.cooldown[sapper] = 1; // 1 second cooldown
			Attack.timer[sapper] = 0;

			const building = spawnBuilding(world, {
				x: 120,
				y: 100,
				faction: "scale_guard",
				buildingType: "barracks",
				health: { current: 200, max: 200 },
			});
			Armor.value[building] = 5;

			// Set target
			TargetRef.eid[sapper] = building;

			runSiegeCombatSystem(world);

			// Sapper deals 30 - 5 = 25 damage
			expect(Health.current[building]).toBe(200 - 25);

			const siegeEvent = world.events.find((e) => e.type === "siege-hit");
			expect(siegeEvent).toBeDefined();
		});

		it("does not attack non-building targets", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000;

			const attacker = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				unitType: "sapper",
			});
			Attack.damage[attacker] = 8;
			Attack.range[attacker] = 64;
			Attack.cooldown[attacker] = 1;

			const enemy = spawnUnit(world, {
				x: 120,
				y: 100,
				faction: "scale_guard",
				health: { current: 50, max: 50 },
			});

			TargetRef.eid[attacker] = enemy;

			runSiegeCombatSystem(world);

			// Unit target should not be damaged by siege system
			expect(Health.current[enemy]).toBe(50);
		});

		it("respects attack range", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000;

			const sapper = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				unitType: "sapper",
			});
			Attack.damage[sapper] = 8;
			Attack.range[sapper] = 32; // short range
			Attack.cooldown[sapper] = 1;

			const building = spawnBuilding(world, {
				x: 500,
				y: 100,
				faction: "scale_guard",
				buildingType: "wall_segment",
				health: { current: 100, max: 100 },
			});

			TargetRef.eid[sapper] = building;

			runSiegeCombatSystem(world);

			// Too far -- no damage
			expect(Health.current[building]).toBe(100);
		});

		it("uses sgt_fang hero multiplier", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000;

			const hero = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				unitType: "sgt_fang",
			});
			Attack.damage[hero] = 12;
			Attack.range[hero] = 64;
			Attack.cooldown[hero] = 1;

			const building = spawnBuilding(world, {
				x: 120,
				y: 100,
				faction: "scale_guard",
				buildingType: "barracks",
				health: { current: 200, max: 200 },
			});
			Armor.value[building] = 0;

			TargetRef.eid[hero] = building;

			runSiegeCombatSystem(world);

			// Sgt. Fang: 12 * 2 = 24 damage
			expect(Health.current[building]).toBe(200 - 24);
		});

		it("applies demolition training research bonus", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000;
			world.runtime.completedResearch.add("demolition_training");

			const sapper = spawnUnit(world, {
				x: 100,
				y: 100,
				faction: "ura",
				unitType: "sapper",
			});
			Attack.damage[sapper] = 8;
			Attack.range[sapper] = 64;
			Attack.cooldown[sapper] = 1;

			const building = spawnBuilding(world, {
				x: 120,
				y: 100,
				faction: "scale_guard",
				buildingType: "barracks",
				health: { current: 200, max: 200 },
			});
			Armor.value[building] = 0;

			TargetRef.eid[sapper] = building;

			runSiegeCombatSystem(world);

			// Sapper with demo training: 30 * 1.5 = 45
			expect(Health.current[building]).toBe(200 - 45);
		});
	});

	describe("runWallBreachSystem", () => {
		it("converts destroyed wall tiles to passable terrain", () => {
			const world = createGameWorld();

			// Create a small terrain grid
			world.runtime.terrainGrid = [
				[0, 0, 0],
				[0, 1, 0], // 1 = wall tile
				[0, 0, 0],
			];

			// Spawn a destroyed wall building at tile (1,1)
			const wall = spawnBuilding(world, {
				x: 1 * 32 + 16,
				y: 1 * 32 + 16,
				faction: "scale_guard",
				buildingType: "wall_segment",
				health: { current: 0, max: 100 },
			});

			const breached = runWallBreachSystem(world);

			expect(breached).toBe(1);
			expect(world.runtime.terrainGrid[1][1]).toBe(0);

			const breachEvent = world.events.find((e) => e.type === "wall-breached");
			expect(breachEvent).toBeDefined();
		});

		it("ignores non-wall buildings", () => {
			const world = createGameWorld();

			world.runtime.terrainGrid = [
				[0, 0],
				[0, 1],
			];

			// Spawn a destroyed non-wall building
			spawnBuilding(world, {
				x: 1 * 32 + 16,
				y: 1 * 32 + 16,
				faction: "scale_guard",
				buildingType: "barracks",
				health: { current: 0, max: 100 },
			});

			const breached = runWallBreachSystem(world);
			expect(breached).toBe(0);
		});

		it("ignores wall buildings that are still alive", () => {
			const world = createGameWorld();

			world.runtime.terrainGrid = [
				[0, 0],
				[0, 1],
			];

			spawnBuilding(world, {
				x: 1 * 32 + 16,
				y: 1 * 32 + 16,
				faction: "scale_guard",
				buildingType: "wall_segment",
				health: { current: 50, max: 100 },
			});

			const breached = runWallBreachSystem(world);
			expect(breached).toBe(0);
			expect(world.runtime.terrainGrid[1][1]).toBe(1);
		});

		it("returns 0 when no terrain grid exists", () => {
			const world = createGameWorld();
			const breached = runWallBreachSystem(world);
			expect(breached).toBe(0);
		});
	});

	describe("runSiegeSystem (unified)", () => {
		it("runs both siege combat and wall breach systems", () => {
			const world = createGameWorld();
			world.time.deltaMs = 2000;
			world.runtime.terrainGrid = [[0]];

			// Just verify it doesn't throw
			runSiegeSystem(world);
		});
	});
});
