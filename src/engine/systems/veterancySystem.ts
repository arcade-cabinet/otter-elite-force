/**
 * Veterancy System -- XP tracking, promotion, and stat multipliers.
 *
 * Units that participate in combat gain experience. At threshold XP values
 * they promote through ranks: Recruit -> Veteran -> Elite -> Hero.
 * Each rank grants stat multipliers to HP, damage, and speed.
 *
 * XP Sources:
 *   - Kill enemy unit:     +10 XP
 *   - Kill enemy building: +25 XP
 *   - Assist a kill:       +5 XP  (damaged target within last 5s)
 *   - Complete gather trip: +1 XP
 *   - Survive a mission:   +15 XP (all surviving units)
 *
 * Pure function on GameWorld.
 */

import { Attack, Flags, Health, Speed, Veterancy } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

// ---------------------------------------------------------------------------
// Rank definitions
// ---------------------------------------------------------------------------

export const RANK_RECRUIT = 0;
export const RANK_VETERAN = 1;
export const RANK_ELITE = 2;
export const RANK_HERO = 3;

export const RANK_NAMES = ["Recruit", "Veteran", "Elite", "Hero"] as const;

/** Emblem identifiers for the renderer. */
export const RANK_EMBLEMS = ["none", "silver_chevron", "gold_chevron", "star"] as const;

// ---------------------------------------------------------------------------
// XP configuration
// ---------------------------------------------------------------------------

export const XP_CONFIG = {
	/** XP awarded for killing an enemy unit. */
	killUnit: 10,
	/** XP awarded for killing an enemy building. */
	killBuilding: 25,
	/** XP awarded for assisting a kill (damaged target within assist window). */
	assistKill: 5,
	/** XP awarded for completing a resource gathering trip. */
	gatherTrip: 1,
	/** XP awarded for surviving a mission (all surviving units). */
	surviveMission: 15,
	/** Time window (ms) for an assist to count. */
	assistWindowMs: 5000,
} as const;

// ---------------------------------------------------------------------------
// Promotion thresholds
// ---------------------------------------------------------------------------

export const PROMOTION_THRESHOLDS = [
	{ rank: RANK_RECRUIT, xp: 0 },
	{ rank: RANK_VETERAN, xp: 50 },
	{ rank: RANK_ELITE, xp: 150 },
	{ rank: RANK_HERO, xp: 400 },
] as const;

// ---------------------------------------------------------------------------
// Stat multipliers per rank
// ---------------------------------------------------------------------------

export const RANK_MULTIPLIERS = [
	{ hp: 1.0, damage: 1.0, speed: 1.0 }, // Recruit
	{ hp: 1.1, damage: 1.1, speed: 1.0 }, // Veteran: +10% HP, +10% damage
	{ hp: 1.2, damage: 1.2, speed: 1.05 }, // Elite: +20% HP, +20% damage, +5% speed
	{ hp: 1.3, damage: 1.3, speed: 1.3 }, // Hero: +30% all stats
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the correct rank for a given XP total.
 */
export function rankForXp(xp: number): number {
	let rank = RANK_RECRUIT;
	for (const threshold of PROMOTION_THRESHOLDS) {
		if (xp >= threshold.xp) {
			rank = threshold.rank;
		}
	}
	return rank;
}

/**
 * Get the stat multiplier for a given rank.
 */
export function veterancyMultiplier(rank: number): { hp: number; damage: number; speed: number } {
	return RANK_MULTIPLIERS[rank] ?? RANK_MULTIPLIERS[0];
}

/**
 * Award XP to an entity and check for promotion.
 * Emits a "promotion" event if rank changes.
 */
export function awardXp(world: GameWorld, eid: number, amount: number): void {
	if (amount <= 0) return;
	if (!world.runtime.alive.has(eid)) return;
	// Only units with health (not projectiles/resources) get XP
	if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) return;

	const oldXp = Veterancy.xp[eid];
	const newXp = oldXp + amount;
	Veterancy.xp[eid] = newXp;

	const oldRank = Veterancy.rank[eid];
	const newRank = rankForXp(newXp);

	if (newRank > oldRank) {
		Veterancy.rank[eid] = newRank;
		applyRankMultipliers(eid, oldRank, newRank);
		world.events.push({
			type: "promotion",
			payload: {
				eid,
				oldRank,
				newRank,
				rankName: RANK_NAMES[newRank],
				emblem: RANK_EMBLEMS[newRank],
			},
		});
	}
}

/**
 * Apply stat multipliers when an entity promotes.
 * Adjusts max HP, current HP (proportionally), damage, and speed.
 */
function applyRankMultipliers(eid: number, oldRank: number, newRank: number): void {
	const oldMult = RANK_MULTIPLIERS[oldRank] ?? RANK_MULTIPLIERS[0];
	const newMult = RANK_MULTIPLIERS[newRank] ?? RANK_MULTIPLIERS[0];

	// Scale max HP
	const baseMaxHp = Health.max[eid] / oldMult.hp;
	const newMaxHp = baseMaxHp * newMult.hp;
	const hpRatio = Health.max[eid] > 0 ? Health.current[eid] / Health.max[eid] : 1;
	Health.max[eid] = newMaxHp;
	Health.current[eid] = newMaxHp * hpRatio;

	// Scale damage
	if (Attack.damage[eid] > 0) {
		const baseDmg = Attack.damage[eid] / oldMult.damage;
		Attack.damage[eid] = baseDmg * newMult.damage;
	}

	// Scale speed
	if (Speed.value[eid] > 0) {
		const baseSpeed = Speed.value[eid] / oldMult.speed;
		Speed.value[eid] = baseSpeed * newMult.speed;
	}
}

/**
 * Record a damage event for assist tracking.
 * Called when an entity deals damage to a target.
 */
export function recordDamageAssist(world: GameWorld, attackerEid: number, targetEid: number): void {
	let assistMap = world.runtime.damageAssists.get(targetEid);
	if (!assistMap) {
		assistMap = new Map();
		world.runtime.damageAssists.set(targetEid, assistMap);
	}
	assistMap.set(attackerEid, world.time.elapsedMs);
}

// ---------------------------------------------------------------------------
// Main system
// ---------------------------------------------------------------------------

/**
 * Run one tick of the veterancy system.
 * Processes combat events from the world event log and awards XP.
 */
export function runVeterancySystem(world: GameWorld): void {
	for (const event of world.events) {
		switch (event.type) {
			case "unit-died": {
				const deadEid = event.payload?.eid as number | undefined;
				if (deadEid === undefined) break;

				const isBuilding = Flags.isBuilding[deadEid] === 1;
				const killXp = isBuilding ? XP_CONFIG.killBuilding : XP_CONFIG.killUnit;

				// Find the killer: the entity that was targeting this dead entity
				// We check all alive entities for who had this as their target
				for (const eid of world.runtime.alive) {
					if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) continue;

					// Check if this entity was actively targeting the dead entity
					// by looking at recent melee-hit or ranged-fire events
					// Instead, use kill tracking from damage assists
				}

				// Award XP to the killer via damageAssists
				const assistMap = world.runtime.damageAssists.get(deadEid);
				if (assistMap) {
					// Find the most recent damager as the killer
					let killerEid = -1;
					let latestTime = -1;
					for (const [attackerEid, time] of assistMap) {
						if (time > latestTime) {
							latestTime = time;
							killerEid = attackerEid;
						}
					}

					if (killerEid >= 0 && world.runtime.alive.has(killerEid)) {
						awardXp(world, killerEid, killXp);
						// Track kill count
						const prevKills = world.runtime.killCounts.get(killerEid) ?? 0;
						world.runtime.killCounts.set(killerEid, prevKills + 1);
					}

					// Award assist XP to others who damaged within the window
					const now = world.time.elapsedMs;
					for (const [attackerEid, time] of assistMap) {
						if (attackerEid === killerEid) continue;
						if (now - time <= XP_CONFIG.assistWindowMs && world.runtime.alive.has(attackerEid)) {
							awardXp(world, attackerEid, XP_CONFIG.assistKill);
						}
					}

					// Clean up
					world.runtime.damageAssists.delete(deadEid);
				}
				break;
			}

			case "resource-deposited": {
				// Award gather XP -- we don't have the worker eid in the event,
				// so this must be called directly from the economy system.
				// This case is a no-op; gatherTrip XP is awarded via awardXp() calls
				// injected at the deposit point.
				break;
			}

			case "mission-complete": {
				// Award survive XP to all surviving units
				for (const eid of world.runtime.alive) {
					if (Flags.isProjectile[eid] === 1 || Flags.isResource[eid] === 1) continue;
					if (Flags.isBuilding[eid] === 1) continue;
					awardXp(world, eid, XP_CONFIG.surviveMission);
				}
				break;
			}
		}
	}
}
