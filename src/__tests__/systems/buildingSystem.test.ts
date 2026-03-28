/**
 * Building System Tests — ported from old Koota codebase.
 *
 * Tests construction progress, placement validation, pop cap,
 * building activation, and building destruction.
 */

import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "@/engine/content/ids";
import {
	canPlaceBuilding,
	canTrainUnit,
	getBuildingDef,
	placeBuilding,
	runBuildingSystem,
	type TileMap,
} from "@/engine/systems/buildingSystem";
import {
	Attack,
	Construction,
	Content,
	Faction,
	Flags,
	Health,
	Position,
	VisionRadius,
} from "@/engine/world/components";
import { createGameWorld, getOrderQueue, spawnBuilding, spawnUnit } from "@/engine/world/gameWorld";

function makeWorld(deltaMs: number) {
	const world = createGameWorld();
	world.time.deltaMs = deltaMs;
	return world;
}

function createMockTileMap(overrides?: {
	terrain?: Map<string, "grass" | "dirt" | "mud" | "water" | "mangrove" | "bridge">;
	occupied?: Set<string>;
}): TileMap {
	const terrain =
		overrides?.terrain ??
		new Map<string, "grass" | "dirt" | "mud" | "water" | "mangrove" | "bridge">();
	const occupied = overrides?.occupied ?? new Set<string>();
	return {
		getTerrain(x: number, y: number) {
			const key = `${x},${y}`;
			return (terrain.get(key) ?? "grass") as
				| "grass"
				| "dirt"
				| "mud"
				| "water"
				| "mangrove"
				| "bridge";
		},
		isOccupied(x: number, y: number) {
			return occupied.has(`${x},${y}`);
		},
	};
}

describe("engine/systems/buildingSystem", () => {
	describe("getBuildingDef", () => {
		it("returns barracks definition", () => {
			const def = getBuildingDef("barracks");
			expect(def).not.toBeNull();
			expect(def!.hp).toBe(350);
			expect(def!.buildTime).toBe(25);
		});

		it("returns null for unknown building type", () => {
			expect(getBuildingDef("nonexistent")).toBeNull();
		});
	});

	describe("canPlaceBuilding", () => {
		it("allows placement on grass with sufficient resources", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 100, timber: 150, salvage: 0 };
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding(world, "barracks", 5, 5, tileMap);
			expect(result.valid).toBe(true);
		});

		it("rejects placement with insufficient resources", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 0 };
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding(world, "barracks", 5, 5, tileMap);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Insufficient resources");
		});

		it("rejects placement on occupied tile", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 200, salvage: 0 };
			const tileMap = createMockTileMap({ occupied: new Set(["5,5"]) });

			const result = canPlaceBuilding(world, "barracks", 5, 5, tileMap);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Tile occupied");
		});

		it("rejects non-water buildings on water tiles", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 200, salvage: 0 };
			const terrain = new Map([["5,5", "water" as const]]);
			const tileMap = createMockTileMap({ terrain });

			const result = canPlaceBuilding(world, "barracks", 5, 5, tileMap);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Cannot build on water");
		});

		it("allows dock placement on water", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 200, salvage: 75 };
			const terrain = new Map([["5,5", "water" as const]]);
			const tileMap = createMockTileMap({ terrain });

			const result = canPlaceBuilding(world, "dock", 5, 5, tileMap);
			expect(result.valid).toBe(true);
		});

		it("rejects dock on non-water tile", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 200, salvage: 75 };
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding(world, "dock", 5, 5, tileMap);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Must be placed on water edge");
		});

		it("rejects placement on mangrove", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 200, salvage: 0 };
			const terrain = new Map([["5,5", "mangrove" as const]]);
			const tileMap = createMockTileMap({ terrain });

			const result = canPlaceBuilding(world, "barracks", 5, 5, tileMap);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Cannot build on mangrove");
		});

		it("rejects unknown building type", () => {
			const world = makeWorld(0);
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding(world, "nonexistent", 5, 5, tileMap);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Unknown building type");
		});
	});

	describe("placeBuilding", () => {
		it("spawns a building entity with correct initial state", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 500, timber: 500, salvage: 0 };
			const tileMap = createMockTileMap();

			const eid = placeBuilding(world, "barracks", 100, 200, tileMap);
			expect(eid).not.toBeNull();
			expect(Flags.isBuilding[eid!]).toBe(1);
			expect(Position.x[eid!]).toBe(100);
			expect(Position.y[eid!]).toBe(200);
			expect(Health.max[eid!]).toBe(350);
			expect(Construction.progress[eid!]).toBe(0);
			expect(Construction.buildTime[eid!]).toBe(25);
		});

		it("deducts resources on placement", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 500, timber: 500, salvage: 0 };
			const tileMap = createMockTileMap();

			placeBuilding(world, "barracks", 5, 5, tileMap);
			expect(world.session.resources.fish).toBe(400); // 500 - 100
			expect(world.session.resources.timber).toBe(350); // 500 - 150
		});

		it("returns null if placement is invalid", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 0, timber: 0, salvage: 0 };
			const tileMap = createMockTileMap();

			const result = placeBuilding(world, "barracks", 5, 5, tileMap);
			expect(result).toBeNull();
		});

		it("emits building-placed event", () => {
			const world = makeWorld(0);
			world.session.resources = { fish: 500, timber: 500, salvage: 0 };
			const tileMap = createMockTileMap();

			placeBuilding(world, "barracks", 5, 5, tileMap);
			expect(world.events.some((e) => e.type === "building-placed")).toBe(true);
		});
	});

	describe("construction progress", () => {
		it("advances construction when builder is near an incomplete building", () => {
			const world = makeWorld(10000); // 10 seconds
			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 350, max: 350 },
				construction: { progress: 0, buildTime: 30 },
			});

			// Spawn a worker near the building with a build order
			const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;
			const orders = getOrderQueue(world, worker);
			orders.push({ type: "build", targetEid: building });

			runBuildingSystem(world);

			// Progress should be ~33.3% (100/30 * 10)
			expect(Construction.progress[building]).toBeCloseTo(33.33, 0);
		});

		it("completes construction at 100% and emits building-complete event", () => {
			const world = makeWorld(30000); // 30 seconds (barracks build time)
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

			expect(Construction.progress[building]).toBeGreaterThanOrEqual(100);
			expect(world.events.some((e) => e.type === "building-complete")).toBe(true);
		});

		it("does not advance when builder is out of range", () => {
			const world = makeWorld(10000);
			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 350, max: 350 },
				construction: { progress: 0, buildTime: 30 },
			});

			// Builder is far away
			const worker = spawnUnit(world, { x: 500, y: 500, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;
			const orders = getOrderQueue(world, worker);
			orders.push({ type: "build", targetEid: building });

			runBuildingSystem(world);

			expect(Construction.progress[building]).toBe(0);
		});

		it("handles multiple builders on the same building (faster construction)", () => {
			const world = makeWorld(10000); // 10 seconds
			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 350, max: 350 },
				construction: { progress: 0, buildTime: 30 },
			});

			// Two builders next to the building
			for (let i = 0; i < 2; i++) {
				const worker = spawnUnit(world, { x: 100, y: 100 + i, faction: "ura" });
				Content.categoryId[worker] = CATEGORY_IDS.worker;
				const orders = getOrderQueue(world, worker);
				orders.push({ type: "build", targetEid: building });
			}

			runBuildingSystem(world);

			// 2 builders: 2 * (100/30) * 10 = 66.67%
			expect(Construction.progress[building]).toBeCloseTo(66.67, 0);
		});

		it("releases builders when construction completes", () => {
			const world = makeWorld(30000);
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

			expect(orders).toHaveLength(0);
		});
	});

	describe("building activation", () => {
		it("applies pop cap bonus on completion (command_post)", () => {
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

		it("applies defensive attack stats on completion (watchtower)", () => {
			const world = makeWorld(20000);
			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "watchtower",
				health: { current: 200, max: 200 },
				construction: { progress: 0, buildTime: 20 },
			});

			const worker = spawnUnit(world, { x: 100, y: 100, faction: "ura" });
			Content.categoryId[worker] = CATEGORY_IDS.worker;
			const orders = getOrderQueue(world, worker);
			orders.push({ type: "build", targetEid: building });

			runBuildingSystem(world);

			expect(Attack.damage[building]).toBe(8);
			// attackRange=6 tiles * 32 = 192px, visionBonus=8 tiles * 32 = 256px
			expect(Attack.range[building]).toBe(192);
			expect(VisionRadius.value[building]).toBe(256);
		});
	});

	describe("building destruction", () => {
		it("reduces pop cap when building with popCapBonus is destroyed", () => {
			const world = makeWorld(16);
			world.runtime.population.max = 20;

			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "command_post",
				health: { current: 0, max: 600 },
			});

			runBuildingSystem(world);

			expect(world.runtime.population.max).toBe(10); // 20 - 10
			expect(world.events.some((e) => e.type === "building-destroyed")).toBe(true);
		});

		it("clears production queue when building is destroyed", () => {
			const world = makeWorld(16);

			const building = spawnBuilding(world, {
				x: 100,
				y: 100,
				faction: "ura",
				buildingType: "barracks",
				health: { current: 0, max: 350 },
			});
			world.runtime.productionQueues.set(building, [
				{ type: "unit", contentId: "mudfoot", progress: 50 },
			]);

			runBuildingSystem(world);

			expect(world.runtime.productionQueues.has(building)).toBe(false);
		});
	});

	describe("canTrainUnit", () => {
		it("allows training when under pop cap", () => {
			const world = makeWorld(0);
			world.runtime.population.current = 5;
			world.runtime.population.max = 10;

			expect(canTrainUnit(world, 1)).toBe(true);
		});

		it("rejects training when at pop cap", () => {
			const world = makeWorld(0);
			world.runtime.population.current = 10;
			world.runtime.population.max = 10;

			expect(canTrainUnit(world, 1)).toBe(false);
		});

		it("rejects training when unit would exceed pop cap", () => {
			const world = makeWorld(0);
			world.runtime.population.current = 9;
			world.runtime.population.max = 10;

			expect(canTrainUnit(world, 2)).toBe(false);
		});
	});
});
