/**
 * Encounter System — random patrol spawns between scripted waves.
 *
 * Adds replay variety without removing the handcrafted mission feel.
 * Uses gameplay noise (GameClock.tick seed) so encounters are deterministic
 * per playthrough but vary between sessions.
 *
 * Each mission can define encounter rates in its mission definition:
 * - encounterInterval: seconds between roll checks (default: 120)
 * - encounterChance: probability per check [0, 1] (default: 0.3)
 * - encounterPool: array of { unitType, count } (what can spawn)
 * - encounterZones: array of zone IDs where patrols can appear
 *
 * The system is optional — missions without encounterPool have no random patrols.
 */

import type { World } from "koota";
import { GameClock, type GamePhaseType } from "@/ecs/traits/state";
import { createNoise } from "@/utils/noise";

// ─── Types ───

export interface EncounterConfig {
	/** Seconds between encounter roll checks. */
	intervalSec: number;
	/** Probability of an encounter spawning per check [0, 1]. */
	chance: number;
	/** Pool of unit types that can appear. */
	pool: Array<{ unitType: string; count: number }>;
	/** Spawn zone coordinates (world positions). */
	spawnPoints: Array<{ x: number; y: number }>;
}

// ─── State ───

let lastCheckTick = 0;

export function resetEncounterState(): void {
	lastCheckTick = 0;
}

/**
 * Check if a random encounter should spawn this frame.
 *
 * Returns null if no encounter, or an encounter descriptor if one should spawn.
 * The caller (GameCanvas action handler) is responsible for actual entity spawning.
 */
export function checkEncounter(
	world: World,
	config: EncounterConfig | null,
): { unitType: string; count: number; x: number; y: number } | null {
	if (!config || config.pool.length === 0 || config.spawnPoints.length === 0) return null;

	const clock = world.get(GameClock);
	if (!clock) return null;

	const currentTick = clock.tick;
	const intervalTicks = Math.floor(config.intervalSec * 60); // 60fps assumption

	if (currentTick - lastCheckTick < intervalTicks) return null;
	lastCheckTick = currentTick;

	// Roll using gameplay noise
	const noise = createNoise(currentTick);

	if (!noise.chance(config.chance)) return null;

	// Pick a random unit from the pool and a random spawn point
	const entry = noise.pick(config.pool);
	const point = noise.pick(config.spawnPoints);

	return {
		unitType: entry.unitType,
		count: entry.count,
		x: point.x,
		y: point.y,
	};
}
