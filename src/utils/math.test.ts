import { describe, expect, it } from "vitest";
import { angleDifference, clamp, lerp, normalizeAngle, randomInt, randomRange } from "./math";

describe("math utilities", () => {
	describe("clamp", () => {
		it("should clamp values within range", () => {
			expect(clamp(5, 0, 10)).toBe(5);
			expect(clamp(-5, 0, 10)).toBe(0);
			expect(clamp(15, 0, 10)).toBe(10);
		});

		it("should handle edge cases", () => {
			expect(clamp(0, 0, 10)).toBe(0);
			expect(clamp(10, 0, 10)).toBe(10);
			expect(clamp(5, 5, 5)).toBe(5);
		});

		it("should handle negative ranges", () => {
			expect(clamp(-5, -10, -1)).toBe(-5);
			expect(clamp(-15, -10, -1)).toBe(-10);
			expect(clamp(0, -10, -1)).toBe(-1);
		});
	});

	describe("lerp", () => {
		it("should interpolate correctly", () => {
			expect(lerp(0, 10, 0.5)).toBe(5);
			expect(lerp(10, 20, 0.1)).toBe(11);
		});

		it("should handle edge values", () => {
			expect(lerp(0, 100, 0)).toBe(0);
			expect(lerp(0, 100, 1)).toBe(100);
		});

		it("should extrapolate beyond 0-1 range", () => {
			expect(lerp(0, 10, 1.5)).toBe(15);
			expect(lerp(0, 10, -0.5)).toBe(-5);
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

		it("should handle full rotations", () => {
			expect(normalizeAngle(Math.PI * 4)).toBeCloseTo(0);
			expect(normalizeAngle(-Math.PI * 4)).toBeCloseTo(0);
		});
	});

	describe("angleDifference", () => {
		it("should calculate shortest angular difference", () => {
			expect(angleDifference(0, Math.PI * 0.5)).toBeCloseTo(Math.PI * 0.5);
			expect(angleDifference(Math.PI * 0.5, 0)).toBeCloseTo(-Math.PI * 0.5);
			expect(angleDifference(-Math.PI * 0.9, Math.PI * 0.9)).toBeCloseTo(-Math.PI * 0.2);
		});

		it("should handle same angles", () => {
			expect(angleDifference(0, 0)).toBeCloseTo(0);
			expect(angleDifference(Math.PI, Math.PI)).toBeCloseTo(0);
		});
	});

	describe("randomRange", () => {
		it("should return values within range", () => {
			for (let i = 0; i < 20; i++) {
				const result = randomRange(5, 10);
				expect(result).toBeGreaterThanOrEqual(5);
				expect(result).toBeLessThanOrEqual(10);
			}
		});

		it("should handle same min and max", () => {
			expect(randomRange(5, 5)).toBe(5);
		});
	});

	describe("randomInt", () => {
		it("should return integer values within range", () => {
			for (let i = 0; i < 20; i++) {
				const result = randomInt(1, 10);
				expect(result).toBeGreaterThanOrEqual(1);
				expect(result).toBeLessThanOrEqual(10);
				expect(Number.isInteger(result)).toBe(true);
			}
		});

		it("should handle same min and max", () => {
			expect(randomInt(5, 5)).toBe(5);
		});
	});
});
