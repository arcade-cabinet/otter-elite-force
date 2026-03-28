/**
 * RadialMenu state — reactive state for the radial context menu.
 *
 * Separated from JSX so pure-TS tests can import without
 * needing the Solid JSX transform.
 */

import { createSignal } from "solid-js";

export interface RadialAction {
	id: string;
	label: string;
}

export const DEFAULT_RADIAL_ACTIONS: RadialAction[] = [
	{ id: "move", label: "Move" },
	{ id: "attack", label: "Attack" },
	{ id: "patrol", label: "Patrol" },
	{ id: "stop", label: "Stop" },
	{ id: "gather", label: "Gather" },
	{ id: "build", label: "Build" },
];

export interface RadialMenuState {
	open: () => boolean;
	position: () => { x: number; y: number };
	setOpen: (open: boolean) => void;
	setPosition: (pos: { x: number; y: number }) => void;
	openAt: (x: number, y: number) => void;
	close: () => void;
}

/**
 * Create reactive state for the radial menu.
 * Can be shared across components that need to open/close the menu.
 */
export function createRadialMenuState(): RadialMenuState {
	const [open, setOpen] = createSignal(false);
	const [position, setPosition] = createSignal({ x: 0, y: 0 });

	return {
		open,
		position,
		setOpen,
		setPosition,
		openAt(x: number, y: number) {
			setPosition({ x, y });
			setOpen(true);
		},
		close() {
			setOpen(false);
		},
	};
}
