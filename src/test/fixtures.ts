/**
 * Shared Test Fixtures
 *
 * Centralized test data to avoid duplication across test files.
 * When types change, only this file needs updating.
 */

import type { ChunkData, SaveData } from "../stores/types";

/**
 * Creates a minimal valid SaveData object for testing.
 * All fields have sensible defaults that can be overridden.
 */
export function createMockSaveData(overrides?: Partial<SaveData>): SaveData {
	return {
		version: 8,
		rank: 0,
		xp: 0,
		medals: 0,
		unlocked: 1,
		unlockedCharacters: ["bubbles"],
		unlockedWeapons: ["service-pistol"],
		coins: 0,
		resources: {
			wood: 0,
			metal: 0,
			supplies: 0,
		},
		discoveredChunks: {},
		territoryScore: 0,
		peacekeepingScore: 0,
		difficultyMode: "SUPPORT",
		highestDifficulty: "SUPPORT",
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
				"scatter-shell": 1,
				"clam-mortar": 1,
				"silt-needle": 1,
			},
		},
		isLZSecured: false,
		baseComponents: [],
		lastPlayerPosition: [0, 0, 0],
		...overrides,
	};
}

/**
 * Creates a minimal valid ChunkData object for testing.
 */
export function createMockChunk(x: number, z: number, overrides?: Partial<ChunkData>): ChunkData {
	return {
		id: `${x},${z}`,
		x,
		z,
		seed: Math.abs(x * 31 + z * 17),
		terrainType: "RIVER",
		secured: false,
		territoryState: "NEUTRAL",
		lastVisited: Date.now(),
		hibernated: false,
		entities: [],
		decorations: [],
		...overrides,
	};
}

/**
 * Creates a SaveData with existing progress (for "continue game" tests)
 */
export function createMockSaveDataWithProgress(overrides?: Partial<SaveData>): SaveData {
	return createMockSaveData({
		discoveredChunks: {
			"0,0": createMockChunk(0, 0, { secured: true }),
			"1,0": createMockChunk(1, 0),
			"0,1": createMockChunk(0, 1),
		},
		territoryScore: 1,
		coins: 500,
		isLZSecured: true,
		...overrides,
	});
}
