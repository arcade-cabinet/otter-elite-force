/**
 * Multi-Base System — Secondary Command Posts, collection radii, and supply caravans.
 *
 * Handles:
 * 1. findNearestCPInRadius: workers deposit to nearest CP within collection radius
 * 2. findNearestCPGlobal: fallback nearest CP with no radius constraint
 * 3. canPlaceSecondaryCP: validate placement at predetermined scenario locations
 * 4. Supply caravans: automated raftsmen ferrying resources between CPs
 * 5. Caravan pickup/delivery of resources at CPs
 * 6. Caravan vulnerability: dead caravans lose all carried resources
 *
 * Used in Mission 13 (Great Siphon).
 * Pure function on GameWorld.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { Faction, Flags, Health, Position, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval, spawnUnit } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default collection radius for command posts (in tiles/pixels). */
const DEFAULT_COLLECTION_RADIUS = 10;

/** Distance threshold for considering "same location" (in tiles). */
const PLACEMENT_SNAP = 1.0;

/** Arrival threshold for caravans reaching a waypoint. */
const CARAVAN_ARRIVAL_THRESHOLD = 1.0;

/** Default caravan speed in units per second. */
const DEFAULT_CARAVAN_SPEED = 2;

/** Default caravan carry capacity. */
const DEFAULT_CARAVAN_CAPACITY = 20;

// ---------------------------------------------------------------------------
// Types & Runtime augmentation
// ---------------------------------------------------------------------------

/** Predetermined location where a secondary CP can be built (from scenario data). */
export interface CommandPostLocation {
	id: string;
	x: number;
	y: number;
}

/** Resource cargo carried by a caravan. */
export interface CaravanCargo {
	type: "fish" | "timber" | "salvage" | "";
	amount: number;
}

/** A supply caravan entity's runtime data. */
export interface CaravanEntry {
	/** Entity ID of the caravan unit. */
	eid: number;
	/** Route as a list of CP entity IDs to cycle between. */
	routeCPEids: number[];
	/** Current index in the route. */
	routeIndex: number;
	/** Caravan speed (tiles per second). */
	speed: number;
	/** Maximum carry capacity. */
	capacity: number;
	/** Current cargo type. */
	carryingType: CaravanCargo["type"];
	/** Current cargo amount. */
	carryingAmount: number;
}

/** Command post collection radius entry. */
export interface CPRadiusEntry {
	eid: number;
	radius: number;
}

export interface MultiBaseRuntime {
	/** Collection radii per command post entity. */
	cpRadii?: CPRadiusEntry[];
	/** Active supply caravans. */
	caravans?: CaravanEntry[];
	/** Allowed secondary CP placement locations (from scenario). */
	cpLocations?: CommandPostLocation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// Collection Radius -- Worker Deposit Routing
// ---------------------------------------------------------------------------

/**
 * Find the nearest Command Post whose collection radius covers the given position.
 * Returns the entity ID, or -1 if none found.
 */
export function findNearestCPInRadius(
	world: GameWorld,
	workerX: number,
	workerY: number,
): number {
	const runtime = world.runtime as unknown as MultiBaseRuntime & GameWorld["runtime"];
	const radii = runtime.cpRadii;
	if (!radii || radii.length === 0) return -1;

	let nearest = -1;
	let nearestDist = Number.POSITIVE_INFINITY;

	for (const entry of radii) {
		if (!world.runtime.alive.has(entry.eid)) continue;
		if (Health.current[entry.eid] <= 0) continue;

		const cpX = Position.x[entry.eid];
		const cpY = Position.y[entry.eid];
		const dist = tileDistance(workerX, workerY, cpX, cpY);

		if (dist <= entry.radius && dist < nearestDist) {
			nearestDist = dist;
			nearest = entry.eid;
		}
	}

	return nearest;
}

/**
 * Find the nearest Command Post globally (no radius constraint).
 * Fallback when no CP's radius covers the worker.
 * Returns the entity ID, or -1 if none found.
 */
export function findNearestCPGlobal(
	world: GameWorld,
	workerX: number,
	workerY: number,
): number {
	let nearest = -1;
	let nearestDist = Number.POSITIVE_INFINITY;

	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Health.current[eid] <= 0) continue;

		const buildingType = world.runtime.entityTypeIndex.get(eid);
		if (buildingType !== "command_post" && buildingType !== "burrow") continue;

		const dist = tileDistance(workerX, workerY, Position.x[eid], Position.y[eid]);
		if (dist < nearestDist) {
			nearestDist = dist;
			nearest = eid;
		}
	}

	return nearest;
}

// ---------------------------------------------------------------------------
// Secondary CP Placement Validation
// ---------------------------------------------------------------------------

/**
 * Check if a secondary CP can be placed at a given predetermined location.
 * - The location ID must exist in the scenario's allowed locations.
 * - No existing CP may be within PLACEMENT_SNAP tiles of that location.
 */
export function canPlaceSecondaryCP(
	world: GameWorld,
	locationId: string,
): boolean {
	const runtime = world.runtime as unknown as MultiBaseRuntime & GameWorld["runtime"];
	const locations = runtime.cpLocations;
	if (!locations) return false;

	const location = locations.find((loc) => loc.id === locationId);
	if (!location) return false;

	// Check for existing CPs near this location
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		const buildingType = world.runtime.entityTypeIndex.get(eid);
		if (buildingType !== "command_post" && buildingType !== "burrow") continue;

		if (tileDistance(Position.x[eid], Position.y[eid], location.x, location.y) < PLACEMENT_SNAP) {
			return false;
		}
	}

	return true;
}

// ---------------------------------------------------------------------------
// CP Registration
// ---------------------------------------------------------------------------

/**
 * Register a command post with a collection radius.
 */
export function registerCommandPost(
	world: GameWorld,
	cpEid: number,
	radius: number = DEFAULT_COLLECTION_RADIUS,
): void {
	const runtime = world.runtime as unknown as MultiBaseRuntime;
	if (!runtime.cpRadii) {
		runtime.cpRadii = [];
	}

	runtime.cpRadii.push({ eid: cpEid, radius });
}

// ---------------------------------------------------------------------------
// Supply Caravan Factory & Management
// ---------------------------------------------------------------------------

/**
 * Create a supply caravan that will cycle between the given Command Posts.
 * The caravan starts at the first CP's position.
 * Returns the caravan entity ID.
 */
export function createSupplyCaravan(
	world: GameWorld,
	routeCPEids: number[],
	speed: number = DEFAULT_CARAVAN_SPEED,
	capacity: number = DEFAULT_CARAVAN_CAPACITY,
): number {
	if (routeCPEids.length < 2) {
		throw new Error("Supply caravan requires at least 2 command posts in route");
	}

	const startCPEid = routeCPEids[0];
	const startX = Position.x[startCPEid];
	const startY = Position.y[startCPEid];

	const eid = spawnUnit(world, {
		x: startX,
		y: startY,
		faction: "ura",
		unitType: "supply_caravan",
		health: { current: 50, max: 50 },
	});

	Speed.value[eid] = speed;

	const runtime = world.runtime as unknown as MultiBaseRuntime;
	if (!runtime.caravans) {
		runtime.caravans = [];
	}

	runtime.caravans.push({
		eid,
		routeCPEids: [...routeCPEids],
		routeIndex: 1, // Start heading to second CP
		speed,
		capacity,
		carryingType: "",
		carryingAmount: 0,
	});

	return eid;
}

/**
 * Get the current cargo of a caravan entity.
 */
export function getCaravanCargo(world: GameWorld, caravanEid: number): CaravanCargo {
	const runtime = world.runtime as unknown as MultiBaseRuntime;
	const caravans = runtime.caravans;
	if (!caravans) return { type: "", amount: 0 };

	const entry = caravans.find((c) => c.eid === caravanEid);
	if (!entry) return { type: "", amount: 0 };

	return { type: entry.carryingType, amount: entry.carryingAmount };
}

// ---------------------------------------------------------------------------
// Caravan movement & delivery
// ---------------------------------------------------------------------------

/**
 * Move all supply caravans toward their next route waypoint.
 * When a caravan arrives at a CP, it delivers cargo and advances.
 */
function tickCaravans(world: GameWorld, deltaSec: number): void {
	const runtime = world.runtime as unknown as MultiBaseRuntime & GameWorld["runtime"];
	const caravans = runtime.caravans;
	if (!caravans || caravans.length === 0) return;

	const survivingCaravans: CaravanEntry[] = [];

	for (const caravan of caravans) {
		// Check if caravan is dead
		if (!world.runtime.alive.has(caravan.eid)) {
			// Dead caravan loses all cargo -- emit event
			if (caravan.carryingAmount > 0) {
				world.events.push({
					type: "caravan-destroyed",
					payload: {
						eid: caravan.eid,
						lostType: caravan.carryingType,
						lostAmount: caravan.carryingAmount,
					},
				});
			}
			continue;
		}

		if (Health.current[caravan.eid] <= 0) {
			// About to die -- lose cargo
			if (caravan.carryingAmount > 0) {
				world.events.push({
					type: "caravan-destroyed",
					payload: {
						eid: caravan.eid,
						lostType: caravan.carryingType,
						lostAmount: caravan.carryingAmount,
					},
				});
			}
			markForRemoval(world, caravan.eid);
			continue;
		}

		survivingCaravans.push(caravan);

		if (caravan.routeCPEids.length === 0) continue;

		// Get destination CP
		const destCPEid = caravan.routeCPEids[caravan.routeIndex];
		if (destCPEid === undefined) {
			caravan.routeIndex = 0;
			continue;
		}

		// Check if destination CP is dead/destroyed
		if (!world.runtime.alive.has(destCPEid) || Health.current[destCPEid] <= 0) {
			// Skip to next CP in route
			caravan.routeIndex = (caravan.routeIndex + 1) % caravan.routeCPEids.length;
			continue;
		}

		const cx = Position.x[caravan.eid];
		const cy = Position.y[caravan.eid];
		const destX = Position.x[destCPEid];
		const destY = Position.y[destCPEid];
		const dist = tileDistance(cx, cy, destX, destY);

		if (dist <= CARAVAN_ARRIVAL_THRESHOLD) {
			// Arrived at destination CP -- deliver cargo
			if (caravan.carryingAmount > 0) {
				deliverCaravanCargo(world, caravan);
			}

			// Pick up resources from this CP (if any available from session pool)
			pickupCaravanCargo(world, caravan);

			// Advance to next CP
			caravan.routeIndex = (caravan.routeIndex + 1) % caravan.routeCPEids.length;
		} else {
			// Move toward destination
			const step = Math.min(caravan.speed * deltaSec, dist);
			const dx = destX - cx;
			const dy = destY - cy;
			Position.x[caravan.eid] = cx + (dx / dist) * step;
			Position.y[caravan.eid] = cy + (dy / dist) * step;
		}
	}

	runtime.caravans = survivingCaravans;
}

/**
 * Deliver carried resources to the world-level resource pool.
 */
function deliverCaravanCargo(world: GameWorld, caravan: CaravanEntry): void {
	if (caravan.carryingAmount <= 0 || caravan.carryingType === "") return;

	const amount = caravan.carryingAmount;
	const type = caravan.carryingType;

	switch (type) {
		case "fish":
			world.session.resources.fish += amount;
			break;
		case "timber":
			world.session.resources.timber += amount;
			break;
		case "salvage":
			world.session.resources.salvage += amount;
			break;
	}

	world.events.push({
		type: "caravan-delivered",
		payload: {
			eid: caravan.eid,
			resourceType: type,
			amount,
		},
	});

	caravan.carryingType = "";
	caravan.carryingAmount = 0;
}

/**
 * Pick up resources from the resource pool for transport.
 * Picks the most abundant resource type, up to caravan capacity.
 */
function pickupCaravanCargo(world: GameWorld, caravan: CaravanEntry): void {
	// Don't pick up if already carrying
	if (caravan.carryingAmount > 0) return;

	const res = world.session.resources;
	const types: Array<{ type: "fish" | "timber" | "salvage"; amount: number }> = [
		{ type: "fish", amount: res.fish },
		{ type: "timber", amount: res.timber },
		{ type: "salvage", amount: res.salvage },
	];

	// Pick the most abundant resource
	types.sort((a, b) => b.amount - a.amount);
	const best = types[0];

	if (best.amount <= 0) return;

	const loadAmount = Math.min(best.amount, caravan.capacity);

	// Deduct from pool
	switch (best.type) {
		case "fish":
			world.session.resources.fish -= loadAmount;
			break;
		case "timber":
			world.session.resources.timber -= loadAmount;
			break;
		case "salvage":
			world.session.resources.salvage -= loadAmount;
			break;
	}

	caravan.carryingType = best.type;
	caravan.carryingAmount = loadAmount;

	world.events.push({
		type: "caravan-pickup",
		payload: {
			eid: caravan.eid,
			resourceType: best.type,
			amount: loadAmount,
		},
	});
}

// ---------------------------------------------------------------------------
// Master system tick
// ---------------------------------------------------------------------------

/**
 * Run one tick of the multi-base system.
 * Processes caravan movement/delivery and checks for base loss.
 */
export function runMultiBaseSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	// Tick caravans
	tickCaravans(world, deltaSec);

	// Check for all bases lost
	let playerBases = 0;
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Faction.id[eid] !== FACTION_IDS.ura) continue;
		if (Health.current[eid] <= 0) continue;

		const type = world.runtime.entityTypeIndex.get(eid);
		if (type === "command_post" || type === "burrow") {
			playerBases++;
		}
	}

	if (playerBases === 0 && world.session.phase === "playing") {
		world.events.push({ type: "all-bases-lost", payload: {} });
	}
}

// ---------------------------------------------------------------------------
// Reset (for tests and new missions)
// ---------------------------------------------------------------------------

/** Reset multi-base state on the runtime. */
export function resetMultiBaseState(world: GameWorld): void {
	const runtime = world.runtime as unknown as MultiBaseRuntime;
	runtime.cpRadii = undefined;
	runtime.caravans = undefined;
	runtime.cpLocations = undefined;
}
