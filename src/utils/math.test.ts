import { describe, it, expect } from "vitest";
import { clamp, lerp, randomRange, randomInt, normalizeAngle, angleDifference } from "./math";

describe("math utilities", () => {
	describe("clamp", () => {
		it("should clamp values within range", () => {
			expect(clamp(5, 0, 10)).toBe(5);
			expect(clamp(-5, 0, 10)).toBe(0);
			expect(clamp(15, 0, 10)).toBe(10);
		});
	});

	describe("lerp", () => {
		it("should interpolate correctly", () => {
			expect(lerp(0, 10, 0.5)).toBe(5);
			expect(lerp(10, 20, 0.1)).toBe(11);
		});
	});

	describe("normalizeAngle", () => {
		it("should normalize angles to [-PI, PI]", () => {
			expect(normalizeAngle(0)).toBe(0);
			// The current implementation returns -PI for PI, which is the same angle
			expect(Math.abs(normalizeAngle(Math.PI))).toBeCloseTo(Math.PI);
			expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI);
			expect(Math.abs(normalizeAngle(Math.PI * 3))).toBeCloseTo(Math.PI);
			expect(normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI);
			expect(normalizeAngle(Math.PI * 2.5)).toBeCloseTo(Math.PI * 0.5);
		});
	});

	describe("angleDifference", () => {
		it("should calculate shortest angular difference", () => {
			expect(angleDifference(0, Math.PI * 0.5)).toBeCloseTo(Math.PI * 0.5);
			expect(angleDifference(Math.PI * 0.5, 0)).toBeCloseTo(-Math.PI * 0.5);
			expect(angleDifference(-Math.PI * 0.9, Math.PI * 0.9)).toBeCloseTo(-Math.PI * 0.2);
		});
	});
});
