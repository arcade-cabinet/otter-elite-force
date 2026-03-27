import { describe, expect, it } from "vitest";
import { Attack, VisionRadius } from "@/engine/world/components";
import { createGameWorld, getOrderQueue, spawnUnit } from "@/engine/world/gameWorld";
import { runAiSystem } from "./aiSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/aiSystem", () => {
	it("transitions to chase and issues move order toward distant player entity", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		Attack.range[enemy] = 30;
		VisionRadius.value[enemy] = 200;

		spawnUnit(world, {
			x: 200,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		// Tick 1: idle → chase (detects enemy), chase issues move (dist 100 > range 30)
		runAiSystem(world);

		const aiState = world.runtime.aiStates.get(enemy);
		expect(aiState).toBeDefined();
		expect(aiState!.state).toBe("chase");

		const orders = world.runtime.orderQueues.get(enemy);
		expect(orders).toBeDefined();
		expect(orders!.length).toBeGreaterThanOrEqual(1);
		expect(orders![0].type).toBe("move");
	});

	it("overrides idle orders when enemy detected (FSM chase takes priority)", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		Attack.range[enemy] = 30;
		VisionRadius.value[enemy] = 200;

		const existingOrders = getOrderQueue(world, enemy);
		existingOrders.push({ type: "move", targetX: 0, targetY: 0 });

		spawnUnit(world, {
			x: 200,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		// FSM transitions to chase and updates move target to enemy position
		const aiState = world.runtime.aiStates.get(enemy);
		expect(aiState).toBeDefined();
		expect(aiState!.state).toBe("chase");
	});

	it("does not issue orders to player faction entities", () => {
		const world = makeWorld(16);

		const playerUnit = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[playerUnit] = 10;
		VisionRadius.value[playerUnit] = 200;

		spawnUnit(world, {
			x: 110,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(playerUnit);
		expect(!orders || orders.length === 0).toBe(true);
	});

	it("targets the nearest player entity when multiple are in range", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		Attack.range[enemy] = 30;
		VisionRadius.value[enemy] = 300;

		// Far player unit
		spawnUnit(world, {
			x: 250,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		// Near player unit (but still beyond attack range)
		spawnUnit(world, {
			x: 160,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const aiState = world.runtime.aiStates.get(enemy);
		expect(aiState).toBeDefined();
		expect(aiState!.state).toBe("chase");

		const orders = world.runtime.orderQueues.get(enemy);
		expect(orders).toBeDefined();
		expect(orders!.length).toBeGreaterThanOrEqual(1);
		// Should chase the nearer player (distance 60 vs 150)
		expect(orders![0].targetX).toBe(160);
	});

	it("does nothing when no player entities are in range", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		VisionRadius.value[enemy] = 50; // small range

		spawnUnit(world, {
			x: 500,
			y: 500,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		expect(!orders || orders.length === 0).toBe(true);
	});

	it("skips enemy entities with no attack capability", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 0; // no attack
		VisionRadius.value[enemy] = 200;

		spawnUnit(world, {
			x: 110,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		expect(!orders || orders.length === 0).toBe(true);
	});

	it("uses default detection range when VisionRadius is not set", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100,
			y: 100,
			faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		Attack.range[enemy] = 30;
		// VisionRadius.value[enemy] is 0 (default) — uses DEFAULT_DETECTION_RANGE (128)

		spawnUnit(world, {
			x: 200,
			y: 100,
			faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		// Distance is 100 which is within default detection range of 128
		// FSM should transition to chase and issue move order (dist 100 > range 30)
		const aiState = world.runtime.aiStates.get(enemy);
		expect(aiState).toBeDefined();
		expect(aiState!.state).toBe("chase");

		const orders = world.runtime.orderQueues.get(enemy);
		expect(orders).toBeDefined();
		expect(orders!.length).toBeGreaterThanOrEqual(1);
	});
});
