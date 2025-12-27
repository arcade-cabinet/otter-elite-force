import { STORAGE_KEY } from "../utils/constants";
import { SaveData } from "./types";

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

export const deepMerge = (target: any, source: any): any => {
	const output = { ...target };
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!(key in target)) {
					Object.assign(output, { [key]: source[key] });
				} else {
					output[key] = deepMerge(target[key], source[key]);
				}
			} else {
				Object.assign(output, { [key]: source[key] });
			}
		});
	}
	return output;
};

function isObject(item: any) {
	return item && typeof item === "object" && !Array.isArray(item);
}

export const migrateSchema = (data: any): SaveData => {
	const version = data.version || 7;

	if (version < 8) {
		data.baseComponents = data.baseComponents || [];
		data.strategicObjectives = data.strategicObjectives || deepClone(DEFAULT_SAVE_DATA.strategicObjectives);
		data.spoilsOfWar = data.spoilsOfWar || deepClone(DEFAULT_SAVE_DATA.spoilsOfWar);
	}

	// Ensure weaponLvl exists for all base weapons
	if (!data.upgrades) data.upgrades = deepClone(DEFAULT_SAVE_DATA.upgrades);
	if (!data.upgrades.weaponLvl) data.upgrades.weaponLvl = deepClone(DEFAULT_SAVE_DATA.upgrades.weaponLvl);

	data.version = 8;
	return data as SaveData;
};

export const isValidSaveData = (data: any): data is SaveData => {
	if (!data || typeof data !== "object") return false;
	
	const requiredFields = [
		"version",
		"unlockedCharacters",
		"unlockedWeapons",
		"coins",
		"discoveredChunks",
		"upgrades",
	];

	for (const field of requiredFields) {
		if (!(field in data)) return false;
	}

	if (typeof data.version !== "number") return false;
	if (!Array.isArray(data.unlockedCharacters)) return false;
	if (typeof data.coins !== "number") return false;
	
	// Basic check for upgrades structure
	if (typeof data.upgrades !== "object" || !data.upgrades.weaponLvl) return false;

	return true;
};

export const saveToLocalStorage = (data: SaveData) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.error("Save failed", e);
	}
};

export const loadFromLocalStorage = (): SaveData | null => {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return null;

		const parsed = JSON.parse(saved);
		if (!isValidSaveData(parsed)) {
			console.warn("Invalid save data format detected, attempting to recover partially");
			// If it's mostly valid, we might still want to try migrating/merging
			// but for now, let's be strict as requested.
			return null;
		}

		const migrated = migrateSchema(parsed);
		return deepMerge(DEFAULT_SAVE_DATA, migrated);
	} catch (e) {
		console.error("Load failed", e);
		return null;
	}
};
