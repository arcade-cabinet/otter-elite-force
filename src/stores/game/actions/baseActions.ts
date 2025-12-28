import type { StateCreator } from "zustand";
import type { BaseActions, GameStore } from "../types";

export const createBaseSlice: StateCreator<GameStore, [], [], BaseActions> = (set, get) => ({
	secureLZ: () => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				isLZSecured: true,
			},
		}));
		get().saveGame();
	},

	placeComponent: (comp) => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				baseComponents: [
					...state.saveData.baseComponents,
					{ ...comp, id: `base-${crypto.randomUUID()}` },
				],
			},
		}));
		get().saveGame();
	},

	removeComponent: (id) => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				baseComponents: state.saveData.baseComponents.filter((c) => c.id !== id),
			},
		}));
		get().saveGame();
	},
});
