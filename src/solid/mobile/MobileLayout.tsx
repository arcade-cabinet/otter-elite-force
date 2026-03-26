/**
 * MobileLayout — Adaptive layout wrapper for phone / tablet / desktop (SolidJS).
 *
 * Detects form factor via matchMedia breakpoints and arranges HUD children
 * differently for each:
 *   - phone:   stacked bottom bar, large touch targets, minimal info
 *   - tablet:  bottom bar with more info visible, mid-size controls
 *   - desktop: full side panels, standard controls
 *
 * Uses createSignal to track the current breakpoint reactively.
 */

import { type Component, createSignal, type JSX, onCleanup, onMount, Show } from "solid-js";
import { DESKTOP_QUERY, resolveFormFactor, TABLET_QUERY } from "./formFactor";

// Re-export type from the pure-TS module
export type { FormFactor } from "./formFactor";

export interface MobileLayoutProps {
	/** Content rendered for phone form factor */
	phone?: JSX.Element;
	/** Content rendered for tablet form factor */
	tablet?: JSX.Element;
	/** Content rendered for desktop form factor */
	desktop?: JSX.Element;
	/** Fallback content rendered if no form-factor-specific slot is provided */
	children?: JSX.Element;
}

/**
 * Create a reactive signal tracking the current form factor.
 * Updates when the viewport crosses a breakpoint boundary.
 */
export function createFormFactorSignal(): () => FormFactor {
	const [formFactor, setFormFactor] = createSignal<FormFactor>(resolveFormFactor());

	onMount(() => {
		const tabletMq = window.matchMedia(TABLET_QUERY);
		const desktopMq = window.matchMedia(DESKTOP_QUERY);

		const update = () => setFormFactor(resolveFormFactor());

		tabletMq.addEventListener("change", update);
		desktopMq.addEventListener("change", update);

		onCleanup(() => {
			tabletMq.removeEventListener("change", update);
			desktopMq.removeEventListener("change", update);
		});
	});

	return formFactor;
}

export const MobileLayout: Component<MobileLayoutProps> = (props) => {
	const formFactor = createFormFactorSignal();

	return (
		<div data-testid="mobile-layout" data-form-factor={formFactor()} class="relative h-full w-full">
			<Show when={formFactor() === "phone"}>
				<div data-testid="layout-phone" class="flex h-full w-full flex-col">
					{/* Main game area fills available space */}
					<div class="flex-1 overflow-hidden">{props.phone ?? props.children}</div>
				</div>
			</Show>

			<Show when={formFactor() === "tablet"}>
				<div data-testid="layout-tablet" class="flex h-full w-full flex-col">
					{/* Tablet: game area with modest info bar */}
					<div class="flex-1 overflow-hidden">{props.tablet ?? props.children}</div>
				</div>
			</Show>

			<Show when={formFactor() === "desktop"}>
				<div data-testid="layout-desktop" class="relative h-full w-full">
					{/* Desktop: full panels layout */}
					{props.desktop ?? props.children}
				</div>
			</Show>
		</div>
	);
};
