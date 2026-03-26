import { beforeEach, describe, expect, it } from "vitest";
import { Content } from "@/engine/world/components";
import { CATEGORY_IDS } from "@/engine/content/ids";
import {
	createGameWorld,
	getOrderQueue,
	spawnResource,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { resetGatherTimers, runEconomySystem } from "./economySystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/economySystem", () => {
	beforeEach(() => {
		resetGatherTimers();
	});

	it("gathers 1 fish after 2 seconds of gathering", () => {
		const world = makeWorld(2000); // 2 seconds

		const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		const node = spawnResource(world, {
			x: 10, y: 10, resourceType: "fish_node",
		});

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: node });

		runEconomySystem(world);

		expect(world.session.resources.fish).toBe(1);
	});

	it("gathers timber from timber nodes", () => {
		const world = makeWorld(2000);

		const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		const node = spawnResource(world, {
			x: 10, y: 10, resourceType: "timber_node",
		});

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: node });

		runEconomySystem(world);

		expect(world.session.resources.timber).toBe(1);
	});

	it("gathers salvage from salvage nodes", () => {
		const world = makeWorld(2000);

		const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		const node = spawnResource(world, {
			x: 10, y: 10, resourceType: "salvage_node",
		});

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: node });

		runEconomySystem(world);

		expect(world.session.resources.salvage).toBe(1);
	});

	it("does not gather if worker is too far from resource", () => {
		const world = makeWorld(2000);

		const worker = spawnUnit(world, { x: 0, y: 0, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		const node = spawnResource(world, {
			x: 500, y: 500, resourceType: "fish_node",
		});

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: node });

		runEconomySystem(world);

		expect(world.session.resources.fish).toBe(0);
	});

	it("does not gather if time is less than 2 seconds", () => {
		const world = makeWorld(1000); // 1 second

		const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		const node = spawnResource(world, {
			x: 10, y: 10, resourceType: "fish_node",
		});

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: node });

		runEconomySystem(world);

		expect(world.session.resources.fish).toBe(0);
	});

	it("skips non-worker entities", () => {
		const world = makeWorld(2000);

		const infantry = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[infantry] = CATEGORY_IDS.infantry;

		const node = spawnResource(world, {
			x: 10, y: 10, resourceType: "fish_node",
		});

		const orders = getOrderQueue(world, infantry);
		orders.push({ type: "gather", targetEid: node });

		runEconomySystem(world);

		expect(world.session.resources.fish).toBe(0);
	});

	it("removes gather order if target resource is dead", () => {
		const world = makeWorld(2000);

		const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		// Point to a non-existent entity
		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: 9999 });

		runEconomySystem(world);

		expect(orders).toHaveLength(0);
		expect(world.session.resources.fish).toBe(0);
	});

	it("accumulates gathering over multiple ticks", () => {
		const world = makeWorld(1000); // 1 second per tick

		const worker = spawnUnit(world, { x: 10, y: 10, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;

		const node = spawnResource(world, {
			x: 10, y: 10, resourceType: "fish_node",
		});

		const orders = getOrderQueue(world, worker);
		orders.push({ type: "gather", targetEid: node });

		// Tick 1: 1 second accumulated (not enough)
		runEconomySystem(world);
		expect(world.session.resources.fish).toBe(0);

		// Tick 2: 2 seconds accumulated (gather 1)
		runEconomySystem(world);
		expect(world.session.resources.fish).toBe(1);
	});
});
