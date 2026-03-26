/**
 * SquadTabs — Horizontal tab bar for squad/control group switching (SolidJS).
 *
 * Shows numbered control groups with unit counts. Tap to select a group,
 * long-press to assign current selection to that group.
 *
 * US-061: Minimum 44px touch targets for tab buttons.
 */

import { type Component, For } from "solid-js";
import type { SquadTabsState } from "./squadTabsState";

export type { SquadGroup, SquadTabsState } from "./squadTabsState";
// Re-export state and types from the pure-TS module
export { createSquadTabsState } from "./squadTabsState";

const LONG_PRESS_MS = 500;

export const SquadTabs: Component<{
	state: SquadTabsState;
	onSelectGroup: (groupNumber: number) => void;
	onAssignGroup: (groupNumber: number) => void;
}> = (props) => {
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;

	const handlePointerDown = (groupNumber: number) => {
		longPressTimer = setTimeout(() => {
			props.onAssignGroup(groupNumber);
			longPressTimer = null;
		}, LONG_PRESS_MS);
	};

	const handlePointerUp = (groupNumber: number) => {
		if (longPressTimer !== null) {
			// Short tap — select the group
			clearTimeout(longPressTimer);
			longPressTimer = null;
			props.state.setActiveGroup(groupNumber);
			props.onSelectGroup(groupNumber);
		}
	};

	const handlePointerLeave = () => {
		if (longPressTimer !== null) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	};

	return (
		<div data-testid="squad-tabs" class="flex gap-1.5 overflow-x-auto px-3 py-2">
			<For each={props.state.groups()}>
				{(group) => {
					const isActive = () => props.state.activeGroup() === group.groupNumber;

					return (
						<button
							type="button"
							data-testid={`squad-tab-${group.groupNumber}`}
							onPointerDown={() => handlePointerDown(group.groupNumber)}
							onPointerUp={() => handlePointerUp(group.groupNumber)}
							onPointerLeave={handlePointerLeave}
							class={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-none border-2 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] select-none ${
								isActive()
									? "border-green-500/50 bg-slate-800/80 text-green-400"
									: "border-slate-600/50 bg-slate-900/70 text-slate-400"
							}`}
						>
							<span class="text-sm font-bold">{group.groupNumber}</span>
							<span class="text-[9px] tracking-[0.14em] text-slate-500">{group.unitCount}</span>
						</button>
					);
				}}
			</For>
		</div>
	);
};
