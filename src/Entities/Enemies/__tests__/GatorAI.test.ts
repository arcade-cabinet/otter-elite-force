import { Vector3 } from "@babylonjs/core";
import { GatorAI } from "../GatorAI";

// Mock YUKA - must be hoisted before imports
jest.mock("yuka", () => {
	class YukaVector3 {
		x = 0;
		y = 0;
		z = 0;
		constructor(x = 0, y = 0, z = 0) {
			this.x = x;
			this.y = y;
			this.z = z;
		}
		set(x: number, y: number, z: number) {
			this.x = x;
			this.y = y;
			this.z = z;
			return this;
		}
		copy(v: { x: number; y: number; z: number }) {
			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
			return this;
		}
		add(v: { x: number; y: number; z: number }) {
			this.x += v.x;
			this.y += v.y;
			this.z += v.z;
			return this;
		}
		distanceTo(v: { x: number; y: number; z: number }) {
			const dx = this.x - v.x;
			const dy = this.y - v.y;
			const dz = this.z - v.z;
			return Math.sqrt(dx * dx + dy * dy + dz * dz);
		}
	}

	class Vehicle {
		position = new YukaVector3();
		velocity = new YukaVector3();
		maxSpeed = 0;
		steering = {
			add: jest.fn(),
			clear: jest.fn(),
		};
		update = jest.fn();
	}

	class MockBehavior {
		target = new YukaVector3();
	}

	return {
		Vehicle,
		Vector3: YukaVector3,
		SeekBehavior: MockBehavior,
		FleeBehavior: MockBehavior,
		WanderBehavior: jest.fn(),
		EntityManager: jest.fn().mockImplementation(() => ({
			clear: jest.fn(),
		})),
	};
});

// Use require() to get the mocked yuka (avoids dynamic import / --experimental-vm-modules requirement)
const YUKA = require("yuka");

describe("GatorAI", () => {
	let vehicle: InstanceType<typeof YUKA.Vehicle>;
	let gatorAI: GatorAI;

	beforeEach(() => {
		vehicle = new YUKA.Vehicle();
		gatorAI = new GatorAI(vehicle);
	});

	it("should start in IDLE state", () => {
		expect(gatorAI.getState()).toBe("IDLE");
	});

	it("should transition from IDLE to STALK when player is within range", () => {
		const playerPos = new Vector3(12, 0, 0);
		vehicle.position.set(0, 0, 0);

		gatorAI.update(0.1, playerPos, 10, 0);
		expect(gatorAI.getState()).toBe("STALK");
	});

	it("should transition to AMBUSH when player is very close", () => {
		const playerPos = new Vector3(5, 0, 0);
		vehicle.position.set(0, 0, 0);

		// First transition to STALK
		gatorAI.update(0.1, playerPos, 10, 0);
		// Then transition to AMBUSH
		gatorAI.update(0.1, playerPos, 10, 0);
		expect(gatorAI.getState()).toBe("AMBUSH");
	});

	it("should transition to RETREAT when health is low", () => {
		const playerPos = new Vector3(30, 0, 0);
		gatorAI.update(0.1, playerPos, 1, 0);
		expect(gatorAI.getState()).toBe("RETREAT");
	});

	it("should transition to SUPPRESSED when suppression is high", () => {
		const playerPos = new Vector3(30, 0, 0);
		gatorAI.update(0.1, playerPos, 10, 1.0);
		expect(gatorAI.getState()).toBe("SUPPRESSED");
	});

	it("should exit RETREAT state after timer and distance", () => {
		const playerPos = new Vector3(50, 0, 0);
		gatorAI.update(0.1, playerPos, 1, 0); // Enter retreat
		expect(gatorAI.getState()).toBe("RETREAT");

		// Simulate 6 seconds passing (RETREAT_DURATION is 5)
		gatorAI.update(6, playerPos, 1, 0);
		expect(gatorAI.getState()).toBe("IDLE");
	});
});
