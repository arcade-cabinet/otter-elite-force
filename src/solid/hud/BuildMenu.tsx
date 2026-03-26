/**
 * BuildMenu — Grid of building options with cost and affordability gating.
 *
 * Shows available URA structures. Unaffordable buildings are greyed out
 * and disabled. Clicking an affordable building emits startBuild via bridge.
 *
 * Reads resources from solidBridge stores.
 */

import { For, type Component } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";

export interface BuildOption {
	id: string;
	name: string;
	role: string;
	cost: { fish?: number; timber?: number; salvage?: number };
}

const DEFAULT_BUILD_OPTIONS: BuildOption[] = [
	{ id: "command_post", name: "Command Post", role: "Workers, resource depot", cost: { timber: 400, salvage: 200 } },
	{ id: "barracks", name: "Barracks", role: "Trains Mudfoots, Shellcrackers", cost: { timber: 200 } },
	{ id: "burrow", name: "Burrow", role: "Population housing", cost: { timber: 100 } },
	{ id: "fish_trap", name: "Fish Trap", role: "Automated fish income", cost: { timber: 80 } },
	{ id: "watchtower", name: "Watchtower", role: "Defensive tower", cost: { timber: 150, salvage: 50 } },
	{ id: "sandbag_wall", name: "Sandbag Wall", role: "Defensive barrier", cost: { timber: 50 } },
	{ id: "armory", name: "Armory", role: "Upgrades and research", cost: { timber: 250, salvage: 150 } },
	{ id: "field_hospital", name: "Field Hospital", role: "Heals nearby units", cost: { timber: 200, salvage: 100 } },
	{ id: "dock", name: "Dock", role: "Naval units", cost: { timber: 300, salvage: 100 } },
];

function formatCost(cost: { fish?: number; timber?: number; salvage?: number }): string {
	const parts: string[] = [];
	if ((cost.fish ?? 0) > 0) parts.push(`F${cost.fish}`);
	if ((cost.timber ?? 0) > 0) parts.push(`T${cost.timber}`);
	if ((cost.salvage ?? 0) > 0) parts.push(`S${cost.salvage}`);
	return parts.join(" ") || "Free";
}

export const BuildMenu: Component<{
	bridge: SolidBridgeAccessors;
	emit: SolidBridgeEmit;
	options?: BuildOption[];
}> = (props) => {
	const options = () => props.options ?? DEFAULT_BUILD_OPTIONS;

	const canAfford = (cost: { fish?: number; timber?: number; salvage?: number }): boolean => {
		return (
			props.bridge.resources.fish >= (cost.fish ?? 0) &&
			props.bridge.resources.timber >= (cost.timber ?? 0) &&
			props.bridge.resources.salvage >= (cost.salvage ?? 0)
		);
	};

	return (
		<div
			data-testid="build-menu"
			class="border border-slate-600/70 bg-slate-950/88 shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
		>
			<div class="p-3">
				<div class="mb-2 flex items-center gap-2 border-b border-slate-600/60 pb-2">
					<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
						Field Build Palette
					</span>
				</div>
				<div class="grid grid-cols-3 gap-2">
					<For each={options()}>
						{(opt) => {
							const affordable = () => canAfford(opt.cost);
							return (
								<button
									type="button"
									disabled={!affordable()}
									onClick={() => props.emit.startBuild(opt.id)}
									class={`flex h-auto min-h-24 flex-col items-start justify-between gap-2 rounded-none border px-2.5 py-2 text-left text-[10px] uppercase tracking-[0.18em] transition-colors ${
										affordable()
											? "border-green-500/20 bg-slate-900/35 text-slate-100 hover:border-green-500/50 hover:bg-slate-800/35"
											: "border-slate-600/70 bg-slate-900/20 text-slate-500 opacity-60 cursor-not-allowed"
									}`}
								>
									<div class="grid gap-1">
										<span class="font-mono text-[11px] uppercase tracking-[0.16em]">
											{opt.name}
										</span>
										<span class="text-[9px] uppercase tracking-[0.14em] text-slate-500">
											{opt.role}
										</span>
									</div>
									<span class="font-mono text-[9px] text-slate-500">
										{formatCost(opt.cost)}
									</span>
								</button>
							);
						}}
					</For>
				</div>
			</div>
		</div>
	);
};
