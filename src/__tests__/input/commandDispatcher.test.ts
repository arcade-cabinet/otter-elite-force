import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { CommandDispatcher } from "@/input/commandDispatcher";

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock("@/game/EventBus", () => ({
	EventBus: { emit },
}));

function createMockGraphics() {
	return {
		lineStyle: vi.fn().mockReturnThis(),
		strokeCircle: vi.fn().mockReturnThis(),
		setDepth: vi.fn().mockReturnThis(),
		alpha: 1,
		scaleX: 1,
		scaleY: 1,
		destroy: vi.fn(),
	};
}

function createMockScene() {
	return {
		input: { on: vi.fn(), off: vi.fn() },
		add: { graphics: vi.fn(() => createMockGraphics()) },
		tweens: {
			add: vi.fn((config: { onComplete?: () => void }) => {
				config.onComplete?.();
				return config;
			}),
		},
	};
}

describe("CommandDispatcher", () => {
	let world: ReturnType<typeof createWorld>;
	let scene: ReturnType<typeof createMockScene>;
	let dispatcher: CommandDispatcher;

	beforeEach(() => {
		world = createWorld();
		scene = createMockScene();
		dispatcher = new CommandDispatcher(scene as never, world);
		emit.mockReset();
	});

	afterEach(() => {
		dispatcher.destroy();
		world.destroy();
	});

	it("updates rally points for selected production buildings", () => {
		const barracks = world.spawn(
			IsBuilding,
			Selected,
			UnitType({ type: "barracks" }),
			Faction({ id: "ura" }),
			Position({ x: 10, y: 10 }),
			RallyPoint({ x: 11, y: 10 }),
		);

		dispatcher.issueCommandAt(15 * 32 + 16, 20 * 32 + 16, "context");

		expect(barracks.get(RallyPoint)).toEqual({ x: 15, y: 20 });
		expect(emit).toHaveBeenCalledWith(
			"hud-alert",
			expect.objectContaining({
				severity: "info",
				message: expect.stringMatching(/rally point updated/i),
			}),
		);
		expect(scene.add.graphics).toHaveBeenCalled();
	});

	it("updates rally points from explicit move mode for mobile command input", () => {
		const commandPost = world.spawn(
			IsBuilding,
			Selected,
			UnitType({ type: "command_post" }),
			Faction({ id: "ura" }),
			Position({ x: 5, y: 5 }),
			RallyPoint({ x: 6, y: 5 }),
		);

		dispatcher.issueCommandAt(9 * 32 + 16, 7 * 32 + 16, "move");

		expect(commandPost.get(RallyPoint)).toEqual({ x: 9, y: 7 });
	});

	it("still issues move orders for selected friendly units", () => {
		const unit = world.spawn(
			Selected,
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
			OrderQueue,
		);

		dispatcher.issueCommandAt(12 * 32 + 16, 8 * 32 + 16, "move");

		expect(unit.get(OrderQueue)).toEqual([{ type: "move", targetX: 12, targetY: 8 }]);
		expect(emit).not.toHaveBeenCalled();
	});
});
