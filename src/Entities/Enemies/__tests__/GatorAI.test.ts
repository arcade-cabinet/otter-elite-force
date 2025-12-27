import * as THREE from "three";
import * as YUKA from "yuka";
import { GatorAI } from "../GatorAI";

// Mock YUKA
jest.mock("yuka", () => ({
	Vehicle: jest.fn().mockImplementation(() => ({
		position: new THREE.Vector3(),
		velocity: new THREE.Vector3(),
		maxSpeed: 0,
		steering: {
			add: jest.fn(),
			clear: jest.fn(),
		},
		update: jest.fn(),
	})),
	Vector3: jest.fn().mockImplementation((x, y, z) => new THREE.Vector3(x, y, z)),
	SeekBehavior: jest.fn().mockImplementation(() => ({ target: new THREE.Vector3() })),
	FleeBehavior: jest.fn().mockImplementation(() => ({ target: new THREE.Vector3() })),
	WanderBehavior: jest.fn(),
	EntityManager: jest.fn().mockImplementation(() => ({
		clear: jest.fn(),
	})),
}));

describe("GatorAI", () => {
	let vehicle: any;
	let entityManager: any;
	let gatorAI: GatorAI;

	beforeEach(() => {
		vehicle = new YUKA.Vehicle();
		entityManager = new YUKA.EntityManager();
		gatorAI = new GatorAI(vehicle, entityManager);
	});

	it("should start in IDLE state", () => {
		expect(gatorAI.getState()).toBe("IDLE");
	});

	it("should transition from IDLE to STALK when player is within range", () => {
		const playerPos = new THREE.Vector3(10, 0, 0);
		vehicle.position.set(0, 0, 0);
		
		gatorAI.update(0.1, playerPos, 10, 0);
		expect(gatorAI.getState()).toBe("STALK");
	});

	it("should transition to AMBUSH when player is very close", () => {
		const playerPos = new THREE.Vector3(5, 0, 0);
		vehicle.position.set(0, 0, 0);
		
		gatorAI.update(0.1, playerPos, 10, 0);
		expect(gatorAI.getState()).toBe("AMBUSH");
	});

	it("should transition to RETREAT when health is low", () => {
		const playerPos = new THREE.Vector3(30, 0, 0);
		gatorAI.update(0.1, playerPos, 1, 0);
		expect(gatorAI.getState()).toBe("RETREAT");
	});

	it("should transition to SUPPRESSED when suppression is high", () => {
		const playerPos = new THREE.Vector3(30, 0, 0);
		gatorAI.update(0.1, playerPos, 10, 1.0);
		expect(gatorAI.getState()).toBe("SUPPRESSED");
	});

	it("should exit RETREAT state after timer and distance", () => {
		const playerPos = new THREE.Vector3(50, 0, 0);
		gatorAI.update(0.1, playerPos, 1, 0); // Enter retreat
		expect(gatorAI.getState()).toBe("RETREAT");

		// Simulate 6 seconds passing (RETREAT_DURATION is 5)
		gatorAI.update(6, playerPos, 1, 0);
		expect(gatorAI.getState()).toBe("IDLE");
	});
});
