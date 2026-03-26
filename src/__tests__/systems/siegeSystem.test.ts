import type { Entity, World } from "koota";
import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Targeting } from "@/ecs/relations";
import { Armor, Attack, Health } from "@/ecs/traits/combat";
import { Faction, IsBuilding, IsHero, IsProjectile, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import {
	aoeSplashSystem,
	calculateSiegeDamage,
	DEMOLITION_TRAINING_MULTIPLIER,
	MORTAR_SPLASH_RADIUS,
	SAPPER_BUILDING_DAMAGE,
	SGT_FANG_BUILDING_MULTIPLIER,
	SplashRadius,
	siegeCombatSystem,
	wallBreachSystem,
} from "@/systems/siegeSystem";

describe("Siege System", () => {
	let world: World;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	// -----------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------

	function spawnUnit(
		x: number,
		y: number,
		opts: {
			type?: string;
			faction?: string;
			damage?: number;
			range?: number;
			hp?: number;
			armor?: number;
			isHero?: boolean;
		} = {},
	): Entity {
		const entity = world.spawn(
			UnitType({ type: opts.type ?? "mudfoot" }),
			Faction({ id: opts.faction ?? "ura" }),
			Position({ x, y }),
			Health({ current: opts.hp ?? 80, max: opts.hp ?? 80 }),
			Attack({
				damage: opts.damage ?? 12,
				range: opts.range ?? 1,
				cooldown: 1.0,
				timer: 0,
			}),
		);
		if (opts.armor) entity.add(Armor({ value: opts.armor }));
		if (opts.isHero) entity.add(IsHero);
		return entity;
	}

	function spawnBuilding(
		x: number,
		y: number,
		opts: {
			hp?: number;
			armor?: number;
			faction?: string;
		} = {},
	): Entity {
		const entity = world.spawn(
			IsBuilding,
			UnitType({ type: "wall" }),
			Faction({ id: opts.faction ?? "scale_guard" }),
			Position({ x, y }),
			Health({ current: opts.hp ?? 150, max: opts.hp ?? 150 }),
		);
		if (opts.armor) entity.add(Armor({ value: opts.armor }));
		return entity;
	}

	// -----------------------------------------------------------------------
	// Constants
	// -----------------------------------------------------------------------

	describe("constants", () => {
		it("Sapper base damage vs buildings is 30", () => {
			expect(SAPPER_BUILDING_DAMAGE).toBe(30);
		});

		it("Demolition Training multiplier is 1.5", () => {
			expect(DEMOLITION_TRAINING_MULTIPLIER).toBe(1.5);
		});

		it("Sgt. Fang building damage multiplier is 2", () => {
			expect(SGT_FANG_BUILDING_MULTIPLIER).toBe(2);
		});

		it("Mortar splash radius is 2", () => {
			expect(MORTAR_SPLASH_RADIUS).toBe(2);
		});
	});

	// -----------------------------------------------------------------------
	// calculateSiegeDamage
	// -----------------------------------------------------------------------

	describe("calculateSiegeDamage", () => {
		it("returns normal damage for non-sapper, non-hero units vs buildings", () => {
			// Regular mudfoot: 12 damage, 0 armor → 12
			const dmg = calculateSiegeDamage({
				baseDamage: 12,
				targetArmor: 0,
				unitType: "mudfoot",
				isHero: false,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(12);
		});

		it("Sapper uses damageVsBuildings (30) instead of base damage", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 8, // sapper's normal damage
				targetArmor: 0,
				unitType: "sapper",
				isHero: false,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(SAPPER_BUILDING_DAMAGE);
		});

		it("Sapper with Demolition Training does 45 vs buildings", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 8,
				targetArmor: 0,
				unitType: "sapper",
				isHero: false,
				completedResearch: new Set(["demolition_training"]),
			});
			expect(dmg).toBe(45); // 30 * 1.5
		});

		it("Sapper damage reduced by armor (min 1)", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 8,
				targetArmor: 25,
				unitType: "sapper",
				isHero: false,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(5); // max(1, 30 - 25)
		});

		it("Sgt. Fang deals 2x base damage vs buildings", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 15,
				targetArmor: 0,
				unitType: "sgt_fang",
				isHero: true,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(30); // 15 * 2
		});

		it("Sgt. Fang damage reduced by armor (min 1)", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 15,
				targetArmor: 28,
				unitType: "sgt_fang",
				isHero: true,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(2); // max(1, 30 - 28)
		});

		it("minimum damage is always 1", () => {
			const dmg = calculateSiegeDamage({
				baseDamage: 5,
				targetArmor: 100,
				unitType: "mudfoot",
				isHero: false,
				completedResearch: new Set(),
			});
			expect(dmg).toBe(1);
		});
	});

	// -----------------------------------------------------------------------
	// siegeCombatSystem — process attacks vs buildings with siege bonuses
	// -----------------------------------------------------------------------

	describe("siegeCombatSystem", () => {
		it("Sapper deals 30 damage to a building (siege bonus)", () => {
			const sapper = spawnUnit(0, 0, {
				type: "sapper",
				damage: 8,
				range: 1,
			});
			const wall = spawnBuilding(1, 0, { hp: 150 });
			sapper.add(Targeting(wall));

			siegeCombatSystem(world, 1.0, new Set());

			const health = wall.get(Health)!;
			expect(health.current).toBe(120); // 150 - 30
		});

		it("Sapper with Demolition Training deals 45 to building", () => {
			const sapper = spawnUnit(0, 0, {
				type: "sapper",
				damage: 8,
				range: 1,
			});
			const wall = spawnBuilding(1, 0, { hp: 150 });
			sapper.add(Targeting(wall));

			siegeCombatSystem(world, 1.0, new Set(["demolition_training"]));

			const health = wall.get(Health)!;
			expect(health.current).toBe(105); // 150 - 45
		});

		it("Sgt. Fang deals 2x damage to buildings", () => {
			const fang = spawnUnit(0, 0, {
				type: "sgt_fang",
				damage: 15,
				range: 1,
				isHero: true,
			});
			const wall = spawnBuilding(1, 0, { hp: 150 });
			fang.add(Targeting(wall));

			siegeCombatSystem(world, 1.0, new Set());

			const health = wall.get(Health)!;
			expect(health.current).toBe(120); // 150 - 30
		});

		it("regular unit deals normal damage to buildings", () => {
			const mudfoot = spawnUnit(0, 0, {
				type: "mudfoot",
				damage: 12,
				range: 1,
			});
			const wall = spawnBuilding(1, 0, { hp: 150 });
			mudfoot.add(Targeting(wall));

			siegeCombatSystem(world, 1.0, new Set());

			const health = wall.get(Health)!;
			expect(health.current).toBe(138); // 150 - 12
		});

		it("respects attack cooldown", () => {
			const sapper = spawnUnit(0, 0, {
				type: "sapper",
				damage: 8,
				range: 1,
			});
			const wall = spawnBuilding(1, 0, { hp: 150 });
			sapper.add(Targeting(wall));

			// Tick only 0.5 seconds — cooldown is 1.0
			siegeCombatSystem(world, 0.5, new Set());

			const health = wall.get(Health)!;
			expect(health.current).toBe(150); // no damage yet
		});

		it("does not fire when out of range", () => {
			const sapper = spawnUnit(0, 0, {
				type: "sapper",
				damage: 8,
				range: 1,
			});
			const wall = spawnBuilding(5, 0, { hp: 150 }); // 5 tiles away
			sapper.add(Targeting(wall));

			siegeCombatSystem(world, 1.0, new Set());

			const health = wall.get(Health)!;
			expect(health.current).toBe(150);
		});

		it("skips attacks against non-building targets (handled by combatSystem)", () => {
			const sapper = spawnUnit(0, 0, {
				type: "sapper",
				damage: 8,
				range: 1,
			});
			const enemy = spawnUnit(1, 0, {
				type: "gator",
				faction: "scale_guard",
				hp: 120,
			});
			sapper.add(Targeting(enemy));

			siegeCombatSystem(world, 1.0, new Set());

			// Enemy health unchanged — siege system only processes building targets
			const health = enemy.get(Health)!;
			expect(health.current).toBe(120);
		});
	});

	// -----------------------------------------------------------------------
	// aoeSplashSystem — AoE damage when mortar projectile lands
	// -----------------------------------------------------------------------

	describe("aoeSplashSystem", () => {
		it("damages all enemies within splash radius when projectile arrives", () => {
			// Mortar projectile with SplashRadius at position
			const proj = world.spawn(
				IsProjectile(),
				SplashRadius({ radius: MORTAR_SPLASH_RADIUS }),
				Position({ x: 5, y: 5 }),
				Attack({ damage: 20, range: 7, cooldown: 0, timer: 0 }),
				Faction({ id: "ura" }),
			);

			// Enemies within splash radius (2 tiles)
			const near1 = spawnUnit(5, 6, {
				type: "gator",
				faction: "scale_guard",
				hp: 120,
			});
			const near2 = spawnUnit(6, 5, {
				type: "skink",
				faction: "scale_guard",
				hp: 30,
			});

			// Enemy outside splash radius
			const far = spawnUnit(10, 10, {
				type: "gator",
				faction: "scale_guard",
				hp: 120,
			});

			// Ally within radius (should not be damaged)
			const ally = spawnUnit(5, 4, {
				type: "mudfoot",
				faction: "ura",
				hp: 80,
			});

			const destroyed = aoeSplashSystem(world);

			// Near enemies take damage
			expect(near1.get(Health)?.current).toBe(100); // 120 - 20
			expect(near2.get(Health)?.current).toBe(10); // 30 - 20

			// Far enemy untouched
			expect(far.get(Health)?.current).toBe(120);

			// Ally untouched
			expect(ally.get(Health)?.current).toBe(80);

			// Projectile destroyed after splash
			expect(destroyed).toContain(proj);
		});

		it("applies armor reduction to splash damage (min 1)", () => {
			world.spawn(
				IsProjectile(),
				SplashRadius({ radius: MORTAR_SPLASH_RADIUS }),
				Position({ x: 5, y: 5 }),
				Attack({ damage: 20, range: 7, cooldown: 0, timer: 0 }),
				Faction({ id: "ura" }),
			);

			const armored = spawnUnit(5, 6, {
				type: "gator",
				faction: "scale_guard",
				hp: 120,
				armor: 15,
			});

			aoeSplashSystem(world);

			expect(armored.get(Health)?.current).toBe(115); // 120 - max(1, 20-15)
		});

		it("does not process projectiles without SplashRadius", () => {
			// Regular projectile — no splash
			world.spawn(
				IsProjectile(),
				Position({ x: 5, y: 5 }),
				Attack({ damage: 20, range: 5, cooldown: 0, timer: 0 }),
				Faction({ id: "ura" }),
			);

			const enemy = spawnUnit(5, 6, {
				type: "gator",
				faction: "scale_guard",
				hp: 120,
			});

			const destroyed = aoeSplashSystem(world);

			expect(enemy.get(Health)?.current).toBe(120);
			expect(destroyed.length).toBe(0);
		});

		it("splash damages buildings too", () => {
			world.spawn(
				IsProjectile(),
				SplashRadius({ radius: MORTAR_SPLASH_RADIUS }),
				Position({ x: 5, y: 5 }),
				Attack({ damage: 20, range: 7, cooldown: 0, timer: 0 }),
				Faction({ id: "ura" }),
			);

			const building = spawnBuilding(6, 5, { hp: 150, faction: "scale_guard" });

			aoeSplashSystem(world);

			expect(building.get(Health)?.current).toBe(130); // 150 - 20
		});
	});

	// -----------------------------------------------------------------------
	// wallBreachSystem — destroyed walls update terrain to passable
	// -----------------------------------------------------------------------

	describe("wallBreachSystem", () => {
		it("marks wall tile as passable when wall HP reaches 0", () => {
			const tiles: string[][] = [
				["grass", "grass", "grass"],
				["grass", "wall", "grass"],
				["grass", "grass", "grass"],
			];

			const wall = spawnBuilding(1, 1, { hp: 0, faction: "scale_guard" });

			const breached = wallBreachSystem(world, tiles);

			expect(breached.length).toBe(1);
			expect(breached[0]).toBe(wall);
			// Tile should be updated to grass (passable)
			expect(tiles[1][1]).toBe("grass");
		});

		it("does NOT breach walls with HP > 0", () => {
			const tiles: string[][] = [
				["grass", "grass", "grass"],
				["grass", "wall", "grass"],
				["grass", "grass", "grass"],
			];

			spawnBuilding(1, 1, { hp: 50, faction: "scale_guard" });

			const breached = wallBreachSystem(world, tiles);

			expect(breached.length).toBe(0);
			expect(tiles[1][1]).toBe("wall");
		});

		it("handles multiple walls breaching simultaneously", () => {
			const tiles: string[][] = [
				["wall", "grass", "wall"],
				["grass", "grass", "grass"],
			];

			spawnBuilding(0, 0, { hp: 0 });
			spawnBuilding(2, 0, { hp: 0 });

			const breached = wallBreachSystem(world, tiles);

			expect(breached.length).toBe(2);
			expect(tiles[0][0]).toBe("grass");
			expect(tiles[0][2]).toBe("grass");
		});

		it("skips non-building entities", () => {
			const tiles: string[][] = [["grass"]];

			// A unit with 0 HP (should not trigger wall breach)
			spawnUnit(0, 0, { hp: 0, faction: "scale_guard" });

			const breached = wallBreachSystem(world, tiles);

			expect(breached.length).toBe(0);
		});
	});
});
