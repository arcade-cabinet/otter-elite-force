import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

vi.mock("@/game/EventBus", () => ({
	EventBus: { emit: vi.fn() },
}));

import { SelectionManager } from "@/input/selectionManager";

describe("SelectionManager — shift-click additive selection (P0 fix)", () => {
	let world: ReturnType<typeof createWorld>;
	let manager: SelectionManager;

	beforeEach(() => {
		world = createWorld();
		manager = new SelectionManager(world);
	});

	afterEach(() => {
		manager.destroy();
		world.destroy();
	});

	it("shift-click adds a unit to existing selection without clearing", () => {
		const unit1 = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
		);
		const unit2 = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 10, y: 10 }),
		);

		// Select first unit normally
		manager.selectAt(2 * 32 + 16, 2 * 32 + 16);
		expect(unit1.has(Selected)).toBe(true);
		expect(unit2.has(Selected)).toBe(false);

		// Shift-click second unit
		manager.selectAt(10 * 32 + 16, 10 * 32 + 16, true);
		expect(unit1.has(Selected)).toBe(true);
		expect(unit2.has(Selected)).toBe(true);
	});

	it("shift-click toggles off an already-selected unit", () => {
		const unit = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 5, y: 5 }),
		);

		// Select unit
		manager.selectAt(5 * 32 + 16, 5 * 32 + 16);
		expect(unit.has(Selected)).toBe(true);

		// Shift-click same unit to deselect
		manager.selectAt(5 * 32 + 16, 5 * 32 + 16, true);
		expect(unit.has(Selected)).toBe(false);
	});

	it("shift+box-select adds to existing selection", () => {
		const unit1 = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
		);
		const unit2 = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 10, y: 10 }),
		);

		// Select first unit
		manager.selectAt(2 * 32 + 16, 2 * 32 + 16);
		expect(unit1.has(Selected)).toBe(true);

		// Shift+box-select over second unit area
		manager.selectBox(9 * 32, 9 * 32, 11 * 32, 11 * 32, true);

		// Both should be selected
		expect(unit1.has(Selected)).toBe(true);
		expect(unit2.has(Selected)).toBe(true);
	});
});
