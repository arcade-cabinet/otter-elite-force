import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Faction, Selected, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";

const { emit, on, off } = vi.hoisted(() => ({
	emit: vi.fn(),
	on: vi.fn(),
	off: vi.fn(),
}));

vi.mock("@/game/EventBus", () => ({
	EventBus: { emit, on, off },
}));

// Mock Phaser
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

import { KeyboardHotkeys } from "@/input/keyboardHotkeys";

function createMockGraphics() {
	return {
		clear: vi.fn().mockReturnThis(),
		lineStyle: vi.fn().mockReturnThis(),
		fillStyle: vi.fn().mockReturnThis(),
		fillRect: vi.fn().mockReturnThis(),
		strokeRect: vi.fn().mockReturnThis(),
		strokeCircle: vi.fn().mockReturnThis(),
		setDepth: vi.fn().mockReturnThis(),
		destroy: vi.fn(),
	};
}

function createMockSelectionManager() {
	return {
		clearSelection: vi.fn(),
		setEnabled: vi.fn(),
	};
}

function createMockCommandDispatcher() {
	return {
		issueCommandAt: vi.fn(),
		setEnabled: vi.fn(),
	};
}

function createMockScene() {
	const keyCallbacks = new Map<string, Array<(event?: unknown) => void>>();
	return {
		input: {
			on: vi.fn(),
			off: vi.fn(),
			keyboard: {
				on: vi.fn((event: string, callback: (event?: unknown) => void) => {
					if (!keyCallbacks.has(event)) keyCallbacks.set(event, []);
					keyCallbacks.get(event)!.push(callback);
				}),
				addKey: vi.fn(),
			},
		},
		add: { graphics: vi.fn(() => createMockGraphics()) },
		cameras: {
			main: {
				centerOn: vi.fn(),
				scrollX: 0,
				scrollY: 0,
			},
		},
		tweens: {
			add: vi.fn((config: { onComplete?: () => void }) => {
				config.onComplete?.();
				return config;
			}),
		},
		_keyCallbacks: keyCallbacks,
	};
}

function fireKey(scene: ReturnType<typeof createMockScene>, key: string, event?: unknown) {
	const callbacks = scene._keyCallbacks.get(`keydown-${key}`);
	if (callbacks) {
		for (const cb of callbacks) cb(event);
	}
}

describe("KeyboardHotkeys", () => {
	let world: ReturnType<typeof createWorld>;
	let scene: ReturnType<typeof createMockScene>;
	let selection: ReturnType<typeof createMockSelectionManager>;
	let commands: ReturnType<typeof createMockCommandDispatcher>;
	let hotkeys: KeyboardHotkeys;

	beforeEach(() => {
		world = createWorld();
		scene = createMockScene();
		selection = createMockSelectionManager();
		commands = createMockCommandDispatcher();
		hotkeys = new KeyboardHotkeys(scene as never, world, selection as never, commands as never);
		emit.mockReset();
	});

	afterEach(() => {
		hotkeys.destroy();
		world.destroy();
	});

	// ---------------------------------------------------------------
	// H — halt / stop
	// ---------------------------------------------------------------

	describe("H key — halt", () => {
		it("issues stop order to all selected friendly units", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				OrderQueue,
			);
			const queue = unit.get(OrderQueue)!;
			queue.push({ type: "move", targetX: 10, targetY: 10 });

			fireKey(scene, "H");

			expect(unit.get(OrderQueue)).toEqual([{ type: "stop" }]);
		});

		it("does not issue stop to enemy units", () => {
			const enemy = world.spawn(
				Selected,
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
				OrderQueue,
			);
			const queue = enemy.get(OrderQueue)!;
			queue.push({ type: "move", targetX: 10, targetY: 10 });

			fireKey(scene, "H");

			expect(enemy.get(OrderQueue)).toEqual([{ type: "move", targetX: 10, targetY: 10 }]);
		});
	});

	// ---------------------------------------------------------------
	// A — attack-move
	// ---------------------------------------------------------------

	describe("A key — attack-move", () => {
		it("sets pending action to attack-move", () => {
			expect(hotkeys.pendingAction).toBe("none");
			fireKey(scene, "A");
			expect(hotkeys.pendingAction).toBe("attack-move");
		});

		it("handlePendingClick dispatches attack command and resets pending", () => {
			fireKey(scene, "A");
			const consumed = hotkeys.handlePendingClick(300, 400);
			expect(consumed).toBe(true);
			expect(commands.issueCommandAt).toHaveBeenCalledWith(300, 400, "attack");
			expect(hotkeys.pendingAction).toBe("none");
		});
	});

	// ---------------------------------------------------------------
	// P — patrol
	// ---------------------------------------------------------------

	describe("P key — patrol", () => {
		it("sets pending action to patrol", () => {
			fireKey(scene, "P");
			expect(hotkeys.pendingAction).toBe("patrol");
		});

		it("handlePendingClick issues patrol order with waypoints", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				OrderQueue,
			);

			fireKey(scene, "P");
			const consumed = hotkeys.handlePendingClick(10 * 32 + 16, 8 * 32 + 16);
			expect(consumed).toBe(true);

			const orders = unit.get(OrderQueue);
			expect(orders).toHaveLength(1);
			expect(orders![0].type).toBe("patrol");
			expect(orders![0].waypoints).toEqual([
				{ x: 5, y: 5 },
				{ x: 10, y: 8 },
			]);
		});
	});

	// ---------------------------------------------------------------
	// Escape — cancel / deselect
	// ---------------------------------------------------------------

	describe("Escape key", () => {
		it("cancels pending action first", () => {
			fireKey(scene, "A");
			expect(hotkeys.pendingAction).toBe("attack-move");

			fireKey(scene, "ESC");
			expect(hotkeys.pendingAction).toBe("none");
			expect(selection.clearSelection).not.toHaveBeenCalled();
		});

		it("clears selection when no pending action", () => {
			fireKey(scene, "ESC");
			expect(selection.clearSelection).toHaveBeenCalled();
		});
	});

	// ---------------------------------------------------------------
	// Control groups
	// ---------------------------------------------------------------

	describe("control groups (Ctrl+1..9 / 1..9)", () => {
		it("assigns selected units to a control group with Ctrl+number", () => {
			const unit1 = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
			);
			const unit2 = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 3, y: 3 }),
			);

			fireKey(scene, "1", { ctrlKey: true, metaKey: false });

			const group = hotkeys.getControlGroup(1);
			expect(group).toHaveLength(2);
			expect(group).toContain(unit1.id());
			expect(group).toContain(unit2.id());
		});

		it("recalls a control group with number key", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
			);

			// Assign
			hotkeys.assignControlGroup(1);
			unit.remove(Selected);

			// Recall
			fireKey(scene, "1", { ctrlKey: false, metaKey: false });

			expect(selection.clearSelection).toHaveBeenCalled();
			expect(unit.has(Selected)).toBe(true);
		});

		it("does not assign enemy units to control groups", () => {
			world.spawn(
				Selected,
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 2 }),
			);

			hotkeys.assignControlGroup(2);
			expect(hotkeys.getControlGroup(2)).toHaveLength(0);
		});
	});

	// ---------------------------------------------------------------
	// handlePendingClick returns false when no pending action
	// ---------------------------------------------------------------

	it("handlePendingClick returns false when no pending action", () => {
		expect(hotkeys.handlePendingClick(100, 100)).toBe(false);
	});

	// ---------------------------------------------------------------
	// Disabled state
	// ---------------------------------------------------------------

	describe("disabled state", () => {
		it("does not respond to keys when disabled", () => {
			hotkeys.setEnabled(false);
			fireKey(scene, "A");
			expect(hotkeys.pendingAction).toBe("none");
		});
	});
});
