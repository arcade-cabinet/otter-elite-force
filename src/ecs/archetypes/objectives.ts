/**
 * Objective Archetypes - Factory Functions for Objective Entities
 */

import * as THREE from "three";
import type { Entity } from "../world";
import { generateId, world } from "../world";

// =============================================================================
// SIPHON (Destructible Objective)
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

// =============================================================================
// PRISON CAGE (Rescue Objective)
// =============================================================================

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
// EXTRACTION POINT
// =============================================================================

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
