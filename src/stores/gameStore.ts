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
			headgear: "helmet",
			vest: "tactical",
			backgear: "scuba",
			weapon: "bubble-gun",
		},
	},
	fang: {
		traits: {
			id: "fang",
			name: "SGT. FANG",
			furColor: "#333",
			eyeColor: "#ff0000",
			whiskerLength: 0.4,
			grizzled: true,
		},
		gear: {
			headgear: "none",
			vest: "heavy",
			backgear: "none",
			weapon: "fish-cannon",
		},
	},
};

interface SaveData {
	rank: number;
	xp: number;
	medals: number;
	unlocked: number;
	unlockedCharacters: string[];
	coins: number;
	discoveredChunks: Record<string, ChunkData>;
}

export interface ChunkData {
	id: string; // "x,z"
	x: number;
	z: number;
	seed: number;
	terrainType: "RIVER" | "MARSH" | "DENSE_JUNGLE";
	entities: {
		id: string;
		type: "GATOR" | "SNAKE" | "SNAPPER" | "PLATFORM";
		position: [number, number, number];
		isHeavy?: boolean;
	}[];
	decorations: {
		type: "REED" | "LILYPAD" | "DEBRIS" | "BURNT_TREE" | "MANGROVE" | "DRUM";
		count: number;
	}[];
}

interface GameState {
	// Game mode
	mode: GameMode | "CANTEEN";
	setMode: (mode: GameMode | "CANTEEN") => void;

	// Player stats
	health: number;
	maxHealth: number;
	kills: number;
	takeDamage: (amount: number) => void;
	heal: (amount: number) => void;
	addKill: () => void;
	resetStats: () => void;

	// World management
	currentChunkId: string;
	discoveredChunks: Record<string, ChunkData>;
	discoverChunk: (x: number, z: number) => ChunkData;
	getNearbyChunks: (x: number, z: number) => ChunkData[];

	// Character management
	selectedCharacterId: string;
	selectCharacter: (id: string) => void;

	// Economy
	addCoins: (amount: number) => void;
	spendCoins: (amount: number) => boolean;

	// Save data
	saveData: SaveData;
	loadData: () => void;
	saveGame: () => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	unlockCharacter: (id: string) => void;

	// UI state
	isZoomed: boolean;
	toggleZoom: () => void;
}

export const CHUNK_SIZE = 100;

export const CHAR_PRICES: Record<string, number> = {
	bubbles: 0,
	whiskers: 1000,
	splash: 500,
	fang: 750,
};

const DEFAULT_SAVE_DATA: SaveData = {
	rank: 0,
	xp: 0,
	medals: 0,
	unlocked: 1,
	unlockedCharacters: ["bubbles"],
	coins: 0,
	discoveredChunks: {},
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

	// World management
	currentChunkId: "0,0",
	discoveredChunks: {},

	discoverChunk: (x, z) => {
		const id = `${x},${z}`;
		const { saveData } = get();

		if (saveData.discoveredChunks[id]) {
			return saveData.discoveredChunks[id];
		}

		// Generate new chunk
		const seed = Math.abs(x * 31 + z * 17);
		const pseudoRandom = () => {
			let s = seed;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		const terrainTypes: ChunkData["terrainType"][] = ["RIVER", "MARSH", "DENSE_JUNGLE"];
		const terrainType = terrainTypes[Math.floor(rand() * terrainTypes.length)];

		const entities: ChunkData["entities"] = [];
		const entityCount = Math.floor(rand() * 5) + 2;
		for (let i = 0; i < entityCount; i++) {
			const type = rand() > 0.7 ? (rand() > 0.5 ? "SNAPPER" : "SNAKE") : "GATOR";
			entities.push({
				id: `e-${id}-${i}`,
				type,
				position: [
					(rand() - 0.5) * CHUNK_SIZE,
					type === "SNAKE" ? 5 : 0, // Snakes are high
					(rand() - 0.5) * CHUNK_SIZE,
				],
				isHeavy: rand() > 0.8,
			});
		}

		// Add Platforms
		const platformCount = Math.floor(rand() * 3) + 1;
		for (let i = 0; i < platformCount; i++) {
			entities.push({
				id: `p-${id}-${i}`,
				type: "PLATFORM", // New type
				position: [
					(rand() - 0.5) * (CHUNK_SIZE - 20),
					0.5,
					(rand() - 0.5) * (CHUNK_SIZE - 20),
				],
			} as any);
		}

		const newChunk: ChunkData = {
			id,
			x,
			z,
			seed,
			terrainType,
			entities,
			decorations: [
				{ type: "REED", count: Math.floor(rand() * 20) + 10 },
				{ type: "LILYPAD", count: Math.floor(rand() * 15) + 5 },
				{ type: "DEBRIS", count: Math.floor(rand() * 5) },
				{ type: "BURNT_TREE", count: terrainType === "DENSE_JUNGLE" ? 15 : 5 },
				{ type: "MANGROVE", count: terrainType === "DENSE_JUNGLE" ? 20 : 10 },
				{ type: "DRUM", count: Math.floor(rand() * 3) },
			],
		};

		set((state) => ({
			saveData: {
				...state.saveData,
				discoveredChunks: {
					...state.saveData.discoveredChunks,
					[id]: newChunk,
				},
			},
		}));
		get().saveGame();
		return newChunk;
	},

	getNearbyChunks: (x, z) => {
		const nearby: ChunkData[] = [];
		for (let dx = -1; dx <= 1; dx++) {
			for (let dz = -1; dz <= 1; dz++) {
				nearby.push(get().discoverChunk(x + dx, z + dz));
			}
		}
		return nearby;
	},

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

	// Economy
	addCoins: (amount) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				coins: state.saveData.coins + amount,
			},
		}));
		get().saveGame();
	},

	spendCoins: (amount) => {
		const { saveData } = get();
		if (saveData.coins >= amount) {
			set((state) => ({
				saveData: {
					...state.saveData,
					coins: state.saveData.coins - amount,
				},
			}));
			get().saveGame();
			return true;
		}
		return false;
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
					coins: state.saveData.coins + 100, // Reward for winning
				},
			};
		});
		get().saveGame();
	},

	// UI controls
	toggleZoom: () => set((state) => ({ isZoomed: !state.isZoomed })),
}));
