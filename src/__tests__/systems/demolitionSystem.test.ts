import type { Entity, World } from "koota";
import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Armor, Health } from "@/ecs/traits/combat";
import { Faction, IsBuilding, IsHero, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import {
	applyExplosion,
	CHAIN_EXPLOSION_RADIUS,
	CHARGE_COUNTDOWN,
	CHARGE_DAMAGE,
	CHARGE_RADIUS,
	ChainExplosionRadius,
	ChargeTimer,
	chargeTickSystem,
	IsCharge,
	IsExplosive,
	placeCharge,
} from "@/systems/demolitionSystem";

describe("Demolition System", () => {
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
		);
		if (opts.armor) entity.add(Armor({ value: opts.armor }));
		if (opts.isHero) entity.add(IsHero);
		return entity;
	}

	function spawnBuilding(
		x: number,
		y: number,
		opts: {
			type?: string;
			hp?: number;
			faction?: string;
			explosive?: boolean;
			chainRadius?: number;
		} = {},
	): Entity {
		const entity = world.spawn(
			IsBuilding,
			UnitType({ type: opts.type ?? "scale_wall" }),
			Faction({ id: opts.faction ?? "scale_guard" }),
			Position({ x, y }),
			Health({ current: opts.hp ?? 300, max: opts.hp ?? 300 }),
		);
		if (opts.explosive) {
			entity.add(IsExplosive);
			entity.add(ChainExplosionRadius({ radius: opts.chainRadius ?? CHAIN_EXPLOSION_RADIUS }));
		}
		return entity;
	}

	// -----------------------------------------------------------------------
	// Constants
	// -----------------------------------------------------------------------

	describe("constants", () => {
		it("charge countdown is 10 seconds", () => {
			expect(CHARGE_COUNTDOWN).toBe(10);
		});

		it("charge damage is 100", () => {
			expect(CHARGE_DAMAGE).toBe(100);
		});

		it("charge blast radius is 3 tiles", () => {
			expect(CHARGE_RADIUS).toBe(3);
		});

		it("chain explosion radius is 2 tiles", () => {
			expect(CHAIN_EXPLOSION_RADIUS).toBe(2);
		});
	});

	// -----------------------------------------------------------------------
	// placeCharge
	// -----------------------------------------------------------------------

	describe("placeCharge", () => {
		it("creates a charge entity at the specified tile", () => {
			const muskrat = spawnUnit(0, 0, { type: "pvt_muskrat", isHero: true });
			const charge = placeCharge(world, muskrat, 5, 5);

			expect(charge.has(IsCharge)).toBe(true);
			expect(charge.has(ChargeTimer)).toBe(true);

			const timer = charge.get(ChargeTimer)!;
			expect(timer.remaining).toBe(CHARGE_COUNTDOWN);

			const pos = charge.get(Position)!;
			expect(pos.x).toBe(5);
			expect(pos.y).toBe(5);
		});

		it("charge has the same faction as the placer", () => {
			const muskrat = spawnUnit(0, 0, { type: "pvt_muskrat", faction: "ura" });
			const charge = placeCharge(world, muskrat, 3, 3);

			const faction = charge.get(Faction)!;
			expect(faction.id).toBe("ura");
		});
	});

	// -----------------------------------------------------------------------
	// chargeTickSystem
	// -----------------------------------------------------------------------

	describe("chargeTickSystem", () => {
		it("decrements timer each tick", () => {
			const muskrat = spawnUnit(0, 0, { type: "pvt_muskrat" });
			const charge = placeCharge(world, muskrat, 5, 5);

			chargeTickSystem(world, 3.0);

			const timer = charge.get(ChargeTimer)!;
			expect(timer.remaining).toBe(7); // 10 - 3
		});

		it("does not explode before timer reaches 0", () => {
			const muskrat = spawnUnit(10, 10, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			const enemy = spawnUnit(5, 6, { type: "gator", faction: "scale_guard", hp: 120 });

			const result = chargeTickSystem(world, 5.0);

			expect(result.explosions.length).toBe(0);
			expect(enemy.get(Health)?.current).toBe(120);
		});

		it("explodes when timer reaches 0 — deals 100 damage to all entities in radius", () => {
			const muskrat = spawnUnit(10, 10, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			// Enemy within 3-tile radius
			const enemy = spawnUnit(5, 7, { type: "gator", faction: "scale_guard", hp: 120 });
			// Ally within radius — ALSO takes damage (friend and foe)
			const ally = spawnUnit(6, 5, { type: "mudfoot", faction: "ura", hp: 80 });

			const result = chargeTickSystem(world, 10.0);

			expect(result.explosions.length).toBe(1);
			expect(enemy.get(Health)?.current).toBe(20); // 120 - 100
			expect(ally.get(Health)?.current).toBe(-20); // 80 - 100
		});

		it("charge entity is destroyed after detonation", () => {
			const muskrat = spawnUnit(10, 10, { type: "pvt_muskrat" });
			const charge = placeCharge(world, muskrat, 5, 5);

			chargeTickSystem(world, 10.0);

			expect(charge.isAlive()).toBe(false);
		});

		it("entities outside blast radius are unaffected", () => {
			const muskrat = spawnUnit(10, 10, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			const farEnemy = spawnUnit(20, 20, { type: "gator", faction: "scale_guard", hp: 120 });

			chargeTickSystem(world, 10.0);

			expect(farEnemy.get(Health)?.current).toBe(120);
		});

		it("armor reduces explosion damage (min 1)", () => {
			const muskrat = spawnUnit(10, 10, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			const armored = spawnUnit(5, 6, {
				type: "gator",
				faction: "scale_guard",
				hp: 200,
				armor: 90,
			});

			chargeTickSystem(world, 10.0);

			expect(armored.get(Health)?.current).toBe(190); // 200 - max(1, 100 - 90)
		});

		it("destroys buildings instantly (sets HP to 0)", () => {
			const muskrat = spawnUnit(10, 10, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			const building = spawnBuilding(5, 6, { hp: 500 });

			chargeTickSystem(world, 10.0);

			expect(building.get(Health)?.current).toBe(0);
		});
	});

	// -----------------------------------------------------------------------
	// Chain explosions
	// -----------------------------------------------------------------------

	describe("chain explosions", () => {
		it("IsExplosive building triggers secondary explosion when destroyed", () => {
			const muskrat = spawnUnit(20, 20, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			// Gas Depot with IsExplosive, within charge blast radius
			spawnBuilding(5, 7, {
				type: "gas_depot",
				hp: 300,
				explosive: true,
				chainRadius: 2,
			});

			// Enemy near the gas depot but outside charge radius
			const nearGasDepot = spawnUnit(5, 9, {
				type: "skink",
				faction: "scale_guard",
				hp: 30,
			});

			const result = chargeTickSystem(world, 10.0);

			// Should have 2 explosions: charge + chain
			expect(result.explosions.length).toBe(2);
			// Enemy near gas depot should be hit by chain explosion
			expect(nearGasDepot.get(Health)?.current).toBeLessThan(30);
		});

		it("chain explosion does not cascade infinitely (max depth 1)", () => {
			const muskrat = spawnUnit(20, 20, { type: "pvt_muskrat" });
			placeCharge(world, muskrat, 5, 5);

			// Two explosive buildings close together
			spawnBuilding(5, 7, { type: "gas_depot", hp: 300, explosive: true });
			spawnBuilding(5, 8, { type: "gas_depot", hp: 300, explosive: true });

			const result = chargeTickSystem(world, 10.0);

			// Chain from first gas depot can hit second, but second doesn't chain further
			// Max: 1 charge + up to N chain explosions from directly destroyed explosive buildings
			// But chain explosions don't trigger further chains
			expect(result.explosions.length).toBeLessThanOrEqual(3);
		});
	});

	// -----------------------------------------------------------------------
	// Escape mechanic
	// -----------------------------------------------------------------------

	describe("escape mechanic", () => {
		it("flags muskratInBlast when Pvt. Muskrat is within blast radius", () => {
			const muskrat = spawnUnit(5, 6, { type: "pvt_muskrat", isHero: true });
			placeCharge(world, muskrat, 5, 5);

			const result = chargeTickSystem(world, 10.0);

			expect(result.muskratInBlast).toBe(true);
		});

		it("muskratInBlast is false when Muskrat is outside blast radius", () => {
			const muskrat = spawnUnit(20, 20, { type: "pvt_muskrat", isHero: true });
			placeCharge(world, muskrat, 5, 5);

			const result = chargeTickSystem(world, 10.0);

			expect(result.muskratInBlast).toBe(false);
		});

		it("muskratInBlast is false when no Muskrat exists", () => {
			// Place charge from a non-muskrat (shouldn't normally happen but defensive)
			const unit = spawnUnit(20, 20, { type: "sapper" });
			placeCharge(world, unit, 5, 5);

			const result = chargeTickSystem(world, 10.0);

			expect(result.muskratInBlast).toBe(false);
		});
	});

	// -----------------------------------------------------------------------
	// applyExplosion (direct unit test)
	// -----------------------------------------------------------------------

	describe("applyExplosion", () => {
		it("damages all entities with Health within radius", () => {
			const enemy = spawnUnit(1, 0, { type: "gator", faction: "scale_guard", hp: 120 });
			const ally = spawnUnit(0, 1, { type: "mudfoot", faction: "ura", hp: 80 });

			const result = applyExplosion(world, 0, 0, CHARGE_RADIUS, CHARGE_DAMAGE);

			expect(enemy.get(Health)?.current).toBe(20);
			expect(ally.get(Health)?.current).toBe(-20);
			expect(result.hitEntities.length).toBe(2);
		});

		it("instantly kills buildings (sets HP to 0)", () => {
			const building = spawnBuilding(1, 0, { hp: 500 });

			applyExplosion(world, 0, 0, CHARGE_RADIUS, CHARGE_DAMAGE);

			expect(building.get(Health)?.current).toBe(0);
		});

		it("returns destroyed explosive buildings for chain processing", () => {
			const gasDepot = spawnBuilding(1, 0, {
				type: "gas_depot",
				hp: 300,
				explosive: true,
			});

			const result = applyExplosion(world, 0, 0, CHARGE_RADIUS, CHARGE_DAMAGE);

			expect(result.chainTargets.length).toBe(1);
			expect(result.chainTargets[0]).toBe(gasDepot);
		});

		it("does not return non-explosive buildings in chainTargets", () => {
			spawnBuilding(1, 0, { hp: 300 });

			const result = applyExplosion(world, 0, 0, CHARGE_RADIUS, CHARGE_DAMAGE);

			expect(result.chainTargets.length).toBe(0);
		});
	});
});
