/**
 * Projectile Archetype Tests
 */

import * as THREE from "three";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the world module
vi.mock("../../world", () => {
	let idCounter = 0;
	return {
		generateId: vi.fn(() => `entity-${++idCounter}`),
		world: {
			add: vi.fn((entity) => entity),
		},
	};
});

import { createProjectile, type CreateProjectileOptions } from "../projectiles";
import { world } from "../../world";

describe("createProjectile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateProjectileOptions = {
		position: new THREE.Vector3(0, 1, 0),
		direction: new THREE.Vector3(1, 0, 0),
		speed: 50,
		damage: 10,
		damageType: "kinetic",
		sourceId: "player-1",
		range: 30,
	};

	it("should create projectile with correct velocity", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.velocity!.maxSpeed).toBe(50);
		// Velocity should be direction * speed
		expect(calledWith.velocity!.linear.x).toBe(50);
		expect(calledWith.velocity!.linear.z).toBe(0);
	});

	it("should normalize direction and apply speed", () => {
		const options = {
			...defaultOptions,
			direction: new THREE.Vector3(3, 0, 4), // Length 5, will be normalized
			speed: 100,
		};
		createProjectile(options);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		// After normalization: (0.6, 0, 0.8) * 100 = (60, 0, 80)
		expect(calledWith.velocity!.linear.x).toBeCloseTo(60);
		expect(calledWith.velocity!.linear.z).toBeCloseTo(80);
	});

	it("should set damage component", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.damage!.amount).toBe(10);
		expect(calledWith.damage!.type).toBe("kinetic");
		expect(calledWith.damage!.source).toBe("player-1");
	});

	it("should set damage knockback", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.damage!.knockback).toBe(0.5);
	});

	it("should set lifetime based on range and speed", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		// lifetime = range / speed = 30 / 50 = 0.6
		expect(calledWith.lifetime!.remaining).toBeCloseTo(0.6);
		expect(calledWith.lifetime!.onExpire).toBe("destroy");
	});

	it("should set collider for projectile", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider!.radius).toBe(0.1);
		expect(calledWith.collider!.layer).toBe("projectile");
	});

	it("should set isProjectile tag", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isProjectile).toEqual({ __tag: "IsProjectile" });
	});

	it("should set renderable type", () => {
		createProjectile(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable!.type).toBe("projectile");
		expect(calledWith.renderable!.castShadow).toBe(false);
	});

	it("should set rotation based on velocity direction", () => {
		const options = {
			...defaultOptions,
			direction: new THREE.Vector3(0, 0, 1), // Forward
		};
		createProjectile(options);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		// atan2(0, 1) = 0 (facing forward)
		expect(calledWith.transform!.rotation.y).toBeCloseTo(0);
	});

	it("should handle explosive damage type", () => {
		createProjectile({ ...defaultOptions, damageType: "explosive" });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.damage!.type).toBe("explosive");
	});

	it("should handle fire damage type", () => {
		createProjectile({ ...defaultOptions, damageType: "fire" });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.damage!.type).toBe("fire");
	});

	it("should handle toxic damage type", () => {
		createProjectile({ ...defaultOptions, damageType: "toxic" });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.damage!.type).toBe("toxic");
	});

	it("should clone position to avoid mutation", () => {
		const originalPosition = new THREE.Vector3(5, 2, 10);
		createProjectile({ ...defaultOptions, position: originalPosition });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform!.position).not.toBe(originalPosition);
		expect(calledWith.transform!.position.x).toBe(5);
	});
});
