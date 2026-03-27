/**
 * Production System — Building unit queues and construction progress.
 *
 * Each frame:
 * 1. Advance production progress on buildings with active queues.
 * 2. When production completes, spawn the unit and dequeue.
 */

import { Flags, Position } from "@/engine/world/components";
import type { GameWorld, ProductionEntry } from "@/engine/world/gameWorld";
import { spawnUnit } from "@/engine/world/gameWorld";

/**
 * Run one tick of the production system.
 * Advances build queues and construction progress.
 */
export function runProductionSystem(world: GameWorld): void {
	const deltaMs = world.time.deltaMs;
	if (deltaMs <= 0) return;

	for (const eid of world.runtime.alive) {
		// Only process buildings
		if (Flags.isBuilding[eid] !== 1) continue;

		const queue = world.runtime.productionQueues.get(eid);
		if (!queue || queue.length === 0) continue;

		const current: ProductionEntry = queue[0];

		// buildTime is stored in ms; progress is 0-100%
		// If buildTime is 0, complete immediately
		if (current.progress < 100) {
			const buildTimeMs = getBuildTimeMs(current);
			if (buildTimeMs <= 0) {
				current.progress = 100;
			} else {
				current.progress += (deltaMs / buildTimeMs) * 100;
			}
		}

		if (current.progress >= 100) {
			// Spawn the unit near the building
			const spawnX = Position.x[eid] + 32;
			const spawnY = Position.y[eid];

			spawnUnit(world, {
				x: spawnX,
				y: spawnY,
				unitType: current.contentId,
			});

			queue.shift();
		}
	}
}

/** Extract build time in ms from a ProductionEntry. */
function getBuildTimeMs(entry: ProductionEntry): number {
	// ProductionEntry can carry buildTimeMs as an extended field.
	// A value of 0 means "instant build". Fall back to 5000ms default
	// only when the field is absent.
	if (
		"buildTimeMs" in entry &&
		typeof (entry as { buildTimeMs?: unknown }).buildTimeMs === "number"
	) {
		return (entry as { buildTimeMs: number }).buildTimeMs;
	}
	return 5000;
}
