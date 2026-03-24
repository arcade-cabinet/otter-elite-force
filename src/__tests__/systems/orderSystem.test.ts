/**
 * Tests for the Order System.
 *
 * Verifies that each order type (Move, Attack, Gather, Build, Stop, Patrol)
 * is correctly processed: pathfinding dispatched, ECS relations set,
 * state transitions applied.
 */
import { createWorld, type World, type Entity } from "koota";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIState, SteeringAgent } from "../../ecs/traits/ai";
import { Attack, Health, VisionRadius } from "../../ecs/traits/combat";
import { Gatherer, ResourceNode, ConstructionProgress } from "../../ecs/traits/economy";
import { Faction, IsBuilding, IsResource, UnitType } from "../../ecs/traits/identity";
import { OrderQueue } from "../../ecs/traits/orders";
import type { Order } from "../../ecs/traits/orders";
import { Position } from "../../ecs/traits/spatial";
import { Targeting, GatheringFrom } from "../../ecs/relations";
import { orderSystem } from "../../systems/orderSystem";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let world: World;

/** Create a mock SteeringVehicle that the orderSystem can interact with. */
function mockSteering() {
	return {
		vehicle: {
			position: { x: 0, y: 0, z: 0, set: vi.fn() },
			velocity: { x: 0, y: 0, z: 0 },
			maxSpeed: 2,
		},
		followPath: {
			path: {
				clear: vi.fn(),
				add: vi.fn(),
				finished: vi.fn(() => false),
			},
			active: true,
		},
		separation: { active: true },
		obstacleAvoidance: { active: true },
	};
}

function spawnUnit(overrides: {
	x?: number;
	y?: number;
	faction?: string;
	withSteering?: boolean;
	withGatherer?: boolean;
	withAttack?: boolean;
	orders?: Order[];
}) {
	const traits = [
		UnitType({ type: "mudfoot" }),
		Position({ x: overrides.x ?? 0, y: overrides.y ?? 0 }),
		Faction({ id: overrides.faction ?? "ura" }),
		Health({ current: 80, max: 80 }),
		OrderQueue,
		AIState,
	];

	if (overrides.withSteering) {
		traits.push(SteeringAgent);
	}
	if (overrides.withGatherer) {
		traits.push(Gatherer({ carrying: "", amount: 0, capacity: 10 }));
	}
	if (overrides.withAttack) {
		traits.push(Attack({ damage: 12, range: 1, cooldown: 1, timer: 0 }));
		traits.push(VisionRadius({ radius: 5 }));
	}

	const entity = world.spawn(...traits);

	if (overrides.withSteering) {
		entity.set(SteeringAgent, mockSteering() as unknown);
	}

	if (overrides.orders) {
		const queue = entity.get(OrderQueue);
		queue.push(...overrides.orders);
	}

	return entity;
}

function spawnEnemy(x: number, y: number) {
	return world.spawn(
		UnitType({ type: "gator" }),
		Position({ x, y }),
		Faction({ id: "scale_guard" }),
		Health({ current: 120, max: 120 }),
	);
}

function spawnResource(x: number, y: number) {
	return world.spawn(
		Position({ x, y }),
		IsResource(),
		ResourceNode({ type: "fish", remaining: 100 }),
	);
}

beforeEach(() => {
	world = createWorld();
});

// ---------------------------------------------------------------------------
// Move Order
// ---------------------------------------------------------------------------

describe("orderSystem — Move", () => {
	it("should set AIState to 'moving' when processing a move order", () => {
		const unit = spawnUnit({
			withSteering: true,
			orders: [{ type: "move", targetX: 10, targetY: 5 }],
		});

		orderSystem(world, 0.016);

		const ai = unit.get(AIState);
		expect(ai.state).toBe("moving");
	});

	it("should set path on steering vehicle for move order", () => {
		const unit = spawnUnit({
			withSteering: true,
			orders: [{ type: "move", targetX: 10, targetY: 5 }],
		});

		orderSystem(world, 0.016);

		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		expect(agent.followPath.path.clear).toHaveBeenCalled();
		expect(agent.followPath.path.add).toHaveBeenCalled();
	});

	it("should not re-dispatch move order that is already in progress", () => {
		const unit = spawnUnit({
			withSteering: true,
			orders: [{ type: "move", targetX: 10, targetY: 5 }],
		});

		// First tick dispatches
		orderSystem(world, 0.016);
		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		const callCount = (agent.followPath.path.add as ReturnType<typeof vi.fn>).mock.calls.length;

		// Second tick should not re-dispatch (order is in progress)
		orderSystem(world, 0.016);
		expect((agent.followPath.path.add as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
			callCount,
		);
	});
});

// ---------------------------------------------------------------------------
// Attack Order
// ---------------------------------------------------------------------------

describe("orderSystem — Attack", () => {
	it("should set Targeting relation and AIState to 'attacking'", () => {
		const enemy = spawnEnemy(5, 5);
		const unit = spawnUnit({
			withSteering: true,
			withAttack: true,
			orders: [{ type: "attack", targetEntity: enemy.id() }],
		});

		orderSystem(world, 0.016);

		const ai = unit.get(AIState);
		expect(ai.state).toBe("attacking");
		expect(unit.has(Targeting("*"))).toBe(true);
	});

	it("should move toward target if out of attack range", () => {
		const enemy = spawnEnemy(10, 10);
		const unit = spawnUnit({
			x: 0,
			y: 0,
			withSteering: true,
			withAttack: true,
			orders: [{ type: "attack", targetEntity: enemy.id() }],
		});

		orderSystem(world, 0.016);

		// Should dispatch movement toward the enemy
		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		expect(agent.followPath.path.add).toHaveBeenCalled();
	});

	it("should clear attack order if target is dead", () => {
		const enemy = spawnEnemy(5, 5);
		const unit = spawnUnit({
			withSteering: true,
			withAttack: true,
			orders: [{ type: "attack", targetEntity: enemy.id() }],
		});

		// Kill the enemy
		enemy.destroy();

		orderSystem(world, 0.016);

		// Order should be removed since target is gone
		const queue = unit.get(OrderQueue);
		expect(queue.length).toBe(0);
		const ai = unit.get(AIState);
		expect(ai.state).toBe("idle");
	});
});

// ---------------------------------------------------------------------------
// Gather Order
// ---------------------------------------------------------------------------

describe("orderSystem — Gather", () => {
	it("should set GatheringFrom relation and AIState to 'gathering'", () => {
		const resource = spawnResource(5, 5);
		const unit = spawnUnit({
			withSteering: true,
			withGatherer: true,
			orders: [{ type: "gather", targetX: 5, targetY: 5, targetEntity: resource.id() }],
		});

		orderSystem(world, 0.016);

		const ai = unit.get(AIState);
		expect(ai.state).toBe("gathering");
		expect(unit.has(GatheringFrom("*"))).toBe(true);
	});

	it("should move toward resource if not adjacent", () => {
		const resource = spawnResource(10, 10);
		const unit = spawnUnit({
			x: 0,
			y: 0,
			withSteering: true,
			withGatherer: true,
			orders: [{ type: "gather", targetX: 10, targetY: 10, targetEntity: resource.id() }],
		});

		orderSystem(world, 0.016);

		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		expect(agent.followPath.path.add).toHaveBeenCalled();
	});

	it("should ignore gather order for non-gatherer units", () => {
		const resource = spawnResource(5, 5);
		const unit = spawnUnit({
			withSteering: true,
			withGatherer: false,
			orders: [{ type: "gather", targetX: 5, targetY: 5, targetEntity: resource.id() }],
		});

		orderSystem(world, 0.016);

		// Order should be discarded since unit can't gather
		const queue = unit.get(OrderQueue);
		expect(queue.length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Build Order
// ---------------------------------------------------------------------------

describe("orderSystem — Build", () => {
	it("should set AIState to 'building' and move to build site", () => {
		const unit = spawnUnit({
			x: 0,
			y: 0,
			withSteering: true,
			withGatherer: true,
			orders: [{ type: "build", targetX: 8, targetY: 8, buildingType: "barracks" }],
		});

		orderSystem(world, 0.016);

		const ai = unit.get(AIState);
		expect(ai.state).toBe("building");

		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		expect(agent.followPath.path.add).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Stop Order
// ---------------------------------------------------------------------------

describe("orderSystem — Stop", () => {
	it("should clear all orders and set AIState to idle", () => {
		const unit = spawnUnit({
			withSteering: true,
			orders: [
				{ type: "move", targetX: 10, targetY: 10 },
				{ type: "move", targetX: 20, targetY: 20 },
			],
		});

		// Insert a stop order at the front
		const queue = unit.get(OrderQueue);
		queue.unshift({ type: "stop" });

		orderSystem(world, 0.016);

		expect(unit.get(OrderQueue).length).toBe(0);
		expect(unit.get(AIState).state).toBe("idle");
	});

	it("should clear steering path on stop", () => {
		const unit = spawnUnit({
			withSteering: true,
			orders: [{ type: "stop" }],
		});

		orderSystem(world, 0.016);

		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		expect(agent.followPath.path.clear).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Patrol Order
// ---------------------------------------------------------------------------

describe("orderSystem — Patrol", () => {
	it("should set AIState to 'patrolling' and begin moving to first waypoint", () => {
		const unit = spawnUnit({
			withSteering: true,
			orders: [
				{
					type: "patrol",
					waypoints: [
						{ x: 5, y: 0 },
						{ x: 5, y: 10 },
						{ x: 0, y: 10 },
					],
				},
			],
		});

		orderSystem(world, 0.016);

		const ai = unit.get(AIState);
		expect(ai.state).toBe("patrolling");

		const agent = unit.get(SteeringAgent) as ReturnType<typeof mockSteering>;
		expect(agent.followPath.path.add).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("orderSystem — Edge cases", () => {
	it("should skip entities with empty order queue", () => {
		const unit = spawnUnit({ withSteering: true });

		// Should not throw or change state
		orderSystem(world, 0.016);

		expect(unit.get(AIState).state).toBe("idle");
	});

	it("should skip entities without SteeringAgent", () => {
		const unit = spawnUnit({
			withSteering: false,
			orders: [{ type: "move", targetX: 5, targetY: 5 }],
		});

		// Should not throw
		orderSystem(world, 0.016);

		// Order remains since it couldn't be processed
		expect(unit.get(OrderQueue).length).toBe(1);
	});
});
