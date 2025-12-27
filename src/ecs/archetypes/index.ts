/**
 * Entity Archetypes - Factory Functions
 *
 * These factories create entities with the correct component combinations.
 * Each archetype represents a "template" for a type of game object.
 */

import * as THREE from "three";
import { Vehicle } from "yuka";
import type { Entity } from "../world";
import { generateId, world } from "../world";

// =============================================================================
// PLAYER ARCHETYPE
// =============================================================================

export interface CreatePlayerOptions {
	position: THREE.Vector3;
	characterId: string;
	name: string;
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
	baseSpeed: number;
	baseHealth: number;
	climbSpeed: number;
	headgear: "bandana" | "beret" | "helmet" | "none";
	vest: "tactical" | "heavy" | "none";
	backgear: "radio" | "scuba" | "none";
	weaponId: string;
}

export const createPlayer = (options: CreatePlayerOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: options.baseSpeed,
		},

		collider: {
			radius: 0.5,
			height: 1.8,
			offset: new THREE.Vector3(0, 0.9, 0),
			layer: "player",
		},

		health: {
			current: options.baseHealth,
			max: options.baseHealth,
			regenRate: 0,
			lastDamageTime: 0,
			isInvulnerable: false,
		},

		characterStats: {
			id: options.characterId,
			name: options.name,
			baseSpeed: options.baseSpeed,
			baseHealth: options.baseHealth,
			climbSpeed: options.climbSpeed,
		},

		characterAppearance: {
			furColor: options.furColor,
			eyeColor: options.eyeColor,
			whiskerLength: options.whiskerLength,
			grizzled: options.grizzled,
		},

		characterGear: {
			headgear: options.headgear,
			vest: options.vest,
			backgear: options.backgear,
			weaponId: options.weaponId,
		},

		weapon: {
			id: options.weaponId,
			damage: 2,
			fireRate: 0.4,
			bulletSpeed: 60,
			recoil: 0.02,
			range: 30,
			ammo: 30,
			maxAmmo: 30,
			lastFireTime: 0,
			isFiring: false,
		},

		renderable: {
			type: "player_otter",
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

		isPlayer: { __tag: "IsPlayer" },
	});

	return entity;
};

// =============================================================================
// ENEMY ARCHETYPES
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
			amount: 0,
			decayRate: 0.1,
			threshold: 0.5,
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

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: 0, // Snakes don't move, they strike
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
			amount: 0,
			decayRate: 0.2,
			threshold: 0.3,
		},

		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			lastKnownPlayerPos: null,
			homePosition: options.position.clone(),
			patrolRadius: 0,
		},

		enemy: {
			type: "snake",
			tier: "light",
			xpValue: 15,
			lootTable: ["credit"],
		},

		snake: {
			segmentCount: 12,
			strikeRange: 8,
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
			receiveShadow: false,
		},

		animated: {
			currentAnimation: "sway",
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

export interface CreateSnapperOptions {
	position: THREE.Vector3;
	chunkId?: string;
}

export const createSnapper = (options: CreateSnapperOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: 0, // Snappers are stationary bunkers
		},

		collider: {
			radius: 1.5,
			height: 1,
			offset: new THREE.Vector3(0, 0.5, 0),
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
			amount: 0,
			decayRate: 0.05,
			threshold: 0.7,
		},

		aiBrain: {
			currentState: "idle",
			previousState: "idle",
			stateTime: 0,
			alertLevel: 0,
			lastKnownPlayerPos: null,
			homePosition: options.position.clone(),
			patrolRadius: 0,
		},

		enemy: {
			type: "snapper",
			tier: "heavy",
			xpValue: 75,
			lootTable: ["clam", "credit", "upgrade"],
		},

		snapper: {
			turretRotation: 0,
			turretTargetRotation: 0,
			isOverheated: false,
			heatLevel: 0,
		},

		weapon: {
			id: "snapper-turret",
			damage: 5,
			fireRate: 0.2,
			bulletSpeed: 50,
			recoil: 0,
			range: 25,
			ammo: 999,
			maxAmmo: 999,
			lastFireTime: 0,
			isFiring: false,
		},

		renderable: {
			type: "snapper",
			visible: true,
			castShadow: true,
			receiveShadow: true,
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
			scale: new THREE.Vector3(1, 1, 1),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: 10,
		},

		collider: {
			radius: 0.4,
			height: 0.6,
			offset: new THREE.Vector3(0, 0.3, 0),
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
			amount: 0,
			decayRate: 0.3,
			threshold: 0.2,
		},

		aiBrain: {
			currentState: "patrol",
			previousState: "patrol",
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
			separationWeight: 1.5,
			cohesionWeight: 0,
			alignmentWeight: 0,
		},

		packMember: options.packId
			? {
					packId: options.packId,
					role: "scout",
					signalRange: 50,
					lastSignalTime: 0,
				}
			: undefined,

		enemy: {
			type: "scout",
			tier: "light",
			xpValue: 10,
			lootTable: ["credit"],
		},

		scout: {
			hasSpottedPlayer: false,
			signalCooldown: 0,
			isSignaling: false,
			fleeDistance: 12,
		},

		renderable: {
			type: "scout",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		animated: {
			currentAnimation: "run",
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
// PROJECTILE ARCHETYPE
// =============================================================================

export interface CreateProjectileOptions {
	position: THREE.Vector3;
	direction: THREE.Vector3;
	speed: number;
	damage: number;
	damageType: "kinetic" | "explosive" | "fire" | "toxic";
	sourceId: string;
	range: number;
}

export const createProjectile = (options: CreateProjectileOptions): Entity => {
	const velocity = options.direction.clone().normalize().multiplyScalar(options.speed);

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, Math.atan2(velocity.x, velocity.z), 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		velocity: {
			linear: velocity,
			angular: new THREE.Vector3(),
			maxSpeed: options.speed,
		},

		collider: {
			radius: 0.1,
			height: 0.1,
			offset: new THREE.Vector3(),
			layer: "projectile",
		},

		damage: {
			amount: options.damage,
			type: options.damageType,
			knockback: 0.5,
			source: options.sourceId,
		},

		lifetime: {
			remaining: options.range / options.speed,
			onExpire: "destroy",
		},

		renderable: {
			type: "projectile",
			visible: true,
			castShadow: false,
			receiveShadow: false,
		},

		isProjectile: { __tag: "IsProjectile" },
	});

	return entity;
};

// =============================================================================
// OBJECTIVE ARCHETYPES
// =============================================================================

export interface CreateSiphonOptions {
	position: THREE.Vector3;
	chunkId?: string;
}

export const createSiphon = (options: CreateSiphonOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		collider: {
			radius: 2,
			height: 4,
			offset: new THREE.Vector3(0, 2, 0),
			layer: "environment",
		},

		destructible: {
			hp: 50,
			maxHp: 50,
			isDestroyed: false,
			debrisType: "metal",
		},

		objective: {
			type: "siphon",
			isCompleted: false,
			isActive: true,
			progressRequired: 50,
			currentProgress: 0,
		},

		renderable: {
			type: "siphon",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		particleEmitter: {
			type: "smoke",
			rate: 5,
			lifetime: 2,
			isEmitting: true,
		},

		isObjective: { __tag: "IsObjective" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

export interface CreatePrisonCageOptions {
	position: THREE.Vector3;
	characterId: string;
	chunkId?: string;
}

export const createPrisonCage = (options: CreatePrisonCageOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		collider: {
			radius: 1.5,
			height: 3,
			offset: new THREE.Vector3(0, 1.5, 0),
			layer: "environment",
		},

		objective: {
			type: "prison_cage",
			isCompleted: false,
			isActive: true,
			progressRequired: 1,
			currentProgress: 0,
		},

		rescuable: {
			characterId: options.characterId,
			isRescued: false,
			dialogueId: `rescue_${options.characterId}`,
		},

		interactable: {
			type: "rescue",
			range: 3,
			promptText: "RESCUE",
			isInteracting: false,
			cooldown: 0,
		},

		renderable: {
			type: "prison_cage",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		isObjective: { __tag: "IsObjective" },
		isInteractable: { __tag: "IsInteractable" },

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
// ENVIRONMENT ARCHETYPES
// =============================================================================

export interface CreateOilSlickOptions {
	position: THREE.Vector3;
	size?: number;
	chunkId?: string;
}

export const createOilSlick = (options: CreateOilSlickOptions): Entity => {
	const size = options.size ?? 3;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(size, 1, size),
		},

		collider: {
			radius: size,
			height: 0.1,
			offset: new THREE.Vector3(),
			layer: "trigger",
		},

		hazard: {
			type: "oil_slick",
			damagePerSecond: 0,
			slowFactor: 0.7,
			isActive: true,
		},

		oilSlick: {
			isIgnited: false,
			burnTime: 0,
			burnDuration: 15,
			size,
		},

		renderable: {
			type: "oil_slick",
			visible: true,
			castShadow: false,
			receiveShadow: true,
		},

		isEnvironment: { __tag: "IsEnvironment" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

export interface CreateMudPitOptions {
	position: THREE.Vector3;
	size?: number;
	chunkId?: string;
}

export const createMudPit = (options: CreateMudPitOptions): Entity => {
	const size = options.size ?? 4;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(size, 1, size),
		},

		collider: {
			radius: size,
			height: 0.3,
			offset: new THREE.Vector3(),
			layer: "trigger",
		},

		hazard: {
			type: "mud_pit",
			damagePerSecond: 0,
			slowFactor: 0.4,
			isActive: true,
		},

		renderable: {
			type: "mud_pit",
			visible: true,
			castShadow: false,
			receiveShadow: true,
		},

		isEnvironment: { __tag: "IsEnvironment" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

export interface CreateToxicSludgeOptions {
	position: THREE.Vector3;
	size?: number;
	chunkId?: string;
}

export const createToxicSludge = (options: CreateToxicSludgeOptions): Entity => {
	const size = options.size ?? 3;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(size, 1, size),
		},

		collider: {
			radius: size,
			height: 0.2,
			offset: new THREE.Vector3(),
			layer: "trigger",
		},

		hazard: {
			type: "toxic_sludge",
			damagePerSecond: 5,
			slowFactor: 0.6,
			isActive: true,
		},

		renderable: {
			type: "toxic_sludge",
			visible: true,
			castShadow: false,
			receiveShadow: true,
		},

		particleEmitter: {
			type: "smoke",
			rate: 2,
			lifetime: 1.5,
			isEmitting: true,
		},

		isEnvironment: { __tag: "IsEnvironment" },

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
// INTERACTION ARCHETYPES
// =============================================================================

export interface CreateVillagerOptions {
	position: THREE.Vector3;
	type: "civilian" | "healer" | "merchant";
	chunkId?: string;
}

export const createVillager = (options: CreateVillagerOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		collider: {
			radius: 0.5,
			height: 1.5,
			offset: new THREE.Vector3(0, 0.75, 0),
			layer: "environment",
		},

		villager: {
			type: options.type,
			dialogueId: `villager_${options.type}`,
			isLiberated: false,
			healAmount: options.type === "healer" ? 50 : undefined,
		},

		interactable: {
			type: "talk",
			range: 2,
			promptText: options.type === "healer" ? "HEAL" : "TALK",
			isInteracting: false,
			cooldown: 0,
		},

		renderable: {
			type: options.type === "healer" ? "healer" : "villager",
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

		isInteractable: { __tag: "IsInteractable" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

export interface CreateExtractionPointOptions {
	position: THREE.Vector3;
	chunkId?: string;
}

export const createExtractionPoint = (options: CreateExtractionPointOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		collider: {
			radius: 5,
			height: 0.5,
			offset: new THREE.Vector3(),
			layer: "trigger",
		},

		objective: {
			type: "extraction_point",
			isCompleted: false,
			isActive: true,
			progressRequired: 1,
			currentProgress: 0,
		},

		interactable: {
			type: "use",
			range: 5,
			promptText: "EXTRACT",
			isInteracting: false,
			cooldown: 0,
		},

		renderable: {
			type: "extraction_point",
			visible: true,
			castShadow: false,
			receiveShadow: true,
		},

		isObjective: { __tag: "IsObjective" },
		isInteractable: { __tag: "IsInteractable" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

export interface CreateRaftOptions {
	position: THREE.Vector3;
	chunkId?: string;
}

export const createRaft = (options: CreateRaftOptions): Entity => {
	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		velocity: {
			linear: new THREE.Vector3(),
			angular: new THREE.Vector3(),
			maxSpeed: 15,
		},

		collider: {
			radius: 1.5,
			height: 0.5,
			offset: new THREE.Vector3(),
			layer: "environment",
		},

		vehicle: {
			type: "raft",
			maxSpeed: 15,
			acceleration: 8,
			turnRate: 2,
			isPiloted: false,
			pilotId: null,
		},

		interactable: {
			type: "mount",
			range: 2,
			promptText: "BOARD RAFT",
			isInteracting: false,
			cooldown: 0,
		},

		renderable: {
			type: "raft",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		isInteractable: { __tag: "IsInteractable" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};

export interface CreatePlatformOptions {
	position: THREE.Vector3;
	width?: number;
	depth?: number;
	chunkId?: string;
}

export const createPlatform = (options: CreatePlatformOptions): Entity => {
	const width = options.width ?? 5;
	const depth = options.depth ?? 5;

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(1, 1, 1),
		},

		collider: {
			radius: Math.max(width, depth) / 2,
			height: 0.5,
			offset: new THREE.Vector3(),
			layer: "environment",
		},

		platform: {
			width,
			depth,
			isMoving: false,
			moveSpeed: 0,
			waypoints: [],
		},

		renderable: {
			type: "platform",
			visible: true,
			castShadow: true,
			receiveShadow: true,
		},

		isEnvironment: { __tag: "IsEnvironment" },

		chunkReference: options.chunkId
			? {
					chunkId: options.chunkId,
					localPosition: options.position.clone(),
				}
			: undefined,
	});

	return entity;
};
