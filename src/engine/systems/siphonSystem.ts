/**
 * Siphon System — Enemy resource drain mechanic.
 * Used in Mission 5 (Siphon Valley) and Mission 13 (Great Siphon).
 * Pure function on GameWorld.
 */

import { Faction, Flags } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Resources drained per second per active siphon building. */
const SIPHON_RATE = 1;

/**
 * Run one tick of the siphon system.
 * Enemy siphon buildings drain player resources over time.
 */
export function runSiphonSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	let siphonCount = 0;
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.scale_guard) continue;
		const type = world.runtime.entityTypeIndex.get(eid);
		if (type?.includes("siphon")) siphonCount++;
	}

	if (siphonCount === 0) return;

	const drain = SIPHON_RATE * deltaSec * siphonCount;
	world.session.resources.fish = Math.max(0, world.session.resources.fish - drain);
	world.session.resources.timber = Math.max(0, world.session.resources.timber - drain);
}
