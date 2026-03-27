import { describe, expect, it, vi } from "vitest";
import { Attack, Health, TargetRef, VisionRadius } from "@/engine/world/components";
import {
	createGameWorld,
	flushRemovals,
	getOrderQueue,
	isAlive,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { runCombatSystem } from "./combatSystem";

// Mock audio to avoid Tone.js in tests
vi.mock("@/engine/audio/audioRuntime", () => ({
	playSfx: vi.fn(),
}));

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

/** Set up a melee attacker with explicitly cleared stale state. */
function setupMeleeAttacker(
	world: ReturnType<typeof createGameWorld>,
	opts: { x: number; y: number; damage: number; range: number },
) {
	const eid = spawnUnit(world, {
		x: opts.x,
		y: opts.y,
		faction: "ura",
		health: { current: 100, max: 100 },
	});
	Attack.damage[eid] = opts.damage;
	Attack.range[eid] = opts.range;
	Attack.cooldown[eid] = 1;
	Attack.timer[eid] = 1; // ready to fire
	VisionRadius.value[eid] = opts.range;
	TargetRef.eid[eid] = 0; // clear any stale targeting
	return eid;
}

describe("engine/systems/combatSystem", () => {
	it("attacks the nearest enemy within melee range", () => {
		const world = makeWorld(1000);

		// Use melee range (<=48) for direct damage
		const attacker = spawnUnit(world, {
			x: 0, y: 0, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[attacker] = 10;
		Attack.range[attacker] = 48; // melee range
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1; // ready to fire
		VisionRadius.value[attacker] = 48;

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
		Attack.range[attacker] = 48;
		Attack.cooldown[attacker] = 1; // 1 second cooldown
		Attack.timer[attacker] = 0; // just fired
		VisionRadius.value[attacker] = 48;

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
		Attack.range[attacker] = 48; // melee range for direct damage
		Attack.cooldown[attacker] = 1;
		Attack.timer[attacker] = 1;
		VisionRadius.value[attacker] = 48;

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
		Attack.range[attacker] = 48;
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

		const attacker = setupMeleeAttacker(world, { x: 0, y: 0, damage: 10, range: 48 });

		const ally = spawnUnit(world, {
			x: 10, y: 0, faction: "ura",
			health: { current: 50, max: 50 },
		});
		// Explicitly ensure ally has no stale attack/targeting data
		Attack.damage[ally] = 0;
		TargetRef.eid[ally] = 0;

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

	it("picks the nearest enemy when multiple are in melee range", () => {
		const world = makeWorld(1000);

		const attacker = setupMeleeAttacker(world, { x: 0, y: 0, damage: 10, range: 48 });

		const farTarget = spawnUnit(world, {
			x: 40, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[farTarget] = 0;
		TargetRef.eid[farTarget] = 0;

		const nearTarget = spawnUnit(world, {
			x: 20, y: 0, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[nearTarget] = 0;
		TargetRef.eid[nearTarget] = 0;

		runCombatSystem(world);

		// Near target should be hit, far target should not
		expect(Health.current[nearTarget]).toBe(40);
		expect(Health.current[farTarget]).toBe(50);
	});
});
