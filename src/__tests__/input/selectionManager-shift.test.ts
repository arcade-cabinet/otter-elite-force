import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

vi.mock("phaser", () => ({
	default: {
		Math: {
			Vector2: class {
				x = 0;
				y = 0;
				set(x: number, y: number) {
					this.x = x;
					this.y = y;
				}
			},
		},
	},
	Math: {
		Vector2: class {
			x = 0;
			y = 0;
			set(x: number, y: number) {
				this.x = x;
				this.y = y;
			}
		},
	},
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

describe("SelectionManager — shift-click additive selection (P0 fix)", () => {
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

	function simulatePointerUp(worldX: number, worldY: number, shiftKey: boolean) {
		const pointerUpCb = scene.input.on.mock.calls.find((c: unknown[]) => c[0] === "pointerup");
		const pointerDownCb = scene.input.on.mock.calls.find((c: unknown[]) => c[0] === "pointerdown");
		// Simulate pointerdown first (to set dragStart)
		pointerDownCb![1].call(pointerDownCb![2], {
			worldX,
			worldY,
			rightButtonDown: () => false,
			isDown: true,
		});
		// Simulate pointerup (no drag — click)
		pointerUpCb![1].call(pointerUpCb![2], {
			worldX,
			worldY,
			rightButtonReleased: () => false,
			event: { shiftKey },
		});
	}

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
		simulatePointerUp(2 * 32 + 16, 2 * 32 + 16, false);
		expect(unit1.has(Selected)).toBe(true);
		expect(unit2.has(Selected)).toBe(false);

		// Shift-click second unit
		simulatePointerUp(10 * 32 + 16, 10 * 32 + 16, true);
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
		simulatePointerUp(5 * 32 + 16, 5 * 32 + 16, false);
		expect(unit.has(Selected)).toBe(true);

		// Shift-click same unit to deselect
		simulatePointerUp(5 * 32 + 16, 5 * 32 + 16, true);
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

		// Simulate shift+box-select over second unit area
		const pointerDownCb = scene.input.on.mock.calls.find((c: unknown[]) => c[0] === "pointerdown");
		const pointerMoveCb = scene.input.on.mock.calls.find((c: unknown[]) => c[0] === "pointermove");
		const pointerUpCb = scene.input.on.mock.calls.find((c: unknown[]) => c[0] === "pointerup");

		// Start drag
		pointerDownCb![1].call(pointerDownCb![2], {
			worldX: 9 * 32,
			worldY: 9 * 32,
			rightButtonDown: () => false,
			isDown: true,
		});

		// Move beyond threshold to trigger drag
		pointerMoveCb![1].call(pointerMoveCb![2], {
			worldX: 11 * 32,
			worldY: 11 * 32,
			rightButtonDown: () => false,
			isDown: true,
		});

		// Release with shift
		pointerUpCb![1].call(pointerUpCb![2], {
			worldX: 11 * 32,
			worldY: 11 * 32,
			rightButtonReleased: () => false,
			event: { shiftKey: true },
		});

		// Both should be selected
		expect(unit1.has(Selected)).toBe(true);
		expect(unit2.has(Selected)).toBe(true);
	});
});
