/**
 * Game State Store - Central State Management
 */

import { create } from "zustand";
import { DIFFICULTY_ORDER, GAME_CONFIG } from "../utils/constants";
import { createBaseSlice } from "./game/actions/baseActions";
import { createCharacterSlice } from "./game/actions/characterActions";
import { createEconomySlice } from "./game/actions/economyActions";
import { createPlayerSlice } from "./game/actions/playerActions";
import { createSaveSlice } from "./game/actions/saveActions";
import { createWorldSlice } from "./game/actions/worldActions";
import { INITIAL_STATE } from "./game/initialState";
import type { GameStore } from "./game/types";

// Re-export constants/types for backward compatibility
export { CHAR_PRICES, CHARACTERS, UPGRADE_COSTS, WEAPONS } from "./gameData";
export type { ChunkData, DifficultyMode, GameMode, PlacedComponent, SaveData, TerrainType } from "./types";
export const CHUNK_SIZE = GAME_CONFIG.CHUNK_SIZE;
export { type CharacterGear, type CharacterTraits, type WeaponData } from "./types";

export const useGameStore = create<GameStore>((set, get, ...args) => ({
	...INITIAL_STATE,

	// Mode management
	setMode: (mode) => set({ mode }),
	
	setDifficulty: (difficulty) => {
		const current = get().saveData.difficultyMode;
		if (DIFFICULTY_ORDER.indexOf(difficulty) > DIFFICULTY_ORDER.indexOf(current)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					difficultyMode: difficulty,
				},
			}));
			get().saveGame();
		}
	},

	// Slices
	...createPlayerSlice(set, get, ...args),
	...createWorldSlice(set, get, ...args),
	...createEconomySlice(set, get, ...args),
	...createCharacterSlice(set, get, ...args),
	...createSaveSlice(set, get, ...args),
	...createBaseSlice(set, get, ...args),

	// UI actions
	toggleZoom: () => set((state) => ({ isZoomed: !state.isZoomed })),
}));
