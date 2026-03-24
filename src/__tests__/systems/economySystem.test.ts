import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Gatherer, ResourceNode } from "../../ecs/traits/economy";
import { IsBuilding, IsResource, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { GatheringFrom, OwnedBy } from "../../ecs/relations";
import { resourceStore } from "../../stores/resourceStore";
import { economySystem, resetFishTrapTimer } from "../../systems/economySystem";

describe("economySystem", () => {
	let world: ReturnType<typeof createWorld>;

	// Create a faction entity for OwnedBy relations
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		uraFaction = world.spawn();
		resourceStore.getState().reset();
		resetFishTrapTimer();
	});

	afterEach(() => {
		world.reset();
	});

	describe("resource gathering", () => {
		it("should increase carrying amount when gatherer is near a resource node", () => {
			// Arrange: Resource node at (5, 5)
			const node = world.spawn(
				IsResource,
				Position({ x: 5, y: 5 }),
				ResourceNode({ type: "fish", remaining: 100 }),
			);

			// River Rat with Gatherer trait near the node (within GATHER_RANGE=1.5)
			const worker = world.spawn(
				Position({ x: 5, y: 5 }),
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				GatheringFrom(node),
			);

			// Act: tick economy system with 1 second delta
			economySystem(world, 1);

			// Assert: gatherer should have started carrying resources
			const gatherer = worker.get(Gatherer);
			expect(gatherer.amount).toBeGreaterThan(0);
			expect(gatherer.carrying).toBe("fish");
		});

		it("should deplete the resource node as gatherer collects", () => {
			const node = world.spawn(
				IsResource,
				Position({ x: 5, y: 5 }),
				ResourceNode({ type: "timber", remaining: 20 }),
			);

			const worker = world.spawn(
				Position({ x: 5, y: 5 }),
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				GatheringFrom(node),
			);

			economySystem(world, 2);

			const nodeData = node.get(ResourceNode);
			expect(nodeData.remaining).toBeLessThan(20);
		});

		it("should deposit resources at Command Post when carrying capacity is full", () => {
			// Command Post at (0, 0)
			const commandPost = world.spawn(
				IsBuilding,
				UnitType({ type: "command_post" }),
				Position({ x: 0, y: 0 }),
				OwnedBy(uraFaction),
			);

			// Resource node at (0, 5)
			const node = world.spawn(
				IsResource,
				Position({ x: 0, y: 5 }),
				ResourceNode({ type: "fish", remaining: 100 }),
			);

			// Worker already full, standing at Command Post
			const worker = world.spawn(
				Position({ x: 0, y: 0 }),
				Gatherer({ carrying: "fish", amount: 10, capacity: 10 }),
				GatheringFrom(node),
			);

			// Act
			economySystem(world, 0.1);

			// Assert: resources deposited to store
			const resources = resourceStore.getState();
			expect(resources.fish).toBe(10);

			// Gatherer should be empty after deposit
			const gatherer = worker.get(Gatherer);
			expect(gatherer.amount).toBe(0);
			expect(gatherer.carrying).toBe("");
		});

		it("should move toward resource node when not in range", () => {
			const node = world.spawn(
				IsResource,
				Position({ x: 10, y: 0 }),
				ResourceNode({ type: "timber", remaining: 100 }),
			);

			const worker = world.spawn(
				Position({ x: 0, y: 0 }),
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				GatheringFrom(node),
			);

			economySystem(world, 1);

			// Worker should have moved toward the node
			const pos = worker.get(Position);
			expect(pos.x).toBeGreaterThan(0);
		});

		it("should release gathering relation when node is depleted", () => {
			const node = world.spawn(
				IsResource,
				Position({ x: 5, y: 5 }),
				ResourceNode({ type: "salvage", remaining: 0 }),
			);

			const worker = world.spawn(
				Position({ x: 5, y: 5 }),
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				GatheringFrom(node),
			);

			economySystem(world, 1);

			// Worker should no longer have GatheringFrom relation
			expect(worker.has(GatheringFrom(node))).toBe(false);
		});

		it("should move toward Command Post when full and not in range", () => {
			const commandPost = world.spawn(
				IsBuilding,
				UnitType({ type: "command_post" }),
				Position({ x: 0, y: 0 }),
				OwnedBy(uraFaction),
			);

			const node = world.spawn(
				IsResource,
				Position({ x: 20, y: 0 }),
				ResourceNode({ type: "fish", remaining: 100 }),
			);

			// Worker is full but far from Command Post
			const worker = world.spawn(
				Position({ x: 10, y: 0 }),
				Gatherer({ carrying: "fish", amount: 10, capacity: 10 }),
				GatheringFrom(node),
			);

			economySystem(world, 1);

			// Worker should have moved toward Command Post (x should decrease)
			const pos = worker.get(Position);
			expect(pos.x).toBeLessThan(10);
		});
	});

	describe("Fish Trap passive income", () => {
		it("should generate fish income from Fish Traps after 10 seconds", () => {
			// Spawn a Fish Trap
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			// Tick 10 seconds
			economySystem(world, 10);

			const resources = resourceStore.getState();
			expect(resources.fish).toBe(3);
		});

		it("should scale income with number of Fish Traps", () => {
			// Spawn 3 Fish Traps
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			economySystem(world, 10);

			const resources = resourceStore.getState();
			expect(resources.fish).toBe(9); // 3 traps * 3 fish
		});

		it("should not generate income before 10 seconds", () => {
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			economySystem(world, 5);

			const resources = resourceStore.getState();
			expect(resources.fish).toBe(0);
		});

		it("should accumulate timer across multiple ticks", () => {
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			// 5 seconds + 5 seconds = 10 seconds total
			economySystem(world, 5);
			economySystem(world, 5);

			const resources = resourceStore.getState();
			expect(resources.fish).toBe(3);
		});

		it("should not count non-Fish-Trap buildings", () => {
			world.spawn(IsBuilding, UnitType({ type: "barracks" }), OwnedBy(uraFaction));

			economySystem(world, 10);

			const resources = resourceStore.getState();
			expect(resources.fish).toBe(0);
		});
	});
});
