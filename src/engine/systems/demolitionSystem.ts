/**
 * Demolition System for Otter: Elite Force RTS.
 *
 * Handles Pvt. Muskrat's timed charges, explosions, chain reactions, and
 * the escape mechanic (Muskrat caught in blast = danger warning).
 *
 * Flow:
 *   1. placeCharge() -- spawns a charge entry in activeEffects with countdown
 *   2. runChargeTickSystem() -- decrements timers each tick, triggers explosion at 0
 *   3. applyExplosion() -- radius damage, buildings instant-destroy, chain explosions
 *   4. Escape check -- emits warning if Pvt. Muskrat is within blast radius
 *
 * Explosions damage EVERYTHING in radius (friend and foe).
 * Buildings within blast radius are instantly destroyed (HP set to 0).
 * IsExplosive buildings (e.g., fuel tanks) trigger chain explosions.
 *
 * Pure function on GameWorld.
 */

import { Armor, Flags, Health, Position } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval, spawnFloatingText } from "@/engine/world/gameWorld";
import { calculateDamage, distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Charge countdown duration in seconds. */
export const CHARGE_COUNTDOWN = 10;

/** Primary explosion damage dealt to all entities in blast radius. */
export const CHARGE_DAMAGE = 100;

/** Primary charge blast radius in pixels. */
export const CHARGE_RADIUS = 96;

/** Default chain explosion radius for explosive buildings in pixels. */
export const CHAIN_EXPLOSION_RADIUS = 64;

// ---------------------------------------------------------------------------
// Explosion result types
// ---------------------------------------------------------------------------

export interface ExplosionEvent {
	x: number;
	y: number;
	radius: number;
	damage: number;
	hitCount: number;
	chainCount: number;
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
 * Create a demolition charge at the specified pixel position.
 * The charge is stored as an activeEffect with a countdown timer.
 * When the timer reaches 0, it detonates via runChargeTickSystem.
 */
export function placeCharge(
	world: GameWorld,
	casterEid: number,
	x: number,
	y: number,
	countdown: number = CHARGE_COUNTDOWN,
): void {
	world.runtime.activeEffects.push({
		type: "demolition_charge",
		casterEid,
		x,
		y,
		remainingMs: countdown * 1000,
		payload: {
			damage: CHARGE_DAMAGE,
			radius: CHARGE_RADIUS,
		},
	});

	world.events.push({
		type: "charge-placed",
		payload: { casterEid, x, y, countdown },
	});
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
 * Returns hit count and list of explosive building eids for chain processing.
 */
export function applyExplosion(
	world: GameWorld,
	cx: number,
	cy: number,
	radius: number,
	damage: number,
): { hitCount: number; chainTargets: number[] } {
	let hitCount = 0;
	const chainTargets: number[] = [];
	const radiusSq = radius * radius;

	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) continue;
		if (Health.max[eid] <= 0) continue;

		const dx = Position.x[eid] - cx;
		const dy = Position.y[eid] - cy;
		const dSq = dx * dx + dy * dy;
		if (dSq > radiusSq) continue;

		hitCount++;

		if (Flags.isBuilding[eid] === 1) {
			// Buildings are instantly destroyed by explosions
			Health.current[eid] = 0;
			markForRemoval(world, eid);

			// Check if this is an explosive building for chain reactions
			const buildingType = world.runtime.entityTypeIndex.get(eid) ?? "";
			if (
				buildingType.includes("fuel") ||
				buildingType.includes("gas") ||
				buildingType.includes("explosive") ||
				buildingType.includes("ammo")
			) {
				chainTargets.push(eid);
			}
		} else {
			// Non-building entities take damage reduced by armor
			const armorVal = Armor.value[eid];
			const dmg = calculateDamage(damage, armorVal);
			Health.current[eid] -= dmg;
			spawnFloatingText(world, Position.x[eid], Position.y[eid], `-${dmg}`, "red");

			if (Health.current[eid] <= 0) {
				markForRemoval(world, eid);
			}
		}
	}

	return { hitCount, chainTargets };
}

// ---------------------------------------------------------------------------
// runChargeTickSystem
// ---------------------------------------------------------------------------

/**
 * Decrement demolition charge timers. When a timer reaches 0:
 *   1. Apply primary explosion (CHARGE_RADIUS, CHARGE_DAMAGE, buildings instant kill)
 *   2. Process chain explosions from explosive buildings
 *   3. Check if Pvt. Muskrat is within any blast radius
 *   4. Remove the charge effect
 *
 * Also processes "detonate" events from the old event-driven path for
 * backward compatibility with mission scripts.
 */
export function runChargeTickSystem(world: GameWorld): ChargeTickResult {
	const explosions: ExplosionEvent[] = [];
	let muskratInBlast = false;

	// --- Process timed charges from activeEffects ---
	const detonating: Array<{ x: number; y: number; damage: number; radius: number }> = [];
	const effectsToRemove: number[] = [];

	for (let i = 0; i < world.runtime.activeEffects.length; i++) {
		const effect = world.runtime.activeEffects[i];
		if (effect.type !== "demolition_charge") continue;

		effect.remainingMs -= world.time.deltaMs;

		if (effect.remainingMs <= 0) {
			const damage = (effect.payload?.damage as number) ?? CHARGE_DAMAGE;
			const radius = (effect.payload?.radius as number) ?? CHARGE_RADIUS;
			detonating.push({
				x: effect.x ?? 0,
				y: effect.y ?? 0,
				damage,
				radius,
			});
			effectsToRemove.push(i);
		}
	}

	// Remove expired charge effects (reverse order to preserve indices)
	for (let i = effectsToRemove.length - 1; i >= 0; i--) {
		world.runtime.activeEffects.splice(effectsToRemove[i], 1);
	}

	// --- Also process legacy "detonate" events ---
	const detonateEvents = world.events.filter((e) => e.type === "detonate");
	for (const event of detonateEvents) {
		detonating.push({
			x: Number(event.payload?.x ?? 0),
			y: Number(event.payload?.y ?? 0),
			damage: Number(event.payload?.damage ?? CHARGE_DAMAGE),
			radius: Number(event.payload?.radius ?? CHARGE_RADIUS),
		});
	}

	// --- Process all detonations ---
	for (const det of detonating) {
		// Primary explosion
		const primary = applyExplosion(world, det.x, det.y, det.radius, det.damage);

		const primaryEvent: ExplosionEvent = {
			x: det.x,
			y: det.y,
			radius: det.radius,
			damage: det.damage,
			hitCount: primary.hitCount,
			chainCount: 0,
		};

		// Chain explosions from destroyed explosive buildings (depth 1 only)
		for (const chainEid of primary.chainTargets) {
			// Building was just marked for removal but position data is still valid
			const buildingX = Position.x[chainEid];
			const buildingY = Position.y[chainEid];

			const chain = applyExplosion(
				world,
				buildingX,
				buildingY,
				CHAIN_EXPLOSION_RADIUS,
				det.damage,
			);

			primaryEvent.chainCount += chain.hitCount;

			explosions.push({
				x: buildingX,
				y: buildingY,
				radius: CHAIN_EXPLOSION_RADIUS,
				damage: det.damage,
				hitCount: chain.hitCount,
				chainCount: 0,
			});
		}

		explosions.push(primaryEvent);

		world.events.push({
			type: "explosion",
			payload: {
				x: det.x,
				y: det.y,
				radius: det.radius,
				damage: det.damage,
				source: "demolition_charge",
			},
		});
	}

	// --- Check escape mechanic: is Pvt. Muskrat in any blast radius? ---
	if (explosions.length > 0) {
		for (const eid of world.runtime.alive) {
			const unitType = world.runtime.entityTypeIndex.get(eid);
			if (unitType !== "pvt_muskrat") continue;

			const unitX = Position.x[eid];
			const unitY = Position.y[eid];

			for (const explosion of explosions) {
				const dist = distanceBetween(unitX, unitY, explosion.x, explosion.y);
				if (dist <= explosion.radius) {
					muskratInBlast = true;

					world.events.push({
						type: "muskrat-in-blast",
						payload: {
							eid,
							explosionX: explosion.x,
							explosionY: explosion.y,
						},
					});
					break;
				}
			}
			if (muskratInBlast) break;
		}
	}

	return { explosions, muskratInBlast };
}

// ---------------------------------------------------------------------------
// Unified demolition system tick (backward-compatible entry point)
// ---------------------------------------------------------------------------

/**
 * Run one tick of the demolition system.
 * Processes charges, detonation events, and applies area damage.
 */
export function runDemolitionSystem(world: GameWorld): ChargeTickResult {
	return runChargeTickSystem(world);
}
