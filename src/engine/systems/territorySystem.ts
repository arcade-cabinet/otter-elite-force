/**
 * Territory System — Tracks zone control by faction.
 * Pure function on GameWorld.
 */

import { Faction, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/**
 * Run one tick of the territory system.
 * Counts units per faction in each zone and emits control events.
 */
export function runTerritorySystem(world: GameWorld): void {
	for (const [zoneId, rect] of world.runtime.zoneRects) {
		let uraCount = 0;
		let scaleCount = 0;

		for (const eid of world.runtime.alive) {
			const x = Position.x[eid];
			const y = Position.y[eid];
			if (x < rect.x || x >= rect.x + rect.width || y < rect.y || y >= rect.y + rect.height) {
				continue;
			}
			if (Faction.id[eid] === 1) uraCount++;
			else if (Faction.id[eid] === 2) scaleCount++;
		}

		const controller = uraCount > scaleCount ? "ura" : scaleCount > uraCount ? "scale_guard" : "contested";
		world.events.push({
			type: "zone-control",
			payload: { zoneId, controller, uraCount, scaleCount },
		});
	}
}
