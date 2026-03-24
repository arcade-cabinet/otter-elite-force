/**
 * Economy System — Resource gathering and passive income.
 *
 * Handles:
 * 1. Gatherer entities near ResourceNodes: gather resources, pathfind to
 *    Command Post, deposit to the Zustand resource store.
 * 2. Fish Trap passive income: +3 fish per 10 seconds for each owned Fish Trap.
 *
 * Runs every game tick via `economySystem(world, delta)`.
 */

import type { World } from "koota";
import { Gatherer, ResourceNode } from "../ecs/traits/economy";
import { IsBuilding, UnitType } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { GatheringFrom, OwnedBy } from "../ecs/relations";
import { ResourcePool } from "../ecs/traits/state";

/** Distance (in tiles) at which a gatherer can interact with a node or building. */
const GATHER_RANGE = 1.5;
/** Fish generated per Fish Trap per tick of the passive income timer. */
const FISH_TRAP_INCOME = 3;
/** Passive income interval in seconds. */
const FISH_TRAP_INTERVAL = 10;

/** Accumulated time for Fish Trap passive income. */
let fishTrapTimer = 0;

/** Reset the fish trap timer (useful for tests and new games). */
export function resetFishTrapTimer(): void {
	fishTrapTimer = 0;
}

/**
 * Calculate tile distance between two positions.
 */
function tileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Main economy system tick.
 *
 * @param world - The Koota ECS world.
 * @param delta - Time elapsed since last tick, in seconds.
 */
export function economySystem(world: World, delta: number): void {
	processGatherers(world, delta);
	processFishTrapIncome(world, delta);
}

/**
 * Add resources to the world-level ResourcePool.
 */
function addResources(world: World, type: string, amount: number): void {
	const pool = world.get(ResourcePool);
	if (!pool) return;
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
}

/**
 * Process all gatherer entities.
 *
 * Gatherers with a GatheringFrom relation extract resources from the node.
 * When carrying capacity is full, they walk to the nearest Command Post.
 * On arrival at Command Post, they deposit and return to the node.
 */
function processGatherers(world: World, delta: number): void {
	// Find all gatherers that are currently assigned to a resource node
	const gatherers = world.query(Gatherer, Position, GatheringFrom("*"));

	gatherers.updateEach(([gatherer, position], entity) => {
		const target = entity.targetFor(GatheringFrom);
		if (!target || !target.has(ResourceNode) || !target.has(Position)) return;

		const nodePos = target.get(Position);
		const nodeData = target.get(ResourceNode);
		if (!nodePos || !nodeData) return;

		// If carrying is full, move toward Command Post to deposit
		if (gatherer.amount >= gatherer.capacity) {
			const commandPost = findCommandPost(world, entity);
			if (!commandPost) return;

			const cpPos = commandPost.get(Position);
			if (!cpPos) return;
			const dist = tileDistance(position.x, position.y, cpPos.x, cpPos.y);

			if (dist <= GATHER_RANGE) {
				// Deposit resources
				addResources(world, gatherer.carrying, gatherer.amount);
				gatherer.amount = 0;
				gatherer.carrying = "";
			} else {
				// Move toward Command Post (simplified: direct move)
				moveToward(position, cpPos.x, cpPos.y, delta);
			}
			return;
		}

		// If close to the resource node, gather
		const dist = tileDistance(position.x, position.y, nodePos.x, nodePos.y);
		if (dist <= GATHER_RANGE) {
			if (nodeData.remaining <= 0) {
				// Node depleted — release relation
				entity.remove(GatheringFrom(target));
				return;
			}

			// Gather: set resource type and increment carrying
			if (gatherer.carrying === "") {
				gatherer.carrying = nodeData.type;
			}
			const gatherAmount = Math.min(
				delta * 5,
				nodeData.remaining,
				gatherer.capacity - gatherer.amount,
			);
			gatherer.amount += gatherAmount;

			// Deplete the node
			target.set(ResourceNode, { remaining: nodeData.remaining - gatherAmount });
		} else {
			// Move toward the resource node
			moveToward(position, nodePos.x, nodePos.y, delta);
		}
	});
}

/**
 * Find the nearest Command Post owned by the same faction as the gatherer.
 */
function findCommandPost(world: World, gathererEntity: ReturnType<World["spawn"]>) {
	const buildings = world.query(IsBuilding, UnitType, Position, OwnedBy("*"));
	let nearest: ReturnType<World["spawn"]> | null = null;
	let nearestDist = Number.POSITIVE_INFINITY;

	const gathererPos = gathererEntity.get(Position);
	if (!gathererPos) return null;

	for (const building of buildings) {
		const unitType = building.get(UnitType);
		if (!unitType || unitType.type !== "command_post") continue;

		const bPos = building.get(Position);
		if (!bPos) continue;
		const dist = tileDistance(gathererPos.x, gathererPos.y, bPos.x, bPos.y);
		if (dist < nearestDist) {
			nearestDist = dist;
			nearest = building;
		}
	}

	return nearest;
}

/**
 * Move a position toward a target coordinate.
 * Simple linear interpolation — the real pathfinding is in the AI system.
 */
function moveToward(
	position: { x: number; y: number },
	targetX: number,
	targetY: number,
	delta: number,
): void {
	const speed = 5; // tiles per second (placeholder, real speed comes from unit data)
	const dx = targetX - position.x;
	const dy = targetY - position.y;
	const dist = Math.sqrt(dx * dx + dy * dy);

	if (dist < 0.01) return;

	const step = Math.min(speed * delta, dist);
	position.x += (dx / dist) * step;
	position.y += (dy / dist) * step;
}

/**
 * Process Fish Trap passive income.
 * Each Fish Trap owned by URA generates +3 fish per 10 seconds.
 */
function processFishTrapIncome(world: World, delta: number): void {
	fishTrapTimer += delta;

	if (fishTrapTimer < FISH_TRAP_INTERVAL) return;

	// Count Fish Traps
	const fishTraps = world.query(IsBuilding, UnitType, OwnedBy("*"));
	let fishTrapCount = 0;

	for (const building of fishTraps) {
		const unitType = building.get(UnitType);
		if (unitType?.type === "fish_trap") {
			fishTrapCount++;
		}
	}

	if (fishTrapCount > 0) {
		const income = fishTrapCount * FISH_TRAP_INCOME;
		addResources(world, "fish", income);
	}

	// Reset timer (keep remainder for accuracy)
	fishTrapTimer -= FISH_TRAP_INTERVAL;
}
