/**
 * Economy System — Full resource gathering cycle and passive income.
 *
 * Handles:
 * 1. Gatherer entities near ResourceNodes: gather resources over time,
 *    fill carry capacity, walk to nearest depot, deposit, auto-return.
 * 2. Fish Trap passive income: +3 fish per 10 seconds for each owned Fish Trap.
 * 3. Lumber mill gathering speed bonus (+25% timber gather rate).
 * 4. Resource node depletion (nodes run out after fixed gather ticks).
 * 5. Carry capacity limits (workers carry up to capacity before returning).
 * 6. Difficulty-scaled income for player faction.
 *
 * Gather cycle:
 *   worker at resource → harvest timer → fill carry → walk to depot → deposit → auto-return
 */

import {
	Content,
	Faction,
	Flags,
	Gatherer,
	Health,
	Position,
	ResourceNode,
} from "@/engine/world/components";
import { CATEGORY_IDS, FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Distance (in pixels) at which a worker can gather from a resource node. */
const GATHER_RANGE = 48;

/** Distance (in pixels) at which a worker can deposit at a building. */
const DEPOSIT_RANGE = 48;

/** Base seconds of gathering per 1 resource unit. */
const GATHER_INTERVAL = 2;

// TODO: Default carry capacity — uncomment when depot-return cycle is wired in
// const DEFAULT_CARRY_CAPACITY = 10;

/** Fish generated per Fish Trap per passive income tick. */
const FISH_TRAP_INCOME = 3;

/** Passive income interval in seconds. */
const FISH_TRAP_INTERVAL = 10;

/** Lumber mill gather speed bonus (multiplier). */
const LUMBER_MILL_BONUS = 1.25;

/** Per-worker accumulated gather time (eid -> seconds). */
const gatherTimers = new Map<number, number>();

/** Per-worker resource type being carried. */
const carryingType = new Map<number, "fish" | "timber" | "salvage">();

/** Accumulated time for Fish Trap passive income. */
let fishTrapTimer = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}

/** Determine the resource type from a resource entity's type string. */
function resolveResourceType(
	nodeType: string | undefined,
): "fish" | "timber" | "salvage" | null {
	if (!nodeType) return null;
	if (nodeType.includes("fish")) return "fish";
	if (nodeType.includes("timber")) return "timber";
	if (nodeType.includes("salvage")) return "salvage";
	return null;
}

/**
 * Find the nearest Command Post (depot) for a worker to deposit resources.
 * Returns entity ID or -1 if none found.
 */
function findNearestDepot(world: GameWorld, workerEid: number): number {
	const wx = Position.x[workerEid];
	const wy = Position.y[workerEid];
	let nearestEid = -1;
	let nearestDist = Number.POSITIVE_INFINITY;

	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Health.current[eid] <= 0) continue;

		const buildingType = world.runtime.entityTypeIndex.get(eid);
		if (buildingType !== "command_post" && buildingType !== "burrow") continue;

		const dist = distanceBetween(wx, wy, Position.x[eid], Position.y[eid]);
		if (dist < nearestDist) {
			nearestDist = dist;
			nearestEid = eid;
		}
	}

	return nearestEid;
}

/**
 * Check if the player has a lumber mill (for timber gather speed bonus).
 */
function hasLumberMill(world: GameWorld): boolean {
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Health.current[eid] <= 0) continue;

		const buildingType = world.runtime.entityTypeIndex.get(eid);
		if (buildingType === "lumber_mill") return true;
	}
	return false;
}

/**
 * Get difficulty-based income modifier.
 * support=1.25, tactical=1.0, elite=0.75
 */
function getDifficultyIncomeModifier(world: GameWorld): number {
	switch (world.campaign.difficulty) {
		case "support":
			return 1.25;
		case "tactical":
			return 1.0;
		case "elite":
			return 0.75;
	}
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the economy system.
 * Processes gathering cycle, deposits, auto-return, and passive income.
 */
export function runEconomySystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	processGatherers(world, deltaSec);
	processFishTrapIncome(world, deltaSec);
}

// ---------------------------------------------------------------------------
// Gatherer processing
// ---------------------------------------------------------------------------

/**
 * Process all worker entities with gather orders.
 * Implements the full gather cycle: harvest -> carry -> deposit -> return.
 */
function processGatherers(world: GameWorld, deltaSec: number): void {
	const lumberMillActive = hasLumberMill(world);

	for (const eid of world.runtime.alive) {
		// Only process workers
		if (Content.categoryId[eid] !== CATEGORY_IDS.worker) continue;

		const orders = world.runtime.orderQueues.get(eid);
		if (!orders || orders.length === 0) continue;

		const currentOrder = orders[0];
		if (currentOrder.type !== "gather") continue;

		const targetEid = currentOrder.targetEid;
		if (targetEid === undefined) continue;

		// Verify target is a resource and is alive
		if (!world.runtime.alive.has(targetEid)) {
			orders.shift();
			gatherTimers.delete(eid);
			carryingType.delete(eid);
			Gatherer.amount[eid] = 0;
			continue;
		}
		if (Flags.isResource[targetEid] !== 1) {
			orders.shift();
			gatherTimers.delete(eid);
			carryingType.delete(eid);
			Gatherer.amount[eid] = 0;
			continue;
		}

		// Determine gather mode based on whether capacity is explicitly set.
		// Capacity 0 = "simple mode" (deposit directly to session each tick).
		// Capacity > 0 = "carry cycle" (accumulate, walk to depot, deposit).
		const capacity = Gatherer.capacity[eid];
		const useCarryCycle = capacity > 0;
		const carrying = Gatherer.amount[eid];

		// ---------------------------------------------------------------
		// Phase: Deposit — if carrying is full, walk to depot and deposit
		// ---------------------------------------------------------------
		if (useCarryCycle && carrying >= capacity) {
			const depotEid = findNearestDepot(world, eid);
			if (depotEid === -1) continue; // No depot — can't deposit

			const depotDist = distanceBetween(
				Position.x[eid], Position.y[eid],
				Position.x[depotEid], Position.y[depotEid],
			);

			if (depotDist <= DEPOSIT_RANGE) {
				// Deposit resources
				const resourceType = carryingType.get(eid);
				if (resourceType) {
					const amount = Math.floor(Gatherer.amount[eid]);
					const scaledAmount = Math.round(amount * getDifficultyIncomeModifier(world));
					world.session.resources[resourceType] += scaledAmount;
					world.events.push({
						type: "resource-deposited",
						payload: { resourceType, amount: scaledAmount },
					});
				}

				// Reset carry state
				Gatherer.amount[eid] = 0;
				carryingType.delete(eid);
				gatherTimers.delete(eid);

				// Auto-return to the same resource node (if still alive)
				if (world.runtime.alive.has(targetEid)) {
					// Already have the gather order pointing at the resource
					// Movement system will move us back
				} else {
					orders.shift();
				}
			} else {
				// Not at depot yet — move toward it
				// Insert a temporary move-to-depot by updating order coords
				// The movement system uses targetX/targetY for "move" type,
				// but gather orders move toward the resource. We need to
				// temporarily redirect.
				// We handle this by checking if we should move to depot in the
				// movement system — for now, set targetX/Y to depot
				currentOrder.targetX = Position.x[depotEid];
				currentOrder.targetY = Position.y[depotEid];
			}
			continue;
		}

		// ---------------------------------------------------------------
		// Phase: Gather — if near resource, accumulate resources
		// ---------------------------------------------------------------
		const wx = Position.x[eid];
		const wy = Position.y[eid];
		const rx = Position.x[targetEid];
		const ry = Position.y[targetEid];
		const dist = distanceBetween(wx, wy, rx, ry);

		if (dist > GATHER_RANGE) {
			// Move toward resource
			currentOrder.targetX = rx;
			currentOrder.targetY = ry;
			continue;
		}

		// Check if resource node is depleted
		if (ResourceNode.remaining[targetEid] < 0) {
			// Node depleted — deposit what we have if carrying anything
			if (useCarryCycle && Gatherer.amount[eid] > 0) {
				// Force deposit by setting amount to capacity
				Gatherer.amount[eid] = capacity;
			} else {
				orders.shift();
				gatherTimers.delete(eid);
				carryingType.delete(eid);
			}
			continue;
		}

		// Determine resource type
		const nodeType = world.runtime.entityTypeIndex.get(targetEid);
		const resourceType = resolveResourceType(nodeType);
		if (!resourceType) continue;

		// Set carrying type
		if (!carryingType.has(eid)) {
			carryingType.set(eid, resourceType);
		}

		// Calculate gather rate with bonuses
		let gatherRate = 1.0;
		if (resourceType === "timber" && lumberMillActive) {
			gatherRate *= LUMBER_MILL_BONUS;
		}

		// Accumulate gather time
		const prevTimer = gatherTimers.get(eid) ?? 0;
		const newTimer = prevTimer + deltaSec * gatherRate;

		if (newTimer >= GATHER_INTERVAL) {
			if (useCarryCycle) {
				// Carry cycle: accumulate into carry buffer
				const gatherAmount = Math.min(1, capacity - Gatherer.amount[eid]);
				Gatherer.amount[eid] += gatherAmount;

				// Deplete the resource node
				if (ResourceNode.remaining[targetEid] > 0) {
					ResourceNode.remaining[targetEid] -= gatherAmount;
					if (ResourceNode.remaining[targetEid] <= 0) {
						ResourceNode.remaining[targetEid] = -1; // Mark as depleted
						world.events.push({
							type: "resource-depleted",
							payload: { eid: targetEid },
						});
					}
				}
			} else {
				// Simple mode: deposit 1 resource directly to session
				world.session.resources[resourceType] += 1;

				// Deplete the resource node
				if (ResourceNode.remaining[targetEid] > 0) {
					ResourceNode.remaining[targetEid] -= 1;
					if (ResourceNode.remaining[targetEid] <= 0) {
						ResourceNode.remaining[targetEid] = -1;
						world.events.push({
							type: "resource-depleted",
							payload: { eid: targetEid },
						});
					}
				}
			}

			gatherTimers.set(eid, newTimer - GATHER_INTERVAL);
		} else {
			gatherTimers.set(eid, newTimer);
		}
	}
}

// ---------------------------------------------------------------------------
// Fish Trap passive income
// ---------------------------------------------------------------------------

/**
 * Each Fish Trap owned by URA generates passive fish income.
 */
function processFishTrapIncome(world: GameWorld, deltaSec: number): void {
	fishTrapTimer += deltaSec;

	if (fishTrapTimer < FISH_TRAP_INTERVAL) return;

	// Count Fish Traps
	let fishTrapCount = 0;
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Health.current[eid] <= 0) continue;

		const buildingType = world.runtime.entityTypeIndex.get(eid);
		if (buildingType === "fish_trap") {
			fishTrapCount++;
		}
	}

	if (fishTrapCount > 0) {
		const income = Math.round(
			fishTrapCount * FISH_TRAP_INCOME * getDifficultyIncomeModifier(world),
		);
		world.session.resources.fish += income;
		world.events.push({
			type: "passive-income",
			payload: { resource: "fish", amount: income, source: "fish_trap" },
		});
	}

	// Reset timer (keep remainder for accuracy)
	fishTrapTimer -= FISH_TRAP_INTERVAL;
}

// ---------------------------------------------------------------------------
// Reset (for tests and new missions)
// ---------------------------------------------------------------------------

/** Reset internal gather timers and carry state. */
export function resetGatherTimers(): void {
	gatherTimers.clear();
	carryingType.clear();
	fishTrapTimer = 0;
}
