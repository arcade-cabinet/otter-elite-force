/**
 * TacticalHUD — Composes all HUD components into a single overlay layout.
 *
 * Positions components absolutely over the tactical canvas:
 * - ResourceBar at top
 * - SelectionPanel + BuildMenu at bottom-left
 * - AlertBanner at top-right
 * - ObjectivesPanel at right
 * - BossHealthBar at top-center (when boss present)
 * - CommandTransmission at bottom-center (when dialogue active)
 * - ErrorFeedback at top-right (below alerts)
 */

import type { Component } from "solid-js";
import type { SolidBridgeAccessors, SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import { ResourceBar } from "./ResourceBar";
import { SelectionPanel } from "./SelectionPanel";
import { BuildMenu } from "./BuildMenu";
import { AlertBanner } from "./AlertBanner";
import { ObjectivesPanel } from "./ObjectivesPanel";
import { BossHealthBar } from "./BossHealthBar";
import { CommandTransmission } from "./CommandTransmission";
import { ErrorFeedback } from "./ErrorFeedback";
import { createErrorFeedback } from "./errorState";

export const TacticalHUD: Component<{
	bridge: SolidBridgeAccessors;
	emit: SolidBridgeEmit;
}> = (props) => {
	const { errors, pushError: _pushError } = createErrorFeedback();

	return (
		<div
			data-testid="tactical-hud"
			class="pointer-events-none absolute inset-0 z-20 overflow-hidden"
		>
			{/* Top bar — ResourceBar */}
			<div class="pointer-events-auto absolute inset-x-0 top-0 z-10 px-2 pt-2 sm:px-4 sm:pt-3">
				<ResourceBar bridge={props.bridge} />
			</div>

			{/* Top-center — BossHealthBar (when boss present) */}
			<div class="absolute left-1/2 top-14 z-30 flex -translate-x-1/2 justify-center md:top-16">
				<BossHealthBar bridge={props.bridge} />
			</div>

			{/* Top-right — AlertBanner */}
			<div class="pointer-events-auto absolute right-2 top-16 z-10 w-80 sm:right-4 sm:top-20">
				<AlertBanner bridge={props.bridge} />
			</div>

			{/* Right — ObjectivesPanel (below alerts) */}
			<div class="pointer-events-auto absolute right-2 top-52 z-10 w-64 sm:right-4 sm:top-56 sm:w-72">
				<ObjectivesPanel bridge={props.bridge} />
			</div>

			{/* Top-right — ErrorFeedback (below alerts) */}
			<div class="absolute right-2 top-36 z-30 sm:right-4">
				<ErrorFeedback errors={errors} />
			</div>

			{/* Bottom-left — SelectionPanel + BuildMenu */}
			<div class="pointer-events-auto absolute bottom-2 left-2 z-10 flex flex-col gap-2 sm:bottom-4 sm:left-4">
				<SelectionPanel bridge={props.bridge} emit={props.emit} />
				<BuildMenu bridge={props.bridge} emit={props.emit} />
			</div>

			{/* Bottom-center — CommandTransmission (when dialogue active) */}
			<div class="pointer-events-auto absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
				<CommandTransmission bridge={props.bridge} />
			</div>
		</div>
	);
};
