/**
 * Scoring System — Tracks mission performance for star ratings.
 *
 * Scoring factors:
 *   - Time: bonus for completing under time threshold
 *   - Casualties: bonus for low player unit losses
 *   - Objectives: bonus for completing bonus objectives
 *
 * Pure function on GameWorld.
 */

import { Faction, Flags } from "@/engine/world/components";
import { FACTION_IDS } from "@/engine/content/ids";
import type { GameWorld } from "@/engine/world/gameWorld";

export interface MissionScore {
	stars: 1 | 2 | 3;
	timeBonus: boolean;
	casualtyBonus: boolean;
	objectiveBonus: boolean;
}

/** Time threshold for 3-star completion in seconds. */
const TIME_THRESHOLD = 600; // 10 minutes

/** Maximum player casualties for 3-star rating. */
const CASUALTY_THRESHOLD = 5;

/**
 * Calculate the mission score based on current world state.
 * Called when mission reaches victory phase.
 */
export function calculateMissionScore(world: GameWorld): MissionScore {
	const elapsedSec = world.time.elapsedMs / 1000;
	const timeBonus = elapsedSec <= TIME_THRESHOLD;

	// Count player unit losses (difference between spawned and alive)
	let playerAlive = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === FACTION_IDS.ura && Flags.isResource[eid] === 0) {
			playerAlive++;
		}
	}
	// Estimate initial player units from script tags (rough heuristic)
	const initialPlayerUnits = Math.max(playerAlive, 8);
	const casualties = initialPlayerUnits - playerAlive;
	const casualtyBonus = casualties <= CASUALTY_THRESHOLD;

	// Check bonus objectives
	const bonusObjectives = world.session.objectives.filter((o) => o.bonus);
	const objectiveBonus = bonusObjectives.length > 0
		? bonusObjectives.every((o) => o.status === "completed")
		: false;

	let stars: 1 | 2 | 3 = 1;
	const bonusCount = [timeBonus, casualtyBonus, objectiveBonus].filter(Boolean).length;
	if (bonusCount >= 2) stars = 3;
	else if (bonusCount >= 1) stars = 2;

	return { stars, timeBonus, casualtyBonus, objectiveBonus };
}
