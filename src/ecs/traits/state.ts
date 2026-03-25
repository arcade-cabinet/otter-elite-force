/**
 * Singleton state traits — replaces all Zustand stores.
 *
 * These traits are added to singleton entities (one per world) via
 * initSingletons(). Systems read/write them directly on the world
 * or singleton entity. React reads them via @koota/react hooks.
 *
 * Spec §7: Koota as Single State Layer.
 */
import { trait } from "koota";
import type { ObjectiveStatus } from "@/scenarios/types";

// ---------------------------------------------------------------------------
// Resources (replaces resourceStore)
// ---------------------------------------------------------------------------

/** Global resource pool: fish, timber, salvage. */
export const ResourcePool = trait({ fish: 0, timber: 0, salvage: 0 });

/** Population: current unit count vs max cap. */
export const PopulationState = trait({ current: 0, max: 4 });

/** Set of completed research IDs — permanent within a campaign. */
export const CompletedResearch = trait(() => ({
	ids: new Set<string>(),
}));

// ---------------------------------------------------------------------------
// Game session state (replaces rtsGameStore)
// ---------------------------------------------------------------------------

export type GamePhaseType = "loading" | "playing" | "paused" | "victory" | "defeat";

/** Current game phase. */
export const GamePhase = trait({ phase: "loading" as GamePhaseType });

/** Game clock: deterministic mission chronometer in milliseconds. */
export const GameClock = trait({ elapsedMs: 0, lastDeltaMs: 0, tick: 0, paused: false });

/** Current mission ID (null when not in a mission). */
export const CurrentMission = trait({ missionId: null as string | null });

/** Active mission objectives. */
export const Objectives = trait(() => ({
	list: [] as Array<{
		id: string;
		description: string;
		status: ObjectiveStatus;
		bonus: boolean;
	}>,
}));

// ---------------------------------------------------------------------------
// Dialogue state — drives the portrait overlay dialogue system
// ---------------------------------------------------------------------------

/** A single line in a dialogue exchange. */
export interface DialogueLine {
	speaker: string;
	text: string;
	portraitId?: string;
}

/**
 * Active dialogue exchange — written by scenario triggers, read by the UI.
 *
 * When `active` is true, the BriefingDialogue overlay shows.
 * The game loop pauses during dialogue (GamePhase → "dialogue").
 * When the player advances past all lines, active becomes false.
 */
export const DialogueState = trait(() => ({
	active: false,
	/** The lines to show. Can be a single line or a multi-line exchange. */
	lines: [] as DialogueLine[],
	/** Current line index (advanced by player input). */
	currentLine: 0,
	/** Whether to pause the game during this dialogue. */
	pauseGame: true,
	/** Callback ID for the trigger that initiated this dialogue (for tracking). */
	triggerId: null as string | null,
}));

// ---------------------------------------------------------------------------
// App screen routing (replaces rtsGameStore.phase for UI routing)
// ---------------------------------------------------------------------------

export type AppScreenType =
	| "menu"
	| "campaign"
	| "game"
	| "victory"
	| "settings"
	| "skirmish"
	| "skirmish_result";

/** Which screen the app is currently displaying. */
export const AppScreen = trait({ screen: "menu" as AppScreenType });

// ---------------------------------------------------------------------------
// Campaign persistence (replaces campaignStore)
// ---------------------------------------------------------------------------

/** Campaign-level progress — serialized to SQLite. */
export const CampaignProgress = trait(() => ({
	missions: {} as Record<string, { status: string; stars: number; bestTime: number }>,
	currentMission: null as string | null,
	difficulty: "support" as string,
}));

// ---------------------------------------------------------------------------
// Weather state (ECS-serializable mirror of the WeatherSystem class state)
// ---------------------------------------------------------------------------

/** Current weather condition — serializable snapshot for save/load. */
export const WeatherCondition = trait({
	state: "clear" as "clear" | "rain" | "monsoon",
});

// ---------------------------------------------------------------------------
// Territory state (replaces territoryStore)
// ---------------------------------------------------------------------------

/** Village liberation tracking for territory system. */
export const TerritoryState = trait({
	totalVillages: 0,
	liberatedCount: 0,
	occupiedCount: 0,
});

// ---------------------------------------------------------------------------
// User settings (replaces settingsStore)
// ---------------------------------------------------------------------------

/** User preferences — serialized to SQLite. */
export const UserSettings = trait(() => ({
	masterVolume: 1.0,
	musicVolume: 0.7,
	sfxVolume: 1.0,
	hapticsEnabled: true,
	cameraSpeed: 1.0,
	uiScale: 1.0,
	touchMode: "auto" as string,
	showGrid: false,
	reduceFx: false,
	skipTutorials: false,
}));
