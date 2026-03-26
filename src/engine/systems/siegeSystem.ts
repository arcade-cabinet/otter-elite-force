/**
 * Siege System — Building damage multiplier for siege units.
 * Used in Mission 11 (Entrenchment) and Mission 14 (Iron Delta).
 * Pure function on GameWorld.
 */

import { Attack, Flags } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Siege damage multiplier against buildings. */
const SIEGE_MULTIPLIER = 2.0;

/**
 * Run one tick of the siege system.
 * Siege-tagged entities deal bonus damage to buildings.
 * Siege status is stored in entity type index as a type containing "siege".
 */
export function runSiegeSystem(world: GameWorld): void {
	for (const eid of world.runtime.alive) {
		const type = world.runtime.entityTypeIndex.get(eid);
		if (!type?.includes("siege")) continue;

		// Check if current attack target is a building
		const orders = world.runtime.orderQueues.get(eid);
		if (!orders || orders.length === 0) continue;

		const order = orders[0];
		if (order.type !== "attack" || order.targetEid === undefined) continue;

		const targetEid = order.targetEid;
		if (!world.runtime.alive.has(targetEid)) continue;

		// Apply siege bonus to attack damage (temporary per-tick)
		if (Flags.isBuilding[targetEid] === 1) {
			// Mark the attack timer bonus — the combat system will use the
			// boosted damage value
			const baseDamage = Attack.damage[eid];
			if (baseDamage > 0) {
				Attack.damage[eid] = baseDamage * SIEGE_MULTIPLIER;
			}
		}
	}
}
