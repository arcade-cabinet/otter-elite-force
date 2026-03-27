/**
 * Building System — Construction progress, placement validation,
 * building activation, pop cap enforcement, and destruction handling.
 *
 * Handles:
 * 1. Construction progress: workers (builders) near incomplete buildings
 *    advance progress from 0->100% over build time.
 * 2. Pop cap enforcement: can't train units if at population cap.
 * 3. Building placement validation: no overlap, valid terrain, sufficient
 *    resources.
 * 4. Building completion: activates production queues, applies pop cap
 *    bonuses, enables defensive attacks.
 * 5. Building destruction: emits rubble event, disables production,
 *    reduces pop cap.
 *
 * Runs every game tick via `runBuildingSystem(world)`.
 */

import { CATEGORY_IDS } from "@/engine/content/ids";
import {
	Attack,
	Construction,
	Content,
	Faction,
	Flags,
	Health,
	Position,
	VisionRadius,
} from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { spawnBuilding as spawnBuildingEntity } from "@/engine/world/gameWorld";

/** Worker unit types — fallback when categoryId is not set. */
const WORKER_TYPE_NAMES = new Set(["river_rat"]);

/** Check if an entity is a worker by categoryId, type name, or build ability. */
function isWorkerEntity(world: GameWorld, eid: number): boolean {
	return (
		Content.categoryId[eid] === CATEGORY_IDS.worker ||
		WORKER_TYPE_NAMES.has(world.runtime.entityTypeIndex.get(eid) ?? "") ||
		(world.runtime.entityAbilities.get(eid)?.includes("build") ?? false)
	);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Distance in pixels at which a builder can contribute to construction. */
const BUILD_RANGE = 48;

/** Base construction rate: progress percent per second with one builder. */
const BASE_BUILD_RATE = 100;

/** Terrain types for placement validation. */
export type TerrainType = "grass" | "dirt" | "mud" | "water" | "mangrove" | "bridge";

// ---------------------------------------------------------------------------
// Building definitions (inline subset for placement/activation)
// ---------------------------------------------------------------------------

interface BuildingDef {
	id: string;
	cost: { fish?: number; timber?: number; salvage?: number };
	hp: number;
	buildTime: number;
	requiresWater?: boolean;
	popCapBonus?: number;
	trains?: string[];
	attackDamage?: number;
	attackRange?: number;
	attackCooldown?: number;
	visionBonus?: number;
}

/**
 * Minimal building registry. In production, this would be loaded from
 * content data. Kept inline to avoid circular dependencies.
 */
const BUILDING_DEFS: Record<string, BuildingDef> = {
	command_post: {
		id: "command_post",
		cost: { fish: 200, timber: 100 },
		hp: 600,
		buildTime: 45,
		popCapBonus: 10,
		trains: ["river_rat"],
	},
	barracks: {
		id: "barracks",
		cost: { fish: 100, timber: 150 },
		hp: 350,
		buildTime: 25,
		trains: ["mudfoot", "shellcracker"],
	},
	armory: {
		id: "armory",
		cost: { timber: 300, salvage: 100 },
		hp: 400,
		buildTime: 40,
		trains: ["sapper", "mortar_otter"],
	},
	watchtower: {
		id: "watchtower",
		cost: { timber: 100, salvage: 50 },
		hp: 200,
		buildTime: 20,
		attackDamage: 8,
		attackRange: 192,
		attackCooldown: 2,
		visionBonus: 8,
	},
	fish_trap: {
		id: "fish_trap",
		cost: { timber: 75 },
		hp: 100,
		buildTime: 15,
		requiresWater: true,
	},
	lumber_mill: {
		id: "lumber_mill",
		cost: { timber: 150 },
		hp: 250,
		buildTime: 25,
	},
	dock: {
		id: "dock",
		cost: { timber: 200, salvage: 75 },
		hp: 300,
		buildTime: 30,
		requiresWater: true,
		trains: ["raftsman", "diver"],
	},
	wall: {
		id: "wall",
		cost: { timber: 25 },
		hp: 150,
		buildTime: 5,
	},
	gun_tower: {
		id: "gun_tower",
		cost: { timber: 150, salvage: 100 },
		hp: 300,
		buildTime: 30,
		attackDamage: 12,
		attackRange: 192,
		attackCooldown: 1.5,
		visionBonus: 6,
	},
	burrow: {
		id: "burrow",
		cost: { timber: 200, salvage: 100 },
		hp: 400,
		buildTime: 45,
		popCapBonus: 5,
		trains: ["river_rat"],
	},
	research_den: {
		id: "research_den",
		cost: { timber: 200, salvage: 150 },
		hp: 350,
		buildTime: 35,
	},
};

/** Get a building definition by ID. Returns null if not found. */
export function getBuildingDef(id: string): BuildingDef | null {
	return BUILDING_DEFS[id] ?? null;
}

// ---------------------------------------------------------------------------
// Placement validation
// ---------------------------------------------------------------------------

export interface TileMap {
	getTerrain(x: number, y: number): TerrainType | null;
	isOccupied(x: number, y: number): boolean;
}

/**
 * Validate whether a building can be placed at the given tile position.
 * Checks: terrain validity, tile occupation, resource affordability.
 */
export function canPlaceBuilding(
	world: GameWorld,
	buildingId: string,
	x: number,
	y: number,
	tileMap: TileMap,
): { valid: boolean; reason?: string } {
	const def = BUILDING_DEFS[buildingId];
	if (!def) return { valid: false, reason: "Unknown building type" };

	const terrain = tileMap.getTerrain(x, y);
	if (terrain === null) return { valid: false, reason: "Out of bounds" };

	if (tileMap.isOccupied(x, y)) return { valid: false, reason: "Tile occupied" };

	// Water placement rules
	if (terrain === "water") {
		if (!def.requiresWater) return { valid: false, reason: "Cannot build on water" };
	} else {
		if (def.requiresWater) return { valid: false, reason: "Must be placed on water edge" };
	}

	if (terrain === "mangrove") return { valid: false, reason: "Cannot build on mangrove" };

	// Resource check
	const res = world.session.resources;
	if (
		res.fish < (def.cost.fish ?? 0) ||
		res.timber < (def.cost.timber ?? 0) ||
		res.salvage < (def.cost.salvage ?? 0)
	) {
		return { valid: false, reason: "Insufficient resources" };
	}

	return { valid: true };
}

/**
 * Place a building: deduct resources, spawn building entity with construction
 * progress at 0%.
 */
export function placeBuilding(
	world: GameWorld,
	buildingId: string,
	x: number,
	y: number,
	tileMap: TileMap,
): number | null {
	const validation = canPlaceBuilding(world, buildingId, x, y, tileMap);
	if (!validation.valid) return null;

	const def = BUILDING_DEFS[buildingId];

	// Deduct resources
	world.session.resources.fish -= def.cost.fish ?? 0;
	world.session.resources.timber -= def.cost.timber ?? 0;
	world.session.resources.salvage -= def.cost.salvage ?? 0;

	// Spawn building entity
	const eid = spawnBuildingEntity(world, {
		x,
		y,
		faction: "ura",
		buildingType: buildingId,
		health: { current: def.hp, max: def.hp },
		construction: { progress: 0, buildTime: def.buildTime },
	});

	world.events.push({
		type: "building-placed",
		payload: { buildingId, x, y, eid },
	});

	return eid;
}

// ---------------------------------------------------------------------------
// Construction tick
// ---------------------------------------------------------------------------

/**
 * Run one tick of the building construction system.
 * Workers near incomplete buildings advance construction progress.
 * On completion, activates the building and releases builders.
 */
export function runBuildingSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	// Find all incomplete buildings
	for (const buildingEid of world.runtime.alive) {
		if (Flags.isBuilding[buildingEid] !== 1) continue;

		const progress = Construction.progress[buildingEid];
		const buildTime = Construction.buildTime[buildingEid];

		// Skip complete buildings (progress >= 100 or buildTime == 0 meaning pre-built)
		if (progress >= 100) continue;
		if (buildTime <= 0 && progress > 0) continue;

		// Count builders in range
		let builderCount = 0;
		const bx = Position.x[buildingEid];
		const by = Position.y[buildingEid];

		for (const workerEid of world.runtime.alive) {
			if (!isWorkerEntity(world, workerEid)) continue;
			if (Faction.id[workerEid] !== Faction.id[buildingEid]) continue;

			// Worker must have a build order targeting this building
			const orders = world.runtime.orderQueues.get(workerEid);
			if (!orders || orders.length === 0) continue;
			if (orders[0].type !== "build") continue;

			const dist = distanceBetween(Position.x[workerEid], Position.y[workerEid], bx, by);
			if (dist <= BUILD_RANGE) {
				builderCount++;
			}
		}

		if (builderCount <= 0) continue;

		// Advance progress: each builder contributes (BASE_BUILD_RATE / buildTime) per second
		// Multiple builders increase build speed
		const rate = (BASE_BUILD_RATE / buildTime) * builderCount;
		const newProgress = Math.min(100, progress + rate * deltaSec);
		Construction.progress[buildingEid] = newProgress;

		if (newProgress >= 100) {
			activateBuilding(world, buildingEid);
			releaseBuilders(world, buildingEid);
			world.events.push({
				type: "building-complete",
				payload: {
					eid: buildingEid,
					x: Position.x[buildingEid],
					y: Position.y[buildingEid],
				},
			});
		}
	}

	// Check for destroyed buildings (health <= 0)
	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Health.current[eid] > 0) continue;
		if (world.runtime.removals.has(eid)) continue;

		handleBuildingDestruction(world, eid);
	}
}

// ---------------------------------------------------------------------------
// Building activation (on construction complete)
// ---------------------------------------------------------------------------

/**
 * Activate a completed building: enable production, apply pop cap,
 * set up defensive attacks, vision bonuses.
 */
function activateBuilding(world: GameWorld, buildingEid: number): void {
	const buildingType = world.runtime.entityTypeIndex.get(buildingEid);
	if (!buildingType) return;

	const def = BUILDING_DEFS[buildingType];
	if (!def) return;

	// Apply population cap bonus
	if (def.popCapBonus && def.popCapBonus > 0) {
		world.runtime.population.max += def.popCapBonus;
	}

	// Set up defensive attack stats
	if (def.attackDamage !== undefined && def.attackDamage > 0) {
		Attack.damage[buildingEid] = def.attackDamage;
		Attack.range[buildingEid] = def.attackRange ?? 0;
		Attack.cooldown[buildingEid] = def.attackCooldown ?? 2;
		Attack.timer[buildingEid] = 0;
	}

	// Apply vision bonus
	if (def.visionBonus !== undefined && def.visionBonus > 0) {
		VisionRadius.value[buildingEid] = def.visionBonus;
	}
}

// ---------------------------------------------------------------------------
// Building destruction
// ---------------------------------------------------------------------------

/**
 * Handle a building being destroyed: emit rubble event, reduce pop cap,
 * disable production.
 */
function handleBuildingDestruction(world: GameWorld, buildingEid: number): void {
	const buildingType = world.runtime.entityTypeIndex.get(buildingEid);
	if (buildingType) {
		const def = BUILDING_DEFS[buildingType];
		if (def) {
			// Reduce population cap
			if (def.popCapBonus && def.popCapBonus > 0) {
				world.runtime.population.max = Math.max(0, world.runtime.population.max - def.popCapBonus);
			}
		}
	}

	// Clear production queue
	world.runtime.productionQueues.delete(buildingEid);

	world.events.push({
		type: "building-destroyed",
		payload: { eid: buildingEid, x: Position.x[buildingEid], y: Position.y[buildingEid] },
	});
}

// ---------------------------------------------------------------------------
// Pop cap check
// ---------------------------------------------------------------------------

/**
 * Check if the player can train a unit (has room in pop cap).
 * @param popCost - Population cost of the unit to train.
 */
export function canTrainUnit(world: GameWorld, popCost: number): boolean {
	return world.runtime.population.current + popCost <= world.runtime.population.max;
}

// ---------------------------------------------------------------------------
// Release builders on construction complete
// ---------------------------------------------------------------------------

/**
 * Release all builders from their build order when a building completes.
 * Workers go idle and their build orders are cleared.
 */
function releaseBuilders(world: GameWorld, buildingEid: number): void {
	for (const workerEid of world.runtime.alive) {
		if (Content.categoryId[workerEid] !== CATEGORY_IDS.worker) continue;

		const orders = world.runtime.orderQueues.get(workerEid);
		if (!orders || orders.length === 0) continue;
		if (orders[0].type !== "build") continue;
		if (orders[0].targetEid !== buildingEid) continue;

		orders.shift();
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	return Math.sqrt(dx * dx + dy * dy);
}
