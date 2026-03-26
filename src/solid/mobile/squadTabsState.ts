/**
 * SquadTabs state — reactive state for squad/control group switching.
 *
 * Separated from JSX so pure-TS tests can import without
 * needing the Solid JSX transform.
 */

import { createSignal } from "solid-js";

export interface SquadGroup {
	groupNumber: number;
	unitCount: number;
}

export interface SquadTabsState {
	groups: () => SquadGroup[];
	activeGroup: () => number | null;
	setActiveGroup: (group: number | null) => void;
	setGroups: (groups: SquadGroup[]) => void;
}

/**
 * Create reactive state for squad tabs.
 */
export function createSquadTabsState(initialGroups?: SquadGroup[]): SquadTabsState {
	const [groups, setGroups] = createSignal<SquadGroup[]>(
		initialGroups ?? [
			{ groupNumber: 1, unitCount: 0 },
			{ groupNumber: 2, unitCount: 0 },
			{ groupNumber: 3, unitCount: 0 },
			{ groupNumber: 4, unitCount: 0 },
			{ groupNumber: 5, unitCount: 0 },
		],
	);
	const [activeGroup, setActiveGroup] = createSignal<number | null>(null);

	return { groups, activeGroup, setActiveGroup, setGroups };
}
