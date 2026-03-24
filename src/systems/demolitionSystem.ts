/**
 * Demolition System for Otter: Elite Force RTS.
 *
 * Handles Pvt. Muskrat's timed charges, explosions, chain reactions, and
 * the escape mechanic (Muskrat caught in blast = mission fail).
 *
 * Flow:
 *   1. placeCharge() — spawns an invisible charge entity with 10s countdown
 *   2. chargeTickSystem() — decrements timers, triggers explosion at 0
 *   3. applyExplosion() — 3-tile radius, 100 damage to all (friend+foe),
 *      buildings instantly destroyed, chain explosions from IsExplosive
 *   4. Escape check — flags if Pvt. Muskrat is within blast radius
 *
 * IMPORTANT: ChargeTimer is SoA — all mutations via .set().
 * Explosions damage EVERYTHING in radius (friend and foe).
 */

import { trait } from "koota";
import type { World, Entity } from "koota";
import { Health, Armor } from "../ecs/traits/combat";
import { Faction, UnitType, IsBuilding } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { distanceBetween, calculateDamage } from "./combatSystem";

// ---------------------------------------------------------------------------
// Traits
// ---------------------------------------------------------------------------

/** Tag: entity is a placed demolition charge. */
export const IsCharge = trait();

/** Countdown timer for demolition charges (SoA — use .set() to mutate). */
export const ChargeTimer = trait({ remaining: 10 });

/** Tag: building that explodes when destroyed (e.g., Gas Depot). */
export const IsExplosive = trait();

/** Secondary explosion radius for IsExplosive buildings. */
export const ChainExplosionRadius = trait({ radius: 2 });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Charge countdown duration in seconds. */
export const CHARGE_COUNTDOWN = 10;

/** Explosion damage dealt to all entities in blast radius. */
export const CHARGE_DAMAGE = 100;

/** Primary charge blast radius in tiles. */
export const CHARGE_RADIUS = 3;

/** Default chain explosion radius for IsExplosive buildings. */
export const CHAIN_EXPLOSION_RADIUS = 2;

// ---------------------------------------------------------------------------
// Explosion result types
// ---------------------------------------------------------------------------

export interface ExplosionEvent {
	x: number;
	y: number;
	radius: number;
	damage: number;
	hitEntities: Entity[];
	chainTargets: Entity[];
}

export interface ChargeTickResult {
	/** All explosions that occurred this tick (primary + chain). */
	explosions: ExplosionEvent[];
	/** True if Pvt. Muskrat was within any blast radius. */
	muskratInBlast: boolean;
}

// ---------------------------------------------------------------------------
// placeCharge
// ---------------------------------------------------------------------------

/**
 * Create an invisible charge entity at the specified tile position.
 * Inherits the placer's faction for identification.
 */
export function placeCharge(world: World, placer: Entity, tileX: number, tileY: number): Entity {
	const placerFaction = placer.get(Faction)!;

	return world.spawn(
		IsCharge(),
		ChargeTimer({ remaining: CHARGE_COUNTDOWN }),
		Position({ x: tileX, y: tileY }),
		Faction({ id: placerFaction.id }),
	);
}

// ---------------------------------------------------------------------------
// applyExplosion
// ---------------------------------------------------------------------------

/**
 * Apply explosion damage at a given position with given radius and damage.
 * Damages ALL entities with Health within radius (friend AND foe).
 * Buildings are instantly destroyed (HP set to 0).
 * Armor reduces damage for non-building entities (min 1).
 *
 * Returns hit entities and any IsExplosive buildings that were destroyed
 * (for chain explosion processing).
 */
export function applyExplosion(
	world: World,
	x: number,
	y: number,
	radius: number,
	damage: number,
): ExplosionEvent {
	const targets = world.query(Position, Health);
	const hitEntities: Entity[] = [];
	const chainTargets: Entity[] = [];

	for (const entity of targets) {
		// Don't damage other charges
		if (entity.has(IsCharge)) continue;

		const entityPos = entity.get(Position)!;
		const dist = distanceBetween(x, y, entityPos.x, entityPos.y);

		if (dist > radius) continue;

		hitEntities.push(entity);

		if (entity.has(IsBuilding)) {
			// Buildings are instantly destroyed
			entity.set(Health, { current: 0 });

			// Check if this is an explosive building for chain reactions
			if (entity.has(IsExplosive)) {
				chainTargets.push(entity);
			}
		} else {
			// Non-building entities take damage reduced by armor
			const armorValue = entity.has(Armor) ? entity.get(Armor)!.value : 0;
			const dmg = calculateDamage(damage, armorValue);
			entity.set(Health, (prev) => ({ current: prev.current - dmg }));
		}
	}

	return { x, y, radius, damage, hitEntities, chainTargets };
}

// ---------------------------------------------------------------------------
// chargeTickSystem
// ---------------------------------------------------------------------------

/**
 * Decrement charge timers. When a timer reaches 0:
 *   1. Apply primary explosion (3-tile radius, 100 damage, buildings instant kill)
 *   2. Process chain explosions from IsExplosive buildings
 *   3. Check if Pvt. Muskrat is within any blast radius
 *   4. Destroy the charge entity
 */
export function chargeTickSystem(world: World, delta: number): ChargeTickResult {
	const charges = world.query(IsCharge, ChargeTimer, Position);
	const explosions: ExplosionEvent[] = [];
	let muskratInBlast = false;

	// Collect charges that detonate this tick
	const detonating: Array<{ entity: Entity; x: number; y: number }> = [];

	for (const charge of charges) {
		const timer = charge.get(ChargeTimer)!;
		const newRemaining = timer.remaining - delta;

		if (newRemaining > 0) {
			charge.set(ChargeTimer, { remaining: newRemaining });
			continue;
		}

		const pos = charge.get(Position)!;
		detonating.push({ entity: charge, x: pos.x, y: pos.y });
	}

	// Process detonations
	for (const { entity: charge, x, y } of detonating) {
		// Primary explosion
		const primary = applyExplosion(world, x, y, CHARGE_RADIUS, CHARGE_DAMAGE);
		explosions.push(primary);

		// Chain explosions from destroyed IsExplosive buildings (depth 1 only)
		for (const explosiveBuilding of primary.chainTargets) {
			if (!explosiveBuilding.isAlive()) continue;

			const buildingPos = explosiveBuilding.get(Position)!;
			const chainRadius = explosiveBuilding.has(ChainExplosionRadius)
				? explosiveBuilding.get(ChainExplosionRadius)!.radius
				: CHAIN_EXPLOSION_RADIUS;

			const chain = applyExplosion(world, buildingPos.x, buildingPos.y, chainRadius, CHARGE_DAMAGE);
			explosions.push(chain);
		}

		// Destroy the charge entity
		charge.destroy();
	}

	// Check escape mechanic: is Pvt. Muskrat in any blast radius?
	if (explosions.length > 0) {
		const allUnits = world.query(UnitType, Position);
		for (const unit of allUnits) {
			const unitType = unit.get(UnitType)!;
			if (unitType.type !== "pvt_muskrat") continue;

			const unitPos = unit.get(Position)!;
			for (const explosion of explosions) {
				const dist = distanceBetween(unitPos.x, unitPos.y, explosion.x, explosion.y);
				if (dist <= explosion.radius) {
					muskratInBlast = true;
					break;
				}
			}
			if (muskratInBlast) break;
		}
	}

	return { explosions, muskratInBlast };
}
