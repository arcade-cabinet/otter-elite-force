/**
 * AI Difficulty Scaling System (US-069)
 *
 * Provides difficulty modifiers that affect combat damage and economy income
 * based on the CampaignProgress difficulty setting.
 *
 * | Mode      | Enemy Damage | Player Income |
 * |-----------|-------------|---------------|
 * | Support   | x0.75       | x1.25         |
 * | Tactical  | x1.0        | x1.0          |
 * | Elite     | x1.25       | x0.75         |
 *
 * Systems read these modifiers via getDifficultyModifiers(world) and
 * apply them to their calculations.
 */

import type { World } from "koota";
import { CampaignProgress } from "@/ecs/traits/state";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DifficultyModifiers {
	/** Multiplier for enemy damage dealt to player units */
	enemyDamageMultiplier: number;
	/** Multiplier for player resource income */
	playerIncomeMultiplier: number;
	/** The difficulty level name */
	level: string;
}

// ---------------------------------------------------------------------------
// Modifier Tables
// ---------------------------------------------------------------------------

const DIFFICULTY_TABLE: Record<string, DifficultyModifiers> = {
	support: {
		enemyDamageMultiplier: 0.75,
		playerIncomeMultiplier: 1.25,
		level: "support",
	},
	tactical: {
		enemyDamageMultiplier: 1.0,
		playerIncomeMultiplier: 1.0,
		level: "tactical",
	},
	elite: {
		enemyDamageMultiplier: 1.25,
		playerIncomeMultiplier: 0.75,
		level: "elite",
	},
};

/** Default modifiers (tactical baseline) */
const DEFAULT_MODIFIERS: DifficultyModifiers = DIFFICULTY_TABLE.tactical;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the current difficulty modifiers from the CampaignProgress singleton.
 *
 * @param world - The Koota ECS world (must have CampaignProgress added)
 * @returns DifficultyModifiers for the current difficulty setting
 */
export function getDifficultyModifiers(world: World): DifficultyModifiers {
	const campaign = world.get(CampaignProgress);
	if (!campaign) return DEFAULT_MODIFIERS;
	return getModifiersForDifficulty(campaign.difficulty);
}

/**
 * Get modifiers for a specific difficulty level.
 * Useful for testing or preview without a world.
 */
export function getModifiersForDifficulty(difficulty: string): DifficultyModifiers {
	return DIFFICULTY_TABLE[difficulty] ?? DEFAULT_MODIFIERS;
}

/**
 * Apply enemy damage modifier to a base damage value.
 * Use in combatSystem when an enemy (scale_guard) attacks a player (ura) unit.
 */
export function applyEnemyDamageModifier(baseDamage: number, modifiers: DifficultyModifiers): number {
	return Math.max(1, Math.round(baseDamage * modifiers.enemyDamageMultiplier));
}

/**
 * Apply player income modifier to a base income value.
 * Use in economySystem when player receives resources.
 */
export function applyPlayerIncomeModifier(baseIncome: number, modifiers: DifficultyModifiers): number {
	return Math.max(0, Math.round(baseIncome * modifiers.playerIncomeMultiplier));
}
