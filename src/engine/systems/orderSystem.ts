/**
 * Order System — Validates and resolves entity order queues each tick.
 *
 * Responsibilities:
 * 1. Remove orders targeting dead/removed entities.
 * 2. Convert "attack" orders into "move" when target is out of attack range.
 * 3. Clear orders on dead entities.
 * 4. Pop completed gather orders when resource is depleted.
 *
 * Runs BEFORE movement so that movement always operates on valid orders.
 */

import { Attack, Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/**
 * Run one tick of the order validation system.
 * Cleans up stale orders and resolves attack-move transitions.
 */
export function runOrderSystem(world: GameWorld): void {
	for (const eid of world.runtime.alive) {
		const orders = world.runtime.orderQueues.get(eid);
		if (!orders || orders.length === 0) continue;

		const current = orders[0];

		// If this entity is dead, clear all orders
		if (Health.current[eid] <= 0) {
			orders.length = 0;
			continue;
		}

		// Validate orders targeting another entity
		if (current.targetEid !== undefined && current.targetEid !== 0) {
			const targetAlive = world.runtime.alive.has(current.targetEid);

			if (!targetAlive) {
				// Target is dead/removed — pop the order
				orders.shift();
				continue;
			}
		}

		// Attack order: if target exists, convert to move toward target position
		// once target is in attack range, the combat system handles the rest
		if (current.type === "attack" && current.targetEid !== undefined) {
			const targetEid = current.targetEid;
			if (!world.runtime.alive.has(targetEid)) {
				orders.shift();
				continue;
			}

			// Check if we need to move closer to attack
			const range = Attack.range[eid];
			if (range <= 0) {
				// Can't attack without range, discard
				orders.shift();
				continue;
			}

			const ax = Position.x[eid];
			const ay = Position.y[eid];
			const bx = Position.x[targetEid];
			const by = Position.y[targetEid];
			const dx = bx - ax;
			const dy = by - ay;
			const distSq = dx * dx + dy * dy;
			const rangeSq = range * range;

			if (distSq > rangeSq) {
				// Out of range — update move target to current enemy position
				current.targetX = bx;
				current.targetY = by;
			}
			// If in range, combat system will handle the actual attack
		}

		// Gather order: validate resource target still exists
		if (current.type === "gather" && current.targetEid !== undefined) {
			const targetEid = current.targetEid;
			if (!world.runtime.alive.has(targetEid) || Flags.isResource[targetEid] !== 1) {
				orders.shift();
				continue;
			}
		}
	}
}
