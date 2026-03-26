/**
 * Stealth System — Manages stealth state and concealment for entities.
 *
 * Stealthed entities (Flags.stealthed === 1) are invisible to enemies
 * unless they enter detection range or attack. Attacking breaks stealth.
 *
 * Pure function on GameWorld.
 */

import { Attack, Flags } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/**
 * Run one tick of the stealth system.
 * Entities that attack lose their stealth status.
 */
export function runStealthSystem(world: GameWorld): void {
	for (const eid of world.runtime.alive) {
		if (Flags.stealthed[eid] !== 1) continue;

		// If entity has an active attack cooldown (just attacked), break stealth
		if (Attack.damage[eid] > 0 && Attack.timer[eid] === 0 && Attack.cooldown[eid] > 0) {
			// Attack.timer resets to 0 on attack fire — if timer is 0 and
			// there's a cooldown, the entity just attacked this tick
			Flags.stealthed[eid] = 0;
		}
	}
}
