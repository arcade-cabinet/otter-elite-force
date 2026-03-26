/**
 * Skirmish Result — computes end-of-match statistics.
 *
 * Called after a skirmish sandbox run completes (victory, defeat, or timeout).
 * Produces human-readable stats for the result screen:
 *   - Units lost per faction
 *   - Resources gathered
 *   - Match duration
 *   - Seed phrase for replay
 */

import { Faction, Flags } from "@/engine/world/components";
import type { GameWorld } from "@/engine/world/gameWorld";
import type { SkirmishSandboxResult } from "./skirmishSandbox";

export interface SkirmishResultStats {
	/** Outcome of the skirmish */
	outcome: "victory" | "defeat" | "timeout";
	/** Duration in seconds */
	durationSeconds: number;
	/** Ticks simulated */
	ticksRun: number;
	/** Player units still alive */
	playerUnitsAlive: number;
	/** Enemy units still alive */
	enemyUnitsAlive: number;
	/** Player buildings still standing */
	playerBuildingsAlive: number;
	/** Enemy buildings still standing */
	enemyBuildingsAlive: number;
	/** Total entities remaining */
	totalEntitiesAlive: number;
	/** Resources at end of match */
	finalResources: {
		fish: number;
		timber: number;
		salvage: number;
	};
	/** Seed phrase for deterministic replay */
	seedPhrase: string;
	/** Design seed value */
	designSeed: number;
}

/**
 * Compute result stats from a completed skirmish sandbox run.
 */
export function computeSkirmishResult(
	sandboxResult: SkirmishSandboxResult,
): SkirmishResultStats {
	const world = sandboxResult.world;

	// Determine outcome
	let outcome: SkirmishResultStats["outcome"];
	if (sandboxResult.phase === "victory") {
		outcome = "victory";
	} else if (sandboxResult.phase === "defeat") {
		outcome = "defeat";
	} else {
		outcome = "timeout";
	}

	// Count entities by faction and type
	const counts = countEntitiesByFaction(world);

	return {
		outcome,
		durationSeconds: Math.round(world.time.elapsedMs / 1000),
		ticksRun: sandboxResult.ticksRun,
		playerUnitsAlive: counts.playerUnits,
		enemyUnitsAlive: counts.enemyUnits,
		playerBuildingsAlive: counts.playerBuildings,
		enemyBuildingsAlive: counts.enemyBuildings,
		totalEntitiesAlive: sandboxResult.aliveEntities,
		finalResources: {
			fish: world.session.resources.fish,
			timber: world.session.resources.timber,
			salvage: world.session.resources.salvage,
		},
		seedPhrase: world.rng.phrase,
		designSeed: world.rng.designSeed,
	};
}

interface FactionCounts {
	playerUnits: number;
	enemyUnits: number;
	playerBuildings: number;
	enemyBuildings: number;
}

function countEntitiesByFaction(world: GameWorld): FactionCounts {
	let playerUnits = 0;
	let enemyUnits = 0;
	let playerBuildings = 0;
	let enemyBuildings = 0;

	for (const eid of world.runtime.alive) {
		const isBuilding = Flags.isBuilding[eid] === 1;
		const isResource = Flags.isResource[eid] === 1;
		const factionId = Faction.id[eid];

		if (isResource) continue;

		if (factionId === 1) {
			// Player (ura)
			if (isBuilding) {
				playerBuildings++;
			} else {
				playerUnits++;
			}
		} else if (factionId === 2) {
			// Enemy (scale_guard)
			if (isBuilding) {
				enemyBuildings++;
			} else {
				enemyUnits++;
			}
		}
	}

	return { playerUnits, enemyUnits, playerBuildings, enemyBuildings };
}
