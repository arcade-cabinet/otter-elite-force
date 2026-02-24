/**
 * Structure Assembler Tests
 *
 * Tests procedural generation of structures (huts, platforms, towers)
 */

import { Vector3 } from "@babylonjs/core";
import {
	assembleHut,
	assemblePlatform,
	assemblePlatformNetwork,
	assembleWatchtower,
	DEFAULT_ASSEMBLY_CONFIG,
} from "../structureAssembler";

describe("Structure Assembler", () => {
	describe("assembleHut", () => {
		it("should generate a basic hut with required components", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			expect(hut.archetype).toBe("BASIC_HUT");
			expect(hut.components.length).toBeGreaterThan(0);
			expect(hut.footprint.width).toBeGreaterThan(0);
			expect(hut.footprint.depth).toBeGreaterThan(0);
			expect(hut.height).toBeGreaterThan(0);
		});

		it("should generate stilts for the hut", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			const stilts = hut.components.filter((c) => c.type === "STILT");

			expect(stilts.length).toBeGreaterThanOrEqual(DEFAULT_ASSEMBLY_CONFIG.hut.minStilts);
			expect(stilts.length).toBeLessThanOrEqual(DEFAULT_ASSEMBLY_CONFIG.hut.maxStilts);
		});

		it("should generate floor planks", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			const planks = hut.components.filter((c) => c.type === "FLOOR_PLANK");

			expect(planks.length).toBeGreaterThan(0);
		});

		it("should generate walls on 3-4 sides", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			const walls = hut.components.filter(
				(c) => c.type === "WALL_BAMBOO" || c.type === "WALL_THATCH",
			);
			const doors = hut.components.filter((c) => c.type === "DOOR_FRAME");

			// Total wall coverage should be 4 sides (3 walls + 1 door)
			expect(walls.length + doors.length).toBe(4);
		});

		it("should generate a roof", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			const roofSections = hut.components.filter(
				(c) => c.type === "ROOF_THATCH" || c.type === "ROOF_TIN",
			);
			const roofBeam = hut.components.find((c) => c.type === "ROOF_BEAM");

			expect(roofSections.length).toBeGreaterThan(0);
			expect(roofBeam).toBeDefined();
		});

		it("should generate a ladder when elevated", () => {
			const config = { ...DEFAULT_ASSEMBLY_CONFIG.hut, floorHeight: { min: 1.5, max: 2.0 } };
			const hut = assembleHut(12345, config, "BASIC");
			const ladder = hut.components.find((c) => c.type === "LADDER");

			expect(ladder).toBeDefined();
		});

		it("should generate consistent structures with same seed", () => {
			const hut1 = assembleHut(42, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			const hut2 = assembleHut(42, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			expect(hut1.components.length).toBe(hut2.components.length);
			expect(hut1.height).toBe(hut2.height);
		});

		it("should generate different structures with different seeds", () => {
			const hut1 = assembleHut(111, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			const hut2 = assembleHut(222, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			// Heights or component counts should differ
			const different =
				hut1.height !== hut2.height || hut1.components.length !== hut2.components.length;
			expect(different).toBe(true);
		});

		it("should generate a longhouse variant", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "LONGHOUSE");

			expect(hut.archetype).toBe("LONGHOUSE");
			expect(hut.footprint.width).toBeGreaterThan(DEFAULT_ASSEMBLY_CONFIG.hut.roomSize.max);
		});

		it("should generate a healer variant with lantern", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "HEALER");
			const lantern = hut.components.find((c) => c.type === "LANTERN_HOOK");

			expect(hut.archetype).toBe("MEDICAL_POST");
			expect(lantern).toBeDefined();
		});

		it("should include snap points for structure connection", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			expect(hut.snapPoints.length).toBeGreaterThan(0);
			for (const snap of hut.snapPoints) {
				expect(snap.localPosition).toBeDefined();
				expect(snap.direction).toBeDefined();
				expect(snap.acceptsTypes.length).toBeGreaterThan(0);
			}
		});

		it("should include interaction points", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			expect(hut.interactionPoints.length).toBeGreaterThan(0);
			const enterPoint = hut.interactionPoints.find((p) => p.type === "ENTER");
			expect(enterPoint).toBeDefined();
		});
	});

	describe("assemblePlatform", () => {
		it("should generate a platform with stilts", () => {
			const platform = assemblePlatform(12345, { width: 3, depth: 3 }, 2);

			expect(platform.id).toBeDefined();
			expect(platform.stilts.length).toBeGreaterThanOrEqual(4);
			expect(platform.height).toBe(2);
		});

		it("should include railings by default", () => {
			const platform = assemblePlatform(12345, { width: 3, depth: 3 }, 2);

			expect(platform.railings.length).toBeGreaterThan(0);
		});

		it("should include a ladder by default", () => {
			const platform = assemblePlatform(12345, { width: 3, depth: 3 }, 2);

			expect(platform.hasLadder).toBe(true);
			expect(platform.ladderSide).toBeDefined();
		});

		it("should not have railing on ladder side", () => {
			const platform = assemblePlatform(12345, { width: 3, depth: 3 }, 2);

			expect(platform.railings).not.toContain(platform.ladderSide);
		});

		it("should add center stilt for large platforms", () => {
			const largePlatform = assemblePlatform(12345, { width: 5, depth: 5 }, 2);

			expect(largePlatform.stilts.length).toBeGreaterThan(4);
		});
	});

	describe("assemblePlatformNetwork", () => {
		it("should generate multiple platforms", () => {
			const platforms = assemblePlatformNetwork(12345, 5, 20);

			expect(platforms.length).toBeGreaterThan(0);
			expect(platforms.length).toBeLessThanOrEqual(5);
		});

		it("should space platforms apart", () => {
			const platforms = assemblePlatformNetwork(12345, 3, 20);

			for (let i = 0; i < platforms.length; i++) {
				for (let j = i + 1; j < platforms.length; j++) {
					const dist = Vector3.Distance(
						new Vector3(platforms[i].position.x, 0, platforms[i].position.z),
						new Vector3(platforms[j].position.x, 0, platforms[j].position.z),
					);

					expect(dist).toBeGreaterThan(3);
				}
			}
		});

		it("should ensure at least first platform has ladder", () => {
			const platforms = assemblePlatformNetwork(12345, 3, 20);

			expect(platforms[0].hasLadder).toBe(true);
		});
	});

	describe("assembleWatchtower", () => {
		it("should generate a watchtower structure", () => {
			const tower = assembleWatchtower(12345);

			expect(tower.archetype).toBe("WATCHTOWER");
			expect(tower.components.length).toBeGreaterThan(0);
		});

		it("should have four main support poles", () => {
			const tower = assembleWatchtower(12345);
			const poles = tower.components.filter((c) => c.type === "STILT");

			expect(poles.length).toBe(4);
		});

		it("should have a platform at the top", () => {
			const tower = assembleWatchtower(12345);
			const platform = tower.components.find((c) => c.type === "FLOOR_SECTION");

			expect(platform).toBeDefined();
		});

		it("should have railings around platform", () => {
			const tower = assembleWatchtower(12345);
			const railings = tower.components.filter((c) => c.type === "RAILING");

			expect(railings.length).toBe(4);
		});

		it("should have a ladder for access", () => {
			const tower = assembleWatchtower(12345);
			const ladder = tower.components.find((c) => c.type === "LADDER");

			expect(ladder).toBeDefined();
		});

		it("should have a roof", () => {
			const tower = assembleWatchtower(12345);
			const roof = tower.components.find((c) => c.type === "ROOF_THATCH");

			expect(roof).toBeDefined();
		});

		it("should include a climb interaction point", () => {
			const tower = assembleWatchtower(12345);
			const climbPoint = tower.interactionPoints.find((p) => p.type === "CLIMB");

			expect(climbPoint).toBeDefined();
		});
	});

	describe("Component Properties", () => {
		it("should assign valid materials to all components", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			for (const component of hut.components) {
				expect(["WOOD", "BAMBOO", "THATCH", "METAL", "ROPE"]).toContain(component.material);
			}
		});

		it("should assign condition values between 0 and 1", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			for (const component of hut.components) {
				expect(component.condition).toBeGreaterThanOrEqual(0);
				expect(component.condition).toBeLessThanOrEqual(1);
			}
		});

		it("should have valid position vectors for all components", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			for (const component of hut.components) {
				expect(component.localPosition).toBeInstanceOf(Vector3);
				expect(Number.isFinite(component.localPosition.x)).toBe(true);
				expect(Number.isFinite(component.localPosition.y)).toBe(true);
				expect(Number.isFinite(component.localPosition.z)).toBe(true);
			}
		});

		it("should have valid rotation euler for all components", () => {
			const hut = assembleHut(12345, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");

			for (const component of hut.components) {
				expect(component.localRotation).toBeInstanceOf(Vector3);
			}
		});
	});
});
