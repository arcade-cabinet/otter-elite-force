/**
 * Movement System Tests
 */

import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { world } from "../../world";
import { applyFriction, updateMovement } from "../MovementSystem";

describe("MovementSystem", () => {
	beforeEach(() => {
		// Clear world before each test
		for (const entity of world.entities) {
			world.remove(entity);
		}
	});

	afterEach(() => {
		// Clear world after each test
		for (const entity of world.entities) {
			world.remove(entity);
		}
	});

	describe("updateMovement", () => {
		it("should update position based on velocity", () => {
			const entity = world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(10, 0, 5),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 20,
				},
			});

			updateMovement(1); // 1 second delta

			expect(entity.transform?.position.x).toBe(10);
			expect(entity.transform?.position.z).toBe(5);
		});

		it("should update rotation based on angular velocity", () => {
			const entity = world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(0, 0, 0),
					angular: new THREE.Vector3(0, Math.PI, 0),
					maxSpeed: 20,
				},
			});

			updateMovement(1); // 1 second delta

			expect(entity.transform?.rotation.y).toBeCloseTo(Math.PI, 5);
		});

		it("should clamp speed to maxSpeed", () => {
			const entity = world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(100, 0, 0), // Way over max
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 10,
				},
			});

			updateMovement(0.016); // Small delta to trigger clamping

			const speed = entity.velocity?.linear.length() ?? 0;
			expect(speed).toBeLessThanOrEqual(10);
		});

		it("should handle multiple entities", () => {
			const entity1 = world.add({
				id: "test-1",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(5, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 20,
				},
			});

			const entity2 = world.add({
				id: "test-2",
				transform: {
					position: new THREE.Vector3(10, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(-3, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 20,
				},
			});

			updateMovement(1);

			expect(entity1.transform?.position.x).toBe(5);
			expect(entity2.transform?.position.x).toBe(7);
		});

		it("should skip entities without transform or velocity", () => {
			world.add({
				id: "no-velocity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
			});

			world.add({
				id: "no-transform",
				velocity: {
					linear: new THREE.Vector3(10, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 20,
				},
			});

			// Should not throw
			expect(() => updateMovement(1)).not.toThrow();
		});
	});

	describe("applyFriction", () => {
		it("should reduce velocity over time", () => {
			const entity = world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(10, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 20,
				},
			});

			const initialSpeed = entity.velocity?.linear.length() ?? 0;
			applyFriction(0.016, 0.95);
			const finalSpeed = entity.velocity?.linear.length() ?? 0;

			expect(finalSpeed).toBeLessThan(initialSpeed);
		});

		it("should not apply friction to projectiles", () => {
			const entity = world.add({
				id: "test-projectile",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(50, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 100,
				},
				isProjectile: { __tag: "IsProjectile" },
			});

			const initialSpeed = entity.velocity?.linear.length() ?? 0;
			applyFriction(0.016, 0.5); // Strong friction

			const finalSpeed = entity.velocity?.linear.length() ?? 0;
			expect(finalSpeed).toBe(initialSpeed); // Unchanged
		});

		it("should use default friction coefficient", () => {
			world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				velocity: {
					linear: new THREE.Vector3(10, 0, 0),
					angular: new THREE.Vector3(0, 0, 0),
					maxSpeed: 20,
				},
			});

			// Should not throw when using default friction
			expect(() => applyFriction(0.016)).not.toThrow();
		});
	});
});
