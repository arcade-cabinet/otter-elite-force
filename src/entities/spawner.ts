// src/entities/spawner.ts
// Converts entity definitions into Koota ECS entities with the correct traits.
// This is the bridge between the data-driven definitions and the runtime ECS.

import type { ConfigurableTrait, World } from "koota";
import { createSteeringVehicle } from "@/ai/steeringFactory";
import { OwnedBy } from "@/ecs/relations";
import { AIState, SteeringAgent } from "@/ecs/traits/ai";
import { Gatherer, PopulationCost, ProductionQueue, ResourceNode } from "@/ecs/traits/economy";
import {
	Category,
	Faction,
	IsBuilding,
	IsHero,
	IsResource,
	ScriptTag,
	UnitType,
} from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { PopulationState } from "@/ecs/traits/state";
import { type BossPhase, BossUnit } from "../ecs/traits/boss";
import { Armor, Attack, Health, VisionRadius } from "../ecs/traits/combat";
import { ConvoyVehicle, ConvoyWaypoints } from "../ecs/traits/convoy";
import { Position } from "../ecs/traits/spatial";
import { DetectionRadius } from "../ecs/traits/stealth";
import { CanSwim } from "../ecs/traits/water";
import type { BuildingDef, HeroDef, ResourceDef, UnitDef } from "./types";

export function ensureFactionOwner(world: World, factionId: string) {
	for (const entity of world.query(Faction)) {
		const faction = entity.get(Faction);
		if (!faction || faction.id !== factionId) continue;
		if (
			entity.has(Position) ||
			entity.has(UnitType) ||
			entity.has(IsBuilding) ||
			entity.has(IsResource)
		) {
			continue;
		}
		return entity;
	}

	return world.spawn(Faction({ id: factionId }));
}

/**
 * Spawn a unit (regular or hero) from its definition into the ECS world.
 * Returns the Koota entity handle.
 */
export function spawnUnit(
	world: World,
	def: UnitDef | HeroDef,
	x: number,
	y: number,
	faction?: string,
	scriptId?: string,
) {
	const traits: ConfigurableTrait[] = [
		Position({ x, y }),
		UnitType({ type: def.id }),
		Category({ category: def.category }),
		Faction({ id: faction ?? def.faction }),
		Health({ current: def.hp, max: def.hp }),
		Attack({
			damage: def.damage,
			range: def.range,
			cooldown: def.attackCooldown,
			timer: 0,
		}),
		Armor({ value: def.armor }),
		VisionRadius({ radius: def.visionRadius }),
		PopulationCost({ cost: def.populationCost }),
		OrderQueue,
		AIState({
			state: def.aiProfile?.defaultState ?? "idle",
			target: null,
			alertLevel: 0,
		}),
		SteeringAgent,
	];

	// Worker-specific
	if (def.gatherCapacity != null) {
		traits.push(Gatherer({ carrying: "", amount: 0, capacity: def.gatherCapacity }));
	}

	// Water
	if (def.canSwim) {
		traits.push(CanSwim);
	}

	// Stealth
	if (def.detectionRadius != null) {
		traits.push(DetectionRadius({ radius: def.detectionRadius }));
	}

	// Hero tag
	if ("portraitId" in def) {
		traits.push(IsHero);
	}

	if (scriptId) {
		traits.push(ScriptTag({ id: scriptId }));
	}

	// Dynamic trait composition — Koota's spawn() is variadic over ConfigurableTrait.
	const entity = world.spawn(...traits);
	const factionId = faction ?? def.faction;
	if (factionId !== "neutral") {
		entity.add(OwnedBy(ensureFactionOwner(world, factionId)));
	}

	const steering = createSteeringVehicle({
		maxSpeed: Math.max(1, def.speed),
		maxForce: Math.max(10, def.speed * 2),
	});
	steering.vehicle.position.set(x, 0, y);
	entity.set(SteeringAgent, steering);

	// Increment population counter for player units
	const fid = faction ?? def.faction;
	if (fid === "ura" && def.populationCost > 0) {
		const pop = world.get(PopulationState);
		if (pop) {
			world.set(PopulationState, { ...pop, current: pop.current + def.populationCost });
		}
	}

	return entity;
}

/**
 * Spawn a building from its definition into the ECS world.
 */
export function spawnBuilding(
	world: World,
	def: BuildingDef,
	x: number,
	y: number,
	faction?: string,
	scriptId?: string,
) {
	const traits: ConfigurableTrait[] = [
		Position({ x, y }),
		UnitType({ type: def.id }),
		Faction({ id: faction ?? def.faction }),
		Health({ current: def.hp, max: def.hp }),
		Armor({ value: def.armor }),
		IsBuilding,
	];

	if (def.trains?.length) {
		traits.push(ProductionQueue, RallyPoint({ x: x + 1, y }));
	}

	if (def.attackDamage != null) {
		traits.push(
			Attack({
				damage: def.attackDamage,
				range: def.attackRange ?? 0,
				cooldown: def.attackCooldown ?? 2,
				timer: 0,
			}),
		);
	}

	if (scriptId) {
		traits.push(ScriptTag({ id: scriptId }));
	}

	const entity = world.spawn(...traits);
	const factionId = faction ?? def.faction;
	if (factionId !== "neutral") {
		entity.add(OwnedBy(ensureFactionOwner(world, factionId)));
	}

	return entity;
}

/**
 * Spawn a resource node from its definition into the ECS world.
 */
export function spawnResource(world: World, def: ResourceDef, x: number, y: number, scriptId?: string) {
	const amount = def.yield.min + Math.floor(Math.random() * (def.yield.max - def.yield.min + 1));
	const traits: ConfigurableTrait[] = [
		Position({ x, y }),
		UnitType({ type: def.id }),
		Faction({ id: "neutral" }),
		ResourceNode({ type: def.resourceType, remaining: amount }),
		IsResource,
	];
	if (scriptId) {
		traits.push(ScriptTag({ id: scriptId }));
	}

	return world.spawn(...traits);
}

/**
 * Spawn a scripted convoy vehicle that follows a waypoint path.
 * Used by escort/convoy missions (1-2 trucks, 2-3 supply barges).
 */
export function spawnConvoyVehicle(
	world: World,
	waypoints: Array<{ x: number; y: number }>,
	vehicleType: "truck" | "barge" | "cart",
	x: number,
	y: number,
	options?: {
		faction?: string;
		cargoType?: string;
		hp?: number;
		armor?: number;
		speed?: number;
		detectionRadius?: number;
	},
) {
	const faction = options?.faction ?? "ura";
	const hp = options?.hp ?? 150;
	const armor = options?.armor ?? 2;
	const speed = options?.speed ?? 3;
	const detectionRadius = options?.detectionRadius ?? 5;

	const traits: ConfigurableTrait[] = [
		Position({ x, y }),
		UnitType({ type: `convoy_${vehicleType}` }),
		Faction({ id: faction }),
		Health({ current: hp, max: hp }),
		Armor({ value: armor }),
		ConvoyWaypoints({
			waypoints,
			currentWaypoint: 0,
			speed,
			stopped: false,
			detectionRadius,
		}),
		ConvoyVehicle({
			vehicleType,
			cargoType: options?.cargoType ?? "",
		}),
	];

	const entity = world.spawn(...traits);

	if (faction !== "neutral") {
		entity.add(OwnedBy(ensureFactionOwner(world, faction)));
	}

	return entity;
}

// ---------------------------------------------------------------------------
// Boss / Super-Unit Spawner
// ---------------------------------------------------------------------------

/**
 * Configuration for spawning a boss entity.
 * Used by scenario triggers for boss encounters (e.g., Mission 4-3).
 */
export interface BossUnitConfig {
	/** Display name shown on the boss health bar. */
	name: string;
	/** Unit type id (e.g., "serpent_king", "kommandant_ironjaw"). */
	unitType: string;
	/** Boss faction. Defaults to "scale_guard". */
	faction?: string;
	/** Total hit points. */
	hp: number;
	/** Armor value. */
	armor: number;
	/** Base attack damage. */
	damage: number;
	/** Attack range in tiles. */
	range: number;
	/** Attack cooldown in seconds. */
	attackCooldown: number;
	/** Movement speed. */
	speed: number;
	/** Vision radius in tiles. */
	visionRadius: number;
	/** Boss encounter phases. */
	phases: BossPhase[];
	/** AoE radius in tiles. */
	aoeRadius?: number;
	/** AoE damage per hit. */
	aoeDamage?: number;
	/** AoE cooldown in seconds. */
	aoeCooldown?: number;
	/** Summon cooldown in seconds. */
	summonCooldown?: number;
	/** Unit type to summon. */
	summonType?: string;
	/** Number of units per summon wave. */
	summonCount?: number;
}

/**
 * Spawn a boss / super-unit from a config into the ECS world.
 * Returns the Koota entity handle.
 */
export function spawnBossUnit(world: World, config: BossUnitConfig, x: number, y: number) {
	const faction = config.faction ?? "scale_guard";

	const traits: ConfigurableTrait[] = [
		Position({ x, y }),
		UnitType({ type: config.unitType }),
		Faction({ id: faction }),
		Health({ current: config.hp, max: config.hp }),
		Attack({
			damage: config.damage,
			range: config.range,
			cooldown: config.attackCooldown,
			timer: 0,
		}),
		Armor({ value: config.armor }),
		VisionRadius({ radius: config.visionRadius }),
		AIState({
			state: "idle",
			target: null,
			alertLevel: 0,
		}),
		OrderQueue,
		BossUnit({
			name: config.name,
			currentPhase: 0,
			phases: config.phases,
			enraged: false,
			aoeRadius: config.aoeRadius ?? 3,
			aoeDamage: config.aoeDamage ?? 20,
			aoeCooldown: config.aoeCooldown ?? 5,
			aoeTimer: 0,
			summonCooldown: config.summonCooldown ?? 30,
			summonTimer: 0,
			summonType: config.summonType ?? "",
			summonCount: config.summonCount ?? 2,
		}),
	];

	const entity = world.spawn(...traits);

	if (faction !== "neutral") {
		entity.add(OwnedBy(ensureFactionOwner(world, faction)));
	}

	// Create steering vehicle for boss movement
	const steering = createSteeringVehicle({
		maxSpeed: Math.max(1, config.speed),
		maxForce: Math.max(10, config.speed * 2),
	});
	steering.vehicle.position.set(x, 0, y);
	entity.set(SteeringAgent, steering);

	return entity;
}
