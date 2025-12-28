import * as THREE from "three";
import type { MeshDef, MeshId } from "./libraryTypes";

/**
 * Mesh library - ALL reusable geometries
 */
export const MESH_LIBRARY: Record<MeshId, MeshDef> = {
	// Structural
	STILT_ROUND: {
		id: "STILT_ROUND",
		geometryType: "CYLINDER",
		geometryParams: [0.06, 0.06, 1, 8], // radiusTop, radiusBottom, height, segments
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	STILT_SQUARE: {
		id: "STILT_SQUARE",
		geometryType: "BOX",
		geometryParams: [0.12, 1, 0.12],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	FLOOR_PLANK: {
		id: "FLOOR_PLANK",
		geometryType: "BOX",
		geometryParams: [1, 0.04, 0.15],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	FLOOR_SECTION_2X2: {
		id: "FLOOR_SECTION_2X2",
		geometryType: "BOX",
		geometryParams: [2, 0.08, 2],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	WALL_FRAME: {
		id: "WALL_FRAME",
		geometryType: "BOX",
		geometryParams: [2, 1.8, 0.08],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	WALL_BAMBOO_SLATS: {
		id: "WALL_BAMBOO_SLATS",
		geometryType: "BOX",
		geometryParams: [2, 1.8, 0.05],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	WALL_THATCH_PANEL: {
		id: "WALL_THATCH_PANEL",
		geometryType: "BOX",
		geometryParams: [2, 1.8, 0.1],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	ROOF_BEAM: {
		id: "ROOF_BEAM",
		geometryType: "BOX",
		geometryParams: [0.1, 0.1, 3],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	ROOF_THATCH_SECTION: {
		id: "ROOF_THATCH_SECTION",
		geometryType: "BOX",
		geometryParams: [2, 0.15, 2],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	ROOF_TIN_SECTION: {
		id: "ROOF_TIN_SECTION",
		geometryType: "BOX",
		geometryParams: [2, 0.02, 2],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	LADDER_SEGMENT: {
		id: "LADDER_SEGMENT",
		geometryType: "BOX",
		geometryParams: [0.4, 1, 0.08],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	RAILING_SECTION: {
		id: "RAILING_SECTION",
		geometryType: "BOX",
		geometryParams: [2, 0.8, 0.04],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	ROPE_COIL: {
		id: "ROPE_COIL",
		geometryType: "TORUS",
		geometryParams: [0.15, 0.02, 8, 16],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	ROPE_BINDING: {
		id: "ROPE_BINDING",
		geometryType: "CYLINDER",
		geometryParams: [0.08, 0.08, 0.1, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},

	// Weapon Parts
	BARREL_SHORT: {
		id: "BARREL_SHORT",
		geometryType: "CYLINDER",
		geometryParams: [0.015, 0.015, 0.3, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "MUZZLE",
				position: new THREE.Vector3(0, 0, 0.15),
				rotation: new THREE.Euler(0, 0, 0),
			},
		],
	},
	BARREL_LONG: {
		id: "BARREL_LONG",
		geometryType: "CYLINDER",
		geometryParams: [0.012, 0.012, 0.5, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "MUZZLE",
				position: new THREE.Vector3(0, 0, 0.25),
				rotation: new THREE.Euler(0, 0, 0),
			},
		],
	},
	BARREL_DOUBLE: {
		id: "BARREL_DOUBLE",
		geometryType: "CYLINDER",
		geometryParams: [0.025, 0.025, 0.4, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "MUZZLE",
				position: new THREE.Vector3(0, 0, 0.2),
				rotation: new THREE.Euler(0, 0, 0),
			},
		],
	},
	RECEIVER_PISTOL: {
		id: "RECEIVER_PISTOL",
		geometryType: "BOX",
		geometryParams: [0.03, 0.08, 0.12],
		defaultScale: new THREE.Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "BARREL",
				position: new THREE.Vector3(0, 0.02, 0.06),
				rotation: new THREE.Euler(Math.PI / 2, 0, 0),
			},
			{
				name: "MAGAZINE",
				position: new THREE.Vector3(0, -0.04, 0),
				rotation: new THREE.Euler(0, 0, 0),
			},
			{
				name: "GRIP",
				position: new THREE.Vector3(0, -0.04, -0.02),
				rotation: new THREE.Euler(0, 0, 0),
			},
		],
	},
	RECEIVER_RIFLE: {
		id: "RECEIVER_RIFLE",
		geometryType: "BOX",
		geometryParams: [0.04, 0.06, 0.2],
		defaultScale: new THREE.Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "BARREL",
				position: new THREE.Vector3(0, 0.01, 0.1),
				rotation: new THREE.Euler(Math.PI / 2, 0, 0),
			},
			{
				name: "MAGAZINE",
				position: new THREE.Vector3(0, -0.03, 0.02),
				rotation: new THREE.Euler(0, 0, 0),
			},
			{
				name: "STOCK",
				position: new THREE.Vector3(0, 0, -0.1),
				rotation: new THREE.Euler(0, 0, 0),
			},
			{
				name: "OPTIC",
				position: new THREE.Vector3(0, 0.03, 0),
				rotation: new THREE.Euler(0, 0, 0),
			},
			{
				name: "GRIP",
				position: new THREE.Vector3(0, -0.03, -0.05),
				rotation: new THREE.Euler(0, 0, 0),
			},
		],
	},
	RECEIVER_SHOTGUN: {
		id: "RECEIVER_SHOTGUN",
		geometryType: "BOX",
		geometryParams: [0.05, 0.07, 0.18],
		defaultScale: new THREE.Vector3(1, 1, 1),
		attachmentPoints: [
			{
				name: "BARREL",
				position: new THREE.Vector3(0, 0.02, 0.09),
				rotation: new THREE.Euler(Math.PI / 2, 0, 0),
			},
			{
				name: "STOCK",
				position: new THREE.Vector3(0, 0, -0.09),
				rotation: new THREE.Euler(0, 0, 0),
			},
			{
				name: "GRIP",
				position: new THREE.Vector3(0, -0.035, -0.03),
				rotation: new THREE.Euler(0, 0, 0),
			},
		],
	},
	STOCK_WOOD: {
		id: "STOCK_WOOD",
		geometryType: "BOX",
		geometryParams: [0.03, 0.12, 0.2],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	STOCK_TACTICAL: {
		id: "STOCK_TACTICAL",
		geometryType: "BOX",
		geometryParams: [0.025, 0.08, 0.18],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	GRIP_PISTOL: {
		id: "GRIP_PISTOL",
		geometryType: "BOX",
		geometryParams: [0.025, 0.08, 0.03],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	GRIP_VERTICAL: {
		id: "GRIP_VERTICAL",
		geometryType: "CYLINDER",
		geometryParams: [0.015, 0.015, 0.06, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	MAGAZINE_BOX: {
		id: "MAGAZINE_BOX",
		geometryType: "BOX",
		geometryParams: [0.02, 0.08, 0.025],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	MAGAZINE_DRUM: {
		id: "MAGAZINE_DRUM",
		geometryType: "CYLINDER",
		geometryParams: [0.04, 0.04, 0.03, 12],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	SCOPE_IRON: {
		id: "SCOPE_IRON",
		geometryType: "BOX",
		geometryParams: [0.01, 0.02, 0.04],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	SCOPE_RED_DOT: {
		id: "SCOPE_RED_DOT",
		geometryType: "CYLINDER",
		geometryParams: [0.015, 0.015, 0.04, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},

	// Character Parts
	TORSO_OTTER: {
		id: "TORSO_OTTER",
		geometryType: "CAPSULE",
		geometryParams: [0.12, 0.25, 4, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	TORSO_GATOR: {
		id: "TORSO_GATOR",
		geometryType: "BOX",
		geometryParams: [0.4, 0.25, 0.8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	TORSO_SNAKE: {
		id: "TORSO_SNAKE",
		geometryType: "CYLINDER",
		geometryParams: [0.08, 0.06, 0.4, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	HEAD_OTTER: {
		id: "HEAD_OTTER",
		geometryType: "SPHERE",
		geometryParams: [0.1, 12, 8],
		defaultScale: new THREE.Vector3(1, 0.9, 1.1),
	},
	HEAD_GATOR: {
		id: "HEAD_GATOR",
		geometryType: "BOX",
		geometryParams: [0.2, 0.12, 0.35],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	HEAD_SNAKE: {
		id: "HEAD_SNAKE",
		geometryType: "SPHERE",
		geometryParams: [0.06, 8, 6],
		defaultScale: new THREE.Vector3(1, 0.8, 1.3),
	},
	ARM_SEGMENT: {
		id: "ARM_SEGMENT",
		geometryType: "CAPSULE",
		geometryParams: [0.03, 0.1, 4, 6],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	LEG_SEGMENT: {
		id: "LEG_SEGMENT",
		geometryType: "CAPSULE",
		geometryParams: [0.04, 0.12, 4, 6],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	HAND_PAW: {
		id: "HAND_PAW",
		geometryType: "SPHERE",
		geometryParams: [0.035, 8, 6],
		defaultScale: new THREE.Vector3(1.2, 0.8, 1),
	},
	FOOT_PAW: {
		id: "FOOT_PAW",
		geometryType: "BOX",
		geometryParams: [0.05, 0.02, 0.08],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	TAIL_OTTER: {
		id: "TAIL_OTTER",
		geometryType: "CAPSULE",
		geometryParams: [0.04, 0.2, 4, 6],
		defaultScale: new THREE.Vector3(1, 0.6, 1),
	},
	TAIL_GATOR: {
		id: "TAIL_GATOR",
		geometryType: "BOX",
		geometryParams: [0.15, 0.1, 0.6],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},

	// Equipment
	VEST_TACTICAL: {
		id: "VEST_TACTICAL",
		geometryType: "BOX",
		geometryParams: [0.28, 0.22, 0.14],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	VEST_LIGHT: {
		id: "VEST_LIGHT",
		geometryType: "BOX",
		geometryParams: [0.26, 0.2, 0.1],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	HELMET_STANDARD: {
		id: "HELMET_STANDARD",
		geometryType: "SPHERE",
		geometryParams: [0.11, 12, 8],
		defaultScale: new THREE.Vector3(1, 0.7, 1),
	},
	HELMET_BANDANA: {
		id: "HELMET_BANDANA",
		geometryType: "TORUS",
		geometryParams: [0.1, 0.02, 8, 16],
		defaultScale: new THREE.Vector3(1, 0.3, 1),
	},
	BACKPACK_RADIO: {
		id: "BACKPACK_RADIO",
		geometryType: "BOX",
		geometryParams: [0.12, 0.18, 0.08],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	BACKPACK_MEDIC: {
		id: "BACKPACK_MEDIC",
		geometryType: "BOX",
		geometryParams: [0.14, 0.16, 0.1],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
	BACKPACK_SCUBA: {
		id: "BACKPACK_SCUBA",
		geometryType: "CYLINDER",
		geometryParams: [0.06, 0.06, 0.2, 8],
		defaultScale: new THREE.Vector3(1, 1, 1),
	},
};
