/**
 * Environment Traits — dynamic terrain state for mission-specific mechanics.
 *
 * TidalState: Mission 3-3 tidal cycles (low/rising/high/falling).
 * FireState:  Mission 3-2 fire spread on flammable terrain.
 *
 * Both are world-level singletons, added by mission init when the scenario
 * requires them (not every mission needs tides or fire).
 */

import { trait } from "koota";

/** Tidal phase names in cycle order. */
export type TidalPhase = "low" | "rising" | "high" | "falling";

/**
 * World-level singleton: tracks the current tidal cycle.
 *
 * cycleTime = seconds for one full low→rising→high→falling→low revolution.
 * tidalZones = rectangular areas that flip between land and water as the tide changes.
 */
export const TidalState = trait(() => ({
	phase: "low" as TidalPhase,
	/** Seconds per full tidal cycle. */
	cycleTime: 180,
	/** Elapsed seconds within the current cycle. */
	elapsed: 0,
	/** Tile rectangles that convert between land and water on tide changes. */
	tidalZones: [] as Array<{ x: number; y: number; w: number; h: number }>,
}));

/**
 * World-level singleton: tracks active fires and spread parameters.
 *
 * activeFires = list of burning tiles with start time and duration.
 * spreadRadius = how many adjacent tiles can catch fire each tick.
 * damagePerSecond = HP/sec applied to units standing on a fire tile.
 */
export const FireState = trait(() => ({
	activeFires: [] as Array<{
		x: number;
		y: number;
		startTime: number;
		duration: number;
	}>,
	/** Max tile distance for fire spread checks. */
	spreadRadius: 2,
	/** Damage per second to units on a burning tile. */
	damagePerSecond: 5,
}));
