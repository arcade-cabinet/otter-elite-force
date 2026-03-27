/**
 * Difficulty Scaling System — Adjusts enemy stats based on campaign difficulty.
 * Pure function on GameWorld.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { Attack, Faction, Health, Speed } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";

/** Stat multipliers per difficulty tier. */
const DIFFICULTY_MULTIPLIERS: Record<string, { hp: number; damage: number; speed: number }> = {
	support: { hp: 0.75, damage: 0.75, speed: 0.9 },
	tactical: { hp: 1.0, damage: 1.0, speed: 1.0 },
	elite: { hp: 1.5, damage: 1.25, speed: 1.1 },
};

let lastDifficulty = "";

/**
 * Run one tick of the difficulty scaling system.
 * Applies difficulty multipliers to enemy entities on difficulty change.
 */
export function runDifficultyScalingSystem(world: GameWorld): void {
	const difficulty = world.campaign.difficulty;
	if (difficulty === lastDifficulty) return;
	lastDifficulty = difficulty;

	const mults = DIFFICULTY_MULTIPLIERS[difficulty] ?? DIFFICULTY_MULTIPLIERS.tactical;
	const enemyFaction = FACTION_IDS.scale_guard;

	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] !== enemyFaction) continue;

		Health.max[eid] = Math.round(Health.max[eid] * mults.hp);
		Health.current[eid] = Math.min(Health.current[eid], Health.max[eid]);
		Attack.damage[eid] = Attack.damage[eid] * mults.damage;
		Speed.value[eid] = Speed.value[eid] * mults.speed;
	}
}

/** Reset difficulty tracking (for new missions/tests). */
export function resetDifficultyScaling(): void {
	lastDifficulty = "";
}
