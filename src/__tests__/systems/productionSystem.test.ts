import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PopulationCost, ProductionQueue } from "../../ecs/traits/economy";
import { Health } from "../../ecs/traits/combat";
import { IsBuilding, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { RallyPoint } from "../../ecs/traits/orders";
import { OwnedBy } from "../../ecs/relations";
import { resourceStore } from "../../stores/resourceStore";
import { productionSystem, queueUnit } from "../../systems/productionSystem";

describe("productionSystem", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		uraFaction = world.spawn();
		resourceStore.getState().reset();
		// Set a reasonable pop cap
		resourceStore.getState().setPopulation(0, 12);
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
			resourceStore.getState().addResources({ fish: 100, salvage: 50 });
			const barracks = spawnBarracks();

			const result = queueUnit(barracks, "mudfoot");

			expect(result).toBe(true);

			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(1);
			expect(queue[0].unitType).toBe("mudfoot");
			expect(queue[0].progress).toBe(0);

			// Resources should be deducted (mudfoot costs 80 fish, 20 salvage)
			const resources = resourceStore.getState();
			expect(resources.fish).toBe(20);
			expect(resources.salvage).toBe(30);
		});

		it("should reject queueing if insufficient resources", () => {
			const barracks = spawnBarracks();

			const result = queueUnit(barracks, "mudfoot");

			expect(result).toBe(false);
			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(0);
		});

		it("should reject queueing if population cap reached", () => {
			resourceStore.getState().addResources({ fish: 100, salvage: 50 });
			resourceStore.getState().setPopulation(12, 12); // At cap

			const barracks = spawnBarracks();

			const result = queueUnit(barracks, "mudfoot");

			expect(result).toBe(false);
		});

		it("should reject queueing a unit type not trained at this building", () => {
			resourceStore.getState().addResources({ fish: 200, salvage: 100 });
			const barracks = spawnBarracks();

			// River Rat is trained at Command Post, not Barracks
			const result = queueUnit(barracks, "river_rat");

			expect(result).toBe(false);
		});

		it("should allow queueing river_rat at command post", () => {
			resourceStore.getState().addResources({ fish: 100 });
			const cp = spawnCommandPost();

			const result = queueUnit(cp, "river_rat");

			expect(result).toBe(true);

			// river_rat costs 50 fish
			expect(resourceStore.getState().fish).toBe(50);
		});

		it("should reserve population when queueing", () => {
			resourceStore.getState().addResources({ fish: 200, salvage: 50 });
			const barracks = spawnBarracks();

			queueUnit(barracks, "mudfoot");

			expect(resourceStore.getState().currentPop).toBe(1);
		});
	});

	describe("production progress", () => {
		it("should advance progress on the first queue item each tick", () => {
			resourceStore.getState().addResources({ fish: 100, salvage: 50 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot");

			// Tick 10 seconds (barracks buildTime = 30s)
			productionSystem(world, 10);

			const queue = barracks.get(ProductionQueue);
			expect(queue[0].progress).toBeCloseTo(33.33, 0);
		});

		it("should spawn a unit when production completes", () => {
			resourceStore.getState().addResources({ fish: 100, salvage: 50 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot");

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
			resourceStore.getState().addResources({ fish: 100, salvage: 50 });
			const barracks = spawnBarracks();
			barracks.add(RallyPoint({ x: 15, y: 20 }));
			queueUnit(barracks, "mudfoot");

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
			resourceStore.getState().addResources({ fish: 100, salvage: 50 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot");

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
			resourceStore.getState().addResources({ fish: 200, salvage: 100 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot");
			queueUnit(barracks, "mudfoot");

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
