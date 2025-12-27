import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GAME_CONFIG } from "../utils/constants";

export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER" | "CANTEEN";

interface StrategicObjective {
	id: string;
	coordinate: [number, number];
	type: "SIPHON" | "GAS_STOCKPILE" | "VILLAGE";
	isCompleted: boolean;
}

interface DiscoveredChunk {
	coordinate: [number, number];
	status: "VILLAGE" | "HOSTILE" | "SECURED";
	lastModified: number;
}

interface GameState {
	// Player Stats
	rank: number;
	xp: number;
	coins: number;

	// World State
	mode: GameMode;
	discoveredChunks: Record<string, DiscoveredChunk>;
	strategicObjectives: StrategicObjective[];
	isLZSecured: boolean;

	// Actions
	setMode: (mode: GameMode) => void;
	addXP: (amount: number) => void;
	addCoins: (amount: number) => void;
	discoverChunk: (x: number, y: number, status: DiscoveredChunk["status"]) => void;
	completeObjective: (id: string) => void;
	resetGame: () => void;
}

const initialState = {
	rank: 1,
	xp: 0,
	coins: 0,
	mode: "MENU" as GameMode,
	discoveredChunks: {},
	strategicObjectives: [],
	isLZSecured: false,
};

export const useGameStore = create<GameState>()(
	persist(
		(set) => ({
			...initialState,

			setMode: (mode) => set({ mode }),

			addXP: (amount) =>
				set((state) => {
					const newXP = state.xp + amount;
					const newRank = Math.floor(newXP / 1000) + 1;
					return { xp: newXP, rank: newRank };
				}),

			addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

			discoverChunk: (x, y, status) =>
				set((state) => {
					const key = `${x},${y}`;
					if (state.discoveredChunks[key]) return state;

					return {
						discoveredChunks: {
							...state.discoveredChunks,
							[key]: {
								coordinate: [x, y],
								status,
								lastModified: Date.now(),
							},
						},
					};
				}),

			completeObjective: (id) =>
				set((state) => ({
					strategicObjectives: state.strategicObjectives.map((obj) =>
						obj.id === id ? { ...obj, isCompleted: true } : obj,
					),
				})),

			resetGame: () => set(initialState),
		}),
		{
			name: GAME_CONFIG.STORAGE_KEYS.GAME_SAVE,
		},
	),
);
