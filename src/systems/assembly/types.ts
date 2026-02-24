/**
 * Procedural Assembly System - Type Definitions
 *
 * Defines the rules for procedural generation of structures,
 * settlements, paths, and player-buildable components.
 *
 * NOTE: Slot types (EquipmentSlot, AttachmentSlot, BuildCategory, ShopCategory)
 * are imported from ECS data - the single source of truth.
 */

import type { Vector3 } from "@babylonjs/core";

// Import slot types from ECS - single source of truth
import type {
	AttachmentSlot as ECSAttachmentSlot,
	BuildCategory as ECSBuildCategory,
	EquipmentSlot as ECSEquipmentSlot,
	ShopCategory as ECSShopCategory,
} from "../../ecs/data/slots";

// Re-export for backwards compatibility
export type AttachmentSlot = ECSAttachmentSlot;
export type BuildCategory = ECSBuildCategory;
export type EquipmentSlot = ECSEquipmentSlot;
export type ShopCategory = ECSShopCategory;

// =============================================================================
// STRUCTURE COMPONENTS (Atomic Building Blocks)
// =============================================================================

/**
 * Base component types for procedural structures
 */
export type StructureComponentType =
	// Foundation
	| "STILT" // Wooden pole/leg
	| "FLOOR_PLANK" // Individual floor board
	| "FLOOR_SECTION" // 2x2 floor unit
	// Walls
	| "WALL_FRAME" // Basic wall frame
	| "WALL_BAMBOO" // Bamboo slat wall
	| "WALL_THATCH" // Woven thatch wall
	| "WINDOW_OPENING" // Window cutout
	| "DOOR_FRAME" // Door opening
	// Roof
	| "ROOF_BEAM" // Main roof support
	| "ROOF_THATCH" // Thatched roof section
	| "ROOF_TIN" // Corrugated metal roof
	// Connectors
	| "ROPE_BINDING" // Rope tie between components
	| "JOINT_PEG" // Wooden peg joint
	// Decorations
	| "LADDER" // Vertical access
	| "RAILING" // Safety rail
	| "AWNING" // Shade cover
	| "LANTERN_HOOK"; // Light attachment point

/**
 * Individual structure component with position and orientation
 */
export interface StructureComponent {
	id: string;
	type: StructureComponentType;
	localPosition: Vector3;
	localRotation: Vector3;
	scale: Vector3;
	material: "WOOD" | "BAMBOO" | "THATCH" | "METAL" | "ROPE";
	condition: number; // 0-1, affects appearance
	isDestructible: boolean;
}

// =============================================================================
// STRUCTURE TEMPLATES (Assembled Buildings)
// =============================================================================

/**
 * Structure archetypes that can be procedurally generated
 */
export type StructureArchetype =
	| "BASIC_HUT" // Small single-room dwelling
	| "LONGHOUSE" // Multi-room community building
	| "WATCHTOWER" // Elevated observation post
	| "DOCK_PLATFORM" // River access platform
	| "STORAGE_SHED" // Supply storage
	| "MEDICAL_POST" // Healer station
	| "AMMO_DEPOT" // Scale-Guard ammo storage
	| "COMMAND_POST" // Outpost headquarters
	| "BRIDGE_SECTION"; // Suspended walkway segment

/**
 * Template for a complete structure
 */
export interface StructureTemplate {
	archetype: StructureArchetype;
	components: StructureComponent[];
	footprint: { width: number; depth: number }; // Ground space required
	height: number;
	snapPoints: SnapPoint[]; // Where other structures can connect
	interactionPoints: InteractionPoint[];
}

/**
 * Connection point for structure-to-structure attachment
 */
export interface SnapPoint {
	id: string;
	localPosition: Vector3;
	direction: Vector3; // Normal direction
	acceptsTypes: StructureArchetype[];
	occupied: boolean;
}

/**
 * Points where players can interact
 */
export interface InteractionPoint {
	id: string;
	localPosition: Vector3;
	type: "ENTER" | "CLIMB" | "LOOT" | "HEAL" | "BUILD";
	radius: number;
}

// =============================================================================
// SETTLEMENT LAYOUT (Villages, Outposts)
// =============================================================================

/**
 * Settlement types with different layout rules
 */
export type SettlementType =
	| "NATIVE_VILLAGE" // Peaceful, scattered layout
	| "FISHING_CAMP" // Linear along water
	| "SCALE_GUARD_OUTPOST" // Organized, defensive
	| "PRISON_COMPOUND" // Central cage, perimeter walls
	| "SIPHON_FACILITY" // Industrial, clustered
	| "PLAYER_BASE"; // Player-built at LZ

/**
 * Rules for settlement generation
 */
export interface SettlementConfig {
	type: SettlementType;

	// Structure counts
	structures: {
		type: StructureArchetype;
		min: number;
		max: number;
		required: boolean;
	}[];

	// Layout parameters
	layout: {
		pattern: "SCATTERED" | "CIRCULAR" | "LINEAR" | "GRID" | "DEFENSIVE";
		spacing: { min: number; max: number };
		centerBuffer: number; // Empty space in center
		rotation: "RANDOM" | "FACING_CENTER" | "FACING_WATER" | "ALIGNED";
	};

	// Path generation
	paths: {
		connectAll: boolean; // Ensure paths between all structures
		style: "DIRT" | "PLANKS" | "STONES" | "ELEVATED";
		width: number;
	};

	// Decoration density
	decorations: {
		type: string;
		density: number; // Per square meter
	}[];

	// Population
	inhabitants: {
		type: "VILLAGER" | "HEALER" | "GUARD" | "PRISONER";
		count: { min: number; max: number };
	}[];
}

// =============================================================================
// PATH GENERATION
// =============================================================================

/**
 * Path segment connecting two points
 */
export interface PathSegment {
	id: string;
	start: Vector3;
	end: Vector3;
	width: number;
	style: "DIRT" | "PLANKS" | "STONES" | "ELEVATED" | "BRIDGE";
	elevation: number;
	waypoints: Vector3[]; // For curved paths
}

/**
 * Elevated platform section
 */
export interface PlatformSection {
	id: string;
	position: Vector3;
	size: { width: number; depth: number };
	height: number;
	stilts: Vector3[]; // Stilt positions
	railings: ("NORTH" | "SOUTH" | "EAST" | "WEST")[];
	hasLadder: boolean;
	ladderSide: "NORTH" | "SOUTH" | "EAST" | "WEST";
}

// =============================================================================
// BUILD MODE (Player Construction)
// =============================================================================

/**
 * Buildable item definition
 */
export interface BuildableItem {
	id: string;
	name: string;
	category: BuildCategory;
	components: StructureComponentType[];
	cost: {
		wood: number;
		metal: number;
		supplies: number;
	};
	unlockRequirement?: string;
	snapRules: SnapRule[];
	ghostMaterial: string; // Material for placement preview
}

/**
 * Rules for how items can snap together
 */
export interface SnapRule {
	targetType: StructureComponentType | StructureArchetype | "GROUND" | "WATER";
	attachPoint: "TOP" | "BOTTOM" | "SIDE" | "CORNER" | "CENTER";
	requiresFoundation: boolean;
	maxStackHeight: number;
}

/**
 * Build mode state
 */
export interface BuildModeState {
	isActive: boolean;
	selectedItem: BuildableItem | null;
	ghostPosition: Vector3 | null;
	ghostRotation: number;
	canPlace: boolean;
	nearbySnapPoints: SnapPoint[];
	resources: {
		wood: number;
		metal: number;
		supplies: number;
	};
}

// =============================================================================
// CANTEEN / LOADOUT ASSEMBLY
// =============================================================================

/**
 * Loadout configuration
 */
export interface Loadout {
	id: string;
	name: string;
	characterId: string;
	equipment: Record<EquipmentSlot, string | null>;
	weaponAttachments: Record<string, Record<AttachmentSlot, string | null>>;
}

/**
 * Attachment definition
 */
export interface Attachment {
	id: string;
	name: string;
	slot: AttachmentSlot;
	compatibleWeapons: string[];
	stats: {
		damage?: number;
		accuracy?: number;
		recoil?: number;
		range?: number;
		fireRate?: number;
	};
	cost: number;
	unlockRequirement?: string;
}

/**
 * Canteen shop item
 */
export interface CanteenItem {
	id: string;
	name: string;
	description: string;
	category: ShopCategory;
	price: number;
	unlocked: boolean;
	owned: boolean;
	maxOwned: number; // -1 for unlimited
}

// =============================================================================
// PROCEDURAL GENERATION CONFIG
// =============================================================================

/**
 * Master config for procedural assembly
 */
export interface AssemblyConfig {
	// Hut generation
	hut: {
		minStilts: number;
		maxStilts: number;
		floorHeight: { min: number; max: number };
		roomSize: { min: number; max: number };
		roofPitch: { min: number; max: number };
		wearVariation: number; // Random wear amount
	};

	// Village generation
	village: {
		minHuts: number;
		maxHuts: number;
		centralFeature: "WELL" | "FIRE_PIT" | "SHRINE" | "NONE";
		hasHealer: boolean;
		pathDensity: number;
	};

	// Platform networks
	platforms: {
		minHeight: number;
		maxHeight: number;
		sectionSize: number;
		connectRadius: number;
		requiresLadderAccess: boolean;
	};
}
