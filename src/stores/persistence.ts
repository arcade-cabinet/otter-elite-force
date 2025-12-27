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
		data.strategicObjectives = data.strategicObjectives || DEFAULT_SAVE_DATA.strategicObjectives;
		data.spoilsOfWar = data.spoilsOfWar || DEFAULT_SAVE_DATA.spoilsOfWar;
	}

	// Ensure weaponLvl exists for all base weapons
	if (!data.upgrades) data.upgrades = { ...DEFAULT_SAVE_DATA.upgrades };
	if (!data.upgrades.weaponLvl) data.upgrades.weaponLvl = { ...DEFAULT_SAVE_DATA.upgrades.weaponLvl };

	data.version = 8;
	return data as SaveData;
};

export const isValidSaveData = (data: any): data is SaveData => {
	return (
		data &&
		typeof data.version === "number" &&
		Array.isArray(data.unlockedCharacters) &&
		typeof data.coins === "number"
	);
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
			console.error("Invalid save data format");
			return null;
		}

		const migrated = migrateSchema(parsed);
		return deepMerge(DEFAULT_SAVE_DATA, migrated);
	} catch (e) {
		console.error("Load failed", e);
		return null;
	}
};
