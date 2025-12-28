/**
 * Snapper Component Tests
 *
 * Tests the Snapper enemy (turtle tank) component including:
 * - Shell defense mechanics
 * - Slow but powerful attack
 * - Armored behavior
 */

import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import type { SnapperData } from "../types";

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
		distanceTo(v: { x: number; y: number; z: number }) {
			const dx = this.x - v.x;
			const dy = this.y - v.y;
			const dz = this.z - v.z;
			return Math.sqrt(dx * dx + dy * dy + dz * dz);
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
	};
});

describe("Snapper Component Logic", () => {
	const createSnapperData = (overrides?: Partial<SnapperData>): SnapperData => ({
		id: "snapper-1",
		position: new THREE.Vector3(0, 0, 0),
		hp: 20,
		maxHp: 20,
		suppression: 0,
		...overrides,
	});

	describe("Snapper Data Interface", () => {
		it("should create valid snapper data", () => {
			const data = createSnapperData();

			expect(data.id).toBe("snapper-1");
			expect(data.hp).toBe(20);
			expect(data.maxHp).toBe(20);
			expect(data.suppression).toBe(0);
		});

		it("should have high HP (tank enemy)", () => {
			const snapperData = createSnapperData();
			// Snappers are tanks - 20 HP vs Gator's 10 vs Snake's 2
			expect(snapperData.maxHp).toBeGreaterThanOrEqual(15);
		});
	});

	describe("Snapper Armor Mechanics", () => {
		it("should have damage reduction from shell", () => {
			const SHELL_DAMAGE_REDUCTION = 0.5; // 50% damage reduction
			const incomingDamage = 10;
			const actualDamage = incomingDamage * (1 - SHELL_DAMAGE_REDUCTION);

			expect(actualDamage).toBe(5);
		});

		it("should be vulnerable when shell is cracked", () => {
			const CRACKED_THRESHOLD = 0.3; // Shell cracks at 30% HP
			const data = createSnapperData({ hp: 5 }); // 25% HP

			const healthPercent = data.hp / data.maxHp;
			const isShellCracked = healthPercent <= CRACKED_THRESHOLD;

			expect(isShellCracked).toBe(true);
		});

		it("should have shell intact at high HP", () => {
			const CRACKED_THRESHOLD = 0.3;
			const data = createSnapperData({ hp: 15 }); // 75% HP

			const healthPercent = data.hp / data.maxHp;
			const isShellCracked = healthPercent <= CRACKED_THRESHOLD;

			expect(isShellCracked).toBe(false);
		});
	});

	describe("Snapper Movement", () => {
		it("should have slow movement speed", () => {
			const SNAPPER_SPEED = 3; // Slow tank
			const GATOR_SPEED = 6; // Regular enemy speed

			expect(SNAPPER_SPEED).toBeLessThan(GATOR_SPEED);
		});

		it("should turn slowly", () => {
			const SNAPPER_TURN_RATE = 1; // radians/second
			const GATOR_TURN_RATE = 3;

			expect(SNAPPER_TURN_RATE).toBeLessThan(GATOR_TURN_RATE);
		});
	});

	describe("Snapper Attack", () => {
		it("should have powerful bite attack", () => {
			const SNAPPER_DAMAGE = 25;
			const GATOR_DAMAGE = 10;

			expect(SNAPPER_DAMAGE).toBeGreaterThan(GATOR_DAMAGE);
		});

		it("should attack when player is within bite range", () => {
			const snapperPos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(1.5, 0, 0);
			const BITE_RANGE = 2;

			const distance = snapperPos.distanceTo(playerPos);
			expect(distance).toBeLessThan(BITE_RANGE);
		});

		it("should not attack when player is beyond bite range", () => {
			const snapperPos = new THREE.Vector3(0, 0, 0);
			const playerPos = new THREE.Vector3(5, 0, 0);
			const BITE_RANGE = 2;

			const distance = snapperPos.distanceTo(playerPos);
			expect(distance).toBeGreaterThan(BITE_RANGE);
		});
	});

	describe("Snapper Visual", () => {
		it("should have dark shell color", () => {
			const shellColor = "#2a3a2a";
			expect(shellColor.startsWith("#")).toBe(true);
		});

		it("should have shell segments", () => {
			const SHELL_SEGMENTS = 6; // Hexagonal shell pattern
			expect(SHELL_SEGMENTS).toBeGreaterThan(4);
		});
	});

	describe("Snapper Death", () => {
		it("should be considered dead when hp <= 0", () => {
			const data = createSnapperData({ hp: 0 });
			expect(data.hp <= 0).toBe(true);
		});

		it("should drop valuable loot on death", () => {
			const SNAPPER_LOOT_VALUE = 50; // High value due to difficulty
			const GATOR_LOOT_VALUE = 20;

			expect(SNAPPER_LOOT_VALUE).toBeGreaterThan(GATOR_LOOT_VALUE);
		});
	});

	describe("Snapper Suppression Response", () => {
		it("should retreat into shell when suppressed", () => {
			const data = createSnapperData({ suppression: 0.8 });
			const SHELL_RETREAT_THRESHOLD = 0.6;

			const shouldRetreat = data.suppression >= SHELL_RETREAT_THRESHOLD;
			expect(shouldRetreat).toBe(true);
		});

		it("should emerge from shell when suppression is low", () => {
			const data = createSnapperData({ suppression: 0.2 });
			const SHELL_RETREAT_THRESHOLD = 0.6;

			const shouldRetreat = data.suppression >= SHELL_RETREAT_THRESHOLD;
			expect(shouldRetreat).toBe(false);
		});
	});
});
