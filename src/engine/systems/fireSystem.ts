/**
 * Fire System — Fire spread across terrain tiles.
 * Used in Mission 10 (Scorched Earth).
 * Pure function on GameWorld.
 */

import { Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";

/** Fire damage per second to entities in burning tiles. */
const FIRE_DAMAGE_PER_SEC = 3;

/**
 * Run one tick of the fire system.
 * Damages entities in burning zones.
 */
export function runFireSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const [zoneId, rect] of world.runtime.zoneRects) {
		if (!zoneId.includes("fire") && !zoneId.includes("burn")) continue;

		for (const eid of world.runtime.alive) {
			const x = Position.x[eid];
			const y = Position.y[eid];
			if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
				Health.current[eid] -= FIRE_DAMAGE_PER_SEC * deltaSec;
				if (Health.current[eid] <= 0) {
					markForRemoval(world, eid);
				}
			}
		}
	}
}
