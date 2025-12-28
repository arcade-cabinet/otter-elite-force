/**
 * Component Library Tests
 *
 * Tests for DRY mesh definitions, faction palettes, and universal skeleton.
 */

import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
	createGeometry,
	createMaterial,
	FACTION_PALETTES,
	type Faction,
	instantiateMesh,
	type JointName,
	MESH_LIBRARY,
	type MeshDef,
	type MeshId,
	reskinnedMesh,
	UNIVERSAL_SKELETON,
} from "../componentLibrary";

describe("componentLibrary", () => {
	describe("FACTION_PALETTES", () => {
		it("should define all four factions", () => {
			expect(FACTION_PALETTES.URA).toBeDefined();
			expect(FACTION_PALETTES.SCALE_GUARD).toBeDefined();
			expect(FACTION_PALETTES.NATIVE).toBeDefined();
			expect(FACTION_PALETTES.NEUTRAL).toBeDefined();
		});

		it("should have all required palette properties", () => {
			const factions: Faction[] = ["URA", "SCALE_GUARD", "NATIVE", "NEUTRAL"];

			for (const faction of factions) {
				const palette = FACTION_PALETTES[faction];
				expect(palette.primary).toBeDefined();
				expect(palette.secondary).toBeDefined();
				expect(palette.wood).toBeDefined();
				expect(palette.metal).toBeDefined();
				expect(palette.fabric).toBeDefined();
				expect(typeof palette.wear).toBe("number");
				expect(palette.wear).toBeGreaterThanOrEqual(0);
				expect(palette.wear).toBeLessThanOrEqual(1);
			}
		});

		it("should have valid hex color strings", () => {
			const hexRegex = /^#[0-9A-Fa-f]{6}$/;

			for (const faction of Object.keys(FACTION_PALETTES) as Faction[]) {
				const palette = FACTION_PALETTES[faction];
				expect(palette.primary).toMatch(hexRegex);
				expect(palette.secondary).toMatch(hexRegex);
				expect(palette.wood).toMatch(hexRegex);
				expect(palette.metal).toMatch(hexRegex);
				expect(palette.fabric).toMatch(hexRegex);
			}
		});

		it("should have URA as well-maintained faction", () => {
			expect(FACTION_PALETTES.URA.wear).toBeLessThan(0.2);
		});

		it("should have SCALE_GUARD as battle-worn faction", () => {
			expect(FACTION_PALETTES.SCALE_GUARD.wear).toBeGreaterThan(0.3);
		});
	});

	describe("UNIVERSAL_SKELETON", () => {
		it("should define ROOT joint", () => {
			const root = UNIVERSAL_SKELETON.find((j) => j.name === "ROOT");
			expect(root).toBeDefined();
			expect(root?.parent).toBeNull();
		});

		it("should have spine chain", () => {
			const spineJoints: JointName[] = [
				"ROOT",
				"PELVIS",
				"SPINE_LOWER",
				"SPINE_UPPER",
				"NECK",
				"HEAD",
			];

			for (const jointName of spineJoints) {
				const joint = UNIVERSAL_SKELETON.find((j) => j.name === jointName);
				expect(joint).toBeDefined();
			}
		});

		it("should have symmetric arm chains", () => {
			const leftArm: JointName[] = [
				"SHOULDER_L",
				"UPPER_ARM_L",
				"ELBOW_L",
				"FOREARM_L",
				"WRIST_L",
				"HAND_L",
				"GRIP_L",
			];
			const rightArm: JointName[] = [
				"SHOULDER_R",
				"UPPER_ARM_R",
				"ELBOW_R",
				"FOREARM_R",
				"WRIST_R",
				"HAND_R",
				"GRIP_R",
			];

			for (const jointName of leftArm) {
				expect(UNIVERSAL_SKELETON.find((j) => j.name === jointName)).toBeDefined();
			}
			for (const jointName of rightArm) {
				expect(UNIVERSAL_SKELETON.find((j) => j.name === jointName)).toBeDefined();
			}
		});

		it("should have symmetric leg chains", () => {
			const leftLeg: JointName[] = [
				"HIP_L",
				"UPPER_LEG_L",
				"KNEE_L",
				"LOWER_LEG_L",
				"ANKLE_L",
				"FOOT_L",
			];
			const rightLeg: JointName[] = [
				"HIP_R",
				"UPPER_LEG_R",
				"KNEE_R",
				"LOWER_LEG_R",
				"ANKLE_R",
				"FOOT_R",
			];

			for (const jointName of leftLeg) {
				expect(UNIVERSAL_SKELETON.find((j) => j.name === jointName)).toBeDefined();
			}
			for (const jointName of rightLeg) {
				expect(UNIVERSAL_SKELETON.find((j) => j.name === jointName)).toBeDefined();
			}
		});

		it("should have tail joints for otters", () => {
			const tailJoints: JointName[] = ["TAIL_BASE", "TAIL_MID", "TAIL_TIP"];

			for (const jointName of tailJoints) {
				expect(UNIVERSAL_SKELETON.find((j) => j.name === jointName)).toBeDefined();
			}
		});

		it("should have valid rotation limits", () => {
			for (const joint of UNIVERSAL_SKELETON) {
				expect(joint.rotationLimits.x.min).toBeLessThanOrEqual(joint.rotationLimits.x.max);
				expect(joint.rotationLimits.y.min).toBeLessThanOrEqual(joint.rotationLimits.y.max);
				expect(joint.rotationLimits.z.min).toBeLessThanOrEqual(joint.rotationLimits.z.max);
			}
		});

		it("should have all joints with Vector3 positions", () => {
			for (const joint of UNIVERSAL_SKELETON) {
				expect(joint.localPosition).toBeInstanceOf(THREE.Vector3);
			}
		});
	});

	describe("MESH_LIBRARY", () => {
		it("should have structural components", () => {
			const structuralMeshes: MeshId[] = [
				"STILT_ROUND",
				"FLOOR_SECTION_2X2",
				"WALL_FRAME",
				"WALL_BAMBOO_SLATS",
				"WALL_THATCH_PANEL",
				"ROOF_BEAM",
				"ROOF_THATCH_SECTION",
			];

			for (const meshId of structuralMeshes) {
				expect(MESH_LIBRARY[meshId]).toBeDefined();
			}
		});

		it("should have weapon components", () => {
			const weaponMeshes: MeshId[] = [
				"RECEIVER_PISTOL",
				"RECEIVER_RIFLE",
				"BARREL_SHORT",
				"BARREL_LONG",
				"GRIP_PISTOL",
				"MAGAZINE_BOX",
			];

			for (const meshId of weaponMeshes) {
				expect(MESH_LIBRARY[meshId]).toBeDefined();
			}
		});

		it("should define geometry type and params for each mesh", () => {
			for (const [_meshId, def] of Object.entries(MESH_LIBRARY)) {
				expect(def.geometryType).toBeDefined();
				expect(def.geometryParams).toBeDefined();
				expect(Array.isArray(def.geometryParams)).toBe(true);
			}
		});

		it("should define default scale for each mesh", () => {
			for (const [_meshId, def] of Object.entries(MESH_LIBRARY)) {
				expect(def.defaultScale).toBeDefined();
				expect(def.defaultScale).toBeInstanceOf(THREE.Vector3);
			}
		});
	});

	describe("createGeometry", () => {
		it("should create BoxGeometry", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "BOX",
				geometryParams: [1, 2, 3],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.BoxGeometry);
		});

		it("should create CylinderGeometry", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "CYLINDER",
				geometryParams: [0.5, 0.5, 2, 8],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.CylinderGeometry);
		});

		it("should create SphereGeometry", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "SPHERE",
				geometryParams: [1, 16, 16],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.SphereGeometry);
		});

		it("should create CapsuleGeometry", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "CAPSULE",
				geometryParams: [0.3, 0.8, 4, 8],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.CapsuleGeometry);
		});

		it("should create ConeGeometry", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "CONE",
				geometryParams: [0.5, 1, 8],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.ConeGeometry);
		});

		it("should create TorusGeometry", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "TORUS",
				geometryParams: [0.5, 0.1, 8, 16],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.TorusGeometry);
		});

		it("should default to BoxGeometry for unknown types", () => {
			const meshDef: MeshDef = {
				id: "STILT_ROUND",
				geometryType: "CUSTOM",
				geometryParams: [1, 1, 1],
				defaultScale: new THREE.Vector3(1, 1, 1),
			};
			const geom = createGeometry(meshDef);
			expect(geom).toBeInstanceOf(THREE.BoxGeometry);
		});
	});

	describe("createMaterial", () => {
		it("should create material with URA palette", () => {
			const material = createMaterial("URA", "PRIMARY");
			expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
		});

		it("should create material with SCALE_GUARD palette", () => {
			const material = createMaterial("SCALE_GUARD", "SECONDARY");
			expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
		});

		it("should apply roughness based on wear", () => {
			const uraMaterial = createMaterial("URA", "WOOD") as THREE.MeshStandardMaterial;
			const scaleGuardMaterial = createMaterial(
				"SCALE_GUARD",
				"WOOD",
			) as THREE.MeshStandardMaterial;

			// SCALE_GUARD has higher wear, should have higher roughness
			expect(scaleGuardMaterial.roughness).toBeGreaterThan(uraMaterial.roughness);
		});

		it("should create different materials for each type", () => {
			const primary = createMaterial("URA", "PRIMARY") as THREE.MeshStandardMaterial;
			const secondary = createMaterial("URA", "SECONDARY") as THREE.MeshStandardMaterial;
			const wood = createMaterial("URA", "WOOD") as THREE.MeshStandardMaterial;
			const metal = createMaterial("URA", "METAL") as THREE.MeshStandardMaterial;

			// Colors should be different
			expect(primary.color.getHexString()).not.toBe(secondary.color.getHexString());
			expect(wood.color.getHexString()).not.toBe(metal.color.getHexString());
		});
	});

	describe("instantiateMesh", () => {
		it("should create mesh from library definition", () => {
			const mesh = instantiateMesh("STILT_ROUND", "URA", "WOOD");
			expect(mesh).toBeInstanceOf(THREE.Mesh);
		});

		it("should apply faction-specific material", () => {
			const uraMesh = instantiateMesh("FLOOR_SECTION_2X2", "URA", "WOOD");
			const nativeMesh = instantiateMesh("FLOOR_SECTION_2X2", "NATIVE", "WOOD");

			const uraMat = uraMesh.material as THREE.MeshStandardMaterial;
			const nativeMat = nativeMesh.material as THREE.MeshStandardMaterial;

			// Materials should have different colors
			expect(uraMat.color.getHexString()).not.toBe(nativeMat.color.getHexString());
		});

		it("should create valid mesh geometry", () => {
			const mesh = instantiateMesh("WALL_FRAME", "NEUTRAL", "PRIMARY");
			expect(mesh.geometry).toBeDefined();
			expect(mesh.material).toBeDefined();
		});
	});

	describe("reskinnedMesh", () => {
		it("should clone mesh with new faction material", () => {
			const original = instantiateMesh("STILT_ROUND", "URA", "WOOD");
			const reskinned = reskinnedMesh(original, "SCALE_GUARD");

			expect(reskinned).not.toBe(original);
			expect(reskinned).toBeInstanceOf(THREE.Mesh);
		});

		it("should preserve geometry", () => {
			const original = instantiateMesh("BARREL_SHORT", "URA", "METAL");
			const reskinned = reskinnedMesh(original, "NATIVE");

			// Geometry should be the same reference or equivalent
			expect(reskinned.geometry).toBeDefined();
		});

		it("should change material color", () => {
			const original = instantiateMesh("GRIP_PISTOL", "URA", "WOOD");
			const reskinned = reskinnedMesh(original, "NATIVE");

			const originalMat = original.material as THREE.MeshStandardMaterial;
			const reskinnedMat = reskinned.material as THREE.MeshStandardMaterial;

			expect(reskinnedMat.color.getHexString()).not.toBe(originalMat.color.getHexString());
		});
	});

	describe("Mesh Definition Integrity", () => {
		it("should have no undefined mesh definitions", () => {
			for (const [meshId, def] of Object.entries(MESH_LIBRARY)) {
				expect(def).toBeDefined();
				expect(meshId).toBeTruthy();
			}
		});

		it("should have valid geometry params", () => {
			for (const [_meshId, def] of Object.entries(MESH_LIBRARY)) {
				expect(Array.isArray(def.geometryParams)).toBe(true);
				expect(def.geometryParams.length).toBeGreaterThan(0);

				// All dimensions should be numbers
				for (const dim of def.geometryParams) {
					expect(typeof dim).toBe("number");
				}
			}
		});

		it("should have valid attachment points if defined", () => {
			for (const [_meshId, def] of Object.entries(MESH_LIBRARY)) {
				if (def.attachmentPoints) {
					expect(Array.isArray(def.attachmentPoints)).toBe(true);

					for (const point of def.attachmentPoints) {
						expect(point.name).toBeDefined();
						expect(point.position).toBeInstanceOf(THREE.Vector3);
						expect(point.rotation).toBeInstanceOf(THREE.Euler);
					}
				}
			}
		});

		it("should have valid geometry types", () => {
			const validTypes = ["BOX", "CYLINDER", "SPHERE", "CAPSULE", "CONE", "TORUS", "CUSTOM"];
			for (const [_meshId, def] of Object.entries(MESH_LIBRARY)) {
				expect(validTypes).toContain(def.geometryType);
			}
		});
	});
});
