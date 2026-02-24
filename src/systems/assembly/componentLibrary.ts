/**
 * Component Library - DRY Mesh & Joint Definitions
 *
 * CRITICAL DESIGN PRINCIPLES:
 * 1. Meshes are defined ONCE and reused everywhere
 * 2. Materials are swapped based on faction/context
 * 3. Characters (player & enemy) share the same skeletal rig
 * 4. Weapons are DETACHED - attach to any character's grip points
 * 5. Structural components are faction-agnostic with material variants
 */

import { Vector3 } from "@babylonjs/core";

// =============================================================================
// STUB CLASSES (replace Three.js dependencies)
// =============================================================================

/**
 * Parses a hex color string like '#RRGGBB' into { r, g, b } floats (0-1)
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
	const n = parseInt(hex.replace('#', ''), 16);
	return { r: ((n >> 16) & 0xff) / 255, g: ((n >> 8) & 0xff) / 255, b: (n & 0xff) / 255 };
}

/** Minimal color helper that supports getHexString() for test compatibility */
class StubColor {
	r: number;
	g: number;
	b: number;
	constructor(hex: string) {
		const c = parseHexColor(hex);
		this.r = c.r;
		this.g = c.g;
		this.b = c.b;
	}
	getHexString(): string {
		const r = Math.round(this.r * 255).toString(16).padStart(2, '0');
		const g = Math.round(this.g * 255).toString(16).padStart(2, '0');
		const b = Math.round(this.b * 255).toString(16).padStart(2, '0');
		return r + g + b;
	}
}

/** Stub material - replaces THREE.MeshStandardMaterial */
export class StubMaterial {
	color: StubColor;
	roughness: number;
	metalness: number;
	transparent: boolean;
	opacity: number;
	type = 'standard' as const;
	constructor(params: { color: string; roughness: number; metalness: number; transparent: boolean; opacity: number }) {
		this.color = new StubColor(params.color);
		this.roughness = params.roughness;
		this.metalness = params.metalness;
		this.transparent = params.transparent;
		this.opacity = params.opacity;
	}
}

/** Stub geometry - replaces THREE.BufferGeometry and its subclasses */
export class StubGeometry {
	geometryType: string;
	params: number[];
	constructor(geometryType: string, params: number[]) {
		this.geometryType = geometryType;
		this.params = params;
	}
}

export class StubBoxGeometry extends StubGeometry {
	constructor(...params: number[]) { super('BOX', params); }
}
export class StubCylinderGeometry extends StubGeometry {
	constructor(...params: number[]) { super('CYLINDER', params); }
}
export class StubSphereGeometry extends StubGeometry {
	constructor(...params: number[]) { super('SPHERE', params); }
}
export class StubCapsuleGeometry extends StubGeometry {
	constructor(...params: number[]) { super('CAPSULE', params); }
}
export class StubConeGeometry extends StubGeometry {
	constructor(...params: number[]) { super('CONE', params); }
}
export class StubTorusGeometry extends StubGeometry {
	constructor(...params: number[]) { super('TORUS', params); }
}

/** Stub mesh - replaces THREE.Mesh */
export class StubMesh {
	geometry: StubGeometry;
	material: StubMaterial;
	scale: Vector3;
	castShadow = false;
	receiveShadow = false;
	userData: Record<string, unknown> = {};
	constructor(geometry: StubGeometry, material: StubMaterial) {
		this.geometry = geometry;
		this.material = material;
		this.scale = new Vector3(1, 1, 1);
	}
}

/** Stub Euler - replaces THREE.Euler, used for rotation values */
export class StubEuler {
	x: number;
	y: number;
	z: number;
	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}


// =============================================================================
// FACTION MATERIAL PALETTES
// =============================================================================

/**
 * Factions that can use the same components with different materials
 */
export type Faction = "URA" | "SCALE_GUARD" | "NATIVE" | "NEUTRAL";

/**
 * Material palette for each faction
 */
export interface FactionPalette {
	primary: string; // Main structure color
	secondary: string; // Accent color
	wood: string; // Wood tone
	metal: string; // Metal/hardware
	fabric: string; // Cloth/thatch
	wear: number; // Wear/damage level 0-1
}

export const FACTION_PALETTES: Record<Faction, FactionPalette> = {
	URA: {
		primary: "#5D4E37", // Military brown
		secondary: "#3D5C3A", // Olive green
		wood: "#8B7355", // Clean wood
		metal: "#4A4A4A", // Dark metal
		fabric: "#556B2F", // Military green
		wear: 0.1, // Well-maintained
	},
	SCALE_GUARD: {
		primary: "#2F4F4F", // Dark slate
		secondary: "#8B0000", // Dark red
		wood: "#3E2723", // Dark worn wood
		metal: "#2F2F2F", // Rusted metal
		fabric: "#4A3728", // Muddy brown
		wear: 0.4, // Battle-worn
	},
	NATIVE: {
		primary: "#D2B48C", // Tan
		secondary: "#8FBC8F", // Sage green
		wood: "#DEB887", // Natural wood
		metal: "#B8860B", // Brass/bronze
		fabric: "#F5DEB3", // Wheat/natural
		wear: 0.2, // Weathered but cared for
	},
	NEUTRAL: {
		primary: "#696969", // Gray
		secondary: "#808080", // Light gray
		wood: "#A0826D", // Neutral wood
		metal: "#505050", // Steel
		fabric: "#C0C0C0", // Silver
		wear: 0.3,
	},
};

// =============================================================================
// SKELETAL RIG - SHARED BY ALL CHARACTERS
// =============================================================================

/**
 * Joint names in the universal character rig
 * Used by Player, Enemies, Villagers - EVERYONE
 */
export type JointName =
	// Spine
	| "ROOT"
	| "PELVIS"
	| "SPINE_LOWER"
	| "SPINE_UPPER"
	| "NECK"
	| "HEAD"
	// Left Arm
	| "SHOULDER_L"
	| "UPPER_ARM_L"
	| "ELBOW_L"
	| "FOREARM_L"
	| "WRIST_L"
	| "HAND_L"
	| "GRIP_L" // Weapon/item attachment point
	// Right Arm
	| "SHOULDER_R"
	| "UPPER_ARM_R"
	| "ELBOW_R"
	| "FOREARM_R"
	| "WRIST_R"
	| "HAND_R"
	| "GRIP_R" // Weapon/item attachment point
	// Left Leg
	| "HIP_L"
	| "UPPER_LEG_L"
	| "KNEE_L"
	| "LOWER_LEG_L"
	| "ANKLE_L"
	| "FOOT_L"
	// Right Leg
	| "HIP_R"
	| "UPPER_LEG_R"
	| "KNEE_R"
	| "LOWER_LEG_R"
	| "ANKLE_R"
	| "FOOT_R"
	// Tail (for otters/animals)
	| "TAIL_BASE"
	| "TAIL_MID"
	| "TAIL_TIP";

/**
 * Joint definition with hierarchy and constraints
 */
export interface JointDef {
	name: JointName;
	parent: JointName | null;
	localPosition: Vector3;
	rotationLimits: {
		x: { min: number; max: number };
		y: { min: number; max: number };
		z: { min: number; max: number };
	};
}

/**
 * Universal character skeleton
 * Same rig for players, enemies, villagers - just different meshes attached
 */
export const UNIVERSAL_SKELETON: JointDef[] = [
	// Spine
	{
		name: "ROOT",
		parent: null,
		localPosition: new Vector3(0, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI, max: Math.PI },
			y: { min: -Math.PI, max: Math.PI },
			z: { min: -Math.PI, max: Math.PI },
		},
	},
	{
		name: "PELVIS",
		parent: "ROOT",
		localPosition: new Vector3(0, 0.4, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.5, max: 0.5 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "SPINE_LOWER",
		parent: "PELVIS",
		localPosition: new Vector3(0, 0.15, 0),
		rotationLimits: {
			x: { min: -0.4, max: 0.4 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "SPINE_UPPER",
		parent: "SPINE_LOWER",
		localPosition: new Vector3(0, 0.2, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.5 },
			y: { min: -0.4, max: 0.4 },
			z: { min: -0.3, max: 0.3 },
		},
	},
	{
		name: "NECK",
		parent: "SPINE_UPPER",
		localPosition: new Vector3(0, 0.15, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.5 },
			y: { min: -0.8, max: 0.8 },
			z: { min: -0.3, max: 0.3 },
		},
	},
	{
		name: "HEAD",
		parent: "NECK",
		localPosition: new Vector3(0, 0.12, 0.02),
		rotationLimits: {
			x: { min: -0.6, max: 0.4 },
			y: { min: -0.9, max: 0.9 },
			z: { min: -0.2, max: 0.2 },
		},
	},

	// Left Arm
	{
		name: "SHOULDER_L",
		parent: "SPINE_UPPER",
		localPosition: new Vector3(-0.12, 0.1, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.5 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.5, max: 0.2 },
		},
	},
	{
		name: "UPPER_ARM_L",
		parent: "SHOULDER_L",
		localPosition: new Vector3(-0.08, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI, max: Math.PI },
			y: { min: -0.3, max: Math.PI },
			z: { min: -Math.PI / 2, max: Math.PI / 2 },
		},
	},
	{
		name: "ELBOW_L",
		parent: "UPPER_ARM_L",
		localPosition: new Vector3(-0.12, 0, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 2.5 }, z: { min: 0, max: 0 } }, // Elbow only bends one way
	},
	{
		name: "FOREARM_L",
		parent: "ELBOW_L",
		localPosition: new Vector3(-0.05, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI / 2, max: Math.PI / 2 },
			y: { min: 0, max: 0 },
			z: { min: 0, max: 0 },
		},
	},
	{
		name: "WRIST_L",
		parent: "FOREARM_L",
		localPosition: new Vector3(-0.1, 0, 0),
		rotationLimits: {
			x: { min: -0.8, max: 0.8 },
			y: { min: -0.5, max: 0.5 },
			z: { min: -0.4, max: 0.4 },
		},
	},
	{
		name: "HAND_L",
		parent: "WRIST_L",
		localPosition: new Vector3(-0.05, 0, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.2, max: 0.2 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "GRIP_L",
		parent: "HAND_L",
		localPosition: new Vector3(-0.03, 0, 0.02),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } }, // Grip point doesn't rotate independently
	},

	// Right Arm (mirrored)
	{
		name: "SHOULDER_R",
		parent: "SPINE_UPPER",
		localPosition: new Vector3(0.12, 0.1, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.5 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.5 },
		},
	},
	{
		name: "UPPER_ARM_R",
		parent: "SHOULDER_R",
		localPosition: new Vector3(0.08, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI, max: Math.PI },
			y: { min: -Math.PI, max: 0.3 },
			z: { min: -Math.PI / 2, max: Math.PI / 2 },
		},
	},
	{
		name: "ELBOW_R",
		parent: "UPPER_ARM_R",
		localPosition: new Vector3(0.12, 0, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: -2.5, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "FOREARM_R",
		parent: "ELBOW_R",
		localPosition: new Vector3(0.05, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI / 2, max: Math.PI / 2 },
			y: { min: 0, max: 0 },
			z: { min: 0, max: 0 },
		},
	},
	{
		name: "WRIST_R",
		parent: "FOREARM_R",
		localPosition: new Vector3(0.1, 0, 0),
		rotationLimits: {
			x: { min: -0.8, max: 0.8 },
			y: { min: -0.5, max: 0.5 },
			z: { min: -0.4, max: 0.4 },
		},
	},
	{
		name: "HAND_R",
		parent: "WRIST_R",
		localPosition: new Vector3(0.05, 0, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.2, max: 0.2 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "GRIP_R",
		parent: "HAND_R",
		localPosition: new Vector3(0.03, 0, 0.02),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},

	// Left Leg
	{
		name: "HIP_L",
		parent: "PELVIS",
		localPosition: new Vector3(-0.06, -0.05, 0),
		rotationLimits: {
			x: { min: -0.2, max: 0.2 },
			y: { min: -0.1, max: 0.1 },
			z: { min: -0.1, max: 0.3 },
		},
	},
	{
		name: "UPPER_LEG_L",
		parent: "HIP_L",
		localPosition: new Vector3(0, -0.02, 0),
		rotationLimits: {
			x: { min: -1.8, max: 0.5 },
			y: { min: -0.3, max: 0.5 },
			z: { min: -0.2, max: 0.5 },
		},
	},
	{
		name: "KNEE_L",
		parent: "UPPER_LEG_L",
		localPosition: new Vector3(0, -0.15, 0),
		rotationLimits: { x: { min: 0, max: 2.5 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } }, // Knee only bends one way
	},
	{
		name: "LOWER_LEG_L",
		parent: "KNEE_L",
		localPosition: new Vector3(0, -0.05, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "ANKLE_L",
		parent: "LOWER_LEG_L",
		localPosition: new Vector3(0, -0.12, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.8 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "FOOT_L",
		parent: "ANKLE_L",
		localPosition: new Vector3(0, -0.03, 0.04),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.2, max: 0.2 },
			z: { min: -0.1, max: 0.1 },
		},
	},

	// Right Leg (mirrored)
	{
		name: "HIP_R",
		parent: "PELVIS",
		localPosition: new Vector3(0.06, -0.05, 0),
		rotationLimits: {
			x: { min: -0.2, max: 0.2 },
			y: { min: -0.1, max: 0.1 },
			z: { min: -0.3, max: 0.1 },
		},
	},
	{
		name: "UPPER_LEG_R",
		parent: "HIP_R",
		localPosition: new Vector3(0, -0.02, 0),
		rotationLimits: {
			x: { min: -1.8, max: 0.5 },
			y: { min: -0.5, max: 0.3 },
			z: { min: -0.5, max: 0.2 },
		},
	},
	{
		name: "KNEE_R",
		parent: "UPPER_LEG_R",
		localPosition: new Vector3(0, -0.15, 0),
		rotationLimits: { x: { min: 0, max: 2.5 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "LOWER_LEG_R",
		parent: "KNEE_R",
		localPosition: new Vector3(0, -0.05, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "ANKLE_R",
		parent: "LOWER_LEG_R",
		localPosition: new Vector3(0, -0.12, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.8 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "FOOT_R",
		parent: "ANKLE_R",
		localPosition: new Vector3(0, -0.03, 0.04),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.2, max: 0.2 },
			z: { min: -0.1, max: 0.1 },
		},
	},

	// Tail
	{
		name: "TAIL_BASE",
		parent: "PELVIS",
		localPosition: new Vector3(0, 0, -0.08),
		rotationLimits: {
			x: { min: -0.5, max: 0.8 },
			y: { min: -0.6, max: 0.6 },
			z: { min: -0.3, max: 0.3 },
		},
	},
	{
		name: "TAIL_MID",
		parent: "TAIL_BASE",
		localPosition: new Vector3(0, 0, -0.12),
		rotationLimits: {
			x: { min: -0.6, max: 0.6 },
			y: { min: -0.8, max: 0.8 },
			z: { min: -0.4, max: 0.4 },
		},
	},
	{
		name: "TAIL_TIP",
		parent: "TAIL_MID",
		localPosition: new Vector3(0, 0, -0.1),
		rotationLimits: {
			x: { min: -0.8, max: 0.8 },
			y: { min: -1, max: 1 },
			z: { min: -0.5, max: 0.5 },
		},
	},
];

// =============================================================================
// REUSABLE MESH DEFINITIONS (Geometry Only - Materials Applied Separately)
// =============================================================================

/**
 * Unique mesh identifiers - each geometry defined ONCE
 */
export type MeshId =
	// Structural
	| "STILT_ROUND"
	| "STILT_SQUARE"
	| "FLOOR_PLANK"
	| "FLOOR_SECTION_2X2"
	| "WALL_FRAME"
	| "WALL_BAMBOO_SLATS"
	| "WALL_THATCH_PANEL"
	| "ROOF_BEAM"
	| "ROOF_THATCH_SECTION"
	| "ROOF_TIN_SECTION"
	| "LADDER_SEGMENT"
	| "RAILING_SECTION"
	| "ROPE_COIL"
	| "ROPE_BINDING"
	// Weapon Parts (modular)
	| "BARREL_SHORT"
	| "BARREL_LONG"
	| "BARREL_DOUBLE"
	| "RECEIVER_PISTOL"
	| "RECEIVER_RIFLE"
	| "RECEIVER_SHOTGUN"
	| "STOCK_WOOD"
	| "STOCK_TACTICAL"
	| "GRIP_PISTOL"
	| "GRIP_VERTICAL"
	| "MAGAZINE_BOX"
	| "MAGAZINE_DRUM"
	| "SCOPE_IRON"
	| "SCOPE_RED_DOT"
	// Character Parts (attach to skeleton)
	| "TORSO_OTTER"
	| "TORSO_GATOR"
	| "TORSO_SNAKE"
	| "HEAD_OTTER"
	| "HEAD_GATOR"
	| "HEAD_SNAKE"
	| "ARM_SEGMENT"
	| "LEG_SEGMENT"
	| "HAND_PAW"
	| "FOOT_PAW"
	| "TAIL_OTTER"
	| "TAIL_GATOR"
	// Equipment (attach to character)
	| "VEST_TACTICAL"
	| "VEST_LIGHT"
	| "HELMET_STANDARD"
	| "HELMET_BANDANA"
	| "BACKPACK_RADIO"
	| "BACKPACK_MEDIC"
	| "BACKPACK_SCUBA";

/**
 * Mesh definition - geometry parameters only
 * Materials are applied at instantiation based on faction
 */
export interface MeshDef {
	id: MeshId;
	geometryType: "BOX" | "CYLINDER" | "SPHERE" | "CAPSULE" | "CONE" | "TORUS" | "CUSTOM";
	geometryParams: number[]; // Parameters for THREE geometry constructor
	defaultScale: Vector3;
	attachmentPoints?: { name: string; position: Vector3; rotation: Vector3 }[];
}

/**
 * Mesh library - ALL reusable geometries
 */
export const MESH_LIBRARY: Record<MeshId, MeshDef> = {
	// Structural
	STILT_ROUND: {
		id: "STILT_ROUND",
		geometryType: "CYLINDER",
		geometryParams: [0.06, 0.06, 1, 8], // radiusTop, radiusBottom, height, segments
		defaultScale: new Vector3(1, 1, 1),
	},
	STILT_SQUARE: {
		id: "STILT_SQUARE",
		geometryType: "BOX",
		geometryParams: [0.12, 1, 0.12],
		defaultScale: new Vector3(1, 1, 1),
	},
	FLOOR_PLANK: {
		id: "FLOOR_PLANK",
		geometryType: "BOX",
		geometryParams: [1, 0.04, 0.15],
		defaultScale: new Vector3(1, 1, 1),
	},
	FLOOR_SECTION_2X2: {
		id: "FLOOR_SECTION_2X2",
		geometryType: "BOX",
		geometryParams: [2, 0.08, 2],
		defaultScale: new Vector3(1, 1, 1),
	},
	WALL_FRAME: {
		id: "WALL_FRAME",
		geometryType: "BOX",
		geometryParams: [2, 1.8, 0.08],
		defaultScale: new Vector3(1, 1, 1),
	},
	WALL_BAMBOO_SLATS: {
		id: "WALL_BAMBOO_SLATS",
		geometryType: "BOX",
		geometryParams: [2, 1.8, 0.05],
		defaultScale: new Vector3(1, 1, 1),
	},
	WALL_THATCH_PANEL: {
		id: "WALL_THATCH_PANEL",
		geometryType: "BOX",
		geometryParams: [2, 1.8, 0.1],
		defaultScale: new Vector3(1, 1, 1),
	},
	ROOF_BEAM: {
		id: "ROOF_BEAM",
		geometryType: "BOX",
		geometryParams: [0.1, 0.1, 3],
		defaultScale: new Vector3(1, 1, 1),
	},
	ROOF_THATCH_SECTION: {
		id: "ROOF_THATCH_SECTION",
		geometryType: "BOX",
		geometryParams: [2, 0.15, 2],
		defaultScale: new Vector3(1, 1, 1),
	},
	ROOF_TIN_SECTION: {
		id: "ROOF_TIN_SECTION",
		geometryType: "BOX",
		geometryParams: [2, 0.02, 2],
		defaultScale: new Vector3(1, 1, 1),
	},
	LADDER_SEGMENT: {
		id: "LADDER_SEGMENT",
		geometryType: "BOX",
		geometryParams: [0.4, 1, 0.08],
		defaultScale: new Vector3(1, 1, 1),
	},
	RAILING_SECTION: {
		id: "RAILING_SECTION",
		geometryType: "BOX",
		geometryParams: [2, 0.8, 0.04],
		defaultScale: new Vector3(1, 1, 1),
	},
	ROPE_COIL: {
		id: "ROPE_COIL",
		geometryType: "TORUS",
		geometryParams: [0.15, 0.02, 8, 16],
		defaultScale: new Vector3(1, 1, 1),
	},
	ROPE_BINDING: {
		id: "ROPE_BINDING",
		geometryType: "CYLINDER",
		geometryParams: [0.08, 0.08, 0.1, 8],
		defaultScale: new Vector3(1, 1, 1),
	},

	// Weapon Parts
	BARREL_SHORT: {
		id: "BARREL_SHORT",
		geometryType: "CYLINDER",
		geometryParams: [0.015, 0.015, 0.3, 8],
		defaultScale: new Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "MUZZLE",
				position: new Vector3(0, 0, 0.15),
				rotation: new Vector3(0, 0, 0),
			},
		],
	},
	BARREL_LONG: {
		id: "BARREL_LONG",
		geometryType: "CYLINDER",
		geometryParams: [0.012, 0.012, 0.5, 8],
		defaultScale: new Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "MUZZLE",
				position: new Vector3(0, 0, 0.25),
				rotation: new Vector3(0, 0, 0),
			},
		],
	},
	BARREL_DOUBLE: {
		id: "BARREL_DOUBLE",
		geometryType: "CYLINDER",
		geometryParams: [0.025, 0.025, 0.4, 8],
		defaultScale: new Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "MUZZLE",
				position: new Vector3(0, 0, 0.2),
				rotation: new Vector3(0, 0, 0),
			},
		],
	},
	RECEIVER_PISTOL: {
		id: "RECEIVER_PISTOL",
		geometryType: "BOX",
		geometryParams: [0.03, 0.08, 0.12],
		defaultScale: new Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "BARREL",
				position: new Vector3(0, 0.02, 0.06),
				rotation: new Vector3(Math.PI / 2, 0, 0),
			},
			{
				name: "MAGAZINE",
				position: new Vector3(0, -0.04, 0),
				rotation: new Vector3(0, 0, 0),
			},
			{
				name: "GRIP",
				position: new Vector3(0, -0.04, -0.02),
				rotation: new Vector3(0, 0, 0),
			},
		],
	},
	RECEIVER_RIFLE: {
		id: "RECEIVER_RIFLE",
		geometryType: "BOX",
		geometryParams: [0.04, 0.06, 0.2],
		defaultScale: new Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "BARREL",
				position: new Vector3(0, 0.01, 0.1),
				rotation: new Vector3(Math.PI / 2, 0, 0),
			},
			{
				name: "MAGAZINE",
				position: new Vector3(0, -0.03, 0.02),
				rotation: new Vector3(0, 0, 0),
			},
			{
				name: "STOCK",
				position: new Vector3(0, 0, -0.1),
				rotation: new Vector3(0, 0, 0),
			},
			{
				name: "OPTIC",
				position: new Vector3(0, 0.03, 0),
				rotation: new Vector3(0, 0, 0),
			},
			{
				name: "GRIP",
				position: new Vector3(0, -0.03, -0.05),
				rotation: new Vector3(0, 0, 0),
			},
		],
	},
	RECEIVER_SHOTGUN: {
		id: "RECEIVER_SHOTGUN",
		geometryType: "BOX",
		geometryParams: [0.05, 0.07, 0.18],
		defaultScale: new Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "BARREL",
				position: new Vector3(0, 0.02, 0.09),
				rotation: new Vector3(Math.PI / 2, 0, 0),
			},
			{
				name: "STOCK",
				position: new Vector3(0, 0, -0.09),
				rotation: new Vector3(0, 0, 0),
			},
			{
				name: "GRIP",
				position: new Vector3(0, -0.035, -0.03),
				rotation: new Vector3(0, 0, 0),
			},
		],
	},
	STOCK_WOOD: {
		id: "STOCK_WOOD",
		geometryType: "BOX",
		geometryParams: [0.03, 0.12, 0.2],
		defaultScale: new Vector3(1, 1, 1),
	},
	STOCK_TACTICAL: {
		id: "STOCK_TACTICAL",
		geometryType: "BOX",
		geometryParams: [0.025, 0.08, 0.18],
		defaultScale: new Vector3(1, 1, 1),
	},
	GRIP_PISTOL: {
		id: "GRIP_PISTOL",
		geometryType: "BOX",
		geometryParams: [0.025, 0.08, 0.03],
		defaultScale: new Vector3(1, 1, 1),
	},
	GRIP_VERTICAL: {
		id: "GRIP_VERTICAL",
		geometryType: "CYLINDER",
		geometryParams: [0.015, 0.015, 0.06, 8],
		defaultScale: new Vector3(1, 1, 1),
	},
	MAGAZINE_BOX: {
		id: "MAGAZINE_BOX",
		geometryType: "BOX",
		geometryParams: [0.02, 0.08, 0.025],
		defaultScale: new Vector3(1, 1, 1),
	},
	MAGAZINE_DRUM: {
		id: "MAGAZINE_DRUM",
		geometryType: "CYLINDER",
		geometryParams: [0.04, 0.04, 0.03, 12],
		defaultScale: new Vector3(1, 1, 1),
	},
	SCOPE_IRON: {
		id: "SCOPE_IRON",
		geometryType: "BOX",
		geometryParams: [0.01, 0.02, 0.04],
		defaultScale: new Vector3(1, 1, 1),
	},
	SCOPE_RED_DOT: {
		id: "SCOPE_RED_DOT",
		geometryType: "CYLINDER",
		geometryParams: [0.015, 0.015, 0.04, 8],
		defaultScale: new Vector3(1, 1, 1),
	},

	// Character Parts
	TORSO_OTTER: {
		id: "TORSO_OTTER",
		geometryType: "CAPSULE",
		geometryParams: [0.12, 0.25, 4, 8],
		defaultScale: new Vector3(1, 1, 1),
	},
	TORSO_GATOR: {
		id: "TORSO_GATOR",
		geometryType: "BOX",
		geometryParams: [0.4, 0.25, 0.8],
		defaultScale: new Vector3(1, 1, 1),
	},
	TORSO_SNAKE: {
		id: "TORSO_SNAKE",
		geometryType: "CYLINDER",
		geometryParams: [0.08, 0.06, 0.4, 8],
		defaultScale: new Vector3(1, 1, 1),
	},
	HEAD_OTTER: {
		id: "HEAD_OTTER",
		geometryType: "SPHERE",
		geometryParams: [0.1, 12, 8],
		defaultScale: new Vector3(1, 0.9, 1.1),
	},
	HEAD_GATOR: {
		id: "HEAD_GATOR",
		geometryType: "BOX",
		geometryParams: [0.2, 0.12, 0.35],
		defaultScale: new Vector3(1, 1, 1),
	},
	HEAD_SNAKE: {
		id: "HEAD_SNAKE",
		geometryType: "SPHERE",
		geometryParams: [0.06, 8, 6],
		defaultScale: new Vector3(1, 0.8, 1.3),
	},
	ARM_SEGMENT: {
		id: "ARM_SEGMENT",
		geometryType: "CAPSULE",
		geometryParams: [0.03, 0.1, 4, 6],
		defaultScale: new Vector3(1, 1, 1),
	},
	LEG_SEGMENT: {
		id: "LEG_SEGMENT",
		geometryType: "CAPSULE",
		geometryParams: [0.04, 0.12, 4, 6],
		defaultScale: new Vector3(1, 1, 1),
	},
	HAND_PAW: {
		id: "HAND_PAW",
		geometryType: "SPHERE",
		geometryParams: [0.035, 8, 6],
		defaultScale: new Vector3(1.2, 0.8, 1),
	},
	FOOT_PAW: {
		id: "FOOT_PAW",
		geometryType: "BOX",
		geometryParams: [0.05, 0.02, 0.08],
		defaultScale: new Vector3(1, 1, 1),
	},
	TAIL_OTTER: {
		id: "TAIL_OTTER",
		geometryType: "CAPSULE",
		geometryParams: [0.04, 0.2, 4, 6],
		defaultScale: new Vector3(1, 0.6, 1),
	},
	TAIL_GATOR: {
		id: "TAIL_GATOR",
		geometryType: "BOX",
		geometryParams: [0.15, 0.1, 0.6],
		defaultScale: new Vector3(1, 1, 1),
	},

	// Equipment
	VEST_TACTICAL: {
		id: "VEST_TACTICAL",
		geometryType: "BOX",
		geometryParams: [0.28, 0.22, 0.14],
		defaultScale: new Vector3(1, 1, 1),
	},
	VEST_LIGHT: {
		id: "VEST_LIGHT",
		geometryType: "BOX",
		geometryParams: [0.26, 0.2, 0.1],
		defaultScale: new Vector3(1, 1, 1),
	},
	HELMET_STANDARD: {
		id: "HELMET_STANDARD",
		geometryType: "SPHERE",
		geometryParams: [0.11, 12, 8],
		defaultScale: new Vector3(1, 0.7, 1),
	},
	HELMET_BANDANA: {
		id: "HELMET_BANDANA",
		geometryType: "TORUS",
		geometryParams: [0.1, 0.02, 8, 16],
		defaultScale: new Vector3(1, 0.3, 1),
	},
	BACKPACK_RADIO: {
		id: "BACKPACK_RADIO",
		geometryType: "BOX",
		geometryParams: [0.12, 0.18, 0.08],
		defaultScale: new Vector3(1, 1, 1),
	},
	BACKPACK_MEDIC: {
		id: "BACKPACK_MEDIC",
		geometryType: "BOX",
		geometryParams: [0.14, 0.16, 0.1],
		defaultScale: new Vector3(1, 1, 1),
	},
	BACKPACK_SCUBA: {
		id: "BACKPACK_SCUBA",
		geometryType: "CYLINDER",
		geometryParams: [0.06, 0.06, 0.2, 8],
		defaultScale: new Vector3(1, 1, 1),
	},
};

// =============================================================================
// MATERIAL FACTORY
// =============================================================================

/**
 * Creates a material for a mesh based on faction and material type
 */
export function createMaterial(
	faction: Faction,
	materialType: "WOOD" | "METAL" | "FABRIC" | "SKIN" | "PRIMARY" | "SECONDARY",
	options: { roughness?: number; metalness?: number; opacity?: number } = {},
): StubMaterial {
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

	return new StubMaterial({
		color,
		roughness: actualRoughness,
		metalness: actualMetalness,
		transparent: opacity < 1,
		opacity,
	});
}

// =============================================================================
// GEOMETRY FACTORY
// =============================================================================

/**
 * Creates geometry from mesh definition
 */
export function createGeometry(meshDef: MeshDef): StubGeometry {
	const params = meshDef.geometryParams;

	switch (meshDef.geometryType) {
		case "BOX":
			return new StubBoxGeometry(params[0], params[1], params[2]);
		case "CYLINDER":
			return new StubCylinderGeometry(params[0], params[1], params[2], params[3] || 8);
		case "SPHERE":
			return new StubSphereGeometry(params[0], params[1] || 12, params[2] || 8);
		case "CAPSULE":
			return new StubCapsuleGeometry(params[0], params[1], params[2] || 4, params[3] || 8);
		case "CONE":
			return new StubConeGeometry(params[0], params[1], params[2] || 8);
		case "TORUS":
			return new StubTorusGeometry(params[0], params[1], params[2] || 8, params[3] || 16);
		default:
			return new StubBoxGeometry(1, 1, 1);
	}
}

// =============================================================================
// INSTANTIATION HELPERS
// =============================================================================

/**
 * Creates a mesh instance from the library with faction-appropriate materials
 */
export function instantiateMesh(
	meshId: MeshId,
	faction: Faction,
	materialType: "WOOD" | "METAL" | "FABRIC" | "SKIN" | "PRIMARY" | "SECONDARY" = "PRIMARY",
): StubMesh {
	const meshDef = MESH_LIBRARY[meshId];
	const geometry = createGeometry(meshDef);
	const material = createMaterial(faction, materialType);

	const mesh = new StubMesh(geometry, material);
	mesh.scale.copyFrom(meshDef.defaultScale);
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
export function reskinnedMesh(originalMesh: StubMesh, newFaction: Faction): StubMesh {
	const { meshId, materialType } = originalMesh.userData;
	return instantiateMesh(meshId, newFaction, materialType);
}
