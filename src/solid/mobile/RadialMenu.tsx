/**
 * RadialMenu — Radial context menu for long-press on mobile (SolidJS).
 *
 * Appears on long-press of a unit or ground position. Shows available
 * actions as pie segments arranged in a semicircle above the press point.
 * Uses createSignal for open/close state and position tracking.
 *
 * US-060: Long-press triggers radial command menu.
 * US-061: Touch-friendly with 48px+ hit areas.
 */

import { type Component, For, Show } from "solid-js";
import type { RadialAction, RadialMenuState } from "./radialMenuState";

export type { RadialAction, RadialMenuState } from "./radialMenuState";
// Re-export state and types from the pure-TS module
export { createRadialMenuState, DEFAULT_RADIAL_ACTIONS } from "./radialMenuState";

const RADIAL_RADIUS = 80;

export const RadialMenu: Component<{
	actions?: RadialAction[];
	state: RadialMenuState;
	onAction: (actionId: string) => void;
}> = (props) => {
	const actions = () => props.actions ?? DEFAULT_RADIAL_ACTIONS;

	const handleAction = (actionId: string) => {
		props.onAction(actionId);
		props.state.close();
	};

	const handleBackdropClick = () => {
		props.state.close();
	};

	return (
		<Show when={props.state.open()}>
			{/* Full-screen dismiss backdrop */}
			<div
				data-testid="radial-menu"
				role="button"
				tabindex="0"
				class="fixed inset-0 z-50"
				onClick={handleBackdropClick}
				onKeyDown={(e) => {
					if (e.key === "Escape") handleBackdropClick();
				}}
			>
				{/* Radial action segments */}
				<div
					class="absolute"
					style={{
						left: `${props.state.position().x}px`,
						top: `${props.state.position().y}px`,
					}}
				>
					<For each={actions()}>
						{(action, index) => {
							const angle = () => {
								const count = actions().length;
								const step = Math.PI / Math.max(count - 1, 1);
								return Math.PI + index() * step;
							};
							const x = () => Math.cos(angle()) * RADIAL_RADIUS;
							const y = () => Math.sin(angle()) * RADIAL_RADIUS;

							return (
								<button
									type="button"
									data-testid={`radial-${action.id}`}
									onClick={(e) => {
										e.stopPropagation();
										handleAction(action.id);
									}}
									class="absolute flex min-h-[48px] min-w-[48px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-none border-2 border-slate-500/50 bg-slate-900/90 px-3 shadow-[0_4px_12px_rgba(0,0,0,0.4)] font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 active:border-green-500/60 active:bg-slate-800/90"
									style={{
										left: `${x()}px`,
										top: `${y()}px`,
									}}
								>
									{action.label}
								</button>
							);
						}}
					</For>
				</div>
			</div>
		</Show>
	);
};
