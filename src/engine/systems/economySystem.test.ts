import { beforeEach, describe, expect, it } from "vitest";
import { TILE_SIZE } from "@/config/constants";
import { CATEGORY_IDS } from "@/engine/content/ids";
import { Content, ResourceNode, Speed } from "@/engine/world/components";
import { createGameWorld, getOrderQueue, spawnResource, spawnUnit } from "@/engine/world/gameWorld";
import { resetGatherTimers, runEconomySystem } from "./economySystem";
import { runMovementSystem } from "./movementSystem";

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
			x: 10,
			y: 10,
			resourceType: "fish_node",
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
			x: 10,
			y: 10,
			resourceType: "timber_node",
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
			x: 10,
			y: 10,
			resourceType: "salvage_node",
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
			x: 500,
			y: 500,
			resourceType: "fish_node",
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
			x: 10,
			y: 10,
			resourceType: "fish_node",
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
			x: 10,
			y: 10,
			resourceType: "fish_node",
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
			x: 10,
			y: 10,
			resourceType: "fish_node",
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

	it("worker moves to nearby resource and gathers within 200 ticks (16ms each)", () => {
		resetGatherTimers();
		const TICK_MS = 16; // ~60fps
		const world = createGameWorld();
		world.time.deltaMs = TICK_MS;
		world.session.resources = { fish: 0, timber: 0, salvage: 0 };

		// Worker at tile (3,3), resource at tile (4,3) — 1 tile apart (32px)
		const workerX = 3 * TILE_SIZE + 16;
		const workerY = 3 * TILE_SIZE + 16;
		const resourceX = 4 * TILE_SIZE + 16;
		const resourceY = 3 * TILE_SIZE + 16;

		const worker = spawnUnit(world, { x: workerX, y: workerY, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;
		// River Rat speed: 10 tiles/sec = 320 px/sec
		Speed.value[worker] = 10 * TILE_SIZE;

		const node = spawnResource(world, { x: resourceX, y: resourceY, resourceType: "fish_node" });
		ResourceNode.remaining[node] = 100;

		const orders = getOrderQueue(world, worker);
		orders.push({
			type: "gather",
			targetEid: node,
			targetX: resourceX,
			targetY: resourceY,
		});

		// Run 200 ticks of movement + economy (total ~3.2 seconds)
		for (let tick = 0; tick < 200; tick++) {
			world.time.tick = tick;
			runMovementSystem(world);
			runEconomySystem(world);
		}

		// Worker should have reached the resource (32px at 320px/s < 1 tick)
		// and gathered at least 1 fish (2s per fish, 3.2s total)
		expect(world.session.resources.fish).toBeGreaterThanOrEqual(1);
	});
});
