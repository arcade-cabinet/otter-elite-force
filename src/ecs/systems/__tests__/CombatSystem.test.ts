import * as THREE from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectile } from "../../archetypes";
import { damageables, deadEntities, enemies, players, projectiles, world } from "../../world";
import {
	applyDamage,
	applyExplosionDamage,
	cleanupDead,
	fireWeapon,
	healEntity,
	updateHealthRegen,
	updateProjectileCollisions,
	updateSuppression,
} from "../CombatSystem";

// Mock dependencies
vi.mock("../../world", () => ({
	world: {
		entities: [],
		addComponent: vi.fn(),
		remove: vi.fn(),
	},
	damageables: [],
	enemies: [],
	players: [],
	projectiles: [],
	deadEntities: [],
}));

const mockRegisterHit = vi.fn();

vi.mock("../../../stores/gameStore", () => ({
	useGameStore: {
		getState: vi.fn(() => ({
			registerHit: mockRegisterHit,
		})),
	},
}));

vi.mock("../../archetypes", () => ({
	createProjectile: vi.fn(),
}));

describe("CombatSystem", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear mock arrays
		(damageables as unknown as any[]).length = 0;
		(enemies as unknown as any[]).length = 0;
		(players as unknown as any[]).length = 0;
		(projectiles as unknown as any[]).length = 0;
		(deadEntities as unknown as any[]).length = 0;
		(world.entities as unknown as any[]).length = 0;
	});

	describe("applyDamage", () => {
		it("should apply damage to an entity", () => {
			const entity = {
				id: "1",
				health: { current: 100, max: 100, lastDamageTime: 0 },
			};
			(damageables as unknown as any[]).push(entity);

			applyDamage("1", 20);

			expect(entity.health.current).toBe(80);
			expect(entity.health.lastDamageTime).toBeGreaterThan(0);
		});

		it("should apply suppression", () => {
			const entity = {
				id: "1",
				health: { current: 100, max: 100, lastDamageTime: 0 },
				suppression: { amount: 0, lastIncrementTime: 0, decayRate: 1 },
			};
			(damageables as unknown as any[]).push(entity);

			applyDamage("1", 10);

			// 10 * 5 = 50 suppression
			expect(entity.suppression.amount).toBe(50);
		});

		it("should kill an entity if damage exceeds health", () => {
			const entity = {
				id: "1",
				health: { current: 10, max: 100, lastDamageTime: 0 },
			};
			(damageables as unknown as any[]).push(entity);

			applyDamage("1", 20);

			expect(entity.health.current).toBe(0);
			expect(world.addComponent).toHaveBeenCalledWith(entity, "isDead", expect.any(Object));
		});

		it("should not damage invulnerable entities", () => {
			const entity = {
				id: "1",
				health: { current: 100, max: 100, lastDamageTime: 0, isInvulnerable: true },
			};
			(damageables as unknown as any[]).push(entity);

			applyDamage("1", 20);

			expect(entity.health.current).toBe(100);
		});

		it("should register hit via gameStore for player damage on enemies", () => {
			const player = { id: "player1" };
			const enemy = {
				id: "enemy1",
				health: { current: 100 },
				isEnemy: true,
				enemy: { type: "Gator", xpValue: 100 },
			};
			(damageables as unknown as any[]).push(enemy);
			(players as unknown as any[]).push(player);

			applyDamage("enemy1", 10, "kinetic", "player1");

			expect(mockRegisterHit).toHaveBeenCalled();
		});
	});

	describe("healEntity", () => {
		it("should heal an entity", () => {
			const entity = {
				id: "1",
				health: { current: 50, max: 100 },
			};
			(damageables as unknown as any[]).push(entity);

			healEntity("1", 20);

			expect(entity.health.current).toBe(70);
		});

		it("should not heal beyond max health", () => {
			const entity = {
				id: "1",
				health: { current: 90, max: 100 },
			};
			(damageables as unknown as any[]).push(entity);

			healEntity("1", 20);

			expect(entity.health.current).toBe(100);
		});
	});

	describe("fireWeapon", () => {
		it("should create projectile when firing", () => {
			const entity = {
				id: "1",
				weapon: { lastFireTime: 0, fireRate: 1, ammo: 10, bulletSpeed: 10, damage: 10, range: 100 },
				transform: { position: new THREE.Vector3(), rotation: new THREE.Euler() },
			};
			(world.entities as unknown as any[]).push(entity);

			const result = fireWeapon("1", new THREE.Vector3(1, 0, 0));

			expect(result).toBe(true);
			expect(createProjectile).toHaveBeenCalled();
			expect(entity.weapon.ammo).toBe(9);
			expect(entity.weapon.isFiring).toBe(true);
		});

		it("should not fire if on cooldown", () => {
			const entity = {
				id: "1",
				weapon: { lastFireTime: Date.now(), fireRate: 1, ammo: 10 },
				transform: { position: new THREE.Vector3() },
			};
			(world.entities as unknown as any[]).push(entity);

			const result = fireWeapon("1", new THREE.Vector3(1, 0, 0));

			expect(result).toBe(false);
			expect(createProjectile).not.toHaveBeenCalled();
		});

		it("should not fire if out of ammo", () => {
			const entity = {
				id: "1",
				weapon: { lastFireTime: 0, fireRate: 1, ammo: 0 },
				transform: { position: new THREE.Vector3() },
			};
			(world.entities as unknown as any[]).push(entity);

			const result = fireWeapon("1", new THREE.Vector3(1, 0, 0));

			expect(result).toBe(false);
			expect(createProjectile).not.toHaveBeenCalled();
		});
	});

	describe("updateProjectileCollisions", () => {
		it("should handle collisions", () => {
			const player = {
				id: "player1",
				transform: { position: new THREE.Vector3(0, 0, 0) },
				collider: { radius: 1 },
				health: { current: 100, max: 100 }, // Add health so applyDamage works
			};
			const projectile = {
				transform: { position: new THREE.Vector3(0, 0, 0) },
				damage: { amount: 10, type: "kinetic", source: "enemy1" },
				collider: { radius: 0.1 },
			};

			(players as unknown as any[]).push(player);
			(damageables as unknown as any[]).push(player); // Add to damageables for applyDamage lookup
			(projectiles as unknown as any[]).push(projectile);

			updateProjectileCollisions();

			expect(player.health.current).toBe(90);
			expect(world.addComponent).toHaveBeenCalledWith(projectile, "isDead", expect.any(Object));
		});
	});

	describe("updateSuppression", () => {
		it("should decay suppression", () => {
			const entity = {
				suppression: { amount: 50, decayRate: 10 },
			};
			(enemies as unknown as any[]).push(entity);

			updateSuppression(1.0); // 1 second

			expect(entity.suppression.amount).toBe(40);
		});
	});

	describe("updateHealthRegen", () => {
		it("should regen health if not recently damaged", () => {
			const entity = {
				health: {
					current: 50,
					max: 100,
					regenRate: 5,
					lastDamageTime: Date.now() - 5000, // 5 seconds ago
				},
			};
			(damageables as unknown as any[]).push(entity);

			updateHealthRegen(1.0);

			expect(entity.health.current).toBe(55);
		});

		it("should not regen if recently damaged", () => {
			const entity = {
				health: {
					current: 50,
					max: 100,
					regenRate: 5,
					lastDamageTime: Date.now(), // just now
				},
			};
			(damageables as unknown as any[]).push(entity);

			updateHealthRegen(1.0);

			expect(entity.health.current).toBe(50);
		});
	});

	describe("cleanupDead", () => {
		it("should remove dead entities", () => {
			const entity = { id: "dead1" };
			(deadEntities as unknown as any[]).push(entity);

			cleanupDead();

			expect(world.remove).toHaveBeenCalledWith(entity);
		});
	});

	describe("applyExplosionDamage", () => {
		it("should damage entities in radius", () => {
			const entity = {
				id: "1",
				health: { current: 100, max: 100, lastDamageTime: 0 },
				transform: { position: new THREE.Vector3(0, 0, 0) },
			};
			(damageables as unknown as any[]).push(entity);

			// Explosion at origin, radius 10, damage 100
			// Distance 0 -> 100 damage
			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 100);

			expect(entity.health.current).toBe(0);
		});

		it("should apply falloff damage", () => {
			const entity = {
				id: "1",
				health: { current: 100, max: 100, lastDamageTime: 0 },
				transform: { position: new THREE.Vector3(5, 0, 0) },
			};
			(damageables as unknown as any[]).push(entity);

			// Explosion at origin, radius 10, damage 100
			// Distance 5 -> 50% falloff -> 50 damage
			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 100);

			expect(entity.health.current).toBe(50);
		});

		it("should not damage source", () => {
			const entity = {
				id: "source",
				health: { current: 100, max: 100 },
				transform: { position: new THREE.Vector3(0, 0, 0) },
			};
			(damageables as unknown as any[]).push(entity);

			applyExplosionDamage(new THREE.Vector3(0, 0, 0), 10, 100, "source");

			expect(entity.health.current).toBe(100);
		});
	});
});
