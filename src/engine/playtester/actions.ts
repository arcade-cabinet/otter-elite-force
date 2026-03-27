/**
 * AI Governor Actions — executes decisions by modifying GameWorld directly.
 *
 * Each action function pushes orders into entity order queues, adds to
 * production queues, or calls the building system to place buildings.
 * No browser events, no DOM, no canvas — purely headless.
 */

import { CATEGORY_IDS, FACTION_IDS } from "@/engine/content/ids";
import { Content, Faction, Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld, ProductionEntry } from "@/engine/world/gameWorld";
import { getOrderQueue, getProductionQueue, spawnBuilding } from "@/engine/world/gameWorld";
import { getBuildingDef } from "@/engine/systems/buildingSystem";
import type { ActionPlan } from "./goals";

/**
 * Execute a single action plan against the GameWorld.
 * Returns true if the action was successfully applied.
 */
export function executeAction(world: GameWorld, plan: ActionPlan): boolean {
	switch (plan.type) {
		case "assign-gather":
			return assignWorkerToGather(world, plan.workerEid, plan.resourceEid);
		case "place-building":
			return startBuilding(world, plan.buildingType, plan.x, plan.y);
		case "train-unit":
			return trainUnit(world, plan.buildingEid, plan.unitType);
		case "attack-move":
			return attackMove(world, plan.unitEids, plan.targetX, plan.targetY);
		case "defend-position":
			return defendPosition(world, plan.unitEids, plan.x, plan.y);
		case "scout":
			return scoutTo(world, plan.unitEid, plan.targetX, plan.targetY);
	}
}

/**
 * Assign a worker to gather from a resource node.
 * Pushes a gather order targeting the resource entity.
 */
export function assignWorkerToGather(
	world: GameWorld,
	workerEid: number,
	resourceEid: number,
): boolean {
	if (!world.runtime.alive.has(workerEid)) return false;
	if (!world.runtime.alive.has(resourceEid)) return false;
	if (Flags.isResource[resourceEid] !== 1) return false;

	const orders = getOrderQueue(world, workerEid);
	// Replace existing orders — worker switches to gathering
	orders.length = 0;
	orders.push({
		type: "gather",
		targetEid: resourceEid,
		targetX: Position.x[resourceEid],
		targetY: Position.y[resourceEid],
	});
	return true;
}

/**
 * Place a building at the given world coordinates.
 * Deducts resources and spawns the building entity with construction at 0%.
 * Then assigns the nearest idle worker to build it.
 */
export function startBuilding(
	world: GameWorld,
	buildingType: string,
	x: number,
	y: number,
): boolean {
	const def = getBuildingDef(buildingType);
	if (!def) return false;

	// Check resources
	const res = world.session.resources;
	const cost = def.cost;
	if (
		res.fish < (cost.fish ?? 0) ||
		res.timber < (cost.timber ?? 0) ||
		res.salvage < (cost.salvage ?? 0)
	) {
		return false;
	}

	// Deduct resources
	res.fish -= cost.fish ?? 0;
	res.timber -= cost.timber ?? 0;
	res.salvage -= cost.salvage ?? 0;

	// Spawn building entity with 0% construction
	const eid = spawnBuilding(world, {
		x,
		y,
		faction: "ura",
		buildingType,
		health: { current: def.hp, max: def.hp },
		construction: { progress: 0, buildTime: def.buildTime },
	});

	world.events.push({
		type: "building-placed",
		payload: { buildingId: buildingType, x, y, eid },
	});

	// Assign nearest idle worker to build
	const builderEid = findNearestIdleWorker(world, x, y);
	if (builderEid !== -1) {
		const orders = getOrderQueue(world, builderEid);
		orders.length = 0;
		orders.push({
			type: "build",
			targetEid: eid,
			targetX: x,
			targetY: y,
		});
	}

	return true;
}

/**
 * Queue a unit for training at a building.
 * Deducts resources and adds to the production queue.
 */
export function trainUnit(
	world: GameWorld,
	buildingEid: number,
	unitType: string,
): boolean {
	if (!world.runtime.alive.has(buildingEid)) return false;
	if (Flags.isBuilding[buildingEid] !== 1) return false;

	// Get unit cost from known unit costs
	const unitCosts: Record<string, { fish: number; timber: number; salvage: number; buildTimeMs: number }> = {
		river_rat: { fish: 50, timber: 0, salvage: 0, buildTimeMs: 15000 },
		mudfoot: { fish: 80, timber: 0, salvage: 20, buildTimeMs: 20000 },
		shellcracker: { fish: 70, timber: 0, salvage: 30, buildTimeMs: 22000 },
		sapper: { fish: 100, timber: 0, salvage: 50, buildTimeMs: 30000 },
		mortar_otter: { fish: 80, timber: 0, salvage: 60, buildTimeMs: 35000 },
	};

	const costDef = unitCosts[unitType];
	if (!costDef) return false;

	// Check resources
	const res = world.session.resources;
	if (
		res.fish < costDef.fish ||
		res.timber < costDef.timber ||
		res.salvage < costDef.salvage
	) {
		return false;
	}

	// Check population
	if (world.runtime.population.current >= world.runtime.population.max) {
		return false;
	}

	// Deduct resources
	res.fish -= costDef.fish;
	res.timber -= costDef.timber;
	res.salvage -= costDef.salvage;

	// Add to production queue
	const queue = getProductionQueue(world, buildingEid);
	const entry: ProductionEntry & { buildTimeMs: number } = {
		type: "unit",
		contentId: unitType,
		progress: 0,
		buildTimeMs: costDef.buildTimeMs,
	};
	queue.push(entry);

	// Track population reservation
	world.runtime.population.current += 1;

	return true;
}

/**
 * Issue attack-move orders to a group of units.
 */
export function attackMove(
	world: GameWorld,
	unitEids: number[],
	targetX: number,
	targetY: number,
): boolean {
	let assigned = false;
	for (const eid of unitEids) {
		if (!world.runtime.alive.has(eid)) continue;

		const orders = getOrderQueue(world, eid);
		orders.length = 0;

		// Find the nearest enemy to the target position
		let nearestEnemyEid = 0;
		let nearestDist = Infinity;
		for (const candidate of world.runtime.alive) {
			if (Faction.id[candidate] === FACTION_IDS.ura) continue;
			if (Faction.id[candidate] === FACTION_IDS.neutral) continue;
			if (Flags.isResource[candidate] === 1) continue;
			if (Flags.isProjectile[candidate] === 1) continue;
			if (Health.current[candidate] <= 0) continue;

			const dx = Position.x[candidate] - targetX;
			const dy = Position.y[candidate] - targetY;
			const dist = dx * dx + dy * dy;
			if (dist < nearestDist) {
				nearestDist = dist;
				nearestEnemyEid = candidate;
			}
		}

		if (nearestEnemyEid > 0) {
			orders.push({
				type: "attack",
				targetEid: nearestEnemyEid,
				targetX: Position.x[nearestEnemyEid],
				targetY: Position.y[nearestEnemyEid],
			});
		} else {
			orders.push({
				type: "move",
				targetX,
				targetY,
			});
		}
		assigned = true;
	}
	return assigned;
}

/**
 * Pull units to defend a position.
 * Units move to the position and then attack any enemies in range.
 */
export function defendPosition(
	world: GameWorld,
	unitEids: number[],
	x: number,
	y: number,
): boolean {
	let assigned = false;
	for (const eid of unitEids) {
		if (!world.runtime.alive.has(eid)) continue;

		const orders = getOrderQueue(world, eid);
		orders.length = 0;

		// Find nearest threat
		let nearestThreatEid = 0;
		let nearestDist = Infinity;
		for (const candidate of world.runtime.alive) {
			if (Faction.id[candidate] === FACTION_IDS.ura) continue;
			if (Faction.id[candidate] === FACTION_IDS.neutral) continue;
			if (Flags.isResource[candidate] === 1) continue;
			if (Flags.isProjectile[candidate] === 1) continue;
			if (Health.current[candidate] <= 0) continue;

			const dx = Position.x[candidate] - x;
			const dy = Position.y[candidate] - y;
			const dist = dx * dx + dy * dy;
			if (dist < nearestDist) {
				nearestDist = dist;
				nearestThreatEid = candidate;
			}
		}

		if (nearestThreatEid > 0 && nearestDist < 512 * 512) {
			orders.push({
				type: "attack",
				targetEid: nearestThreatEid,
				targetX: Position.x[nearestThreatEid],
				targetY: Position.y[nearestThreatEid],
			});
		} else {
			orders.push({
				type: "move",
				targetX: x,
				targetY: y,
			});
		}
		assigned = true;
	}
	return assigned;
}

/**
 * Send a unit to scout a target position.
 */
export function scoutTo(
	world: GameWorld,
	unitEid: number,
	targetX: number,
	targetY: number,
): boolean {
	if (!world.runtime.alive.has(unitEid)) return false;

	const orders = getOrderQueue(world, unitEid);
	orders.length = 0;
	orders.push({
		type: "move",
		targetX,
		targetY,
	});
	return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Worker unit types — categoryId may not be set on bootstrapped entities. */
const WORKER_TYPES = new Set(["river_rat"]);

/**
 * Find the nearest idle URA worker to a world position.
 * Identifies workers by categoryId, unit type, or "gather" ability.
 */
function findNearestIdleWorker(world: GameWorld, x: number, y: number): number {
	let bestEid = -1;
	let bestDist = Infinity;

	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Flags.isBuilding[eid] === 1) continue;
		if (Flags.isResource[eid] === 1) continue;

		const unitType = world.runtime.entityTypeIndex.get(eid) ?? "";
		const isWorker =
			Content.categoryId[eid] === CATEGORY_IDS.worker ||
			WORKER_TYPES.has(unitType) ||
			(world.runtime.entityAbilities.get(eid)?.includes("gather") ?? false);
		if (!isWorker) continue;

		const orders = world.runtime.orderQueues.get(eid);
		if (orders && orders.length > 0) continue;

		const dx = Position.x[eid] - x;
		const dy = Position.y[eid] - y;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			bestEid = eid;
		}
	}

	return bestEid;
}
