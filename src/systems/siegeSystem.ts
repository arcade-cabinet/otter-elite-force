/**
 * Siege & AoE System for Otter: Elite Force RTS.
 *
 * Handles bonus damage vs buildings, wall breaching, and area-of-effect splash.
 * Spec reference: §4 (Sapper 30 base vs buildings), §8.4 (siege), §12 (Demolition Training).
 *
 * Subsystems:
 *   1. calculateSiegeDamage — compute damage for attackers vs buildings with siege bonuses
 *   2. siegeCombatSystem — process melee/ranged attacks on building targets with siege modifiers
 *   3. aoeSplashSystem — AoE damage when projectiles with SplashRadius land
 *   4. wallBreachSystem — mark tiles passable when wall buildings reach 0 HP
 *
 * IMPORTANT: All SoA trait mutations use .set(). IsBuilding and IsHero are tag traits.
 */

import type { Entity, World } from "koota";
import { trait } from "koota";
import { Targeting } from "../ecs/relations";
import { Armor, Attack, Health } from "../ecs/traits/combat";
import { Faction, IsBuilding, IsHero, IsProjectile, UnitType } from "../ecs/traits/identity";
import { Position } from "../ecs/traits/spatial";
import { calculateDamage, distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// New Trait: SplashRadius
// ---------------------------------------------------------------------------

/** Splash radius for AoE projectiles (e.g., Mortar Otter). */
export const SplashRadius = trait({ radius: 0 });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sapper's base damage vs buildings (replaces normal 8 damage). */
export const SAPPER_BUILDING_DAMAGE = 30;

/** Demolition Training research multiplier for Sapper vs buildings. */
export const DEMOLITION_TRAINING_MULTIPLIER = 1.5;

/** Sgt. Fang's damage multiplier vs buildings (hero ability). */
export const SGT_FANG_BUILDING_MULTIPLIER = 2;

/** Mortar Otter's splash radius in tiles. */
export const MORTAR_SPLASH_RADIUS = 2;

// ---------------------------------------------------------------------------
// calculateSiegeDamage
// ---------------------------------------------------------------------------

export interface SiegeDamageInput {
	/** Attacker's base attack damage. */
	baseDamage: number;
	/** Target building's armor value. */
	targetArmor: number;
	/** Attacker's unit type id. */
	unitType: string;
	/** Whether the attacker is a hero. */
	isHero: boolean;
	/** Set of completed research IDs for the attacker's faction. */
	completedResearch: Set<string>;
}

/**
 * Calculate damage dealt to a building, applying siege bonuses.
 *
 * - Sapper: uses SAPPER_BUILDING_DAMAGE (30) instead of base damage.
 *   With Demolition Training research: 30 * 1.5 = 45.
 * - Sgt. Fang (hero): base damage * 2.
 * - All others: normal damage = attack - armor (min 1).
 */
export function calculateSiegeDamage(input: SiegeDamageInput): number {
	const { baseDamage, targetArmor, unitType, isHero, completedResearch } = input;

	let effectiveDamage: number;

	if (unitType === "sapper") {
		effectiveDamage = SAPPER_BUILDING_DAMAGE;
		if (completedResearch.has("demolition_training")) {
			effectiveDamage *= DEMOLITION_TRAINING_MULTIPLIER;
		}
	} else if (unitType === "sgt_fang" && isHero) {
		effectiveDamage = baseDamage * SGT_FANG_BUILDING_MULTIPLIER;
	} else {
		effectiveDamage = baseDamage;
	}

	return Math.max(1, effectiveDamage - targetArmor);
}

// ---------------------------------------------------------------------------
// siegeCombatSystem — melee/ranged attacks on buildings with siege bonuses
// ---------------------------------------------------------------------------

/**
 * Process attacks where the target is a building. Applies siege damage bonuses
 * for Sappers and Sgt. Fang. Respects cooldown and range.
 *
 * This system only handles attacks against IsBuilding targets. Non-building
 * targets are left for the regular combatSystem.
 */
export function siegeCombatSystem(
	world: World,
	delta: number,
	completedResearch: Set<string>,
): void {
	const attackers = world.query(Attack, Position, Faction, UnitType, Targeting("*"));

	for (const entity of attackers) {
		// Skip projectiles
		if (entity.has(IsProjectile)) continue;

		const targets = entity.targetsFor(Targeting);
		if (targets.length === 0) continue;

		const target = targets[0];

		// Only process building targets
		if (!target.has(IsBuilding)) continue;
		if (!target.isAlive() || !target.has(Health)) continue;

		const attack = entity.get(Attack)!;

		// Accumulate cooldown timer
		const newTimer = attack.timer + delta;
		if (newTimer < attack.cooldown) {
			entity.set(Attack, { timer: newTimer });
			continue;
		}

		// Range check
		const attackerPos = entity.get(Position)!;
		const targetPos = target.get(Position)!;
		const dist = distanceBetween(attackerPos.x, attackerPos.y, targetPos.x, targetPos.y);

		if (dist > attack.range) {
			entity.set(Attack, { timer: newTimer });
			continue;
		}

		// Reset cooldown (attack fires)
		entity.set(Attack, { timer: 0 });

		// Calculate siege damage
		const unitType = entity.get(UnitType)!;
		const isHero = entity.has(IsHero);
		const targetArmor = target.has(Armor) ? (target.get(Armor)?.value ?? 0) : 0;

		const dmg = calculateSiegeDamage({
			baseDamage: attack.damage,
			targetArmor,
			unitType: unitType.type,
			isHero,
			completedResearch,
		});

		target.set(Health, (prev) => ({ current: prev.current - dmg }));
	}
}

// ---------------------------------------------------------------------------
// aoeSplashSystem — AoE damage for projectiles with SplashRadius
// ---------------------------------------------------------------------------

/**
 * Find all projectiles with SplashRadius. For each, damage all enemy entities
 * within the splash radius. Then destroy the projectile.
 *
 * This system is meant to run AFTER the projectileSystem detects a hit
 * (or when the mortar projectile reaches its destination). In practice,
 * mortar projectiles should be given a SplashRadius trait and this system
 * processes them when they exist at their impact position.
 *
 * Returns array of destroyed projectile entities.
 */
export function aoeSplashSystem(world: World): Entity[] {
	const splashProjectiles = world.query(IsProjectile, SplashRadius, Position, Attack, Faction);
	const potentialTargets = world.query(Position, Health, Faction);
	const destroyed: Entity[] = [];

	for (const proj of splashProjectiles) {
		const projPos = proj.get(Position)!;
		const projFaction = proj.get(Faction)!;
		const splash = proj.get(SplashRadius)!;
		const attack = proj.get(Attack)!;

		for (const candidate of potentialTargets) {
			// Don't damage allies
			const candidateFaction = candidate.get(Faction)!;
			if (candidateFaction.id === projFaction.id) continue;

			const candidatePos = candidate.get(Position)!;
			const dist = distanceBetween(projPos.x, projPos.y, candidatePos.x, candidatePos.y);

			if (dist <= splash.radius) {
				const armorValue = candidate.has(Armor) ? (candidate.get(Armor)?.value ?? 0) : 0;
				const dmg = calculateDamage(attack.damage, armorValue);
				candidate.set(Health, (prev) => ({ current: prev.current - dmg }));
			}
		}

		destroyed.push(proj);
		proj.destroy();
	}

	return destroyed;
}

// ---------------------------------------------------------------------------
// wallBreachSystem — destroyed walls → update terrain to passable
// ---------------------------------------------------------------------------

/**
 * Check all building entities with HP <= 0. For wall buildings, update the
 * tile grid to "grass" (passable) at the wall's position.
 *
 * The caller should then call rebuildTileEdges() from ai/graphBuilder.ts
 * to update the pathfinding graph for each breached tile.
 *
 * Accepts a mutable tile grid (tiles[y][x]) which it modifies in place.
 * Returns the array of breached wall entities.
 */
export function wallBreachSystem(world: World, tiles: string[][]): Entity[] {
	const buildings = world.query(IsBuilding, Health, Position);
	const breached: Entity[] = [];

	for (const entity of buildings) {
		const health = entity.get(Health)!;
		if (health.current > 0) continue;

		const pos = entity.get(Position)!;
		const tileX = Math.round(pos.x);
		const tileY = Math.round(pos.y);

		// Bounds check
		if (tileY < 0 || tileY >= tiles.length) continue;
		if (tileX < 0 || tileX >= tiles[tileY].length) continue;

		// Only update if the tile is currently a wall
		if (tiles[tileY][tileX] === "wall") {
			tiles[tileY][tileX] = "grass";
		}

		breached.push(entity);
	}

	return breached;
}
