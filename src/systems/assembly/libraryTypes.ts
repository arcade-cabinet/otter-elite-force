import type { Faction } from "./factionPalettes";

/**
 * Mesh identifiers - each geometry defined ONCE
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
	defaultScale: THREE.Vector3;
	attachmentPoints?: { name: string; position: THREE.Vector3; rotation: THREE.Euler }[];
}

/**
 * Material type for meshes
 */
export type MaterialType = "WOOD" | "METAL" | "FABRIC" | "SKIN" | "PRIMARY" | "SECONDARY";
