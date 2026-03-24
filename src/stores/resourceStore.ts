/**
 * Resource Store — Zustand store for the RTS resource pool.
 *
 * Tracks Fish, Timber, Salvage, and population.
 * Economy systems deposit gathered resources here.
 * Building/training systems deduct from here.
 */

import { createStore } from "zustand/vanilla";

export interface Resources {
	fish: number;
	timber: number;
	salvage: number;
}

export interface ResourceState extends Resources {
	/** Current population count. */
	currentPop: number;
	/** Maximum population cap (derived from Burrow count x 6). */
	maxPop: number;
	/** Set of completed research IDs — permanent within a campaign. */
	completedResearch: Set<string>;

	/** Add resources to the pool. */
	addResources: (resources: Partial<Resources>) => void;
	/** Deduct resources. Returns true if successful, false if insufficient. */
	deductResources: (cost: Partial<Resources>) => boolean;
	/** Check if the player can afford a cost. */
	canAfford: (cost: Partial<Resources>) => boolean;
	/** Set population values. */
	setPopulation: (current: number, max: number) => void;
	/** Mark a research as completed. */
	completeResearch: (researchId: string) => void;
	/** Check if a research has been completed. */
	isResearched: (researchId: string) => boolean;
	/** Reset to starting values. */
	reset: () => void;
}

const INITIAL_RESOURCES: Resources = { fish: 0, timber: 0, salvage: 0 };

export const resourceStore = createStore<ResourceState>((set, get) => ({
	...INITIAL_RESOURCES,
	currentPop: 0,
	maxPop: 4,
	completedResearch: new Set<string>(),

	addResources: (resources) => {
		set((state) => ({
			fish: state.fish + (resources.fish ?? 0),
			timber: state.timber + (resources.timber ?? 0),
			salvage: state.salvage + (resources.salvage ?? 0),
		}));
	},

	deductResources: (cost) => {
		const state = get();
		const fishCost = cost.fish ?? 0;
		const timberCost = cost.timber ?? 0;
		const salvageCost = cost.salvage ?? 0;

		if (state.fish < fishCost || state.timber < timberCost || state.salvage < salvageCost) {
			return false;
		}

		set({
			fish: state.fish - fishCost,
			timber: state.timber - timberCost,
			salvage: state.salvage - salvageCost,
		});
		return true;
	},

	canAfford: (cost) => {
		const state = get();
		return (
			state.fish >= (cost.fish ?? 0) &&
			state.timber >= (cost.timber ?? 0) &&
			state.salvage >= (cost.salvage ?? 0)
		);
	},

	setPopulation: (current, max) => {
		set({ currentPop: current, maxPop: max });
	},

	completeResearch: (researchId) => {
		const next = new Set(get().completedResearch);
		next.add(researchId);
		set({ completedResearch: next });
	},

	isResearched: (researchId) => {
		return get().completedResearch.has(researchId);
	},

	reset: () => {
		set({ ...INITIAL_RESOURCES, currentPop: 0, maxPop: 4, completedResearch: new Set<string>() });
	},
}));
