/**
 * Tests for SolidJS mobile components.
 *
 * Tests the reactive state logic of RadialMenu, SquadTabs, and type shapes
 * for CommandButtons. Imports only from pure-TS state modules (not JSX)
 * so tests work under the default Vitest config without Solid JSX transform.
 */

import { describe, expect, it } from "vitest";
import { type FormFactor, resolveFormFactor } from "./formFactor";
import {
	createRadialMenuState,
	DEFAULT_RADIAL_ACTIONS,
	type RadialAction,
} from "./radialMenuState";
import { createSquadTabsState, type SquadGroup } from "./squadTabsState";

// ---------------------------------------------------------------------------
// RadialMenu state
// ---------------------------------------------------------------------------

describe("solid/mobile/RadialMenu state", () => {
	it("initializes closed with position (0,0)", () => {
		const state = createRadialMenuState();
		expect(state.open()).toBe(false);
		expect(state.position()).toEqual({ x: 0, y: 0 });
	});

	it("openAt sets position and opens the menu", () => {
		const state = createRadialMenuState();
		state.openAt(150, 300);
		expect(state.open()).toBe(true);
		expect(state.position()).toEqual({ x: 150, y: 300 });
	});

	it("close hides the menu", () => {
		const state = createRadialMenuState();
		state.openAt(100, 200);
		expect(state.open()).toBe(true);
		state.close();
		expect(state.open()).toBe(false);
	});

	it("setPosition updates without changing open state", () => {
		const state = createRadialMenuState();
		state.setPosition({ x: 50, y: 75 });
		expect(state.position()).toEqual({ x: 50, y: 75 });
		expect(state.open()).toBe(false);
	});

	it("DEFAULT_RADIAL_ACTIONS has 6 actions", () => {
		expect(DEFAULT_RADIAL_ACTIONS).toHaveLength(6);
		const ids = DEFAULT_RADIAL_ACTIONS.map((a) => a.id);
		expect(ids).toContain("move");
		expect(ids).toContain("attack");
		expect(ids).toContain("patrol");
		expect(ids).toContain("stop");
		expect(ids).toContain("gather");
		expect(ids).toContain("build");
	});

	it("multiple openAt calls update position each time", () => {
		const state = createRadialMenuState();
		state.openAt(10, 20);
		expect(state.position()).toEqual({ x: 10, y: 20 });
		state.openAt(300, 400);
		expect(state.position()).toEqual({ x: 300, y: 400 });
		expect(state.open()).toBe(true);
	});

	it("RadialAction type shape is correct", () => {
		const action: RadialAction = { id: "test", label: "Test" };
		expect(action.id).toBe("test");
		expect(action.label).toBe("Test");
	});
});

// ---------------------------------------------------------------------------
// SquadTabs state
// ---------------------------------------------------------------------------

describe("solid/mobile/SquadTabs state", () => {
	it("initializes with 5 default groups", () => {
		const state = createSquadTabsState();
		expect(state.groups()).toHaveLength(5);
		expect(state.activeGroup()).toBeNull();
	});

	it("initializes with custom groups", () => {
		const groups: SquadGroup[] = [
			{ groupNumber: 1, unitCount: 3 },
			{ groupNumber: 2, unitCount: 5 },
		];
		const state = createSquadTabsState(groups);
		expect(state.groups()).toHaveLength(2);
		expect(state.groups()[0].unitCount).toBe(3);
		expect(state.groups()[1].unitCount).toBe(5);
	});

	it("setActiveGroup selects a group", () => {
		const state = createSquadTabsState();
		state.setActiveGroup(3);
		expect(state.activeGroup()).toBe(3);
	});

	it("setActiveGroup(null) deselects", () => {
		const state = createSquadTabsState();
		state.setActiveGroup(2);
		state.setActiveGroup(null);
		expect(state.activeGroup()).toBeNull();
	});

	it("setGroups replaces group list", () => {
		const state = createSquadTabsState();
		expect(state.groups()).toHaveLength(5);

		state.setGroups([
			{ groupNumber: 1, unitCount: 10 },
			{ groupNumber: 2, unitCount: 7 },
			{ groupNumber: 3, unitCount: 0 },
		]);
		expect(state.groups()).toHaveLength(3);
		expect(state.groups()[0].unitCount).toBe(10);
	});

	it("group numbers are sequential by default", () => {
		const state = createSquadTabsState();
		const numbers = state.groups().map((g) => g.groupNumber);
		expect(numbers).toEqual([1, 2, 3, 4, 5]);
	});

	it("default groups all start with 0 units", () => {
		const state = createSquadTabsState();
		for (const group of state.groups()) {
			expect(group.unitCount).toBe(0);
		}
	});

	it("switching active group multiple times retains last selection", () => {
		const state = createSquadTabsState();
		state.setActiveGroup(1);
		state.setActiveGroup(4);
		state.setActiveGroup(2);
		expect(state.activeGroup()).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// FormFactor detection
// ---------------------------------------------------------------------------

describe("solid/mobile/formFactor", () => {
	it("resolveFormFactor returns a valid FormFactor", () => {
		const result = resolveFormFactor();
		expect(["phone", "tablet", "desktop"]).toContain(result);
	});

	it("FormFactor type accepts all three values", () => {
		const values: FormFactor[] = ["phone", "tablet", "desktop"];
		expect(values).toHaveLength(3);
	});
});
