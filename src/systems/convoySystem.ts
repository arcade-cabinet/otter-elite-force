/**
 * Convoy System — scripted waypoint movement for escort mission entities.
 *
 * Each tick:
 *   1. Advance convoy entities toward their current waypoint at speed * delta.
 *   2. On waypoint arrival: increment index, emit "convoy-waypoint-reached".
 *   3. When all waypoints reached: emit "convoy-arrived".
 *   4. Check for enemy units within detectionRadius: stop if found.
 *   5. Resume when no enemies remain in detection range.
 *   6. If entity has Health and health <= 0: emit "convoy-destroyed".
 *
 * Used by Mission 1-2 (convoy trucks) and Mission 2-3 (supply barges).
 */

import type { World } from "koota";
import { Health } from "../ecs/traits/combat";
import { ConvoyWaypoints } from "../ecs/traits/convoy";
import { Faction } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { EventBus } from "../game/EventBus";
import { distanceBetween } from "./combatSystem";

/** Arrival threshold — snap to waypoint when within this distance (tiles). */
const ARRIVAL_THRESHOLD = 0.25;

/**
 * Main convoy system tick.
 */
export function convoySystem(world: World, delta: number): void {
	checkConvoyDestroyed(world);
	detectEnemies(world);
	advanceConvoys(world, delta);
}

// ---------------------------------------------------------------------------
// Advance — move convoy entities along their waypoint path
// ---------------------------------------------------------------------------

function advanceConvoys(world: World, delta: number): void {
	const convoys = world.query(ConvoyWaypoints, Position);

	for (const entity of convoys) {
		const convoy = entity.get(ConvoyWaypoints)!;

		// Don't move if stopped
		if (convoy.stopped) continue;

		const waypoints = convoy.waypoints;
		if (waypoints.length === 0) continue;

		// All waypoints reached — nothing to do
		if (convoy.currentWaypoint >= waypoints.length) continue;

		const pos = entity.get(Position)!;
		const target = waypoints[convoy.currentWaypoint];

		const dx = target.x - pos.x;
		const dy = target.y - pos.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= ARRIVAL_THRESHOLD) {
			// Snap to waypoint
			entity.set(Position, { x: target.x, y: target.y });

			const nextIndex = convoy.currentWaypoint + 1;
			entity.set(ConvoyWaypoints, (prev) => ({ ...prev, currentWaypoint: nextIndex }));

			if (nextIndex >= waypoints.length) {
				EventBus.emit("convoy-arrived", { entity });
			} else {
				EventBus.emit("convoy-waypoint-reached", {
					entity,
					waypointIndex: convoy.currentWaypoint,
				});
			}
		} else {
			// Move toward waypoint
			const step = convoy.speed * delta;
			const nx = dx / dist;
			const ny = dy / dist;
			const move = Math.min(step, dist);

			entity.set(Position, {
				x: pos.x + nx * move,
				y: pos.y + ny * move,
			});
		}
	}
}

// ---------------------------------------------------------------------------
// Enemy detection — stop/resume based on nearby hostiles
// ---------------------------------------------------------------------------

function detectEnemies(world: World): void {
	const convoys = world.query(ConvoyWaypoints, Position, Faction);
	const potentialThreats = world.query(Position, Faction, Health);

	for (const entity of convoys) {
		const convoy = entity.get(ConvoyWaypoints)!;
		const pos = entity.get(Position)!;
		const faction = entity.get(Faction)!;

		let enemyNearby = false;

		for (const candidate of potentialThreats) {
			if (candidate === entity) continue;

			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id === faction.id) continue;

			// Ignore dead candidates
			const candidateHealth = candidate.get(Health)!;
			if (candidateHealth.current <= 0) continue;

			const candidatePos = candidate.get(Position)!;
			const dist = distanceBetween(pos.x, pos.y, candidatePos.x, candidatePos.y);

			if (dist <= convoy.detectionRadius) {
				enemyNearby = true;
				break;
			}
		}

		if (enemyNearby && !convoy.stopped) {
			entity.set(ConvoyWaypoints, (prev) => ({ ...prev, stopped: true }));
		} else if (!enemyNearby && convoy.stopped) {
			entity.set(ConvoyWaypoints, (prev) => ({ ...prev, stopped: false }));
		}
	}
}

// ---------------------------------------------------------------------------
// Destruction check — emit event when convoy vehicle health reaches zero
// ---------------------------------------------------------------------------

function checkConvoyDestroyed(world: World): void {
	const convoys = world.query(ConvoyWaypoints, Health);

	for (const entity of convoys) {
		const health = entity.get(Health)!;
		if (health.current <= 0) {
			EventBus.emit("convoy-destroyed", { entity });
		}
	}
}
