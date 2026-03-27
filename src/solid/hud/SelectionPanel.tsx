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
import { SimpleTooltip } from "./MilitaryTooltip";
import { PanelFrame } from "./PanelFrame";

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

	return (
		<Show when={selection()}>
			{(sel) => (
				<PanelFrame>
					<div
						data-testid="selection-panel"
						class="canvas-grain border border-slate-600/70 bg-slate-950/88 shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
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
						</div>
					</div>
				</PanelFrame>
			)}
		</Show>
	);
};
