/**
 * Multi-Base System — Secondary Command Posts, collection radii, and supply caravans.
 *
 * Handles:
 * 1. findNearestCPInRadius: workers deposit to nearest CP within that CP's collection radius
 * 2. findNearestCPGlobal: fallback nearest CP with no radius constraint
 * 3. canPlaceSecondaryCP: validate placement at predetermined scenario locations
 * 4. Supply caravans: automated raftsmen that ferry resources between CPs
 * 5. Caravan vulnerability: dead caravans lose all carried resources
 *
 * Runs every game tick via `multiBaseSystem(world, delta)`.
 */

import type { Entity, World } from "koota";
import { CollectionRadius, Gatherer, IsCommandPost, SupplyCaravan } from "../ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { Health } from "../ecs/traits/combat";
import { OwnedBy } from "../ecs/relations";
import { ResourcePool } from "../ecs/traits/state";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Predetermined location where a secondary CP can be built (from scenario data). */
export interface CommandPostLocation {
	id: string;
	x: number;
	y: number;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function tileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// Collection Radius — Worker Deposit Routing
// ---------------------------------------------------------------------------

/**
 * Find the nearest Command Post whose collection radius covers the worker's position.
 * Returns null if no CP's radius reaches the worker.
 */
export function findNearestCPInRadius(world: World, workerEntity: Entity): Entity | null {
	const workerPos = workerEntity.get(Position);
	const cps = world.query(IsBuilding, IsCommandPost, Position, CollectionRadius, Health);

	let nearest: Entity | null = null;
	let nearestDist = Number.POSITIVE_INFINITY;

	for (const cp of cps) {
		const cpHealth = cp.get(Health);
		if (cpHealth.current <= 0) continue;

		const cpPos = cp.get(Position);
		const radius = cp.get(CollectionRadius);
		const dist = tileDistance(workerPos.x, workerPos.y, cpPos.x, cpPos.y);

		if (dist <= radius.radius && dist < nearestDist) {
			nearestDist = dist;
			nearest = cp;
		}
	}

	return nearest;
}

/**
 * Find the nearest Command Post globally (no radius constraint).
 * Fallback for CPs that don't have CollectionRadius trait.
 */
export function findNearestCPGlobal(world: World, workerEntity: Entity): Entity | null {
	const workerPos = workerEntity.get(Position);
	const cps = world.query(IsBuilding, IsCommandPost, Position, Health);

	let nearest: Entity | null = null;
	let nearestDist = Number.POSITIVE_INFINITY;

	for (const cp of cps) {
		const cpHealth = cp.get(Health);
		if (cpHealth.current <= 0) continue;

		const cpPos = cp.get(Position);
		const dist = tileDistance(workerPos.x, workerPos.y, cpPos.x, cpPos.y);

		if (dist < nearestDist) {
			nearestDist = dist;
			nearest = cp;
		}
	}

	return nearest;
}

// ---------------------------------------------------------------------------
// Secondary CP Placement Validation
// ---------------------------------------------------------------------------

/** Distance threshold for considering "same location" (in tiles). */
const PLACEMENT_SNAP = 1.0;

/**
 * Check if a secondary CP can be placed at a given predetermined location.
 * - The location ID must exist in the scenario's allowed locations.
 * - No existing CP may be within PLACEMENT_SNAP tiles of that location.
 */
export function canPlaceSecondaryCP(
	world: World,
	allowedLocations: CommandPostLocation[],
	locationId: string,
): boolean {
	const location = allowedLocations.find((loc) => loc.id === locationId);
	if (!location) return false;

	// Check for existing CPs near this location
	const cps = world.query(IsBuilding, IsCommandPost, Position);
	for (const cp of cps) {
		const cpPos = cp.get(Position);
		if (tileDistance(cpPos.x, cpPos.y, location.x, location.y) < PLACEMENT_SNAP) {
			return false;
		}
	}

	return true;
}

// ---------------------------------------------------------------------------
// Supply Caravan Factory
// ---------------------------------------------------------------------------

/**
 * Create a supply caravan entity that will cycle between the given Command Posts.
 * The caravan starts at the first CP's position.
 */
export function createSupplyCaravan(
	world: World,
	factionEntity: Entity,
	routeCPs: Entity[],
): Entity {
	const caravan = world.spawn(UnitType, Position, Health, SupplyCaravan, OwnedBy(factionEntity));

	caravan.set(UnitType, { type: "supply_caravan" });
	caravan.set(Health, { current: 50, max: 50 });

	// Set starting position to first CP in route
	if (routeCPs.length > 0 && routeCPs[0].has(Position)) {
		const startPos = routeCPs[0].get(Position);
		caravan.set(Position, { x: startPos.x, y: startPos.y });
	}

	// Store entity references in the route (AoS trait — mutate directly)
	const caravanData = caravan.get(SupplyCaravan);
	caravanData.route = [...routeCPs];
	caravanData.routeIndex = 0;

	return caravan;
}

// ---------------------------------------------------------------------------
// Caravan Movement
// ---------------------------------------------------------------------------

/**
 * Move all supply caravans toward their next route waypoint.
 * When a caravan arrives at a waypoint, it advances to the next one (cycling).
 */
export function tickCaravans(world: World, delta: number): void {
	const caravans = world.query(SupplyCaravan, Position, Health);

	for (const caravan of caravans) {
		const health = caravan.get(Health);
		if (health.current <= 0) continue;

		const data = caravan.get(SupplyCaravan);
		if (data.route.length === 0) continue;

		// Get destination CP entity reference from route
		const destCP = data.route[data.routeIndex] as Entity | null;

		if (!destCP || !destCP.has(Position)) {
			// Destination CP destroyed or invalid — advance to next
			data.routeIndex = (data.routeIndex + 1) % data.route.length;
			continue;
		}

		const destHealth = destCP.has(Health) ? destCP.get(Health) : null;
		if (destHealth && destHealth.current <= 0) {
			// Destination CP is dead — skip
			data.routeIndex = (data.routeIndex + 1) % data.route.length;
			continue;
		}

		const caravanPos = caravan.get(Position); // SoA snapshot — read only
		const destPos = destCP.get(Position);

		const dist = tileDistance(caravanPos.x, caravanPos.y, destPos.x, destPos.y);
		const arrivalThreshold = 1.0;

		if (dist <= arrivalThreshold) {
			// Already at destination — deliver and advance
			if (data.amount > 0) {
				tickCaravanDelivery(data, world);
			}
			data.routeIndex = (data.routeIndex + 1) % data.route.length;
		} else {
			// Move toward destination — must use .set() since Position is SoA
			const step = Math.min(data.speed * delta, dist);
			const dx = destPos.x - caravanPos.x;
			const dy = destPos.y - caravanPos.y;
			const newX = caravanPos.x + (dx / dist) * step;
			const newY = caravanPos.y + (dy / dist) * step;
			caravan.set(Position, { x: newX, y: newY });

			// Check arrival after movement (step may overshoot or exactly reach)
			const newDist = tileDistance(newX, newY, destPos.x, destPos.y);
			if (newDist <= arrivalThreshold) {
				if (data.amount > 0) {
					tickCaravanDelivery(data, world);
				}
				data.routeIndex = (data.routeIndex + 1) % data.route.length;
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Caravan Pickup & Delivery
// ---------------------------------------------------------------------------

/**
 * Load resources onto a caravan. Only loads if caravan is currently empty.
 * Takes the minimum of available amount and caravan capacity.
 */
export function tickCaravanPickup(
	caravanData: ReturnType<Entity["get"]>,
	resourceType: string,
	availableAmount: number,
): void {
	// Don't pick up if already carrying
	if (caravanData.amount > 0) return;

	const loadAmount = Math.min(availableAmount, caravanData.capacity);
	if (loadAmount <= 0) return;

	caravanData.carrying = resourceType;
	caravanData.amount = loadAmount;
}

/**
 * Deliver carried resources to the world-level ResourcePool and clear the caravan cargo.
 */
export function tickCaravanDelivery(caravanData: ReturnType<Entity["get"]>, world: World): void {
	if (caravanData.amount <= 0) return;

	const pool = world.get(ResourcePool);
	if (!pool) return;

	const amount = caravanData.amount;
	const type = caravanData.carrying;

	switch (type) {
		case "fish":
			world.set(ResourcePool, { ...pool, fish: pool.fish + amount });
			break;
		case "timber":
			world.set(ResourcePool, { ...pool, timber: pool.timber + amount });
			break;
		case "salvage":
			world.set(ResourcePool, { ...pool, salvage: pool.salvage + amount });
			break;
	}

	caravanData.carrying = "";
	caravanData.amount = 0;
}

// ---------------------------------------------------------------------------
// Caravan Cargo Query
// ---------------------------------------------------------------------------

/**
 * Get the current cargo of a caravan entity.
 */
export function getCaravanCargo(caravanEntity: Entity): { type: string; amount: number } {
	const data = caravanEntity.get(SupplyCaravan);
	return { type: data.carrying, amount: data.amount };
}

// ---------------------------------------------------------------------------
// Master System Tick
// ---------------------------------------------------------------------------

/**
 * Multi-base system tick. Called every frame.
 *
 * Processes:
 * 1. Supply caravan movement and auto-delivery
 */
export function multiBaseSystem(world: World, delta: number): void {
	tickCaravans(world, delta);
}
