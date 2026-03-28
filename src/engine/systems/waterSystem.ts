/**
 * Water System — Handles water tile interactions and swimming.
 *
 * Entities on water tiles that cannot swim take damage. Entities
 * that can swim toggle submerged state based on their tile position.
 *
 * Pure function on GameWorld.
 */

import { Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";

/** Damage per second for non-swimming entities in water. */
const WATER_DAMAGE_PER_SEC = 2;

/**
 * Run one tick of the water system.
 * Non-swimming entities in water take damage; swimmers toggle submerged.
 */
export function runWaterSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	// Water system requires terrain knowledge — skip if not available
	const gridWidth = world.navigation.width;
	const gridHeight = world.navigation.height;
	if (gridWidth <= 0 || gridHeight <= 0) return;

	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] === 1) continue;

		// Check if entity is in a water zone
		const inWater = isEntityInWaterZone(world, Position.x[eid], Position.y[eid]);

		if (!inWater) {
			// Clear submerged flag when leaving water
			if (Flags.submerged[eid] === 1) {
				Flags.submerged[eid] = 0;
			}
			continue;
		}

		if (Flags.canSwim[eid] === 1) {
			// Swimming entities become submerged in water
			Flags.submerged[eid] = 1;
		} else {
			// Non-swimmers take damage in water
			Health.current[eid] -= WATER_DAMAGE_PER_SEC * deltaSec;
			if (Health.current[eid] <= 0) {
				markForRemoval(world, eid);
			}
		}
	}
}

/** Check if a world-space position is inside any water zone. */
function isEntityInWaterZone(world: GameWorld, wx: number, wy: number): boolean {
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		if (!zoneId.includes("water") && !zoneId.includes("river") && !zoneId.includes("swamp")) {
			continue;
		}
		if (wx >= rect.x && wx < rect.x + rect.width && wy >= rect.y && wy < rect.y + rect.height) {
			return true;
		}
	}
	return false;
}
