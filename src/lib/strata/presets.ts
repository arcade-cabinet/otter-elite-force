/**
 * Strata Presets Stubs
 * Local implementations matching @strata-game-library/presets API.
 */

import * as YUKA from "yuka";

// ============================================================================
// Predator Preset
// ============================================================================

export interface PredatorPresetConfig {
	pursuitSpeed?: number;
	detectionRadius?: number;
	maxSpeed?: number;
	maxForce?: number;
	mass?: number;
}

export interface PredatorPreset {
	vehicle: YUKA.Vehicle;
	update: (delta: number, context: { preyPosition: YUKA.Vector3 }) => void;
}

export function createPredatorPreset(config: PredatorPresetConfig = {}): PredatorPreset {
	const {
		pursuitSpeed = 5,
		detectionRadius = 20,
		maxSpeed = 5,
	} = config;

	const vehicle = new YUKA.Vehicle();
	vehicle.maxSpeed = maxSpeed;

	// Add seek behavior
	const seekBehavior = new YUKA.SeekBehavior(new YUKA.Vector3());
	vehicle.steering.add(seekBehavior);

	// Add wander behavior for idle state
	const wanderBehavior = new YUKA.WanderBehavior();
	vehicle.steering.add(wanderBehavior);

	let isPursuing = false;
	let seekWeight = 0;
	let wanderWeight = 1;

	return {
		vehicle,
		update: (delta: number, context: { preyPosition: YUKA.Vector3 }) => {
			const distToTarget = vehicle.position.distanceTo(context.preyPosition);

			// Switch between pursue and wander based on detection
			if (distToTarget < detectionRadius) {
				if (!isPursuing) {
					isPursuing = true;
					vehicle.maxSpeed = pursuitSpeed;
					seekWeight = 1;
					wanderWeight = 0;
				}
				// Update seek target
				seekBehavior.target.copy(context.preyPosition);
			} else if (isPursuing && distToTarget > detectionRadius * 1.5) {
				isPursuing = false;
				vehicle.maxSpeed = maxSpeed * 0.5;
				seekWeight = 0;
				wanderWeight = 1;
			}

			// Apply weights by scaling the steering behaviors' effect
			// Note: YUKA doesn't have a weight property on behaviors,
			// so we manually apply by enabling/disabling via steering clear/add
			if (seekWeight > 0) {
				vehicle.steering.clear();
				vehicle.steering.add(seekBehavior);
			} else {
				vehicle.steering.clear();
				vehicle.steering.add(wanderBehavior);
			}

			// Update YUKA vehicle
			vehicle.update(delta);
		},
	};
}
