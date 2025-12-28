/**
 * Component Library - DRY Mesh & Joint Definitions
 */

import * as THREE from "three";
import { FACTION_PALETTES, type Faction, type FactionPalette } from "./factionPalettes";
import type { MaterialType, MeshDef, MeshId } from "./libraryTypes";
import { MESH_LIBRARY } from "./meshLibrary";
import { createGeometry, createMaterial } from "./meshUtils";
import { type JointDef, type JointName, UNIVERSAL_SKELETON } from "./skeleton";

// Re-exports
export { type Faction, type FactionPalette, FACTION_PALETTES };
export { type JointName, type JointDef, UNIVERSAL_SKELETON };
export { type MeshId, type MeshDef, type MaterialType, MESH_LIBRARY };
export { createMaterial, createGeometry };

/**
 * Creates a mesh instance from the library with faction-appropriate materials
 */
export function instantiateMesh(
	meshId: MeshId,
	faction: Faction,
	materialType: MaterialType = "PRIMARY",
): THREE.Mesh {
	const meshDef = MESH_LIBRARY[meshId];
	const geometry = createGeometry(meshDef);
	const material = createMaterial(faction, materialType);

	const mesh = new THREE.Mesh(geometry, material);
	mesh.scale.copy(meshDef.defaultScale);
	mesh.castShadow = true;
	mesh.receiveShadow = true;

	// Store metadata for later reference
	mesh.userData = {
		meshId,
		faction,
		materialType,
		attachmentPoints: meshDef.attachmentPoints || [],
	};

	return mesh;
}

/**
 * Clones an existing mesh with a different faction's materials
 */
export function reskinnedMesh(originalMesh: THREE.Mesh, newFaction: Faction): THREE.Mesh {
	const { meshId, materialType } = originalMesh.userData;
	return instantiateMesh(meshId, newFaction, materialType);
}
