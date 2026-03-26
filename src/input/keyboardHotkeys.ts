/**
 * Keyboard hotkeys — native KeyboardEvent handler for RTS commands.
 *
 * Hotkeys:
 *   H — Halt all selected units (Stop order)
 *   A + click — Attack-move to location
 *   P + click — Patrol between current position and target
 *   Ctrl+1..9 — Assign selected units to control group
 *   1..9 — Select control group
 *   Escape — Deselect all / cancel current action
 *   Space — Center camera on last alert
 *   Keyboard shortcuts may accelerate commands, but core camera movement is pointer-first
 */

import type { World } from "koota";
import { Faction, Selected } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";

export type PendingAction = "attack-move" | "patrol" | null;

export interface HotkeyState {
	pendingAction: PendingAction;
	controlGroups: Map<number, number[]>;
	lastAlertPosition: { x: number; y: number } | null;
}

export function createHotkeyState(): HotkeyState {
	return {
		pendingAction: null,
		controlGroups: new Map(),
		lastAlertPosition: null,
	};
}

/**
 * Process a keydown event and return the updated hotkey state.
 * Returns null if the key was not handled.
 */
export function handleKeyDown(
	e: KeyboardEvent,
	state: HotkeyState,
	world: World,
): HotkeyState | null {
	const key = e.key.toLowerCase();

	// H — Halt/Stop
	if (key === "h") {
		issueStopToSelected(world);
		return { ...state, pendingAction: null };
	}

	// A — Attack-move pending
	if (key === "a" && !e.ctrlKey && !e.metaKey) {
		return { ...state, pendingAction: "attack-move" };
	}

	// P — Patrol pending
	if (key === "p" && !e.ctrlKey && !e.metaKey) {
		return { ...state, pendingAction: "patrol" };
	}

	// Escape — Cancel pending action or deselect all
	if (key === "escape") {
		if (state.pendingAction) {
			return { ...state, pendingAction: null };
		}
		deselectAll(world);
		return state;
	}

	// Ctrl+1..9 — Assign control group
	if (e.ctrlKey && key >= "1" && key <= "9") {
		e.preventDefault();
		const group = Number.parseInt(key, 10);
		const ids = getSelectedFriendlyUnitIds(world);
		const newGroups = new Map(state.controlGroups);
		newGroups.set(group, ids);
		return { ...state, controlGroups: newGroups };
	}

	// 1..9 — Recall control group
	if (!e.ctrlKey && !e.metaKey && key >= "1" && key <= "9") {
		const group = Number.parseInt(key, 10);
		const ids = state.controlGroups.get(group);
		if (ids && ids.length > 0) {
			recallControlGroup(world, ids);
		}
		return state;
	}

	return null; // Key not handled
}

// ─── Helpers ───

function issueStopToSelected(world: World): void {
	for (const entity of world.query(Selected, OrderQueue, Faction)) {
		if (entity.get(Faction)?.id !== "ura") continue;
		const queue = entity.get(OrderQueue);
		if (queue) {
			queue.length = 0;
			queue.push({ type: "stop" });
		}
	}
}

function deselectAll(world: World): void {
	for (const entity of world.query(Selected)) {
		entity.remove(Selected);
	}
}

function getSelectedFriendlyUnitIds(world: World): number[] {
	const ids: number[] = [];
	for (const entity of world.query(Selected, Faction, Position)) {
		if (entity.get(Faction)?.id === "ura") {
			ids.push(entity.id());
		}
	}
	return ids;
}

function recallControlGroup(world: World, ids: number[]): void {
	// Deselect all first
	deselectAll(world);

	// Select entities in the group (if still alive)
	for (const entity of world.query(Faction, Position)) {
		if (ids.includes(entity.id()) && entity.get(Faction)?.id === "ura") {
			entity.add(Selected);
		}
	}
}
