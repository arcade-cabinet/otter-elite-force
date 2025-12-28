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
export type {
	ChunkData,
	DifficultyMode,
	GameMode,
	PlacedComponent,
	SaveData,
	TerrainType,
} from "./types";
export const CHUNK_SIZE = GAME_CONFIG.CHUNK_SIZE;
export type { CharacterGear, CharacterTraits, WeaponData } from "./types";

export const useGameStore = create<GameStore>((set, get, ...args) => ({
	...INITIAL_STATE,

	// Mode management
	setMode: (mode) => set({ mode }),

	setDifficulty: (difficulty) => {
		const current = get().saveData.difficultyMode;
		if (DIFFICULTY_ORDER.indexOf(difficulty) > DIFFICULTY_ORDER.indexOf(current)) {
			set((state: GameStore) => ({
				saveData: {
					...state.saveData,
					difficultyMode: difficulty,
				},
			}));
			get().saveGame();
		}
	},

	// Slices
	...(createPlayerSlice(set, get, ...args) as any),
	...(createWorldSlice(set, get, ...args) as any),
	...(createEconomySlice(set, get, ...args) as any),
	...(createCharacterSlice(set, get, ...args) as any),
	...(createSaveSlice(set, get, ...args) as any),
	...(createBaseSlice(set, get, ...args) as any),

	// UI actions
	toggleZoom: () => set((state: GameStore) => ({ isZoomed: !state.isZoomed })),
}));
