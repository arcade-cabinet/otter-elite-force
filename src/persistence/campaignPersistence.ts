/**
 * Campaign Persistence — bridges ECS singleton traits and SQLite repos.
 *
 * Provides high-level functions to:
 * - Load campaign/settings/unlock state from storage into ECS singletons on launch
 * - Persist campaign progress on mission victory
 * - Auto-save before victory overlay
 * - Continue from latest save or next uncompleted mission
 * - Persist settings changes immediately
 *
 * US-043: Auto-save on mission complete
 * US-045: "Continue" button loads latest save
 * US-046: Campaign progress persistence across sessions
 * US-047: Settings persistence across sessions
 * US-048: Unlock state persistence
 */

import type { World } from "koota";
import {
	CampaignProgress,
	CompletedResearch,
	GameClock,
	UserSettings,
} from "../ecs/traits/state";
import {
	completeMission as dbCompleteMission,
	getAllProgress,
	getMissionProgress,
	seedCampaign,
	unlockMission,
} from "./repos/campaignRepo";
import {
	listSaves,
	saveGame,
} from "./repos/saveRepo";
import {
	ensureSettings,
	loadSettings,
	saveSettings,
} from "./repos/settingsRepo";
import {
	completeResearch,
	getCompletedResearch,
	getUnlockedBuildings,
	getUnlockedUnits,
	unlockBuilding,
	unlockUnit,
} from "./repos/unlockRepo";
import { serializeWorld } from "../systems/saveLoadSystem";

// ---------------------------------------------------------------------------
// Auto-save slot (slot 0 = internal auto-save, slots 1-3 = manual)
// ---------------------------------------------------------------------------

const AUTO_SAVE_SLOT = 0;

// ---------------------------------------------------------------------------
// Launch: load persisted state into ECS singletons
// ---------------------------------------------------------------------------

/**
 * Load all persisted state into the ECS world on app launch.
 * Call after initSingletons() and runMigrations().
 */
export async function loadPersistedState(world: World): Promise<void> {
	await loadCampaignProgressIntoECS(world);
	await loadSettingsIntoECS(world);
	await loadResearchIntoECS(world);
}

/** Load campaign progress from SQLite into the CampaignProgress singleton. */
async function loadCampaignProgressIntoECS(world: World): Promise<void> {
	const allProgress = await getAllProgress();

	// Seed campaign if no progress exists
	if (allProgress.length === 0) {
		await seedCampaign();
		return;
	}

	const progress = world.get(CampaignProgress);
	if (!progress) return;
	for (const row of allProgress) {
		progress.missions[row.mission_id] = {
			status: row.status,
			stars: row.stars,
			bestTime: row.best_time_ms ?? 0,
		};
	}

	// Set currentMission to the first available (not completed) mission
	const nextAvailable = allProgress.find((m) => m.status === "available");
	if (nextAvailable) {
		progress.currentMission = nextAvailable.mission_id;
	}
}

/** Load settings from SQLite into the UserSettings singleton. */
async function loadSettingsIntoECS(world: World): Promise<void> {
	await ensureSettings();
	const stored = await loadSettings();
	if (!stored) return;

	const settings = world.get(UserSettings);
	if (!settings) return;
	settings.musicVolume = stored.music_volume;
	settings.sfxVolume = stored.sfx_volume;
	settings.hapticsEnabled = stored.haptics_enabled === 1;
	settings.cameraSpeed = stored.camera_speed;
	settings.touchMode = stored.touch_mode;
	settings.showGrid = stored.show_grid === 1;
	settings.reduceFx = stored.reduce_fx === 1;
}

/** Load completed research from SQLite into the CompletedResearch singleton. */
async function loadResearchIntoECS(world: World): Promise<void> {
	const ids = await getCompletedResearch();
	const research = world.get(CompletedResearch);
	if (!research) return;
	for (const id of ids) {
		research.ids.add(id);
	}
}

// ---------------------------------------------------------------------------
// US-043: Auto-save on mission complete
// ---------------------------------------------------------------------------

/**
 * Called when the mission ends in victory. Persists campaign progress
 * and auto-saves world state silently (no UI interruption).
 *
 * On defeat, only world state is auto-saved (no campaign progress update).
 */
export async function onMissionVictory(
	world: World,
	missionId: string,
	stars: number,
	unitsLost: number,
): Promise<void> {
	const clock = world.get(GameClock);
	const playTimeMs = clock?.elapsedMs ?? 0;

	// Auto-save world state before victory overlay
	const data = serializeWorld(world);
	const json = JSON.stringify(data);
	await saveGame(AUTO_SAVE_SLOT, missionId, json);

	// Persist campaign progress
	await dbCompleteMission(missionId, stars, playTimeMs, unitsLost);

	// Update ECS CampaignProgress singleton
	const progress = world.get(CampaignProgress);
	if (!progress) return;
	const existing = progress.missions[missionId];
	progress.missions[missionId] = {
		status: "completed",
		stars: existing ? Math.max(existing.stars, stars) : stars,
		bestTime: existing?.bestTime
			? Math.min(existing.bestTime, playTimeMs)
			: playTimeMs,
	};

	// Unlock next mission if applicable
	await unlockNextMission(missionId);

	// Persist research and unlocks
	await persistResearch(world, missionId);
}

/**
 * Called when a mission ends in defeat. Only auto-saves world state
 * (no campaign progress update).
 */
export async function onMissionDefeat(
	world: World,
	missionId: string,
): Promise<void> {
	const data = serializeWorld(world);
	const json = JSON.stringify(data);
	await saveGame(AUTO_SAVE_SLOT, missionId, json);
}

/** Unlock the next sequential mission after completing the given one. */
async function unlockNextMission(completedMissionId: string): Promise<void> {
	// Mission IDs follow the pattern: ch{X}-m{Y}
	const match = completedMissionId.match(/^ch(\d+)-m(\d+)$/);
	if (!match) return;

	const chapter = Number.parseInt(match[1], 10);
	const mission = Number.parseInt(match[2], 10);

	// Check if this is the last mission in the chapter (4 missions per chapter)
	const missionInChapter = ((mission - 1) % 4) + 1;
	let nextMissionId: string;

	if (missionInChapter < 4) {
		// Next mission in same chapter
		nextMissionId = `ch${chapter}-m${mission + 1}`;
	} else if (chapter < 4) {
		// First mission of next chapter
		nextMissionId = `ch${chapter + 1}-m${mission + 1}`;
	} else {
		// Last mission of the game
		return;
	}

	const nextProgress = await getMissionProgress(nextMissionId);
	if (nextProgress && nextProgress.status === "locked") {
		await unlockMission(nextMissionId);
	}
}

/** Persist completed research IDs from ECS to SQLite. */
async function persistResearch(world: World, missionId: string): Promise<void> {
	const research = world.get(CompletedResearch);
	if (!research) return;
	for (const id of research.ids) {
		await completeResearch(id, missionId);
	}
}

// ---------------------------------------------------------------------------
// US-045: "Continue" button
// ---------------------------------------------------------------------------

export interface ContinueTarget {
	type: "save" | "mission";
	/** Save slot number (for type === "save") */
	slot?: number;
	/** Mission ID to start (for type === "mission") */
	missionId: string;
}

/**
 * Determine what "Continue" should do:
 * 1. If a mid-mission save exists, load that save
 * 2. Otherwise, start the next uncompleted mission
 * 3. If no campaign progress, returns null (Continue should be greyed out)
 */
export async function getContinueTarget(): Promise<ContinueTarget | null> {
	// Check for mid-mission saves (slots 1-3 and auto-save 0)
	const saves = await listSaves();
	if (saves.length > 0) {
		// Pick the most recently saved slot
		const latest = saves.reduce((a, b) => (a.saved_at > b.saved_at ? a : b));
		return {
			type: "save",
			slot: latest.slot,
			missionId: latest.mission_id,
		};
	}

	// No saves — find next uncompleted mission
	return getNextUncompletedMission();
}

/**
 * Find the next uncompleted mission in campaign order.
 * Returns null if no campaign progress exists.
 */
async function getNextUncompletedMission(): Promise<ContinueTarget | null> {
	const allProgress = await getAllProgress();
	if (allProgress.length === 0) return null;

	// Find first "available" mission
	const available = allProgress.find((m) => m.status === "available");
	if (available) {
		return { type: "mission", missionId: available.mission_id };
	}

	// All missions completed — replay the last one
	const completed = allProgress.filter((m) => m.status === "completed");
	if (completed.length > 0) {
		const last = completed[completed.length - 1];
		return { type: "mission", missionId: last.mission_id };
	}

	return null;
}

/** Check if the Continue button should be enabled. */
export async function canContinue(): Promise<boolean> {
	const saves = await listSaves();
	if (saves.length > 0) return true;

	const allProgress = await getAllProgress();
	return allProgress.length > 0;
}

/** Get the latest save slot info for display. */
export async function getLatestSaveInfo(): Promise<{ slot: number; mission_id: string; saved_at: number } | undefined> {
	const saves = await listSaves();
	if (saves.length === 0) return undefined;
	return saves.reduce((a, b) => (a.saved_at > b.saved_at ? a : b));
}

// ---------------------------------------------------------------------------
// US-047: Settings persistence
// ---------------------------------------------------------------------------

/**
 * Persist the current UserSettings singleton to SQLite.
 * Call whenever a setting changes.
 */
export async function persistSettings(world: World): Promise<void> {
	const settings = world.get(UserSettings);
	if (!settings) return;
	await saveSettings({
		music_volume: settings.musicVolume,
		sfx_volume: settings.sfxVolume,
		haptics_enabled: settings.hapticsEnabled ? 1 : 0,
		camera_speed: settings.cameraSpeed,
		touch_mode: settings.touchMode as "auto" | "one_finger_select" | "two_finger_pan",
		show_grid: settings.showGrid ? 1 : 0,
		reduce_fx: settings.reduceFx ? 1 : 0,
	});
}

// ---------------------------------------------------------------------------
// US-048: Unlock state persistence
// ---------------------------------------------------------------------------

/**
 * Persist unit/building unlocks from a scenario definition to SQLite.
 * Call when a mission is completed that grants new unlocks.
 */
export async function persistMissionUnlocks(
	missionId: string,
	unitUnlocks?: string[],
	buildingUnlocks?: string[],
): Promise<void> {
	if (unitUnlocks) {
		for (const unitType of unitUnlocks) {
			await unlockUnit(unitType, missionId);
		}
	}
	if (buildingUnlocks) {
		for (const buildingType of buildingUnlocks) {
			await unlockBuilding(buildingType, missionId);
		}
	}
}

/**
 * Load all unlock state from SQLite.
 * Returns unit types, building types, and research IDs that are unlocked.
 */
export async function loadUnlockState(): Promise<{
	units: string[];
	buildings: string[];
	research: string[];
}> {
	const [units, buildings, research] = await Promise.all([
		getUnlockedUnits(),
		getUnlockedBuildings(),
		getCompletedResearch(),
	]);
	return { units, buildings, research };
}
