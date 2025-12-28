import type { StateCreator } from "zustand";
import type { EconomyActions, GameStore } from "../types";

export const createEconomySlice: StateCreator<GameStore, [], [], EconomyActions> = (set, get) => ({
	addCoins: (amount) => {
		set((state: GameStore) => ({
			saveData: { ...state.saveData, coins: state.saveData.coins + amount },
		}));
		get().saveGame();
	},

	spendCoins: (amount) => {
		const { saveData } = get();
		if (saveData.coins >= amount) {
			set((state: GameStore) => ({
				saveData: { ...state.saveData, coins: state.saveData.coins - amount },
			}));
			get().saveGame();
			return true;
		}
		return false;
	},

	buyUpgrade: (type, cost) => {
		if (get().spendCoins(cost)) {
			const upgradeKey = `${type}Boost` as "speedBoost" | "healthBoost" | "damageBoost";
			set((state: GameStore) => ({
				saveData: {
					...state.saveData,
					upgrades: {
						...state.saveData.upgrades,
						[upgradeKey]: state.saveData.upgrades[upgradeKey] + 1,
					},
				},
			}));
			get().saveGame();
		}
	},

	upgradeWeapon: (id, cost) => {
		if (get().spendCoins(cost)) {
			set((state: GameStore) => ({
				saveData: {
					...state.saveData,
					upgrades: {
						...state.saveData.upgrades,
						weaponLvl: {
							...state.saveData.upgrades.weaponLvl,
							[id]: (state.saveData.upgrades.weaponLvl[id] || 1) + 1,
						},
					},
				},
			}));
			get().saveGame();
		}
	},

	unlockWeapon: (id) => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				unlockedWeapons: state.saveData.unlockedWeapons.includes(id)
					? state.saveData.unlockedWeapons
					: [...state.saveData.unlockedWeapons, id],
			},
		}));
		get().saveGame();
	},

	collectSpoils: (type: "credit" | "clam") => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				spoilsOfWar: {
					...state.saveData.spoilsOfWar,
					creditsEarned: state.saveData.spoilsOfWar.creditsEarned + (type === "credit" ? 1 : 0),
					clamsHarvested: state.saveData.spoilsOfWar.clamsHarvested + (type === "clam" ? 1 : 0),
				},
			},
		}));
		get().saveGame();
	},

	completeStrategic: (_type: "peacekeeping") => {
		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				peacekeepingScore: state.saveData.peacekeepingScore + 10,
			},
		}));
		get().saveGame();
	},
});
