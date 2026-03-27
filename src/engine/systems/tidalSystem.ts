/**
 * Tidal System — Periodic water level changes affecting terrain accessibility.
 *
 * Four-phase tidal cycle: low (35%) -> rising (15%) -> high (35%) -> falling (15%)
 * - Terrain conversion in tidal zones: water<->beach when tide changes
 * - Unit displacement damage (15 HP) to entities caught in rising->high transition
 * - Nav graph rebuild trigger on phase changes that alter walkability
 * - Configurable tidal zone rects from world.runtime
 *
 * Used in Mission 7 (River Rats) and Mission 8 (Underwater Cache).
 * Pure function on GameWorld.
 */

import { TerrainTypeId } from "@/engine/content/terrainTypes";
import { Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Damage dealt to units caught in a rising tide (HP). */
const TIDAL_DISPLACEMENT_DAMAGE = 15;

/** Phase order within a single cycle. */
export type TidalPhase = "low" | "rising" | "high" | "falling";

const PHASE_ORDER: TidalPhase[] = ["low", "rising", "high", "falling"];

/** Fraction of the cycle each phase occupies (sums to 1). */
const PHASE_DURATIONS: Record<TidalPhase, number> = {
	low: 0.35,
	rising: 0.15,
	high: 0.35,
	falling: 0.15,
};

/** Default tidal cycle period in seconds. */
const DEFAULT_CYCLE_TIME = 120;

// ---------------------------------------------------------------------------
// Runtime state augmentation
// ---------------------------------------------------------------------------

export interface TidalZoneRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface TidalRuntime {
	/** Current tidal phase. */
	tidalPhase?: TidalPhase;
	/** Elapsed time in seconds for the tidal cycle. */
	tidalElapsed?: number;
	/** Full cycle duration in seconds. */
	tidalCycleTime?: number;
	/** Zones that are affected by tides. */
	tidalZones?: TidalZoneRect[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine which phase the cycle is in based on elapsed time.
 */
export function phaseAtTime(elapsed: number, cycleTime: number): TidalPhase {
	const t = (elapsed % cycleTime) / cycleTime;
	let cumulative = 0;
	for (const phase of PHASE_ORDER) {
		cumulative += PHASE_DURATIONS[phase];
		if (t < cumulative) return phase;
	}
	return "low";
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the tidal system.
 * Advances tidal cycle, converts terrain on phase transitions,
 * deals displacement damage, and triggers nav rebuild events.
 */
export function runTidalSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const runtime = world.runtime as unknown as TidalRuntime & GameWorld["runtime"];

	// Initialize tidal state if not yet present (preserve pre-configured values)
	if (runtime.tidalPhase === undefined) {
		runtime.tidalPhase = "low";
		runtime.tidalElapsed = runtime.tidalElapsed ?? 0;
		runtime.tidalCycleTime = runtime.tidalCycleTime ?? DEFAULT_CYCLE_TIME;
		runtime.tidalZones = runtime.tidalZones ?? [];
	}

	const prevPhase = runtime.tidalPhase;
	const newElapsed = (runtime.tidalElapsed ?? 0) + deltaSec;
	const cycleTime = runtime.tidalCycleTime ?? DEFAULT_CYCLE_TIME;

	const nextPhase = phaseAtTime(newElapsed, cycleTime);

	// Update elapsed and phase
	runtime.tidalElapsed = newElapsed;
	runtime.tidalPhase = nextPhase;

	// Only act on phase transitions
	if (nextPhase === prevPhase) return;

	world.events.push({ type: "tidal-change", payload: { phase: nextPhase, prevPhase } });

	// Convert terrain in tidal zones
	const terrainGrid = world.runtime.terrainGrid;
	const zones = runtime.tidalZones ?? [];
	if (!terrainGrid || zones.length === 0) return;

	const gridHeight = terrainGrid.length;
	const gridWidth = gridHeight > 0 ? (terrainGrid[0]?.length ?? 0) : 0;

	for (const zone of zones) {
		const xEnd = Math.min(zone.x + zone.width, gridWidth);
		const yEnd = Math.min(zone.y + zone.height, gridHeight);

		if (nextPhase === "high") {
			// Flood: convert tidal zone tiles to water
			for (let y = zone.y; y < yEnd; y++) {
				for (let x = zone.x; x < xEnd; x++) {
					if (y >= 0 && x >= 0) {
						terrainGrid[y][x] = TerrainTypeId.water;
					}
				}
			}

			// Damage/displace units standing in the flooded zone
			for (const eid of world.runtime.alive) {
				if (Flags.isBuilding[eid] === 1) continue;
				if (Flags.isProjectile[eid] === 1) continue;

				const px = Position.x[eid];
				const py = Position.y[eid];
				const tx = Math.floor(px);
				const ty = Math.floor(py);

				if (tx >= zone.x && tx < xEnd && ty >= zone.y && ty < yEnd) {
					// Skip swimmers — they handle water fine
					if (Flags.canSwim[eid] === 1) continue;

					Health.current[eid] -= TIDAL_DISPLACEMENT_DAMAGE;
					world.events.push({
						type: "tidal-displacement",
						payload: { eid, x: px, y: py, damage: TIDAL_DISPLACEMENT_DAMAGE },
					});

					if (Health.current[eid] <= 0) {
						markForRemoval(world, eid);
					}
				}
			}
		} else if (nextPhase === "low") {
			// Drain: convert tidal zone tiles back to beach (passable)
			for (let y = zone.y; y < yEnd; y++) {
				for (let x = zone.x; x < xEnd; x++) {
					if (y >= 0 && x >= 0) {
						terrainGrid[y][x] = TerrainTypeId.beach;
					}
				}
			}
		}
	}

	// Emit nav graph rebuild for phase transitions that change walkability
	if (nextPhase === "high" || nextPhase === "low") {
		world.events.push({
			type: "nav-rebuild-needed",
			payload: { reason: "tidal-phase-change", phase: nextPhase },
		});
	}
}

// ---------------------------------------------------------------------------
// Reset (for tests and new missions)
// ---------------------------------------------------------------------------

/** Reset tidal state on the runtime. */
export function resetTidalState(world: GameWorld): void {
	const runtime = world.runtime as unknown as TidalRuntime;
	runtime.tidalPhase = undefined;
	runtime.tidalElapsed = undefined;
	runtime.tidalCycleTime = undefined;
	runtime.tidalZones = undefined;
}
