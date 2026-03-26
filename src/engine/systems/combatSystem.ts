/**
 * Combat System — Attack resolution and damage application.
 *
 * Each frame:
 * 1. For each alive entity with an attack order, check range.
 * 2. If in range and cooldown is ready, apply damage to target.
 * 3. Mark dead entities for removal.
 */

import { Attack, Faction, Flags, Health, Position } from "@/engine/world/components";
import { markForRemoval, type GameWorld } from "@/engine/world/gameWorld";

/** Squared distance helper to avoid sqrt per frame. */
function distSq(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return dx * dx + dy * dy;
}

/**
 * Find the nearest enemy entity within attack range.
 * Returns -1 if no valid target is found.
 */
function findNearestEnemy(
	world: GameWorld,
	eid: number,
	range: number,
): number {
	const ax = Position.x[eid];
	const ay = Position.y[eid];
	const myFaction = Faction.id[eid];
	const rangeSq = range * range;

	let nearestEid = -1;
	let nearestDistSq = Number.POSITIVE_INFINITY;

	for (const candidateEid of world.runtime.alive) {
		if (candidateEid === eid) continue;
		if (Faction.id[candidateEid] === myFaction) continue;
		if (Flags.isResource[candidateEid] === 1) continue;
		if (Flags.isProjectile[candidateEid] === 1) continue;
		if (Health.max[candidateEid] <= 0) continue;

		const dSqVal = distSq(ax, ay, Position.x[candidateEid], Position.y[candidateEid]);
		if (dSqVal <= rangeSq && dSqVal < nearestDistSq) {
			nearestDistSq = dSqVal;
			nearestEid = candidateEid;
		}
	}

	return nearestEid;
}

/**
 * Run one tick of the combat system.
 * Entities with Attack.damage > 0 auto-target the nearest enemy in range.
 * Entities with active move orders are skipped.
 */
export function runCombatSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const eid of world.runtime.alive) {
		// Skip non-combat entities
		if (Flags.isResource[eid] === 1 || Flags.isProjectile[eid] === 1) continue;

		const damage = Attack.damage[eid];
		if (damage <= 0) continue;

		// Skip entities with an active move order
		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0 && orders[0].type === "move") continue;

		// Advance cooldown timer
		Attack.timer[eid] += deltaSec;
		if (Attack.timer[eid] < Attack.cooldown[eid]) continue;

		// Find nearest enemy within range
		const range = Attack.range[eid];
		const targetEid = findNearestEnemy(world, eid, range);

		if (targetEid === -1) continue;

		// Reset cooldown timer (attack fires)
		Attack.timer[eid] = 0;

		// Apply damage
		Health.current[targetEid] -= damage;

		// Mark for removal if dead
		if (Health.current[targetEid] <= 0) {
			markForRemoval(world, targetEid);
		}
	}
}
