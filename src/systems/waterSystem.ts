/**
 * Water Traversal System
 *
 * Handles water-specific movement, underwater stealth, and raft boarding mechanics.
 *
 * Rules:
 * - Entities with CanSwim can enter water tiles (cost 2 instead of Infinity)
 * - Entities with Submerged tag are invisible to surface units:
 *   they are skipped by aggro/detection queries
 * - Raftsman boarding: units GarrisonedIn a raft travel with it across water
 * - Raft carry capacity: max 4 passengers (6 with Advanced Rafts research)
 *
 * Spec reference: §4 (Raftsman, Diver), §8.3 (terrain costs), §8.5 (stealth)
 */

import type { Entity, World } from "koota";
import { CanSwim, Submerged } from "../ecs/traits/water";
import { Position } from "../ecs/traits/spatial";
import { Health } from "../ecs/traits/combat";
import { Faction, UnitType } from "../ecs/traits/identity";
import { VisionRadius } from "../ecs/traits/combat";
import { GarrisonedIn } from "../ecs/relations";

/** Default raft carry capacity. Advanced Rafts research increases this to 6. */
const DEFAULT_RAFT_CAPACITY = 4;

/**
 * Check if a terrain type string represents water.
 */
export function isWaterTerrain(terrain: string): boolean {
	return terrain === "water";
}

/**
 * Check if an entity can enter a water tile.
 * Returns true if the entity has the CanSwim trait.
 */
export function canEnterWater(entity: Entity): boolean {
	return entity.has(CanSwim);
}

/**
 * Submerge an entity (go underwater). Only entities with CanSwim can submerge.
 * Submerged entities are invisible to surface unit detection/aggro.
 */
export function submerge(entity: Entity): boolean {
	if (!entity.has(CanSwim)) return false;
	if (entity.has(Submerged)) return false; // already submerged
	entity.add(Submerged);
	return true;
}

/**
 * Surface an entity (leave underwater state).
 */
export function surface(entity: Entity): boolean {
	if (!entity.has(Submerged)) return false;
	entity.remove(Submerged);
	return true;
}

/**
 * Check if an entity is visible to surface units.
 * Submerged entities are invisible to non-submerged units.
 */
export function isVisibleToSurface(entity: Entity): boolean {
	return !entity.has(Submerged);
}

/**
 * Filter out submerged entities from a list of potential targets.
 * Used by aggro/detection systems to skip underwater units.
 */
export function filterVisibleTargets(targets: Entity[], observerIsSubmerged: boolean): Entity[] {
	if (observerIsSubmerged) {
		// Submerged observers can see both surface and submerged units
		return targets;
	}
	// Surface observers cannot see submerged units
	return targets.filter((t) => !t.has(Submerged));
}

/**
 * Get the number of units currently garrisoned in a raft/building.
 */
export function getGarrisonCount(world: World, transport: Entity): number {
	const garrisoned = world.query(GarrisonedIn(transport));
	return garrisoned.length;
}

/**
 * Board a unit onto a transport (raft). Validates capacity.
 * Returns true if boarding was successful.
 */
export function boardTransport(
	world: World,
	unit: Entity,
	transport: Entity,
	maxCapacity: number = DEFAULT_RAFT_CAPACITY,
): boolean {
	// Check capacity
	const currentCount = getGarrisonCount(world, transport);
	if (currentCount >= maxCapacity) return false;

	// Unit must not already be garrisoned somewhere
	const existingGarrisons = unit.targetsFor(GarrisonedIn);
	if (existingGarrisons.length > 0) return false;

	unit.add(GarrisonedIn(transport));
	return true;
}

/**
 * Disembark a unit from a transport.
 * The unit should be placed at the transport's current position.
 */
export function disembarkTransport(unit: Entity, transport: Entity): boolean {
	if (!unit.has(GarrisonedIn(transport))) return false;

	unit.remove(GarrisonedIn(transport));

	// Copy transport's position to the disembarked unit
	if (transport.has(Position) && unit.has(Position)) {
		const transportPos = transport.get(Position);
		unit.set(Position, { x: transportPos.x, y: transportPos.y });
	}

	return true;
}

/**
 * Sync garrisoned unit positions to their transport's position.
 * Call each frame to keep passengers moving with the raft.
 */
export function syncGarrisonPositions(world: World, transport: Entity): void {
	if (!transport.has(Position)) return;
	const transportPos = transport.get(Position);

	const garrisoned = world.query(GarrisonedIn(transport), Position);
	for (const unit of garrisoned) {
		unit.set(Position, { x: transportPos.x, y: transportPos.y });
	}
}

/**
 * Water system tick — run each frame.
 * Syncs garrisoned unit positions with their transports.
 */
export function waterSystem(world: World): void {
	// Find all entities that have passengers (raftsmen with garrisons)
	const transports = world.query(UnitType, Position, CanSwim);
	for (const transport of transports) {
		const unitType = transport.get(UnitType);
		if (unitType.type === "raftsman") {
			syncGarrisonPositions(world, transport);
		}
	}
}
