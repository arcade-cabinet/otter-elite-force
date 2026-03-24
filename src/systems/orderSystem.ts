/**
 * Order System — processes the OrderQueue trait for each entity each tick.
 *
 * Reads the front of the queue and translates orders into ECS state:
 * - Move: set path on SteeringVehicle, AIState → "moving"
 * - Attack: set Targeting relation, AIState → "attacking", move toward target
 * - Gather: validate Gatherer trait, set GatheringFrom, AIState → "gathering"
 * - Build: AIState → "building", move to build site
 * - Stop: clear all orders + path, AIState → "idle"
 * - Patrol: AIState → "patrolling", cycle through waypoints
 *
 * Spec reference: §8.1 Unit Orders, §8.3 Pathfinding
 */

import type { World, Entity } from "koota";
import { Vector3 } from "yuka";
import { AIState, SteeringAgent } from "../ecs/traits/ai";
import { Attack } from "../ecs/traits/combat";
import { Gatherer } from "../ecs/traits/economy";
import { OrderQueue } from "../ecs/traits/orders";
import type { Order } from "../ecs/traits/orders";
import { Position } from "../ecs/traits/spatial";
import { Targeting, GatheringFrom } from "../ecs/relations";
import type { SteeringVehicle } from "../ai/steeringFactory";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Set a direct path on a steering vehicle. In production this would go through
 * the PathfindingQueue for A* paths; for now, creates a simple direct path.
 */
function dispatchPath(agent: SteeringVehicle, targetX: number, targetY: number): void {
	const path = agent.followPath.path;
	path.clear();
	path.add(new Vector3(targetX, 0, targetY));
}

/**
 * Resolve an entity ID back to a live Entity, or null if destroyed.
 * Koota doesn't expose a direct ID→Entity lookup, so we scan Position entities.
 */
function resolveEntity(world: World, entityId: number): Entity | null {
	const candidates = world.query(Position);
	for (const candidate of candidates) {
		if (candidate.id() === entityId) return candidate;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Order handlers
// ---------------------------------------------------------------------------

function handleMove(
	entity: Entity,
	order: Order,
	agent: SteeringVehicle,
	ai: ReturnType<Entity["get"]>,
): void {
	// Don't re-dispatch if already moving on this order
	if (ai.state === "moving") return;

	if (order.targetX !== undefined && order.targetY !== undefined) {
		dispatchPath(agent, order.targetX, order.targetY);
		entity.set(AIState, (prev) => ({ ...prev, state: "moving" }));
	}
}

function handleAttack(
	world: World,
	entity: Entity,
	order: Order,
	agent: SteeringVehicle,
	orders: Order[],
): void {
	if (order.targetEntity === undefined) return;

	const target = resolveEntity(world, order.targetEntity);
	if (!target) {
		// Target is dead or gone — discard order, go idle
		orders.shift();
		entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
		return;
	}

	// Set targeting relation and state
	entity.add(Targeting(target));
	entity.set(AIState, (prev) => ({ ...prev, state: "attacking" }));

	// Move toward target if out of attack range
	if (entity.has(Attack)) {
		const attack = entity.get(Attack);
		const pos = entity.get(Position);
		const targetPos = target.get(Position);
		const dist = distanceBetween(pos.x, pos.y, targetPos.x, targetPos.y);

		if (dist > attack.range) {
			dispatchPath(agent, targetPos.x, targetPos.y);
		}
	}
}

function handleGather(
	world: World,
	entity: Entity,
	order: Order,
	agent: SteeringVehicle,
	orders: Order[],
): void {
	// Only units with Gatherer trait can gather
	if (!entity.has(Gatherer)) {
		orders.shift();
		return;
	}

	if (order.targetEntity === undefined) return;

	const resource = resolveEntity(world, order.targetEntity);
	if (!resource) {
		orders.shift();
		entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
		return;
	}

	// Set gathering relation and state
	entity.add(GatheringFrom(resource));
	entity.set(AIState, (prev) => ({ ...prev, state: "gathering" }));

	// Move toward resource if not adjacent
	const pos = entity.get(Position);
	if (order.targetX !== undefined && order.targetY !== undefined) {
		const dist = distanceBetween(pos.x, pos.y, order.targetX, order.targetY);
		if (dist > 1.5) {
			dispatchPath(agent, order.targetX, order.targetY);
		}
	}
}

function handleBuild(entity: Entity, order: Order, agent: SteeringVehicle): void {
	entity.set(AIState, { state: "building" });

	if (order.targetX !== undefined && order.targetY !== undefined) {
		dispatchPath(agent, order.targetX, order.targetY);
	}
}

function handleStop(entity: Entity, orders: Order[], agent: SteeringVehicle): void {
	// Clear all orders
	orders.length = 0;

	// Clear steering path
	agent.followPath.path.clear();

	// Reset state
	entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
}

function handlePatrol(entity: Entity, order: Order, agent: SteeringVehicle): void {
	if (!order.waypoints || order.waypoints.length === 0) return;

	entity.set(AIState, { state: "patrolling" });

	// Begin moving to first waypoint
	const first = order.waypoints[0];
	dispatchPath(agent, first.x, first.y);
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Process the OrderQueue for every entity that has one.
 * Called once per game tick.
 */
export function orderSystem(world: World, _delta: number): void {
	const entities = world.query(OrderQueue, AIState);

	for (const entity of entities) {
		const orders = entity.get(OrderQueue);
		if (orders.length === 0) continue;

		const order = orders[0];

		// SteeringAgent is required for most orders (except stop on non-steered entities)
		const hasAgent = entity.has(SteeringAgent);
		if (!hasAgent && order.type !== "stop") continue;

		const agent = hasAgent ? (entity.get(SteeringAgent) as SteeringVehicle) : null;

		switch (order.type) {
			case "move":
				if (agent) handleMove(entity, order, agent, entity.get(AIState));
				break;

			case "attack":
				if (agent) handleAttack(world, entity, order, agent, orders);
				break;

			case "gather":
				if (agent) handleGather(world, entity, order, agent, orders);
				break;

			case "build":
				if (agent) handleBuild(entity, order, agent);
				break;

			case "stop":
				if (agent) handleStop(entity, orders, agent);
				else {
					orders.length = 0;
					entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
				}
				break;

			case "patrol":
				if (agent) handlePatrol(entity, order, agent);
				break;
		}
	}
}
