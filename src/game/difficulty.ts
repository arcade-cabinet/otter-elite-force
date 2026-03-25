/**
 * Difficulty mode definitions (US-051).
 *
 * Support:  0.75x enemy damage, 1.25x resources
 * Tactical: 1x/1x (the intended campaign difficulty)
 * Elite:    1.25x enemy damage, 0.75x resources
 *
 * Difficulty cannot be lowered mid-campaign (UI enforcement).
 */

export type DifficultyId = "support" | "tactical" | "elite";

export interface DifficultyDef {
	id: DifficultyId;
	label: string;
	note: string;
	enemyDamageMultiplier: number;
	resourceMultiplier: number;
}

export const DIFFICULTIES: DifficultyDef[] = [
	{
		id: "support",
		label: "Support",
		note: "0.75x enemy damage, 1.25x resources. Forgiving landing for first deployment.",
		enemyDamageMultiplier: 0.75,
		resourceMultiplier: 1.25,
	},
	{
		id: "tactical",
		label: "Tactical",
		note: "1x damage, 1x resources. The intended campaign difficulty.",
		enemyDamageMultiplier: 1.0,
		resourceMultiplier: 1.0,
	},
	{
		id: "elite",
		label: "Elite",
		note: "1.25x enemy damage, 0.75x resources. Hard campaign pressure from mission one.",
		enemyDamageMultiplier: 1.25,
		resourceMultiplier: 0.75,
	},
];

/** Difficulty rank for enforcing escalation-only changes. */
const DIFFICULTY_RANK: Record<DifficultyId, number> = {
	support: 0,
	tactical: 1,
	elite: 2,
};

/** Returns true if `next` is equal to or harder than `current`. */
export function canChangeDifficulty(current: DifficultyId, next: DifficultyId): boolean {
	return DIFFICULTY_RANK[next] >= DIFFICULTY_RANK[current];
}

export function getDifficultyDef(id: DifficultyId): DifficultyDef {
	return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}
