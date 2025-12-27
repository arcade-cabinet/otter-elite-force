/**
 * Game State Store
 * Central state management using Zustand
 */

import { create } from "zustand";
import { LEVELS, RANKS, STORAGE_KEY } from "../utils/constants";

export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER";

interface SaveData {
	rank: number;
	xp: number;
	medals: number;
	unlocked: number;
}

interface GameState {
	// Game mode
	mode: GameMode;
	setMode: (mode: GameMode) => void;

	// Player stats
	health: number;
	maxHealth: number;
	kills: number;
	takeDamage: (amount: number) => void;
	heal: (amount: number) => void;
	addKill: () => void;
	resetStats: () => void;

	// Level management
	currentLevel: number;
	setLevel: (level: number) => void;

	// Save data
	saveData: SaveData;
	loadData: () => void;
	saveGame: () => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	winLevel: (levelId: number) => void;

	// UI state
	isZoomed: boolean;
	toggleZoom: () => void;
}

const DEFAULT_SAVE_DATA: SaveData = {
	rank: 0,
	xp: 0,
	medals: 0,
	unlocked: 1,
};

export const useGameStore = create<GameState>((set, get) => ({
	// Initial state
	mode: "MENU",
	health: 100,
	maxHealth: 100,
	kills: 0,
	currentLevel: 0,
	saveData: { ...DEFAULT_SAVE_DATA },
	isZoomed: false,

	// Mode management
	setMode: (mode) => set({ mode }),

	// Player stats
	takeDamage: (amount) =>
		set((state) => ({
			health: Math.max(0, state.health - amount),
		})),

	heal: (amount) =>
		set((state) => ({
			health: Math.min(state.maxHealth, state.health + amount),
		})),

	addKill: () => set((state) => ({ kills: state.kills + 1 })),

	resetStats: () => set({ health: 100, kills: 0 }),

	// Level management
	setLevel: (level) => set({ currentLevel: level }),

	// Save/Load
	loadData: () => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const data = JSON.parse(saved) as SaveData;
				set({ saveData: data });
			}
		} catch (error) {
			console.error("Failed to load save data:", error);
		}
	},

	saveGame: () => {
		try {
			const { saveData } = get();
			localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
		} catch (error) {
			console.error("Failed to save game:", error);
		}
	},

	resetData: () => {
		try {
			localStorage.removeItem(STORAGE_KEY);
			set({ saveData: { ...DEFAULT_SAVE_DATA } });
			window.location.reload();
		} catch (error) {
			console.error("Failed to reset data:", error);
		}
	},

	gainXP: (amount) => {
		set((state) => {
			const newXP = state.saveData.xp + amount;
			const requiredXP = (state.saveData.rank + 1) * 200;
			const newRank =
				newXP >= requiredXP
					? Math.min(state.saveData.rank + 1, RANKS.length - 1)
					: state.saveData.rank;

			return {
				saveData: {
					...state.saveData,
					xp: newXP,
					rank: newRank,
				},
			};
		});
		get().saveGame();
	},

	winLevel: (levelId) => {
		set((state) => {
			const newUnlocked =
				levelId + 1 >= state.saveData.unlocked
					? Math.min(levelId + 2, LEVELS.length)
					: state.saveData.unlocked;

			return {
				saveData: {
					...state.saveData,
					unlocked: newUnlocked,
					medals: state.saveData.medals + 1,
				},
			};
		});
		get().saveGame();
	},

	// UI controls
	toggleZoom: () => set((state) => ({ isZoomed: !state.isZoomed })),
}));
