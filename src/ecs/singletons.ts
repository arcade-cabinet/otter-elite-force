/**
 * Singleton entity initialization — spawns one entity per world-level state trait.
 *
 * Call initSingletons(world) once at app startup. Systems and React components
 * can then query for these singleton entities to read/write global state.
 *
 * World-level traits (world.add/world.set/world.get) are the preferred pattern
 * for singletons in Koota. This helper adds all state traits to the world itself.
 */
import type { World } from "koota";
import {
	AppScreen,
	CampaignProgress,
	CompletedResearch,
	CurrentMission,
	DialogueState,
	GameClock,
	GamePhase,
	Objectives,
	PopulationState,
	ResourcePool,
	TerritoryState,
	UserSettings,
	WeatherCondition,
} from "./traits/state";

/**
 * Add all singleton state traits to the world.
 * Call once at app init (before any systems or React rendering).
 */
export function initSingletons(world: World): void {
	world.add(ResourcePool);
	world.add(PopulationState);
	world.add(CompletedResearch);
	world.add(GamePhase);
	world.add(GameClock);
	world.add(CurrentMission);
	world.add(Objectives);
	world.add(AppScreen);
	world.add(CampaignProgress);
	world.add(TerritoryState);
	world.add(UserSettings);
	world.add(WeatherCondition);
	world.add(DialogueState);
}

/**
 * Reset session-scoped state for a new mission.
 * Preserves campaign progress, settings, and completed research.
 */
export function resetSessionState(world: World): void {
	world.set(ResourcePool, { fish: 0, timber: 0, salvage: 0 });
	world.set(PopulationState, { current: 0, max: 4 });
	world.set(GamePhase, { phase: "loading" });
	world.set(GameClock, { elapsedMs: 0, lastDeltaMs: 0, tick: 0, paused: false });
	world.set(CurrentMission, { missionId: null });
	world.set(Objectives, { list: [] });
	world.set(TerritoryState, {
		totalVillages: 0,
		liberatedCount: 0,
		occupiedCount: 0,
	});
	world.set(WeatherCondition, { state: "clear" });
}
