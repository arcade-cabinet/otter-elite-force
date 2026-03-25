/**
 * US-018: Research UI panel
 *
 * Tests the research panel behavior:
 * - Armory shows available research
 * - Each research shows: name, cost, time, effect
 * - Completed research marked
 * - Research in progress shows progress bar
 * - Unaffordable research greyed out
 * - Starting research deducts resources and begins timer
 * - Completion adds to CompletedResearch singleton
 */
import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ALL_RESEARCH } from "@/data/research";
import { OwnedBy } from "@/ecs/relations";
import { initSingletons } from "@/ecs/singletons";
import { ResearchSlot } from "@/ecs/traits/economy";
import { IsBuilding, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { CompletedResearch, ResourcePool } from "@/ecs/traits/state";
import { queueResearch, researchSystem } from "@/systems/researchSystem";

describe("US-018: Research UI panel", () => {
	let world: ReturnType<typeof createWorld>;
	let uraFaction: ReturnType<ReturnType<typeof createWorld>["spawn"]>;

	beforeEach(() => {
		world = createWorld();
		initSingletons(world);
		uraFaction = world.spawn();
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

	// -----------------------------------------------------------------------
	// Research data availability
	// -----------------------------------------------------------------------

	describe("research data definitions", () => {
		it("should have all 9 research items available", () => {
			const allResearch = Object.values(ALL_RESEARCH);
			expect(allResearch.length).toBe(9);
		});

		it("should have all armory research items with required fields", () => {
			const armoryResearch = Object.values(ALL_RESEARCH).filter((r) => r.researchAt === "armory");

			for (const research of armoryResearch) {
				expect(research.id).toBeTruthy();
				expect(research.name).toBeTruthy();
				expect(research.cost).toBeDefined();
				expect(typeof research.time).toBe("number");
				expect(research.effect).toBeTruthy();
				expect(research.researchAt).toBe("armory");
			}
		});

		it("each research should have a salvage cost", () => {
			const armoryResearch = Object.values(ALL_RESEARCH).filter((r) => r.researchAt === "armory");

			for (const research of armoryResearch) {
				expect((research.cost.salvage ?? 0) > 0).toBe(true);
			}
		});
	});

	// -----------------------------------------------------------------------
	// Completed research tracking
	// -----------------------------------------------------------------------

	describe("completed research", () => {
		it("should track completed research in CompletedResearch singleton", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 200 });
			const armory = spawnArmory();
			queueResearch(armory, "hardshell_armor", world);

			// Complete the research
			researchSystem(world, 20);

			const completed = world.get(CompletedResearch);
			expect(completed).toBeDefined();
			expect(completed?.ids.has("hardshell_armor")).toBe(true);
		});

		it("should not allow re-researching completed items", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 500 });
			const armory = spawnArmory();

			// Complete hardshell_armor
			queueResearch(armory, "hardshell_armor", world);
			researchSystem(world, 20);

			// Try to research it again
			const result = queueResearch(armory, "hardshell_armor", world);
			expect(result).toBe(false);
		});

		it("should allow researching a different item after completing one", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 500 });
			const armory = spawnArmory();

			// Complete hardshell_armor
			queueResearch(armory, "hardshell_armor", world);
			researchSystem(world, 20);

			// Start fish_oil_arrows
			const result = queueResearch(armory, "fish_oil_arrows", world);
			expect(result).toBe(true);

			const slot = armory.get(ResearchSlot);
			expect(slot).not.toBeNull();
			expect(slot?.researchId).toBe("fish_oil_arrows");
		});
	});

	// -----------------------------------------------------------------------
	// Affordability gating
	// -----------------------------------------------------------------------

	describe("affordability checks", () => {
		it("should reject research when resources are insufficient", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 0 });
			const armory = spawnArmory();

			const result = queueResearch(armory, "hardshell_armor", world);
			expect(result).toBe(false);
			expect(armory.get(ResearchSlot)).toBeNull();
		});

		it("should deduct resources when research starts", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 200 });
			const armory = spawnArmory();

			queueResearch(armory, "hardshell_armor", world);

			// Hardshell Armor costs 150 salvage
			expect(world.get(ResourcePool)?.salvage).toBe(50);
		});

		it("should not deduct resources when research is rejected", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 50 });
			const armory = spawnArmory();

			// Hardshell Armor costs 150 salvage — not enough
			const result = queueResearch(armory, "hardshell_armor", world);
			expect(result).toBe(false);
			expect(world.get(ResourcePool)?.salvage).toBe(50);
		});
	});

	// -----------------------------------------------------------------------
	// Research in progress
	// -----------------------------------------------------------------------

	describe("research progress", () => {
		it("should show progress from 0 to 100% over researchTime", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 200 });
			const armory = spawnArmory();
			queueResearch(armory, "hardshell_armor", world);

			const slot = armory.get(ResearchSlot);
			expect(slot?.progress).toBe(0);

			// 5 seconds of a 20-second research = 25%
			researchSystem(world, 5);
			expect(slot?.progress).toBeCloseTo(25, 0);

			// 10 more seconds = 75%
			researchSystem(world, 10);
			expect(slot?.progress).toBeCloseTo(75, 0);
		});

		it("should clear research slot on completion", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 200 });
			const armory = spawnArmory();
			queueResearch(armory, "hardshell_armor", world);

			researchSystem(world, 20);

			expect(armory.get(ResearchSlot)).toBeNull();
		});

		it("should block concurrent research at same armory", () => {
			world.set(ResourcePool, { fish: 0, timber: 0, salvage: 500 });
			const armory = spawnArmory();
			queueResearch(armory, "hardshell_armor", world);

			// Armory already busy
			const result = queueResearch(armory, "fish_oil_arrows", world);
			expect(result).toBe(false);
		});
	});

	// -----------------------------------------------------------------------
	// UI data shape validation
	// -----------------------------------------------------------------------

	describe("UI data contract", () => {
		it("research items for armory should include all expected fields for UI", () => {
			const armoryResearch = Object.values(ALL_RESEARCH).filter((r) => r.researchAt === "armory");

			expect(armoryResearch.length).toBeGreaterThan(0);

			for (const research of armoryResearch) {
				// Name for display
				expect(typeof research.name).toBe("string");
				expect(research.name.length).toBeGreaterThan(0);

				// Cost for affordability badge
				expect(research.cost).toBeDefined();

				// Time for duration display
				expect(typeof research.time).toBe("number");
				expect(research.time).toBeGreaterThan(0);

				// Effect for description
				expect(typeof research.effect).toBe("string");
				expect(research.effect.length).toBeGreaterThan(0);
			}
		});

		it("CompletedResearch ids Set should be serializable via spread", () => {
			const completed = world.get(CompletedResearch);
			expect(completed).toBeDefined();
			expect(completed?.ids).toBeInstanceOf(Set);

			completed?.ids.add("test_research");
			const ids = completed?.ids ?? new Set<string>();
			const serialized = [...ids];
			expect(serialized).toContain("test_research");
		});
	});
});
