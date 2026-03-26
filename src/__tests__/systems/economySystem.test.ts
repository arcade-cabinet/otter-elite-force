import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GatheringFrom, OwnedBy } from "../../ecs/relations";
import { initSingletons } from "../../ecs/singletons";
import { Gatherer, ResourceNode } from "../../ecs/traits/economy";
import { IsBuilding, IsResource, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { CampaignProgress, ResourcePool } from "../../ecs/traits/state";
import { economySystem, resetFishTrapTimer } from "../../systems/economySystem";

describe("economySystem", () => {
	let world: ReturnType<typeof createWorld>;

	// Create a faction entity for OwnedBy relations
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		// Set tactical difficulty (1.0x baseline) so economy tests are unaffected by scaling
		world.set(CampaignProgress, { missions: {}, currentMission: null, difficulty: "tactical" });
		uraFaction = world.spawn();
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

			const _worker = world.spawn(
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
			const _commandPost = world.spawn(
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

			// Assert: resources deposited to world ResourcePool
			const pool = world.get(ResourcePool)!;
			expect(pool.fish).toBe(10);

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
			const _commandPost = world.spawn(
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

			expect(world.get(ResourcePool)?.fish).toBe(3);
		});

		it("should scale income with number of Fish Traps", () => {
			// Spawn 3 Fish Traps
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			economySystem(world, 10);

			expect(world.get(ResourcePool)?.fish).toBe(9); // 3 traps * 3 fish
		});

		it("should not generate income before 10 seconds", () => {
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			economySystem(world, 5);

			expect(world.get(ResourcePool)?.fish).toBe(0);
		});

		it("should accumulate timer across multiple ticks", () => {
			world.spawn(IsBuilding, UnitType({ type: "fish_trap" }), OwnedBy(uraFaction));

			// 5 seconds + 5 seconds = 10 seconds total
			economySystem(world, 5);
			economySystem(world, 5);

			expect(world.get(ResourcePool)?.fish).toBe(3);
		});

		it("should not count non-Fish-Trap buildings", () => {
			world.spawn(IsBuilding, UnitType({ type: "barracks" }), OwnedBy(uraFaction));

			economySystem(world, 10);

			expect(world.get(ResourcePool)?.fish).toBe(0);
		});
	});

	describe("gatherer steering", () => {
		it("dispatches via SteeringAgent", async () => {
			const { vi: v } = await import("vitest");
			const { SteeringAgent } = await import("../../ecs/traits/ai");
			const pa = v.fn(),
				pc = v.fn();
			const ma = {
				vehicle: {
					position: { x: 0, y: 0, z: 0, set: v.fn() },
					velocity: { x: 0, y: 0, z: 0 },
					update: v.fn(),
					steering: { add: v.fn() },
				},
				followPath: {
					active: true,
					path: { clear: pc, add: pa, finished: () => false, current: v.fn(() => undefined) },
					weight: 1,
				},
				separation: { weight: 0.5 },
				obstacleAvoidance: { weight: 1 },
			};
			const n = world.spawn(
				IsResource,
				Position({ x: 10, y: 0 }),
				ResourceNode({ type: "timber", remaining: 100 }),
			);
			const w = world.spawn(
				Position({ x: 0, y: 0 }),
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				GatheringFrom(n),
				SteeringAgent,
			);
			w.set(SteeringAgent, ma as unknown);
			economySystem(world, 1);
			expect(pc).toHaveBeenCalled();
			expect(w.get(Position).x).toBe(0);
		});
		it("falls back to direct movement without SteeringAgent", () => {
			const n = world.spawn(
				IsResource,
				Position({ x: 10, y: 0 }),
				ResourceNode({ type: "timber", remaining: 100 }),
			);
			const w = world.spawn(
				Position({ x: 0, y: 0 }),
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				GatheringFrom(n),
			);
			economySystem(world, 1);
			expect(w.get(Position).x).toBeGreaterThan(0);
		});
	});
});
