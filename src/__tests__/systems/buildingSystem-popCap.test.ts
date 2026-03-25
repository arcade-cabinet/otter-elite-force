import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConstructingAt } from "../../ecs/relations";
import { initSingletons } from "../../ecs/singletons";
import { Health } from "../../ecs/traits/combat";
import { ConstructionProgress } from "../../ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { PopulationState, ResourcePool } from "../../ecs/traits/state";
import { buildingSystem, placeBuilding, type TileMap } from "../../systems/buildingSystem";

function createMockTileMap(): TileMap {
	return {
		getTerrain() {
			return "grass";
		},
		isOccupied() {
			return false;
		},
	};
}

describe("buildingSystem — population cap (P0 fix)", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		uraFaction = world.spawn(Faction({ id: "ura" }));
	});

	afterEach(() => {
		world.destroy();
	});

	it("increases PopulationState.max by 6 when a Burrow completes construction", () => {
		world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
		world.set(PopulationState, { current: 0, max: 4 });
		const tileMap = createMockTileMap();

		const building = placeBuilding(world, "burrow", 5, 5, tileMap, uraFaction)!;
		expect(building).not.toBeNull();

		// Spawn builder next to the building
		world.spawn(Position({ x: 5, y: 5 }), ConstructingAt(building));

		// Tick enough to complete (burrow has 10s build time)
		buildingSystem(world, 10);

		// ConstructionProgress should be removed (building complete)
		expect(building.has(ConstructionProgress)).toBe(false);

		// Population cap should have increased from 4 to 10
		const pop = world.get(PopulationState);
		expect(pop!.max).toBe(10);
	});

	it("does not increase pop cap for buildings without populationCapacity", () => {
		world.set(ResourcePool, { fish: 0, timber: 200, salvage: 0 });
		world.set(PopulationState, { current: 0, max: 4 });
		const tileMap = createMockTileMap();

		const building = placeBuilding(world, "barracks", 5, 5, tileMap, uraFaction)!;
		expect(building).not.toBeNull();

		world.spawn(Position({ x: 5, y: 5 }), ConstructingAt(building));
		buildingSystem(world, 30); // barracks has 30s build time

		expect(building.has(ConstructionProgress)).toBe(false);

		// Population cap should remain unchanged
		const pop = world.get(PopulationState);
		expect(pop!.max).toBe(4);
	});

	it("accumulates pop cap from multiple Burrows", () => {
		world.set(ResourcePool, { fish: 0, timber: 500, salvage: 0 });
		world.set(PopulationState, { current: 0, max: 4 });
		const tileMap = createMockTileMap();

		// Build first burrow
		const b1 = placeBuilding(world, "burrow", 3, 3, tileMap, uraFaction)!;
		const builder1 = world.spawn(Position({ x: 3, y: 3 }), ConstructingAt(b1));
		buildingSystem(world, 10);
		expect(world.get(PopulationState)!.max).toBe(10);

		// Build second burrow
		const b2 = placeBuilding(world, "burrow", 7, 7, tileMap, uraFaction)!;
		world.spawn(Position({ x: 7, y: 7 }), ConstructingAt(b2));
		buildingSystem(world, 10);
		expect(world.get(PopulationState)!.max).toBe(16);
	});
});
