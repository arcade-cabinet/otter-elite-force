/**
 * Player Archetype Tests
 */

import { Vector3 } from "@babylonjs/core";
// Mock the world module before importing
jest.mock("../../world", () => {
	let idCounter = 0;
	return {
		generateId: jest.fn(() => `entity-${++idCounter}`),
		world: {
			add: jest.fn((entity) => entity),
		},
	};
});

import { world } from "../../world";
import { type CreatePlayerOptions, createPlayer } from "../player";

describe("createPlayer", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const defaultOptions: CreatePlayerOptions = {
		position: new Vector3(10, 0, 20),
		characterId: "bubbles",
		name: "Sgt. Bubbles",
		furColor: "#8B4513",
		eyeColor: "#000000",
		whiskerLength: 0.3,
		grizzled: true,
		baseSpeed: 8,
		baseHealth: 100,
		climbSpeed: 4,
		headgear: "bandana",
		vest: "tactical",
		backgear: "radio",
		weaponId: "service-pistol",
	};

	it("should create player entity with correct transform", () => {
		createPlayer(defaultOptions);

		expect(world.add).toHaveBeenCalledWith(
			expect.objectContaining({
				transform: expect.objectContaining({
					position: expect.any(Vector3),
				}),
			}),
		);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.transform!.position.x).toBe(10);
		expect(calledWith.transform!.position.z).toBe(20);
	});

	it("should set velocity maxSpeed from baseSpeed", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.velocity!.maxSpeed).toBe(8);
	});

	it("should set health from baseHealth", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.health!.current).toBe(100);
		expect(calledWith.health!.max).toBe(100);
	});

	it("should set character stats correctly", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.characterStats).toEqual({
			id: "bubbles",
			name: "Sgt. Bubbles",
			baseSpeed: 8,
			baseHealth: 100,
			climbSpeed: 4,
		});
	});

	it("should set character appearance correctly", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.characterAppearance).toEqual({
			furColor: "#8B4513",
			eyeColor: "#000000",
			whiskerLength: 0.3,
			grizzled: true,
		});
	});

	it("should set character gear correctly", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.characterGear).toEqual({
			headgear: "bandana",
			vest: "tactical",
			backgear: "radio",
			weaponId: "service-pistol",
		});
	});

	it("should set weapon with correct id", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.weapon!.id).toBe("service-pistol");
	});

	it("should set player collider with correct layer", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider!.layer).toBe("player");
		expect(calledWith.collider!.radius).toBe(0.5);
		expect(calledWith.collider!.height).toBe(1.8);
	});

	it("should set renderable type to player_otter", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable!.type).toBe("player_otter");
		expect(calledWith.renderable!.visible).toBe(true);
	});

	it("should set isPlayer tag", () => {
		createPlayer(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isPlayer).toEqual({ __tag: "IsPlayer" });
	});

	it("should handle different headgear options", () => {
		const options = { ...defaultOptions, headgear: "helmet" as const };
		createPlayer(options);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.characterGear!.headgear).toBe("helmet");
	});

	it("should handle no gear options", () => {
		const options = {
			...defaultOptions,
			headgear: "none" as const,
			vest: "none" as const,
			backgear: "none" as const,
		};
		createPlayer(options);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.characterGear!.headgear).toBe("none");
		expect(calledWith.characterGear!.vest).toBe("none");
		expect(calledWith.characterGear!.backgear).toBe("none");
	});

	it("should clone position to avoid mutation", () => {
		const originalPosition = new Vector3(5, 0, 10);
		createPlayer({ ...defaultOptions, position: originalPosition });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		// Verify position was cloned
		expect(calledWith.transform!.position).not.toBe(originalPosition);
		expect(calledWith.transform!.position.x).toBe(5);
		expect(calledWith.transform!.position.z).toBe(10);
	});
});
