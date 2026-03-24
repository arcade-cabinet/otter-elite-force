import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ResearchSlot } from "../../ecs/traits/economy";
import { Health, Attack } from "../../ecs/traits/combat";
import { IsBuilding, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { OwnedBy } from "../../ecs/relations";
import { resourceStore } from "../../stores/resourceStore";
import { queueResearch, researchSystem } from "../../systems/researchSystem";

describe("researchSystem", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		uraFaction = world.spawn();
		resourceStore.getState().reset();
	});

	afterEach(() => {
		world.reset();
	});

	function spawnArmory() {
		return world.spawn(
			IsBuilding,
			UnitType({ type: "armory" }),
			Position({ x: 10, y: 10 }),
			ResearchSlot,
			OwnedBy(uraFaction),
		);
	}

	function spawnMudfoot() {
		return world.spawn(
			UnitType({ type: "mudfoot" }),
			Position({ x: 5, y: 5 }),
			Health({ current: 80, max: 80 }),
			OwnedBy(uraFaction),
		);
	}

	function spawnShellcracker() {
		return world.spawn(
			UnitType({ type: "shellcracker" }),
			Position({ x: 6, y: 6 }),
			Health({ current: 50, max: 50 }),
			Attack({ damage: 10, range: 5, cooldown: 1.0, timer: 0 }),
			OwnedBy(uraFaction),
		);
	}

	function spawnSapper() {
		return world.spawn(
			UnitType({ type: "sapper" }),
			Position({ x: 7, y: 7 }),
			Health({ current: 60, max: 60 }),
			Attack({ damage: 8, range: 1, cooldown: 1.0, timer: 0 }),
			OwnedBy(uraFaction),
		);
	}

	// -----------------------------------------------------------------------
	// queueResearch
	// -----------------------------------------------------------------------

	describe("queueResearch", () => {
		it("should start research at an armory and deduct resources", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();

			const result = queueResearch(armory, "hardshell_armor");

			expect(result).toBe(true);

			const slot = armory.get(ResearchSlot);
			expect(slot).not.toBeNull();
			expect(slot!.researchId).toBe("hardshell_armor");
			expect(slot!.progress).toBe(0);
			expect(slot!.researchTime).toBe(20);

			// Hardshell Armor costs 150 salvage
			expect(resourceStore.getState().salvage).toBe(50);
		});

		it("should reject research if insufficient resources", () => {
			const armory = spawnArmory();

			const result = queueResearch(armory, "hardshell_armor");

			expect(result).toBe(false);
			expect(armory.get(ResearchSlot)).toBeNull();
		});

		it("should reject research if armory already has active research", () => {
			resourceStore.getState().addResources({ salvage: 300 });
			const armory = spawnArmory();

			queueResearch(armory, "hardshell_armor");
			const result = queueResearch(armory, "fish_oil_arrows");

			expect(result).toBe(false);
			// Resources for second research should not be deducted
			// First deducted 150, so 300-150 = 150 remaining
			expect(resourceStore.getState().salvage).toBe(150);
		});

		it("should reject research that is already completed", () => {
			resourceStore.getState().addResources({ salvage: 300 });
			resourceStore.getState().completeResearch("hardshell_armor");
			const armory = spawnArmory();

			const result = queueResearch(armory, "hardshell_armor");

			expect(result).toBe(false);
			// Resources should not be deducted
			expect(resourceStore.getState().salvage).toBe(300);
		});

		it("should reject unknown research id", () => {
			resourceStore.getState().addResources({ salvage: 9999 });
			const armory = spawnArmory();

			const result = queueResearch(armory, "nonexistent_research");

			expect(result).toBe(false);
		});

		it("should reject research at a non-armory building", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const barracks = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Position({ x: 10, y: 10 }),
				ResearchSlot,
				OwnedBy(uraFaction),
			);

			const result = queueResearch(barracks, "hardshell_armor");

			expect(result).toBe(false);
		});
	});

	// -----------------------------------------------------------------------
	// researchSystem — progress
	// -----------------------------------------------------------------------

	describe("research progress", () => {
		it("should advance research progress over time", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();
			queueResearch(armory, "hardshell_armor");

			researchSystem(world, 10);

			const slot = armory.get(ResearchSlot);
			expect(slot).not.toBeNull();
			// 10s / 20s researchTime = 50%
			expect(slot!.progress).toBeCloseTo(50, 0);
		});

		it("should complete research and clear the slot", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();
			queueResearch(armory, "hardshell_armor");

			researchSystem(world, 20);

			// Slot should be cleared
			expect(armory.get(ResearchSlot)).toBeNull();

			// Should be marked as completed in the store
			expect(resourceStore.getState().isResearched("hardshell_armor")).toBe(true);
		});

		it("should not process empty research slots", () => {
			const armory = spawnArmory();

			// Should not throw
			expect(() => researchSystem(world, 1)).not.toThrow();
			expect(armory.get(ResearchSlot)).toBeNull();
		});
	});

	// -----------------------------------------------------------------------
	// Research effects — stat modifications
	// -----------------------------------------------------------------------

	describe("research effects", () => {
		it("hardshell_armor should increase all Mudfoot HP by 20", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();
			const mudfoot1 = spawnMudfoot();
			const mudfoot2 = spawnMudfoot();

			queueResearch(armory, "hardshell_armor");
			researchSystem(world, 20); // Complete it

			// Both mudfoots should have 100 max HP (80 + 20)
			expect(mudfoot1.get(Health).max).toBe(100);
			expect(mudfoot1.get(Health).current).toBe(100);
			expect(mudfoot2.get(Health).max).toBe(100);
			expect(mudfoot2.get(Health).current).toBe(100);
		});

		it("fish_oil_arrows should increase all Shellcracker damage by 3", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();
			const sc = spawnShellcracker();

			queueResearch(armory, "fish_oil_arrows");
			researchSystem(world, 15); // Complete it (time=15)

			// Shellcracker damage: 10 -> 13
			expect(sc.get(Attack).damage).toBe(13);
		});

		it("demolition_training should increase all Sapper damage by 50% (base attack)", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();
			const sapper = spawnSapper();

			queueResearch(armory, "demolition_training");
			researchSystem(world, 20);

			// Sapper base damage stays 8, but the effect description says +50% vs buildings (30->45)
			// The ECS Attack trait only has a generic "damage" field.
			// We'll apply the bonus to the Attack.damage field for simplicity: 8 * 1.5 = 12
			expect(sapper.get(Attack).damage).toBe(12);
		});

		it("should not affect non-matching unit types", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();
			const sc = spawnShellcracker();

			// Hardshell armor only affects Mudfoots, not Shellcrackers
			queueResearch(armory, "hardshell_armor");
			researchSystem(world, 20);

			expect(sc.get(Health).max).toBe(50); // Unchanged
		});

		it("should apply effects to units spawned before research completes", () => {
			resourceStore.getState().addResources({ salvage: 200 });
			const armory = spawnArmory();

			queueResearch(armory, "hardshell_armor");

			// Spawn a mudfoot mid-research
			researchSystem(world, 10); // 50% done
			const mudfoot = spawnMudfoot();
			researchSystem(world, 10); // Complete

			// The mudfoot that existed when research completed should be upgraded
			expect(mudfoot.get(Health).max).toBe(100);
		});
	});
});
