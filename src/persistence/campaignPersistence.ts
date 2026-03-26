/**
 * Campaign Persistence — bridges game state and SQLite repos.
 *
 * Provides high-level functions to:
 * - Load campaign progress from storage
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

import {
	completeMission as dbCompleteMission,
	getAllProgress,
	getMissionProgress,
	seedCampaign,
	unlockMission,
} from "./repos/campaignRepo";
import { listSaves, saveGame } from "./repos/saveRepo";
import { ensureSettings, loadSettings, saveSettings } from "./repos/settingsRepo";
import {
	getCompletedResearch,
	getUnlockedBuildings,
	getUnlockedUnits,
	unlockBuilding,
	unlockUnit,
} from "./repos/unlockRepo";

// ---------------------------------------------------------------------------
// Auto-save slot (slot 0 = internal auto-save, slots 1-3 = manual)
// ---------------------------------------------------------------------------

const AUTO_SAVE_SLOT = 0;

// ---------------------------------------------------------------------------
// Campaign progress types
// ---------------------------------------------------------------------------

export interface CampaignProgressData {
	missions: Record<string, { status: string; stars: number; bestTime: number }>;
	currentMission: string | null;
	difficulty: string;
}

export interface UserSettingsData {
	musicVolume: number;
	sfxVolume: number;
	hapticsEnabled: boolean;
	cameraSpeed: number;
	touchMode: string;
	showGrid: boolean;
	reduceFx: boolean;
}

// ---------------------------------------------------------------------------
// Launch: load persisted state
// ---------------------------------------------------------------------------

/**
 * Load campaign progress from SQLite.
 * Returns the progress data for the caller to apply to their state layer.
 */
export async function loadCampaignProgress(): Promise<CampaignProgressData> {
	const allProgress = await getAllProgress();

	if (allProgress.length === 0) {
		await seedCampaign();
		return { missions: {}, currentMission: null, difficulty: "support" };
	}

	const missions: Record<string, { status: string; stars: number; bestTime: number }> = {};
	for (const row of allProgress) {
		missions[row.mission_id] = {
			status: row.status,
			stars: row.stars,
			bestTime: row.best_time_ms ?? 0,
		};
	}

	const nextAvailable = allProgress.find((m) => m.status === "available");
	return {
		missions,
		currentMission: nextAvailable?.mission_id ?? null,
		difficulty: "support",
	};
}

/** Load settings from SQLite. */
export async function loadPersistedSettings(): Promise<UserSettingsData | null> {
	await ensureSettings();
	const stored = await loadSettings();
	if (!stored) return null;

	return {
		musicVolume: stored.music_volume,
		sfxVolume: stored.sfx_volume,
		hapticsEnabled: stored.haptics_enabled === 1,
		cameraSpeed: stored.camera_speed,
		touchMode: stored.touch_mode,
		showGrid: stored.show_grid === 1,
		reduceFx: stored.reduce_fx === 1,
	};
}

/** Load completed research IDs from SQLite. */
export async function loadCompletedResearch(): Promise<Set<string>> {
	const ids = await getCompletedResearch();
	return new Set(ids);
}

/**
 * Legacy compatibility — load all persisted state.
 * This is a no-op in the GameWorld-based architecture since the Solid
 * app state layer handles its own loading.
 */
export async function loadPersistedState(_world: unknown): Promise<void> {
	// No-op: GameWorld-based architecture does not use Koota singleton loading.
	// Campaign and settings loading is done through the typed functions above.
}

// ---------------------------------------------------------------------------
// US-043: Auto-save on mission complete
// ---------------------------------------------------------------------------

/**
 * Called when the mission ends in victory. Persists campaign progress.
 */
export async function onMissionVictory(
	_world: unknown,
	missionId: string,
	stars: number,
	unitsLost: number,
	playTimeMs?: number,
): Promise<void> {
	const resolvedPlayTime = playTimeMs ?? 0;

	// Auto-save stub (world serialization removed with Koota)
	await saveGame(AUTO_SAVE_SLOT, missionId, "{}");

	// Persist campaign progress
	await dbCompleteMission(missionId, stars, resolvedPlayTime, unitsLost);

	// Unlock next mission if applicable
	await unlockNextMission(missionId);
}

/**
 * Called when a mission ends in defeat. Only auto-saves world state.
 */
export async function onMissionDefeat(_world: unknown, missionId: string): Promise<void> {
	await saveGame(AUTO_SAVE_SLOT, missionId, "{}");
}

/** Unlock the next sequential mission after completing the given one. */
async function unlockNextMission(completedMissionId: string): Promise<void> {
	const match = completedMissionId.match(/^mission_(\d+)$/);
	if (!match) return;

	const mission = Number.parseInt(match[1], 10);

	const missionInChapter = ((mission - 1) % 4) + 1;
	let nextMissionId: string;

	if (missionInChapter < 4) {
		nextMissionId = `mission_${mission + 1}`;
	} else if (mission < 16) {
		nextMissionId = `mission_${mission + 1}`;
	} else {
		return;
	}

	const nextProgress = await getMissionProgress(nextMissionId);
	if (nextProgress && nextProgress.status === "locked") {
		await unlockMission(nextMissionId);
	}
}

// ---------------------------------------------------------------------------
// US-045: "Continue" button
// ---------------------------------------------------------------------------

export interface ContinueTarget {
	type: "save" | "mission";
	slot?: number;
	missionId: string;
}

export async function getContinueTarget(): Promise<ContinueTarget | null> {
	const saves = await listSaves();
	if (saves.length > 0) {
		const latest = saves.reduce((a, b) => (a.saved_at > b.saved_at ? a : b));
		return {
			type: "save",
			slot: latest.slot,
			missionId: latest.mission_id,
		};
	}

	return getNextUncompletedMission();
}

async function getNextUncompletedMission(): Promise<ContinueTarget | null> {
	const allProgress = await getAllProgress();
	if (allProgress.length === 0) return null;

	const available = allProgress.find((m) => m.status === "available");
	if (available) {
		return { type: "mission", missionId: available.mission_id };
	}

	const completed = allProgress.filter((m) => m.status === "completed");
	if (completed.length > 0) {
		const last = completed[completed.length - 1];
		return { type: "mission", missionId: last.mission_id };
	}

	return null;
}

export async function canContinue(): Promise<boolean> {
	const saves = await listSaves();
	if (saves.length > 0) return true;

	const allProgress = await getAllProgress();
	return allProgress.length > 0;
}

export async function getLatestSaveInfo(): Promise<
	{ slot: number; mission_id: string; saved_at: number } | undefined
> {
	const saves = await listSaves();
	if (saves.length === 0) return undefined;
	return saves.reduce((a, b) => (a.saved_at > b.saved_at ? a : b));
}

// ---------------------------------------------------------------------------
// US-047: Settings persistence
// ---------------------------------------------------------------------------

export async function persistSettings(settings: UserSettingsData): Promise<void> {
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
