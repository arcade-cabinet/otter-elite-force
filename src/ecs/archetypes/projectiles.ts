/**
 * Projectile Archetype - Factory for Projectile Entities
 */

import * as THREE from "three";
import type { Entity } from "../world";
import { generateId, world } from "../world";

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
