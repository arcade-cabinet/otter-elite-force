/**
 * Interaction Archetypes - Factory Functions for Interactable Entities
 */

import * as THREE from "three";
import type { Entity } from "../world";
import { generateId, world } from "../world";

// =============================================================================
// VILLAGER
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

// =============================================================================
// RAFT (Vehicle)
// =============================================================================

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
