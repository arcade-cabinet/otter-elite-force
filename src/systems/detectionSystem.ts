/**
 * Cone-Based Detection System for Otter: Elite Force RTS.
 *
 * Directional detection for stealth missions (1-4 Prison Break, 3-1 Dense Canopy).
 * Enemy sentries with DetectionCone scan a forward arc each tick. Player units
 * inside the cone accumulate suspicion; Stealthed units are invisible to cones.
 *
 * Detection flow:
 *   1. Entities with DetectionCone + Position + FacingDirection scan for enemies
 *   2. Player ("ura") units inside the cone raise suspicionTimer
 *   3. Timer >= threshold transitions alertState to "alert"
 *   4. No targets in cone → decay suspicionTimer toward 0
 *   5. Any alert enemy propagates alert to same-faction allies within 8 tiles
 *   6. If AlarmState singleton exists and any enemy is alert → alarm active
 *
 * Spec reference: Mission 1-4, 3-1 stealth encounter rules.
 */

import type { Entity, World } from "koota";
import { Faction } from "../ecs/traits/identity";
import { FacingDirection, Position } from "../ecs/traits/spatial";
import {
	AlarmState,
	DetectionCone,
	Stealthed,
} from "../ecs/traits/stealth";
import { Health } from "../ecs/traits/combat";
import { EventBus } from "../game/EventBus";
import { distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Degrees-to-radians conversion factor. */
const DEG_TO_RAD = Math.PI / 180;

/** Suspicion decay rate (seconds per second). */
const SUSPICION_DECAY_RATE = 0.5;

/** Alert propagation range in tiles. */
const ALERT_PROPAGATION_RANGE = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `target` is inside the detection cone of `detector`.
 *
 * The cone is defined by:
 *   - detector position + facing angle
 *   - half-angle (degrees) on each side of the facing direction
 *   - maximum range (tiles)
 */
function isInsideCone(
	detectorX: number,
	detectorY: number,
	facingAngle: number,
	targetX: number,
	targetY: number,
	range: number,
	halfAngleDeg: number,
): boolean {
	const dist = distanceBetween(detectorX, detectorY, targetX, targetY);
	if (dist > range || dist === 0) return false;

	const angleToTarget = Math.atan2(targetY - detectorY, targetX - detectorX);
	let diff = angleToTarget - facingAngle;

	// Normalise to [-PI, PI]
	while (diff > Math.PI) diff -= 2 * Math.PI;
	while (diff < -Math.PI) diff += 2 * Math.PI;

	return Math.abs(diff) <= halfAngleDeg * DEG_TO_RAD;
}

// ---------------------------------------------------------------------------
// coneDetectionSystem — directional detection with suspicion ramp
// ---------------------------------------------------------------------------

/**
 * Tick cone-based detection for all enemies with DetectionCone.
 * Must be called each frame with delta in seconds.
 */
export function coneDetectionSystem(world: World, delta: number): void {
	const detectors = world.query(DetectionCone, Position, FacingDirection, Faction);
	const potentialTargets = world.query(Faction, Position, Health);

	for (const detector of detectors) {
		const cone = detector.get(DetectionCone)!;
		const detectorPos = detector.get(Position)!;
		const facing = detector.get(FacingDirection)!;
		const detectorFaction = detector.get(Faction)!;

		// Already fully alert — skip further scanning
		if (cone.alertState === "alert") continue;

		let targetInCone = false;

		for (const candidate of potentialTargets) {
			if (candidate === detector) continue;

			// Only detect enemies
			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id === detectorFaction.id) continue;

			// Stealthed units are invisible to cones
			if (candidate.has(Stealthed)) continue;

			const candidatePos = candidate.get(Position)!;

			if (
				isInsideCone(
					detectorPos.x,
					detectorPos.y,
					facing.angle,
					candidatePos.x,
					candidatePos.y,
					cone.range,
					cone.halfAngle,
				)
			) {
				targetInCone = true;
				break;
			}
		}

		if (targetInCone) {
			cone.suspicionTimer += delta;

			if (cone.alertState === "idle") {
				cone.alertState = "suspicious";
			}

			if (cone.suspicionTimer >= cone.suspicionThreshold) {
				cone.alertState = "alert";
			}
		} else {
			// Decay suspicion when no target visible
			cone.suspicionTimer = Math.max(0, cone.suspicionTimer - SUSPICION_DECAY_RATE * delta);

			if (cone.suspicionTimer === 0 && cone.alertState === "suspicious") {
				cone.alertState = "idle";
			}
		}
	}

	// -----------------------------------------------------------------------
	// Alert propagation — alert enemies wake up nearby same-faction allies
	// -----------------------------------------------------------------------

	const allConeEntities = world.query(DetectionCone, Position, Faction);
	const alertedSources: Entity[] = [];

	for (const entity of allConeEntities) {
		const cone = entity.get(DetectionCone)!;
		if (cone.alertState === "alert") {
			alertedSources.push(entity);
		}
	}

	for (const source of alertedSources) {
		const sourcePos = source.get(Position)!;
		const sourceFaction = source.get(Faction)!;

		for (const candidate of allConeEntities) {
			if (candidate === source) continue;

			const candidateCone = candidate.get(DetectionCone)!;
			if (candidateCone.alertState === "alert") continue;

			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id !== sourceFaction.id) continue;

			const candidatePos = candidate.get(Position)!;
			const dist = distanceBetween(sourcePos.x, sourcePos.y, candidatePos.x, candidatePos.y);

			if (dist <= ALERT_PROPAGATION_RANGE) {
				candidateCone.alertState = "alert";
				candidateCone.suspicionTimer = candidateCone.suspicionThreshold;
			}
		}
	}

	// -----------------------------------------------------------------------
	// Alarm singleton — activate when any enemy is alert
	// -----------------------------------------------------------------------

	if (alertedSources.length > 0) {
		const alarmEntities = world.query(AlarmState);
		for (const alarmEntity of alarmEntities) {
			const alarm = alarmEntity.get(AlarmState)!;
			if (!alarm.active) {
				alarm.active = true;
				alarm.triggeredAt = performance.now();
				EventBus.emit("alarm-triggered", {
					x: alertedSources[0].get(Position)!.x,
					y: alertedSources[0].get(Position)!.y,
				});
			}
		}
	}
}
