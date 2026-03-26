import { describe, expect, it } from "vitest";
import { Position, Speed } from "@/engine/world/components";
import {
	createGameWorld,
	getOrderQueue,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { runMovementSystem } from "./movementSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/movementSystem", () => {
	it("moves an entity toward its move order target", () => {
		const world = makeWorld(100);
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 100; // 100 px/s

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 0 });

		runMovementSystem(world);

		// After 100ms at 100px/s, should have moved 10px
		expect(Position.x[eid]).toBeCloseTo(10, 0);
		expect(Position.y[eid]).toBeCloseTo(0, 0);
		// Order should still be active (not yet arrived)
		expect(orders).toHaveLength(1);
	});

	it("pops the order when entity arrives within 2px", () => {
		const world = makeWorld(1000);
		const eid = spawnUnit(world, { x: 99, y: 0, faction: "ura" });
		Speed.value[eid] = 200;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 0 });

		runMovementSystem(world);

		// Entity should snap to target and order should be removed
		expect(Position.x[eid]).toBeCloseTo(100, 0);
		expect(Position.y[eid]).toBeCloseTo(0, 0);
		expect(orders).toHaveLength(0);
	});

	it("skips entities with no orders", () => {
		const world = makeWorld(100);
		const eid = spawnUnit(world, { x: 5, y: 5, faction: "ura" });
		Speed.value[eid] = 100;

		runMovementSystem(world);

		expect(Position.x[eid]).toBeCloseTo(5, 0);
		expect(Position.y[eid]).toBeCloseTo(5, 0);
	});

	it("skips entities with non-move orders", () => {
		const world = makeWorld(100);
		const eid = spawnUnit(world, { x: 5, y: 5, faction: "ura" });
		Speed.value[eid] = 100;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "attack", targetEid: 999 });

		runMovementSystem(world);

		expect(Position.x[eid]).toBeCloseTo(5, 0);
		expect(Position.y[eid]).toBeCloseTo(5, 0);
	});

	it("skips entities with zero speed", () => {
		const world = makeWorld(100);
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 0;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 0 });

		runMovementSystem(world);

		expect(Position.x[eid]).toBeCloseTo(0, 0);
	});

	it("handles diagonal movement correctly", () => {
		const world = makeWorld(1000);
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Speed.value[eid] = 100;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 200, targetY: 200 });

		runMovementSystem(world);

		// After 1s at 100px/s, distance moved should be 100px along the diagonal
		const dist = Math.sqrt(Position.x[eid] ** 2 + Position.y[eid] ** 2);
		expect(dist).toBeCloseTo(100, 0);
	});

	it("does nothing when deltaMs is zero", () => {
		const world = makeWorld(0);
		const eid = spawnUnit(world, { x: 5, y: 5, faction: "ura" });
		Speed.value[eid] = 100;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 100 });

		runMovementSystem(world);

		expect(Position.x[eid]).toBeCloseTo(5, 0);
		expect(Position.y[eid]).toBeCloseTo(5, 0);
	});
});
