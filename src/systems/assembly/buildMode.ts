/**
 * Build Mode System
 *
 * Handles player base construction:
 * 1. Buildable item catalog
 * 2. Placement validation
 * 3. Snap point detection
 * 4. Resource management
 * 5. Ghost preview rendering
 *
 * NOTE: Data definitions have been moved to src/ecs/data/buildableTemplates.ts
 * This file now contains ONLY placement/validation/UI utility functions.
 */

import * as THREE from "three";
import {
	type BuildableTemplate,
	canAffordBuildable,
	deductBuildableCost,
	getBuildablesByCategory,
	getBuildableTemplate,
	getUnlockedBuildables,
	type ResourceCost,
} from "../../ecs/data/buildableTemplates";
import { type Faction, instantiateMesh, MESH_LIBRARY, type MeshId } from "./componentLibrary";
import type {
	BuildableItem,
	BuildCategory,
	BuildModeState,
	SnapPoint,
	StructureArchetype,
} from "./types";

// Re-export from ECS for backwards compatibility
export { BUILDABLE_TEMPLATES as BUILDABLE_ITEMS } from "../../ecs/data/buildableTemplates";
export type { BuildableTemplate, ResourceCost };

// =============================================================================
// BUILD MODE STATE MANAGEMENT
// =============================================================================

/**
 * Creates initial build mode state
 */
export function createBuildModeState(): BuildModeState {
	return {
		isActive: false,
		selectedItem: null,
		ghostPosition: null,
		ghostRotation: 0,
		canPlace: false,
		nearbySnapPoints: [],
		resources: {
			wood: 100, // Starting resources
			metal: 20,
			supplies: 30,
		},
	};
}

/**
 * Checks if player can afford an item (delegates to ECS)
 */
export function canAfford(state: BuildModeState, item: BuildableItem | BuildableTemplate): boolean {
	// BuildableTemplate has 'size' property, BuildableItem has 'ghostMaterial'
	const template = "size" in item ? (item as BuildableTemplate) : getBuildableTemplate(item.id);
	if (!template) return false;
	return canAffordBuildable(template, state.resources);
}

/**
 * Deducts cost from resources (delegates to ECS)
 */
export function deductCost(
	state: BuildModeState,
	item: BuildableItem | BuildableTemplate,
): BuildModeState["resources"] {
	// BuildableTemplate has 'size' property, BuildableItem has 'ghostMaterial'
	const template = "size" in item ? (item as BuildableTemplate) : getBuildableTemplate(item.id);
	if (!template) return state.resources;
	return deductBuildableCost(template, state.resources);
}

// =============================================================================
// PLACEMENT VALIDATION
// =============================================================================

/**
 * Existing placed structure for collision checking
 */
export interface PlacedStructure {
	id: string;
	itemId: string;
	position: THREE.Vector3;
	rotation: number;
	snapPoints: SnapPoint[];
}

/**
 * Finds valid snap point near cursor position
 */
export function findNearestSnapPoint(
	cursorWorldPos: THREE.Vector3,
	item: BuildableItem | BuildableTemplate,
	placedStructures: PlacedStructure[],
	maxDistance: number = 2,
): { snapPoint: SnapPoint; structure: PlacedStructure } | null {
	let nearest: { snapPoint: SnapPoint; structure: PlacedStructure; distance: number } | null = null;

	const template =
		"components" in item && Array.isArray(item.components)
			? (item as BuildableTemplate)
			: getBuildableTemplate((item as BuildableItem).id);

	if (!template) return null;

	for (const structure of placedStructures) {
		for (const snapPoint of structure.snapPoints) {
			if (snapPoint.occupied) continue;

			// Check if this snap point accepts the item type
			const accepts = template.snapRules.some(
				(rule) =>
					rule.targetType === structure.itemId ||
					rule.targetType === "GROUND" ||
					snapPoint.acceptsTypes.includes(structure.itemId as StructureArchetype),
			);

			if (!accepts) continue;

			const worldSnapPos = snapPoint.localPosition.clone().add(structure.position);
			const distance = cursorWorldPos.distanceTo(worldSnapPos);

			if (distance < maxDistance && (!nearest || distance < nearest.distance)) {
				nearest = { snapPoint, structure, distance };
			}
		}
	}

	return nearest ? { snapPoint: nearest.snapPoint, structure: nearest.structure } : null;
}

/**
 * Validates placement position
 */
export function validatePlacement(
	position: THREE.Vector3,
	item: BuildableItem | BuildableTemplate,
	placedStructures: PlacedStructure[],
	groundLevel: number = 0,
): { valid: boolean; reason?: string } {
	const template =
		"components" in item && Array.isArray(item.components)
			? (item as BuildableTemplate)
			: getBuildableTemplate((item as BuildableItem).id);

	if (!template) {
		return { valid: false, reason: "Unknown item" };
	}

	// Check ground placement
	const isGroundPlacement = template.snapRules.some((rule) => rule.targetType === "GROUND");

	if (isGroundPlacement && Math.abs(position.y - groundLevel) < 0.5) {
		// Ground placement is valid
		return { valid: true };
	}

	// Check snap point placement
	const nearestSnap = findNearestSnapPoint(position, template, placedStructures);

	if (nearestSnap) {
		return { valid: true };
	}

	// Check collision with existing structures
	for (const structure of placedStructures) {
		const distance = position.distanceTo(structure.position);
		if (distance < 1) {
			return { valid: false, reason: "Too close to existing structure" };
		}
	}

	// Check if requires foundation
	const requiresFoundation = template.snapRules.every((rule) => rule.requiresFoundation);
	if (requiresFoundation) {
		return { valid: false, reason: "Requires foundation" };
	}

	return { valid: true };
}

// =============================================================================
// GHOST PREVIEW
// =============================================================================

/**
 * Creates a ghost mesh for placement preview
 */
export function createGhostMesh(
	item: BuildableItem | BuildableTemplate,
	faction: Faction = "URA",
): THREE.Group {
	const group = new THREE.Group();

	const template =
		"components" in item && Array.isArray(item.components)
			? (item as BuildableTemplate)
			: getBuildableTemplate((item as BuildableItem).id);

	if (!template) return group;

	for (const componentType of template.components) {
		// Map component type to mesh ID
		const meshId = componentTypeToMeshId(componentType);
		if (!meshId || !MESH_LIBRARY[meshId]) continue;

		const mesh = instantiateMesh(meshId, faction, "PRIMARY");

		// Apply ghost material
		const originalMaterial = mesh.material;
		if (originalMaterial instanceof THREE.MeshStandardMaterial) {
			const ghostMaterial = originalMaterial.clone();
			ghostMaterial.transparent = true;
			ghostMaterial.opacity = 0.5;
			ghostMaterial.color.setHex(0x66ff66);
			mesh.material = ghostMaterial;
		}

		group.add(mesh);
	}

	return group;
}

/**
 * Updates ghost color based on validity
 */
export function updateGhostColor(ghost: THREE.Group, canPlace: boolean): void {
	const color = canPlace ? 0x66ff66 : 0xff6666;

	ghost.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			const material = child.material;
			if (material instanceof THREE.MeshStandardMaterial) {
				material.color.setHex(color);
			}
		}
	});
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Maps structure component type to mesh ID
 */
function componentTypeToMeshId(componentType: string): MeshId | null {
	const mapping: Record<string, MeshId> = {
		STILT: "STILT_ROUND",
		FLOOR_PLANK: "FLOOR_PLANK",
		FLOOR_SECTION: "FLOOR_SECTION_2X2",
		FLOOR_SECTION_2X2: "FLOOR_SECTION_2X2",
		WALL_FRAME: "WALL_FRAME",
		WALL_BAMBOO: "WALL_BAMBOO_SLATS",
		WALL_BAMBOO_SLATS: "WALL_BAMBOO_SLATS",
		WALL_THATCH: "WALL_THATCH_PANEL",
		WALL_THATCH_PANEL: "WALL_THATCH_PANEL",
		ROOF_BEAM: "ROOF_BEAM",
		ROOF_THATCH: "ROOF_THATCH_SECTION",
		ROOF_THATCH_SECTION: "ROOF_THATCH_SECTION",
		ROOF_TIN: "ROOF_TIN_SECTION",
		ROOF_TIN_SECTION: "ROOF_TIN_SECTION",
		LADDER: "LADDER_SEGMENT",
		LADDER_SEGMENT: "LADDER_SEGMENT",
		RAILING: "RAILING_SECTION",
		RAILING_SECTION: "RAILING_SECTION",
		DOOR_FRAME: "WALL_FRAME",
		WINDOW_OPENING: "WALL_FRAME",
		LANTERN_HOOK: "ROPE_COIL",
		AWNING: "ROOF_THATCH_SECTION",
	};

	return mapping[componentType] || null;
}

/**
 * Gets items by category (delegates to ECS)
 */
export function getItemsByCategory(category: BuildCategory): BuildableTemplate[] {
	return getBuildablesByCategory(category);
}

/**
 * Gets all unlocked items based on game progress (delegates to ECS)
 */
export function getUnlockedItems(unlockedRequirements: Set<string>): BuildableTemplate[] {
	return getUnlockedBuildables(unlockedRequirements);
}
