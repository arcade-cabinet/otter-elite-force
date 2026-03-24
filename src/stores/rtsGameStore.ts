/**
 * Active game state store (RTS bridge).
 *
 * Zustand store for in-game state that bridges between Phaser scenes
 * and the Koota ECS world. Holds transient game state that does NOT
 * persist to SQLite (resources, selection, objectives are session-scoped).
 *
 * For persistent state, see campaignStore and settingsStore.
 *
 * @module stores/rtsGameStore
 */
import { createStore } from "zustand/vanilla";

export type RTSGamePhase = "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat";

export interface Resources {
	fish: number;
	timber: number;
	salvage: number;
}

export interface ObjectiveState {
	id: string;
	description: string;
	completed: boolean;
	bonus: boolean;
}

interface RTSGameState {
	// Phase
	phase: RTSGamePhase;
	setPhase: (phase: RTSGamePhase) => void;

	// Current mission
	missionId: string | null;
	setMission: (id: string) => void;

	// Resources
	resources: Resources;
	addResource: (type: keyof Resources, amount: number) => void;
	spendResource: (type: keyof Resources, amount: number) => boolean;
	setResources: (resources: Resources) => void;

	// Population
	currentPop: number;
	maxPop: number;
	setPopulation: (current: number, max: number) => void;

	// Selection
	selectedEntityIds: number[];
	setSelection: (ids: number[]) => void;
	clearSelection: () => void;

	// Objectives
	objectives: ObjectiveState[];
	setObjectives: (objectives: ObjectiveState[]) => void;
	completeObjective: (id: string) => void;

	// Game clock
	elapsedMs: number;
	tickClock: (deltaMs: number) => void;

	// Reset for new mission
	resetGame: () => void;
}

const INITIAL_RESOURCES: Resources = { fish: 0, timber: 0, salvage: 0 };

export const useRTSGameStore = createStore<RTSGameState>((set, get) => ({
	phase: "loading",
	missionId: null,
	resources: { ...INITIAL_RESOURCES },
	currentPop: 0,
	maxPop: 4,
	selectedEntityIds: [],
	objectives: [],
	elapsedMs: 0,

	setPhase: (phase) => set({ phase }),

	setMission: (id) => set({ missionId: id }),

	addResource: (type, amount) =>
		set((state) => ({
			resources: {
				...state.resources,
				[type]: state.resources[type] + amount,
			},
		})),

	spendResource: (type, amount) => {
		const { resources } = get();
		if (resources[type] >= amount) {
			set((state) => ({
				resources: {
					...state.resources,
					[type]: state.resources[type] - amount,
				},
			}));
			return true;
		}
		return false;
	},

	setResources: (resources) => set({ resources }),

	setPopulation: (current, max) => set({ currentPop: current, maxPop: max }),

	setSelection: (ids) => set({ selectedEntityIds: ids }),

	clearSelection: () => set({ selectedEntityIds: [] }),

	setObjectives: (objectives) => set({ objectives }),

	completeObjective: (id) =>
		set((state) => ({
			objectives: state.objectives.map((obj) =>
				obj.id === id ? { ...obj, completed: true } : obj,
			),
		})),

	tickClock: (deltaMs) => set((state) => ({ elapsedMs: state.elapsedMs + deltaMs })),

	resetGame: () =>
		set({
			phase: "loading",
			missionId: null,
			resources: { ...INITIAL_RESOURCES },
			currentPop: 0,
			maxPop: 4,
			selectedEntityIds: [],
			objectives: [],
			elapsedMs: 0,
		}),
}));
