import { describe, expect, it, vi } from "vitest";
import { Attack, Flags, Health, Position } from "@/engine/world/components";
import { createGameWorld, spawnUnit } from "@/engine/world/gameWorld";
import {
	ABILITY_CONFIG,
	getAbilityCooldown,
	grantAbility,
	hasAbility,
	queueAbility,
	runAbilitySystem,
} from "./abilitySystem";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

function makeWorld(deltaMs = 1000) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/abilitySystem", () => {
	describe("grantAbility / hasAbility", () => {
		it("grants an ability to an entity", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			grantAbility(world, eid, "heal");
			expect(hasAbility(world, eid, "heal")).toBe(true);
			expect(hasAbility(world, eid, "snipe")).toBe(false);
		});

		it("does not duplicate abilities", () => {
			const world = makeWorld();
			const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });

			grantAbility(world, eid, "heal");
			grantAbility(world, eid, "heal");
			expect(world.runtime.entityAbilities.get(eid)?.length).toBe(1);
		});
	});

	describe("heal ability", () => {
		it("heals a wounded ally", () => {
			const world = makeWorld();
			const medic = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const wounded = spawnUnit(world, {
				x: 20,
				y: 0,
				faction: "ura",
				health: { current: 30, max: 100 },
			});

			grantAbility(world, medic, "heal");
			queueAbility(world, medic, "heal", wounded);
			runAbilitySystem(world);

			expect(Health.current[wounded]).toBe(50); // 30 + 20 heal
		});

		it("does not overheal above max HP", () => {
			const world = makeWorld();
			const medic = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const slightlyWounded = spawnUnit(world, {
				x: 20,
				y: 0,
				faction: "ura",
				health: { current: 95, max: 100 },
			});

			grantAbility(world, medic, "heal");
			queueAbility(world, medic, "heal", slightlyWounded);
			runAbilitySystem(world);

			expect(Health.current[slightlyWounded]).toBe(100); // capped at max
		});

		it("starts cooldown after use", () => {
			const world = makeWorld();
			const medic = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const wounded = spawnUnit(world, {
				x: 20,
				y: 0,
				faction: "ura",
				health: { current: 30, max: 100 },
			});

			grantAbility(world, medic, "heal");
			queueAbility(world, medic, "heal", wounded);
			runAbilitySystem(world);

			expect(getAbilityCooldown(world, medic, "heal")).toBe(ABILITY_CONFIG.heal.cooldownMs);
		});

		it("blocks activation when on cooldown", () => {
			const world = makeWorld(100);
			const medic = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const wounded = spawnUnit(world, {
				x: 20,
				y: 0,
				faction: "ura",
				health: { current: 30, max: 100 },
			});

			grantAbility(world, medic, "heal");

			// First use
			queueAbility(world, medic, "heal", wounded);
			runAbilitySystem(world);
			expect(Health.current[wounded]).toBe(50);

			// Second use on cooldown (only 100ms passed)
			queueAbility(world, medic, "heal", wounded);
			runAbilitySystem(world);
			expect(Health.current[wounded]).toBe(50); // no change
		});
	});

	describe("snipe ability", () => {
		it("deals 3x damage to target", () => {
			const world = makeWorld();
			const sniper = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[sniper] = 10;

			const target = spawnUnit(world, {
				x: 50,
				y: 0,
				faction: "scale_guard",
				health: { current: 100, max: 100 },
			});

			grantAbility(world, sniper, "snipe");
			queueAbility(world, sniper, "snipe", target);
			runAbilitySystem(world);

			expect(Health.current[target]).toBe(70); // 100 - 30
		});
	});

	describe("shield_bash ability", () => {
		it("applies stun effect to target", () => {
			const world = makeWorld();
			const basher = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const target = spawnUnit(world, {
				x: 10,
				y: 0,
				faction: "scale_guard",
				health: { current: 100, max: 100 },
			});

			grantAbility(world, basher, "shield_bash");
			queueAbility(world, basher, "shield_bash", target);
			runAbilitySystem(world);

			const stunEffects = world.runtime.activeEffects.filter(
				(e) => e.type === "stun" && e.targetEid === target,
			);
			expect(stunEffects).toHaveLength(1);
			expect(stunEffects[0].remainingMs).toBeGreaterThan(0);
		});

		it("stunned entity cannot use abilities", () => {
			const world = makeWorld(100); // Short delta so stun doesn't expire between ticks
			const basher = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const enemy = spawnUnit(world, {
				x: 10,
				y: 0,
				faction: "scale_guard",
				health: { current: 100, max: 100 },
			});
			Attack.damage[enemy] = 10;

			grantAbility(world, basher, "shield_bash");
			grantAbility(world, enemy, "snipe");

			// Stun the enemy
			queueAbility(world, basher, "shield_bash", enemy);
			runAbilitySystem(world);

			// Enemy tries to snipe while stunned (stun is 1000ms, only 100ms has passed)
			const allyTarget = spawnUnit(world, {
				x: 20,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			queueAbility(world, enemy, "snipe", allyTarget);
			runAbilitySystem(world);

			// Snipe should not have executed
			expect(Health.current[allyTarget]).toBe(100);
		});
	});

	describe("demolition_charge ability", () => {
		it("creates a timed fuse effect", () => {
			const world = makeWorld();
			const sapper = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});

			grantAbility(world, sapper, "demolition_charge");
			queueAbility(world, sapper, "demolition_charge", undefined, 50, 50);
			runAbilitySystem(world);

			const fuseEffects = world.runtime.activeEffects.filter(
				(e) => e.type === "demolition_charge_fuse",
			);
			expect(fuseEffects).toHaveLength(1);
			// Effects created this tick are NOT ticked down until next tick
			expect(fuseEffects[0].remainingMs).toBe(ABILITY_CONFIG.demolition_charge.fuseMs);
		});

		it("explodes after fuse timer expires", () => {
			const world = makeWorld();
			const sapper = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const building = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "scale_guard",
				health: { current: 500, max: 500 },
			});
			Flags.isBuilding[building] = 1;

			grantAbility(world, sapper, "demolition_charge");
			queueAbility(world, sapper, "demolition_charge", building, 50, 50);

			// Place charge (effects created this tick are not ticked)
			runAbilitySystem(world);

			// Fast-forward enough ticks to expire the 3000ms fuse
			// Effects are ticked at the START of each tick, so we need
			// 3 more ticks of 1000ms each to reach 3000ms
			for (let i = 0; i < 3; i++) {
				world.time.deltaMs = 1000;
				runAbilitySystem(world);
			}

			// Building should have taken damage
			expect(Health.current[building]).toBe(300); // 500 - 200
		});
	});

	describe("rally_cry ability", () => {
		it("boosts nearby ally damage", () => {
			const world = makeWorld();
			const sergeant = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const nearbyAlly = spawnUnit(world, {
				x: 60,
				y: 50,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[nearbyAlly] = 10;

			const farAlly = spawnUnit(world, {
				x: 500,
				y: 500,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[farAlly] = 10;

			grantAbility(world, sergeant, "rally_cry");
			queueAbility(world, sergeant, "rally_cry");
			runAbilitySystem(world);

			// Nearby ally should have boosted damage
			expect(Attack.damage[nearbyAlly]).toBeCloseTo(12); // 10 * 1.2
			// Far ally should not be affected
			expect(Attack.damage[farAlly]).toBe(10);
		});

		it("removes damage boost when effect expires", () => {
			const world = makeWorld();
			const sergeant = spawnUnit(world, {
				x: 50,
				y: 50,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const nearbyAlly = spawnUnit(world, {
				x: 60,
				y: 50,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[nearbyAlly] = 10;

			grantAbility(world, sergeant, "rally_cry");
			queueAbility(world, sergeant, "rally_cry");
			runAbilitySystem(world);

			expect(Attack.damage[nearbyAlly]).toBeCloseTo(12);

			// Fast-forward to expire the buff
			for (let i = 0; i < 10; i++) {
				world.time.deltaMs = 1000;
				runAbilitySystem(world);
			}

			// Damage should be restored
			expect(Attack.damage[nearbyAlly]).toBeCloseTo(10);
		});
	});

	describe("underwater_strike ability", () => {
		it("deals 2x damage and breaks stealth", () => {
			const world = makeWorld();
			const diver = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			Attack.damage[diver] = 10;
			Flags.stealthed[diver] = 1;
			Flags.submerged[diver] = 1;

			const target = spawnUnit(world, {
				x: 10,
				y: 0,
				faction: "scale_guard",
				health: { current: 100, max: 100 },
			});

			grantAbility(world, diver, "underwater_strike");
			queueAbility(world, diver, "underwater_strike", target);
			runAbilitySystem(world);

			expect(Health.current[target]).toBe(80); // 100 - 20
			expect(Flags.stealthed[diver]).toBe(0);
			expect(Flags.submerged[diver]).toBe(0);
		});
	});

	describe("cooldown ticking", () => {
		it("reduces cooldowns over time", () => {
			const world = makeWorld(1000);
			const medic = spawnUnit(world, {
				x: 0,
				y: 0,
				faction: "ura",
				health: { current: 100, max: 100 },
			});
			const wounded = spawnUnit(world, {
				x: 20,
				y: 0,
				faction: "ura",
				health: { current: 50, max: 100 },
			});

			grantAbility(world, medic, "heal");
			queueAbility(world, medic, "heal", wounded);
			runAbilitySystem(world);

			const initialCooldown = getAbilityCooldown(world, medic, "heal");
			expect(initialCooldown).toBe(ABILITY_CONFIG.heal.cooldownMs);

			// Tick 2 seconds
			world.time.deltaMs = 2000;
			runAbilitySystem(world);

			const remainingCooldown = getAbilityCooldown(world, medic, "heal");
			expect(remainingCooldown).toBe(ABILITY_CONFIG.heal.cooldownMs - 2000);
		});
	});
});
