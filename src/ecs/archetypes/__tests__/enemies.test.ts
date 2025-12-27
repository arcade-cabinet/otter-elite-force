/**
 * Enemy Archetypes Tests
 */

import * as THREE from "three";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock yuka before importing
vi.mock("yuka", () => {
	class MockVehicle {
		position = { set: vi.fn(), x: 0, y: 0, z: 0 };
		maxSpeed = 0;
	}
	return {
		Vehicle: MockVehicle,
	};
});

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

import {
	createGator,
	createSnake,
	createSnapper,
	createScout,
	type CreateGatorOptions,
	type CreateSnakeOptions,
	type CreateSnapperOptions,
	type CreateScoutOptions,
} from "../enemies";
import { world } from "../../world";

describe("createGator", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateGatorOptions = {
		position: new THREE.Vector3(10, 0, 20),
		isHeavy: false,
	};

	it("should create light gator with correct health", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.health.current).toBe(10);
		expect(calledWith.health.max).toBe(10);
	});

	it("should create heavy gator with correct health", () => {
		createGator({ ...defaultOptions, isHeavy: true });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.health.current).toBe(20);
		expect(calledWith.health.max).toBe(20);
	});

	it("should set light gator speed", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.velocity.maxSpeed).toBe(7);
	});

	it("should set heavy gator speed", () => {
		createGator({ ...defaultOptions, isHeavy: true });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.velocity.maxSpeed).toBe(4);
	});

	it("should set correct tier based on isHeavy", () => {
		createGator(defaultOptions);
		expect(vi.mocked(world.add).mock.calls[0][0].enemy.tier).toBe("light");

		vi.clearAllMocks();
		createGator({ ...defaultOptions, isHeavy: true });
		expect(vi.mocked(world.add).mock.calls[0][0].enemy.tier).toBe("heavy");
	});

	it("should set enemy type to gator", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.type).toBe("gator");
	});

	it("should set gator-specific components", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.gator).toEqual({
			isSubmerged: true,
			ambushCooldown: 0,
			ambushDuration: 3,
		});
	});

	it("should set isEnemy tag", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isEnemy).toEqual({ __tag: "IsEnemy" });
	});

	it("should set chunkReference when chunkId provided", () => {
		createGator({ ...defaultOptions, chunkId: "chunk-1,2" });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference).toBeDefined();
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-1,2");
	});

	it("should not set chunkReference when chunkId not provided", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference).toBeUndefined();
	});

	it("should scale heavy gator larger", () => {
		createGator({ ...defaultOptions, isHeavy: true });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform.scale.x).toBe(1.6);
		expect(calledWith.transform.scale.y).toBe(1.6);
		expect(calledWith.transform.scale.z).toBe(1.6);
	});

	it("should set heavy gator xp value higher", () => {
		createGator({ ...defaultOptions, isHeavy: true });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.xpValue).toBe(50);
	});

	it("should set light gator xp value", () => {
		createGator(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.xpValue).toBe(20);
	});
});

describe("createSnake", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateSnakeOptions = {
		position: new THREE.Vector3(5, 2, 10),
		anchorHeight: 3,
	};

	it("should create snake with correct health", () => {
		createSnake(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.health.current).toBe(5);
		expect(calledWith.health.max).toBe(5);
	});

	it("should set enemy type to snake", () => {
		createSnake(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.type).toBe("snake");
	});

	it("should set snake-specific components with anchor position", () => {
		createSnake(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.snake.segmentCount).toBe(8);
		expect(calledWith.snake.strikeRange).toBe(3);
		expect(calledWith.snake.isStriking).toBe(false);
		expect(calledWith.snake.anchorPosition.y).toBe(3);
	});

	it("should set isEnemy tag", () => {
		createSnake(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isEnemy).toEqual({ __tag: "IsEnemy" });
	});

	it("should set animated to coiled animation", () => {
		createSnake(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.animated.currentAnimation).toBe("coiled");
	});
});

describe("createSnapper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateSnapperOptions = {
		position: new THREE.Vector3(15, 0, 25),
	};

	it("should create snapper with correct health", () => {
		createSnapper(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.health.current).toBe(30);
		expect(calledWith.health.max).toBe(30);
	});

	it("should set enemy type to snapper", () => {
		createSnapper(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.type).toBe("snapper");
		expect(calledWith.enemy.tier).toBe("heavy");
	});

	it("should set snapper-specific components", () => {
		createSnapper(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.snapper).toEqual({
			turretRotation: 0,
			turretTargetRotation: 0,
			isOverheated: false,
			heatLevel: 0,
		});
	});

	it("should set high xp value", () => {
		createSnapper(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.xpValue).toBe(75);
	});

	it("should include upgrade_token in loot table", () => {
		createSnapper(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.lootTable).toContain("upgrade_token");
	});

	it("should set higher suppression threshold", () => {
		createSnapper(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.suppression.threshold).toBe(0.8);
	});
});

describe("createScout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateScoutOptions = {
		position: new THREE.Vector3(0, 0, 0),
	};

	it("should create scout with correct health", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.health.current).toBe(3);
		expect(calledWith.health.max).toBe(3);
	});

	it("should set enemy type to scout", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.type).toBe("scout");
		expect(calledWith.enemy.tier).toBe("light");
	});

	it("should set scout-specific components", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.scout).toEqual({
			hasSpottedPlayer: false,
			signalCooldown: 0,
			isSignaling: false,
			fleeDistance: 15,
		});
	});

	it("should set packMember when packId provided", () => {
		createScout({ ...defaultOptions, packId: "pack-alpha" });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.packMember).toBeDefined();
		expect(calledWith.packMember?.packId).toBe("pack-alpha");
		expect(calledWith.packMember?.role).toBe("scout");
		expect(calledWith.packMember?.signalRange).toBe(25);
	});

	it("should not set packMember when packId not provided", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.packMember).toBeUndefined();
	});

	it("should set high max speed for evasion", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.velocity.maxSpeed).toBe(10);
	});

	it("should start in patrol state", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.aiBrain.currentState).toBe("patrol");
	});

	it("should set low xp value", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.enemy.xpValue).toBe(10);
	});

	it("should have scurry animation", () => {
		createScout(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.animated.currentAnimation).toBe("scurry");
		expect(calledWith.animated.animationSpeed).toBe(1.5);
	});
});
