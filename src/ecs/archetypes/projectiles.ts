/**
 * Projectile Archetype - Factory for Projectile Entities
 */

import { Quaternion, Vector3 } from "@babylonjs/core";
import type { Entity } from "../world";
import { generateId, world } from "../world";

export interface CreateProjectileOptions {
	position: Vector3;
	direction: Vector3;
	speed: number;
	damage: number;
	damageType: "kinetic" | "explosive" | "fire" | "toxic";
	sourceId: string;
	range: number;
}

export const createProjectile = (options: CreateProjectileOptions): Entity => {
	// normalize() mutates in place and returns this; scale() returns a new Vector3
	const velocity = options.direction.clone().normalize().scale(options.speed);

	const entity = world.add({
		id: generateId(),

		transform: {
			position: options.position.clone(),
			rotation: Quaternion.RotationAxis(Vector3.Up(), Math.atan2(velocity.x, velocity.z)),
			scale: new Vector3(1, 1, 1),
		},

		velocity: {
			linear: velocity,
			angular: new Vector3(),
			maxSpeed: options.speed,
		},

		collider: {
			radius: 0.1,
			height: 0.1,
			offset: new Vector3(),
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
