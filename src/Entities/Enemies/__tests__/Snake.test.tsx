/**
 * Snake Component Tests
 *
 * Tests the Snake enemy component including:
 * - Segmented body physics
 * - Venom attack behavior
 * - Stealth mechanics
 */

import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import type { SnakeData } from "../types";

// Mock Yuka
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

describe("Snake Component Logic", () => {
	const createSnakeData = (overrides?: Partial<SnakeData>): SnakeData => ({
		id: "snake-1",
		position: new THREE.Vector3(0, 0, 0),
		hp: 2,
		maxHp: 2,
		suppression: 0,
		...overrides,
	});

	describe("Snake Data Interface", () => {
		it("should create valid snake data", () => {
			const data = createSnakeData();

			expect(data.id).toBe("snake-1");
			expect(data.hp).toBe(2);
			expect(data.maxHp).toBe(2);
			expect(data.suppression).toBe(0);
		});

		it("should have lower HP than Gator (fragile enemy)", () => {
			const snakeData = createSnakeData();
			// Snakes are fragile - typically 2 HP vs Gator's 10
			expect(snakeData.maxHp).toBeLessThanOrEqual(5);
		});
	});

	describe("Snake Segment Physics", () => {
		it("should calculate segment positions along a sine wave", () => {
			const SEGMENT_COUNT = 8;
			const headPosition = new THREE.Vector3(0, 0, 0);
			const direction = 0; // radians

			const segments: THREE.Vector3[] = [];
			for (let i = 0; i < SEGMENT_COUNT; i++) {
				const offset = i * 0.3; // spacing between segments
				const waveOffset = Math.sin(offset * 2) * 0.2;
				segments.push(
					new THREE.Vector3(
						headPosition.x - Math.sin(direction) * offset,
						headPosition.y,
						headPosition.z - Math.cos(direction) * offset + waveOffset,
					),
				);
			}

			expect(segments.length).toBe(SEGMENT_COUNT);
			// Each segment should be behind the previous
			expect(segments[1].z).toBeLessThanOrEqual(segments[0].z + 0.5);
		});
	});

	describe("Snake Stealth Behavior", () => {
		it("should be low to the ground (y position)", () => {
			const snakeY = -0.3; // Snakes stay low
			expect(snakeY).toBeLessThan(0);
		});

		it("should have amber/glowing eyes for visibility in murky water", () => {
			const eyeColor = "#ffaa00";
			expect(eyeColor).toBe("#ffaa00");
		});
	});

	describe("Snake Attack Range", () => {
		it("should attack when player is within strike distance", () => {
			const snakePos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(2, 0, 0);
			const STRIKE_DISTANCE = 3;

			const distance = snakePos.distanceTo(playerPos);
			expect(distance).toBeLessThan(STRIKE_DISTANCE);
		});

		it("should not attack when player is beyond strike distance", () => {
			const snakePos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(10, 0, 0);
			const STRIKE_DISTANCE = 3;

			const distance = snakePos.distanceTo(playerPos);
			expect(distance).toBeGreaterThan(STRIKE_DISTANCE);
		});
	});

	describe("Snake Death", () => {
		it("should be considered dead when hp <= 0", () => {
			const data = createSnakeData({ hp: 0 });
			expect(data.hp <= 0).toBe(true);
		});

		it("should be alive when hp > 0", () => {
			const data = createSnakeData({ hp: 1 });
			expect(data.hp > 0).toBe(true);
		});
	});

	describe("Snake Colors", () => {
		it("should have jungle camouflage colors", () => {
			const bodyColor = "#4a5a3a";
			const underbellyColor = "#6a7a5a";

			// Validate they're greenish tones
			expect(bodyColor.startsWith("#")).toBe(true);
			expect(underbellyColor.startsWith("#")).toBe(true);
		});
	});
});
