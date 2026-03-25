import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SteeringVehicle } from "../../ai/steeringFactory";
import { SteeringAgent } from "../../ecs/traits/ai";
import { OrderQueue } from "../../ecs/traits/orders";
import { FacingDirection, Position, Velocity } from "../../ecs/traits/spatial";
import { assignSteeringAgent, movementSystem } from "../../systems/movementSystem";

/**
 * Create a mock SteeringVehicle for testing.
 * Simulates Yuka Vehicle position/velocity without the full Yuka library.
 */
function makeMockSteeringVehicle(x = 0, y = 0) {
	let pathFinished = false;
	const pos = {
		x,
		y: 0,
		z: y,
		set(px: number, _py: number, pz: number) {
			pos.x = px;
			pos.z = pz;
		},
	};
	const vel = { x: 0, y: 0, z: 0 };

	const agent: SteeringVehicle & {
		_setPathFinished: (v: boolean) => void;
		_setVelocity: (vx: number, vz: number) => void;
	} = {
		vehicle: {
			position: pos,
			velocity: vel,
			maxSpeed: 2,
			maxForce: 10,
			mass: 1,
			boundingRadius: 0.4,
			update: vi.fn(),
			steering: { add: vi.fn() },
		} as unknown as SteeringVehicle["vehicle"],
		followPath: {
			active: true,
			path: {
				clear: vi.fn(),
				add: vi.fn(),
				finished: () => pathFinished,
				current: vi.fn(() => undefined),
			},
			weight: 1,
		} as unknown as SteeringVehicle["followPath"],
		separation: { weight: 0.5 } as unknown as SteeringVehicle["separation"],
		obstacleAvoidance: { weight: 1 } as unknown as SteeringVehicle["obstacleAvoidance"],
		_setPathFinished(val: boolean) {
			pathFinished = val;
		},
		_setVelocity(vx: number, vz: number) {
			vel.x = vx;
			vel.z = vz;
		},
	};

	return agent;
}

describe("movementSystem", () => {
	let world: ReturnType<typeof createWorld>;

	beforeEach(() => {
		world = createWorld();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("position sync", () => {
		it("should advance the steering vehicle each tick", () => {
			const agent = makeMockSteeringVehicle(5, 10);
			const entity = world.spawn(Position({ x: 0, y: 0 }), SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			movementSystem(world, 0.25);

			expect(agent.vehicle.update).toHaveBeenCalledWith(0.25);
		});

		it("should sync Yuka Vehicle position to Koota Position trait", () => {
			const agent = makeMockSteeringVehicle(5, 10);
			const entity = world.spawn(Position({ x: 0, y: 0 }), SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			movementSystem(world, 0.016);

			const pos = entity.get(Position);
			expect(pos.x).toBe(5);
			expect(pos.y).toBe(10);
		});

		it("should sync velocity from Vehicle to Koota Velocity trait", () => {
			const agent = makeMockSteeringVehicle(0, 0);
			agent._setVelocity(3, -2);

			const entity = world.spawn(Position({ x: 0, y: 0 }), Velocity({ x: 0, y: 0 }), SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			movementSystem(world, 0.016);

			const vel = entity.get(Velocity);
			expect(vel.x).toBe(3);
			expect(vel.y).toBe(-2);
		});

		it("should update FacingDirection from velocity", () => {
			const agent = makeMockSteeringVehicle(0, 0);
			agent._setVelocity(1, 0); // Moving right -> angle = 0

			const entity = world.spawn(
				Position({ x: 0, y: 0 }),
				FacingDirection({ angle: 999 }),
				SteeringAgent,
			);
			entity.set(SteeringAgent, agent as unknown);

			movementSystem(world, 0.016);

			const facing = entity.get(FacingDirection);
			expect(facing.angle).toBeCloseTo(0, 1);
		});

		it("should not update FacingDirection when velocity is near zero", () => {
			const agent = makeMockSteeringVehicle(0, 0);
			agent._setVelocity(0.001, 0.001); // Below threshold

			const entity = world.spawn(
				Position({ x: 0, y: 0 }),
				FacingDirection({ angle: 1.5 }),
				SteeringAgent,
			);
			entity.set(SteeringAgent, agent as unknown);

			movementSystem(world, 0.016);

			const facing = entity.get(FacingDirection);
			expect(facing.angle).toBe(1.5); // Unchanged
		});

		it("should skip entities with null SteeringAgent", () => {
			const entity = world.spawn(Position({ x: 5, y: 5 }), SteeringAgent);
			// SteeringAgent defaults to null

			// Should not throw
			expect(() => movementSystem(world, 0.016)).not.toThrow();

			// Position should remain unchanged
			const pos = entity.get(Position);
			expect(pos.x).toBe(5);
		});
	});

	describe("arrival detection and order dispatch", () => {
		it("should clear completed move order when path is finished", () => {
			const agent = makeMockSteeringVehicle(10, 10);
			agent._setPathFinished(true);

			const entity = world.spawn(Position({ x: 10, y: 10 }), OrderQueue, SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			const orders = entity.get(OrderQueue);
			orders.push({ type: "move", targetX: 10, targetY: 10 });

			movementSystem(world, 0.016);

			expect(entity.get(OrderQueue).length).toBe(0);
		});

		it("should not clear order if path is not finished", () => {
			const agent = makeMockSteeringVehicle(5, 5);
			agent._setPathFinished(false);

			const entity = world.spawn(Position({ x: 5, y: 5 }), OrderQueue, SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			const orders = entity.get(OrderQueue);
			orders.push({ type: "move", targetX: 10, targetY: 10 });

			movementSystem(world, 0.016);

			expect(entity.get(OrderQueue).length).toBe(1);
		});

		it("should not clear non-move orders on path completion", () => {
			const agent = makeMockSteeringVehicle(10, 10);
			agent._setPathFinished(true);

			const entity = world.spawn(Position({ x: 10, y: 10 }), OrderQueue, SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			const orders = entity.get(OrderQueue);
			orders.push({ type: "attack", targetEntity: 42 });

			movementSystem(world, 0.016);

			// Attack order should remain — movement doesn't clear attack orders
			expect(entity.get(OrderQueue).length).toBe(1);
		});

		it("should dequeue and dispatch next move order after arrival", () => {
			const agent = makeMockSteeringVehicle(10, 10);
			agent._setPathFinished(true);

			const entity = world.spawn(Position({ x: 10, y: 10 }), OrderQueue, SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			const orders = entity.get(OrderQueue);
			orders.push({ type: "move", targetX: 10, targetY: 10 });
			orders.push({ type: "move", targetX: 20, targetY: 20 });

			movementSystem(world, 0.016);

			// First order cleared, second remains
			const remaining = entity.get(OrderQueue);
			expect(remaining.length).toBe(1);
			expect(remaining[0].targetX).toBe(20);
		});

		it("should handle empty order queue gracefully", () => {
			const agent = makeMockSteeringVehicle(0, 0);

			const entity = world.spawn(Position({ x: 0, y: 0 }), OrderQueue, SteeringAgent);
			entity.set(SteeringAgent, agent as unknown);

			expect(() => movementSystem(world, 0.016)).not.toThrow();
		});
	});

	describe("patrol waypoint cycling", () => {
		it("advances to next waypoint on arrival", () => {
			const a = makeMockSteeringVehicle(5, 5);
			a._setPathFinished(true);
			const e = world.spawn(Position({ x: 5, y: 5 }), OrderQueue, SteeringAgent);
			e.set(SteeringAgent, a as unknown);
			e.get(OrderQueue).push({
				type: "patrol",
				waypoints: [
					{ x: 5, y: 5 },
					{ x: 10, y: 10 },
				],
			});
			movementSystem(world, 0.016);
			expect(e.get(OrderQueue).length).toBe(1);
			expect(e.get(OrderQueue)[0].type).toBe("patrol");
		});
		it("cycles back to first waypoint", () => {
			const a = makeMockSteeringVehicle(10, 10);
			a._setPathFinished(true);
			const e = world.spawn(Position({ x: 10, y: 10 }), OrderQueue, SteeringAgent);
			e.set(SteeringAgent, a as unknown);
			e.get(OrderQueue).push({
				type: "patrol",
				waypoints: [
					{ x: 5, y: 5 },
					{ x: 10, y: 10 },
				],
			});
			movementSystem(world, 0.016);
			a._setPathFinished(true);
			movementSystem(world, 0.016);
			expect(e.get(OrderQueue).length).toBe(1);
		});
		it("persists after many cycles", () => {
			const a = makeMockSteeringVehicle(5, 5);
			a._setPathFinished(true);
			const e = world.spawn(Position({ x: 5, y: 5 }), OrderQueue, SteeringAgent);
			e.set(SteeringAgent, a as unknown);
			e.get(OrderQueue).push({
				type: "patrol",
				waypoints: [
					{ x: 5, y: 5 },
					{ x: 15, y: 15 },
				],
			});
			for (let i = 0; i < 10; i++) {
				a._setPathFinished(true);
				movementSystem(world, 0.016);
			}
			expect(e.get(OrderQueue).length).toBe(1);
		});
	});
});
