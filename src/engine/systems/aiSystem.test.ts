import { describe, expect, it } from "vitest";
import { Attack, Health, VisionRadius } from "@/engine/world/components";
import {
	createGameWorld,
	getOrderQueue,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { runAiSystem } from "./aiSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/aiSystem", () => {
	it("issues a move order toward a nearby player entity", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		Attack.range[enemy] = 50;
		VisionRadius.value[enemy] = 200;

		const playerUnit = spawnUnit(world, {
			x: 150, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		expect(orders).toBeDefined();
		expect(orders).toHaveLength(1);
		expect(orders![0].type).toBe("move");
		expect(orders![0].targetX).toBe(150);
		expect(orders![0].targetY).toBe(100);
	});

	it("does not issue orders to entities that already have orders", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		VisionRadius.value[enemy] = 200;

		const existingOrders = getOrderQueue(world, enemy);
		existingOrders.push({ type: "move", targetX: 0, targetY: 0 });

		spawnUnit(world, {
			x: 110, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		// Should still have just the original order
		expect(existingOrders).toHaveLength(1);
		expect(existingOrders[0].targetX).toBe(0);
	});

	it("does not issue orders to player faction entities", () => {
		const world = makeWorld(16);

		const playerUnit = spawnUnit(world, {
			x: 100, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});
		Attack.damage[playerUnit] = 10;
		VisionRadius.value[playerUnit] = 200;

		spawnUnit(world, {
			x: 110, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(playerUnit);
		expect(!orders || orders.length === 0).toBe(true);
	});

	it("targets the nearest player entity when multiple are in range", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		VisionRadius.value[enemy] = 200;

		// Far player unit
		spawnUnit(world, {
			x: 250, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});

		// Near player unit
		const nearPlayer = spawnUnit(world, {
			x: 120, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		expect(orders).toHaveLength(1);
		expect(orders![0].targetX).toBe(120);
		expect(orders![0].targetY).toBe(100);
	});

	it("does nothing when no player entities are in range", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		VisionRadius.value[enemy] = 50; // small range

		spawnUnit(world, {
			x: 500, y: 500, faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		expect(!orders || orders.length === 0).toBe(true);
	});

	it("skips enemy entities with no attack capability", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 0; // no attack
		VisionRadius.value[enemy] = 200;

		spawnUnit(world, {
			x: 110, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		expect(!orders || orders.length === 0).toBe(true);
	});

	it("uses default detection range when VisionRadius is not set", () => {
		const world = makeWorld(16);

		const enemy = spawnUnit(world, {
			x: 100, y: 100, faction: "scale_guard",
			health: { current: 50, max: 50 },
		});
		Attack.damage[enemy] = 10;
		// VisionRadius.value[enemy] is 0 (default) — uses DEFAULT_DETECTION_RANGE (128)

		spawnUnit(world, {
			x: 200, y: 100, faction: "ura",
			health: { current: 100, max: 100 },
		});

		runAiSystem(world);

		const orders = world.runtime.orderQueues.get(enemy);
		// Distance is 100 which is within default detection range of 128
		expect(orders).toHaveLength(1);
	});
});
