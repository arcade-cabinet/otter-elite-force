/**
 * Buildable Templates Tests
 *
 * Tests for ECS-integrated buildable structure definitions
 */

import { describe, expect, it } from "vitest";
import {
	BUILDABLE_TEMPLATES,
	canAffordBuildable,
	deductBuildableCost,
	getBuildablesByCategory,
	getBuildableTemplate,
	getUnlockedBuildables,
} from "../buildableTemplates";

describe("Buildable Templates", () => {
	describe("BUILDABLE_TEMPLATES", () => {
		it("should have at least 10 buildables", () => {
			expect(BUILDABLE_TEMPLATES.length).toBeGreaterThanOrEqual(10);
		});

		it("should have unique IDs", () => {
			const ids = BUILDABLE_TEMPLATES.map((b) => b.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it("should have all categories represented", () => {
			const categories = new Set(BUILDABLE_TEMPLATES.map((b) => b.category));
			expect(categories.has("FOUNDATION")).toBe(true);
			expect(categories.has("WALLS")).toBe(true);
			expect(categories.has("ROOF")).toBe(true);
			expect(categories.has("DEFENSE")).toBe(true);
			expect(categories.has("UTILITY")).toBe(true);
			expect(categories.has("COMFORT")).toBe(true);
		});

		it("should have valid resource costs", () => {
			for (const buildable of BUILDABLE_TEMPLATES) {
				expect(buildable.cost.wood).toBeGreaterThanOrEqual(0);
				expect(buildable.cost.metal).toBeGreaterThanOrEqual(0);
				expect(buildable.cost.supplies).toBeGreaterThanOrEqual(0);
			}
		});

		it("should have valid sizes", () => {
			for (const buildable of BUILDABLE_TEMPLATES) {
				expect(buildable.size.width).toBeGreaterThan(0);
				expect(buildable.size.depth).toBeGreaterThan(0);
				expect(buildable.size.height).toBeGreaterThan(0);
			}
		});

		it("should have snap rules defined", () => {
			for (const buildable of BUILDABLE_TEMPLATES) {
				expect(buildable.snapRules.length).toBeGreaterThan(0);
			}
		});

		it("should have positive health values", () => {
			for (const buildable of BUILDABLE_TEMPLATES) {
				expect(buildable.health).toBeGreaterThan(0);
			}
		});
	});

	describe("getBuildableTemplate", () => {
		it("should find buildable by ID", () => {
			const buildable = getBuildableTemplate("floor-section");
			expect(buildable).toBeDefined();
			expect(buildable?.name).toBe("Floor Section");
		});

		it("should return undefined for unknown ID", () => {
			const buildable = getBuildableTemplate("unknown-buildable");
			expect(buildable).toBeUndefined();
		});
	});

	describe("getBuildablesByCategory", () => {
		it("should return foundation items", () => {
			const foundations = getBuildablesByCategory("FOUNDATION");
			expect(foundations.length).toBeGreaterThan(0);

			for (const buildable of foundations) {
				expect(buildable.category).toBe("FOUNDATION");
			}
		});

		it("should return wall items", () => {
			const walls = getBuildablesByCategory("WALLS");
			expect(walls.length).toBeGreaterThan(0);
		});

		it("should return defense items", () => {
			const defenses = getBuildablesByCategory("DEFENSE");
			expect(defenses.length).toBeGreaterThan(0);
		});
	});

	describe("getUnlockedBuildables", () => {
		it("should return starter buildables when no requirements met", () => {
			const unlocked = getUnlockedBuildables(new Set());
			expect(unlocked.length).toBeGreaterThan(0);

			for (const buildable of unlocked) {
				expect(buildable.unlockRequirement).toBeNull();
			}
		});

		it("should include more buildables when requirements are met", () => {
			const noRequirements = getUnlockedBuildables(new Set());
			const withRequirements = getUnlockedBuildables(new Set(["Secure 2 Territories"]));

			expect(withRequirements.length).toBeGreaterThanOrEqual(noRequirements.length);
		});
	});

	describe("canAffordBuildable", () => {
		it("should return true when resources are sufficient", () => {
			const buildable = getBuildableTemplate("floor-section");
			if (!buildable) return;

			const resources = { wood: 100, metal: 50, supplies: 25 };
			expect(canAffordBuildable(buildable, resources)).toBe(true);
		});

		it("should return false when wood is insufficient", () => {
			const buildable = getBuildableTemplate("floor-section");
			if (!buildable) return;

			const resources = { wood: 0, metal: 50, supplies: 25 };
			expect(canAffordBuildable(buildable, resources)).toBe(false);
		});

		it("should return true when resources exactly match", () => {
			const buildable = getBuildableTemplate("floor-section");
			if (!buildable) return;

			expect(canAffordBuildable(buildable, buildable.cost)).toBe(true);
		});
	});

	describe("deductBuildableCost", () => {
		it("should reduce resources by cost", () => {
			const buildable = getBuildableTemplate("floor-section");
			if (!buildable) return;

			const resources = { wood: 100, metal: 50, supplies: 25 };
			const result = deductBuildableCost(buildable, resources);

			expect(result.wood).toBe(100 - buildable.cost.wood);
			expect(result.metal).toBe(50 - buildable.cost.metal);
			expect(result.supplies).toBe(25 - buildable.cost.supplies);
		});

		it("should not mutate original resources", () => {
			const buildable = getBuildableTemplate("floor-section");
			if (!buildable) return;

			const resources = { wood: 100, metal: 50, supplies: 25 };
			deductBuildableCost(buildable, resources);

			expect(resources.wood).toBe(100);
			expect(resources.metal).toBe(50);
			expect(resources.supplies).toBe(25);
		});
	});
});
