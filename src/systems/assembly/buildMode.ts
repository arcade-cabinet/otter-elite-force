/**
 * Build Mode System
 *
 * Handles player base construction:
 * 1. Buildable item catalog
 * 2. Placement validation
 * 3. Snap point detection
 * 4. Resource management
 * 5. Ghost preview rendering
 */

import * as THREE from "three";
import { type Faction, instantiateMesh, MESH_LIBRARY, type MeshId } from "./componentLibrary";
import type {
	BuildableItem,
	BuildCategory,
	BuildModeState,
	SnapPoint,
	StructureArchetype,
} from "./types";

// =============================================================================
// BUILDABLE ITEM CATALOG
// =============================================================================

/**
 * All items the player can build
 * Uses the same meshes as procedural generation (DRY!)
 */
export const BUILDABLE_ITEMS: BuildableItem[] = [
	// Foundation
	{
		id: "floor-section",
		name: "Floor Section",
		category: "FOUNDATION",
		components: ["FLOOR_SECTION"],
		cost: { wood: 10, metal: 0, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
			{ targetType: "STILT", attachPoint: "TOP", requiresFoundation: false, maxStackHeight: 1 },
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "SIDE",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "stilt-support",
		name: "Stilt Support",
		category: "FOUNDATION",
		components: ["STILT"],
		cost: { wood: 5, metal: 0, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 3 },
			{ targetType: "STILT", attachPoint: "TOP", requiresFoundation: false, maxStackHeight: 3 },
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "ladder",
		name: "Ladder",
		category: "FOUNDATION",
		components: ["LADDER"],
		cost: { wood: 8, metal: 2, supplies: 0 },
		snapRules: [
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "SIDE",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},

	// Walls
	{
		id: "wall-bamboo",
		name: "Bamboo Wall",
		category: "WALLS",
		components: ["WALL_BAMBOO"],
		cost: { wood: 8, metal: 0, supplies: 0 },
		snapRules: [
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 2,
			},
			{ targetType: "WALL_FRAME", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 2 },
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "wall-thatch",
		name: "Thatch Wall",
		category: "WALLS",
		components: ["WALL_THATCH"],
		cost: { wood: 5, metal: 0, supplies: 2 },
		snapRules: [
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 2,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "door-frame",
		name: "Door Frame",
		category: "WALLS",
		components: ["DOOR_FRAME"],
		cost: { wood: 6, metal: 2, supplies: 0 },
		snapRules: [
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "window-frame",
		name: "Window Frame",
		category: "WALLS",
		components: ["WINDOW_OPENING"],
		cost: { wood: 4, metal: 1, supplies: 0 },
		snapRules: [
			{
				targetType: "WALL_BAMBOO",
				attachPoint: "CENTER",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
			{
				targetType: "WALL_THATCH",
				attachPoint: "CENTER",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},

	// Roof
	{
		id: "roof-thatch",
		name: "Thatch Roof",
		category: "ROOF",
		components: ["ROOF_THATCH"],
		cost: { wood: 4, metal: 0, supplies: 6 },
		snapRules: [
			{
				targetType: "WALL_BAMBOO",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
			{
				targetType: "WALL_THATCH",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
			{ targetType: "ROOF_BEAM", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 1 },
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "roof-tin",
		name: "Tin Roof",
		category: "ROOF",
		components: ["ROOF_TIN"],
		cost: { wood: 2, metal: 12, supplies: 0 },
		unlockRequirement: "Capture Gas Depot",
		snapRules: [
			{
				targetType: "WALL_BAMBOO",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
			{
				targetType: "WALL_THATCH",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "roof-beam",
		name: "Roof Beam",
		category: "ROOF",
		components: ["ROOF_BEAM"],
		cost: { wood: 6, metal: 0, supplies: 0 },
		snapRules: [
			{
				targetType: "WALL_BAMBOO",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
			{
				targetType: "WALL_THATCH",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},

	// Defense
	{
		id: "railing",
		name: "Railing",
		category: "DEFENSE",
		components: ["RAILING"],
		cost: { wood: 4, metal: 0, supplies: 0 },
		snapRules: [
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "SIDE",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "sandbag-wall",
		name: "Sandbag Wall",
		category: "DEFENSE",
		components: ["WALL_FRAME"], // Uses same geometry, different material
		cost: { wood: 0, metal: 0, supplies: 15 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 2 },
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "TOP",
				requiresFoundation: false,
				maxStackHeight: 2,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "watchtower",
		name: "Watchtower",
		category: "DEFENSE",
		components: ["STILT", "FLOOR_SECTION", "RAILING", "LADDER", "ROOF_THATCH"],
		cost: { wood: 40, metal: 10, supplies: 5 },
		unlockRequirement: "Secure 3 Territories",
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},

	// Utility
	{
		id: "storage-crate",
		name: "Storage Crate",
		category: "UTILITY",
		components: ["FLOOR_SECTION"], // Box geometry
		cost: { wood: 12, metal: 4, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "TOP",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
	{
		id: "workbench",
		name: "Workbench",
		category: "UTILITY",
		components: ["FLOOR_SECTION"],
		cost: { wood: 15, metal: 8, supplies: 2 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
			{
				targetType: "FLOOR_SECTION",
				attachPoint: "TOP",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},

	// Comfort
	{
		id: "lantern",
		name: "Lantern",
		category: "COMFORT",
		components: ["LANTERN_HOOK"],
		cost: { wood: 2, metal: 4, supplies: 1 },
		snapRules: [
			{
				targetType: "ROOF_BEAM",
				attachPoint: "BOTTOM",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
			{
				targetType: "WALL_BAMBOO",
				attachPoint: "CENTER",
				requiresFoundation: false,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(255, 200, 100, 0.5)",
	},
	{
		id: "awning",
		name: "Awning",
		category: "COMFORT",
		components: ["AWNING"],
		cost: { wood: 6, metal: 2, supplies: 4 },
		snapRules: [
			{
				targetType: "WALL_BAMBOO",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
			{
				targetType: "WALL_THATCH",
				attachPoint: "TOP",
				requiresFoundation: true,
				maxStackHeight: 1,
			},
		],
		ghostMaterial: "rgba(100, 200, 100, 0.5)",
	},
];

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
 * Checks if player can afford an item
 */
export function canAfford(state: BuildModeState, item: BuildableItem): boolean {
	return (
		state.resources.wood >= item.cost.wood &&
		state.resources.metal >= item.cost.metal &&
		state.resources.supplies >= item.cost.supplies
	);
}

/**
 * Deducts cost from resources
 */
export function deductCost(
	state: BuildModeState,
	item: BuildableItem,
): BuildModeState["resources"] {
	return {
		wood: state.resources.wood - item.cost.wood,
		metal: state.resources.metal - item.cost.metal,
		supplies: state.resources.supplies - item.cost.supplies,
	};
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
	item: BuildableItem,
	placedStructures: PlacedStructure[],
	maxDistance: number = 2,
): { snapPoint: SnapPoint; structure: PlacedStructure } | null {
	let nearest: { snapPoint: SnapPoint; structure: PlacedStructure; distance: number } | null = null;

	for (const structure of placedStructures) {
		for (const snapPoint of structure.snapPoints) {
			if (snapPoint.occupied) continue;

			// Check if this snap point accepts the item type
			const accepts = item.snapRules.some(
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
	item: BuildableItem,
	placedStructures: PlacedStructure[],
	groundLevel: number = 0,
): { valid: boolean; reason?: string } {
	// Check ground placement
	const isGroundPlacement = item.snapRules.some((rule) => rule.targetType === "GROUND");

	if (isGroundPlacement && Math.abs(position.y - groundLevel) < 0.5) {
		// Ground placement is valid
		return { valid: true };
	}

	// Check snap point placement
	const nearestSnap = findNearestSnapPoint(position, item, placedStructures);

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
	const requiresFoundation = item.snapRules.every((rule) => rule.requiresFoundation);
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
export function createGhostMesh(item: BuildableItem, faction: Faction = "URA"): THREE.Group {
	const group = new THREE.Group();

	for (const componentType of item.components) {
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
		WALL_FRAME: "WALL_FRAME",
		WALL_BAMBOO: "WALL_BAMBOO_SLATS",
		WALL_THATCH: "WALL_THATCH_PANEL",
		ROOF_BEAM: "ROOF_BEAM",
		ROOF_THATCH: "ROOF_THATCH_SECTION",
		ROOF_TIN: "ROOF_TIN_SECTION",
		LADDER: "LADDER_SEGMENT",
		RAILING: "RAILING_SECTION",
		DOOR_FRAME: "WALL_FRAME",
		WINDOW_OPENING: "WALL_FRAME",
		LANTERN_HOOK: "ROPE_COIL",
		AWNING: "ROOF_THATCH_SECTION",
	};

	return mapping[componentType] || null;
}

/**
 * Gets items by category
 */
export function getItemsByCategory(category: BuildCategory): BuildableItem[] {
	return BUILDABLE_ITEMS.filter((item) => item.category === category);
}

/**
 * Gets all unlocked items based on game progress
 */
export function getUnlockedItems(unlockedRequirements: Set<string>): BuildableItem[] {
	return BUILDABLE_ITEMS.filter(
		(item) => !item.unlockRequirement || unlockedRequirements.has(item.unlockRequirement),
	);
}
