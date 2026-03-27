/**
 * BuildMenu — Grid of building options with cost and affordability gating.
 *
 * Shows available URA structures. Unaffordable buildings are greyed out
 * and disabled. Clicking an affordable building emits startBuild via bridge.
 *
 * Costs are pulled from the canonical building entity definitions so they
 * stay in sync with the balance data.
 *
 * Reads resources from solidBridge stores.
 */

import { type Component, For } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import { URA_BUILDING_ENTITIES } from "@/entities/buildings/ura";
import { MilitaryTooltip } from "./MilitaryTooltip";

export interface BuildOption {
	id: string;
	name: string;
	role: string;
	cost: { fish?: number; timber?: number; salvage?: number };
	hp?: number;
	armor?: number;
	buildTime?: number;
}

/** Role descriptions for each URA building in the build palette. */
const BUILD_ROLES: Record<string, string> = {
	command_post: "Workers, resource depot",
	barracks: "Trains Mudfoots, Shellcrackers",
	burrow: "Population housing",
	fish_trap: "Automated fish income",
	watchtower: "Defensive tower",
	sandbag_wall: "Defensive barrier",
	stone_wall: "Fortified barrier",
	armory: "Upgrades and research",
	field_hospital: "Heals nearby units",
	dock: "Naval units",
	gun_tower: "Heavy defensive tower",
	minefield: "Hidden explosive trap",
};

/** Ordered list of URA building IDs for the build palette. */
const BUILD_ORDER: string[] = [
	"command_post",
	"barracks",
	"burrow",
	"fish_trap",
	"watchtower",
	"sandbag_wall",
	"stone_wall",
	"armory",
	"field_hospital",
	"dock",
	"gun_tower",
	"minefield",
];

/** Build options derived from the canonical building entity definitions. */
const DEFAULT_BUILD_OPTIONS: BuildOption[] = BUILD_ORDER
	.map((id) => {
		const def = URA_BUILDING_ENTITIES[id];
		if (!def) return null;
		return {
			id: def.id,
			name: def.name,
			role: BUILD_ROLES[id] ?? def.category,
			cost: { ...def.cost },
			hp: def.hp,
			armor: def.armor,
			buildTime: def.buildTime,
		};
	})
	.filter((opt): opt is BuildOption => opt !== null);

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
								<MilitaryTooltip
									data={{
										name: opt.name,
										cost: formatCost(opt.cost),
										hp: opt.hp,
										armor: opt.armor,
										time: opt.buildTime,
										description: opt.role,
									}}
									side="top"
								>
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
										<span class="font-mono text-[9px] text-slate-500">{formatCost(opt.cost)}</span>
									</button>
								</MilitaryTooltip>
							);
						}}
					</For>
				</div>
			</div>
		</div>
	);
};
