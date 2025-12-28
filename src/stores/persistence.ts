/**
 * Persistence Module - Save/Load Game Data
 *
 * Handles all game data persistence using localStorage.
 * Provides schema migration for backward compatibility with older saves.
 *
 * Key responsibilities:
 * - Define default save data structure
 * - Validate and migrate saved data schemas
 * - Deep clone/merge utilities for immutable updates
 * - Safe localStorage read/write with error handling
 *
 * @module stores/persistence
 */

import { STORAGE_KEY } from "../utils/constants";
import { WEAPONS } from "./gameData";
import type { PlacedComponent, SaveData } from "./types";

/**
 * Generate default weapon levels from WEAPONS registry.
 * Ensures all weapons start at level 1 for new games.
 *
 * @returns Record mapping weapon IDs to their starting level (1)
 */
const generateDefaultWeaponLevels = (): Record<string, number> => {
	const levels: Record<string, number> = {};
	for (const weaponId of Object.keys(WEAPONS)) {
		levels[weaponId] = 1;
	}
	return levels;
};

export const DEFAULT_SAVE_DATA: SaveData = {
	version: 8,
	rank: 0,
	xp: 0,
	medals: 0,
	unlocked: 1,
	unlockedCharacters: ["bubbles"],
	unlockedWeapons: ["service-pistol"],
	coins: 0,
	discoveredChunks: {},
	territoryScore: 0,
	peacekeepingScore: 0,
	difficultyMode: "SUPPORT",
	isFallTriggered: false,
	strategicObjectives: {
		siphonsDismantled: 0,
		villagesLiberated: 0,
		gasStockpilesCaptured: 0,
		healersProtected: 0,
		alliesRescued: 0,
	},
	spoilsOfWar: {
		creditsEarned: 0,
		clamsHarvested: 0,
		upgradesUnlocked: 0,
	},
	upgrades: {
		speedBoost: 0,
		healthBoost: 0,
		damageBoost: 0,
		weaponLvl: generateDefaultWeaponLevels(),
	},
	isLZSecured: false,
	baseComponents: [],
	lastPlayerPosition: [0, 0, 0],
};

/**
 * Deep clone an object using JSON serialization.
 * Fast and reliable for plain data objects (no functions, dates, etc.)
 *
 * @param obj - Object to clone
 * @returns Deep copy of the object
 */
export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj));
};

/**
 * Deep merge two objects, with source values overwriting target.
 * Recursively merges nested objects.
 *
 * @param target - Base object
 * @param source - Object with values to merge in
 * @returns New object with merged values
 */
export const deepMerge = (
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): Record<string, unknown> => {
	const output = { ...target };
	if (isObject(target) && isObject(source)) {
		for (const key of Object.keys(source)) {
			const targetVal = target[key];
			const sourceVal = source[key];
			if (isObject(targetVal) && isObject(sourceVal)) {
				output[key] = deepMerge(targetVal, sourceVal);
			} else {
				output[key] = sourceVal;
			}
		}
	}
	return output;
};

function isObject(item: unknown): item is Record<string, unknown> {
	return typeof item === "object" && item !== null && !Array.isArray(item);
}

export const migrateSchema = (data: Record<string, unknown>): Record<string, unknown> => {
	const version = (data.version as number) || 7;

	if (version < 8) {
		data.baseComponents = (data.baseComponents as PlacedComponent[]) || [];
		data.strategicObjectives =
			(data.strategicObjectives as SaveData["strategicObjectives"]) ||
			deepClone(DEFAULT_SAVE_DATA.strategicObjectives);
		data.spoilsOfWar =
			(data.spoilsOfWar as SaveData["spoilsOfWar"]) || deepClone(DEFAULT_SAVE_DATA.spoilsOfWar);
	}

	// Ensure weaponLvl exists for all base weapons
	if (!data.upgrades) {
		data.upgrades = deepClone(DEFAULT_SAVE_DATA.upgrades);
	} else {
		const upgrades = data.upgrades as SaveData["upgrades"];
		if (!upgrades.weaponLvl) {
			upgrades.weaponLvl = deepClone(DEFAULT_SAVE_DATA.upgrades.weaponLvl);
		}
	}

	// Migrate chunks to include new persistence fields (v8+)
	if (data.discoveredChunks) {
		const chunks = data.discoveredChunks as Record<string, unknown>;
		for (const [id, chunk] of Object.entries(chunks)) {
			const chunkData = chunk as Record<string, unknown>;
			// Add territoryState if missing
			if (!chunkData.territoryState) {
				chunkData.territoryState = chunkData.secured ? "SECURED" : "NEUTRAL";
			}
			// Add lastVisited if missing
			if (!chunkData.lastVisited) {
				chunkData.lastVisited = Date.now();
			}
			// Add hibernated if missing
			if (chunkData.hibernated === undefined) {
				chunkData.hibernated = false;
			}
			chunks[id] = chunkData;
		}
		data.discoveredChunks = chunks;
	}

	data.version = 8;
	return data;
};

export const isValidSaveData = (data: unknown): data is SaveData => {
	if (!data || typeof data !== "object") return false;

	const record = data as Record<string, unknown>;
	const requiredFields = [
		"version",
		"unlockedCharacters",
		"unlockedWeapons",
		"coins",
		"discoveredChunks",
		"upgrades",
	];

	for (const field of requiredFields) {
		if (!(field in record)) return false;
	}

	if (typeof record.version !== "number") return false;
	if (!Array.isArray(record.unlockedCharacters)) return false;
	if (typeof record.coins !== "number") return false;

	// Basic check for upgrades structure
	const upgrades = record.upgrades as Record<string, unknown>;
	if (typeof upgrades !== "object" || upgrades === null || !("weaponLvl" in upgrades)) return false;

	return true;
};

export const saveToLocalStorage = (data: SaveData) => {
	try {
		// NOSONAR: localStorage is appropriate for client-side game save data persistence
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		if (e instanceof DOMException && e.name === "QuotaExceededError") {
			console.error("Storage quota exceeded. Save failed.");
			// Provide some visual feedback if possible, or just log
		} else {
			console.error("Save failed", e);
		}
	}
};

export const loadFromLocalStorage = (): SaveData | null => {
	try {
		// NOSONAR: localStorage is appropriate for client-side game save data persistence
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return null;

		// NOSONAR: JSON.parse is safe here - we validate the structure with isValidSaveData
		const parsed = JSON.parse(saved);
		if (!isValidSaveData(parsed)) {
			console.warn("Invalid save data format detected, attempting to recover partially");
			return null;
		}

		// Migrate schema to latest version - need to cast through unknown due to type guard narrowing
		const parsedRecord = parsed as unknown as Record<string, unknown>;
		const migrated = migrateSchema(parsedRecord);

		// Deep merge with defaults to fill any missing fields
		const defaultCopy: Record<string, unknown> = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
		const migratedCopy: Record<string, unknown> = JSON.parse(JSON.stringify(migrated));
		const merged = deepMerge(defaultCopy, migratedCopy);

		return merged as unknown as SaveData;
	} catch (e) {
		console.error("Load failed", e);
		return null;
	}
};
