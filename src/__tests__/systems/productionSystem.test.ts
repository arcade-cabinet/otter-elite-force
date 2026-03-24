import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PopulationCost, ProductionQueue } from "../../ecs/traits/economy";
import { Health } from "../../ecs/traits/combat";
import { IsBuilding, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { RallyPoint } from "../../ecs/traits/orders";
import { OwnedBy } from "../../ecs/relations";
import { initSingletons } from "../../ecs/singletons";
import { PopulationState, ResourcePool } from "../../ecs/traits/state";
import { productionSystem, queueUnit } from "../../systems/productionSystem";

describe("productionSystem", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		uraFaction = world.spawn();
		// Set a reasonable pop cap
		world.set(PopulationState, { current: 0, max: 12 });
	});

	afterEach(() => {
		world.reset();
	});

	function spawnBarracks() {
		return world.spawn(
			IsBuilding,
			UnitType({ type: "barracks" }),
			Position({ x: 10, y: 10 }),
			ProductionQueue,
			OwnedBy(uraFaction),
		);
	}

	function spawnCommandPost() {
		return world.spawn(
			IsBuilding,
			UnitType({ type: "command_post" }),
			Position({ x: 5, y: 5 }),
			ProductionQueue,
			OwnedBy(uraFaction),
		);
	}

	describe("queueUnit", () => {
		it("should queue a mudfoot at a barracks and deduct resources", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 50 });
			const barracks = spawnBarracks();

			const result = queueUnit(barracks, "mudfoot", world);

			expect(result).toBe(true);

			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(1);
			expect(queue[0].unitType).toBe("mudfoot");
			expect(queue[0].progress).toBe(0);

			// Resources should be deducted (mudfoot costs 80 fish, 20 salvage)
			const pool = world.get(ResourcePool)!;
			expect(pool.fish).toBe(20);
			expect(pool.salvage).toBe(30);
		});

		it("should reject queueing if insufficient resources", () => {
			const barracks = spawnBarracks();

			const result = queueUnit(barracks, "mudfoot", world);

			expect(result).toBe(false);
			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(0);
		});

		it("should reject queueing if population cap reached", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 50 });
			world.set(PopulationState, { current: 12, max: 12 }); // At cap

			const barracks = spawnBarracks();

			const result = queueUnit(barracks, "mudfoot", world);

			expect(result).toBe(false);
		});

		it("should reject queueing a unit type not trained at this building", () => {
			world.set(ResourcePool, { fish: 200, timber: 0, salvage: 100 });
			const barracks = spawnBarracks();

			// River Rat is trained at Command Post, not Barracks
			const result = queueUnit(barracks, "river_rat", world);

			expect(result).toBe(false);
		});

		it("should allow queueing river_rat at command post", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 0 });
			const cp = spawnCommandPost();

			const result = queueUnit(cp, "river_rat", world);

			expect(result).toBe(true);

			// river_rat costs 50 fish
			expect(world.get(ResourcePool)!.fish).toBe(50);
		});

		it("should reserve population when queueing", () => {
			world.set(ResourcePool, { fish: 200, timber: 0, salvage: 50 });
			const barracks = spawnBarracks();

			queueUnit(barracks, "mudfoot", world);

			expect(world.get(PopulationState)!.current).toBe(1);
		});
	});

	describe("production progress", () => {
		it("should advance progress on the first queue item each tick", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 50 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);

			// Tick 10 seconds (barracks buildTime = 30s)
			productionSystem(world, 10);

			const queue = barracks.get(ProductionQueue);
			expect(queue[0].progress).toBeCloseTo(33.33, 0);
		});

		it("should spawn a unit when production completes", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 50 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);

			// Tick enough to complete (30s)
			productionSystem(world, 30);

			// Queue should be empty
			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(0);

			// A new unit entity should exist
			const units = world.query(UnitType, Position, Health);
			// Filter to just mudfoot units (exclude buildings which also have UnitType)
			let mudfootCount = 0;
			for (const unit of units) {
				if (unit.get(UnitType).type === "mudfoot" && !unit.has(IsBuilding)) {
					mudfootCount++;
				}
			}
			expect(mudfootCount).toBe(1);
		});

		it("should spawn unit at rally point when set", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 50 });
			const barracks = spawnBarracks();
			barracks.add(RallyPoint({ x: 15, y: 20 }));
			queueUnit(barracks, "mudfoot", world);

			productionSystem(world, 30);

			const units = world.query(UnitType, Position, Health);
			for (const unit of units) {
				if (unit.get(UnitType).type === "mudfoot" && !unit.has(IsBuilding)) {
					const pos = unit.get(Position);
					expect(pos.x).toBe(15);
					expect(pos.y).toBe(20);
				}
			}
		});

		it("should spawn unit offset from building when no rally point", () => {
			world.set(ResourcePool, { fish: 100, timber: 0, salvage: 50 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);

			productionSystem(world, 30);

			const units = world.query(UnitType, Position, Health);
			for (const unit of units) {
				if (unit.get(UnitType).type === "mudfoot" && !unit.has(IsBuilding)) {
					const pos = unit.get(Position);
					// Should be offset from building position (10, 10) -> (11, 10)
					expect(pos.x).toBe(11);
					expect(pos.y).toBe(10);
				}
			}
		});

		it("should process queue items sequentially", () => {
			world.set(ResourcePool, { fish: 200, timber: 0, salvage: 100 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);
			queueUnit(barracks, "mudfoot", world);

			// Complete first item
			productionSystem(world, 30);

			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(1);
			expect(queue[0].unitType).toBe("mudfoot");

			// Complete second item
			productionSystem(world, 30);

			expect(barracks.get(ProductionQueue).length).toBe(0);
		});

		it("should not process empty queues", () => {
			const barracks = spawnBarracks();

			// Should not throw
			expect(() => productionSystem(world, 1)).not.toThrow();
		});
	});
});
