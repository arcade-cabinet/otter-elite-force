/**
 * Buildable Structure Templates - ECS Entity Definitions
 *
 * These define buildable structures that get spawned into the ECS world.
 * Replaces the old constants-based approach with proper ECS integration.
 */

import { Vector3 } from "@babylonjs/core";

// =============================================================================
// BUILDABLE COMPONENT TYPES
// =============================================================================

export interface ResourceCost {
	wood: number;
	metal: number;
	supplies: number;
}

export interface SnapRule {
	targetType: "GROUND" | "STILT" | "FLOOR" | "WALL" | "ROOF";
	attachPoint: "TOP" | "BOTTOM" | "SIDE" | "CORNER";
	requiresFoundation: boolean;
	maxStackHeight: number;
}

export interface BuildableTemplate {
	id: string;
	name: string;
	category: "FOUNDATION" | "WALLS" | "ROOF" | "DEFENSE" | "UTILITY" | "COMFORT";
	components: string[]; // MeshIds from component library
	cost: ResourceCost;
	snapRules: SnapRule[];
	size: { width: number; depth: number; height: number };
	health: number;
	unlockRequirement: string | null;
}

// =============================================================================
// BUILDABLE TEMPLATES
// =============================================================================

export const BUILDABLE_TEMPLATES: BuildableTemplate[] = [
	// === FOUNDATION ===
	{
		id: "floor-section",
		name: "Floor Section",
		category: "FOUNDATION",
		components: ["FLOOR_SECTION_2X2"],
		cost: { wood: 10, metal: 0, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
			{ targetType: "STILT", attachPoint: "TOP", requiresFoundation: false, maxStackHeight: 1 },
			{ targetType: "FLOOR", attachPoint: "SIDE", requiresFoundation: false, maxStackHeight: 1 },
		],
		size: { width: 2, depth: 2, height: 0.2 },
		health: 100,
		unlockRequirement: null,
	},
	{
		id: "stilt-support",
		name: "Stilt Support",
		category: "FOUNDATION",
		components: ["STILT_ROUND"],
		cost: { wood: 5, metal: 0, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 3 },
			{ targetType: "STILT", attachPoint: "TOP", requiresFoundation: false, maxStackHeight: 3 },
		],
		size: { width: 0.3, depth: 0.3, height: 2 },
		health: 80,
		unlockRequirement: null,
	},
	{
		id: "ladder",
		name: "Ladder",
		category: "FOUNDATION",
		components: ["LADDER_SEGMENT"],
		cost: { wood: 8, metal: 2, supplies: 0 },
		snapRules: [
			{ targetType: "FLOOR", attachPoint: "SIDE", requiresFoundation: false, maxStackHeight: 1 },
			{ targetType: "STILT", attachPoint: "SIDE", requiresFoundation: false, maxStackHeight: 1 },
		],
		size: { width: 0.5, depth: 0.2, height: 2 },
		health: 50,
		unlockRequirement: null,
	},

	// === WALLS ===
	{
		id: "bamboo-wall",
		name: "Bamboo Wall",
		category: "WALLS",
		components: ["WALL_BAMBOO_SLATS"],
		cost: { wood: 8, metal: 0, supplies: 0 },
		snapRules: [
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 2 },
		],
		size: { width: 2, depth: 0.15, height: 2 },
		health: 60,
		unlockRequirement: null,
	},
	{
		id: "thatch-wall",
		name: "Thatch Wall",
		category: "WALLS",
		components: ["WALL_THATCH_PANEL"],
		cost: { wood: 5, metal: 0, supplies: 2 },
		snapRules: [
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 2 },
		],
		size: { width: 2, depth: 0.1, height: 2 },
		health: 40,
		unlockRequirement: null,
	},
	{
		id: "door-frame",
		name: "Door Frame",
		category: "WALLS",
		components: ["WALL_FRAME"],
		cost: { wood: 12, metal: 2, supplies: 0 },
		snapRules: [
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 1 },
		],
		size: { width: 1.2, depth: 0.15, height: 2.2 },
		health: 80,
		unlockRequirement: null,
	},
	{
		id: "window-frame",
		name: "Window Frame",
		category: "WALLS",
		components: ["WALL_FRAME"],
		cost: { wood: 10, metal: 1, supplies: 0 },
		snapRules: [
			{ targetType: "WALL", attachPoint: "SIDE", requiresFoundation: true, maxStackHeight: 1 },
		],
		size: { width: 1, depth: 0.15, height: 1 },
		health: 30,
		unlockRequirement: null,
	},

	// === ROOF ===
	{
		id: "thatch-roof",
		name: "Thatch Roof",
		category: "ROOF",
		components: ["ROOF_THATCH_SECTION"],
		cost: { wood: 4, metal: 0, supplies: 5 },
		snapRules: [
			{ targetType: "WALL", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 1 },
		],
		size: { width: 2.5, depth: 2.5, height: 1.5 },
		health: 30,
		unlockRequirement: null,
	},
	{
		id: "tin-roof",
		name: "Tin Roof",
		category: "ROOF",
		components: ["ROOF_TIN_SECTION"],
		cost: { wood: 2, metal: 8, supplies: 0 },
		snapRules: [
			{ targetType: "WALL", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 1 },
		],
		size: { width: 2.5, depth: 2.5, height: 0.8 },
		health: 50,
		unlockRequirement: null,
	},

	// === DEFENSE ===
	{
		id: "sandbag-wall",
		name: "Sandbag Wall",
		category: "DEFENSE",
		components: ["WALL_FRAME"], // Placeholder
		cost: { wood: 0, metal: 0, supplies: 15 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 2 },
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: false, maxStackHeight: 2 },
		],
		size: { width: 2, depth: 0.5, height: 1 },
		health: 150,
		unlockRequirement: null,
	},
	{
		id: "spike-trap",
		name: "Spike Trap",
		category: "DEFENSE",
		components: ["STILT_SQUARE"], // Placeholder
		cost: { wood: 10, metal: 5, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
		],
		size: { width: 1.5, depth: 1.5, height: 0.3 },
		health: 50,
		unlockRequirement: null,
	},
	{
		id: "watchtower-kit",
		name: "Watchtower Kit",
		category: "DEFENSE",
		components: ["STILT_ROUND", "FLOOR_SECTION_2X2", "RAILING_SECTION"],
		cost: { wood: 40, metal: 10, supplies: 5 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
		],
		size: { width: 3, depth: 3, height: 5 },
		health: 200,
		unlockRequirement: "Secure 2 Territories",
	},

	// === UTILITY ===
	{
		id: "storage-crate",
		name: "Storage Crate",
		category: "UTILITY",
		components: ["FLOOR_PLANK"], // Placeholder
		cost: { wood: 15, metal: 5, supplies: 0 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: false, maxStackHeight: 2 },
		],
		size: { width: 1, depth: 1, height: 1 },
		health: 80,
		unlockRequirement: null,
	},
	{
		id: "workbench",
		name: "Workbench",
		category: "UTILITY",
		components: ["FLOOR_PLANK", "STILT_SQUARE"],
		cost: { wood: 20, metal: 15, supplies: 5 },
		snapRules: [
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 1 },
		],
		size: { width: 2, depth: 1, height: 1 },
		health: 100,
		unlockRequirement: null,
	},
	{
		id: "ammo-cache",
		name: "Ammo Cache",
		category: "UTILITY",
		components: ["FLOOR_PLANK"],
		cost: { wood: 10, metal: 20, supplies: 10 },
		snapRules: [
			{ targetType: "FLOOR", attachPoint: "TOP", requiresFoundation: true, maxStackHeight: 1 },
		],
		size: { width: 1, depth: 0.5, height: 0.5 },
		health: 60,
		unlockRequirement: "Secure 1 Territory",
	},

	// === COMFORT ===
	{
		id: "hammock",
		name: "Hammock",
		category: "COMFORT",
		components: ["ROPE_COIL"],
		cost: { wood: 5, metal: 0, supplies: 8 },
		snapRules: [
			{ targetType: "STILT", attachPoint: "SIDE", requiresFoundation: false, maxStackHeight: 1 },
		],
		size: { width: 2, depth: 0.8, height: 0.5 },
		health: 20,
		unlockRequirement: null,
	},
	{
		id: "campfire",
		name: "Campfire",
		category: "COMFORT",
		components: ["FLOOR_PLANK"], // Placeholder
		cost: { wood: 8, metal: 0, supplies: 2 },
		snapRules: [
			{ targetType: "GROUND", attachPoint: "BOTTOM", requiresFoundation: false, maxStackHeight: 1 },
		],
		size: { width: 1, depth: 1, height: 0.5 },
		health: 30,
		unlockRequirement: null,
	},
];

// =============================================================================
// TEMPLATE QUERIES
// =============================================================================

export function getBuildableTemplate(id: string): BuildableTemplate | undefined {
	return BUILDABLE_TEMPLATES.find((b) => b.id === id);
}

export function getBuildablesByCategory(
	category: BuildableTemplate["category"],
): BuildableTemplate[] {
	return BUILDABLE_TEMPLATES.filter((b) => b.category === category);
}

export function getUnlockedBuildables(unlockedRequirements: Set<string>): BuildableTemplate[] {
	return BUILDABLE_TEMPLATES.filter(
		(b) => !b.unlockRequirement || unlockedRequirements.has(b.unlockRequirement),
	);
}

export function canAffordBuildable(template: BuildableTemplate, resources: ResourceCost): boolean {
	return (
		resources.wood >= template.cost.wood &&
		resources.metal >= template.cost.metal &&
		resources.supplies >= template.cost.supplies
	);
}

export function deductBuildableCost(
	template: BuildableTemplate,
	resources: ResourceCost,
): ResourceCost {
	return {
		wood: resources.wood - template.cost.wood,
		metal: resources.metal - template.cost.metal,
		supplies: resources.supplies - template.cost.supplies,
	};
}

// =============================================================================
// SNAP POINT CALCULATION
// =============================================================================

export interface CalculatedSnapPoint {
	worldPosition: Vector3;
	direction: Vector3;
	acceptsCategories: BuildableTemplate["category"][];
}

export function getSnapPointsForTemplate(
	template: BuildableTemplate,
	worldPosition: Vector3,
	rotation: number,
): CalculatedSnapPoint[] {
	// This would calculate actual snap points based on the template's size
	// and snap rules. For now, return edge snap points.
	const points: CalculatedSnapPoint[] = [];
	const { width, depth } = template.size;
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);

	// Four edge points
	const edges = [
		{ x: width / 2, z: 0, dx: 1, dz: 0 },
		{ x: -width / 2, z: 0, dx: -1, dz: 0 },
		{ x: 0, z: depth / 2, dx: 0, dz: 1 },
		{ x: 0, z: -depth / 2, dx: 0, dz: -1 },
	];

	for (const edge of edges) {
		const rotatedX = edge.x * cos - edge.z * sin;
		const rotatedZ = edge.x * sin + edge.z * cos;

		points.push({
			worldPosition: new Vector3(worldPosition.x + rotatedX, worldPosition.y, worldPosition.z + rotatedZ),
			direction: new Vector3(edge.dx * cos - edge.dz * sin, 0, edge.dx * sin + edge.dz * cos),
			acceptsCategories: ["FOUNDATION", "WALLS"],
		});
	}

	return points;
}
