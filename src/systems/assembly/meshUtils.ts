import * as THREE from "three";
import { type Faction, FACTION_PALETTES } from "./factionPalettes";
import type { MeshDef } from "./libraryTypes";

/**
 * Creates a material for a mesh based on faction and material type
 */
export function createMaterial(
	faction: Faction,
	materialType: "WOOD" | "METAL" | "FABRIC" | "SKIN" | "PRIMARY" | "SECONDARY",
	options: { roughness?: number; metalness?: number; opacity?: number } = {},
): THREE.MeshStandardMaterial {
	const palette = FACTION_PALETTES[faction];
	const { roughness = 0.7, metalness = 0.1, opacity = 1 } = options;

	let color: string;
	let actualRoughness = roughness;
	let actualMetalness = metalness;

	switch (materialType) {
		case "WOOD":
			color = palette.wood;
			actualRoughness = 0.8 + palette.wear * 0.2;
			break;
		case "METAL":
			color = palette.metal;
			actualRoughness = 0.4 + palette.wear * 0.4;
			actualMetalness = 0.8 - palette.wear * 0.3;
			break;
		case "FABRIC":
			color = palette.fabric;
			actualRoughness = 0.9;
			actualMetalness = 0;
			break;
		case "SKIN":
			color = palette.primary;
			actualRoughness = 0.6;
			actualMetalness = 0;
			break;
		case "PRIMARY":
			color = palette.primary;
			break;
		case "SECONDARY":
			color = palette.secondary;
			break;
	}

	return new THREE.MeshStandardMaterial({
		color,
		roughness: actualRoughness,
		metalness: actualMetalness,
		transparent: opacity < 1,
		opacity,
	});
}

/**
 * Creates geometry from mesh definition
 */
export function createGeometry(meshDef: MeshDef): THREE.BufferGeometry {
	const params = meshDef.geometryParams;

	switch (meshDef.geometryType) {
		case "BOX":
			return new THREE.BoxGeometry(params[0], params[1], params[2]);
		case "CYLINDER":
			return new THREE.CylinderGeometry(params[0], params[1], params[2], params[3] || 8);
		case "SPHERE":
			return new THREE.SphereGeometry(params[0], params[1] || 12, params[2] || 8);
		case "CAPSULE":
			return new THREE.CapsuleGeometry(params[0], params[1], params[2] || 4, params[3] || 8);
		case "CONE":
			return new THREE.ConeGeometry(params[0], params[1], params[2] || 8);
		case "TORUS":
			return new THREE.TorusGeometry(params[0], params[1], params[2] || 8, params[3] || 16);
		default:
			return new THREE.BoxGeometry(1, 1, 1);
	}
}
