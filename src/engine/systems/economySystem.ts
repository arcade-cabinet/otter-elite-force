/**
 * Economy System — Resource gathering for worker units.
 *
 * Workers with "gather" orders that are near a resource node accumulate
 * resources. The rate is 1 unit of resource per 2 seconds of gathering.
 *
 * Resource types are determined by the entityTypeIndex entry on the
 * resource node (e.g., "fish_node", "timber_node", "salvage_node").
 */

import { Content, Flags, Position } from "@/engine/world/components";
import { CATEGORY_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Distance (in pixels) at which a worker can gather from a resource node. */
const GATHER_RANGE = 48;

/** Seconds of gathering per 1 resource unit. */
const GATHER_INTERVAL = 2;

/** Per-worker accumulated gather time (eid -> seconds). */
const gatherTimers = new Map<number, number>();

/** Determine the resource type from a resource entity's type string. */
function resolveResourceType(
	nodeType: string | undefined,
): "fish" | "timber" | "salvage" | null {
	if (!nodeType) return null;
	if (nodeType.includes("fish")) return "fish";
	if (nodeType.includes("timber")) return "timber";
	if (nodeType.includes("salvage")) return "salvage";
	return null;
}

/**
 * Run one tick of the economy system.
 * Processes gathering and passive income.
 */
export function runEconomySystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const eid of world.runtime.alive) {
		// Only process workers
		if (Content.categoryId[eid] !== CATEGORY_IDS.worker) continue;

		const orders = world.runtime.orderQueues.get(eid);
		if (!orders || orders.length === 0) continue;

		const currentOrder = orders[0];
		if (currentOrder.type !== "gather") continue;

		const targetEid = currentOrder.targetEid;
		if (targetEid === undefined) continue;

		// Verify target is a resource and is alive
		if (!world.runtime.alive.has(targetEid)) {
			orders.shift();
			gatherTimers.delete(eid);
			continue;
		}
		if (Flags.isResource[targetEid] !== 1) {
			orders.shift();
			gatherTimers.delete(eid);
			continue;
		}

		// Check distance to resource
		const wx = Position.x[eid];
		const wy = Position.y[eid];
		const rx = Position.x[targetEid];
		const ry = Position.y[targetEid];
		const dx = rx - wx;
		const dy = ry - wy;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > GATHER_RANGE) continue;

		// Accumulate gather time
		const prevTimer = gatherTimers.get(eid) ?? 0;
		const newTimer = prevTimer + deltaSec;

		if (newTimer >= GATHER_INTERVAL) {
			// Determine resource type from entity type index
			const nodeType = world.runtime.entityTypeIndex.get(targetEid);
			const resourceType = resolveResourceType(nodeType);

			if (resourceType) {
				world.session.resources[resourceType] += 1;
			}

			gatherTimers.set(eid, newTimer - GATHER_INTERVAL);
		} else {
			gatherTimers.set(eid, newTimer);
		}
	}
}

/** Reset internal gather timers (for new missions/tests). */
export function resetGatherTimers(): void {
	gatherTimers.clear();
}
