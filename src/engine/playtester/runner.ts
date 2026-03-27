/**
 * Playtest Runner — runs a full mission headless with the AI governor.
 *
 * Bootstraps a mission, creates a governor, and runs the system pipeline
 * in a tight loop until victory, defeat, or timeout. Produces a detailed
 * PlaytestReport with economy, military, and objective statistics.
 *
 * Deterministic: same seed + same governor config = same outcome.
 */

import { FACTION_IDS } from "@/engine/content/ids";
import { runAllSystems } from "@/engine/systems";
import { createFogGrid, type FogRuntime } from "@/engine/systems/fogSystem";
import { resetGatherTimers } from "@/engine/systems/economySystem";
import { Faction, Flags } from "@/engine/world/components";
import { createGameWorld } from "@/engine/world/gameWorld";
import { createSeedBundle } from "@/engine/random/seed";
import { bootstrapMission } from "@/engine/session/missionBootstrap";
import { createGovernor, type GovernorConfig } from "./governor";

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

export interface PlaytestReport {
	missionId: string;
	difficulty: string;
	outcome: "victory" | "defeat" | "timeout";
	durationTicks: number;
	durationMinutes: number;
	unitsTrainedCount: number;
	unitsLostCount: number;
	buildingsBuiltCount: number;
	resourcesGathered: { fish: number; timber: number; salvage: number };
	objectivesCompleted: number;
	objectivesTotal: number;
	peakArmySize: number;
	enemiesKilled: number;
	timeline: Array<{ tick: number; event: string }>;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const TICK_DELTA_MS = 16.67; // ~60fps
const DEFAULT_MAX_TICKS = 60000; // ~16.7 minutes

/**
 * Run a full mission playtest with the AI governor.
 *
 * @param missionId - Mission to play (e.g. "mission_1")
 * @param config - Governor config (difficulty, mission ID)
 * @param maxTicks - Maximum ticks before timeout (default: 60000)
 * @returns Detailed playtest report
 */
export function runGovernorPlaytest(
	missionId: string,
	config?: Partial<GovernorConfig>,
	maxTicks = DEFAULT_MAX_TICKS,
): PlaytestReport {
	// Reset module-level state to ensure determinism
	resetGatherTimers();

	// Create world with deterministic seed
	const seed = createSeedBundle({
		phrase: "playtest-governor-seed",
		source: "manual",
	});
	const world = createGameWorld(seed);

	// Bootstrap the mission
	bootstrapMission(world, missionId);

	// Initialize fog grid
	if (world.navigation.width > 0 && world.navigation.height > 0) {
		const fogRuntime = world.runtime as FogRuntime;
		if (!fogRuntime.fogGrid) {
			fogRuntime.fogGrid = createFogGrid(
				world.navigation.width,
				world.navigation.height,
			);
			(fogRuntime as { fogGridWidth?: number }).fogGridWidth = world.navigation.width;
			(fogRuntime as { fogGridHeight?: number }).fogGridHeight = world.navigation.height;
		}
	}

	// Create governor
	const governorConfig: GovernorConfig = {
		difficulty: config?.difficulty ?? "optimal",
		missionId,
	};
	const governor = createGovernor(world, governorConfig);

	// Tracking stats
	const startResources = { ...world.session.resources };
	let peakArmySize = 0;
	let initialEnemyCount = 0;
	let initialPlayerUnitCount = 0;

	// Count initial state
	for (const eid of world.runtime.alive) {
		if (Flags.isResource[eid] === 1) continue;
		if (Faction.id[eid] === FACTION_IDS.scale_guard) initialEnemyCount++;
		if (Faction.id[eid] === FACTION_IDS.ura && Flags.isBuilding[eid] === 0)
			initialPlayerUnitCount++;
	}

	let buildingsPlaced = 0;
	let lastBuildingCount = 0;
	for (const eid of world.runtime.alive) {
		if (Faction.id[eid] === FACTION_IDS.ura && Flags.isBuilding[eid] === 1)
			lastBuildingCount++;
	}

	// Main loop
	let tick = 0;
	while (tick < maxTicks) {
		tick++;

		// Advance time
		world.time.deltaMs = TICK_DELTA_MS;
		world.time.elapsedMs += TICK_DELTA_MS;
		world.time.tick = tick;

		// Governor perceives, decides, acts
		governor.tick();

		// Run all game systems
		runAllSystems(world);

		// Track stats
		let currentArmySize = 0;
		let currentBuildingCount = 0;
		for (const eid of world.runtime.alive) {
			if (Faction.id[eid] === FACTION_IDS.ura) {
				if (Flags.isBuilding[eid] === 1) {
					currentBuildingCount++;
				} else if (Flags.isResource[eid] === 0) {
					currentArmySize++;
				}
			}
		}
		if (currentArmySize > peakArmySize) peakArmySize = currentArmySize;
		if (currentBuildingCount > lastBuildingCount) {
			buildingsPlaced += currentBuildingCount - lastBuildingCount;
			lastBuildingCount = currentBuildingCount;
		}

		// Check for game end
		if (world.session.phase === "victory" || world.session.phase === "defeat") {
			break;
		}
	}

	// Count final state
	let finalEnemyCount = 0;
	let finalPlayerUnitCount = 0;
	for (const eid of world.runtime.alive) {
		if (Flags.isResource[eid] === 1) continue;
		if (Faction.id[eid] === FACTION_IDS.scale_guard) finalEnemyCount++;
		if (Faction.id[eid] === FACTION_IDS.ura && Flags.isBuilding[eid] === 0)
			finalPlayerUnitCount++;
	}

	const completedObjectives = world.session.objectives.filter(
		(o) => o.status === "completed",
	).length;
	const totalObjectives = world.session.objectives.length;

	// Calculate resource delta (gathered = current + spent - starting)
	const report = governor.getReport();
	const trainCount = report.actionsPerType["train-unit"] ?? 0;

	const outcome: "victory" | "defeat" | "timeout" =
		world.session.phase === "victory"
			? "victory"
			: world.session.phase === "defeat"
				? "defeat"
				: "timeout";

	return {
		missionId,
		difficulty: governorConfig.difficulty,
		outcome,
		durationTicks: tick,
		durationMinutes: Math.round(((tick * TICK_DELTA_MS) / 60000) * 100) / 100,
		unitsTrainedCount: trainCount,
		unitsLostCount: Math.max(
			0,
			initialPlayerUnitCount + trainCount - finalPlayerUnitCount,
		),
		buildingsBuiltCount: buildingsPlaced,
		resourcesGathered: {
			fish: Math.max(0, world.session.resources.fish - startResources.fish),
			timber: Math.max(0, world.session.resources.timber - startResources.timber),
			salvage: Math.max(0, world.session.resources.salvage - startResources.salvage),
		},
		objectivesCompleted: completedObjectives,
		objectivesTotal: totalObjectives,
		peakArmySize,
		enemiesKilled: Math.max(0, initialEnemyCount - finalEnemyCount),
		timeline: report.timeline,
	};
}
