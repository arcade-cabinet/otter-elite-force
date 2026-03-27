/**
 * ResourceBar -- Top HUD bar showing Fish, Timber, Salvage, and Population.
 *
 * SolidJS component reading from solidBridge stores for fine-grained
 * reactive updates. Military digital-counter styling with monospace font.
 * Wrapped in PanelFrame for corner bracket decorations + canvas-grain texture.
 */

import type { Component } from "solid-js";
import type { SolidBridgeAccessors } from "@/engine/bridge/solidBridge";
import { PanelFrame } from "./PanelFrame";

function ResourceItem(props: { label: string; value: number }) {
	return (
		<div class="flex items-center gap-2 rounded-md border border-slate-600/70 bg-slate-900/18 px-2.5 py-1.5 sm:px-3 sm:py-2">
			<span class="text-[10px] uppercase tracking-[0.24em] text-slate-400">{props.label}</span>
			<span class="min-w-[3ch] text-right font-mono text-sm tabular-nums tracking-[0.18em] text-slate-100">
				{props.value}
			</span>
		</div>
	);
}

export const ResourceBar: Component<{ bridge: SolidBridgeAccessors }> = (props) => {
	return (
		<PanelFrame>
			<div
				role="status"
				aria-label="Field Economy"
				data-testid="resource-bar"
				class="canvas-grain border border-green-500/20 bg-slate-950/86 shadow-[0_0_0_1px_rgba(0,255,65,0.06),0_18px_40px_rgba(0,0,0,0.34)]"
			>
				<div class="flex flex-wrap items-center gap-2 p-2.5 sm:gap-4 sm:p-3">
					<div class="flex items-center gap-2 pr-1 sm:pr-2">
						<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">
							TACTICAL NET
						</span>
						<span class="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:inline">
							FIELD ECONOMY
						</span>
					</div>
					<div class="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
						<ResourceItem label="Fish" value={props.bridge.resources.fish} />
						<ResourceItem label="Timber" value={props.bridge.resources.timber} />
						<ResourceItem label="Salvage" value={props.bridge.resources.salvage} />
					</div>
					<div class="flex w-full items-center justify-between gap-2 rounded-md border border-slate-600/70 bg-slate-900/18 px-3 py-2 sm:ml-auto sm:w-auto sm:justify-start">
						<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">
							POP
						</span>
						<span class="font-mono text-sm tracking-[0.18em] text-slate-100">
							{props.bridge.population.current}/{props.bridge.population.max}
						</span>
					</div>
				</div>
			</div>
		</PanelFrame>
	);
};
