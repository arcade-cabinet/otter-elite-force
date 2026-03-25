/**
 * Building System — Placement, construction, and ghost preview.
 *
 * Handles:
 * 1. Building placement: validate tile, deduct resources, spawn entity with
 *    ConstructionProgress trait.
 * 2. Construction tick: River Rat builders near incomplete buildings advance
 *    progress. At 100% the building activates.
 * 3. Ghost preview: returns placement validity for a given tile/building type.
 *
 * Runs every game tick via `buildingSystem(world, delta)`.
 */

import type { World } from "koota";
import { ALL_BUILDINGS } from "../data/buildings";
import { ConstructingAt, OwnedBy } from "../ecs/relations";
import { AIState } from "../ecs/traits/ai";
import { Armor, Attack, Health } from "../ecs/traits/combat";
import { ConstructionProgress, ProductionQueue } from "../ecs/traits/economy";
import { Faction, IsBuilding, UnitType } from "../ecs/traits/identity";
import { OrderQueue, RallyPoint } from "../ecs/traits/orders";
import { Position } from "../ecs/traits/spatial";
import { ResourcePool } from "../ecs/traits/state";
import { world as defaultWorld } from "../ecs/world";
import { getBuilding } from "../entities/registry";

const BUILD_RANGE = 1.5;
const BASE_BUILD_RATE = 100;

export type TerrainType = "grass" | "dirt" | "mud" | "water" | "mangrove" | "bridge";

export interface TileMap {
	getTerrain(x: number, y: number): TerrainType | null;
	isOccupied(x: number, y: number): boolean;
}

export function canPlaceBuilding(
	buildingId: string,
	x: number,
	y: number,
	tileMap: TileMap,
	world: World = defaultWorld,
): { valid: boolean; reason?: string } {
	const def = ALL_BUILDINGS[buildingId];
	if (!def) return { valid: false, reason: "Unknown building type" };
	const terrain = tileMap.getTerrain(x, y);
	if (terrain === null) return { valid: false, reason: "Out of bounds" };
	if (tileMap.isOccupied(x, y)) return { valid: false, reason: "Tile occupied" };
	if (terrain === "water")
		return def.requiresWater ? { valid: true } : { valid: false, reason: "Cannot build on water" };
	if (def.requiresWater) return { valid: false, reason: "Must be placed on water edge" };
	if (terrain === "mangrove") return { valid: false, reason: "Cannot build on mangrove" };
	const pool = world.get(ResourcePool);
	if (
		!pool ||
		pool.fish < (def.cost.fish ?? 0) ||
		pool.timber < (def.cost.timber ?? 0) ||
		pool.salvage < (def.cost.salvage ?? 0)
	) {
		return { valid: false, reason: "Insufficient resources" };
	}
	return { valid: true };
}

export function placeBuilding(
	world: World,
	buildingId: string,
	x: number,
	y: number,
	tileMap: TileMap,
	ownerFaction: ReturnType<World["spawn"]>,
) {
	const validation = canPlaceBuilding(buildingId, x, y, tileMap, world);
	if (!validation.valid) return null;
	const def = ALL_BUILDINGS[buildingId];
	const runtimeDef = getBuilding(buildingId);
	const pool = world.get(ResourcePool);
	if (
		!pool ||
		pool.fish < (def.cost.fish ?? 0) ||
		pool.timber < (def.cost.timber ?? 0) ||
		pool.salvage < (def.cost.salvage ?? 0)
	)
		return null;
	world.set(ResourcePool, {
		fish: pool.fish - (def.cost.fish ?? 0),
		timber: pool.timber - (def.cost.timber ?? 0),
		salvage: pool.salvage - (def.cost.salvage ?? 0),
	});
	return world.spawn(
		IsBuilding,
		UnitType({ type: buildingId }),
		Faction({ id: ownerFaction.get(Faction)?.id ?? runtimeDef?.faction ?? def.faction }),
		Position({ x, y }),
		Health({ current: def.hp, max: def.hp }),
		Armor({ value: runtimeDef?.armor ?? 0 }),
		ConstructionProgress({ progress: 0, buildTime: def.buildTime }),
		OwnedBy(ownerFaction),
	);
}

export function buildingSystem(world: World, delta: number): void {
	const builders = world.query(Position, ConstructingAt("*"));
	for (const builder of builders) {
		const building = builder.targetFor(ConstructingAt);
		if (!building || !building.has(ConstructionProgress)) continue;
		const builderPos = builder.get(Position);
		const buildingPos = building.get(Position);
		if (!builderPos || !buildingPos) continue;
		const dist = Math.hypot(builderPos.x - buildingPos.x, builderPos.y - buildingPos.y);
		if (dist > BUILD_RANGE) continue;
		const cp = building.get(ConstructionProgress);
		if (!cp || cp.progress >= 100) continue;
		const newProgress = Math.min(100, cp.progress + (BASE_BUILD_RATE / cp.buildTime) * delta);
		building.set(ConstructionProgress, { progress: newProgress });
		if (newProgress >= 100) {
			activateBuilding(building);
			building.remove(ConstructionProgress);
			releaseBuilders(world, building);
		}
	}
}

function activateBuilding(building: ReturnType<World["spawn"]>): void {
	const unitType = building.get(UnitType);
	if (!unitType) return;
	const runtimeDef = getBuilding(unitType.type);
	if (!runtimeDef) return;
	if (runtimeDef.trains?.length && !building.has(ProductionQueue)) building.add(ProductionQueue);
	if (runtimeDef.trains?.length && !building.has(RallyPoint)) {
		const pos = building.get(Position);
		building.add(RallyPoint({ x: (pos?.x ?? 0) + 1, y: pos?.y ?? 0 }));
	}
	if (runtimeDef.attackDamage != null && !building.has(Attack)) {
		building.add(
			Attack({
				damage: runtimeDef.attackDamage,
				range: runtimeDef.attackRange ?? 0,
				cooldown: runtimeDef.attackCooldown ?? 2,
				timer: 0,
			}),
		);
	}
}

function releaseBuilders(world: World, building: ReturnType<World["spawn"]>): void {
	for (const builder of world.query(Position, ConstructingAt("*"))) {
		if (builder.targetFor(ConstructingAt) !== building) continue;
		builder.remove(ConstructingAt(building));
		if (builder.has(OrderQueue)) {
			const orders = builder.get(OrderQueue);
			if (orders && orders[0]?.type === "build") orders.shift();
		}
		if (builder.has(AIState)) builder.set(AIState, (prev) => ({ ...prev, state: "idle" }));
	}
}
