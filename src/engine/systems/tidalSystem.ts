/**
 * Tidal System — Periodic water level changes affecting terrain accessibility.
 * Used in Mission 7 (River Rats) and Mission 8 (Underwater Cache).
 * Pure function on GameWorld.
 */

import type { GameWorld } from "@/engine/world/gameWorld";

/** Tidal cycle period in seconds. */
const TIDAL_PERIOD = 120;

/**
 * Run one tick of the tidal system.
 * Emits tidal phase events based on elapsed time.
 */
export function runTidalSystem(world: GameWorld): void {
	const elapsedSec = world.time.elapsedMs / 1000;
	const phase = Math.floor(elapsedSec / TIDAL_PERIOD) % 2;
	const tide = phase === 0 ? "low" : "high";

	const lastTide = (world.runtime as TidalRuntime).lastTide;
	if (lastTide !== tide) {
		(world.runtime as TidalRuntime).lastTide = tide;
		world.events.push({ type: "tidal-change", payload: { tide } });
	}
}

export interface TidalRuntime { lastTide?: string; }
