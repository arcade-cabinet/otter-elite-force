/**
 * Game State Store
 * Central state management using Zustand
 */

import { create } from "zustand";
import { LEVELS, RANKS, STORAGE_KEY } from "../utils/constants";

export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER";

export interface CharacterTraits {
	id: string;
	name: string;
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
}

export interface CharacterGear {
	headgear?: "bandana" | "beret" | "helmet" | "none";
	vest?: "tactical" | "heavy" | "none";
	backgear?: "radio" | "scuba" | "none";
	weapon?: "fish-cannon" | "bubble-gun";
}

export const CHARACTERS: Record<string, { traits: CharacterTraits; gear: CharacterGear }> = {
	bubbles: {
		traits: {
			id: "bubbles",
			name: "SGT. BUBBLES",
			furColor: "#5D4037",
			eyeColor: "#111",
			whiskerLength: 0.3,
			grizzled: false,
		},
		gear: {
			headgear: "bandana",
			vest: "tactical",
			backgear: "radio",
			weapon: "fish-cannon",
		},
	},
	whiskers: {
		traits: {
			id: "whiskers",
			name: "GEN. WHISKERS",
			furColor: "#8D6E63",
			eyeColor: "#222",
			whiskerLength: 0.8,
			grizzled: true,
		},
		gear: {
			headgear: "beret",
			vest: "heavy",
			backgear: "none",
			weapon: "fish-cannon",
		},
	},
	splash: {
		traits: {
			id: "splash",
			name: "CPL. SPLASH",
			furColor: "#4E342E",
			eyeColor: "#00ccff",
			whiskerLength: 0.2,
			grizzled: false,
		},
		gear: {
			headgear: "none",
			vest: "tactical",
			backgear: "scuba",
			weapon: "bubble-gun",
		},
	},
};

interface SaveData {
	rank: number;
	xp: number;
	medals: number;
	unlocked: number;
	unlockedCharacters: string[];
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

	// Character management
	selectedCharacterId: string;
	selectCharacter: (id: string) => void;

	// Save data
	saveData: SaveData;
	loadData: () => void;
	saveGame: () => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	winLevel: (levelId: number) => void;
	unlockCharacter: (id: string) => void;

	// UI state
	isZoomed: boolean;
	toggleZoom: () => void;
}

const DEFAULT_SAVE_DATA: SaveData = {
	rank: 0,
	xp: 0,
	medals: 0,
	unlocked: 1,
	unlockedCharacters: ["bubbles"],
};

export const useGameStore = create<GameState>((set, get) => ({
	// Initial state
	mode: "MENU",
	health: 100,
	maxHealth: 100,
	kills: 0,
	currentLevel: 0,
	selectedCharacterId: "bubbles",
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

	// Character management
	selectCharacter: (id) => set({ selectedCharacterId: id }),

	unlockCharacter: (id) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				unlockedCharacters: state.saveData.unlockedCharacters.includes(id)
					? state.saveData.unlockedCharacters
					: [...state.saveData.unlockedCharacters, id],
			},
		}));
		get().saveGame();
	},

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
