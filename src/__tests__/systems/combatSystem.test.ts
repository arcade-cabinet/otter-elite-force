import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Targeting } from "../../ecs/relations";
import { Armor, Attack, Health, VisionRadius } from "../../ecs/traits/combat";
import { Faction, IsProjectile, UnitType } from "../../ecs/traits/identity";
import { Position, Velocity } from "../../ecs/traits/spatial";
import { CanSwim, Submerged } from "../../ecs/traits/water";
import {
	aggroSystem,
	combatSystem,
	deathSystem,
	projectileSystem,
} from "../../systems/combatSystem";
import type { FogOfWarSystem } from "../../systems/fogSystem";

describe("combatSystem", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("damage calculation", () => {
		it("should deal attack - armor damage (minimum 1)", () => {
			const attacker = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
			);

			const defender = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			attacker.add(Targeting(defender));

			// Tick combat with delta that exceeds cooldown
			combatSystem(world, 1.1);

			const defenderHealth = defender.get(Health)!;
			// damage = 12 - 4 = 8
			expect(defenderHealth.current).toBe(112);
		});

		it("should deal minimum 1 damage when armor exceeds attack", () => {
			const attacker = world.spawn(
				UnitType({ type: "river_rat" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 40, max: 40 }),
				Attack({ damage: 5, range: 1, cooldown: 1.0, timer: 0 }),
			);

			const defender = world.spawn(
				UnitType({ type: "croc_champion" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 200, max: 200 }),
				Armor({ value: 50 }),
			);

			attacker.add(Targeting(defender));

			combatSystem(world, 1.1);

			const defenderHealth = defender.get(Health)!;
			expect(defenderHealth.current).toBe(199);
		});

		it("should not attack before cooldown expires", () => {
			const attacker = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
			);

			const defender = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			attacker.add(Targeting(defender));

			// Tick with small delta — not enough for cooldown
			combatSystem(world, 0.5);

			const defenderHealth = defender.get(Health)!;
			expect(defenderHealth.current).toBe(120);
		});

		it("should not attack targets out of range", () => {
			const attacker = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
			);

			const defender = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			attacker.add(Targeting(defender));

			combatSystem(world, 1.1);

			const defenderHealth = defender.get(Health)!;
			expect(defenderHealth.current).toBe(120);
		});

		it("should apply damage with zero armor", () => {
			const attacker = world.spawn(
				UnitType({ type: "shellcracker" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 50, max: 50 }),
				Attack({ damage: 10, range: 5, cooldown: 1.0, timer: 0 }),
			);

			const defender = world.spawn(
				UnitType({ type: "viper" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 3, y: 0 }),
				Health({ current: 35, max: 35 }),
			);

			attacker.add(Targeting(defender));

			combatSystem(world, 1.1);

			// Ranged attack — spawns projectile, no direct damage
			const projectiles = world.query(IsProjectile);
			expect(projectiles.length).toBe(1);

			const defenderHealth = defender.get(Health)!;
			expect(defenderHealth.current).toBe(35);
		});
	});

	describe("aggroSystem", () => {
		it("should auto-target nearest enemy within aggro range", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
				VisionRadius({ radius: 5 }),
			);

			// Near enemy
			const nearEnemy = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 120, max: 120 }),
			);

			// Far enemy (out of vision range)
			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 20, y: 0 }),
				Health({ current: 120, max: 120 }),
			);

			aggroSystem(world);

			expect(unit.has(Targeting(nearEnemy))).toBe(true);
		});

		it("should not target allies", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
				VisionRadius({ radius: 5 }),
			);

			// Ally — also needs Health trait to be in the potentialTargets query
			world.spawn(
				UnitType({ type: "river_rat" }),
				Faction({ id: "ura" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 40, max: 40 }),
			);

			aggroSystem(world);

			expect(unit.has(Targeting("*"))).toBe(false);
		});

		it("should not override existing target", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
				VisionRadius({ radius: 5 }),
			);

			const firstEnemy = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 4, y: 0 }),
				Health({ current: 120, max: 120 }),
			);

			// Closer enemy
			world.spawn(
				UnitType({ type: "skink" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 30, max: 30 }),
			);

			unit.add(Targeting(firstEnemy));

			aggroSystem(world);

			// Should keep original target
			expect(unit.has(Targeting(firstEnemy))).toBe(true);
		});

		it("should pick nearest enemy among multiple candidates", () => {
			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
				VisionRadius({ radius: 10 }),
			);

			// Far enemy
			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 0 }),
				Health({ current: 120, max: 120 }),
			);

			// Near enemy
			const nearEnemy = world.spawn(
				UnitType({ type: "skink" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 30, max: 30 }),
			);

			aggroSystem(world);

			expect(unit.has(Targeting(nearEnemy))).toBe(true);
		});
	});

	describe("deathSystem", () => {
		it("should destroy entities with health <= 0", () => {
			const entity = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 0, max: 120 }),
			);

			const deadEntities = deathSystem(world);

			expect(deadEntities).toContain(entity);
			expect(world.has(entity)).toBe(false);
		});

		it("should not destroy entities with health > 0", () => {
			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 1, max: 120 }),
			);

			const deadEntities = deathSystem(world);

			expect(deadEntities).toHaveLength(0);
		});

		it("should clear targeting relations pointing to dead entity", () => {
			const attacker = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
			);

			const deadEntity = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 0, max: 120 }),
			);

			attacker.add(Targeting(deadEntity));

			deathSystem(world);

			expect(attacker.has(Targeting("*"))).toBe(false);
		});
	});

	describe("ranged combat / projectiles", () => {
		it("should spawn projectile for ranged attackers", () => {
			const attacker = world.spawn(
				UnitType({ type: "shellcracker" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 50, max: 50 }),
				Attack({ damage: 10, range: 5, cooldown: 1.0, timer: 0 }),
			);

			const target = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 4, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			attacker.add(Targeting(target));

			combatSystem(world, 1.1);

			// Ranged attack (range > 1) should spawn a projectile instead of direct damage
			const projectiles = world.query(IsProjectile, Position, Velocity);
			expect(projectiles.length).toBe(1);

			// Target should not have taken damage yet (projectile in flight)
			const targetHealth = target.get(Health)!;
			expect(targetHealth.current).toBe(120);
		});

		it("should move projectiles toward targets", () => {
			const target = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 10, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			// Manually spawn a projectile heading toward target
			const projectile = world.spawn(
				IsProjectile(),
				Position({ x: 0, y: 0 }),
				Velocity({ x: 0, y: 0 }),
				Attack({ damage: 10, range: 10, cooldown: 0, timer: 0 }),
				Targeting(target),
			);

			projectileSystem(world, 1.0);

			const projPos = projectile.get(Position)!;
			// Projectile should have moved toward target (x > 0)
			expect(projPos.x).toBeGreaterThan(0);
		});

		it("should apply damage and destroy projectile on arrival", () => {
			const target = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			// Projectile very close to target
			world.spawn(
				IsProjectile(),
				Position({ x: 0.9, y: 0 }),
				Velocity({ x: 0, y: 0 }),
				Attack({ damage: 10, range: 10, cooldown: 0, timer: 0 }),
				Targeting(target),
			);

			projectileSystem(world, 1.0);

			// Projectile should be destroyed after hitting
			const remainingProjectiles = world.query(IsProjectile);
			expect(remainingProjectiles.length).toBe(0);

			// Target should have taken damage: 10 - 4 = 6
			const targetHealth = target.get(Health)!;
			expect(targetHealth.current).toBe(114);
		});
	});

	describe("multiple attacks over time", () => {
		it("should attack again after cooldown resets", () => {
			const attacker = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1.0, timer: 0 }),
			);

			const defender = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 1, y: 0 }),
				Health({ current: 120, max: 120 }),
				Armor({ value: 4 }),
			);

			attacker.add(Targeting(defender));

			// First attack
			combatSystem(world, 1.1);
			expect(defender.get(Health)!.current).toBe(112);

			// Not enough time for second attack
			combatSystem(world, 0.5);
			expect(defender.get(Health)!.current).toBe(112);

			// Enough time for second attack
			combatSystem(world, 0.6);
			expect(defender.get(Health)!.current).toBe(104);
		});
	});

	describe("aggroSystem fog+submerged", () => {
		it("rejects targets hidden by fog", () => {
			const u = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1, timer: 0 }),
				VisionRadius({ radius: 10 }),
			);
			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 120, max: 120 }),
			);
			const fog = { isTileVisible: vi.fn(() => false) } as unknown as FogOfWarSystem;
			aggroSystem(world, fog);
			expect(u.has(Targeting("*"))).toBe(false);
		});
		it("acquires visible targets through fog", () => {
			const u = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1, timer: 0 }),
				VisionRadius({ radius: 10 }),
			);
			const e = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 120, max: 120 }),
			);
			aggroSystem(world, { isTileVisible: vi.fn(() => true) } as unknown as FogOfWarSystem);
			expect(u.has(Targeting(e))).toBe(true);
		});
		it("works without fog (null)", () => {
			const u = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1, timer: 0 }),
				VisionRadius({ radius: 10 }),
			);
			const e = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 120, max: 120 }),
			);
			aggroSystem(world, null);
			expect(u.has(Targeting(e))).toBe(true);
		});
		it("ignores Submerged from surface", () => {
			const u = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 80, max: 80 }),
				Attack({ damage: 12, range: 1, cooldown: 1, timer: 0 }),
				VisionRadius({ radius: 10 }),
			);
			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 120, max: 120 }),
				Submerged,
			);
			aggroSystem(world);
			expect(u.has(Targeting("*"))).toBe(false);
		});
		it("CanSwim targets Submerged", () => {
			const u = world.spawn(
				UnitType({ type: "river_rat" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				Health({ current: 40, max: 40 }),
				Attack({ damage: 5, range: 1, cooldown: 0.8, timer: 0 }),
				VisionRadius({ radius: 5 }),
				CanSwim,
			);
			const e = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 0 }),
				Health({ current: 120, max: 120 }),
				Submerged,
			);
			aggroSystem(world);
			expect(u.has(Targeting(e))).toBe(true);
		});
	});
});
