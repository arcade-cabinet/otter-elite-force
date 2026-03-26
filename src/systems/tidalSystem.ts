/**
 * Tidal System — advances the tidal cycle and converts terrain on phase transitions.
 *
 * Mission 3-3: coastal tidal zones alternate between land and water
 * on a configurable timer. When the tide rises to "high", tidal zone
 * tiles become water (impassable to non-swimmers) and units standing
 * there take displacement damage. When the tide drops to "low", those
 * tiles revert to passable beach terrain.
 *
 * Nav graph is rebuilt only on phase transitions (expensive operation).
 *
 * Spec reference: §8.1 Tilemap, §8.3 Pathfinding
 */

import type { World } from "koota";
import { buildGraphFromTilemap } from "../ai/graphBuilder";
import type { TerrainType } from "../ai/terrainTypes";
import { Health } from "../ecs/traits/combat";
import { TidalState, type TidalPhase } from "../ecs/traits/environment";
import { Position } from "../ecs/traits/spatial";
import { NavGraphState } from "../ecs/traits/state";
import { EventBus } from "../game/EventBus";

/** Damage dealt to units caught in a rising tide (HP). */
const TIDAL_DISPLACEMENT_DAMAGE = 15;

/** Phase order within a single cycle. */
const PHASE_ORDER: TidalPhase[] = ["low", "rising", "high", "falling"];

/** Fraction of the cycle each phase occupies (must sum to 1). */
const PHASE_DURATIONS: Record<TidalPhase, number> = {
	low: 0.35,
	rising: 0.15,
	high: 0.35,
	falling: 0.15,
};

/**
 * Determine which phase the cycle is in based on elapsed time.
 */
function phaseAtTime(elapsed: number, cycleTime: number): TidalPhase {
	const t = (elapsed % cycleTime) / cycleTime;
	let cumulative = 0;
	for (const phase of PHASE_ORDER) {
		cumulative += PHASE_DURATIONS[phase];
		if (t < cumulative) return phase;
	}
	return "low";
}

/**
 * Tick the tidal system. Call once per frame from the game loop.
 *
 * @param world  ECS world (must have TidalState singleton added).
 * @param delta  Frame delta in seconds.
 * @param terrainGrid  Mutable terrain grid — tiles are overwritten on phase change.
 */
export function tidalSystem(
	world: World,
	delta: number,
	terrainGrid: TerrainType[][] | null,
): void {
	const tidal = world.get(TidalState);
	if (!tidal) return;

	const prevPhase = tidal.phase;
	const newElapsed = tidal.elapsed + delta;

	const nextPhase = phaseAtTime(newElapsed, tidal.cycleTime);
	world.set(TidalState, {
		...tidal,
		elapsed: newElapsed,
		phase: nextPhase,
	});

	// Only act on phase transitions
	if (nextPhase === prevPhase) return;

	EventBus.emit("tide-changed", { phase: nextPhase });

	// Convert terrain in tidal zones
	if (!terrainGrid) return;

	const height = terrainGrid.length;
	const width = height > 0 ? terrainGrid[0].length : 0;

	for (const zone of tidal.tidalZones) {
		const xEnd = Math.min(zone.x + zone.w, width);
		const yEnd = Math.min(zone.y + zone.h, height);

		if (nextPhase === "high") {
			// Flood: convert tidal zone tiles to water
			for (let y = zone.y; y < yEnd; y++) {
				for (let x = zone.x; x < xEnd; x++) {
					terrainGrid[y][x] = "water" as TerrainType;
				}
			}

			// Damage/displace units standing in the flooded zone
			const units = world.query(Health, Position);
			for (const unit of units) {
				const pos = unit.get(Position)!;
				const tx = Math.floor(pos.x);
				const ty = Math.floor(pos.y);

				if (tx >= zone.x && tx < xEnd && ty >= zone.y && ty < yEnd) {
					unit.set(Health, (prev) => ({
						current: prev.current - TIDAL_DISPLACEMENT_DAMAGE,
					}));
					EventBus.emit("under-attack", { x: pos.x, y: pos.y });
				}
			}
		} else if (nextPhase === "low") {
			// Drain: convert tidal zone tiles back to beach (passable)
			for (let y = zone.y; y < yEnd; y++) {
				for (let x = zone.x; x < xEnd; x++) {
					terrainGrid[y][x] = "beach" as TerrainType;
				}
			}
		}
	}

	// Rebuild nav graph on phase transitions that change walkability
	if (nextPhase === "high" || nextPhase === "low") {
		const navState = world.get(NavGraphState);
		if (navState && terrainGrid.length > 0) {
			const navGraph = buildGraphFromTilemap(terrainGrid, { eightWay: true });
			world.set(NavGraphState, {
				graph: navGraph,
				width: navState.width,
				height: navState.height,
			});
		}
	}
}
