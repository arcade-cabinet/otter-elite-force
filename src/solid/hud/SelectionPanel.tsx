/**
 * SelectionPanel — Shows selected entity info when selection is non-null.
 *
 * Displays primary label, entity count, and contextual action buttons
 * for selected units (move, attack, stop, patrol) or build options
 * when a worker is selected.
 *
 * Reads from solidBridge selection() signal.
 */

import { Show, type Component } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";

const UNIT_ACTIONS = [
	{ id: "move", label: "MOVE", hotkey: "M" },
	{ id: "attack", label: "ATTACK", hotkey: "A" },
	{ id: "stop", label: "STOP", hotkey: "S" },
	{ id: "patrol", label: "PATROL", hotkey: "P" },
] as const;

export const SelectionPanel: Component<{
	bridge: SolidBridgeAccessors;
	emit: SolidBridgeEmit;
}> = (props) => {
	const selection = () => props.bridge.selection();

	return (
		<Show when={selection()}>
			{(sel) => (
				<div
					data-testid="selection-panel"
					class="border border-slate-600/70 bg-slate-950/88 shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
				>
					<div class="flex flex-col gap-2 p-3">
						{/* Header */}
						<div class="flex items-center justify-between gap-2 border-b border-slate-600/60 pb-2">
							<span class="font-mono text-xs uppercase tracking-[0.18em] text-slate-100">
								{sel().primaryLabel}
							</span>
							<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">
								{sel().entityIds.length} UNIT{sel().entityIds.length !== 1 ? "S" : ""}
							</span>
						</div>

						{/* Action buttons */}
						<div class="grid grid-cols-2 gap-2">
							{UNIT_ACTIONS.map((action) => (
								<button
									type="button"
									class="flex items-center justify-between rounded-none border border-slate-600/70 bg-slate-900/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 hover:border-green-500/50 hover:bg-slate-800/85 transition-colors"
								>
									{action.label}
									<span class="text-[9px] tracking-[0.2em] text-slate-500">
										{action.hotkey}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</Show>
	);
};
