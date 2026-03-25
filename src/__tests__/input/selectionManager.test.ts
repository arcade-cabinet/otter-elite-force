import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

vi.mock("@/game/EventBus", () => ({
	EventBus: { emit: vi.fn() },
}));

import { SelectionManager } from "@/input/selectionManager";

describe("SelectionManager", () => {
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

	it("selects a single friendly unit on click via selectAt", () => {
		const unit = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 5, y: 5 }),
		);

		manager.selectAt(5 * 32 + 16, 5 * 32 + 16);

		expect(unit.has(Selected)).toBe(true);
	});

	it("clears previous selection when clicking a new unit", () => {
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

		manager.selectAt(2 * 32 + 16, 2 * 32 + 16);
		expect(unit1.has(Selected)).toBe(true);

		manager.selectAt(10 * 32 + 16, 10 * 32 + 16);
		expect(unit1.has(Selected)).toBe(false);
		expect(unit2.has(Selected)).toBe(true);
	});

	it("box-selects all friendly units within the rectangle", () => {
		const unit1 = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 3, y: 3 }),
		);
		const unit2 = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 5, y: 5 }),
		);
		const outsideUnit = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 20, y: 20 }),
		);

		manager.selectBox(2 * 32, 2 * 32, 6 * 32, 6 * 32);

		expect(unit1.has(Selected)).toBe(true);
		expect(unit2.has(Selected)).toBe(true);
		expect(outsideUnit.has(Selected)).toBe(false);
	});

	it("does not box-select enemy units", () => {
		const enemy = world.spawn(
			UnitType({ type: "gator" }),
			Faction({ id: "scale_guard" }),
			Position({ x: 3, y: 3 }),
		);

		manager.selectBox(2 * 32, 2 * 32, 6 * 32, 6 * 32);
		expect(enemy.has(Selected)).toBe(false);
	});

	it("does not box-select buildings", () => {
		const building = world.spawn(
			UnitType({ type: "barracks" }),
			Faction({ id: "ura" }),
			IsBuilding,
			Position({ x: 3, y: 3 }),
		);

		manager.selectBox(2 * 32, 2 * 32, 6 * 32, 6 * 32);
		expect(building.has(Selected)).toBe(false);
	});

	it("clears selection when clearSelection is called", () => {
		const unit = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 5, y: 5 }),
		);
		unit.add(Selected);

		manager.clearSelection();
		expect(unit.has(Selected)).toBe(false);
	});

	it("does nothing when disabled", () => {
		const unit = world.spawn(
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 5, y: 5 }),
		);

		manager.setEnabled(false);
		manager.selectAt(5 * 32 + 16, 5 * 32 + 16);
		expect(unit.has(Selected)).toBe(false);
	});

});
