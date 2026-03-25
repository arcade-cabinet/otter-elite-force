/**
 * Stealth & Detection System for Otter: Elite Force RTS.
 *
 * Handles detection checks, concealment zones, crouch toggle, and alert cascade.
 * Spec reference: §8.5 — Detection, Concealment, Alert Propagation.
 *
 * Detection flow:
 *   1. Entities with DetectionRadius query all enemies
 *   2. Effective radius reduced by Concealed (75%) and Crouching (50%) tags
 *   3. Within effective radius → acquire Targeting, set AIState to "alert"
 *   4. Alert cascade propagates to same-faction allies within 10 tiles
 *
 * IMPORTANT: DetectionRadius is SoA (snapshot) — read only via .get().
 * AIState is AoS (mutable ref) — direct property assignment persists.
 */

import type { Entity, World } from "koota";
import { Targeting } from "../ecs/relations";
import { AIState } from "../ecs/traits/ai";
import { Health } from "../ecs/traits/combat";
import { Faction } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { Concealed, Crouching, DetectionRadius } from "../ecs/traits/stealth";
import { distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Concealment reduces detection radius by 75% (multiply by 0.25). */
export const CONCEALMENT_FACTOR = 0.25;

/** Crouching reduces detection radius by 50% (multiply by 0.5). */
export const CROUCH_FACTOR = 0.5;

/** Alert cascade propagation range in tiles. */
export const ALERT_CASCADE_RANGE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Spot event returned by detectionSystem for external consumption (FX, logs). */
export interface SpotEvent {
	detector: Entity;
	target: Entity;
	distance: number;
}

/**
 * Computes the effective detection radius after applying concealment and
 * crouching modifiers. Modifiers stack multiplicatively.
 */
export function effectiveDetectionRadius(
	baseRadius: number,
	isConcealed: boolean,
	isCrouching: boolean,
): number {
	let radius = baseRadius;
	if (isConcealed) radius *= CONCEALMENT_FACTOR;
	if (isCrouching) radius *= CROUCH_FACTOR;
	return radius;
}

// ---------------------------------------------------------------------------
// detectionSystem — detectors scan for enemies within effective radius
// ---------------------------------------------------------------------------

/**
 * Each entity with DetectionRadius + Faction + Position scans for enemies.
 * Enemies that are Concealed or Crouching reduce the effective detection range.
 *
 * On detection:
 *   - Detector acquires Targeting relation to the nearest spotted enemy
 *   - Detector's AIState transitions to "alert"
 *
 * Skips detectors that already have a Targeting relation (already engaged).
 * Returns SpotEvent[] for external systems (e.g., "!" alert FX).
 */
export function detectionSystem(world: World): SpotEvent[] {
	const detectors = world.query(DetectionRadius, Faction, Position, AIState);
	const potentialTargets = world.query(Faction, Position, Health);
	const events: SpotEvent[] = [];

	for (const detector of detectors) {
		// Already targeting — skip re-detection
		if (detector.has(Targeting("*"))) continue;

		const detectorPos = detector.get(Position)!;
		const detectorFaction = detector.get(Faction)!;
		const detection = detector.get(DetectionRadius)!;

		let nearestDist = Number.POSITIVE_INFINITY;
		let nearestTarget: Entity | null = null;

		for (const candidate of potentialTargets) {
			if (candidate === detector) continue;

			// Skip allies
			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id === detectorFaction.id) continue;

			// Compute effective radius based on target's stealth state
			const isConcealed = candidate.has(Concealed);
			const isCrouching = candidate.has(Crouching);
			const effRadius = effectiveDetectionRadius(detection.radius, isConcealed, isCrouching);

			const candidatePos = candidate.get(Position)!;
			const dist = distanceBetween(detectorPos.x, detectorPos.y, candidatePos.x, candidatePos.y);

			if (dist <= effRadius && dist < nearestDist) {
				nearestDist = dist;
				nearestTarget = candidate;
			}
		}

		if (nearestTarget !== null) {
			detector.add(Targeting(nearestTarget));

			// AIState is AoS — direct mutation persists
			const ai = detector.get(AIState)!;
			ai.state = "alert";
			ai.alertLevel = 1;

			events.push({
				detector,
				target: nearestTarget,
				distance: nearestDist,
			});
		}
	}

	return events;
}

// ---------------------------------------------------------------------------
// crouchToggle — add or remove the Crouching tag
// ---------------------------------------------------------------------------

/**
 * Toggles the Crouching tag on an entity.
 * Idempotent: adding when already crouching or removing when not crouching is safe.
 */
export function crouchToggle(entity: Entity, shouldCrouch: boolean): void {
	if (shouldCrouch) {
		if (!entity.has(Crouching)) {
			entity.add(Crouching);
		}
	} else {
		if (entity.has(Crouching)) {
			entity.remove(Crouching);
		}
	}
}

// ---------------------------------------------------------------------------
// alertCascadeSystem — propagate alert state to nearby same-faction allies
// ---------------------------------------------------------------------------

/**
 * For every entity in the "alert" AIState, propagate alertness to same-faction
 * allies within ALERT_CASCADE_RANGE tiles. Only affects idle units — already
 * alerted units are skipped to avoid redundant processing.
 */
export function alertCascadeSystem(world: World): void {
	const aiEntities = world.query(AIState, Faction, Position);

	// Collect alerted entities first (avoid mutation during iteration)
	const alerted: Entity[] = [];
	for (const entity of aiEntities) {
		const ai = entity.get(AIState)!;
		if (ai.state === "alert") {
			alerted.push(entity);
		}
	}

	// Propagate to idle same-faction allies within range
	for (const source of alerted) {
		const sourcePos = source.get(Position)!;
		const sourceFaction = source.get(Faction)!;

		for (const candidate of aiEntities) {
			if (candidate === source) continue;

			const candidateAi = candidate.get(AIState)!;
			if (candidateAi.state !== "idle") continue;

			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id !== sourceFaction.id) continue;

			const candidatePos = candidate.get(Position)!;
			const dist = distanceBetween(sourcePos.x, sourcePos.y, candidatePos.x, candidatePos.y);

			if (dist <= ALERT_CASCADE_RANGE) {
				candidateAi.state = "alert";
				candidateAi.alertLevel = 1;
			}
		}
	}
}
