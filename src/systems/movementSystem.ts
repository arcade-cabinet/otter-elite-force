/**
 * Movement System — Yuka steering sync and order dispatch.
 *
 * Each frame:
 * 1. For entities with SteeringAgent + Position: read the Yuka Vehicle's
 *    position and write it back to the Koota Position trait.
 * 2. Update FacingDirection from vehicle velocity.
 * 3. Detect arrival (path complete) — clear current order, dequeue next
 *    from OrderQueue, and set a new path on the vehicle.
 *
 * Runs every game tick via `movementSystem(world, delta)`.
 */

import type { World } from "koota";
import { Vector3 } from "yuka";
import { SteeringAgent } from "../ecs/traits/ai";
import { OrderQueue } from "../ecs/traits/orders";
import { FacingDirection, Position, Velocity } from "../ecs/traits/spatial";
import type { SteeringVehicle } from "../ai/steeringFactory";
import { isPathComplete, setVehiclePath } from "../ai/steeringFactory";

/**
 * Main movement system tick.
 */
export function movementSystem(world: World, delta: number): void {
	syncSteeringToPosition(world, delta);
	processArrival(world);
}

/**
 * Sync Yuka Vehicle position back to Koota Position trait.
 * Also updates Velocity and FacingDirection from the Vehicle state.
 */
function syncSteeringToPosition(world: World, _delta: number): void {
	const entities = world.query(SteeringAgent, Position);

	for (const entity of entities) {
		const agent = entity.get(SteeringAgent) as SteeringVehicle | null;
		if (!agent?.vehicle) continue;

		const vehicle = agent.vehicle;

		// Sync position: Yuka uses (x, 0, z) where z maps to our y
		entity.set(Position, {
			x: vehicle.position.x,
			y: vehicle.position.z,
		});

		// Sync velocity if the entity has that trait
		if (entity.has(Velocity)) {
			entity.set(Velocity, {
				x: vehicle.velocity.x,
				y: vehicle.velocity.z,
			});
		}

		// Update facing direction from velocity
		if (entity.has(FacingDirection)) {
			const vx = vehicle.velocity.x;
			const vy = vehicle.velocity.z;
			if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
				entity.set(FacingDirection, {
					angle: Math.atan2(vy, vx),
				});
			}
		}
	}
}

/**
 * Detect units that have arrived at their destination.
 * Clear the current order and dequeue the next one.
 */
function processArrival(world: World): void {
	const entities = world.query(SteeringAgent, OrderQueue, Position);

	for (const entity of entities) {
		const agent = entity.get(SteeringAgent) as SteeringVehicle | null;
		if (!agent?.vehicle) continue;

		const orders = entity.get(OrderQueue);
		if (!orders || orders.length === 0) continue;

		const currentOrder = orders[0];

		// Only process move orders for arrival detection
		if (currentOrder.type !== "move") continue;

		// Check if path is complete
		if (!isPathComplete(agent)) continue;

		// Arrival detected — remove completed order
		orders.shift();

		// Dequeue next order if it's also a move
		if (orders.length > 0 && orders[0].type === "move") {
			const next = orders[0];
			if (next.targetX !== undefined && next.targetY !== undefined) {
				dispatchMoveOrder(agent, next.targetX, next.targetY);
			}
		}
	}
}

/**
 * Set a direct path on a vehicle to a target position.
 * In production, this would go through the PathfindingQueue for A* paths.
 * For now, creates a simple direct path.
 */
function dispatchMoveOrder(agent: SteeringVehicle, targetX: number, targetY: number): void {
	setVehiclePath(agent, [new Vector3(targetX, 0, targetY)]);
}

/**
 * Assign a steering vehicle to an entity and optionally set an initial path.
 * Utility for spawning units with movement capability.
 */
export function assignSteeringAgent(
	entity: ReturnType<World["spawn"]>,
	agent: SteeringVehicle,
	initialX: number,
	initialY: number,
): void {
	// Set the vehicle's initial position
	agent.vehicle.position.set(initialX, 0, initialY);

	// Store the SteeringVehicle on the entity
	// SteeringAgent AoS trait stores opaque data — type erase via intermediate cast
	entity.set(
		SteeringAgent,
		agent as unknown as ReturnType<typeof entity.get<typeof SteeringAgent>>,
	);
}
