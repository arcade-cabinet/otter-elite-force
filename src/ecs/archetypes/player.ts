/**
 * Player Archetype - Factory for Player Entity
 */

import * as THREE from "three";
import type { Entity } from "../world";
import { generateId, world } from "../world";

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
