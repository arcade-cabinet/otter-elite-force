import { describe, expect, it } from "vitest";
import { Attack, Flags, Health, Position } from "@/engine/world/components";
import {
	createGameWorld,
	getOrderQueue,
	markForRemoval,
	flushRemovals,
	spawnUnit,
	spawnResource,
} from "@/engine/world/gameWorld";
import { runOrderSystem } from "./orderSystem";

function makeWorld() {
	const world = createGameWorld();
	world.time.deltaMs = 16;
	return world;
}

describe("engine/systems/orderSystem", () => {
	it("removes orders targeting dead entities", () => {
		const world = makeWorld();
		const attacker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[attacker] = 10;
		Health.max[attacker] = 10;

		const target = spawnUnit(world, { x: 50, y: 0, faction: "scale_guard" });
		Health.current[target] = 10;
		Health.max[target] = 10;

		const orders = getOrderQueue(world, attacker);
		orders.push({ type: "attack", targetEid: target });

		// Kill and remove target
		markForRemoval(world, target);
		flushRemovals(world);

		runOrderSystem(world);

		expect(orders).toHaveLength(0);
	});

	it("clears orders on dead entities", () => {
		const world = makeWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[eid] = 0;
		Health.max[eid] = 10;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 100 });

		runOrderSystem(world);

		expect(orders).toHaveLength(0);
	});

	it("removes gather orders when resource is gone", () => {
		const world = makeWorld();
		const worker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[worker] = 10;
		Health.max[worker] = 10;

		const resource = spawnResource(world, { x: 50, y: 0, resourceType: "fish_node" });

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: resource });

		// Remove resource
		markForRemoval(world, resource);
		flushRemovals(world);

		runOrderSystem(world);

		expect(orders).toHaveLength(0);
	});

	it("keeps valid move orders intact", () => {
		const world = makeWorld();
		const eid = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[eid] = 10;
		Health.max[eid] = 10;

		const orders = getOrderQueue(world, eid);
		orders.push({ type: "move", targetX: 100, targetY: 100 });

		runOrderSystem(world);

		expect(orders).toHaveLength(1);
		expect(orders[0].type).toBe("move");
	});

	it("discards attack orders when entity has no attack range", () => {
		const world = makeWorld();
		const attacker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[attacker] = 10;
		Health.max[attacker] = 10;
		Attack.range[attacker] = 0;

		const target = spawnUnit(world, { x: 50, y: 0, faction: "scale_guard" });
		Health.current[target] = 10;
		Health.max[target] = 10;

		const orders = getOrderQueue(world, attacker);
		orders.push({ type: "attack", targetEid: target });

		runOrderSystem(world);

		expect(orders).toHaveLength(0);
	});

	it("updates attack order targetX/Y when target is out of range", () => {
		const world = makeWorld();
		const attacker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[attacker] = 10;
		Health.max[attacker] = 10;
		Attack.range[attacker] = 30;
		Attack.damage[attacker] = 5;

		const target = spawnUnit(world, { x: 100, y: 0, faction: "scale_guard" });
		Health.current[target] = 10;
		Health.max[target] = 10;

		const orders = getOrderQueue(world, attacker);
		orders.push({ type: "attack", targetEid: target });

		runOrderSystem(world);

		// Should update the move coordinates to target position
		expect(orders).toHaveLength(1);
		expect(orders[0].targetX).toBe(100);
		expect(orders[0].targetY).toBe(0);
	});

	it("removes gather order targeting a non-resource entity", () => {
		const world = makeWorld();
		const worker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Health.current[worker] = 10;
		Health.max[worker] = 10;

		// Target is a unit, not a resource
		const notResource = spawnUnit(world, { x: 50, y: 0, faction: "neutral" });
		Health.current[notResource] = 10;
		Health.max[notResource] = 10;

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: notResource });

		runOrderSystem(world);

		expect(orders).toHaveLength(0);
	});
});
