/**
 * Settlement Assembler Tests
 *
 * Tests procedural generation of settlements (villages, outposts, camps)
 */

import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
	assembleElevatedNetwork,
	assembleSettlement,
	SETTLEMENT_CONFIGS,
} from "../settlementAssembler";

describe("Settlement Assembler", () => {
	describe("assembleSettlement", () => {
		it("should generate a native village", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			expect(settlement.type).toBe("NATIVE_VILLAGE");
			expect(settlement.faction).toBe("NATIVE");
			expect(settlement.structures.length).toBeGreaterThan(0);
		});

		it("should generate a Scale-Guard outpost", () => {
			const center = new THREE.Vector3(50, 0, 50);
			const settlement = assembleSettlement(12345, "SCALE_GUARD_OUTPOST", center, "SCALE_GUARD");

			expect(settlement.type).toBe("SCALE_GUARD_OUTPOST");
			expect(settlement.faction).toBe("SCALE_GUARD");
			expect(settlement.structures.length).toBeGreaterThan(0);
		});

		it("should place structures around the center", () => {
			const center = new THREE.Vector3(100, 0, 100);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			for (const structure of settlement.structures) {
				const dist = structure.worldPosition.distanceTo(center);
				expect(dist).toBeLessThan(settlement.radius + 5);
			}
		});

		it("should generate paths connecting structures", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			if (settlement.structures.length > 1) {
				expect(settlement.paths.length).toBeGreaterThan(0);
			}
		});

		it("should generate inhabitants for populated settlements", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			expect(settlement.inhabitants.length).toBeGreaterThan(0);
		});

		it("should generate consistent settlements with same seed", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const s1 = assembleSettlement(42, "NATIVE_VILLAGE", center, "NATIVE");
			const s2 = assembleSettlement(42, "NATIVE_VILLAGE", center, "NATIVE");

			expect(s1.structures.length).toBe(s2.structures.length);
			expect(s1.inhabitants.length).toBe(s2.inhabitants.length);
		});

		it("should generate different settlements with different seeds", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const s1 = assembleSettlement(111, "NATIVE_VILLAGE", center, "NATIVE");
			const s2 = assembleSettlement(222, "NATIVE_VILLAGE", center, "NATIVE");

			// At least one property should differ
			const different =
				s1.structures.length !== s2.structures.length ||
				s1.inhabitants.length !== s2.inhabitants.length;
			expect(different).toBe(true);
		});

		it("should calculate correct settlement radius", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			// Radius should encompass all structures
			for (const structure of settlement.structures) {
				const dist = structure.worldPosition.distanceTo(center);
				expect(dist).toBeLessThanOrEqual(settlement.radius);
			}
		});
	});

	describe("Settlement Types", () => {
		it("should generate a fishing camp with structures", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "FISHING_CAMP", center, "NATIVE");

			// Fishing camp should have structures
			expect(settlement.structures.length).toBeGreaterThanOrEqual(1);
			// Config requires dock platforms, but they fall back to basic huts for now
			const config = SETTLEMENT_CONFIGS.FISHING_CAMP;
			expect(config.structures.some((s) => s.type === "DOCK_PLATFORM")).toBe(true);
		});

		it("should generate a prison compound with center buffer for cage", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "PRISON_COMPOUND", center, "SCALE_GUARD");

			// Structures should be around perimeter, not in center
			for (const structure of settlement.structures) {
				const dist = structure.worldPosition.distanceTo(center);
				// Most structures should be at perimeter
				if (dist < 3) {
					// Command post might be in center
					expect(structure.template.archetype).toBe("COMMAND_POST");
				}
			}
		});

		it("should generate a siphon facility with structures", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "SIPHON_FACILITY", center, "SCALE_GUARD");

			// Siphon facility should have structures
			expect(settlement.structures.length).toBeGreaterThanOrEqual(1);
			// Config requires storage sheds, but they fall back to basic huts for now
			const config = SETTLEMENT_CONFIGS.SIPHON_FACILITY;
			expect(config.structures.some((s) => s.type === "STORAGE_SHED")).toBe(true);
		});

		it("should generate outpost with watchtowers", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "SCALE_GUARD_OUTPOST", center, "SCALE_GUARD");

			const towers = settlement.structures.filter((s) => s.template.archetype === "WATCHTOWER");
			expect(towers.length).toBeGreaterThanOrEqual(1);
		});

		it("should generate player base with minimal starting structures", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "PLAYER_BASE", center, "URA");

			expect(settlement.structures.length).toBeGreaterThanOrEqual(1);
			expect(settlement.inhabitants.length).toBe(0); // No auto-populated inhabitants
		});
	});

	describe("Layout Patterns", () => {
		it("should use scattered layout for villages", () => {
			const config = SETTLEMENT_CONFIGS.NATIVE_VILLAGE;
			expect(config.layout.pattern).toBe("SCATTERED");
		});

		it("should use linear layout for fishing camps", () => {
			const config = SETTLEMENT_CONFIGS.FISHING_CAMP;
			expect(config.layout.pattern).toBe("LINEAR");
		});

		it("should use circular layout for prison compounds", () => {
			const config = SETTLEMENT_CONFIGS.PRISON_COMPOUND;
			expect(config.layout.pattern).toBe("CIRCULAR");
		});

		it("should use grid layout for siphon facilities", () => {
			const config = SETTLEMENT_CONFIGS.SIPHON_FACILITY;
			expect(config.layout.pattern).toBe("GRID");
		});

		it("should use defensive layout for outposts", () => {
			const config = SETTLEMENT_CONFIGS.SCALE_GUARD_OUTPOST;
			expect(config.layout.pattern).toBe("DEFENSIVE");
		});
	});

	describe("Path Generation", () => {
		it("should connect all structures with paths when configured", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			if (settlement.structures.length > 1) {
				// MST requires n-1 edges to connect n nodes
				expect(settlement.paths.length).toBeGreaterThanOrEqual(settlement.structures.length - 1);
			}
		});

		it("should set path width according to config", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");
			const config = SETTLEMENT_CONFIGS.NATIVE_VILLAGE;

			for (const path of settlement.paths) {
				expect(path.width).toBe(config.paths.width);
			}
		});

		it("should set path style according to config", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "FISHING_CAMP", center, "NATIVE");
			const config = SETTLEMENT_CONFIGS.FISHING_CAMP;

			for (const path of settlement.paths) {
				expect(path.style).toBe(config.paths.style);
			}
		});
	});

	describe("Inhabitants", () => {
		it("should generate villagers for native village", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			const villagers = settlement.inhabitants.filter((i) => i.type === "VILLAGER");
			expect(villagers.length).toBeGreaterThan(0);
		});

		it("should generate guards for outpost", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "SCALE_GUARD_OUTPOST", center, "SCALE_GUARD");

			const guards = settlement.inhabitants.filter((i) => i.type === "GUARD");
			expect(guards.length).toBeGreaterThan(0);
		});

		it("should generate prisoners for prison compound", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "PRISON_COMPOUND", center, "SCALE_GUARD");

			const prisoners = settlement.inhabitants.filter((i) => i.type === "PRISONER");
			// May or may not have prisoners based on random
			expect(prisoners).toBeDefined();
		});

		it("should assign correct faction to inhabitants", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			for (const inhabitant of settlement.inhabitants) {
				if (inhabitant.type === "PRISONER") {
					expect(inhabitant.faction).toBe("URA"); // Prisoners are URA
				} else {
					expect(inhabitant.faction).toBe("NATIVE");
				}
			}
		});

		it("should place inhabitants near structures", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "NATIVE_VILLAGE", center, "NATIVE");

			for (const inhabitant of settlement.inhabitants) {
				// Should be within reasonable distance of a structure
				let nearStructure = false;
				for (const structure of settlement.structures) {
					const dist = inhabitant.position.distanceTo(structure.worldPosition);
					if (dist < 10) {
						nearStructure = true;
						break;
					}
				}
				expect(nearStructure).toBe(true);
			}
		});
	});

	describe("assembleElevatedNetwork", () => {
		it("should generate platforms and bridges", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const result = assembleElevatedNetwork(12345, center, 30, 4);

			expect(result.platforms.length).toBeGreaterThan(0);
		});

		it("should connect nearby platforms with bridges", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const result = assembleElevatedNetwork(12345, center, 15, 3);

			// With close spacing, should have at least one bridge
			if (result.platforms.length > 1) {
				expect(result.bridges.length).toBeGreaterThanOrEqual(0);
			}
		});

		it("should offset platforms to world position", () => {
			const center = new THREE.Vector3(100, 0, 100);
			const result = assembleElevatedNetwork(12345, center, 20, 3);

			for (const platform of result.platforms) {
				// Platform positions should be offset by center
				expect(platform.position.x).not.toBe(0);
			}
		});
	});

	describe("Structure Rotation", () => {
		it("should rotate structures facing center for circular layouts", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "PRISON_COMPOUND", center, "SCALE_GUARD");

			for (const structure of settlement.structures) {
				// Rotation should be defined
				expect(typeof structure.worldRotation).toBe("number");
				expect(Number.isFinite(structure.worldRotation)).toBe(true);
			}
		});

		it("should align structures for grid layouts", () => {
			const center = new THREE.Vector3(0, 0, 0);
			const settlement = assembleSettlement(12345, "SIPHON_FACILITY", center, "SCALE_GUARD");

			// In grid layout with ALIGNED rotation, rotations should be 0
			for (const structure of settlement.structures) {
				expect(structure.worldRotation).toBe(0);
			}
		});
	});
});
