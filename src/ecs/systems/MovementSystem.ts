/**
 * Movement System
 *
 * Updates entity positions based on velocity.
 * Handles physics integration for all movable entities.
 */

import { movables, steeringEntities } from "../world";

/**
 * Update all movable entities
 */
export const updateMovement = (delta: number): void => {
	// Update basic velocity-based movement
	for (const entity of movables) {
		if (!entity.transform || !entity.velocity) continue;

		// Apply velocity to position
		entity.transform.position.x += entity.velocity.linear.x * delta;
		entity.transform.position.y += entity.velocity.linear.y * delta;
		entity.transform.position.z += entity.velocity.linear.z * delta;

		// Apply angular velocity to rotation
		entity.transform.rotation.x += entity.velocity.angular.x * delta;
		entity.transform.rotation.y += entity.velocity.angular.y * delta;
		entity.transform.rotation.z += entity.velocity.angular.z * delta;

		// Clamp speed to max
		const speed = entity.velocity.linear.length();
		if (speed > entity.velocity.maxSpeed) {
			entity.velocity.linear.normalize().scaleInPlace(entity.velocity.maxSpeed);
		}
	}
};

/**
 * Update entities with Yuka steering behaviors
 */
export const updateSteering = (delta: number): void => {
	for (const entity of steeringEntities) {
		if (!entity.steeringAgent || !entity.transform || !entity.velocity) continue;

		const { vehicle, targetPosition } = entity.steeringAgent;

		// Update target position on the vehicle if available
		if (targetPosition) {
			// Yuka vehicles track targets through their behaviors
			// The behavior's target is set when the behavior is created
			vehicle.position.set(
				entity.transform.position.x,
				entity.transform.position.y,
				entity.transform.position.z,
			);
		}

		// Apply suppression to max speed
		const suppressionFactor = entity.suppression ? 1 - entity.suppression.amount * 0.8 : 1;
		vehicle.maxSpeed = entity.velocity.maxSpeed * suppressionFactor;

		// Update Yuka vehicle
		vehicle.update(delta);

		// Sync position from Yuka to transform
		entity.transform.position.set(vehicle.position.x, vehicle.position.y, vehicle.position.z);

		// Update velocity from Yuka
		entity.velocity.linear.set(vehicle.velocity.x, vehicle.velocity.y, vehicle.velocity.z);

		// Face movement direction
		if (vehicle.velocity.length() > 0.1) {
			const angle = Math.atan2(vehicle.velocity.x, vehicle.velocity.z);
			entity.transform.rotation.y = angle;
		}
	}
};

/**
 * Apply friction/drag to entities
 */
export const applyFriction = (delta: number, frictionCoeff: number = 0.95): void => {
	for (const entity of movables) {
		if (!entity.velocity) continue;
		if (entity.isProjectile) continue; // Projectiles don't have friction

		// Apply friction
		entity.velocity.linear.scaleInPlace(frictionCoeff ** (delta * 60));
	}
};
