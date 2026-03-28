/**
 * TacticalHUD — POC-faithful sidebar layout.
 *
 * Desktop: Left sidebar (w-64) with Minimap | Selection Info | Action Panel
 * Mobile: Bottom bar (h-48) with 3 columns
 *
 * Matches the original poc_final.html layout:
 *   body flex-col-reverse md:flex-row
 *   sidebar: w-full md:w-64 h-48 md:h-full
 *     - Minimap (w-1/3 md:w-full md:h-64)
 *     - Selection Info (w-1/3 md:w-full flex-1)
 *     - Action Panel (w-1/3 md:w-full md:h-64)
 */

import { type Component, createMemo, Show } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import { BuildMenu } from "./BuildMenu";
import { ErrorFeedback } from "./ErrorFeedback";
import { createErrorFeedback } from "./errorState";
import { SelectionPanel } from "./SelectionPanel";

export const TacticalHUD: Component<{
	bridge: SolidBridgeAccessors;
	emit: SolidBridgeEmit;
	missionId?: string;
}> = (props) => {
	const { errors } = createErrorFeedback();

	const selection = () => props.bridge.selection();
	const hasSelection = createMemo(() => {
		const sel = selection();
		return sel && sel.entityIds.length > 0;
	});

	return (
		<div
			data-testid="tactical-hud"
			class="ui-panel z-20 flex h-48 w-full flex-shrink-0 flex-row border-t-4 border-slate-600 shadow-2xl md:h-full md:w-64 md:flex-col md:border-r-4 md:border-t-0"
		>
			{/* ── Minimap ── */}
			<div class="flex w-1/3 items-center justify-center border-r-2 border-slate-700 bg-black p-1 md:h-64 md:w-full md:border-b-4 md:border-r-0 md:p-2">
				<div class="relative h-full w-full max-h-[200px] max-w-[200px] cursor-crosshair border-2 border-slate-600">
					{/* Minimap canvas — rendered by tacticalRuntime into this element */}
					<canvas
						data-testid="minimap-canvas"
						width="200"
						height="200"
						class="block h-full w-full"
						style={{ "image-rendering": "pixelated" }}
					/>
				</div>
			</div>

			{/* ── Selection Info ── */}
			<div class="flex w-1/3 flex-1 flex-col gap-1 overflow-y-auto border-r-2 border-slate-700 bg-slate-900 p-2 md:w-full md:gap-2 md:border-b-4 md:border-r-0 md:p-4">
				<Show
					when={hasSelection()}
					fallback={
						<h2 class="text-base font-bold leading-tight text-sky-300 md:text-xl">No Selection</h2>
					}
				>
					<SelectionPanel bridge={props.bridge} emit={props.emit} />
				</Show>
			</div>

			{/* ── Action Panel ── */}
			<div class="grid h-full w-1/3 content-start gap-1 overflow-y-auto bg-slate-800 p-1 sm:grid-cols-2 md:h-64 md:w-full md:gap-2 md:p-3">
				<BuildMenu bridge={props.bridge} emit={props.emit} />
			</div>

			{/* Error feedback (absolute, floats above sidebar) */}
			<div class="absolute right-2 top-2 z-30 md:left-2 md:right-auto md:top-auto md:bottom-2">
				<ErrorFeedback errors={errors} />
			</div>

			{/* POC-style panel CSS */}
			<style>{`
				.ui-panel {
					background-color: #1e293b;
					color: #e2e8f0;
					font-family: 'Courier New', Courier, monospace;
					text-shadow: 1px 1px 0 #000;
				}
			`}</style>
		</div>
	);
};
