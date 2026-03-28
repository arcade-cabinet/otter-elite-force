/**
 * ResourceBar — Top resource bar inside the game viewport.
 *
 * Matches POC layout: full-width bar at top of game area with
 * Fish, Timber, Salvage, Population, and status display.
 */

import type { Component } from "solid-js";
import type { SolidBridgeAccessors } from "@/engine/bridge/solidBridge";

export const ResourceBar: Component<{ bridge: SolidBridgeAccessors }> = (props) => {
	return (
		<div
			role="status"
			aria-label="Field Economy"
			data-testid="resource-bar"
			class="ui-panel pointer-events-auto absolute left-0 top-0 z-20 flex h-10 w-full items-center justify-between border-b-2 bg-opacity-95 px-2 text-xs md:h-12 md:border-b-4 md:px-6 md:text-sm"
		>
			<div class="flex space-x-3 md:space-x-6">
				<div class="flex items-center space-x-1 md:space-x-2">
					<div class="h-3 w-3 rounded-full border border-sky-300 bg-sky-500 shadow-sm md:h-4 md:w-4" />
					<span class="hidden md:inline">Fish: </span>
					<span class="font-bold text-sky-200">{props.bridge.resources.fish}</span>
				</div>
				<div class="flex items-center space-x-1 md:space-x-2">
					<div class="h-3 w-3 border border-amber-500 bg-amber-700 shadow-sm md:h-4 md:w-4" />
					<span class="hidden md:inline">Timber: </span>
					<span class="font-bold text-amber-600">{props.bridge.resources.timber}</span>
				</div>
				<div class="flex items-center space-x-1 md:space-x-2">
					<div class="h-3 w-3 rounded-sm border border-slate-400 bg-slate-300 shadow-sm md:h-4 md:w-4" />
					<span class="hidden md:inline">Salvage: </span>
					<span class="font-bold text-slate-200">{props.bridge.resources.salvage}</span>
				</div>
				<div class="flex items-center space-x-1 md:space-x-2">
					<div class="h-3 w-3 rounded-sm border border-red-400 bg-red-600 shadow-sm md:h-4 md:w-4" />
					<span class="hidden md:inline">Pop: </span>
					<span class="font-bold text-red-400">
						{props.bridge.population.current}/{props.bridge.population.max}
					</span>
				</div>
			</div>
			<div class="flex items-center space-x-3 md:space-x-6">
				<div class="hidden font-bold uppercase tracking-widest text-green-400 sm:block">
					TACTICAL NET
				</div>
			</div>
		</div>
	);
};
