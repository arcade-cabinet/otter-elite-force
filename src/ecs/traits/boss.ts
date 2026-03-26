import { trait } from "koota";

/**
 * Phase definition for a boss encounter.
 * Phases activate in order as the boss's HP drops below each threshold.
 */
export interface BossPhase {
	name: string;
	/** HP percentage threshold — phase activates when HP drops below this value. */
	hpThreshold: number;
	/** Ability IDs active during this phase. */
	abilities: string[];
	/** Optional one-liner dialogue emitted on phase entry. */
	dialogue?: { speaker: string; text: string };
}

/**
 * BossUnit trait — marks an entity as a boss / super-unit.
 *
 * Boss entities have phased encounters, AoE attacks, and periodic summons.
 * Used for Mission 4-3 (Serpent King / Kommandant Ironjaw) and future bosses.
 */
export const BossUnit = trait(() => ({
	name: "" as string,
	currentPhase: 0,
	phases: [] as BossPhase[],
	enraged: false,
	aoeRadius: 3,
	aoeDamage: 20,
	aoeCooldown: 5,
	aoeTimer: 0,
	summonCooldown: 30,
	summonTimer: 0,
	summonType: "" as string,
	summonCount: 2,
}));
