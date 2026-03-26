/**
 * Encounter System (Engine) — Random patrol spawns between scripted waves.
 *
 * Adds replay variety using deterministic noise seeded from the tick.
 * Pure function on GameWorld.
 */

import type { GameWorld } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";
import { Attack, Speed, VisionRadius } from "@/engine/world/components";

/** Default interval between encounter checks in seconds. */
const DEFAULT_INTERVAL = 120;

/** Default probability per check. */
const DEFAULT_CHANCE = 0.3;

/** Accumulated time since last encounter check. */
let encounterTimer = 0;

/**
 * Run one tick of the encounter system.
 * Periodically rolls for random enemy patrol spawns.
 */
export function runEncounterSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	encounterTimer += deltaSec;
	if (encounterTimer < DEFAULT_INTERVAL) return;
	encounterTimer -= DEFAULT_INTERVAL;

	// Simple deterministic "random" from tick
	const roll = ((world.time.tick * 2654435761) >>> 0) / 0xffffffff;
	if (roll > DEFAULT_CHANCE) return;

	// Find a suitable spawn zone
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		if (!zoneId.includes("patrol") && !zoneId.includes("encounter")) continue;

		const eid = spawnUnit(world, {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
			faction: "scale_guard",
			unitType: "gator",
			health: { current: 8, max: 8 },
		});
		Attack.damage[eid] = 2;
		Attack.range[eid] = 48;
		Attack.cooldown[eid] = 1.5;
		Speed.value[eid] = 40;
		VisionRadius.value[eid] = 80;

		world.events.push({
			type: "encounter-spawned",
			payload: { zoneId, unitType: "gator" },
		});
		break;
	}
}

/** Reset encounter timer (for new missions/tests). */
export function resetEncounterTimer(): void {
	encounterTimer = 0;
}
