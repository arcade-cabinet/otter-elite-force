/**
 * Movement System — Simple grid movement toward order targets.
 *
 * Each frame:
 * 1. For each alive entity with a move order, move toward the target at Speed.
 * 2. When within 2px of the target, pop the order.
 * 3. Skip entities with no orders or no move orders.
 *
 * No Yuka pathfinding — that is a later phase. Movement is direct line-of-sight.
 */

import { Position, Speed, Facing } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Arrival threshold in pixels. */
const ARRIVAL_THRESHOLD = 2;

/**
 * Run one tick of the movement system.
 * Entities with "move" orders advance toward their target position.
 */
export function runMovementSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const eid of world.runtime.alive) {
		const orders = world.runtime.orderQueues.get(eid);
		if (!orders || orders.length === 0) continue;

		const currentOrder = orders[0];
		if (currentOrder.type !== "move") continue;

		const targetX = currentOrder.targetX;
		const targetY = currentOrder.targetY;
		if (targetX === undefined || targetY === undefined) {
			orders.shift();
			continue;
		}

		const px = Position.x[eid];
		const py = Position.y[eid];
		const dx = targetX - px;
		const dy = targetY - py;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= ARRIVAL_THRESHOLD) {
			Position.x[eid] = targetX;
			Position.y[eid] = targetY;
			orders.shift();
			continue;
		}

		const speed = Speed.value[eid];
		if (speed <= 0) continue;

		const step = Math.min(speed * deltaSec, dist);
		const nx = dx / dist;
		const ny = dy / dist;

		Position.x[eid] = px + nx * step;
		Position.y[eid] = py + ny * step;

		// Update facing direction from movement vector
		Facing.radians[eid] = Math.atan2(ny, nx);
	}
}
