// src/entities/spawner.ts
// Converts entity definitions into Koota ECS entities with the correct traits.
// This is the bridge between the data-driven definitions and the runtime ECS.

import type { World } from "koota";
import type { UnitDef, HeroDef, BuildingDef, ResourceDef } from "./types";

import { Position } from "../ecs/traits/spatial";
import { Health, Attack, Armor, VisionRadius } from "../ecs/traits/combat";
import { UnitType, Faction, IsHero, IsBuilding, IsResource } from "../ecs/traits/identity";
import { Gatherer, PopulationCost, ResourceNode } from "../ecs/traits/economy";
import { CanSwim } from "../ecs/traits/water";
import { DetectionRadius } from "../ecs/traits/stealth";
import { AIState, SteeringAgent } from "../ecs/traits/ai";

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

	// AI profile (enemy units)
	if (def.aiProfile) {
		traits.push(
			AIState({
				state: def.aiProfile.defaultState,
				target: null,
				alertLevel: 0,
			}),
		);
		traits.push(SteeringAgent);
	}

	// Hero tag
	if ("portraitId" in def) {
		traits.push(IsHero);
	}

	// Dynamic trait composition requires type assertion — Koota's spawn() expects
	// a fixed tuple but we build the trait list conditionally from definitions.
	return world.spawn(...(traits as any[]));
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

	return world.spawn(...traits);
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
