/**
 * AI System — Simple enemy behavior for Scale Guard faction entities.
 *
 * Each frame:
 * 1. Iterate alive entities belonging to the enemy faction (id === 2).
 * 2. Skip entities that already have orders.
 * 3. If a player-faction entity is within detection range, issue an attack-move order.
 * 4. Otherwise, remain idle.
 */

import {
	Attack,
	Faction,
	Flags,
	Health,
	Position,
	VisionRadius,
} from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";
import { getOrderQueue } from "@/engine/world/gameWorld";

/** Default detection range when VisionRadius is not set. */
const DEFAULT_DETECTION_RANGE = 128;

/**
 * Run one tick of the AI system.
 * Evaluates enemy entity behavior and assigns orders.
 */
export function runAiSystem(world: GameWorld): void {
	const enemyFactionId = FACTION_IDS.scale_guard;
	const playerFactionId = FACTION_IDS.ura;

	for (const eid of world.runtime.alive) {
		// Only process enemy faction entities that are not buildings/resources
		if (Faction.id[eid] !== enemyFactionId) continue;
		if (Flags.isResource[eid] === 1) continue;
		if (Flags.isProjectile[eid] === 1) continue;

		// Skip entities that already have orders
		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0) continue;

		// Must have attack capability
		if (Attack.damage[eid] <= 0) continue;

		// Determine detection range
		const detectionRange =
			VisionRadius.value[eid] > 0
				? VisionRadius.value[eid]
				: DEFAULT_DETECTION_RANGE;

		const ax = Position.x[eid];
		const ay = Position.y[eid];

		// Find nearest player-faction entity within detection range
		let nearestEid = -1;
		let nearestDist = Number.POSITIVE_INFINITY;

		for (const candidateEid of world.runtime.alive) {
			if (candidateEid === eid) continue;
			if (Faction.id[candidateEid] !== playerFactionId) continue;

			// Must have health (not a resource marker or dead entity)
			if (Health.max[candidateEid] <= 0) continue;

			const dx = Position.x[candidateEid] - ax;
			const dy = Position.y[candidateEid] - ay;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= detectionRange && dist < nearestDist) {
				nearestDist = dist;
				nearestEid = candidateEid;
			}
		}

		if (nearestEid !== -1) {
			// Issue attack-move order toward the nearest player entity
			const orderQueue = getOrderQueue(world, eid);
			orderQueue.push({
				type: "move",
				targetX: Position.x[nearestEid],
				targetY: Position.y[nearestEid],
			});
		}
	}
}
