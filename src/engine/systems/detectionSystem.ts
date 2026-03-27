/**
 * Detection System — Cone-based and radius-based detection for stealth
 * missions and general enemy AI awareness.
 *
 * Two detection modes:
 * 1. Radius detection: enemies scan for player units within VisionRadius.
 *    Stealthed units only detectable at half range. Watchtower bonus.
 *    Bush/forest stealth bonus (reduces detectability further).
 *
 * 2. Cone detection: directional sentries with DetectionCone scan a
 *    forward arc. Player units inside the cone accumulate suspicion.
 *    Stealthed units are invisible to cones. Alert propagation to allies.
 *
 * Detection events:
 *   "enemy-detected" — a player unit was detected by an enemy
 *   "alarm-triggered" — an enemy entered full alert state
 *
 * Pure function on GameWorld.
 */

import {
	DetectionCone,
	Facing,
	Faction,
	Flags,
	Health,
	Position,
	VisionRadius,
} from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Stealth reduces detection range to this fraction of normal. */
const STEALTH_DETECTION_FACTOR = 0.5;

/** Bush/forest stealth bonus: further reduces detection range. */
const BUSH_STEALTH_BONUS = 0.3;

/** Watchtower extends detection range by this multiplier. */
const WATCHTOWER_DETECTION_MULTIPLIER = 2.0;

/** Degrees-to-radians conversion factor. */
const DEG_TO_RAD = Math.PI / 180;

/** Suspicion decay rate (seconds per second). */
const SUSPICION_DECAY_RATE = 0.5;

/** Alert propagation range in pixels. */
const ALERT_PROPAGATION_RANGE = 256;

/** Alert state constants for DetectionCone. */
const ALERT_IDLE = 0;
const ALERT_SUSPICIOUS = 1;
const ALERT_FULL = 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns true if `target` is inside the detection cone of `detector`.
 * The cone is defined by facing angle, half-angle, and range.
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

	// Normalize to [-PI, PI]
	while (diff > Math.PI) diff -= 2 * Math.PI;
	while (diff < -Math.PI) diff += 2 * Math.PI;

	return Math.abs(diff) <= halfAngleDeg * DEG_TO_RAD;
}

/**
 * Check if a tile position is in bush/forest terrain (stealth bonus).
 * Uses the terrain grid if available.
 */
function isInBush(world: GameWorld, tileX: number, tileY: number): boolean {
	const grid = world.runtime.terrainGrid;
	if (!grid) return false;
	if (tileY < 0 || tileY >= grid.length) return false;
	if (tileX < 0 || tileX >= (grid[0]?.length ?? 0)) return false;
	// Terrain types: assume bush/forest tiles have specific IDs
	// Convention: terrain IDs 3 = bush, 4 = forest (dense canopy)
	const terrainId = grid[tileY][tileX];
	return terrainId === 3 || terrainId === 4;
}

// ---------------------------------------------------------------------------
// Radius-based detection
// ---------------------------------------------------------------------------

/**
 * Run radius-based detection for all enemy entities.
 * Enemies with VisionRadius detect player units within range.
 */
function runRadiusDetection(world: GameWorld): void {
	const enemyFaction = FACTION_IDS.scale_guard;
	const playerFaction = FACTION_IDS.ura;

	for (const detectorEid of world.runtime.alive) {
		if (Faction.id[detectorEid] !== enemyFaction) continue;
		if (Flags.isResource[detectorEid] === 1 || Flags.isProjectile[detectorEid] === 1) continue;

		let visionRange = VisionRadius.value[detectorEid];
		if (visionRange <= 0) continue;

		// Watchtower bonus for building detectors
		if (Flags.isBuilding[detectorEid] === 1) {
			const buildingType = world.runtime.entityTypeIndex.get(detectorEid);
			if (buildingType === "watchtower" || buildingType === "guard_tower") {
				visionRange *= WATCHTOWER_DETECTION_MULTIPLIER;
			}
		}

		const dx0 = Position.x[detectorEid];
		const dy0 = Position.y[detectorEid];

		for (const targetEid of world.runtime.alive) {
			if (targetEid === detectorEid) continue;
			if (Faction.id[targetEid] !== playerFaction) continue;
			if (Health.current[targetEid] <= 0) continue;

			// Calculate effective detection range based on target stealth
			let effectiveRange = visionRange;

			if (Flags.stealthed[targetEid] === 1) {
				effectiveRange *= STEALTH_DETECTION_FACTOR;

				// Bush/forest bonus: further reduce detection range
				const targetTileX = Math.floor(Position.x[targetEid]);
				const targetTileY = Math.floor(Position.y[targetEid]);
				if (isInBush(world, targetTileX, targetTileY)) {
					effectiveRange *= BUSH_STEALTH_BONUS;
				}
			}

			const dx = Position.x[targetEid] - dx0;
			const dy = Position.y[targetEid] - dy0;
			const distSq = dx * dx + dy * dy;

			if (distSq <= effectiveRange * effectiveRange) {
				world.events.push({
					type: "enemy-detected",
					payload: {
						detectorEid,
						targetEid,
						distance: Math.sqrt(distSq),
					},
				});
				break; // One detection per detector per tick
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Cone-based detection
// ---------------------------------------------------------------------------

/**
 * Run cone-based detection for entities with DetectionCone component.
 * Directional detection with suspicion ramp and alert propagation.
 */
function runConeDetection(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const playerFaction = FACTION_IDS.ura;
	const alertedDetectors: number[] = [];

	for (const detectorEid of world.runtime.alive) {
		if (DetectionCone.range[detectorEid] <= 0) continue;
		if (Flags.isResource[detectorEid] === 1 || Flags.isProjectile[detectorEid] === 1) continue;

		// Already fully alert — skip scanning (but track for propagation)
		if (DetectionCone.alertState[detectorEid] === ALERT_FULL) {
			alertedDetectors.push(detectorEid);
			continue;
		}

		const coneRange = DetectionCone.range[detectorEid];
		const halfAngle = DetectionCone.halfAngle[detectorEid];
		const facingAngle = Facing.radians[detectorEid];
		const dx0 = Position.x[detectorEid];
		const dy0 = Position.y[detectorEid];

		let targetInCone = false;

		for (const candidateEid of world.runtime.alive) {
			if (candidateEid === detectorEid) continue;
			if (Faction.id[candidateEid] !== playerFaction) continue;
			if (Health.current[candidateEid] <= 0) continue;

			// Stealthed units are invisible to cones
			if (Flags.stealthed[candidateEid] === 1) continue;

			if (
				isInsideCone(
					dx0, dy0,
					facingAngle,
					Position.x[candidateEid], Position.y[candidateEid],
					coneRange,
					halfAngle,
				)
			) {
				targetInCone = true;
				break;
			}
		}

		if (targetInCone) {
			DetectionCone.suspicionTimer[detectorEid] += deltaSec;

			if (DetectionCone.alertState[detectorEid] === ALERT_IDLE) {
				DetectionCone.alertState[detectorEid] = ALERT_SUSPICIOUS;
			}

			if (DetectionCone.suspicionTimer[detectorEid] >= DetectionCone.suspicionThreshold[detectorEid]) {
				DetectionCone.alertState[detectorEid] = ALERT_FULL;
				alertedDetectors.push(detectorEid);
			}
		} else {
			// Decay suspicion when no target visible
			DetectionCone.suspicionTimer[detectorEid] = Math.max(
				0,
				DetectionCone.suspicionTimer[detectorEid] - SUSPICION_DECAY_RATE * deltaSec,
			);

			if (
				DetectionCone.suspicionTimer[detectorEid] === 0 &&
				DetectionCone.alertState[detectorEid] === ALERT_SUSPICIOUS
			) {
				DetectionCone.alertState[detectorEid] = ALERT_IDLE;
			}
		}
	}

	// Alert propagation: alert enemies wake up nearby same-faction allies
	for (const sourceEid of alertedDetectors) {
		const sourceX = Position.x[sourceEid];
		const sourceY = Position.y[sourceEid];
		const sourceFaction = Faction.id[sourceEid];

		for (const candidateEid of world.runtime.alive) {
			if (candidateEid === sourceEid) continue;
			if (DetectionCone.range[candidateEid] <= 0) continue;
			if (DetectionCone.alertState[candidateEid] === ALERT_FULL) continue;
			if (Faction.id[candidateEid] !== sourceFaction) continue;

			const dist = distanceBetween(sourceX, sourceY, Position.x[candidateEid], Position.y[candidateEid]);
			if (dist <= ALERT_PROPAGATION_RANGE) {
				DetectionCone.alertState[candidateEid] = ALERT_FULL;
				DetectionCone.suspicionTimer[candidateEid] = DetectionCone.suspicionThreshold[candidateEid];
			}
		}
	}

	// Emit alarm event if any detector is alert
	if (alertedDetectors.length > 0) {
		world.events.push({
			type: "alarm-triggered",
			payload: {
				x: Position.x[alertedDetectors[0]],
				y: Position.y[alertedDetectors[0]],
			},
		});
	}
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the detection system.
 * Processes both radius-based and cone-based detection.
 */
export function runDetectionSystem(world: GameWorld): void {
	runRadiusDetection(world);
	runConeDetection(world);
}
