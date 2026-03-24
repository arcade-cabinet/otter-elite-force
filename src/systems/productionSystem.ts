/**
 * Production System — Unit training and production queue.
 *
 * Handles:
 * 1. Buildings with ProductionQueue process the first item in the queue.
 * 2. Resources are deducted when a unit is queued (via queueUnit).
 * 3. Progress increments over buildTime each tick.
 * 4. When complete, a new unit entity is spawned at the building's rally point.
 * 5. Population cap is checked before queueing.
 *
 * Runs every game tick via `productionSystem(world, delta)`.
 */

import type { World } from "koota";
import { PopulationCost, ProductionQueue } from "../ecs/traits/economy";
import { Health } from "../ecs/traits/combat";
import { IsBuilding, UnitType } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { RallyPoint } from "../ecs/traits/orders";
import { OwnedBy } from "../ecs/relations";
import { CompletedResearch, PopulationState, ResourcePool } from "../ecs/traits/state";
import { world as defaultWorld } from "../ecs/world";
import { ALL_UNITS } from "../data/units";
import { ALL_BUILDINGS } from "../data/buildings";

/**
 * Queue a unit for training at a building.
 * Checks population cap and deducts resources upfront.
 *
 * @returns true if the unit was successfully queued, false otherwise.
 */
export function queueUnit(
	building: ReturnType<World["spawn"]>,
	unitType: string,
	world: World = defaultWorld,
): boolean {
	const unitDef = ALL_UNITS[unitType];
	if (!unitDef) return false;

	// Check that this building can train this unit type
	const buildingType = building.get(UnitType);
	if (!buildingType) return false;
	const buildingDef = ALL_BUILDINGS[buildingType.type];
	if (!buildingDef?.trains?.includes(unitType)) return false;

	// Check population cap
	const pop = world.get(PopulationState);
	if (!pop || pop.current + unitDef.pop > pop.max) return false;

	// Check and deduct resources
	const pool = world.get(ResourcePool);
	if (!pool) return false;
	const cost = unitDef.cost;
	if (
		pool.fish < (cost.fish ?? 0) ||
		pool.timber < (cost.timber ?? 0) ||
		pool.salvage < (cost.salvage ?? 0)
	)
		return false;

	world.set(ResourcePool, {
		fish: pool.fish - (cost.fish ?? 0),
		timber: pool.timber - (cost.timber ?? 0),
		salvage: pool.salvage - (cost.salvage ?? 0),
	});

	// Add to the building's production queue
	const queue = building.get(ProductionQueue);
	if (!queue) return false;
	queue.push({
		unitType,
		progress: 0,
		buildTime: buildingDef.buildTime,
	});

	// Reserve population immediately
	world.set(PopulationState, { current: pop.current + unitDef.pop, max: pop.max });

	return true;
}

/**
 * Main production system tick.
 * Processes the first item in each building's production queue.
 */
export function productionSystem(world: World, delta: number): void {
	const buildings = world.query(IsBuilding, ProductionQueue, Position, OwnedBy("*"));

	for (const building of buildings) {
		const queue = building.get(ProductionQueue);
		if (!queue || queue.length === 0) continue;

		const current = queue[0];
		current.progress += (delta / current.buildTime) * 100;

		if (current.progress >= 100) {
			// Training complete — spawn the unit
			spawnTrainedUnit(world, building, current.unitType);
			queue.shift();
		}
	}
}

/**
 * Spawn a trained unit at the building's rally point (or building position).
 */
function spawnTrainedUnit(
	world: World,
	building: ReturnType<World["spawn"]>,
	unitType: string,
): void {
	const unitDef = ALL_UNITS[unitType];
	if (!unitDef) return;

	// Determine spawn position: rally point if set, otherwise building position
	let spawnX: number;
	let spawnY: number;

	if (building.has(RallyPoint)) {
		const rally = building.get(RallyPoint);
		if (rally) {
			spawnX = rally.x;
			spawnY = rally.y;
		} else {
			const bPos = building.get(Position);
			spawnX = (bPos?.x ?? 0) + 1;
			spawnY = bPos?.y ?? 0;
		}
	} else {
		const bPos = building.get(Position);
		spawnX = (bPos?.x ?? 0) + 1;
		spawnY = bPos?.y ?? 0;
	}

	// Get the owner faction entity
	const ownerFaction = building.targetFor(OwnedBy);

	// Spawn the unit entity
	const traits = [
		UnitType({ type: unitType }),
		Position({ x: spawnX, y: spawnY }),
		Health({ current: unitDef.hp, max: unitDef.hp }),
		PopulationCost({ cost: unitDef.pop }),
	];

	const unit = world.spawn(...traits);

	if (ownerFaction) {
		unit.add(OwnedBy(ownerFaction));
	}
}
