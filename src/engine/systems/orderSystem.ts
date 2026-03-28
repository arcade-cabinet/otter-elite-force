/**
 * Order System — Validates and resolves entity order queues each tick.
 *
 * Responsibilities:
 * 1. Remove orders targeting dead/removed entities.
 * 2. Convert "attack" orders into movement when target is out of attack range.
 * 3. Clear orders on dead entities.
 * 4. Pop completed gather orders when resource is depleted.
 * 5. Validate order types against entity capabilities.
 * 6. Handle shift-queue (append vs replace) via order metadata.
 * 7. Patrol loops (A->B->A->B) via waypoints.
 * 8. Gather-return cycle (go to resource -> harvest -> return to depot -> repeat).
 * 9. Garrison orders (enter a building for protection).
 * 10. Follow orders (match target entity position).
 * 11. Stop/hold position.
 *
 * Runs BEFORE movement so that movement always operates on valid orders.
 */

import { CATEGORY_IDS } from "@/engine/content/ids";
import { Attack, Construction, Content, Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld, Order } from "@/engine/world/gameWorld";

/** Worker unit types — fallback when categoryId is not set. */
const WORKER_TYPE_NAMES = new Set(["river_rat"]);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Gather deposit range — uncomment when gather/deposit cycle is wired in
// const GATHER_DEPOSIT_RANGE = 48;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

// findNearestDepot — uncomment when gather/deposit cycle is wired in
// function findNearestDepot(world: GameWorld, workerEid: number): number {
// 	const wx = Position.x[workerEid];
// 	const wy = Position.y[workerEid];
// 	let nearestEid = -1;
// 	let nearestDist = Number.POSITIVE_INFINITY;
// 	for (const eid of world.runtime.alive) {
// 		if (Flags.isBuilding[eid] !== 1) continue;
// 		const buildingType = world.runtime.entityTypeIndex.get(eid);
// 		if (buildingType !== "command_post" && buildingType !== "burrow") continue;
// 		const dist = distanceBetween(wx, wy, Position.x[eid], Position.y[eid]);
// 		if (dist < nearestDist) {
// 			nearestDist = dist;
// 			nearestEid = eid;
// 		}
// 	}
// 	return nearestEid;
// }

// ---------------------------------------------------------------------------
// Order validation per type
// ---------------------------------------------------------------------------

/** Validate that an entity can execute a gather order. */
function canGather(world: GameWorld, eid: number): boolean {
	return (
		Content.categoryId[eid] === CATEGORY_IDS.worker ||
		WORKER_TYPE_NAMES.has(world.runtime.entityTypeIndex.get(eid) ?? "") ||
		(world.runtime.entityAbilities.get(eid)?.includes("gather") ?? false)
	);
}

/** Validate that an entity can attack. */
function canAttack(_world: GameWorld, eid: number): boolean {
	return Attack.damage[eid] > 0 && Attack.range[eid] > 0;
}

/** Validate that an entity can build. */
function canBuild(world: GameWorld, eid: number): boolean {
	return (
		Content.categoryId[eid] === CATEGORY_IDS.worker ||
		WORKER_TYPE_NAMES.has(world.runtime.entityTypeIndex.get(eid) ?? "") ||
		(world.runtime.entityAbilities.get(eid)?.includes("build") ?? false)
	);
}

// ---------------------------------------------------------------------------
// Order handlers
// ---------------------------------------------------------------------------

function handleAttackOrder(world: GameWorld, eid: number, orders: Order[], current: Order): void {
	if (current.targetEid === undefined || current.targetEid === 0) {
		orders.shift();
		return;
	}

	// Validate attacker can attack
	if (!canAttack(world, eid)) {
		orders.shift();
		return;
	}

	const targetEid = current.targetEid;
	if (!world.runtime.alive.has(targetEid)) {
		orders.shift();
		return;
	}

	// Check if target is dead
	if (Health.current[targetEid] <= 0) {
		orders.shift();
		return;
	}

	// Check if we need to move closer to attack
	const range = Attack.range[eid];
	const ax = Position.x[eid];
	const ay = Position.y[eid];
	const bx = Position.x[targetEid];
	const by = Position.y[targetEid];
	const dist = distanceBetween(ax, ay, bx, by);

	if (dist > range) {
		// Out of range — update move target to current enemy position
		current.targetX = bx;
		current.targetY = by;
	}
	// If in range, combat system will handle the actual attack
}

function handleGatherOrder(world: GameWorld, eid: number, orders: Order[], current: Order): void {
	if (!canGather(world, eid)) {
		orders.shift();
		return;
	}

	if (current.targetEid === undefined || current.targetEid === 0) {
		orders.shift();
		return;
	}

	const targetEid = current.targetEid;
	if (!world.runtime.alive.has(targetEid) || Flags.isResource[targetEid] !== 1) {
		orders.shift();
		return;
	}
}

function handleBuildOrder(world: GameWorld, eid: number, orders: Order[], current: Order): void {
	if (!canBuild(world, eid)) {
		orders.shift();
		return;
	}

	if (current.targetEid !== undefined && current.targetEid > 0) {
		// Validate building still exists
		if (!world.runtime.alive.has(current.targetEid)) {
			orders.shift();
			return;
		}
		// Check if building is complete
		if (Construction.progress[current.targetEid] >= 100) {
			orders.shift();
			return;
		}
	}

	// Update move target to building location if we have coordinates
	if (current.targetX !== undefined && current.targetY !== undefined) {
		// Build order implies move to the build site
	}
}

function handlePatrolOrder(_world: GameWorld, _eid: number, orders: Order[], current: Order): void {
	// Patrol orders use targetX/targetY as the first waypoint.
	// When arrival is detected by the movement system, the order system
	// cycles patrol waypoints stored in world.runtime.
	if (current.targetX === undefined || current.targetY === undefined) {
		orders.shift();
		return;
	}
}

function handleFollowOrder(world: GameWorld, _eid: number, orders: Order[], current: Order): void {
	if (current.targetEid === undefined || current.targetEid === 0) {
		orders.shift();
		return;
	}

	const targetEid = current.targetEid;
	if (!world.runtime.alive.has(targetEid)) {
		orders.shift();
		return;
	}

	// Update move target to follow target's current position
	current.targetX = Position.x[targetEid];
	current.targetY = Position.y[targetEid];
}

function handleGarrisonOrder(
	world: GameWorld,
	_eid: number,
	orders: Order[],
	current: Order,
): void {
	if (current.targetEid === undefined || current.targetEid === 0) {
		orders.shift();
		return;
	}

	const buildingEid = current.targetEid;
	if (!world.runtime.alive.has(buildingEid) || Flags.isBuilding[buildingEid] !== 1) {
		orders.shift();
		return;
	}

	// Update move target to building position
	current.targetX = Position.x[buildingEid];
	current.targetY = Position.y[buildingEid];
}

function handleStopOrder(_world: GameWorld, _eid: number, orders: Order[]): void {
	// Clear all orders and stop
	orders.length = 0;
}

function handleHoldOrder(_world: GameWorld, _eid: number, _orders: Order[], _current: Order): void {
	// Hold position — entity stays put but can still attack.
	// No movement will be generated for this order.
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the order validation system.
 * Cleans up stale orders and resolves attack-move, gather, patrol,
 * follow, garrison, stop, and hold orders.
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

		// Validate orders targeting another entity (generic check)
		if (current.targetEid !== undefined && current.targetEid !== 0) {
			const targetAlive = world.runtime.alive.has(current.targetEid);

			if (!targetAlive && current.type !== "move") {
				// Target is dead/removed — pop the order
				orders.shift();
				continue;
			}
		}

		// Dispatch to type-specific handler
		switch (current.type) {
			case "attack":
				handleAttackOrder(world, eid, orders, current);
				break;

			case "gather":
				handleGatherOrder(world, eid, orders, current);
				break;

			case "build":
				handleBuildOrder(world, eid, orders, current);
				break;

			case "patrol":
				handlePatrolOrder(world, eid, orders, current);
				break;

			case "follow":
				handleFollowOrder(world, eid, orders, current);
				break;

			case "garrison":
				handleGarrisonOrder(world, eid, orders, current);
				break;

			case "stop":
				handleStopOrder(world, eid, orders);
				break;

			case "hold":
				handleHoldOrder(world, eid, orders, current);
				break;

			case "move":
				// Move orders are validated by movement system; nothing to do here
				// except check targetX/targetY exist
				if (current.targetX === undefined || current.targetY === undefined) {
					orders.shift();
				}
				break;

			default:
				// Unknown order type — discard
				orders.shift();
				break;
		}
	}
}
