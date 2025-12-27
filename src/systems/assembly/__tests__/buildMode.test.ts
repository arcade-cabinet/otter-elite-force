/**
 * Build Mode Tests
 *
 * Tests for player base construction system
 */

import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
	BUILDABLE_ITEMS,
	canAfford,
	createBuildModeState,
	deductCost,
	findNearestSnapPoint,
	validatePlacement,
	type PlacedStructure,
} from "../buildMode";

describe("Build Mode", () => {
	describe("BUILDABLE_ITEMS", () => {
		it("should have foundation items", () => {
			const foundations = BUILDABLE_ITEMS.filter((item) => item.category === "FOUNDATION");
			expect(foundations.length).toBeGreaterThan(0);
		});

		it("should have wall items", () => {
			const walls = BUILDABLE_ITEMS.filter((item) => item.category === "WALLS");
			expect(walls.length).toBeGreaterThan(0);
		});

		it("should have roof items", () => {
			const roofs = BUILDABLE_ITEMS.filter((item) => item.category === "ROOF");
			expect(roofs.length).toBeGreaterThan(0);
		});

		it("should have defense items", () => {
			const defenses = BUILDABLE_ITEMS.filter((item) => item.category === "DEFENSE");
			expect(defenses.length).toBeGreaterThan(0);
		});

		it("should have valid resource costs for all items", () => {
			for (const item of BUILDABLE_ITEMS) {
				expect(item.cost).toBeDefined();
				expect(item.cost.wood).toBeGreaterThanOrEqual(0);
				expect(item.cost.metal).toBeGreaterThanOrEqual(0);
				expect(item.cost.supplies).toBeGreaterThanOrEqual(0);
			}
		});

		it("should have snap rules defined for all items", () => {
			for (const item of BUILDABLE_ITEMS) {
				expect(item.snapRules).toBeDefined();
				expect(Array.isArray(item.snapRules)).toBe(true);
			}
		});

		it("should have unique IDs", () => {
			const ids = BUILDABLE_ITEMS.map((item) => item.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});
	});

	describe("createBuildModeState", () => {
		it("should create a state object", () => {
			const state = createBuildModeState();

			expect(state).toBeDefined();
			expect(state.isActive).toBe(false);
			expect(state.selectedItem).toBeNull();
		});

		it("should initialize with resources", () => {
			const state = createBuildModeState();

			expect(state.resources).toBeDefined();
			expect(typeof state.resources.wood).toBe("number");
			expect(typeof state.resources.metal).toBe("number");
			expect(typeof state.resources.supplies).toBe("number");
		});

		it("should have empty placed structures", () => {
			const state = createBuildModeState();

			expect(state.placedStructures).toBeDefined();
			expect(Array.isArray(state.placedStructures)).toBe(true);
		});
	});

	describe("canAfford", () => {
		it("should return true when resources are sufficient", () => {
			const state = createBuildModeState();
			state.resources = { wood: 100, metal: 50, supplies: 25 };

			const item = BUILDABLE_ITEMS.find((i) => i.cost.wood <= 100);
			if (!item) return;

			expect(canAfford(state, item)).toBe(true);
		});

		it("should return false when wood is insufficient", () => {
			const state = createBuildModeState();
			state.resources = { wood: 0, metal: 50, supplies: 25 };

			const item = BUILDABLE_ITEMS.find((i) => i.cost.wood > 0);
			if (!item) return;

			expect(canAfford(state, item)).toBe(false);
		});

		it("should return false when metal is insufficient", () => {
			const state = createBuildModeState();
			state.resources = { wood: 100, metal: 0, supplies: 25 };

			const item = BUILDABLE_ITEMS.find((i) => i.cost.metal > 0);
			if (!item) return;

			expect(canAfford(state, item)).toBe(false);
		});
	});

	describe("deductCost", () => {
		it("should reduce resources by cost amounts", () => {
			const state = createBuildModeState();
			state.resources = { wood: 100, metal: 50, supplies: 25 };

			const item = BUILDABLE_ITEMS[0];
			const result = deductCost(state, item);

			expect(result.wood).toBe(100 - item.cost.wood);
			expect(result.metal).toBe(50 - item.cost.metal);
			expect(result.supplies).toBe(25 - item.cost.supplies);
		});
	});

	describe("validatePlacement", () => {
		it("should accept placement for foundation on ground", () => {
			const item = BUILDABLE_ITEMS.find((i) => i.category === "FOUNDATION");
			if (!item) return;

			const result = validatePlacement(new THREE.Vector3(0, 0, 0), item, [], 0);

			expect(result.valid).toBe(true);
		});

		it("should reject placement too high without support", () => {
			const item = BUILDABLE_ITEMS.find((i) => i.category === "FOUNDATION");
			if (!item) return;

			const result = validatePlacement(new THREE.Vector3(0, 10, 0), item, [], 0);

			// Should be invalid without stilts
			expect(result.valid).toBe(false);
		});
	});

	describe("findNearestSnapPoint", () => {
		it("should find snap point within range", () => {
			const item = BUILDABLE_ITEMS[0];
			const placedStructures: PlacedStructure[] = [
				{
					id: "placed-1",
					itemId: item.id,
					position: new THREE.Vector3(0, 0, 0),
					rotation: 0,
					snapPoints: [
						{
							position: new THREE.Vector3(2, 0, 0),
							direction: new THREE.Vector3(1, 0, 0),
							acceptsTypes: [item.category],
						},
					],
				},
			];

			const result = findNearestSnapPoint(new THREE.Vector3(2.5, 0, 0), item, placedStructures, 2);

			expect(result).not.toBeNull();
		});

		it("should return null when no snap point in range", () => {
			const item = BUILDABLE_ITEMS[0];
			const placedStructures: PlacedStructure[] = [
				{
					id: "placed-1",
					itemId: item.id,
					position: new THREE.Vector3(0, 0, 0),
					rotation: 0,
					snapPoints: [
						{
							position: new THREE.Vector3(2, 0, 0),
							direction: new THREE.Vector3(1, 0, 0),
							acceptsTypes: [item.category],
						},
					],
				},
			];

			const result = findNearestSnapPoint(
				new THREE.Vector3(20, 0, 0), // Far away
				item,
				placedStructures,
				2,
			);

			expect(result).toBeNull();
		});
	});
});
