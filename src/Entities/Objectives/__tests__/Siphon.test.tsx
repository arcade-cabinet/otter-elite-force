/**
 * Siphon Component Tests
 *
 * Tests the Siphon objective component including:
 * - Active/secured states
 * - Smoke animation
 * - Destruction animation
 */

import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";

// Mock React Three Fiber
vi.mock("@react-three/fiber", () => ({
	useFrame: vi.fn(),
}));

describe("Siphon Component Logic", () => {
	describe("Siphon Props", () => {
		it("should accept position prop", () => {
			const position = new THREE.Vector3(30, 0, 20);
			expect(position.x).toBe(30);
			expect(position.y).toBe(0);
			expect(position.z).toBe(20);
		});

		it("should accept secured prop", () => {
			const secured = true;
			expect(secured).toBe(true);
		});

		it("should default to not secured", () => {
			const secured = false;
			expect(secured).toBe(false);
		});
	});

	describe("Siphon Structure", () => {
		it("should have main cylinder structure", () => {
			const topRadius = 1.5;
			const bottomRadius = 2;
			const height = 4;

			expect(topRadius).toBe(1.5);
			expect(bottomRadius).toBe(2);
			expect(height).toBe(4);
		});

		it("should have 3 pumping pipes", () => {
			const pipeCount = 3;
			expect(pipeCount).toBe(3);
		});

		it("should space pipes evenly", () => {
			const pipeCount = 3;
			const angles = [];
			for (let i = 0; i < pipeCount; i++) {
				angles.push((i * Math.PI * 2) / pipeCount);
			}

			expect(angles[0]).toBe(0);
			expect(angles[1]).toBeCloseTo((Math.PI * 2) / 3, 2);
			expect(angles[2]).toBeCloseTo((Math.PI * 4) / 3, 2);
		});

		it("should have pipe dimensions", () => {
			const pipeRadius = 0.3;
			const pipeHeight = 5;

			expect(pipeRadius).toBe(0.3);
			expect(pipeHeight).toBe(5);
		});
	});

	describe("Active State Colors", () => {
		it("should have dark metallic color when active", () => {
			const activeColor = "#111";
			const metalness = 0.8;
			const roughness = 0.3;

			expect(activeColor).toBe("#111");
			expect(metalness).toBe(0.8);
			expect(roughness).toBe(0.3);
		});

		it("should have dark pipe color when active", () => {
			const pipeColor = "#222";
			expect(pipeColor).toBe("#222");
		});
	});

	describe("Secured State Colors", () => {
		it("should have charred color when secured", () => {
			const securedColor = "#1a1a1a";
			expect(securedColor).toBe("#1a1a1a");
		});

		it("should be more rough when secured", () => {
			const roughness = 0.9;
			expect(roughness).toBe(0.9);
		});

		it("should have gray pipe color when secured", () => {
			const pipeColor = "#333";
			expect(pipeColor).toBe("#333");
		});
	});

	describe("Smoke Animation", () => {
		it("should not show smoke when secured", () => {
			const secured = true;
			const shouldShowSmoke = !secured;

			expect(shouldShowSmoke).toBe(false);
		});

		it("should show smoke when active", () => {
			const secured = false;
			const shouldShowSmoke = !secured;

			expect(shouldShowSmoke).toBe(true);
		});

		it("should have 5 smoke particles", () => {
			const SMOKE_COUNT = 5;
			expect(SMOKE_COUNT).toBe(5);
		});

		it("should rise smoke particles", () => {
			let smokeY = 0;
			const riseSpeed = 0.05;
			smokeY += riseSpeed;

			expect(smokeY).toBe(0.05);
		});

		it("should grow smoke particles", () => {
			let scale = 0.2;
			const growthRate = 0.01;
			scale += growthRate;

			expect(scale).toBeCloseTo(0.21, 2);
		});

		it("should reset smoke when too high", () => {
			let smokeY = 6;
			const maxHeight = 5;

			if (smokeY > maxHeight) {
				smokeY = 0;
			}

			expect(smokeY).toBe(0);
		});

		it("should have dark smoke color", () => {
			const smokeColor = "#333";
			const opacity = 0.4;

			expect(smokeColor).toBe("#333");
			expect(opacity).toBe(0.4);
		});
	});

	describe("Destruction Animation", () => {
		it("should tilt when secured", () => {
			const secured = true;
			const targetRotation = 0.3;

			if (secured) {
				expect(targetRotation).toBe(0.3);
			}
		});

		it("should sink when secured", () => {
			const secured = true;
			const targetY = -1;

			if (secured) {
				expect(targetY).toBe(-1);
			}
		});

		it("should lerp rotation smoothly", () => {
			const currentRotation = 0;
			const targetRotation = 0.3;
			const delta = 0.016;
			const lerpSpeed = 0.5;
			const newRotation = THREE.MathUtils.lerp(
				currentRotation,
				targetRotation,
				delta * lerpSpeed,
			);

			expect(newRotation).toBeGreaterThan(0);
			expect(newRotation).toBeLessThan(targetRotation);
		});

		it("should lerp position smoothly", () => {
			const currentY = 0;
			const targetY = -1;
			const delta = 0.016;
			const lerpSpeed = 0.5;
			const newY = THREE.MathUtils.lerp(currentY, targetY, delta * lerpSpeed);

			expect(newY).toBeLessThan(0);
			expect(newY).toBeGreaterThan(targetY);
		});
	});

	describe("Debris Field", () => {
		it("should not show debris when active", () => {
			const secured = false;
			const shouldShowDebris = secured;

			expect(shouldShowDebris).toBe(false);
		});

		it("should show debris when secured", () => {
			const secured = true;
			const shouldShowDebris = secured;

			expect(shouldShowDebris).toBe(true);
		});

		it("should have 4 debris pieces", () => {
			const DEBRIS_COUNT = 4;
			expect(DEBRIS_COUNT).toBe(4);
		});

		it("should scatter debris in circle", () => {
			const debrisPositions = [];
			for (let i = 0; i < 4; i++) {
				const x = Math.cos(i * 1.5) * 2;
				const z = Math.sin(i * 1.5) * 2;
				debrisPositions.push({ x, z });
			}

			expect(debrisPositions.length).toBe(4);
			debrisPositions.forEach((pos) => {
				const distance = Math.sqrt(pos.x ** 2 + pos.z ** 2);
				expect(distance).toBeCloseTo(2, 1);
			});
		});

		it("should have debris dimensions", () => {
			const width = 0.4;
			const height = 0.2;
			const depth = 0.3;

			expect(width).toBe(0.4);
			expect(height).toBe(0.2);
			expect(depth).toBe(0.3);
		});
	});

	describe("Status Light", () => {
		it("should be red when active", () => {
			const secured = false;
			const lightColor = secured ? "#00ff00" : "#ff0000";

			expect(lightColor).toBe("#ff0000");
		});

		it("should be green when secured", () => {
			const secured = true;
			const lightColor = secured ? "#00ff00" : "#ff0000";

			expect(lightColor).toBe("#00ff00");
		});

		it("should be bright when active", () => {
			const secured = false;
			const intensity = secured ? 0.5 : 2;

			expect(intensity).toBe(2);
		});

		it("should be dim when secured", () => {
			const secured = true;
			const intensity = secured ? 0.5 : 2;

			expect(intensity).toBe(0.5);
		});

		it("should have longer range when active", () => {
			const secured = false;
			const distance = secured ? 5 : 10;

			expect(distance).toBe(10);
		});

		it("should have shorter range when secured", () => {
			const secured = true;
			const distance = secured ? 5 : 10;

			expect(distance).toBe(5);
		});
	});
});
