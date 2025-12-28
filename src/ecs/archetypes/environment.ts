/**
 * Environment Archetypes - Factory Functions for Environmental Hazards
 */

import * as THREE from "three";
import type { Entity } from "../world";
import { generateId, world } from "../world";

// =============================================================================
// OIL SLICK
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

// =============================================================================
// MUD PIT
// =============================================================================

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

// =============================================================================
// TOXIC SLUDGE
// =============================================================================

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
// PLATFORM
// =============================================================================

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
