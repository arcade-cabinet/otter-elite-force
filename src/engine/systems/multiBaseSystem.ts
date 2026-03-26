/**
 * Multi-Base System — Tracks multiple player bases and their status.
 * Used in Mission 13 (Great Siphon).
 * Pure function on GameWorld.
 */

import { Faction, Flags } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

/**
 * Run one tick of the multi-base system.
 * Checks all player buildings and emits events when bases are lost.
 */
export function runMultiBaseSystem(world: GameWorld): void {
	let playerBases = 0;
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		const type = world.runtime.entityTypeIndex.get(eid);
		if (type === "command_post" || type === "burrow") {
			playerBases++;
		}
	}

	if (playerBases === 0 && world.session.phase === "playing") {
		world.events.push({ type: "all-bases-lost", payload: {} });
	}
}
