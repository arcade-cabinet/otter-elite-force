/**
 * Loot System — Resource drops from destroyed enemy entities.
 * Pure function on GameWorld.
 */

import { Faction, Flags } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Base salvage per destroyed enemy unit. */
const LOOT_SALVAGE = 5;

/** Base salvage per destroyed enemy building. */
const BUILDING_LOOT_SALVAGE = 15;

/**
 * Run one tick of the loot system.
 * Grants resources when enemy entities are removed.
 */
export function runLootSystem(world: GameWorld): void {
	for (const eid of world.runtime.removals) {
		if (Faction.id[eid] !== FACTION_IDS.scale_guard) continue;
		if (Flags.isResource[eid] === 1) continue;

		const loot = Flags.isBuilding[eid] === 1 ? BUILDING_LOOT_SALVAGE : LOOT_SALVAGE;
		world.session.resources.salvage += loot;

		world.events.push({
			type: "loot-collected",
			payload: { eid, salvage: loot },
		});
	}
}
