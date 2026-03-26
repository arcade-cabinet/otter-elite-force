/**
 * Detection System — Enemy entities detect nearby player units.
 *
 * Entities with VisionRadius scan for enemies. Stealthed entities
 * are invisible unless within half detection range. Detected enemies
 * trigger an alert event on the world.
 *
 * Pure function on GameWorld.
 */

import { Faction, Flags, Health, Position, VisionRadius } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Stealth reduces detection range to this fraction of normal. */
const STEALTH_DETECTION_FACTOR = 0.5;

/**
 * Run one tick of the detection system.
 * Enemy entities detect player units within their vision radius.
 */
export function runDetectionSystem(world: GameWorld): void {
	const enemyFaction = FACTION_IDS.scale_guard;
	const playerFaction = FACTION_IDS.ura;

	for (const detectorEid of world.runtime.alive) {
		if (Faction.id[detectorEid] !== enemyFaction) continue;
		if (Flags.isResource[detectorEid] === 1 || Flags.isProjectile[detectorEid] === 1) continue;

		const visionRange = VisionRadius.value[detectorEid];
		if (visionRange <= 0) continue;

		const dx0 = Position.x[detectorEid];
		const dy0 = Position.y[detectorEid];

		for (const targetEid of world.runtime.alive) {
			if (targetEid === detectorEid) continue;
			if (Faction.id[targetEid] !== playerFaction) continue;
			if (Health.current[targetEid] <= 0) continue;

			// Stealthed targets only detectable at reduced range
			const effectiveRange = Flags.stealthed[targetEid] === 1
				? visionRange * STEALTH_DETECTION_FACTOR
				: visionRange;

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
