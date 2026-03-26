/**
 * Demolition System — Handles explosive charges and area damage.
 * Pure function on GameWorld.
 */

import { Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";

/** Explosion radius in pixels. */
const EXPLOSION_RADIUS = 96;

/** Explosion damage. */
const EXPLOSION_DAMAGE = 25;

/**
 * Run one tick of the demolition system.
 * Processes detonation events and applies area damage.
 */
export function runDemolitionSystem(world: GameWorld): void {
	// Process demolition events
	const detonations = world.events.filter((e) => e.type === "detonate");

	for (const event of detonations) {
		const cx = Number(event.payload?.x ?? 0);
		const cy = Number(event.payload?.y ?? 0);
		const radiusSq = EXPLOSION_RADIUS * EXPLOSION_RADIUS;

		for (const eid of world.runtime.alive) {
			const dx = Position.x[eid] - cx;
			const dy = Position.y[eid] - cy;
			if (dx * dx + dy * dy <= radiusSq) {
				Health.current[eid] -= EXPLOSION_DAMAGE;
				if (Health.current[eid] <= 0) {
					markForRemoval(world, eid);
				}
			}
		}

		world.events.push({ type: "explosion", payload: { x: cx, y: cy, radius: EXPLOSION_RADIUS } });
	}
}
