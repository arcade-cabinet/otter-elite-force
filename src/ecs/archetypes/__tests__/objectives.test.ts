/**
 * Objective Archetypes Tests
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
	type CreateExtractionPointOptions,
	type CreatePrisonCageOptions,
	type CreateSiphonOptions,
	createExtractionPoint,
	createPrisonCage,
	createSiphon,
} from "../objectives";

describe("createSiphon", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const defaultOptions: CreateSiphonOptions = {
		position: new Vector3(10, 0, 20),
	};

	it("should create siphon with destructible component", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.destructible).toBeDefined();
		expect(calledWith.destructible!.hp).toBe(50);
		expect(calledWith.destructible!.maxHp).toBe(50);
		expect(calledWith.destructible!.isDestroyed).toBe(false);
	});

	it("should set objective type to siphon", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.objective!.type).toBe("siphon");
		expect(calledWith.objective!.isCompleted).toBe(false);
		expect(calledWith.objective!.isActive).toBe(true);
	});

	it("should set progress required matching destructible hp", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.objective!.progressRequired).toBe(50);
		expect(calledWith.objective!.currentProgress).toBe(0);
	});

	it("should have smoke particle emitter", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.particleEmitter).toBeDefined();
		expect(calledWith.particleEmitter!.type).toBe("smoke");
		expect(calledWith.particleEmitter!.isEmitting).toBe(true);
	});

	it("should set isObjective tag", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isObjective).toEqual({ __tag: "IsObjective" });
	});

	it("should set renderable type", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable!.type).toBe("siphon");
	});

	it("should set chunkReference when provided", () => {
		createSiphon({ ...defaultOptions, chunkId: "chunk-5,5" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-5,5");
	});

	it("should set collider layer to environment", () => {
		createSiphon(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider!.layer).toBe("environment");
	});
});

describe("createPrisonCage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const defaultOptions: CreatePrisonCageOptions = {
		position: new Vector3(5, 0, 10),
		characterId: "gen-whiskers",
	};

	it("should create prison cage with rescuable component", () => {
		createPrisonCage(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.rescuable).toBeDefined();
		expect(calledWith.rescuable!.characterId).toBe("gen-whiskers");
		expect(calledWith.rescuable!.isRescued).toBe(false);
	});

	it("should set dialogue id based on character", () => {
		createPrisonCage(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.rescuable!.dialogueId).toBe("rescue_gen-whiskers");
	});

	it("should set objective type to prison_cage", () => {
		createPrisonCage(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.objective!.type).toBe("prison_cage");
		expect(calledWith.objective!.progressRequired).toBe(1);
	});

	it("should set interactable for rescue", () => {
		createPrisonCage(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.interactable!.type).toBe("rescue");
		expect(calledWith.interactable!.promptText).toBe("RESCUE");
		expect(calledWith.interactable!.range).toBe(3);
	});

	it("should set isObjective and isInteractable tags", () => {
		createPrisonCage(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isObjective).toEqual({ __tag: "IsObjective" });
		expect(calledWith.isInteractable).toEqual({ __tag: "IsInteractable" });
	});

	it("should set renderable type", () => {
		createPrisonCage(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable!.type).toBe("prison_cage");
	});

	it("should set chunkReference when provided", () => {
		createPrisonCage({ ...defaultOptions, chunkId: "chunk-10,10" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-10,10");
	});
});

describe("createExtractionPoint", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const defaultOptions: CreateExtractionPointOptions = {
		position: new Vector3(0, 0, 0),
	};

	it("should set objective type to extraction_point", () => {
		createExtractionPoint(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.objective!.type).toBe("extraction_point");
		expect(calledWith.objective!.isActive).toBe(true);
	});

	it("should set interactable for extraction", () => {
		createExtractionPoint(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.interactable!.type).toBe("use");
		expect(calledWith.interactable!.promptText).toBe("EXTRACT");
		expect(calledWith.interactable!.range).toBe(5);
	});

	it("should set large collider radius", () => {
		createExtractionPoint(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.collider!.radius).toBe(5);
		expect(calledWith.collider!.layer).toBe("trigger");
	});

	it("should set isObjective and isInteractable tags", () => {
		createExtractionPoint(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.isObjective).toEqual({ __tag: "IsObjective" });
		expect(calledWith.isInteractable).toEqual({ __tag: "IsInteractable" });
	});

	it("should set renderable type", () => {
		createExtractionPoint(defaultOptions);

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.renderable!.type).toBe("extraction_point");
		expect(calledWith.renderable!.castShadow).toBe(false);
	});

	it("should set chunkReference when provided", () => {
		createExtractionPoint({ ...defaultOptions, chunkId: "chunk-0,0" });

		const calledWith = jest.mocked(world.add).mock.calls[0][0];
		expect(calledWith.chunkReference?.chunkId).toBe("chunk-0,0");
	});
});
