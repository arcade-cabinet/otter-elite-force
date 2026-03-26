import { describe, expect, it } from "vitest";
import { Attack, Health } from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	getOrderQueue,
	isAlive,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { runCombatSystem } from "./combatSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/combatSystem", () => {
	it("attacks the nearest enemy within range", () => {
		const world = makeWorld(1000);

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 50;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1; // ready to fire

		const target = spawnUnit(world, {
			x: 30, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runCombatSystem(world);

		expect(Health.current[target]).toBe(40);
	});

	it("respects attack cooldown", () => {
		const world = makeWorld(500); // 0.5s

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 50;
		Attack.cooldown[attacker] = 1; // 1 second cooldown
		Attack.timer[attacker] = 0; // just fired

		const target = spawnUnit(world, {
			x: 30, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runCombatSystem(world);

		// Cooldown not elapsed (0.5s < 1s), no damage dealt
		expect(Health.current[target]).toBe(50);
	});

	it("marks target for removal when health drops to zero", () => {
		const world = makeWorld(1000);

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 50;
		Attack.range[attacker] = 50;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1;

		const target = spawnUnit(world, {
			x: 10, y: 0, faction: "scale_guard",
			health: { current: 25, max: 25 },
		});

		runCombatSystem(world);

		// Target is marked for removal but still technically alive until flush
		expect(Health.current[target]).toBe(-25);
		expect(world.runtime.removals.has(target)).toBe(true);

		flushRemovals(world);
		expect(isAlive(world, target)).toBe(false);
	});

	it("skips entities with active move orders", () => {
		const world = makeWorld(1000);

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 50;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1;

		const orders = getOrderQueue(world, attacker);
		orders.push({ type: "move", targetX: 100, targetY: 0 });

		const target = spawnUnit(world, {
			x: 30, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runCombatSystem(world);

		// No damage because attacker has a move order
		expect(Health.current[target]).toBe(50);
	});

	it("does not attack same-faction entities", () => {
		const world = makeWorld(1000);

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 50;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1;

		const ally = spawnUnit(world, {
			x: 10, y: 0, faction: "ura",
			health: { current: 50, max: 50 },
		});

		runCombatSystem(world);

		expect(Health.current[ally]).toBe(50);
	});

	it("does not attack out-of-range entities", () => {
		const world = makeWorld(1000);

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 20;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1;

		const target = spawnUnit(world, {
			x: 100, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runCombatSystem(world);

		expect(Health.current[target]).toBe(50);
	});

	it("picks the nearest enemy when multiple are in range", () => {
		const world = makeWorld(1000);

		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 100;
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1;

		const farTarget = spawnUnit(world, {
			x: 80, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		const nearTarget = spawnUnit(world, {
			x: 20, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runCombatSystem(world);

		// Near target should be hit, far target should not
		expect(Health.current[nearTarget]).toBe(40);
		expect(Health.current[farTarget]).toBe(50);
	});
});
