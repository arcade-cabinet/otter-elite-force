/**
 * ObjectivesPanel — Lists mission objectives with status indicators.
 *
 * Status indicators:
 * - completed = green checkmark
 * - active = amber dot
 * - failed = red X
 *
 * Reads from solidBridge objectives store.
 */

import { type Component, For, Show } from "solid-js";
import type { SolidBridgeAccessors } from "@/engine/bridge/solidBridge";

const STATUS_ICON: Record<string, { symbol: string; color: string }> = {
	completed: { symbol: "\u2713", color: "text-green-400" },
	active: { symbol: "\u2022", color: "text-amber-400" },
	failed: { symbol: "\u2717", color: "text-rose-400" },
};

export const ObjectivesPanel: Component<{ bridge: SolidBridgeAccessors }> = (props) => {
	return (
		<div
			data-testid="objectives-panel"
			class="border border-slate-600/70 bg-slate-950/88 shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
		>
			<div class="p-3">
				<div class="mb-2 flex items-center gap-2 border-b border-slate-600/60 pb-2">
					<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">
						OBJECTIVES
					</span>
					<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
						MISSION BRIEF
					</span>
				</div>
				<Show
					when={props.bridge.objectives.length > 0}
					fallback={
						<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
							No objectives assigned
						</span>
					}
				>
					<ul class="flex flex-col gap-1.5">
						<For each={props.bridge.objectives}>
							{(objective) => {
								const status = () => STATUS_ICON[objective.status] ?? STATUS_ICON.active;
								return (
									<li class="flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
										<span class={`mt-px flex-shrink-0 text-sm ${status().color}`}>
											{status().symbol}
										</span>
										<span
											class={
												objective.status === "completed"
													? "text-slate-500 line-through"
													: objective.status === "failed"
														? "text-rose-400/80 line-through"
														: "text-slate-200"
											}
										>
											{objective.description}
										</span>
									</li>
								);
							}}
						</For>
					</ul>
				</Show>
			</div>
		</div>
	);
};
