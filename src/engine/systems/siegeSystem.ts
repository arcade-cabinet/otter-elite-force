/**
 * Siege & AoE System for Otter: Elite Force RTS.
 *
 * Handles bonus damage vs buildings, wall breaching, and area-of-effect splash.
 * Spec reference: S4 (Sapper 30 base vs buildings), S8.4 (siege), S12 (Demolition Training).
 *
 * Subsystems:
 *   1. calculateSiegeDamage -- compute damage for attackers vs buildings with siege bonuses
 *   2. runSiegeCombatSystem -- process attacks on building targets with siege modifiers
 *   3. runAoeSplashSystem -- AoE damage from projectiles with SplashRadius
 *   4. runWallBreachSystem -- mark tiles passable when wall buildings reach 0 HP
 *
 * Pure function on GameWorld.
 */

import {
	Armor,
	Attack,
	Faction,
	Flags,
	Health,
	Position,
	SplashRadius,
	TargetRef,
} from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import { markForRemoval, spawnFloatingText } from "@/engine/world/gameWorld";
import { calculateDamage, distanceBetween } from "./combatSystem";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sapper's base damage vs buildings (replaces normal attack damage). */
export const SAPPER_BUILDING_DAMAGE = 30;

/** Demolition Training research multiplier for Sapper vs buildings. */
export const DEMOLITION_TRAINING_MULTIPLIER = 1.5;

/** Sgt. Fang's damage multiplier vs buildings (hero ability). */
export const SGT_FANG_BUILDING_MULTIPLIER = 2;

/** Siege damage multiplier for generic siege-tagged entities. */
export const SIEGE_MULTIPLIER = 2.0;

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
	/** Whether the attacker is a hero (sgt_fang). */
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
// runSiegeCombatSystem
// ---------------------------------------------------------------------------

/**
 * Process attacks where the target is a building. Applies siege damage bonuses
 * for Sappers, Sgt. Fang, and generic siege-tagged units. Respects cooldown
 * and range.
 *
 * This system only handles attacks against building targets. Non-building
 * targets are left for the regular combatSystem.
 */
export function runSiegeCombatSystem(world: GameWorld): void {
	const deltaSec = world.time.deltaMs / 1000;
	if (deltaSec <= 0) return;

	const completedResearch = world.runtime.completedResearch;

	for (const eid of world.runtime.alive) {
		if (Flags.isResource[eid] === 1 || Flags.isProjectile[eid] === 1) continue;
		if (Attack.damage[eid] <= 0) continue;

		// Must have a target
		const targetEid = TargetRef.eid[eid];
		if (targetEid <= 0) continue;
		if (!world.runtime.alive.has(targetEid)) continue;

		// Only process building targets
		if (Flags.isBuilding[targetEid] !== 1) continue;
		if (Health.max[targetEid] <= 0 || Health.current[targetEid] <= 0) continue;

		// Advance cooldown timer
		Attack.timer[eid] += deltaSec;
		if (Attack.timer[eid] < Attack.cooldown[eid]) continue;

		// Range check
		const dist = distanceBetween(
			Position.x[eid],
			Position.y[eid],
			Position.x[targetEid],
			Position.y[targetEid],
		);
		if (dist > Attack.range[eid]) continue;

		// Fire!
		Attack.timer[eid] = 0;

		const unitType = world.runtime.entityTypeIndex.get(eid) ?? "";
		const isHero = unitType === "sgt_fang";

		const dmg = calculateSiegeDamage({
			baseDamage: Attack.damage[eid],
			targetArmor: Armor.value[targetEid],
			unitType,
			isHero,
			completedResearch,
		});

		Health.current[targetEid] -= dmg;
		spawnFloatingText(world, Position.x[targetEid], Position.y[targetEid], `-${dmg}`, "red");

		world.events.push({
			type: "siege-hit",
			payload: { attacker: eid, target: targetEid, damage: dmg },
		});

		if (Health.current[targetEid] <= 0) {
			markForRemoval(world, targetEid);
		}
	}
}

// ---------------------------------------------------------------------------
// runAoeSplashSystem
// ---------------------------------------------------------------------------

/**
 * Process projectiles with SplashRadius. For each, damage all enemy entities
 * within the splash radius at their impact position.
 *
 * This is called by the combat system after projectile arrival detection.
 * Returns the number of destroyed splash projectiles.
 */
export function runAoeSplashSystem(world: GameWorld): number {
	let destroyedCount = 0;

	for (const eid of world.runtime.alive) {
		if (Flags.isProjectile[eid] !== 1) continue;
		if (SplashRadius.radius[eid] <= 0) continue;

		const projX = Position.x[eid];
		const projY = Position.y[eid];
		const projFaction = Faction.id[eid];
		const splashR = SplashRadius.radius[eid];
		const projDmg = Attack.damage[eid];

		for (const cid of world.runtime.alive) {
			if (cid === eid) continue;
			if (Flags.isProjectile[cid] === 1 || Flags.isResource[cid] === 1) continue;
			if (Faction.id[cid] === projFaction) continue;
			if (Health.max[cid] <= 0) continue;

			const dist = distanceBetween(projX, projY, Position.x[cid], Position.y[cid]);
			if (dist <= splashR) {
				const dmg = calculateDamage(projDmg, Armor.value[cid]);
				Health.current[cid] -= dmg;
			}
		}

		markForRemoval(world, eid);
		destroyedCount++;
	}

	return destroyedCount;
}

// ---------------------------------------------------------------------------
// runWallBreachSystem
// ---------------------------------------------------------------------------

/**
 * Check all building entities with HP <= 0. For wall buildings (category "wall"
 * in entityTypeIndex or tile type "wall" in terrainGrid), update the terrain
 * grid tile to passable.
 *
 * Returns the count of breached wall positions.
 */
export function runWallBreachSystem(world: GameWorld): number {
	const grid = world.runtime.terrainGrid;
	if (!grid) return 0;

	let breachedCount = 0;

	for (const eid of world.runtime.alive) {
		if (Flags.isBuilding[eid] !== 1) continue;
		if (Health.current[eid] > 0) continue;

		const unitType = world.runtime.entityTypeIndex.get(eid) ?? "";
		if (!unitType.includes("wall")) continue;

		// Convert pixel position to tile coordinates
		const tileX = Math.floor(Position.x[eid] / 32);
		const tileY = Math.floor(Position.y[eid] / 32);

		// Bounds check
		if (tileY < 0 || tileY >= grid.length) continue;
		if (tileX < 0 || tileX >= (grid[tileY]?.length ?? 0)) continue;

		// Mark terrain as passable (0 = passable grass)
		// The terrain grid uses numeric IDs; 0 is typically grass/passable
		grid[tileY][tileX] = 0;
		breachedCount++;

		world.events.push({
			type: "wall-breached",
			payload: { eid, tileX, tileY },
		});
	}

	return breachedCount;
}

// ---------------------------------------------------------------------------
// Unified siege system tick
// ---------------------------------------------------------------------------

/**
 * Run one tick of the full siege system.
 * Combines siege combat, AoE splash, and wall breach checks.
 */
export function runSiegeSystem(world: GameWorld): void {
	runSiegeCombatSystem(world);
	runWallBreachSystem(world);
}
