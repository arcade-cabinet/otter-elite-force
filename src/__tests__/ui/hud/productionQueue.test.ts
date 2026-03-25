/**
 * US-017: Building training queue progress indicator
 *
 * Tests the production queue progress bar behavior:
 * - Active queue shows progress 0% to 100%
 * - Unit name and icon visible next to progress
 * - Queue depth indicator ("N more queued")
 * - Progress bar overlay helpers for game view
 */
import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OwnedBy } from "@/ecs/relations";
import { initSingletons } from "@/ecs/singletons";
import { Health } from "@/ecs/traits/combat";
import { ProductionQueue, ResearchSlot } from "@/ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { PopulationState, ResourcePool } from "@/ecs/traits/state";
import { getProductionProgress, getResearchProgress } from "@/rendering/ProductionOverlay";
import { productionSystem, queueUnit } from "@/systems/productionSystem";

describe("US-017: Building training queue progress", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		uraFaction = world.spawn();
		world.set(PopulationState, { current: 0, max: 20 });
	});

	afterEach(() => {
		world.reset();
	});

	function spawnBarracks() {
		return world.spawn(
			IsBuilding,
			Faction({ id: "ura" }),
			UnitType({ type: "barracks" }),
			Health({ current: 350, max: 350 }),
			Position({ x: 10, y: 10 }),
			ProductionQueue,
			OwnedBy(uraFaction),
		);
	}

	function spawnArmory() {
		return world.spawn(
			IsBuilding,
			Faction({ id: "ura" }),
			UnitType({ type: "armory" }),
			Health({ current: 400, max: 400 }),
			Position({ x: 15, y: 10 }),
			ProductionQueue,
			ResearchSlot,
			OwnedBy(uraFaction),
		);
	}

	// -----------------------------------------------------------------------
	// Progress bar calculation
	// -----------------------------------------------------------------------

	describe("production progress calculation", () => {
		it("should return null for empty queue", () => {
			expect(getProductionProgress([])).toBeNull();
			expect(getProductionProgress(null)).toBeNull();
			expect(getProductionProgress(undefined)).toBeNull();
		});

		it("should return 0 for freshly queued item", () => {
			const queue = [{ unitType: "mudfoot", progress: 0, buildTime: 20 }];
			expect(getProductionProgress(queue)).toBe(0);
		});

		it("should return 0.5 for 50% progress", () => {
			const queue = [{ unitType: "mudfoot", progress: 50, buildTime: 20 }];
			expect(getProductionProgress(queue)).toBeCloseTo(0.5);
		});

		it("should return 1.0 for 100% progress", () => {
			const queue = [{ unitType: "mudfoot", progress: 100, buildTime: 20 }];
			expect(getProductionProgress(queue)).toBe(1.0);
		});

		it("should clamp above 100% to 1.0", () => {
			const queue = [{ unitType: "mudfoot", progress: 110, buildTime: 20 }];
			expect(getProductionProgress(queue)).toBe(1.0);
		});
	});

	// -----------------------------------------------------------------------
	// Research progress calculation
	// -----------------------------------------------------------------------

	describe("research progress calculation", () => {
		it("should return null for null slot", () => {
			expect(getResearchProgress(null)).toBeNull();
			expect(getResearchProgress(undefined)).toBeNull();
		});

		it("should return 0 for freshly started research", () => {
			const slot = { researchId: "hardshell_armor", progress: 0, researchTime: 20 };
			expect(getResearchProgress(slot)).toBe(0);
		});

		it("should return 0.75 for 75% progress", () => {
			const slot = { researchId: "hardshell_armor", progress: 75, researchTime: 20 };
			expect(getResearchProgress(slot)).toBeCloseTo(0.75);
		});
	});

	// -----------------------------------------------------------------------
	// Integration: queue + production tick
	// -----------------------------------------------------------------------

	describe("queue progress via production system", () => {
		it("should fill progress from 0% to 100% over buildTime", () => {
			world.set(ResourcePool, { fish: 200, timber: 0, salvage: 100 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);

			const queue = barracks.get(ProductionQueue);
			expect(queue[0].progress).toBe(0);

			// Tick 5 seconds (mudfoot trainTime = 20s) -> 25%
			productionSystem(world, 5);
			expect(queue[0].progress).toBeCloseTo(25, 0);

			// Tick 5 more -> 50%
			productionSystem(world, 5);
			expect(queue[0].progress).toBeCloseTo(50, 0);
		});

		it("should show queue depth when multiple items queued", () => {
			world.set(ResourcePool, { fish: 500, timber: 0, salvage: 200 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);
			queueUnit(barracks, "mudfoot", world);
			queueUnit(barracks, "shellcracker", world);

			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(3);

			// Current item
			expect(queue[0].unitType).toBe("mudfoot");
			// Queue depth (items after current)
			const queuedAfter = queue.length - 1;
			expect(queuedAfter).toBe(2);
		});

		it("should advance to next queue item after completion", () => {
			world.set(ResourcePool, { fish: 300, timber: 0, salvage: 100 });
			const barracks = spawnBarracks();
			queueUnit(barracks, "mudfoot", world);
			queueUnit(barracks, "shellcracker", world);

			// Complete first item (mudfoot trainTime = 20s)
			productionSystem(world, 20);

			const queue = barracks.get(ProductionQueue);
			expect(queue.length).toBe(1);
			expect(queue[0].unitType).toBe("shellcracker");
			expect(queue[0].progress).toBe(0);
		});
	});

	// -----------------------------------------------------------------------
	// Building with both production and research
	// -----------------------------------------------------------------------

	describe("armory with production and research", () => {
		it("should track production and research independently", () => {
			world.set(ResourcePool, { fish: 200, timber: 0, salvage: 400 });
			const armory = spawnArmory();
			queueUnit(armory, "sapper", world);

			const queue = armory.get(ProductionQueue);
			expect(queue.length).toBe(1);
			expect(queue[0].unitType).toBe("sapper");

			// Research slot is initially null
			expect(armory.get(ResearchSlot)).toBeNull();

			// Production and research are independent traits
			const productionProgress = getProductionProgress(queue);
			const researchProgress = getResearchProgress(armory.get(ResearchSlot));
			expect(productionProgress).toBe(0);
			expect(researchProgress).toBeNull();
		});
	});
});
