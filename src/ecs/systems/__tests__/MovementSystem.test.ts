import * as THREE from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { movables, steeringEntities } from "../../world";
import { applyFriction, updateMovement, updateSteering } from "../MovementSystem";

// Mock dependencies
vi.mock("../../world", () => ({
	movables: [],
	steeringEntities: [],
}));

describe("MovementSystem", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(movables as unknown as any[]).length = 0;
		(steeringEntities as unknown as any[]).length = 0;
	});

	describe("updateMovement", () => {
		it("should update position based on linear velocity", () => {
			const entity = {
				transform: { position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler() },
				velocity: {
					linear: new THREE.Vector3(1, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 10,
				},
			};
			(movables as unknown as any[]).push(entity);

			updateMovement(1.0); // 1 second

			expect(entity.transform.position.x).toBe(1);
		});

		it("should update rotation based on angular velocity", () => {
			const entity = {
				transform: { position: new THREE.Vector3(), rotation: new THREE.Euler(0, 0, 0) },
				velocity: {
					linear: new THREE.Vector3(),
					angular: new THREE.Vector3(0, 1, 0),
					maxSpeed: 10,
				},
			};
			(movables as unknown as any[]).push(entity);

			updateMovement(1.0);

			expect(entity.transform.rotation.y).toBe(1);
		});

		it("should clamp speed to maxSpeed", () => {
			const entity = {
				transform: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
				velocity: {
					linear: new THREE.Vector3(20, 0, 0),
					angular: new THREE.Vector3(),
					maxSpeed: 10,
				},
			};
			(movables as unknown as any[]).push(entity);

			updateMovement(1.0);

			// Speed should be clamped to 10. But position is updated *before* clamping in current impl?
			// Current impl: apply velocity, then clamp velocity.
			// So position moves 20, but velocity becomes 10 for next frame.

			expect(entity.transform.position.x).toBe(20);
			expect(entity.velocity.linear.x).toBe(10);
		});
	});

	describe("updateSteering", () => {
		it("should update Yuka vehicle and sync transform", () => {
			const vehicle = {
				position: new THREE.Vector3(5, 0, 5),
				velocity: new THREE.Vector3(1, 0, 0),
				set: vi.fn(),
				update: vi.fn(),
				maxSpeed: 10,
			};
			const entity = {
				transform: { position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler() },
				velocity: { linear: new THREE.Vector3(), maxSpeed: 10 },
				steeringAgent: {
					vehicle: vehicle,
					targetPosition: new THREE.Vector3(10, 0, 0),
				},
			};
			(steeringEntities as unknown as any[]).push(entity);

			updateSteering(1.0);

			// Note: The logic in MovementSystem sets the vehicle position to the entity position first
			// if targetPosition is present.
			// vehicle.position.set(entity.transform.position...)
			// Then it calls vehicle.update(delta) which SHOULD update vehicle.position internally based on velocity.
			// But our mock vehicle.update does nothing to position.

			// So:
			// 1. vehicle.position.set(0,0,0) (from entity)
			// 2. vehicle.update() (mocked, no change)
			// 3. entity.transform.position.set(vehicle.position...) -> 0,0,0

			// To test sync FROM vehicle, we should ensure vehicle position changes or is not overwritten if we want to test that flow?

			// If targetPosition is set, we overwrite vehicle position with entity position.
			// This assumes Yuka simulation step will move it.
			// Since we mock update, it stays at 0.

			// Let's remove targetPosition to skip the "sync to vehicle" step,
			// so we can test "sync from vehicle".

			// Re-setup without targetPosition
			entity.steeringAgent.targetPosition = undefined;
			// Reset vehicle position to something non-zero
			vehicle.position.set(5, 0, 5);

			updateSteering(1.0);

			expect(entity.transform.position.x).toBe(5);
		});

		it("should apply suppression to maxSpeed", () => {
			const vehicle = {
				position: new THREE.Vector3(),
				velocity: new THREE.Vector3(),
				set: vi.fn(),
				update: vi.fn(),
				maxSpeed: 10,
			};
			const entity = {
				transform: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
				velocity: { linear: new THREE.Vector3(), maxSpeed: 10 },
				steeringAgent: { vehicle: vehicle },
				suppression: { amount: 0.5 }, // 50% suppression
			};
			(steeringEntities as unknown as any[]).push(entity);

			updateSteering(1.0);

			// Factor: 1 - 0.5 * 0.8 = 1 - 0.4 = 0.6
			// Max speed: 10 * 0.6 = 6
			expect(vehicle.maxSpeed).toBeCloseTo(6);
		});

		it("should update rotation to face movement direction", () => {
			const vehicle = {
				position: new THREE.Vector3(),
				velocity: new THREE.Vector3(1, 0, 1), // Moving diagonal
				set: vi.fn(),
				update: vi.fn(),
				maxSpeed: 10,
			};
			const entity = {
				transform: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
				velocity: { linear: new THREE.Vector3(), maxSpeed: 10 },
				steeringAgent: { vehicle: vehicle },
			};
			(steeringEntities as unknown as any[]).push(entity);

			updateSteering(1.0);

			// atan2(1, 1) = PI/4 = 0.785
			expect(entity.transform.rotation.y).toBeCloseTo(Math.atan2(1, 1));
		});
	});

	describe("applyFriction", () => {
		it("should apply friction to linear velocity", () => {
			const entity = {
				velocity: { linear: new THREE.Vector3(10, 0, 0) },
				isProjectile: false,
			};
			(movables as unknown as any[]).push(entity);

			applyFriction(1.0, 0.9);
			// 0.9 ** (1 * 60) = very small number
			// Let's use small delta for test stability or check reduction

			expect(entity.velocity.linear.x).toBeLessThan(10);
		});

		it("should not apply friction to projectiles", () => {
			const entity = {
				velocity: { linear: new THREE.Vector3(10, 0, 0) },
				isProjectile: true,
			};
			(movables as unknown as any[]).push(entity);

			applyFriction(1.0);

			expect(entity.velocity.linear.x).toBe(10);
		});
	});
});
