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
import { OwnedBy } from "../ecs/relations";
import { ConstructionProgress, ProductionQueue } from "../ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "../ecs/traits/identity";
import { OrderQueue, RallyPoint } from "../ecs/traits/orders";
import { Position } from "../ecs/traits/spatial";
import { PopulationState, ResourcePool } from "../ecs/traits/state";
import { world as defaultWorld } from "../ecs/world";
import { getBuilding, getUnit } from "../entities/registry";
import { spawnUnit } from "../entities/spawner";

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
	if (building.has(ConstructionProgress)) return false;

	const unitDef = getUnit(unitType);
	if (!unitDef) return false;

	// Check that this building can train this unit type
	const buildingType = building.get(UnitType);
	if (!buildingType) return false;
	const buildingDef = getBuilding(buildingType.type);
	if (!buildingDef?.trains?.includes(unitType)) return false;

	// Check population cap
	const pop = world.get(PopulationState);
	if (!pop || pop.current + unitDef.populationCost > pop.max) return false;

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
		buildTime: unitDef.trainTime,
	});

	// Reserve population immediately
	world.set(PopulationState, { current: pop.current + unitDef.populationCost, max: pop.max });

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
 * Spawn a trained unit at the building mouth and move it toward the rally point.
 */
function spawnTrainedUnit(
	world: World,
	building: ReturnType<World["spawn"]>,
	unitType: string,
): void {
	const unitDef = getUnit(unitType);
	if (!unitDef) return;

	const bPos = building.get(Position);
	const spawnX = (bPos?.x ?? 0) + 1;
	const spawnY = bPos?.y ?? 0;
	const rally = building.get(RallyPoint);

	// Get the owner faction entity
	const ownerFaction = building.targetFor(OwnedBy);
	const buildingFaction = building.get(Faction);
	const unit = spawnUnit(world, unitDef, spawnX, spawnY, buildingFaction?.id ?? unitDef.faction);

	if (ownerFaction) {
		unit.add(OwnedBy(ownerFaction));
	}

	if (rally && (rally.x !== spawnX || rally.y !== spawnY) && unit.has(OrderQueue)) {
		const orders = unit.get(OrderQueue);
		if (orders) {
			orders.push({ type: "move", targetX: rally.x, targetY: rally.y });
		}
	}
}
