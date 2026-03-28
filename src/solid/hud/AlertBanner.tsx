/**
 * AlertBanner — Top-right alert notifications for gameplay events.
 *
 * Shows the last 3 tactical alerts, color-coded by severity:
 * info = cyan, warning = amber, critical = rose.
 * Clicking an alert with a world position emits focusCamera to snap the camera.
 * Alerts auto-dismiss after 3 seconds via setTimeout in onMount.
 * Slide-in animation via CSS transition.
 *
 * Reads from solidBridge alerts store + emits camera-focus commands.
 */

import { type Component, createMemo, For, onCleanup, onMount, Show } from "solid-js";
import type {
	AlertViewModel,
	SolidBridgeAccessors,
	SolidBridgeEmit,
} from "@/engine/bridge/solidBridge";

const MAX_VISIBLE = 3;
const ALERT_DISMISS_MS = 3000;

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

export const AlertBanner: Component<{ bridge: SolidBridgeAccessors; emit?: SolidBridgeEmit }> = (
	props,
) => {
	const visibleAlerts = createMemo(() => {
		const all = props.bridge.alerts;
		return all.slice(-MAX_VISIBLE);
	});

	// Auto-dismiss: set timers for each alert to dismiss after ALERT_DISMISS_MS
	const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

	onMount(() => {
		// Watch for new alerts and set dismiss timers
		const checkInterval = window.setInterval(() => {
			const alerts = props.bridge.alerts;
			for (const alert of alerts) {
				if (!dismissTimers.has(alert.id)) {
					const timer = setTimeout(() => {
						props.emit?.dismissAlert(alert.id);
						dismissTimers.delete(alert.id);
					}, ALERT_DISMISS_MS);
					dismissTimers.set(alert.id, timer);
				}
			}
		}, 200);

		onCleanup(() => {
			window.clearInterval(checkInterval);
			for (const timer of dismissTimers.values()) {
				clearTimeout(timer);
			}
			dismissTimers.clear();
		});
	});

	function handleAlertClick(alert: AlertViewModel): void {
		if (alert.worldX !== undefined && alert.worldY !== undefined && props.emit) {
			props.emit.focusCamera(alert.worldX, alert.worldY);
		}
		props.emit?.dismissAlert(alert.id);
	}

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
						<button
							type="button"
							class={`w-full cursor-pointer text-left font-mono text-xs uppercase tracking-wider shadow-[0_18px_36px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out animate-slide-in-right hover:opacity-90 border ${SEVERITY_STYLES[alert.severity]}`}
							onClick={() => handleAlertClick(alert)}
							title={
								alert.worldX !== undefined && alert.worldY !== undefined
									? "Click to focus camera"
									: undefined
							}
						>
							<div class="flex items-center gap-2 p-3">
								<span
									class={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${BADGE_STYLES[alert.severity]}`}
								>
									{alert.severity}
								</span>
								<span class="flex-1">{alert.message}</span>
								<Show when={alert.worldX !== undefined && alert.worldY !== undefined}>
									<span class="text-[10px] opacity-60">[locate]</span>
								</Show>
							</div>
						</button>
					)}
				</For>
			</Show>
		</div>
	);
};
