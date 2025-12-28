import type { StateCreator } from "zustand";
import type { ChunkData } from "../../types";
import { generateChunk } from "../chunkGenerator";
import type { GameStore, WorldActions } from "../types";

export const createWorldSlice: StateCreator<GameStore, [], [], WorldActions> = (set, get) => ({
	setBuildMode: (active) => set({ isBuildMode: active }),

	discoverChunk: (x, z) => {
		const id = `${x},${z}`;
		const { saveData } = get();

		if (saveData.discoveredChunks[id]) {
			return saveData.discoveredChunks[id];
		}

		const newChunk = generateChunk(x, z);

		set((state: GameStore) => ({
			saveData: {
				...state.saveData,
				discoveredChunks: { ...state.saveData.discoveredChunks, [id]: newChunk },
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

	secureChunk: (chunkId) => {
		set((state: GameStore) => {
			const chunk = state.saveData.discoveredChunks[chunkId];
			if (!chunk || chunk.secured) return state;

			const newStrategic = { ...state.saveData.strategicObjectives };
			let peacekeepingGain = 0;

			if (chunk.entities.some((e) => e.type === "SIPHON")) newStrategic.siphonsDismantled++;
			if (chunk.entities.some((e) => e.type === "HUT")) {
				newStrategic.villagesLiberated++;
				peacekeepingGain += 10;
			}
			if (chunk.entities.some((e) => e.type === "HEALER")) {
				newStrategic.healersProtected++;
				peacekeepingGain += 20;
			}

			return {
				saveData: {
					...state.saveData,
					territoryScore: state.saveData.territoryScore + 1,
					peacekeepingScore: state.saveData.peacekeepingScore + peacekeepingGain,
					strategicObjectives: newStrategic,
					discoveredChunks: {
						...state.saveData.discoveredChunks,
						[chunkId]: { ...chunk, secured: true },
					},
				},
			};
		});
		get().saveGame();
	},
});
