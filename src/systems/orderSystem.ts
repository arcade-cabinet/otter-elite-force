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

import type { Entity, World } from "koota";
import { Vector3 } from "yuka";
import { findPath } from "../ai/pathfinder";
import type { SteeringVehicle } from "../ai/steeringFactory";
import { setVehiclePath } from "../ai/steeringFactory";
import { ConstructingAt, GatheringFrom, Targeting } from "../ecs/relations";
import { AIState, SteeringAgent } from "../ecs/traits/ai";
import { Attack } from "../ecs/traits/combat";
import { ConstructionProgress, Gatherer } from "../ecs/traits/economy";
import type { Order } from "../ecs/traits/orders";
import { OrderQueue } from "../ecs/traits/orders";
import { Position } from "../ecs/traits/spatial";
import { NavGraphState } from "../ecs/traits/state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Set a path on a steering vehicle.
 * Uses A* pathfinding when nav graph is available, falls back to direct path.
 */
function dispatchPath(
	world: World,
	agent: SteeringVehicle,
	fromX: number,
	fromY: number,
	targetX: number,
	targetY: number,
): void {
	const navState = world.get(NavGraphState);
	if (navState?.graph) {
		const waypoints = findPath(
			navState.graph,
			{ x: Math.round(fromX), y: Math.round(fromY) },
			{ x: Math.round(targetX), y: Math.round(targetY) },
			navState.width,
		);
		if (waypoints.length > 0) {
			setVehiclePath(agent, waypoints);
			return;
		}
	}
	// Fallback: direct path
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

/**
 * Find an incomplete building at the given tile position.
 */
function findBuildingAt(world: World, x: number, y: number): Entity | null {
	const buildings = world.query(Position, ConstructionProgress);
	for (const building of buildings) {
		const pos = building.get(Position)!;
		if (Math.abs(pos.x - x) < 0.5 && Math.abs(pos.y - y) < 0.5) {
			return building;
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Order handlers
// ---------------------------------------------------------------------------

function handleMove(
	world: World,
	entity: Entity,
	order: Order,
	agent: SteeringVehicle,
	ai: ReturnType<Entity["get"]>,
): void {
	if (ai.state === "moving") return;

	if (order.targetX !== undefined && order.targetY !== undefined) {
		const pos = entity.get(Position)!;
		dispatchPath(world, agent, pos.x, pos.y, order.targetX, order.targetY);
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
		const attack = entity.get(Attack)!;
		const pos = entity.get(Position)!;
		const targetPos = target.get(Position)!;
		const dist = distanceBetween(pos.x, pos.y, targetPos.x, targetPos.y);

		if (dist > attack.range) {
			dispatchPath(world, agent, pos.x, pos.y, targetPos.x, targetPos.y);
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
	const pos = entity.get(Position)!;
	if (order.targetX !== undefined && order.targetY !== undefined) {
		const dist = distanceBetween(pos.x, pos.y, order.targetX, order.targetY);
		if (dist > 1.5) {
			dispatchPath(world, agent, pos.x, pos.y, order.targetX, order.targetY);
		}
	}
}

function handleBuild(
	world: World,
	entity: Entity,
	order: Order,
	agent: SteeringVehicle,
	orders: Order[],
): void {
	entity.set(AIState, (prev) => ({ ...prev, state: "building" }));

	if (order.targetX === undefined || order.targetY === undefined) return;

	// Find the building at the target location
	const building =
		order.targetEntity !== undefined
			? resolveEntity(world, order.targetEntity)
			: findBuildingAt(world, order.targetX, order.targetY);

	if (!building || !building.has(ConstructionProgress)) {
		// Building doesn't exist or already finished — discard order
		orders.shift();
		entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
		return;
	}

	// If close enough, set ConstructingAt relation so buildingSystem processes us
	const pos = entity.get(Position)!;
	const dist = distanceBetween(pos.x, pos.y, order.targetX, order.targetY);
	if (dist <= 1.5) {
		if (!entity.has(ConstructingAt("*"))) {
			entity.add(ConstructingAt(building));
		}
	} else {
		dispatchPath(world, agent, pos.x, pos.y, order.targetX, order.targetY);
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

function handlePatrol(world: World, entity: Entity, order: Order, agent: SteeringVehicle): void {
	if (!order.waypoints || order.waypoints.length === 0) return;

	entity.set(AIState, (prev) => ({ ...prev, state: "patrolling" }));

	const pos = entity.get(Position)!;
	const first = order.waypoints[0];
	dispatchPath(world, agent, pos.x, pos.y, first.x, first.y);
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
		const orders = entity.get(OrderQueue)!;
		if (orders.length === 0) continue;

		const order = orders[0];

		// SteeringAgent is required for most orders (except stop on non-steered entities)
		const hasAgent = entity.has(SteeringAgent);
		if (!hasAgent && order.type !== "stop") continue;

		const agent = hasAgent ? (entity.get(SteeringAgent) ?? null) : null;

		switch (order.type) {
			case "move":
				if (agent) handleMove(world, entity, order, agent, entity.get(AIState));
				break;

			case "attack":
				if (agent) handleAttack(world, entity, order, agent, orders);
				break;

			case "gather":
				if (agent) handleGather(world, entity, order, agent, orders);
				break;

			case "build":
				if (agent) handleBuild(world, entity, order, agent, orders);
				break;

			case "stop":
				if (agent) handleStop(entity, orders, agent);
				else {
					orders.length = 0;
					entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
				}
				break;

			case "patrol":
				if (agent) handlePatrol(world, entity, order, agent);
				break;
		}
	}
}
