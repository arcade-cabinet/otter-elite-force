/**
 * CommandButtons — Mobile command button strip (SolidJS).
 *
 * Large tap-target buttons for common tactical actions: Move, Attack, Stop, Build.
 * Positioned at bottom of screen. Only visible when units are selected.
 * Each button emits a command via the SolidJS bridge.
 *
 * US-061: All interactive buttons enforce minimum 44x44px touch targets.
 */

import { type Component, For, Show } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";

export interface CommandAction {
	id: string;
	label: string;
	shortcut?: string;
}

const DEFAULT_ACTIONS: CommandAction[] = [
	{ id: "move", label: "MOVE", shortcut: "M" },
	{ id: "attack", label: "ATTACK", shortcut: "A" },
	{ id: "stop", label: "STOP", shortcut: "S" },
	{ id: "build", label: "BUILD", shortcut: "B" },
];

export const CommandButtons: Component<{
	bridge: SolidBridgeAccessors;
	emit: SolidBridgeEmit;
	actions?: CommandAction[];
	onCommand?: (actionId: string) => void;
}> = (props) => {
	const actions = () => props.actions ?? DEFAULT_ACTIONS;
	const hasSelection = () => props.bridge.selection() !== null;

	const handleCommand = (actionId: string) => {
		if (props.onCommand) {
			props.onCommand(actionId);
		}
	};

	return (
		<Show when={hasSelection()}>
			<div
				data-testid="mobile-command-buttons"
				class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-600/70 bg-slate-950/92 backdrop-blur-sm"
			>
				<div class="flex items-center justify-center gap-3 px-4 py-3">
					<For each={actions()}>
						{(action) => (
							<button
								type="button"
								data-testid={`cmd-${action.id}`}
								onClick={() => handleCommand(action.id)}
								class="flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-none border-2 border-slate-500/50 bg-slate-900/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 active:border-green-500/60 active:bg-slate-800/80"
							>
								<span class="text-[11px] font-bold">{action.label}</span>
								<Show when={action.shortcut}>
									<span class="text-[9px] tracking-[0.22em] text-slate-500">{action.shortcut}</span>
								</Show>
							</button>
						)}
					</For>
				</div>
			</div>
		</Show>
	);
};
