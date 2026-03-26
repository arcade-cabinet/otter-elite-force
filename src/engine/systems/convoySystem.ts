/**
 * Convoy System — Moves convoy entities along predefined waypoint routes.
 *
 * Convoy routes are stored in world.runtime.convoyRoutes as arrays of
 * {x, y} waypoints. Each tick, the convoy entity moves toward its
 * next waypoint at a fixed speed.
 *
 * Pure function on GameWorld.
 */

import { Position, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Arrival threshold in pixels for waypoint completion. */
const WAYPOINT_THRESHOLD = 4;

/**
 * Run one tick of the convoy system.
 * Convoy entities follow their assigned routes.
 */
export function runConvoySystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const [eid, route] of world.runtime.convoyRoutes) {
		if (!world.runtime.alive.has(eid)) continue;
		if (route.length === 0) continue;

		const target = route[0];
		const px = Position.x[eid];
		const py = Position.y[eid];
		const dx = target.x * 32 + 16 - px;
		const dy = target.y * 32 + 16 - py;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= WAYPOINT_THRESHOLD) {
			// Reached waypoint — advance to next
			Position.x[eid] = target.x * 32 + 16;
			Position.y[eid] = target.y * 32 + 16;
			route.shift();

			if (route.length === 0) {
				// Convoy reached destination
				world.events.push({
					type: "convoy-arrived",
					payload: { eid },
				});
			}
			continue;
		}

		// Move toward waypoint
		const speed = Speed.value[eid] > 0 ? Speed.value[eid] : 32;
		const step = Math.min(speed * deltaSec, dist);
		const nx = dx / dist;
		const ny = dy / dist;
		Position.x[eid] = px + nx * step;
		Position.y[eid] = py + ny * step;
	}
}
