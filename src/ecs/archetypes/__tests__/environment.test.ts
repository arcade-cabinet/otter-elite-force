/**
 * Environment Archetypes Tests
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

import {
	createOilSlick,
	createMudPit,
	createToxicSludge,
	createPlatform,
	type CreateOilSlickOptions,
	type CreateMudPitOptions,
	type CreateToxicSludgeOptions,
	type CreatePlatformOptions,
} from "../environment";
import { world } from "../../world";

describe("createOilSlick", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateOilSlickOptions = {
		position: new THREE.Vector3(10, 0, 20),
	};

	it("should create oil slick with default size", () => {
		createOilSlick(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.oilSlick.size).toBe(3);
	});

	it("should create oil slick with custom size", () => {
		createOilSlick({ ...defaultOptions, size: 5 });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.oilSlick.size).toBe(5);
	});

	it("should set hazard type correctly", () => {
		createOilSlick(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.hazard.type).toBe("oil_slick");
		expect(calledWith.hazard.damagePerSecond).toBe(0);
		expect(calledWith.hazard.slowFactor).toBe(0.7);
	});

	it("should set oilSlick ignition properties", () => {
		createOilSlick(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.oilSlick.isIgnited).toBe(false);
		expect(calledWith.oilSlick.burnDuration).toBe(15);
	});

	it("should set isEnvironment tag", () => {
		createOilSlick(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isEnvironment).toEqual({ __tag: "IsEnvironment" });
	});

	it("should scale transform based on size", () => {
		createOilSlick({ ...defaultOptions, size: 4 });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform.scale.x).toBe(4);
		expect(calledWith.transform.scale.z).toBe(4);
	});

	it("should set collider layer to trigger", () => {
		createOilSlick(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider.layer).toBe("trigger");
	});
});

describe("createMudPit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateMudPitOptions = {
		position: new THREE.Vector3(0, 0, 0),
	};

	it("should create mud pit with default size", () => {
		createMudPit(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform.scale.x).toBe(4);
	});

	it("should create mud pit with custom size", () => {
		createMudPit({ ...defaultOptions, size: 6 });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform.scale.x).toBe(6);
	});

	it("should set hazard type correctly", () => {
		createMudPit(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.hazard.type).toBe("mud_pit");
		expect(calledWith.hazard.damagePerSecond).toBe(0);
		expect(calledWith.hazard.slowFactor).toBe(0.4);
	});

	it("should set isEnvironment tag", () => {
		createMudPit(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isEnvironment).toEqual({ __tag: "IsEnvironment" });
	});

	it("should set renderable type", () => {
		createMudPit(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable.type).toBe("mud_pit");
	});
});

describe("createToxicSludge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreateToxicSludgeOptions = {
		position: new THREE.Vector3(5, 0, 5),
	};

	it("should create toxic sludge with default size", () => {
		createToxicSludge(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform.scale.x).toBe(3);
	});

	it("should set hazard with damage per second", () => {
		createToxicSludge(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.hazard.type).toBe("toxic_sludge");
		expect(calledWith.hazard.damagePerSecond).toBe(5);
		expect(calledWith.hazard.slowFactor).toBe(0.6);
	});

	it("should have particle emitter for smoke", () => {
		createToxicSludge(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.particleEmitter).toBeDefined();
		expect(calledWith.particleEmitter.type).toBe("smoke");
		expect(calledWith.particleEmitter.isEmitting).toBe(true);
	});

	it("should set isEnvironment tag", () => {
		createToxicSludge(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isEnvironment).toEqual({ __tag: "IsEnvironment" });
	});

	it("should set chunkReference when provided", () => {
		createToxicSludge({ ...defaultOptions, chunkId: "chunk-0,0" });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-0,0");
	});
});

describe("createPlatform", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultOptions: CreatePlatformOptions = {
		position: new THREE.Vector3(0, 3, 0),
	};

	it("should create platform with default dimensions", () => {
		createPlatform(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.platform.width).toBe(5);
		expect(calledWith.platform.depth).toBe(5);
	});

	it("should create platform with custom dimensions", () => {
		createPlatform({ ...defaultOptions, width: 8, depth: 4 });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.platform.width).toBe(8);
		expect(calledWith.platform.depth).toBe(4);
	});

	it("should set collider radius based on max dimension", () => {
		createPlatform({ ...defaultOptions, width: 10, depth: 6 });

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider.radius).toBe(5); // max(10, 6) / 2
	});

	it("should initialize platform as non-moving", () => {
		createPlatform(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.platform.isMoving).toBe(false);
		expect(calledWith.platform.moveSpeed).toBe(0);
		expect(calledWith.platform.waypoints).toEqual([]);
	});

	it("should set isEnvironment tag", () => {
		createPlatform(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isEnvironment).toEqual({ __tag: "IsEnvironment" });
	});

	it("should set renderable type", () => {
		createPlatform(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable.type).toBe("platform");
		expect(calledWith.renderable.castShadow).toBe(true);
	});

	it("should set collider layer to environment", () => {
		createPlatform(defaultOptions);

		const calledWith = vi.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider.layer).toBe("environment");
	});
});
