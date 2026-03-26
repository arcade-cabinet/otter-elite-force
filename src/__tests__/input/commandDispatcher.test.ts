import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Gatherer } from "@/ecs/traits/economy";
import { Faction, IsBuilding, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { OrderQueue, RallyPoint } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { CommandDispatcher } from "@/input/commandDispatcher";

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock("@/game/EventBus", () => ({
	EventBus: { emit },
}));

describe("CommandDispatcher", () => {
	let world: ReturnType<typeof createWorld>;
	let dispatcher: CommandDispatcher;

	beforeEach(() => {
		world = createWorld();
		dispatcher = new CommandDispatcher(world);
		emit.mockReset();
	});

	afterEach(() => {
		dispatcher.destroy();
		world.destroy();
	});

	// =========================================================================
	// Right-click ground with units selected -> Move order
	// =========================================================================

	describe("right-click ground -> move order", () => {
		it("issues move order to selected friendly units via context mode", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			dispatcher.issueCommandAt(12 * 32 + 16, 8 * 32 + 16, "context");

			expect(unit.get(OrderQueue)).toEqual([{ type: "move", targetX: 12, targetY: 8 }]);
		});

		it("issues move order via explicit move mode", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			dispatcher.issueCommandAt(12 * 32 + 16, 8 * 32 + 16, "move");

			expect(unit.get(OrderQueue)).toEqual([{ type: "move", targetX: 12, targetY: 8 }]);
		});

		it("shows green command marker when move is issued", () => {
			world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context");

			expect(emit).toHaveBeenCalledWith(
				"command-marker",
				expect.objectContaining({ color: 0x00ff00 }),
			);
		});

		it("does not issue move to enemy-faction units", () => {
			const enemy = world.spawn(
				Selected,
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			dispatcher.issueCommandAt(10 * 32, 10 * 32, "context");

			expect(enemy.get(OrderQueue)).toEqual([]);
		});

		it("replaces existing orders with the new move command", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);
			const queue = unit.get(OrderQueue);
			queue!.push({ type: "attack", targetEntity: 999 });

			dispatcher.issueCommandAt(10 * 32 + 16, 10 * 32 + 16, "context");

			expect(unit.get(OrderQueue)).toEqual([{ type: "move", targetX: 10, targetY: 10 }]);
		});
	});

	// =========================================================================
	// Right-click enemy -> Attack order
	// =========================================================================

	describe("right-click enemy -> attack order", () => {
		it("issues attack order when right-clicking an enemy unit", () => {
			const attacker = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			const enemy = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
			);

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context");

			const orders = attacker.get(OrderQueue);
			expect(orders).toHaveLength(1);
			expect(orders![0].type).toBe("attack");
			expect(orders![0].targetEntity).toBe(enemy.id());
		});

		it("issues attack order via explicit attack mode", () => {
			const attacker = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			const enemy = world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
			);

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "attack");

			const orders = attacker.get(OrderQueue);
			expect(orders).toHaveLength(1);
			expect(orders![0].type).toBe("attack");
			expect(orders![0].targetEntity).toBe(enemy.id());
		});

		it("falls back to move when attacking empty ground", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			// Attack mode on empty ground -> attack-move (move)
			dispatcher.issueCommandAt(20 * 32 + 16, 20 * 32 + 16, "attack");

			const orders = unit.get(OrderQueue);
			expect(orders).toHaveLength(1);
			expect(orders![0].type).toBe("move");
		});

		it("shows red command marker for attack commands", () => {
			world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
			);

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context");

			// A red command marker should have been emitted
			expect(emit).toHaveBeenCalledWith(
				"command-marker",
				expect.objectContaining({ color: 0xff0000 }),
			);
		});
	});

	// =========================================================================
	// Right-click resource with worker -> Gather order
	// =========================================================================

	describe("right-click resource -> gather order", () => {
		it("issues gather order when worker right-clicks a resource node", () => {
			const worker = world.spawn(
				Selected,
				UnitType({ type: "river_rat" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
				Gatherer,
			);

			const resource = world.spawn(
				IsResource,
				Faction({ id: "neutral" }),
				Position({ x: 5, y: 5 }),
			);

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context");

			const orders = worker.get(OrderQueue);
			expect(orders).toHaveLength(1);
			expect(orders![0].type).toBe("gather");
			expect(orders![0].targetEntity).toBe(resource.id());
			expect(orders![0].targetX).toBe(5);
			expect(orders![0].targetY).toBe(5);
		});

		it("does not issue gather order for non-worker combat units", () => {
			const combatUnit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
				// no Gatherer trait
			);

			world.spawn(IsResource, Faction({ id: "neutral" }), Position({ x: 5, y: 5 }));

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context");

			// Combat units cannot gather, so no orders should be issued
			const orders = combatUnit.get(OrderQueue);
			expect(orders).toHaveLength(0);
		});

		it("shows yellow command marker for gather commands", () => {
			world.spawn(
				Selected,
				UnitType({ type: "river_rat" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
				Gatherer,
			);

			world.spawn(IsResource, Faction({ id: "neutral" }), Position({ x: 5, y: 5 }));

			dispatcher.issueCommandAt(5 * 32 + 16, 5 * 32 + 16, "context");

			expect(emit).toHaveBeenCalledWith(
				"command-marker",
				expect.objectContaining({ color: 0xfbbf24 }),
			);
		});
	});

	// =========================================================================
	// Right-click ground with building -> Set rally point
	// =========================================================================

	describe("right-click ground with building selected -> rally point", () => {
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
		});

		it("updates rally points from explicit move mode for mobile input", () => {
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

		it("updates rally points for multiple selected buildings", () => {
			const building1 = world.spawn(
				IsBuilding,
				Selected,
				UnitType({ type: "barracks" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				RallyPoint({ x: 6, y: 5 }),
			);
			const building2 = world.spawn(
				IsBuilding,
				Selected,
				UnitType({ type: "barracks" }),
				Faction({ id: "ura" }),
				Position({ x: 10, y: 10 }),
				RallyPoint({ x: 11, y: 10 }),
			);

			dispatcher.issueCommandAt(20 * 32 + 16, 20 * 32 + 16, "context");

			expect(building1.get(RallyPoint)).toEqual({ x: 20, y: 20 });
			expect(building2.get(RallyPoint)).toEqual({ x: 20, y: 20 });
			expect(emit).toHaveBeenCalledWith(
				"hud-alert",
				expect.objectContaining({
					message: expect.stringMatching(/2 structures/),
				}),
			);
		});

		it("prefers unit commands over rally when both units and buildings are selected", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			const building = world.spawn(
				IsBuilding,
				Selected,
				UnitType({ type: "barracks" }),
				Faction({ id: "ura" }),
				Position({ x: 10, y: 10 }),
				RallyPoint({ x: 11, y: 10 }),
			);

			dispatcher.issueCommandAt(15 * 32 + 16, 15 * 32 + 16, "context");

			// Unit should get move order
			const orders = unit.get(OrderQueue);
			expect(orders).toHaveLength(1);
			expect(orders![0].type).toBe("move");

			// Building rally should NOT change (unit commands take priority)
			expect(building.get(RallyPoint)).toEqual({ x: 11, y: 10 });
		});
	});

	// =========================================================================
	// Disabled state
	// =========================================================================

	describe("disabled state", () => {
		it("does nothing when disabled", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			dispatcher.setEnabled(false);
			dispatcher.issueCommandAt(10 * 32, 10 * 32, "context");

			expect(unit.get(OrderQueue)).toEqual([]);
		});

		it("re-enables after setEnabled(true)", () => {
			const unit = world.spawn(
				Selected,
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 2, y: 2 }),
				OrderQueue,
			);

			dispatcher.setEnabled(false);
			dispatcher.setEnabled(true);
			dispatcher.issueCommandAt(10 * 32, 10 * 32, "context");

			expect(unit.get(OrderQueue)).toHaveLength(1);
		});
	});
});
