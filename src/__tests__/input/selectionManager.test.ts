import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

// Mock Phaser to prevent Canvas initialization errors in happy-dom
vi.mock("phaser", () => ({
	default: {
		Math: { Vector2: class { x = 0; y = 0; set(x: number, y: number) { this.x = x; this.y = y; } } },
	},
	Math: { Vector2: class { x = 0; y = 0; set(x: number, y: number) { this.x = x; this.y = y; } } },
}));

import { SelectionManager } from "@/input/selectionManager";

function createMockGraphics() {
	return {
		clear: vi.fn().mockReturnThis(),
		lineStyle: vi.fn().mockReturnThis(),
		fillStyle: vi.fn().mockReturnThis(),
		fillRect: vi.fn().mockReturnThis(),
		strokeRect: vi.fn().mockReturnThis(),
		setDepth: vi.fn().mockReturnThis(),
		destroy: vi.fn(),
	};
}

function createMockScene() {
	return {
		input: { on: vi.fn(), off: vi.fn() },
		add: { graphics: vi.fn(() => createMockGraphics()) },
	};
}

describe("SelectionManager", () => {
	let world: ReturnType<typeof createWorld>;
	let scene: ReturnType<typeof createMockScene>;
	let manager: SelectionManager;

	beforeEach(() => {
		world = createWorld();
		scene = createMockScene();
		manager = new SelectionManager(scene as never, world);
	});

	afterEach(() => {
		manager.destroy();
		world.destroy();
	});

	it("creates a Graphics object at depth 1000 for the selection rectangle", () => {
		expect(scene.add.graphics).toHaveBeenCalled();
		const gfx = scene.add.graphics.mock.results[0]?.value;
		expect(gfx.setDepth).toHaveBeenCalledWith(1000);
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

	it("renders selection rect with green border and 20% fill when drawing", () => {
		const gfx = scene.add.graphics.mock.results[0]?.value;
		// Simulate pointer events by calling the registered callbacks
		// onPointerDown was registered; find it
		const pointerDownCb = scene.input.on.mock.calls.find(
			(c: unknown[]) => c[0] === "pointerdown",
		);
		const pointerMoveCb = scene.input.on.mock.calls.find(
			(c: unknown[]) => c[0] === "pointermove",
		);
		const pointerUpCb = scene.input.on.mock.calls.find(
			(c: unknown[]) => c[0] === "pointerup",
		);
		expect(pointerDownCb).toBeTruthy();
		expect(pointerMoveCb).toBeTruthy();
		expect(pointerUpCb).toBeTruthy();

		// Simulate left-click down
		const mockPointerDown = { worldX: 32, worldY: 32, rightButtonDown: () => false, isDown: true };
		pointerDownCb![1].call(pointerDownCb![2], mockPointerDown);

		// Simulate drag (move beyond threshold)
		const mockPointerMove = {
			worldX: 200, worldY: 200,
			rightButtonDown: () => false, isDown: true,
		};
		pointerMoveCb![1].call(pointerMoveCb![2], mockPointerMove);

		// The rect should have been drawn with green border and 20% fill
		expect(gfx.lineStyle).toHaveBeenCalledWith(2, 0x00ff00, 0.9);
		expect(gfx.fillStyle).toHaveBeenCalledWith(0x00ff00, 0.2);

		// Simulate pointer up — rect should clear
		const mockPointerUp = {
			worldX: 200, worldY: 200,
			rightButtonReleased: () => false,
		};
		pointerUpCb![1].call(pointerUpCb![2], mockPointerUp);
		expect(gfx.clear).toHaveBeenCalled();
	});
});
