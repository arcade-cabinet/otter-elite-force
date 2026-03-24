/**
 * Territory Store — Zustand store tracking village liberation state.
 *
 * Tracks liberated vs. occupied village counts for campaign map display.
 * Vanilla Zustand (no React) — accessed via getState()/subscribe().
 */

import { createStore } from "zustand/vanilla";

export interface TerritoryState {
	/** Total number of villages in the current mission. */
	totalVillages: number;
	/** Number of villages currently liberated (faction = 'ura'). */
	liberatedCount: number;
	/** Number of villages currently occupied (faction = 'scale_guard'). */
	occupiedCount: number;

	/** Set total village count for the mission. */
	setTotalVillages: (count: number) => void;
	/** Record a village liberation. */
	liberateVillage: () => void;
	/** Record a village recapture by enemy. */
	recaptureVillage: () => void;
	/** Reset for a new mission. */
	reset: () => void;
}

export const territoryStore = createStore<TerritoryState>((set) => ({
	totalVillages: 0,
	liberatedCount: 0,
	occupiedCount: 0,

	setTotalVillages: (count) => {
		set({ totalVillages: count, occupiedCount: count, liberatedCount: 0 });
	},

	liberateVillage: () => {
		set((state) => ({
			liberatedCount: state.liberatedCount + 1,
			occupiedCount: Math.max(0, state.occupiedCount - 1),
		}));
	},

	recaptureVillage: () => {
		set((state) => ({
			liberatedCount: Math.max(0, state.liberatedCount - 1),
			occupiedCount: state.occupiedCount + 1,
		}));
	},

	reset: () => {
		set({ totalVillages: 0, liberatedCount: 0, occupiedCount: 0 });
	},
}));
