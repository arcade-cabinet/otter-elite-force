/**
 * Convoy System -- Scripted waypoint movement for escort mission entities.
 *
 * Each tick:
 *   1. Check for destroyed convoys (HP <= 0) and emit "convoy-destroyed".
 *   2. Detect enemy units within detectionRadius: stop convoy if found.
 *   3. Resume when no enemies remain in detection range.
 *   4. Advance convoy entities toward their current waypoint at speed * delta.
 *   5. On waypoint arrival: emit "convoy-waypoint-reached", advance index.
 *   6. When all waypoints reached: emit "convoy-arrived".
 *
 * Convoy routes stored in world.runtime.convoyRoutes.
 * Stopped state stored in world.runtime.convoyStopped.
 * Detection radius stored in world.runtime.convoyDetectionRadius.
 *
 * Used by Mission 1-2 (convoy trucks) and Mission 2-3 (supply barges).
 *
 * Pure function on GameWorld.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";
import { distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Arrival threshold in pixels for waypoint completion. */
const WAYPOINT_THRESHOLD = 4;

/** Default enemy detection radius in pixels. */
const DEFAULT_DETECTION_RADIUS = 192;

// ---------------------------------------------------------------------------
// Main system entry point
// ---------------------------------------------------------------------------

/**
 * Run one tick of the convoy system.
 * Convoy entities follow their assigned routes, stop on enemy detection,
 * and resume when threats are cleared.
 */
export function runConvoySystem(world: GameWorld): void {
	checkConvoyDestroyed(world);
	detectEnemies(world);
	advanceConvoys(world);
}

// ---------------------------------------------------------------------------
// Destruction check -- emit event when convoy health reaches zero
// ---------------------------------------------------------------------------

function checkConvoyDestroyed(world: GameWorld): void {
	for (const [eid] of world.runtime.convoyRoutes) {
		if (!world.runtime.alive.has(eid)) continue;
		if (Health.current[eid] <= 0 && Health.max[eid] > 0) {
			world.events.push({
				type: "convoy-destroyed",
				payload: { eid },
			});
			markForRemoval(world, eid);
		}
	}
}

// ---------------------------------------------------------------------------
// Enemy detection -- stop/resume based on nearby hostiles
// ---------------------------------------------------------------------------

function detectEnemies(world: GameWorld): void {
	for (const [eid] of world.runtime.convoyRoutes) {
		if (!world.runtime.alive.has(eid)) continue;

		const myFaction = Faction.id[eid];
		const px = Position.x[eid];
		const py = Position.y[eid];
		const detectionRadius =
			world.runtime.convoyDetectionRadius.get(eid) ?? DEFAULT_DETECTION_RADIUS;

		let enemyNearby = false;

		for (const cid of world.runtime.alive) {
			if (cid === eid) continue;
			if (Faction.id[cid] === myFaction) continue;
			if (Faction.id[cid] === FACTION_IDS.neutral) continue;
			if (Flags.isProjectile[cid] === 1 || Flags.isResource[cid] === 1) continue;
			if (Health.max[cid] <= 0 || Health.current[cid] <= 0) continue;

			const dist = distanceBetween(px, py, Position.x[cid], Position.y[cid]);
			if (dist <= detectionRadius) {
				enemyNearby = true;
				break;
			}
		}

		const wasStopped = world.runtime.convoyStopped.get(eid) ?? false;

		if (enemyNearby && !wasStopped) {
			world.runtime.convoyStopped.set(eid, true);
		} else if (!enemyNearby && wasStopped) {
			world.runtime.convoyStopped.set(eid, false);
		}
	}
}

// ---------------------------------------------------------------------------
// Advance -- move convoy entities along their waypoint path
// ---------------------------------------------------------------------------

function advanceConvoys(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const [eid, route] of world.runtime.convoyRoutes) {
		if (!world.runtime.alive.has(eid)) continue;
		if (route.length === 0) continue;

		// Don't move if stopped by enemy detection
		if (world.runtime.convoyStopped.get(eid)) continue;

		const target = route[0];
		const px = Position.x[eid];
		const py = Position.y[eid];
		const dx = target.x * 32 + 16 - px;
		const dy = target.y * 32 + 16 - py;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= WAYPOINT_THRESHOLD) {
			// Snap to waypoint
			Position.x[eid] = target.x * 32 + 16;
			Position.y[eid] = target.y * 32 + 16;

			const waypointIndex = route.length; // original count before shift
			route.shift();

			if (route.length === 0) {
				// Convoy reached final destination
				world.events.push({
					type: "convoy-arrived",
					payload: { eid },
				});
			} else {
				// Intermediate waypoint reached
				world.events.push({
					type: "convoy-waypoint-reached",
					payload: { eid, waypointIndex: waypointIndex - route.length - 1 },
				});
			}
			continue;
		}

		// Move toward waypoint
		const speed = Speed.value[eid] > 0 ? Speed.value[eid] : 32;
		const step = Math.min(speed * deltaSec, dist);
		const nx = dx / dist;
		const ny = dy / dist;
		Position.x[eid] = px + nx * step;
		Position.y[eid] = py + ny * step;
	}
}
