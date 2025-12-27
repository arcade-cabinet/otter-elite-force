/**
 * Combat System Tests
 */

import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { world } from "../../world";
import {
	applyDamage,
	applyExplosionDamage,
	cleanupDead,
	healEntity,
	updateHealthRegen,
	updateSuppression,
} from "../CombatSystem";

describe("CombatSystem", () => {
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

	describe("applyDamage", () => {
		it("should reduce entity health", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyDamage("test-entity", 25);

			expect(entity.health?.current).toBe(75);
		});

		it("should not reduce health below 0", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 10,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyDamage("test-entity", 50);

			expect(entity.health?.current).toBe(0);
		});

		it("should mark entity as dead when health reaches 0", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 10,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyDamage("test-entity", 20);

			expect(entity.isDead).toBeDefined();
		});

		it("should not damage invulnerable entities (health flag)", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: true,
				},
			});

			applyDamage("test-entity", 50);

			expect(entity.health?.current).toBe(100);
		});

		it("should not damage invulnerable entities (tag)", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
				isInvulnerable: { __tag: "IsInvulnerable" },
			});

			applyDamage("test-entity", 50);

			expect(entity.health?.current).toBe(100);
		});

		it("should update lastDamageTime", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			const before = Date.now();
			applyDamage("test-entity", 10);
			const after = Date.now();

			expect(entity.health?.lastDamageTime).toBeGreaterThanOrEqual(before);
			expect(entity.health?.lastDamageTime).toBeLessThanOrEqual(after);
		});

		it("should increase suppression when damage is applied", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
				suppression: {
					amount: 0,
					decayRate: 0.1,
					threshold: 0.5,
				},
			});

			applyDamage("test-entity", 20);

			expect(entity.suppression?.amount).toBeGreaterThan(0);
		});

		it("should handle non-existent entity gracefully", () => {
			expect(() => applyDamage("non-existent", 50)).not.toThrow();
		});
	});

	describe("healEntity", () => {
		it("should increase entity health", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 50,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			healEntity("test-entity", 25);

			expect(entity.health?.current).toBe(75);
		});

		it("should not exceed max health", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 90,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			healEntity("test-entity", 50);

			expect(entity.health?.current).toBe(100);
		});

		it("should handle non-existent entity gracefully", () => {
			expect(() => healEntity("non-existent", 50)).not.toThrow();
		});
	});

	describe("updateSuppression", () => {
		it("should decay suppression over time", () => {
			const entity = world.add({
				id: "test-enemy",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
				aiBrain: {
					currentState: "idle",
					previousState: "idle",
					stateTime: 0,
					alertLevel: 0,
					lastKnownPlayerPos: null,
					homePosition: new THREE.Vector3(0, 0, 0),
					patrolRadius: 10,
				},
				suppression: {
					amount: 0.5,
					decayRate: 0.1,
					threshold: 0.5,
				},
				isEnemy: { __tag: "IsEnemy" },
			});

			updateSuppression(1); // 1 second

			expect(entity.suppression?.amount).toBeLessThan(0.5);
		});

		it("should not reduce suppression below 0", () => {
			const entity = world.add({
				id: "test-enemy",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
				aiBrain: {
					currentState: "idle",
					previousState: "idle",
					stateTime: 0,
					alertLevel: 0,
					lastKnownPlayerPos: null,
					homePosition: new THREE.Vector3(0, 0, 0),
					patrolRadius: 10,
				},
				suppression: {
					amount: 0.05,
					decayRate: 1.0, // High decay rate
					threshold: 0.5,
				},
				isEnemy: { __tag: "IsEnemy" },
			});

			updateSuppression(1); // 1 second

			expect(entity.suppression?.amount).toBe(0);
		});
	});

	describe("updateHealthRegen", () => {
		it("should regenerate health over time when not recently damaged", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 50,
					max: 100,
					regenRate: 10,
					lastDamageTime: Date.now() - 5000, // 5 seconds ago
					isInvulnerable: false,
				},
			});

			updateHealthRegen(1); // 1 second

			expect(entity.health?.current).toBe(60);
		});

		it("should not regenerate when recently damaged", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 50,
					max: 100,
					regenRate: 10,
					lastDamageTime: Date.now() - 1000, // 1 second ago
					isInvulnerable: false,
				},
			});

			updateHealthRegen(1);

			expect(entity.health?.current).toBe(50);
		});

		it("should not exceed max health", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 95,
					max: 100,
					regenRate: 20,
					lastDamageTime: Date.now() - 5000,
					isInvulnerable: false,
				},
			});

			updateHealthRegen(1);

			expect(entity.health?.current).toBe(100);
		});

		it("should skip entities at full health", () => {
			const entity = world.add({
				id: "test-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 10,
					lastDamageTime: Date.now() - 5000,
					isInvulnerable: false,
				},
			});

			updateHealthRegen(1);

			expect(entity.health?.current).toBe(100);
		});
	});

	describe("cleanupDead", () => {
		it("should remove dead entities from world", () => {
			world.add({
				id: "dead-entity",
				isDead: { __tag: "IsDead" },
			});

			const countBefore = world.entities.length;
			cleanupDead();
			const countAfter = world.entities.length;

			expect(countAfter).toBe(countBefore - 1);
		});

		it("should not remove alive entities", () => {
			const alive = world.add({
				id: "alive-entity",
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			cleanupDead();

			expect(world.entities).toContain(alive);
		});
	});

	describe("applyExplosionDamage", () => {
		it("should damage entities within radius", () => {
			const entity = world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(5, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 50);

			expect(entity.health?.current).toBeLessThan(100);
		});

		it("should not damage entities outside radius", () => {
			const entity = world.add({
				id: "test-entity",
				transform: {
					position: new THREE.Vector3(20, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 50);

			expect(entity.health?.current).toBe(100);
		});

		it("should apply damage falloff with distance", () => {
			const closeEntity = world.add({
				id: "close-entity",
				transform: {
					position: new THREE.Vector3(2, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			const farEntity = world.add({
				id: "far-entity",
				transform: {
					position: new THREE.Vector3(8, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 50);

			const closeDamage = 100 - (closeEntity.health?.current ?? 0);
			const farDamage = 100 - (farEntity.health?.current ?? 0);

			expect(closeDamage).toBeGreaterThan(farDamage);
		});

		it("should not damage source entity", () => {
			const source = world.add({
				id: "source-entity",
				transform: {
					position: new THREE.Vector3(0, 0, 0),
					rotation: new THREE.Euler(0, 0, 0),
					scale: new THREE.Vector3(1, 1, 1),
				},
				health: {
					current: 100,
					max: 100,
					regenRate: 0,
					lastDamageTime: 0,
					isInvulnerable: false,
				},
			});

			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 50, "source-entity");

			expect(source.health?.current).toBe(100);
		});
	});
});
