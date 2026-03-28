/**
 * Building System Pop Cap Tests — ported from old Koota codebase.
 *
 * Tests pop cap enforcement through the building system lifecycle:
 * placement, construction, and destruction affecting pop cap.
 */

import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "@/engine/content/ids";
import { Construction, Content, Health } from "@/engine/world/components";
import {
	createGameWorld,
	getOrderQueue,
	spawnBuilding,
	spawnUnit,
} from "@/engine/world/gameWorld";
import { canTrainUnit, runBuildingSystem } from "@/engine/systems/buildingSystem";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

describe("engine/systems/buildingSystem popCap enforcement", () => {
	it("starts with default max of 10", () => {
		const world = makeWorld(0);
		expect(world.runtime.population.max).toBe(10);
	});

	it("increases pop cap when command_post construction completes", () => {
		const world = makeWorld(60000);
		const initialMax = world.runtime.population.max;

		const building = spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 600, max: 600 },
			construction: { progress: 0, buildTime: 60 },
		});

		const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;
		const orders = getOrderQueue(world, worker);
		orders.push({ type: "build", targetEid: building });

		runBuildingSystem(world);

		expect(world.runtime.population.max).toBe(initialMax + 10);
	});

	it("increases pop cap when burrow construction completes", () => {
		const world = makeWorld(45000);
		const initialMax = world.runtime.population.max;

		const building = spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "burrow",
			health: { current: 400, max: 400 },
			construction: { progress: 0, buildTime: 45 },
		});

		const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;
		const orders = getOrderQueue(world, worker);
		orders.push({ type: "build", targetEid: building });

		runBuildingSystem(world);

		expect(world.runtime.population.max).toBe(initialMax + 5);
	});

	it("decreases pop cap when command_post is destroyed", () => {
		const world = makeWorld(16);
		world.runtime.population.max = 20;

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 0, max: 600 },
		});

		runBuildingSystem(world);

		expect(world.runtime.population.max).toBe(10); // 20 - 10
	});

	it("pop cap cannot go below 0", () => {
		const world = makeWorld(16);
		world.runtime.population.max = 5;

		spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "command_post",
			health: { current: 0, max: 600 },
		});

		runBuildingSystem(world);

		expect(world.runtime.population.max).toBe(0);
	});

	it("canTrainUnit returns false when at exact cap", () => {
		const world = makeWorld(0);
		world.runtime.population.current = 10;
		world.runtime.population.max = 10;

		expect(canTrainUnit(world, 1)).toBe(false);
	});

	it("canTrainUnit allows exactly filling cap", () => {
		const world = makeWorld(0);
		world.runtime.population.current = 9;
		world.runtime.population.max = 10;

		expect(canTrainUnit(world, 1)).toBe(true);
	});

	it("barracks construction does not affect pop cap (no popCapBonus)", () => {
		const world = makeWorld(30000);
		const initialMax = world.runtime.population.max;

		const building = spawnBuilding(world, {
			x: 100,
			y: 100,
			faction: "ura",
			buildingType: "barracks",
			health: { current: 350, max: 350 },
			construction: { progress: 0, buildTime: 30 },
		});

		const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
		Content.categoryId[worker] = CATEGORY_IDS.worker;
		const orders = getOrderQueue(world, worker);
		orders.push({ type: "build", targetEid: building });

		runBuildingSystem(world);

		expect(world.runtime.population.max).toBe(initialMax);
	});
});
