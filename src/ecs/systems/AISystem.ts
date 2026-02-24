/**
 * AI System
 *
 * Handles enemy AI state machines, decision making, and pack coordination.
 */

import { Vector3 } from "@babylonjs/core";
import type { AIState } from "../components";
import { type Entity, enemies, packMembers, players } from "../world";

// =============================================================================
// AI STATE MACHINE
// =============================================================================

/**
 * Calculate speed multiplier based on suppression level
 * 50%+ suppression = slower movement
 */
export const getSuppressionSpeedModifier = (suppressionLevel: number): number => {
	if (suppressionLevel >= 50) {
		// At 50% suppression, move at 70% speed
		// At 100% suppression, move at 40% speed
		return Math.max(0.4, 1 - (suppressionLevel / 100) * 0.6);
	}
	return 1.0;
};

/**
 * Transition an entity to a new AI state
 */
export const transitionState = (entity: Entity, newState: AIState): void => {
	if (!entity.aiBrain) return;
	if (entity.aiBrain.currentState === newState) return;

	entity.aiBrain.previousState = entity.aiBrain.currentState;
	entity.aiBrain.currentState = newState;
	entity.aiBrain.stateTime = 0;
};

/**
 * Get the player's current position (first player entity)
 */
const getPlayerPosition = (): Vector3 | null => {
	const player = [...players][0];
	return player?.transform?.position ?? null;
};

/**
 * Update all AI entities
 */
export const updateAI = (delta: number): void => {
	const playerPos = getPlayerPosition();
	if (!playerPos) return;

	// Optimization: Hibernation distance (entities further than this don't process AI)
	const HIBERNATION_DISTANCE = 50;

	for (const entity of enemies) {
		if (!entity.aiBrain || !entity.transform) continue;

		// Calculate distance to player
		const distanceToPlayer = Vector3.Distance(entity.transform.position, playerPos);

		// Hibernation check: Only update AI if close to player
		if (distanceToPlayer > HIBERNATION_DISTANCE) {
			// Optional: Slow update or idle state for distant entities
			continue;
		}

		// Update state time
		entity.aiBrain.stateTime += delta;

		// Update alert level based on distance
		if (distanceToPlayer < 30) {
			entity.aiBrain.alertLevel = Math.min(1, entity.aiBrain.alertLevel + delta * 0.3);
			entity.aiBrain.lastKnownPlayerPos = playerPos.clone();
		} else {
			entity.aiBrain.alertLevel = Math.max(0, entity.aiBrain.alertLevel - delta * 0.1);
		}

		// Run specific AI based on enemy type
		if (entity.gator) {
			updateGatorAI(entity, playerPos, distanceToPlayer, delta);
		} else if (entity.snake) {
			updateSnakeAI(entity, playerPos, distanceToPlayer, delta);
		} else if (entity.snapper) {
			updateSnapperAI(entity, playerPos, distanceToPlayer, delta);
		} else if (entity.scout) {
			updateScoutAI(entity, playerPos, distanceToPlayer, delta);
		}
	}
};

// =============================================================================
// GATOR AI
// =============================================================================

const GATOR_AMBUSH_RANGE = 15;
const GATOR_CHASE_RANGE = 40;
const GATOR_AMBUSH_DURATION = 3;

const updateGatorAI = (
	entity: Entity,
	playerPos: Vector3,
	distance: number,
	delta: number,
): void => {
	if (!entity.aiBrain || !entity.gator || !entity.steeringAgent) return;

	// Update ambush cooldown
	entity.gator.ambushCooldown = Math.max(0, entity.gator.ambushCooldown - delta);

	const state = entity.aiBrain.currentState;

	// Graduated suppression effects (0-100 scale)
	const suppressionLevel = entity.suppression?.amount ?? 0;
	const isFullyPanicked = suppressionLevel >= 100;
	const isForcedCoverSeeking = suppressionLevel >= 75;
	// hasReducedMovement and hasReducedAccuracy handled by caller
	const isSuppressed = isForcedCoverSeeking || isFullyPanicked;

	switch (state) {
		case "idle":
			// Submerge and wait
			entity.gator.isSubmerged = true;
			if (distance < GATOR_CHASE_RANGE && !isSuppressed) {
				transitionState(entity, "chase");
			}
			break;

		case "chase":
			entity.gator.isSubmerged = false;
			entity.steeringAgent.targetPosition = playerPos.clone();

			if (isSuppressed) {
				transitionState(entity, "flee");
			} else if (distance < GATOR_AMBUSH_RANGE && entity.gator.ambushCooldown <= 0) {
				transitionState(entity, "ambush");
				entity.gator.ambushCooldown = 8 + Math.random() * 4;
			} else if (distance > GATOR_CHASE_RANGE * 1.5) {
				transitionState(entity, "idle");
			}
			break;

		case "ambush":
			// Pop up and attack
			entity.gator.isSubmerged = false;
			entity.steeringAgent.targetPosition = null; // Stop moving during ambush

			if (entity.aiBrain.stateTime > GATOR_AMBUSH_DURATION || isSuppressed) {
				transitionState(entity, "chase");
			}
			break;

		case "flee": {
			entity.gator.isSubmerged = true;
			// Flee away from player
			// subtract returns a new Vector3 in Babylon.js
			const fleeDir = entity.transform!.position.subtract(playerPos).normalize();
			entity.steeringAgent.targetPosition = entity
				.transform!.position.add(fleeDir.scale(20));

			if (!isSuppressed && entity.aiBrain.stateTime > 3) {
				transitionState(entity, "idle");
			}
			break;
		}

		default:
			transitionState(entity, "idle");
	}
};

// =============================================================================
// SNAKE AI
// =============================================================================

const SNAKE_STRIKE_RANGE = 8;
const SNAKE_STRIKE_COOLDOWN = 4;

const updateSnakeAI = (
	entity: Entity,
	_playerPos: Vector3,
	distance: number,
	delta: number,
): void => {
	if (!entity.aiBrain || !entity.snake) return;

	// Update strike cooldown
	entity.snake.strikeCooldown = Math.max(0, entity.snake.strikeCooldown - delta);

	const state = entity.aiBrain.currentState;

	// Graduated suppression effects (0-100 scale)
	const suppressionLevel = entity.suppression?.amount ?? 0;
	const isSuppressed = suppressionLevel >= 75; // Force cover seeking at 75%

	switch (state) {
		case "idle":
			entity.snake.isStriking = false;
			if (distance < SNAKE_STRIKE_RANGE && entity.snake.strikeCooldown <= 0 && !isSuppressed) {
				transitionState(entity, "attack");
				entity.snake.strikeCooldown = SNAKE_STRIKE_COOLDOWN;
			}
			break;

		case "attack":
			entity.snake.isStriking = true;

			if (entity.aiBrain.stateTime > 1 || isSuppressed) {
				transitionState(entity, "idle");
			}
			break;

		default:
			transitionState(entity, "idle");
	}
};

// =============================================================================
// SNAPPER AI
// =============================================================================

const SNAPPER_ENGAGE_RANGE = 25;
const SNAPPER_HEAT_PER_SHOT = 0.1;
const SNAPPER_OVERHEAT_THRESHOLD = 1;
const SNAPPER_COOLDOWN_RATE = 0.3;

const updateSnapperAI = (
	entity: Entity,
	playerPos: Vector3,
	distance: number,
	delta: number,
): void => {
	if (!entity.aiBrain || !entity.snapper || !entity.weapon) return;

	const state = entity.aiBrain.currentState;

	// Graduated suppression effects (0-100 scale)
	const suppressionLevel = entity.suppression?.amount ?? 0;
	const isSuppressed = suppressionLevel >= 75; // Force cover seeking at 75%

	// Cool down heat
	entity.snapper.heatLevel = Math.max(0, entity.snapper.heatLevel - SNAPPER_COOLDOWN_RATE * delta);
	if (entity.snapper.heatLevel < 0.5) {
		entity.snapper.isOverheated = false;
	}

	// Calculate target turret rotation (with reduced accuracy if suppressed)
	if (distance < SNAPPER_ENGAGE_RANGE && entity.transform) {
		const lookDir = playerPos.subtract(entity.transform.position);
		let targetRotation = Math.atan2(lookDir.x, lookDir.z);

		// Reduced accuracy at 25%+ suppression
		if (suppressionLevel >= 25) {
			const accuracyPenalty = (suppressionLevel / 100) * 0.5;
			targetRotation += (Math.random() - 0.5) * accuracyPenalty;
		}

		entity.snapper.turretTargetRotation = targetRotation;
	}

	// Smoothly rotate turret
	const rotDiff = entity.snapper.turretTargetRotation - entity.snapper.turretRotation;
	entity.snapper.turretRotation += rotDiff * delta * 3;

	switch (state) {
		case "idle":
			entity.weapon.isFiring = false;
			if (distance < SNAPPER_ENGAGE_RANGE) {
				transitionState(entity, "attack");
			}
			break;

		case "attack":
			if (distance > SNAPPER_ENGAGE_RANGE || isSuppressed || entity.snapper.isOverheated) {
				entity.weapon.isFiring = false;
				if (entity.snapper.isOverheated) {
					// Wait for cooldown
				} else if (isSuppressed) {
					// Stay suppressed
				} else {
					transitionState(entity, "idle");
				}
			} else {
				entity.weapon.isFiring = true;
				entity.snapper.heatLevel += SNAPPER_HEAT_PER_SHOT * delta * 10;
				if (entity.snapper.heatLevel >= SNAPPER_OVERHEAT_THRESHOLD) {
					entity.snapper.isOverheated = true;
				}
			}
			break;

		default:
			transitionState(entity, "idle");
	}
};

// =============================================================================
// SCOUT AI
// =============================================================================

const SCOUT_DETECTION_RANGE = 30;
const SCOUT_FLEE_RANGE = 12;
const SCOUT_SIGNAL_DURATION = 2;
const SCOUT_SIGNAL_COOLDOWN = 8;

const updateScoutAI = (
	entity: Entity,
	playerPos: Vector3,
	distance: number,
	delta: number,
): void => {
	if (!entity.aiBrain || !entity.scout || !entity.steeringAgent) return;

	// Update signal cooldown
	entity.scout.signalCooldown = Math.max(0, entity.scout.signalCooldown - delta);

	const state = entity.aiBrain.currentState;

	// Graduated suppression effects (0-100 scale)
	const suppressionLevel = entity.suppression?.amount ?? 0;
	const isSuppressed = suppressionLevel >= 75; // Force cover seeking at 75%

	switch (state) {
		case "patrol":
			entity.scout.isSignaling = false;
			// Patrol around home position
			if (!entity.steeringAgent.targetPosition || entity.aiBrain.stateTime > 5) {
				const patrolAngle = Math.random() * Math.PI * 2;
				const patrolRadius = entity.aiBrain.patrolRadius * 0.5;
				entity.steeringAgent.targetPosition = entity.aiBrain.homePosition
					.clone()
					.add(
						new Vector3(
							Math.cos(patrolAngle) * patrolRadius,
							0,
							Math.sin(patrolAngle) * patrolRadius,
						),
					);
				entity.aiBrain.stateTime = 0;
			}

			if (distance < SCOUT_DETECTION_RANGE) {
				entity.scout.hasSpottedPlayer = true;
				transitionState(entity, "signal");
			}
			break;

		case "signal":
			entity.scout.isSignaling = true;
			entity.steeringAgent.targetPosition = null; // Stop to signal

			if (entity.aiBrain.stateTime > SCOUT_SIGNAL_DURATION) {
				entity.scout.isSignaling = false;
				entity.scout.signalCooldown = SCOUT_SIGNAL_COOLDOWN;
				// Alert nearby pack members
				alertPack(entity);
				transitionState(entity, "flee");
			}
			break;

		case "flee": {
			entity.scout.isSignaling = false;
			// Flee away from player
			// subtract returns a new Vector3 in Babylon.js
			const fleeDir = entity.transform!.position.subtract(playerPos).normalize();
			entity.steeringAgent.targetPosition = entity
				.transform!.position.add(fleeDir.scale(30));

			if (distance > SCOUT_FLEE_RANGE * 2 && entity.aiBrain.stateTime > 5) {
				transitionState(entity, "patrol");
			}
			break;
		}

		case "alert":
			// Received signal from another scout, chase player
			entity.steeringAgent.targetPosition = playerPos.clone();

			if (distance < SCOUT_FLEE_RANGE || isSuppressed) {
				transitionState(entity, "flee");
			} else if (entity.aiBrain.stateTime > 10) {
				transitionState(entity, "patrol");
			}
			break;

		default:
			transitionState(entity, "patrol");
	}
};

// =============================================================================
// PACK COORDINATION
// =============================================================================

/**
 * Alert all pack members when a scout signals
 */
const alertPack = (signalingEntity: Entity): void => {
	if (!signalingEntity.packMember || !signalingEntity.transform) return;

	const packId = signalingEntity.packMember.packId;
	const signalPos = signalingEntity.transform.position;
	const signalRange = signalingEntity.packMember.signalRange;

	for (const entity of packMembers) {
		if (entity.id === signalingEntity.id) continue;
		if (entity.packMember?.packId !== packId) continue;
		if (!entity.transform) continue;

		const distance = Vector3.Distance(entity.transform.position, signalPos);
		if (distance > signalRange) continue;

		// Alert this pack member
		if (entity.aiBrain) {
			entity.aiBrain.alertLevel = 1;
			entity.aiBrain.lastKnownPlayerPos = getPlayerPosition();
			transitionState(entity, "alert");
		}
	}
};

/**
 * Create a flanking formation for pack hunters
 */
export const calculateFlankPositions = (
	targetPos: Vector3,
	packSize: number,
): Vector3[] => {
	const positions: Vector3[] = [];
	const flankDistance = 10;

	for (let i = 0; i < packSize; i++) {
		const angle = (i / packSize) * Math.PI * 2 + Math.PI / packSize;
		const offset = new Vector3(
			Math.cos(angle) * flankDistance,
			0,
			Math.sin(angle) * flankDistance,
		);
		positions.push(targetPos.clone().add(offset));
	}

	return positions;
};
