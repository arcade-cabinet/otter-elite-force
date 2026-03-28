import { describe, expect, it } from "vitest";
import { Armor, Flags, Health, Position } from "@/engine/world/components";
import { createGameWorld, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";
import {
	CHARGE_COUNTDOWN,
	CHARGE_DAMAGE,
	CHARGE_RADIUS,
	CHAIN_EXPLOSION_RADIUS,
	applyExplosion,
	placeCharge,
	runChargeTickSystem,
	runDemolitionSystem,
} from "./demolitionSystem";

describe("engine/systems/demolitionSystem", () => {
	describe("placeCharge", () => {
		it("adds a demolition charge to activeEffects", () => {
			const world = createGameWorld();
			const caster = spawnUnit(world, { x: 100, y: 100, faction: "ura" });

			placeCharge(world, caster, 200, 200);

			expect(world.runtime.activeEffects).toHaveLength(1);
			const effect = world.runtime.activeEffects[0];
			expect(effect.type).toBe("demolition_charge");
			expect(effect.x).toBe(200);
			expect(effect.y).toBe(200);
			expect(effect.remainingMs).toBe(CHARGE_COUNTDOWN * 1000);
		});

		it("emits charge-placed event", () => {
			const world = createGameWorld();
			const caster = spawnUnit(world, { x: 100, y: 100, faction: "ura" });

			placeCharge(world, caster, 200, 200);

			const event = world.events.find((e) => e.type === "charge-placed");
			expect(event).toBeDefined();
			expect(event?.payload?.x).toBe(200);
			expect(event?.payload?.y).toBe(200);
		});

		it("supports custom countdown duration", () => {
			const world = createGameWorld();
			const caster = spawnUnit(world, { x: 100, y: 100, faction: "ura" });

			placeCharge(world, caster, 200, 200, 5);

			expect(world.runtime.activeEffects[0].remainingMs).toBe(5000);
		});
	});

	describe("applyExplosion", () => {
		it("damages all entities within blast radius", () => {
			const world = createGameWorld();

			const unit1 = spawnUnit(world, { x: 100, y: 100, faction: "ura", health: { current: 100, max: 100 } });
			const unit2 = spawnUnit(world, { x: 130, y: 100, faction: "scale_guard", health: { current: 80, max: 80 } });
			Armor.value[unit2] = 5;

			// Explosion at (100, 100) with radius 96
			const result = applyExplosion(world, 100, 100, 96, 50);

			// Both should be hit (same location and within 30px)
			expect(result.hitCount).toBe(2);
			// unit1: no armor, takes 50 damage
			expect(Health.current[unit1]).toBe(50);
			// unit2: 5 armor, takes max(1, 50 - 5) = 45 damage
			expect(Health.current[unit2]).toBe(80 - 45);
		});

		it("instantly destroys buildings", () => {
			const world = createGameWorld();

			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "scale_guard",
				buildingType: "barracks",
				health: { current: 500, max: 500 },
			});

			const result = applyExplosion(world, 100, 100, 96, 50);

			expect(result.hitCount).toBe(1);
			// Building should be instantly destroyed regardless of HP
			expect(Health.current[building]).toBe(0);
		});

		it("identifies explosive buildings for chain reactions", () => {
			const world = createGameWorld();

			const fuelTank = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "scale_guard",
				buildingType: "fuel_depot",
				health: { current: 100, max: 100 },
			});

			const result = applyExplosion(world, 100, 100, 96, 50);

			expect(result.chainTargets).toContain(fuelTank);
		});

		it("does not hit entities outside radius", () => {
			const world = createGameWorld();

			const farUnit = spawnUnit(world, { x: 500, y: 500, faction: "ura", health: { current: 100, max: 100 } });

			applyExplosion(world, 100, 100, 96, 50);

			expect(Health.current[farUnit]).toBe(100);
		});

		it("does not damage projectiles or resources", () => {
			const world = createGameWorld();

			const unit = spawnUnit(world, { x: 100, y: 100, faction: "ura", health: { current: 100, max: 100 } });
			Flags.isProjectile[unit] = 1;

			const result = applyExplosion(world, 100, 100, 96, 50);
			expect(result.hitCount).toBe(0);
		});
	});

	describe("runChargeTickSystem", () => {
		it("decrements charge timers each tick", () => {
			const world = createGameWorld();
			world.time.deltaMs = 1000; // 1 second

			const caster = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			placeCharge(world, caster, 200, 200, 10);
			world.events.length = 0; // clear charge-placed event

			runChargeTickSystem(world);

			expect(world.runtime.activeEffects).toHaveLength(1);
			expect(world.runtime.activeEffects[0].remainingMs).toBe(9000);
		});

		it("detonates charge when timer reaches zero", () => {
			const world = createGameWorld();
			world.time.deltaMs = 11000; // 11 seconds (past 10s countdown)

			const caster = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			placeCharge(world, caster, 200, 200, 10);
			world.events.length = 0;

			// Place a unit near the charge
			const target = spawnUnit(world, { x: 210, y: 200, faction: "scale_guard", health: { current: 200, max: 200 } });

			const result = runChargeTickSystem(world);

			// Charge should have been removed
			const charges = world.runtime.activeEffects.filter((e) => e.type === "demolition_charge");
			expect(charges).toHaveLength(0);

			// Should have an explosion
			expect(result.explosions.length).toBeGreaterThan(0);

			// Target should have taken damage
			expect(Health.current[target]).toBeLessThan(200);

			// Explosion event should be emitted
			const explosionEvent = world.events.find((e) => e.type === "explosion");
			expect(explosionEvent).toBeDefined();
		});

		it("triggers chain explosions from explosive buildings", () => {
			const world = createGameWorld();
			world.time.deltaMs = 11000;

			const caster = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			placeCharge(world, caster, 200, 200, 10);
			world.events.length = 0;

			// Place an explosive building near the charge
			const fuelTank = spawnBuilding(world, {
				x: 220,
				y: 200,
				faction: "scale_guard",
				buildingType: "fuel_depot",
				health: { current: 100, max: 100 },
			});

			// Place a unit near the fuel tank (but outside primary blast, within chain blast)
			const nearbyUnit = spawnUnit(world, {
				x: 240,
				y: 200,
				faction: "scale_guard",
				health: { current: 200, max: 200 },
			});

			const result = runChargeTickSystem(world);

			// Should have multiple explosions (primary + chain)
			expect(result.explosions.length).toBeGreaterThan(1);

			// Fuel tank should be destroyed
			expect(Health.current[fuelTank]).toBe(0);
		});

		it("detects Pvt. Muskrat in blast radius and emits warning", () => {
			const world = createGameWorld();
			world.time.deltaMs = 11000;

			const muskrat = spawnUnit(world, {
				x: 210,
				y: 200,
				faction: "ura",
				unitType: "pvt_muskrat",
				health: { current: 100, max: 100 },
			});
			placeCharge(world, muskrat, 200, 200, 10);
			world.events.length = 0;

			const result = runChargeTickSystem(world);

			expect(result.muskratInBlast).toBe(true);

			const muskratEvent = world.events.find((e) => e.type === "muskrat-in-blast");
			expect(muskratEvent).toBeDefined();
		});

		it("does not flag muskrat when outside blast radius", () => {
			const world = createGameWorld();
			world.time.deltaMs = 11000;

			const muskrat = spawnUnit(world, {
				x: 500,
				y: 500,
				faction: "ura",
				unitType: "pvt_muskrat",
				health: { current: 100, max: 100 },
			});
			placeCharge(world, muskrat, 200, 200, 10);
			world.events.length = 0;

			const result = runChargeTickSystem(world);

			expect(result.muskratInBlast).toBe(false);
		});

		it("processes legacy detonate events", () => {
			const world = createGameWorld();
			world.time.deltaMs = 100;

			const unit = spawnUnit(world, { x: 100, y: 100, faction: "ura", health: { current: 100, max: 100 } });

			world.events.push({
				type: "detonate",
				payload: { x: 100, y: 100 },
			});

			const result = runChargeTickSystem(world);

			expect(result.explosions.length).toBeGreaterThan(0);
			// Unit should have taken damage
			expect(Health.current[unit]).toBeLessThan(100);
		});
	});

	describe("runDemolitionSystem (unified)", () => {
		it("is an alias for runChargeTickSystem", () => {
			const world = createGameWorld();
			world.time.deltaMs = 100;

			const result = runDemolitionSystem(world);

			expect(result).toBeDefined();
			expect(result.explosions).toEqual([]);
			expect(result.muskratInBlast).toBe(false);
		});
	});
});
