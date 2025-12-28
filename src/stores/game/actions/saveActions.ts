import type { StateCreator } from "zustand";
import { RANKS, STORAGE_KEY } from "../../../utils/constants";
import { DEFAULT_SAVE_DATA } from "../../persistence";
import type { GameStore, SaveActions } from "../types";

export const createSaveSlice: StateCreator<GameStore, [], [], SaveActions> = (set, get) => ({
	loadData: () => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsedData = JSON.parse(saved);
				if (!parsedData.lastPlayerPosition) {
					parsedData.lastPlayerPosition = [0, 0, 0];
				}
				set({
					saveData: parsedData,
					playerPos: parsedData.lastPlayerPosition,
				});
			}
		} catch (e) {
			console.error("Load failed", e);
		}
	},

	saveGame: () => {
		try {
			const currentPos = get().playerPos;
			const updatedSaveData = {
				...get().saveData,
				lastPlayerPosition: currentPos as [number, number, number],
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSaveData));
			set({ saveData: updatedSaveData });
		} catch (e) {
			console.error("Save failed", e);
		}
	},

	resetData: () => {
		localStorage.removeItem(STORAGE_KEY);
		set({ saveData: { ...DEFAULT_SAVE_DATA } });
		window.location.reload();
	},

	gainXP: (amount) => {
		set((state: GameStore) => {
			const newXP = state.saveData.xp + amount;
			const requiredXP = (state.saveData.rank + 1) * 200;
			const newRank =
				newXP >= requiredXP
					? Math.min(state.saveData.rank + 1, RANKS.length - 1)
					: state.saveData.rank;
			return { saveData: { ...state.saveData, xp: newXP, rank: newRank } };
		});
		get().saveGame();
	},

	setLevel: (levelId: number) => {
		set({ currentChunkId: `${levelId},0` });
	},
});
