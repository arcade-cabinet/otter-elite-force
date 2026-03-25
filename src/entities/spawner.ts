// src/entities/spawner.ts
// Converts entity definitions into Koota ECS entities with the correct traits.
// This is the bridge between the data-driven definitions and the runtime ECS.

import type { World } from "koota";
import type { UnitDef, HeroDef, BuildingDef, ResourceDef } from "./types";

import { createSteeringVehicle } from "@/ai/steeringFactory";
import { OwnedBy } from "@/ecs/relations";
import { AIState, SteeringAgent } from "@/ecs/traits/ai";
import { Gatherer, PopulationCost, ProductionQueue, ResourceNode } from "@/ecs/traits/economy";
import { Category, UnitType, Faction, IsHero, IsBuilding, IsResource } from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { Position } from "../ecs/traits/spatial";
import { Health, Attack, Armor, VisionRadius } from "../ecs/traits/combat";
import { CanSwim } from "../ecs/traits/water";
import { DetectionRadius } from "../ecs/traits/stealth";

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
) {
	const traits: any[] = [
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

	// Dynamic trait composition requires type assertion — Koota's spawn() expects
	// a fixed tuple but we build the trait list conditionally from definitions.
	const entity = world.spawn(...(traits as any[]));
	const factionId = faction ?? def.faction;
	if (factionId !== "neutral") {
		entity.add(OwnedBy(ensureFactionOwner(world, factionId)));
	}

	const steering = createSteeringVehicle({
		maxSpeed: Math.max(1, def.speed),
		maxForce: Math.max(10, def.speed * 2),
	});
	steering.vehicle.position.set(x, 0, y);
	entity.set(SteeringAgent, steering as never);

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
) {
	const traits: any[] = [
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
export function spawnResource(world: World, def: ResourceDef, x: number, y: number) {
	const amount = def.yield.min + Math.floor(Math.random() * (def.yield.max - def.yield.min + 1));

	return world.spawn(
		Position({ x, y }),
		UnitType({ type: def.id }),
		Faction({ id: "neutral" }),
		ResourceNode({ type: def.resourceType, remaining: amount }),
		IsResource,
	);
}
