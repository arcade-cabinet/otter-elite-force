/**
 * AlertBanner — Top-right alert notifications for gameplay events.
 *
 * Shows the last 3-4 tactical alerts, color-coded by severity:
 * info = cyan, warning = amber, critical = rose.
 * Auto-fades old alerts via CSS animation.
 *
 * Reads from solidBridge alerts store.
 */

import { For, Show, createMemo, type Component } from "solid-js";
import type { SolidBridgeAccessors, AlertViewModel } from "@/engine/bridge/solidBridge";

const MAX_VISIBLE = 4;

const SEVERITY_STYLES: Record<AlertViewModel["severity"], string> = {
	info: "border-cyan-500/50 bg-cyan-950/20 text-cyan-300",
	warning: "border-amber-500/50 bg-amber-950/20 text-amber-300",
	critical: "border-rose-500/50 bg-rose-950/20 text-rose-300",
};

const BADGE_STYLES: Record<AlertViewModel["severity"], string> = {
	info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
	warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
	critical: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

export const AlertBanner: Component<{ bridge: SolidBridgeAccessors }> = (props) => {
	const visibleAlerts = createMemo(() => {
		const all = props.bridge.alerts;
		return all.slice(-MAX_VISIBLE);
	});

	return (
		<div data-testid="alert-banner" class="flex w-full flex-col gap-2 sm:ml-auto sm:max-w-sm">
			<Show
				when={visibleAlerts().length > 0}
				fallback={
					<div class="border border-green-500/12 bg-slate-950/75 shadow-[0_16px_32px_rgba(0,0,0,0.28)]">
						<div class="flex items-center justify-between gap-2 p-3">
							<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">
								CLEAR
							</span>
							<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
								No active alerts
							</span>
						</div>
					</div>
				}
			>
				<For each={visibleAlerts()}>
					{(alert) => (
						<div
							class={`cursor-pointer font-mono text-xs uppercase tracking-wider shadow-[0_18px_36px_rgba(0,0,0,0.3)] transition-opacity hover:opacity-90 border ${SEVERITY_STYLES[alert.severity]}`}
						>
							<div class="flex items-center gap-2 p-3">
								<span
									class={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${BADGE_STYLES[alert.severity]}`}
								>
									{alert.severity}
								</span>
								<span>{alert.message}</span>
							</div>
						</div>
					)}
				</For>
			</Show>
		</div>
	);
};
