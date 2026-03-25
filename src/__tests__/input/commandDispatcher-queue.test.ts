import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Gatherer } from "@/ecs/traits/economy";
import { Faction, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
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

describe("CommandDispatcher — shift+right-click command queuing (P0 fix)", () => {
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

	it("appends move order when queue=true instead of replacing", () => {
		const unit = world.spawn(
			Selected,
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
			OrderQueue,
		);

		// Issue first move
		dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context", false);
		expect(unit.get(OrderQueue)).toHaveLength(1);
		expect(unit.get(OrderQueue)![0]).toEqual({ type: "move", targetX: 5, targetY: 5 });

		// Issue second move with queue=true (shift)
		dispatcher.issueCommandAt(10 * 32 + 16, 10 * 32 + 16, "context", true);
		expect(unit.get(OrderQueue)).toHaveLength(2);
		expect(unit.get(OrderQueue)![0]).toEqual({ type: "move", targetX: 5, targetY: 5 });
		expect(unit.get(OrderQueue)![1]).toEqual({ type: "move", targetX: 10, targetY: 10 });
	});

	it("appends attack order when queue=true", () => {
		const attacker = world.spawn(
			Selected,
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
			OrderQueue,
		);

		const enemy1 = world.spawn(
			UnitType({ type: "gator" }),
			Faction({ id: "scale_guard" }),
			Position({ x: 5, y: 5 }),
		);

		const enemy2 = world.spawn(
			UnitType({ type: "gator" }),
			Faction({ id: "scale_guard" }),
			Position({ x: 15, y: 15 }),
		);

		// Issue first attack
		dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context", false);
		expect(attacker.get(OrderQueue)).toHaveLength(1);
		expect(attacker.get(OrderQueue)![0].type).toBe("attack");

		// Queue second attack with shift
		dispatcher.issueCommandAt(15 * 32 + 16, 15 * 32 + 16, "context", true);
		expect(attacker.get(OrderQueue)).toHaveLength(2);
		expect(attacker.get(OrderQueue)![0].type).toBe("attack");
		expect(attacker.get(OrderQueue)![1].type).toBe("attack");
		expect(attacker.get(OrderQueue)![0].targetEntity).toBe(enemy1.id());
		expect(attacker.get(OrderQueue)![1].targetEntity).toBe(enemy2.id());
	});

	it("appends gather order when queue=true", () => {
		const worker = world.spawn(
			Selected,
			UnitType({ type: "river_rat" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
			OrderQueue,
			Gatherer,
		);

		const resource1 = world.spawn(IsResource, Faction({ id: "neutral" }), Position({ x: 5, y: 5 }));

		const resource2 = world.spawn(
			IsResource,
			Faction({ id: "neutral" }),
			Position({ x: 15, y: 15 }),
		);

		// Issue first gather
		dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context", false);
		expect(worker.get(OrderQueue)).toHaveLength(1);
		expect(worker.get(OrderQueue)![0].type).toBe("gather");

		// Queue second gather with shift
		dispatcher.issueCommandAt(15 * 32 + 16, 15 * 32 + 16, "context", true);
		expect(worker.get(OrderQueue)).toHaveLength(2);
		expect(worker.get(OrderQueue)![0].type).toBe("gather");
		expect(worker.get(OrderQueue)![1].type).toBe("gather");
	});

	it("replaces orders when queue=false (default behavior preserved)", () => {
		const unit = world.spawn(
			Selected,
			UnitType({ type: "mudfoot" }),
			Faction({ id: "ura" }),
			Position({ x: 2, y: 2 }),
			OrderQueue,
		);

		// Issue first move
		dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context", false);
		// Issue second move without shift — should replace
		dispatcher.issueCommandAt(10 * 32 + 16, 10 * 32 + 16, "context", false);

		expect(unit.get(OrderQueue)).toHaveLength(1);
		expect(unit.get(OrderQueue)![0]).toEqual({ type: "move", targetX: 10, targetY: 10 });
	});
});
