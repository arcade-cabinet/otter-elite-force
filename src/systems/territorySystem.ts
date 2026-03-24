/**
 * Territory / Village Liberation System
 *
 * Handles the village lifecycle:
 * 1. Occupied villages have Faction('scale_guard') + a garrison of enemy units
 * 2. When all garrison units are killed → village flips to 'ura'
 * 3. Liberated villages provide:
 *    - Trickle fish income: +1 fish per 10s
 *    - Fog reveal: 5-tile radius marked as explored
 *    - Healing zone: +1 HP/s to friendly units within 3 tiles
 * 4. Enemy recapture: if enemy unit reaches liberated village
 *    with no friendly units within 5 tiles → flips back to 'scale_guard'
 *
 * Spec reference: §4 Neutral — Native Villagers
 */

import type { Entity, World } from "koota";
import { Faction, IsBuilding, IsVillage, UnitType } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { Health } from "../ecs/traits/combat";
import { GarrisonedIn } from "../ecs/relations";
import { resourceStore } from "../stores/resourceStore";
import { territoryStore } from "../stores/territoryStore";

/** Fish income per liberated village per tick interval. */
const VILLAGE_FISH_INCOME = 1;
/** Passive income interval in seconds. */
const VILLAGE_INCOME_INTERVAL = 10;
/** Healing per second for friendly units in healing zone. */
const VILLAGE_HEAL_RATE = 1;
/** Radius (tiles) within which friendly units are healed. */
const HEALING_RADIUS = 3;
/** Radius (tiles) for fog reveal around liberated village. */
export const FOG_REVEAL_RADIUS = 5;
/** Radius (tiles) for recapture defense check. */
const DEFENSE_RADIUS = 5;

let villageIncomeTimer = 0;

/** Reset village income timer (for tests / new games). */
export function resetVillageIncomeTimer(): void {
	villageIncomeTimer = 0;
}

/**
 * Calculate tile distance between two positions.
 */
function tileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a village's garrison has been fully eliminated.
 * A village is considered garrisoned if any entity has GarrisonedIn(village).
 */
export function isGarrisonCleared(world: World, village: Entity): boolean {
	const garrison = world.query(GarrisonedIn(village));
	return garrison.length === 0;
}

/**
 * Liberate a village: flip faction to 'ura'.
 * Returns true if the village was actually liberated (was not already 'ura').
 */
export function liberateVillage(village: Entity): boolean {
	const faction = village.get(Faction);
	if (faction.id === "ura") return false;

	village.set(Faction, { id: "ura" });
	territoryStore.getState().liberateVillage();
	return true;
}

/**
 * Recapture a village: flip faction back to 'scale_guard'.
 * Returns true if the village was actually recaptured.
 */
export function recaptureVillage(village: Entity): boolean {
	const faction = village.get(Faction);
	if (faction.id !== "ura") return false;

	village.set(Faction, { id: "scale_guard" });
	territoryStore.getState().recaptureVillage();
	return true;
}

/**
 * Check if a liberated village is undefended and an enemy is nearby.
 * Returns true if the village should be recaptured.
 */
export function isVillageUndefended(world: World, village: Entity, allUnits: Entity[]): boolean {
	const villageFaction = village.get(Faction);
	if (villageFaction.id !== "ura") return false;

	const villagePos = village.get(Position);
	let hasFriendlyNearby = false;
	let hasEnemyNearby = false;

	for (const unit of allUnits) {
		if (!unit.has(Position) || !unit.has(Faction)) continue;
		const unitPos = unit.get(Position);
		const unitFaction = unit.get(Faction);
		const dist = tileDistance(villagePos.x, villagePos.y, unitPos.x, unitPos.y);

		if (unitFaction.id === "ura" && dist <= DEFENSE_RADIUS) {
			hasFriendlyNearby = true;
		}
		if (unitFaction.id === "scale_guard" && dist <= DEFENSE_RADIUS) {
			hasEnemyNearby = true;
		}
	}

	return hasEnemyNearby && !hasFriendlyNearby;
}

/**
 * Apply healing zone: heal friendly units within 3 tiles of liberated villages.
 */
export function applyVillageHealing(
	world: World,
	villages: Entity[],
	friendlyUnits: Entity[],
	delta: number,
): void {
	const healAmount = VILLAGE_HEAL_RATE * delta;

	for (const village of villages) {
		const faction = village.get(Faction);
		if (faction.id !== "ura") continue;

		const villagePos = village.get(Position);

		for (const unit of friendlyUnits) {
			if (!unit.has(Position) || !unit.has(Health)) continue;
			const unitPos = unit.get(Position);
			const dist = tileDistance(villagePos.x, villagePos.y, unitPos.x, unitPos.y);

			if (dist <= HEALING_RADIUS) {
				const health = unit.get(Health);
				if (health.current < health.max) {
					const healed = Math.min(health.current + healAmount, health.max);
					unit.set(Health, { current: healed });
				}
			}
		}
	}
}

/**
 * Apply passive fish income from liberated villages.
 */
export function applyVillageIncome(delta: number): void {
	villageIncomeTimer += delta;

	if (villageIncomeTimer >= VILLAGE_INCOME_INTERVAL) {
		villageIncomeTimer -= VILLAGE_INCOME_INTERVAL;
		const { liberatedCount } = territoryStore.getState();
		if (liberatedCount > 0) {
			resourceStore.getState().addResources({
				fish: VILLAGE_FISH_INCOME * liberatedCount,
			});
		}
	}
}

/**
 * Get all village entities from the world.
 */
export function getVillages(world: World): Entity[] {
	return world.query(IsVillage, IsBuilding, Faction, Position);
}

/**
 * Get all combat units (entities with Faction + Position + Health, excluding buildings/villages).
 */
function getCombatUnits(world: World): Entity[] {
	return world.query(UnitType, Faction, Position, Health);
}

/**
 * Master territory system tick — call each frame from GameScene.update().
 *
 * @param world Koota world
 * @param delta Time since last frame in seconds
 */
export function territorySystem(world: World, delta: number): void {
	const villages = getVillages(world);
	const allUnits = getCombatUnits(world);
	const friendlyUnits = allUnits.filter((u) => u.get(Faction).id === "ura");

	for (const village of villages) {
		const faction = village.get(Faction);

		if (faction.id === "scale_guard") {
			// Check if garrison is cleared → liberate
			if (isGarrisonCleared(world, village)) {
				liberateVillage(village);
			}
		} else if (faction.id === "ura") {
			// Check if village should be recaptured
			if (isVillageUndefended(world, village, allUnits)) {
				recaptureVillage(village);
			}
		}
	}

	// Liberated village benefits
	applyVillageHealing(world, villages, friendlyUnits, delta);
	applyVillageIncome(delta);
}
