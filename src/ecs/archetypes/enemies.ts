/**
 * Enemy Archetypes - Factory Functions for Enemy Entities
 */

import * as THREE from "three";
import { Vehicle } from "yuka";
import type { Entity } from "../world";
import { generateId, world } from "../world";

// =============================================================================
// GATOR
// =============================================================================

export interface CreateGatorOptions {
	position: THREE.Vector3;
	isHeavy: boolean;
	chunkId?: string;
}

export const createGator = (options: CreateGatorOptions): Entity => {
	const tier = options.isHeavy ? "heavy" : "light";
	const hp = options.isHeavy ? 20 : 10;
	const speed = options.isHeavy ? 4 : 7;

	const vehicle = new Vehicle();
	vehicle.position.set(options.position.x, options.position.y, options.position.z);
	vehicle.maxSpeed = speed;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(
				options.isHeavy ? 1.6 : 1.1,
				options.isHeavy ? 1.6 : 1.1,
				options.isHeavy ? 1.6 : 1.1,
			),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: speed,
		},

		collider: {
			radius: options.isHeavy ? 1.2 : 0.8,
			height: 0.5,
			offset: new THREE.Vector3(0, 0.25, 0),
			layer: "enemy",
		},

		health: {
			current: hp,
			max: hp,
			regenRate: 0,
			lastDamageTime: 0,
			isInvulnerable: false,
		},

		suppression: {
			amount: 0, // 0-100 scale
			decayRate: 10, // Decay 10 points per second
			lastIncrementTime: 0,
		},

		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			lastKnownPlayerPos: null,
			homePosition: options.position.clone(),
			patrolRadius: 20,
		},

		steeringAgent: {
			vehicle,
			targetPosition: null,
			avoidanceRadius: 3,
			separationWeight: 1,
			cohesionWeight: 0.5,
			alignmentWeight: 0.3,
		},

		enemy: {
			type: "gator",
			tier,
			xpValue: options.isHeavy ? 50 : 20,
			lootTable: ["clam", "credit"],
		},

		gator: {
			isSubmerged: true,
			ambushCooldown: 0,
			ambushDuration: 3,
		},

		renderable: {
			type: "gator",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		animated: {
			currentAnimation: "swim",
			animationSpeed: 1,
			isPlaying: true,
			loop: true,
		},

		isEnemy: { __tag: "IsEnemy" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

// =============================================================================
// SNAKE
// =============================================================================

export interface CreateSnakeOptions {
	position: THREE.Vector3;
	anchorHeight: number;
	chunkId?: string;
}

export const createSnake = (options: CreateSnakeOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		collider: {
			radius: 0.3,
			height: 2,
			offset: new THREE.Vector3(0, 1, 0),
			layer: "enemy",
		},

		health: {
			current: 5,
			max: 5,
			regenRate: 0,
			lastDamageTime: 0,
			isInvulnerable: false,
		},

		suppression: {
			amount: 0, // 0-100 scale
			decayRate: 10, // Decay 10 points per second
			lastIncrementTime: 0,
		},

		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			lastKnownPlayerPos: null,
			homePosition: options.position.clone(),
			patrolRadius: 5,
		},

		enemy: {
			type: "snake",
			tier: "light",
			xpValue: 15,
			lootTable: ["clam"],
		},

		snake: {
			segmentCount: 8,
			strikeRange: 3,
			strikeCooldown: 0,
			isStriking: false,
			anchorPosition: new THREE.Vector3(
				options.position.x,
				options.anchorHeight,
				options.position.z,
			),
		},

		renderable: {
			type: "snake",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		animated: {
			currentAnimation: "coiled",
			animationSpeed: 1,
			isPlaying: true,
			loop: true,
		},

		isEnemy: { __tag: "IsEnemy" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

// =============================================================================
// SNAPPER
// =============================================================================

export interface CreateSnapperOptions {
	position: THREE.Vector3;
	chunkId?: string;
}

export const createSnapper = (options: CreateSnapperOptions): Entity => {
	const vehicle = new Vehicle();
	vehicle.position.set(options.position.x, options.position.y, options.position.z);
	vehicle.maxSpeed = 3;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1.3, 1.3, 1.3),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: 3,
		},

		collider: {
			radius: 1,
			height: 0.6,
			offset: new THREE.Vector3(0, 0.3, 0),
			layer: "enemy",
		},

		health: {
			current: 30,
			max: 30,
			regenRate: 0,
			lastDamageTime: 0,
			isInvulnerable: false,
		},

		suppression: {
			amount: 0, // 0-100 scale
			decayRate: 10, // Decay 10 points per second
			lastIncrementTime: 0,
		},

		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			lastKnownPlayerPos: null,
			homePosition: options.position.clone(),
			patrolRadius: 15,
		},

		steeringAgent: {
			vehicle,
			targetPosition: null,
			avoidanceRadius: 2,
			separationWeight: 0.5,
			cohesionWeight: 0.2,
			alignmentWeight: 0.1,
		},

		enemy: {
			type: "snapper",
			tier: "heavy",
			xpValue: 75,
			lootTable: ["clam", "credit", "upgrade_token"],
		},

		snapper: {
			turretRotation: 0,
			turretTargetRotation: 0,
			isOverheated: false,
			heatLevel: 0,
		},

		renderable: {
			type: "snapper",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		animated: {
			currentAnimation: "idle",
			animationSpeed: 1,
			isPlaying: true,
			loop: true,
		},

		isEnemy: { __tag: "IsEnemy" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

// =============================================================================
// SCOUT
// =============================================================================

export interface CreateScoutOptions {
	position: THREE.Vector3;
	packId?: string;
	chunkId?: string;
}

export const createScout = (options: CreateScoutOptions): Entity => {
	const vehicle = new Vehicle();
	vehicle.position.set(options.position.x, options.position.y, options.position.z);
	vehicle.maxSpeed = 10;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.8, 0.8, 0.8),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: 10,
		},

		collider: {
			radius: 0.4,
			height: 0.4,
			offset: new THREE.Vector3(0, 0.2, 0),
			layer: "enemy",
		},

		health: {
			current: 3,
			max: 3,
			regenRate: 0,
			lastDamageTime: 0,
			isInvulnerable: false,
		},

		suppression: {
			amount: 0, // 0-100 scale
			decayRate: 10, // Decay 10 points per second
			lastIncrementTime: 0,
		},

		aiBrain: {
			currentState: "patrol",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			lastKnownPlayerPos: null,
			homePosition: options.position.clone(),
			patrolRadius: 30,
		},

		steeringAgent: {
			vehicle,
			targetPosition: null,
			avoidanceRadius: 5,
			separationWeight: 2,
			cohesionWeight: 0.1,
			alignmentWeight: 0.1,
		},

		enemy: {
			type: "scout",
			tier: "light",
			xpValue: 10,
			lootTable: ["clam"],
		},

		scout: {
			hasSpottedPlayer: false,
			signalCooldown: 0,
			isSignaling: false,
			fleeDistance: 15,
		},

		packMember: options.packId
			? {
					packId: options.packId,
					role: "scout",
					signalRange: 25,
					lastSignalTime: 0,
				}
			: undefined,

		renderable: {
			type: "scout",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		animated: {
			currentAnimation: "scurry",
			animationSpeed: 1.5,
			isPlaying: true,
			loop: true,
		},

		isEnemy: { __tag: "IsEnemy" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};
