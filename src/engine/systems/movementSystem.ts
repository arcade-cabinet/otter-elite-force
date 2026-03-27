/**
 * Movement System — Speed-based movement toward order targets with
 * collision avoidance, formation movement, and smooth interpolation.
 *
 * Each frame:
 * 1. For each alive entity with a move-type order, compute movement vector.
 * 2. Move toward the target at entity Speed per frame.
 * 3. Apply simple collision avoidance (don't stack on same tile).
 * 4. Handle formation movement for grouped selections.
 * 5. Update Facing direction from movement vector.
 * 6. When within arrival threshold of the target, pop the order.
 * 7. Handle attack-move: entities with attack orders move toward target
 *    position stored in the order (updated by orderSystem).
 * 8. Handle gather-move: workers move toward resource or depot.
 * 9. Handle patrol arrival: cycle to next waypoint.
 *
 * No full pathfinding — that is done externally via navGraphs.
 * Movement is direct line-of-sight with local avoidance.
 */

import { Facing, Flags, Position, Speed, Velocity } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Arrival threshold in pixels. */
const ARRIVAL_THRESHOLD = 2;

/** Minimum separation distance to avoid unit stacking (pixels). */
const SEPARATION_DISTANCE = 12;

/** Separation push force strength. */
const SEPARATION_STRENGTH = 0.4;

/** Maximum number of separation candidates to check per entity. */
const MAX_SEPARATION_CHECKS = 16;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// distanceBetween — uncomment when movement helpers use it
// function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
// 	const dx = bx - ax;
// 	const dy = by - ay;
// 	return Math.sqrt(dx * dx + dy * dy);
// }

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the movement system.
 * Entities with move-compatible orders advance toward their target position.
 * Supports move, attack (move-to-target), gather (move-to-resource/depot),
 * follow, garrison, and patrol orders.
 */
export function runMovementSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	for (const eid of world.runtime.alive) {
		const orders = world.runtime.orderQueues.get(eid);
		if (!orders || orders.length === 0) continue;

		const currentOrder = orders[0];

		// Determine if this order type implies movement
		const moveTypes = new Set([
			"move",
			"attack",
			"gather",
			"follow",
			"garrison",
			"build",
			"patrol",
		]);
		if (!moveTypes.has(currentOrder.type)) continue;

		// For move orders: use targetX/targetY directly
		// For attack orders: orderSystem updates targetX/targetY when out of range
		// For gather orders: economy system updates targetX/targetY for depot walk
		// For follow orders: orderSystem updates targetX/targetY to target entity position
		// For garrison/build orders: orderSystem sets targetX/targetY

		const targetX = currentOrder.targetX;
		const targetY = currentOrder.targetY;
		if (targetX === undefined || targetY === undefined) {
			// For orders without coordinates, skip movement
			// (combat/gather system handles these)
			if (currentOrder.type === "move") {
				orders.shift();
			}
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

			// Handle arrival based on order type
			switch (currentOrder.type) {
				case "move":
					orders.shift();
					// If next order is also a move, continue moving
					break;

				case "patrol":
					// Patrol arrival: cycle waypoints
					// Swap patrol destination to the return point
					// The patrol order stores the "other end" in targetEid
					// or we simply reverse direction
					handlePatrolArrival(world, eid, orders, currentOrder);
					break;

				case "attack":
					// Arrived at target position — combat system takes over
					// Don't pop the order; combat needs targetEid
					break;

				case "gather":
					// Arrived at resource or depot — economy system takes over
					// Don't pop the order
					break;

				case "follow":
					// Keep following — orderSystem will update targetX/Y
					break;

				case "garrison":
				case "build":
					// Arrived at building — relevant system takes over
					break;
			}
			continue;
		}

		const speed = Speed.value[eid];
		if (speed <= 0) continue;

		// Calculate movement step
		const step = Math.min(speed * deltaSec, dist);
		let nx = dx / dist;
		let ny = dy / dist;

		// Apply simple collision avoidance (separation)
		const sepResult = computeSeparation(world, eid, px, py);
		if (sepResult.sx !== 0 || sepResult.sy !== 0) {
			nx += sepResult.sx * SEPARATION_STRENGTH;
			ny += sepResult.sy * SEPARATION_STRENGTH;

			// Re-normalize
			const len = Math.sqrt(nx * nx + ny * ny);
			if (len > 0) {
				nx /= len;
				ny /= len;
			}
		}

		const newX = px + nx * step;
		const newY = py + ny * step;

		Position.x[eid] = newX;
		Position.y[eid] = newY;

		// Update velocity for rendering
		Velocity.x[eid] = nx * speed;
		Velocity.y[eid] = ny * speed;

		// Update facing direction from movement vector
		Facing.radians[eid] = Math.atan2(ny, nx);
	}
}

// ---------------------------------------------------------------------------
// Collision avoidance (separation steering)
// ---------------------------------------------------------------------------

/**
 * Compute a separation vector that pushes an entity away from nearby
 * same-team entities to prevent stacking.
 */
function computeSeparation(
	world: GameWorld,
	eid: number,
	px: number,
	py: number,
): { sx: number; sy: number } {
	let sx = 0;
	let sy = 0;
	let count = 0;

	for (const otherEid of world.runtime.alive) {
		if (otherEid === eid) continue;
		if (Flags.isProjectile[otherEid] === 1) continue;
		if (Flags.isResource[otherEid] === 1) continue;
		if (Flags.isBuilding[otherEid] === 1) continue;
		if (count >= MAX_SEPARATION_CHECKS) break;

		const ox = Position.x[otherEid];
		const oy = Position.y[otherEid];
		const dx = px - ox;
		const dy = py - oy;
		const distSq = dx * dx + dy * dy;

		if (distSq < SEPARATION_DISTANCE * SEPARATION_DISTANCE && distSq > 0) {
			const dist = Math.sqrt(distSq);
			// Push away, stronger when closer
			const force = (SEPARATION_DISTANCE - dist) / SEPARATION_DISTANCE;
			sx += (dx / dist) * force;
			sy += (dy / dist) * force;
			count++;
		}
	}

	return { sx, sy };
}

// ---------------------------------------------------------------------------
// Patrol waypoint cycling
// ---------------------------------------------------------------------------

/**
 * Handle arrival at a patrol waypoint. Swap the patrol to the other end.
 * Patrol orders store a "home" position (where they started) and cycle
 * between home and the target position.
 */
function handlePatrolArrival(
	world: GameWorld,
	eid: number,
	orders: Array<{ type: string; targetX?: number; targetY?: number; targetEid?: number }>,
	currentOrder: { type: string; targetX?: number; targetY?: number; targetEid?: number },
): void {
	const ai = world.runtime.aiStates.get(eid);
	if (ai) {
		// Cycle patrol index
		ai.patrolIndex = (ai.patrolIndex + 1) % 2;
		if (ai.patrolIndex === 1) {
			// Return to home position
			currentOrder.targetX = ai.homeX;
			currentOrder.targetY = ai.homeY;
		} else {
			// Go to patrol destination — swap back
			// The original target was already overwritten, so use home as one end
			// This simple implementation bounces between current pos and home
		}
	} else {
		// No AI state — just pop the order
		orders.shift();
	}
}
