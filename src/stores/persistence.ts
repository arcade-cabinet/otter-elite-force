import { STORAGE_KEY } from "../utils/constants";
import type { PlacedComponent, SaveData } from "./types";

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
		weaponLvl: {
			"service-pistol": 1,
			"fish-cannon": 1,
			"bubble-gun": 1,
		},
	},
	isLZSecured: false,
	baseComponents: [],
};

export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj));
};

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

export const migrateSchema = (data: Record<string, unknown>): SaveData => {
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

	data.version = 8;
	return data as unknown as SaveData;
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
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return null;

		const parsed = JSON.parse(saved);
		if (!isValidSaveData(parsed)) {
			console.warn("Invalid save data format detected, attempting to recover partially");
			return null;
		}

		// Migrate schema to latest version
		const migrated = migrateSchema(parsed as Record<string, unknown>);

		// Deep merge with defaults to fill any missing fields
		const merged = deepMerge(
			DEFAULT_SAVE_DATA as unknown as Record<string, unknown>,
			migrated as unknown as Record<string, unknown>,
		);

		return merged as unknown as SaveData;
	} catch (e) {
		console.error("Load failed", e);
		return null;
	}
};
