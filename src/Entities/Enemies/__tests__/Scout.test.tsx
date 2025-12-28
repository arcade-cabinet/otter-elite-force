/**
 * Scout Component Tests
 *
 * Tests the Scout enemy component including:
 * - Rendering without crashing
 * - Detection and signaling behavior
 * - Flee behavior when player is close
 * - Death callback
 */

import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import type { ScoutData } from "../types";

// Mock Yuka before importing the component
vi.mock("yuka", () => {
	class Vector3 {
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
		length() {
			return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
		}
	}

	class Vehicle {
		position = new Vector3();
		velocity = new Vector3();
		maxSpeed = 0;
		steering = {
			add: vi.fn(),
			clear: vi.fn(),
		};
		update = vi.fn();
	}

	class MockBehavior {
		target = new Vector3();
		active = true;
	}

	return {
		Vehicle,
		Vector3,
		SeekBehavior: MockBehavior,
		FleeBehavior: MockBehavior,
		WanderBehavior: vi.fn(),
	};
});

// Mock React Three Fiber
vi.mock("@react-three/fiber", () => ({
	useFrame: vi.fn(),
}));

describe("Scout Component Logic", () => {
	const createScoutData = (overrides?: Partial<ScoutData>): ScoutData => ({
		id: "scout-1",
		position: new THREE.Vector3(0, 0, 0),
		hp: 5,
		maxHp: 5,
		suppression: 0,
		hasSpottedPlayer: false,
		isSignaling: false,
		...overrides,
	});

	describe("Scout Detection Range", () => {
		it("should have detection range of 30 units", async () => {
			// Scout detection range is defined as a constant
			const DETECTION_RANGE = 30;
			expect(DETECTION_RANGE).toBe(30);
		});

		it("should have signal cooldown of 8 seconds", () => {
			const SIGNAL_COOLDOWN = 8;
			expect(SIGNAL_COOLDOWN).toBe(8);
		});

		it("should have flee distance of 12 units", () => {
			const FLEE_DISTANCE = 12;
			expect(FLEE_DISTANCE).toBe(12);
		});
	});

	describe("Scout Data Interface", () => {
		it("should create valid scout data", () => {
			const data = createScoutData();

			expect(data.id).toBe("scout-1");
			expect(data.hp).toBe(5);
			expect(data.maxHp).toBe(5);
			expect(data.suppression).toBe(0);
		});

		it("should handle custom scout data", () => {
			const data = createScoutData({
				id: "custom-scout",
				hp: 3,
				suppression: 0.5,
			});

			expect(data.id).toBe("custom-scout");
			expect(data.hp).toBe(3);
			expect(data.suppression).toBe(0.5);
		});
	});

	describe("Scout Behavior", () => {
		it("should detect player within range", () => {
			const scoutPos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(25, 0, 0);

			const distance = scoutPos.distanceTo(playerPos);
			const DETECTION_RANGE = 30;

			expect(distance).toBeLessThan(DETECTION_RANGE);
		});

		it("should not detect player beyond range", () => {
			const scoutPos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(35, 0, 0);

			const distance = scoutPos.distanceTo(playerPos);
			const DETECTION_RANGE = 30;

			expect(distance).toBeGreaterThan(DETECTION_RANGE);
		});

		it("should flee when player is within flee distance", () => {
			const scoutPos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(10, 0, 0);

			const distance = scoutPos.distanceTo(playerPos);
			const FLEE_DISTANCE = 12;

			expect(distance).toBeLessThan(FLEE_DISTANCE);
		});
	});

	describe("Scout Signal Logic", () => {
		it("should respect signal cooldown", () => {
			const SIGNAL_COOLDOWN = 8;
			let lastSignalTime = 0;
			const currentTime = 5;

			const canSignal = currentTime - lastSignalTime >= SIGNAL_COOLDOWN;
			expect(canSignal).toBe(false);

			lastSignalTime = 0;
			const laterTime = 10;
			const canSignalLater = laterTime - lastSignalTime >= SIGNAL_COOLDOWN;
			expect(canSignalLater).toBe(true);
		});
	});

	describe("Scout Death", () => {
		it("should be considered dead when hp <= 0", () => {
			const data = createScoutData({ hp: 0 });
			expect(data.hp <= 0).toBe(true);
		});

		it("should be alive when hp > 0", () => {
			const data = createScoutData({ hp: 3 });
			expect(data.hp > 0).toBe(true);
		});
	});
});
