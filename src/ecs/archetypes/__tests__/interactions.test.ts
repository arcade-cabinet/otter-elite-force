/**
 * Interaction Archetypes Tests
 */

import { Vector3 } from "@babylonjs/core";
// Mock the world module
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
import {
	type CreateRaftOptions,
	type CreateVillagerOptions,
	createRaft,
	createVillager,
} from "../interactions";

describe("createVillager", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const defaultOptions: CreateVillagerOptions = {
		position: new Vector3(10, 0, 20),
		type: "civilian",
	};

	it("should create civilian villager", () => {
		createVillager(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.villager!.type).toBe("civilian");
		expect(calledWith.villager!.dialogueId).toBe("villager_civilian");
	});

	it("should create healer villager with heal amount", () => {
		createVillager({ ...defaultOptions, type: "healer" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.villager!.type).toBe("healer");
		expect(calledWith.villager!.healAmount).toBe(50);
	});

	it("should create merchant villager without heal amount", () => {
		createVillager({ ...defaultOptions, type: "merchant" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.villager!.type).toBe("merchant");
		expect(calledWith.villager!.healAmount).toBeUndefined();
	});

	it("should set interactable prompt based on type", () => {
		createVillager({ ...defaultOptions, type: "healer" });
		expect(jest.mocked(world.add).mock.calls[0][0].interactable!.promptText).toBe("HEAL");

		jest.clearAllMocks();
		createVillager({ ...defaultOptions, type: "civilian" });
		expect(jest.mocked(world.add).mock.calls[0][0].interactable!.promptText).toBe("TALK");
	});

	it("should set renderable type based on villager type", () => {
		createVillager({ ...defaultOptions, type: "healer" });
		expect(jest.mocked(world.add).mock.calls[0][0].renderable!.type).toBe("healer");

		jest.clearAllMocks();
		createVillager({ ...defaultOptions, type: "civilian" });
		expect(jest.mocked(world.add).mock.calls[0][0].renderable!.type).toBe("villager");
	});

	it("should set isLiberated to false initially", () => {
		createVillager(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.villager!.isLiberated).toBe(false);
	});

	it("should set isInteractable tag", () => {
		createVillager(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isInteractable).toEqual({ __tag: "IsInteractable" });
	});

	it("should have idle animation", () => {
		createVillager(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.animated!.currentAnimation).toBe("idle");
	});

	it("should set chunkReference when provided", () => {
		createVillager({ ...defaultOptions, chunkId: "chunk-3,3" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-3,3");
	});

	it("should not set chunkReference when not provided", () => {
		createVillager(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference).toBeUndefined();
	});
});

describe("createRaft", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const defaultOptions: CreateRaftOptions = {
		position: new Vector3(0, 0, 0),
	};

	it("should create raft with vehicle component", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.vehicle).toBeDefined();
		expect(calledWith.vehicle!.type).toBe("raft");
		expect(calledWith.vehicle!.maxSpeed).toBe(15);
	});

	it("should set vehicle acceleration and turn rate", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.vehicle!.acceleration).toBe(8);
		expect(calledWith.vehicle!.turnRate).toBe(2);
	});

	it("should initialize as not piloted", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.vehicle!.isPiloted).toBe(false);
		expect(calledWith.vehicle!.pilotId).toBeNull();
	});

	it("should set velocity maxSpeed matching vehicle", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.velocity!.maxSpeed).toBe(15);
	});

	it("should set interactable for mounting", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.interactable!.type).toBe("mount");
		expect(calledWith.interactable!.promptText).toBe("BOARD RAFT");
		expect(calledWith.interactable!.range).toBe(2);
	});

	it("should set isInteractable tag", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isInteractable).toEqual({ __tag: "IsInteractable" });
	});

	it("should set renderable type", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable!.type).toBe("raft");
		expect(calledWith.renderable!.castShadow).toBe(true);
	});

	it("should set collider layer to environment", () => {
		createRaft(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider!.layer).toBe("environment");
	});

	it("should set chunkReference when provided", () => {
		createRaft({ ...defaultOptions, chunkId: "chunk-1,1" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-1,1");
	});
});
