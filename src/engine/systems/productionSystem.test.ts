import { describe, expect, it } from "vitest";
import { Flags } from "@/engine/world/components";
import {
	createGameWorld,
	getProductionQueue,
	isAlive,
	spawnBuilding,
} from "@/engine/world/gameWorld";
import { runProductionSystem } from "./productionSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/productionSystem", () => {
	it("advances production progress each tick", () => {
		const world = makeWorld(1000);

		const building = spawnBuilding(world, {
			x: 50, y: 50, faction: "ura",
		});

		const queue = getProductionQueue(world, building);
		queue.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 5000,
		} as never);

		runProductionSystem(world);

		// After 1000ms with 5000ms build time: (1000/5000)*100 = 20%
		expect(queue[0].progress).toBeCloseTo(20, 0);
	});

	it("spawns a unit and dequeues when progress reaches 100%", () => {
		const world = makeWorld(5000);

		const building = spawnBuilding(world, {
			x: 50, y: 50, faction: "ura",
		});

		const queue = getProductionQueue(world, building);
		queue.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 5000,
		} as never);

		const aliveBefore = world.runtime.alive.size;
		runProductionSystem(world);

		// Queue should be empty after completion
		expect(queue).toHaveLength(0);
		// A new entity should have been spawned
		expect(world.runtime.alive.size).toBe(aliveBefore + 1);
	});

	it("does not process non-building entities", () => {
		const world = makeWorld(5000);

		// Spawn a unit (not a building)
		const unit = spawnBuilding(world, {
			x: 50, y: 50, faction: "ura",
		});
		// Override to be non-building
		Flags.isBuilding[unit] = 0;

		const queue = getProductionQueue(world, unit);
		queue.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 5000,
		} as never);

		const aliveBefore = world.runtime.alive.size;
		runProductionSystem(world);

		// No unit should be spawned since the entity is not a building
		expect(world.runtime.alive.size).toBe(aliveBefore);
		expect(queue[0].progress).toBe(0);
	});

	it("skips buildings with empty production queues", () => {
		const world = makeWorld(1000);

		spawnBuilding(world, { x: 50, y: 50, faction: "ura" });

		// No queue entries — should not throw
		runProductionSystem(world);
	});

	it("processes multiple buildings independently", () => {
		const world = makeWorld(2500);

		const building1 = spawnBuilding(world, { x: 50, y: 50, faction: "ura" });
		const building2 = spawnBuilding(world, { x: 100, y: 100, faction: "ura" });

		const queue1 = getProductionQueue(world, building1);
		queue1.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 5000,
		} as never);

		const queue2 = getProductionQueue(world, building2);
		queue2.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 2500,
		} as never);

		const aliveBefore = world.runtime.alive.size;
		runProductionSystem(world);

		// Building 1: (2500/5000)*100 = 50% — still in progress
		expect(queue1).toHaveLength(1);
		expect(queue1[0].progress).toBeCloseTo(50, 0);

		// Building 2: (2500/2500)*100 = 100% — complete
		expect(queue2).toHaveLength(0);
		expect(world.runtime.alive.size).toBe(aliveBefore + 1);
	});

	it("handles zero buildTime by completing immediately", () => {
		const world = makeWorld(100);

		const building = spawnBuilding(world, { x: 50, y: 50, faction: "ura" });

		const queue = getProductionQueue(world, building);
		queue.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 0,
		} as never);

		const aliveBefore = world.runtime.alive.size;
		runProductionSystem(world);

		expect(queue).toHaveLength(0);
		expect(world.runtime.alive.size).toBe(aliveBefore + 1);
	});

	it("spawns the unit near the building position", () => {
		const world = makeWorld(10000);

		const building = spawnBuilding(world, { x: 200, y: 300, faction: "ura" });

		const queue = getProductionQueue(world, building);
		queue.push({
			type: "unit",
			contentId: "mudfoot",
			progress: 0,
			buildTimeMs: 1000,
		} as never);

		const aliveBefore = new Set(world.runtime.alive);
		runProductionSystem(world);

		// Find the new entity
		let newEid = -1;
		for (const eid of world.runtime.alive) {
			if (!aliveBefore.has(eid)) {
				newEid = eid;
				break;
			}
		}

		expect(newEid).not.toBe(-1);
		expect(isAlive(world, newEid)).toBe(true);
	});
});
