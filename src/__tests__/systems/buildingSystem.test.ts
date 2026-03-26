import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConstructingAt } from "../../ecs/relations";
import { initSingletons } from "../../ecs/singletons";
import { AIState } from "../../ecs/traits/ai";
import { Health } from "../../ecs/traits/combat";
import { ConstructionProgress, ProductionQueue } from "../../ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "../../ecs/traits/identity";
import { OrderQueue, RallyPoint } from "../../ecs/traits/orders";
import { Position } from "../../ecs/traits/spatial";
import { ResourcePool } from "../../ecs/traits/state";
import {
	buildingSystem,
	canPlaceBuilding,
	placeBuilding,
	type TileMap,
} from "../../systems/buildingSystem";

/** Simple mock tile map for testing. */
function createMockTileMap(overrides?: {
	terrain?: Map<string, "grass" | "dirt" | "mud" | "water" | "mangrove" | "bridge">;
	occupied?: Set<string>;
}): TileMap {
	const terrain = overrides?.terrain ?? new Map();
	const occupied = overrides?.occupied ?? new Set();

	return {
		getTerrain(x, y) {
			const key = `${x},${y}`;
			return terrain.get(key) ?? "grass";
		},
		isOccupied(x, y) {
			return occupied.has(`${x},${y}`);
		},
	};
}

describe("buildingSystem", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		uraFaction = world.spawn();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("canPlaceBuilding", () => {
		it("should allow placement on grass with sufficient resources", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding("barracks", 5, 5, tileMap, world);
			expect(result.valid).toBe(true);
		});

		it("should reject placement with insufficient resources", () => {
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding("barracks", 5, 5, tileMap, world);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Insufficient resources");
		});

		it("should reject placement on occupied tile", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap({ occupied: new Set(["5,5"]) });

			const result = canPlaceBuilding("barracks", 5, 5, tileMap, world);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Tile occupied");
		});

		it("should reject placement on water for non-water buildings", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const terrain = new Map([["5,5", "water" as const]]);
			const tileMap = createMockTileMap({ terrain });

			const result = canPlaceBuilding("barracks", 5, 5, tileMap, world);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Cannot build on water");
		});

		it("should allow dock placement on water", () => {
			world.set(ResourcePool, { fish: 0, timber: 250, salvage: 50 });
			const terrain = new Map([["5,5", "water" as const]]);
			const tileMap = createMockTileMap({ terrain });

			const result = canPlaceBuilding("dock", 5, 5, tileMap, world);
			expect(result.valid).toBe(true);
		});

		it("should reject dock placement on non-water", () => {
			world.set(ResourcePool, { fish: 0, timber: 250, salvage: 50 });
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding("dock", 5, 5, tileMap, world);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Must be placed on water edge");
		});

		it("should reject placement on mangrove", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const terrain = new Map([["5,5", "mangrove" as const]]);
			const tileMap = createMockTileMap({ terrain });

			const result = canPlaceBuilding("barracks", 5, 5, tileMap, world);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Cannot build on mangrove");
		});

		it("should reject unknown building type", () => {
			const tileMap = createMockTileMap();

			const result = canPlaceBuilding("nonexistent", 5, 5, tileMap, world);
			expect(result.valid).toBe(false);
			expect(result.reason).toBe("Unknown building type");
		});
	});

	describe("placeBuilding", () => {
		it("should spawn a building entity with correct traits", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();

			const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction);

			expect(building).not.toBeNull();
			expect(building?.has(IsBuilding)).toBe(true);
			expect(building?.has(Position)).toBe(true);
			expect(building?.has(Health)).toBe(true);
			expect(building?.has(ConstructionProgress)).toBe(true);

			const pos = building?.get(Position);
			expect(pos.x).toBe(5);
			expect(pos.y).toBe(5);

			const unitType = building?.get(UnitType);
			expect(unitType.type).toBe("barracks");

			const hp = building?.get(Health);
			expect(hp.max).toBe(350); // Barracks HP from spec

			const cp = building?.get(ConstructionProgress);
			expect(cp.progress).toBe(0);
			expect(cp.buildTime).toBe(30); // Barracks build time from spec
			expect(building?.get(Faction).id).toBe("ura");
		});

		it("should deduct resources on placement", () => {
			world.set(ResourcePool, { fish: 0, timber: 500, salvage: 0 });
			const tileMap = createMockTileMap();

			placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction);

			const pool = world.get(ResourcePool)!;
			expect(pool.timber).toBe(300); // 500 - 200
		});

		it("should return null if placement is invalid", () => {
			// No resources
			const tileMap = createMockTileMap();

			const result = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction);
			expect(result).toBeNull();
		});
	});

	describe("construction progress", () => {
		it("should advance construction when builder is near an incomplete building", () => {
			// Place a building (30s build time for barracks)
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();
			const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction)!;

			// Spawn a builder next to the building
			const _builder = world.spawn(Position({ x: 5, y: 5 }), ConstructingAt(building));

			// Tick 10 seconds
			buildingSystem(world, 10);

			// Progress should be ~33.3% (100/30 * 10)
			const cp = building.get(ConstructionProgress);
			expect(cp.progress).toBeCloseTo(33.33, 0);
		});

		it("should complete construction at 100% and remove ConstructionProgress", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();
			const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction)!;

			const builder = world.spawn(Position({ x: 5, y: 5 }), ConstructingAt(building));

			// Tick enough time to complete (30s build time)
			buildingSystem(world, 30);

			// ConstructionProgress should be removed
			expect(building.has(ConstructionProgress)).toBe(false);
			expect(building.has(ProductionQueue)).toBe(true);
			expect(building.has(RallyPoint)).toBe(true);
			// Builder should be released
			expect(builder.has(ConstructingAt(building))).toBe(false);
		});

		it("clears the builder build order when construction completes", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();
			const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction)!;

			const builder = world.spawn(
				Position({ x: 5, y: 5 }),
				OrderQueue,
				AIState,
				ConstructingAt(building),
			);
			builder
				.get(OrderQueue)
				.push({ type: "build", targetX: 5, targetY: 5, targetEntity: building.id() });

			buildingSystem(world, 30);

			expect(builder.get(OrderQueue).length).toBe(0);
			expect(builder.get(AIState).state).toBe("idle");
		});

		it("should not advance construction when builder is out of range", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();
			const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction)!;

			// Builder is far away
			const _builder = world.spawn(Position({ x: 20, y: 20 }), ConstructingAt(building));

			buildingSystem(world, 10);

			const cp = building.get(ConstructionProgress);
			expect(cp.progress).toBe(0);
		});

		it("should handle multiple builders on the same building", () => {
			world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
			const tileMap = createMockTileMap();
			const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction)!;

			// Two builders next to the building
			world.spawn(Position({ x: 5, y: 5 }), ConstructingAt(building));
			world.spawn(Position({ x: 5, y: 6 }), ConstructingAt(building));

			// Tick 10 seconds — each builder contributes 33.3%, so total ~66.6%
			buildingSystem(world, 10);

			const cp = building.get(ConstructionProgress);
			expect(cp.progress).toBeCloseTo(66.67, 0);
		});
	});
});
