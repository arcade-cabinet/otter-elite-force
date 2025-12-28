import * as THREE from "three";

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
	localPosition: THREE.Vector3;
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
		localPosition: new THREE.Vector3(0, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI, max: Math.PI },
			y: { min: -Math.PI, max: Math.PI },
			z: { min: -Math.PI, max: Math.PI },
		},
	},
	{
		name: "PELVIS",
		parent: "ROOT",
		localPosition: new THREE.Vector3(0, 0.4, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.5, max: 0.5 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "SPINE_LOWER",
		parent: "PELVIS",
		localPosition: new THREE.Vector3(0, 0.15, 0),
		rotationLimits: {
			x: { min: -0.4, max: 0.4 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "SPINE_UPPER",
		parent: "SPINE_LOWER",
		localPosition: new THREE.Vector3(0, 0.2, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.5 },
			y: { min: -0.4, max: 0.4 },
			z: { min: -0.3, max: 0.3 },
		},
	},
	{
		name: "NECK",
		parent: "SPINE_UPPER",
		localPosition: new THREE.Vector3(0, 0.15, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.5 },
			y: { min: -0.8, max: 0.8 },
			z: { min: -0.3, max: 0.3 },
		},
	},
	{
		name: "HEAD",
		parent: "NECK",
		localPosition: new THREE.Vector3(0, 0.12, 0.02),
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
		localPosition: new THREE.Vector3(-0.12, 0.1, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.5 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.5, max: 0.2 },
		},
	},
	{
		name: "UPPER_ARM_L",
		parent: "SHOULDER_L",
		localPosition: new THREE.Vector3(-0.08, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI, max: Math.PI },
			y: { min: -0.3, max: Math.PI },
			z: { min: -Math.PI / 2, max: Math.PI / 2 },
		},
	},
	{
		name: "ELBOW_L",
		parent: "UPPER_ARM_L",
		localPosition: new THREE.Vector3(-0.12, 0, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 2.5 }, z: { min: 0, max: 0 } }, // Elbow only bends one way
	},
	{
		name: "FOREARM_L",
		parent: "ELBOW_L",
		localPosition: new THREE.Vector3(-0.05, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI / 2, max: Math.PI / 2 },
			y: { min: 0, max: 0 },
			z: { min: 0, max: 0 },
		},
	},
	{
		name: "WRIST_L",
		parent: "FOREARM_L",
		localPosition: new THREE.Vector3(-0.1, 0, 0),
		rotationLimits: {
			x: { min: -0.8, max: 0.8 },
			y: { min: -0.5, max: 0.5 },
			z: { min: -0.4, max: 0.4 },
		},
	},
	{
		name: "HAND_L",
		parent: "WRIST_L",
		localPosition: new THREE.Vector3(-0.05, 0, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.2, max: 0.2 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "GRIP_L",
		parent: "HAND_L",
		localPosition: new THREE.Vector3(-0.03, 0, 0.02),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } }, // Grip point doesn't rotate independently
	},

	// Right Arm (mirrored)
	{
		name: "SHOULDER_R",
		parent: "SPINE_UPPER",
		localPosition: new THREE.Vector3(0.12, 0.1, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.5 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.5 },
		},
	},
	{
		name: "UPPER_ARM_R",
		parent: "SHOULDER_R",
		localPosition: new THREE.Vector3(0.08, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI, max: Math.PI },
			y: { min: -Math.PI, max: 0.3 },
			z: { min: -Math.PI / 2, max: Math.PI / 2 },
		},
	},
	{
		name: "ELBOW_R",
		parent: "UPPER_ARM_R",
		localPosition: new THREE.Vector3(0.12, 0, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: -2.5, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "FOREARM_R",
		parent: "ELBOW_R",
		localPosition: new THREE.Vector3(0.05, 0, 0),
		rotationLimits: {
			x: { min: -Math.PI / 2, max: Math.PI / 2 },
			y: { min: 0, max: 0 },
			z: { min: 0, max: 0 },
		},
	},
	{
		name: "WRIST_R",
		parent: "FOREARM_R",
		localPosition: new THREE.Vector3(0.1, 0, 0),
		rotationLimits: {
			x: { min: -0.8, max: 0.8 },
			y: { min: -0.5, max: 0.5 },
			z: { min: -0.4, max: 0.4 },
		},
	},
	{
		name: "HAND_R",
		parent: "WRIST_R",
		localPosition: new THREE.Vector3(0.05, 0, 0),
		rotationLimits: {
			x: { min: -0.3, max: 0.3 },
			y: { min: -0.2, max: 0.2 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "GRIP_R",
		parent: "HAND_R",
		localPosition: new THREE.Vector3(0.03, 0, 0.02),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},

	// Left Leg
	{
		name: "HIP_L",
		parent: "PELVIS",
		localPosition: new THREE.Vector3(-0.06, -0.05, 0),
		rotationLimits: {
			x: { min: -0.2, max: 0.2 },
			y: { min: -0.1, max: 0.1 },
			z: { min: -0.1, max: 0.3 },
		},
	},
	{
		name: "UPPER_LEG_L",
		parent: "HIP_L",
		localPosition: new THREE.Vector3(0, -0.02, 0),
		rotationLimits: {
			x: { min: -1.8, max: 0.5 },
			y: { min: -0.3, max: 0.5 },
			z: { min: -0.2, max: 0.5 },
		},
	},
	{
		name: "KNEE_L",
		parent: "UPPER_LEG_L",
		localPosition: new THREE.Vector3(0, -0.15, 0),
		rotationLimits: { x: { min: 0, max: 2.5 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } }, // Knee only bends one way
	},
	{
		name: "LOWER_LEG_L",
		parent: "KNEE_L",
		localPosition: new THREE.Vector3(0, -0.05, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "ANKLE_L",
		parent: "LOWER_LEG_L",
		localPosition: new THREE.Vector3(0, -0.12, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.8 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "FOOT_L",
		parent: "ANKLE_L",
		localPosition: new THREE.Vector3(0, -0.03, 0.04),
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
		localPosition: new THREE.Vector3(0.06, -0.05, 0),
		rotationLimits: {
			x: { min: -0.2, max: 0.2 },
			y: { min: -0.1, max: 0.1 },
			z: { min: -0.3, max: 0.1 },
		},
	},
	{
		name: "UPPER_LEG_R",
		parent: "HIP_R",
		localPosition: new THREE.Vector3(0, -0.02, 0),
		rotationLimits: {
			x: { min: -1.8, max: 0.5 },
			y: { min: -0.5, max: 0.3 },
			z: { min: -0.5, max: 0.2 },
		},
	},
	{
		name: "KNEE_R",
		parent: "UPPER_LEG_R",
		localPosition: new THREE.Vector3(0, -0.15, 0),
		rotationLimits: { x: { min: 0, max: 2.5 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "LOWER_LEG_R",
		parent: "KNEE_R",
		localPosition: new THREE.Vector3(0, -0.05, 0),
		rotationLimits: { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } },
	},
	{
		name: "ANKLE_R",
		parent: "LOWER_LEG_R",
		localPosition: new THREE.Vector3(0, -0.12, 0),
		rotationLimits: {
			x: { min: -0.5, max: 0.8 },
			y: { min: -0.3, max: 0.3 },
			z: { min: -0.2, max: 0.2 },
		},
	},
	{
		name: "FOOT_R",
		parent: "ANKLE_R",
		localPosition: new THREE.Vector3(0, -0.03, 0.04),
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
		localPosition: new THREE.Vector3(0, 0, -0.08),
		rotationLimits: {
			x: { min: -0.5, max: 0.8 },
			y: { min: -0.6, max: 0.6 },
			z: { min: -0.3, max: 0.3 },
		},
	},
	{
		name: "TAIL_MID",
		parent: "TAIL_BASE",
		localPosition: new THREE.Vector3(0, 0, -0.12),
		rotationLimits: {
			x: { min: -0.6, max: 0.6 },
			y: { min: -0.8, max: 0.8 },
			z: { min: -0.4, max: 0.4 },
		},
	},
	{
		name: "TAIL_TIP",
		parent: "TAIL_MID",
		localPosition: new THREE.Vector3(0, 0, -0.1),
		rotationLimits: {
			x: { min: -0.8, max: 0.8 },
			y: { min: -1, max: 1 },
			z: { min: -0.5, max: 0.5 },
		},
	},
];
