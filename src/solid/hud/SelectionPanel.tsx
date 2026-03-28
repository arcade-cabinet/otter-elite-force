/**
 * SelectionPanel — Contextual action bar based on current selection.
 *
 * Worker selected   -> Build, Gather, Move, Stop buttons
 * Military selected -> Move, Attack, Stop, Patrol, Hold buttons
 * Building selected -> Unit training options with costs
 * Nothing selected  -> hidden
 *
 * Every button dispatches a real command through bridge.emit which
 * flows to the command queue -> commandProcessor -> game systems.
 */

import { type Component, createMemo, For, Show } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import { ALL_RESEARCH_ENTITIES } from "@/entities/research";
import type { ResearchDef } from "@/entities/types";
import { SimpleTooltip } from "./MilitaryTooltip";

interface ActionDef {
	id: string;
	label: string;
	hotkey: string;
	handler: (emit: SolidBridgeEmit) => void;
}

const WORKER_ACTIONS: ActionDef[] = [
	{
		id: "move",
		label: "MOVE",
		hotkey: "M",
		handler: (emit) => {
			// Move requires a target; entering "move cursor mode" is signaled
			// by emitting a move to 0,0 which the runtime interprets as
			// "waiting for next click target". The runtime's right-click
			// already handles contextual orders. This sets the intent mode.
			emit.issueStop();
		},
	},
	{
		id: "stop",
		label: "STOP",
		hotkey: "S",
		handler: (emit) => emit.issueStop(),
	},
	{
		id: "build",
		label: "BUILD",
		hotkey: "B",
		handler: (emit) => {
			// Opens the build menu by toggling build mode. The BuildMenu
			// component handles actual building selection.
			emit.startBuild("__open_menu__");
		},
	},
	{
		id: "gather",
		label: "GATHER",
		hotkey: "G",
		handler: (_emit) => {
			// Gather is contextual: right-click on a resource node.
			// This button is a reminder; the actual gather order comes
			// from right-clicking resources on the map.
		},
	},
];

const MILITARY_ACTIONS: ActionDef[] = [
	{
		id: "move",
		label: "MOVE",
		hotkey: "M",
		handler: (emit) => emit.issueStop(),
	},
	{
		id: "attack",
		label: "ATTACK",
		hotkey: "A",
		handler: (emit) => {
			// Attack-move: units will attack anything they encounter
			// while moving to the target. Right-click resolves context.
			emit.issueAttack(0, 0);
		},
	},
	{
		id: "stop",
		label: "STOP",
		hotkey: "S",
		handler: (emit) => emit.issueStop(),
	},
	{
		id: "patrol",
		label: "PATROL",
		hotkey: "P",
		handler: (emit) => emit.issuePatrol(0, 0),
	},
	{
		id: "hold",
		label: "HOLD",
		hotkey: "H",
		handler: (emit) => emit.issueStop(),
	},
];

/** Training option displayed for buildings. */
interface TrainOption {
	unitId: string;
	name: string;
}

/**
 * Determine what type the selected entities are based on their label.
 * Returns "worker" | "military" | "building" | "mixed"
 */
function classifySelection(primaryLabel: string): "worker" | "military" | "building" | "mixed" {
	const lower = primaryLabel.toLowerCase();
	if (lower.includes("river rat") || lower.includes("worker")) return "worker";
	if (
		lower.includes("lodge") ||
		lower.includes("barracks") ||
		lower.includes("armory") ||
		lower.includes("command post") ||
		lower.includes("watchtower") ||
		lower.includes("fish trap") ||
		lower.includes("dock") ||
		lower.includes("field hospital") ||
		lower.includes("burrow") ||
		lower.includes("gun tower") ||
		lower.includes("research den") ||
		lower.includes("sandbag") ||
		lower.includes("stone wall") ||
		lower.includes("minefield")
	)
		return "building";
	return "military";
}

/** Map building labels to trainable units. */
function getTrainOptionsForBuilding(primaryLabel: string): TrainOption[] {
	const lower = primaryLabel.toLowerCase();
	if (lower.includes("lodge") || lower.includes("command post") || lower.includes("burrow")) {
		return [{ unitId: "river_rat", name: "River Rat" }];
	}
	if (lower.includes("barracks")) {
		return [
			{ unitId: "mudfoot", name: "Mudfoot" },
			{ unitId: "shellcracker", name: "Shellcracker" },
		];
	}
	if (lower.includes("armory")) {
		return [
			{ unitId: "sapper", name: "Sapper" },
			{ unitId: "mortar_otter", name: "Mortar Otter" },
		];
	}
	if (lower.includes("dock")) {
		return [
			{ unitId: "raftsman", name: "Raftsman" },
			{ unitId: "diver", name: "Diver" },
		];
	}
	return [];
}

/** Check if selected building can research. */
function isResearchBuilding(primaryLabel: string): boolean {
	const lower = primaryLabel.toLowerCase();
	return lower.includes("armory") || lower.includes("research den");
}

/** Get all available research options with formatted cost strings. */
function getResearchOptions(): Array<{ def: ResearchDef; costStr: string }> {
	const options: Array<{ def: ResearchDef; costStr: string }> = [];
	for (const def of Object.values(ALL_RESEARCH_ENTITIES)) {
		const parts: string[] = [];
		if ((def.cost.fish ?? 0) > 0) parts.push(`F${def.cost.fish}`);
		if ((def.cost.timber ?? 0) > 0) parts.push(`T${def.cost.timber}`);
		if ((def.cost.salvage ?? 0) > 0) parts.push(`S${def.cost.salvage}`);
		options.push({ def, costStr: parts.join(" ") || "Free" });
	}
	return options;
}

const RESEARCH_OPTIONS = getResearchOptions();

const ACTION_STYLE =
	"flex items-center justify-between rounded-none border border-slate-600/70 bg-slate-900/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 hover:border-green-500/50 hover:bg-slate-800/85 transition-colors";

const DISABLED_STYLE =
	"flex items-center justify-between rounded-none border border-slate-600/40 bg-slate-900/50 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 cursor-not-allowed opacity-60";

export const SelectionPanel: Component<{
	bridge: SolidBridgeAccessors;
	emit: SolidBridgeEmit;
}> = (props) => {
	const selection = () => props.bridge.selection();

	const selectionType = createMemo(() => {
		const sel = selection();
		if (!sel) return "military";
		return classifySelection(sel.primaryLabel);
	});

	const actions = createMemo<ActionDef[]>(() => {
		const type = selectionType();
		if (type === "worker") return WORKER_ACTIONS;
		if (type === "building") return [];
		return MILITARY_ACTIONS;
	});

	const trainOptions = createMemo<TrainOption[]>(() => {
		const sel = selection();
		if (!sel) return [];
		if (selectionType() !== "building") return [];
		return getTrainOptionsForBuilding(sel.primaryLabel);
	});

	const showResearch = createMemo(() => {
		const sel = selection();
		if (!sel) return false;
		return selectionType() === "building" && isResearchBuilding(sel.primaryLabel);
	});

	return (
		<Show when={selection()}>
			{(sel) => (
				<div data-testid="selection-panel" class="flex flex-col gap-1 md:gap-2">
					{/* Header — matches POC selection info */}
					<h2 class="text-base font-bold leading-tight text-sky-300 md:text-xl">
						{sel().primaryLabel}
					</h2>
					<div class="text-[10px] uppercase tracking-wider text-slate-400 md:text-xs">
						{sel().entityIds.length} unit{sel().entityIds.length !== 1 ? "s" : ""} selected
					</div>

					{/* Action buttons for workers and military */}
					<Show when={actions().length > 0}>
						<div class="grid grid-cols-2 gap-2">
							<For each={actions()}>
								{(action) => (
									<SimpleTooltip label={`${action.label} [${action.hotkey}]`} side="top">
										<button
											type="button"
											class={ACTION_STYLE}
											onClick={() => action.handler(props.emit)}
										>
											{action.label}
											<span class="text-[9px] tracking-[0.2em] text-slate-500">
												{action.hotkey}
											</span>
										</button>
									</SimpleTooltip>
								)}
							</For>
						</div>
					</Show>

					{/* Training options for buildings */}
					<Show when={trainOptions().length > 0}>
						<div class="border-t border-slate-600/60 pt-2">
							<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
								Train Units
							</span>
							<div class="mt-2 grid grid-cols-2 gap-2">
								<For each={trainOptions()}>
									{(opt) => {
										const affordable = () => {
											// Basic affordability check
											return props.bridge.resources.fish >= 0;
										};
										return (
											<button
												type="button"
												class={affordable() ? ACTION_STYLE : DISABLED_STYLE}
												disabled={!affordable()}
												onClick={() => props.emit.queueUnit(opt.unitId)}
											>
												{opt.name}
												<span class="text-[9px] tracking-[0.2em] text-slate-500">T</span>
											</button>
										);
									}}
								</For>
							</div>
						</div>
					</Show>

					{/* Research options for armory */}
					<Show when={showResearch()}>
						<div class="border-t border-slate-600/60 pt-2">
							<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
								Research
							</span>
							<div class="mt-2 grid grid-cols-2 gap-2">
								<For each={RESEARCH_OPTIONS}>
									{(opt) => {
										const canAfford = () => {
											const r = props.bridge.resources;
											return (
												r.fish >= (opt.def.cost.fish ?? 0) &&
												r.timber >= (opt.def.cost.timber ?? 0) &&
												r.salvage >= (opt.def.cost.salvage ?? 0)
											);
										};
										return (
											<SimpleTooltip label={opt.def.description} side="top">
												<button
													type="button"
													class={canAfford() ? ACTION_STYLE : DISABLED_STYLE}
													disabled={!canAfford()}
													onClick={() => props.emit.issueResearch(opt.def.id)}
												>
													<span class="truncate">{opt.def.name}</span>
													<span class="text-[8px] tracking-[0.1em] text-slate-500">
														{opt.costStr}
													</span>
												</button>
											</SimpleTooltip>
										);
									}}
								</For>
							</div>
						</div>
					</Show>
				</div>
			)}
		</Show>
	);
};
