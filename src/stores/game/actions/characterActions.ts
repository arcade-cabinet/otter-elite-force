import type { StateCreator } from "zustand";
import type { CharacterActions, GameStore } from "../types";

export const createCharacterSlice: StateCreator<GameStore, [], [], CharacterActions> = (
	set,
	get,
) => ({
	selectCharacter: (id) => set({ selectedCharacterId: id }),

	unlockCharacter: (id) => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				unlockedCharacters: state.saveData.unlockedCharacters.includes(id)
					? state.saveData.unlockedCharacters
					: [...state.saveData.unlockedCharacters, id],
			},
		}));
		get().saveGame();
	},

	rescueCharacter: (id) => {
		const { saveData } = get();
		if (!saveData.unlockedCharacters.includes(id)) {
			set((state: GameStore) => ({
				saveData: {
					...state.saveData,
					strategicObjectives: {
						...state.saveData.strategicObjectives,
						alliesRescued: state.saveData.strategicObjectives.alliesRescued + 1,
					},
				},
			}));
			get().unlockCharacter(id);
		}
	},
});
