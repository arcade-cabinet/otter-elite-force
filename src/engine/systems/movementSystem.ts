/**
 * Movement System — A* pathfinding-based movement with collision avoidance.
 *
 * Each frame:
 * 1. For each alive entity with a move-type order, compute a path if needed.
 * 2. Use cached A* waypoints from the nav graph (if available).
 * 3. Move toward the next waypoint at entity Speed per frame.
 * 4. When reaching a waypoint, advance to the next one.
 * 5. When all waypoints are reached, pop the order.
 * 6. If no path found (target unreachable), clear the order.
 * 7. Apply simple collision avoidance (separation steering).
 * 8. Update Facing direction from movement vector.
 * 9. Handle patrol arrival: cycle to next waypoint.
 *
 * Uses A* pathfinding via the existing src/ai/pathfinder.ts when a nav graph
 * is available on world.runtime.navGraphs.get("main"). Falls back to direct
 * line-of-sight movement when no graph is present.
 */

import type { Graph } from "yuka";
import { findPath } from "@/ai/pathfinder";
import { Facing, Flags, Position, Speed, Velocity } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Arrival threshold in pixels. */
const ARRIVAL_THRESHOLD = 2;

/** Waypoint arrival threshold in pixels (slightly larger for smooth path following). */
const WAYPOINT_THRESHOLD = 4;

/** Minimum separation distance to avoid unit stacking (pixels). */
const SEPARATION_DISTANCE = 12;

/** Separation push force strength. */
const SEPARATION_STRENGTH = 0.4;

/** Maximum number of separation candidates to check per entity. */
const MAX_SEPARATION_CHECKS = 16;

/** Tile size in pixels (must match the game's TILE_SIZE). */
const TILE_SIZE = 32;

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the movement system.
 * Entities with move-compatible orders advance toward their target position
 * using A* pathfinding when a nav graph is available.
 */
export function runMovementSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const navGraph = world.runtime.navGraphs.get("main") as Graph | undefined;
	const navWidth = world.navigation.width;

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
				world.runtime.pathWaypoints.delete(eid);
			}
			continue;
		}

		const px = Position.x[eid];
		const py = Position.y[eid];

		// Check if we've arrived at the final order target
		const dxFinal = targetX - px;
		const dyFinal = targetY - py;
		const distFinal = Math.sqrt(dxFinal * dxFinal + dyFinal * dyFinal);

		if (distFinal <= ARRIVAL_THRESHOLD) {
			Position.x[eid] = targetX;
			Position.y[eid] = targetY;
			world.runtime.pathWaypoints.delete(eid);

			// Handle arrival based on order type
			switch (currentOrder.type) {
				case "move":
					orders.shift();
					break;

				case "patrol":
					handlePatrolArrival(world, eid, orders, currentOrder);
					break;

				case "attack":
					// Arrived at target position -- combat system takes over
					break;

				case "gather":
					// Arrived at resource or depot -- economy system takes over
					break;

				case "follow":
					// Keep following -- orderSystem will update targetX/Y
					break;

				case "garrison":
				case "build":
					// Arrived at building -- relevant system takes over
					break;
			}
			continue;
		}

		const speed = Speed.value[eid];
		if (speed <= 0) continue;

		// ── Resolve next movement target (waypoint or direct) ──
		let moveToX = targetX;
		let moveToY = targetY;

		if (navGraph && navWidth > 0) {
			// Try to get or compute A* path waypoints
			let waypoints = world.runtime.pathWaypoints.get(eid);

			if (!waypoints) {
				// Compute A* path from current position to target
				const fromTileX = Math.floor(px / TILE_SIZE);
				const fromTileY = Math.floor(py / TILE_SIZE);
				const toTileX = Math.floor(targetX / TILE_SIZE);
				const toTileY = Math.floor(targetY / TILE_SIZE);

				const yukaPath = findPath(
					navGraph,
					{ x: fromTileX, y: fromTileY },
					{ x: toTileX, y: toTileY },
					navWidth,
				);

				if (yukaPath.length === 0) {
					// No path found -- target unreachable, clear the order
					if (currentOrder.type === "move") {
						orders.shift();
					}
					world.runtime.pathWaypoints.delete(eid);
					continue;
				}

				// Convert Yuka Vector3 (x, 0, y) tile coords to pixel coords
				// Skip the first waypoint if it's the tile we're already on
				const pixelWaypoints: Array<{ x: number; y: number }> = [];
				for (const wp of yukaPath) {
					pixelWaypoints.push({
						x: wp.x * TILE_SIZE + TILE_SIZE / 2,
						y: wp.z * TILE_SIZE + TILE_SIZE / 2,
					});
				}

				// Skip waypoints we've already passed (the first tile is usually our own)
				if (pixelWaypoints.length > 1) {
					const firstDx = pixelWaypoints[0].x - px;
					const firstDy = pixelWaypoints[0].y - py;
					const firstDist = Math.sqrt(firstDx * firstDx + firstDy * firstDy);
					if (firstDist < WAYPOINT_THRESHOLD) {
						pixelWaypoints.shift();
					}
				}

				// Add the exact target position as the final waypoint
				// (A* gives tile centers; the order target may be within a tile)
				if (pixelWaypoints.length > 0) {
					const last = pixelWaypoints[pixelWaypoints.length - 1];
					const dxLast = targetX - last.x;
					const dyLast = targetY - last.y;
					if (Math.sqrt(dxLast * dxLast + dyLast * dyLast) > ARRIVAL_THRESHOLD) {
						pixelWaypoints.push({ x: targetX, y: targetY });
					}
				}

				waypoints = pixelWaypoints;
				world.runtime.pathWaypoints.set(eid, waypoints);
			}

			if (waypoints && waypoints.length > 0) {
				// Move toward the next waypoint
				const nextWp = waypoints[0];
				const wpDx = nextWp.x - px;
				const wpDy = nextWp.y - py;
				const wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);

				if (wpDist <= WAYPOINT_THRESHOLD) {
					// Reached this waypoint -- advance to next
					waypoints.shift();
					if (waypoints.length === 0) {
						// All waypoints consumed -- move directly to final target
						world.runtime.pathWaypoints.delete(eid);
						moveToX = targetX;
						moveToY = targetY;
					} else {
						moveToX = waypoints[0].x;
						moveToY = waypoints[0].y;
					}
				} else {
					moveToX = nextWp.x;
					moveToY = nextWp.y;
				}
			}
		}

		// ── Move toward the resolved target ──
		const dx = moveToX - px;
		const dy = moveToY - py;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist <= 0) continue;

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
			// Go to patrol destination -- swap back
			// The original target was already overwritten, so use home as one end
			// This simple implementation bounces between current pos and home
		}
		// Clear cached path so next tick recomputes A*
		world.runtime.pathWaypoints.delete(eid);
	} else {
		// No AI state -- just pop the order
		orders.shift();
	}
}
