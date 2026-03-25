import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IsBuilding, Selected } from "@/ecs/traits/identity";
import { RallyPoint } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { drawDashedLine, drawRallyMarker, renderRallyPoints } from "@/rendering/RallyPointRenderer";

function createMockGraphics() {
	return {
		lineBetween: vi.fn(),
		lineStyle: vi.fn(),
		fillStyle: vi.fn(),
		fillCircle: vi.fn(),
		strokeCircle: vi.fn(),
		fillTriangle: vi.fn(),
	};
}

describe("RallyPointRenderer (US-024)", () => {
	let world: ReturnType<typeof createWorld>;
	let graphics: ReturnType<typeof createMockGraphics>;

	beforeEach(() => {
		world = createWorld();
		graphics = createMockGraphics();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("drawDashedLine", () => {
		it("should draw multiple segments for a dashed line", () => {
			drawDashedLine(graphics as any, 0, 0, 100, 0, 6, 4);

			// 100px line with 6+4=10 segments → 10 dashes
			expect(graphics.lineBetween.mock.calls.length).toBe(10);
		});

		it("should not draw anything for zero-length line", () => {
			drawDashedLine(graphics as any, 50, 50, 50, 50);

			expect(graphics.lineBetween).not.toHaveBeenCalled();
		});

		it("should draw at least one dash for very short lines", () => {
			drawDashedLine(graphics as any, 0, 0, 3, 0, 6, 4);

			expect(graphics.lineBetween.mock.calls.length).toBe(1);
		});
	});

	describe("drawRallyMarker", () => {
		it("should draw dot, rings, pole and flag", () => {
			drawRallyMarker(graphics as any, 100, 100);

			// Filled circle (inner dot)
			expect(graphics.fillCircle).toHaveBeenCalled();
			// Stroke circles (two rings)
			expect(graphics.strokeCircle).toHaveBeenCalledTimes(2);
			// Flag pole
			expect(graphics.lineBetween).toHaveBeenCalled();
			// Flag triangle
			expect(graphics.fillTriangle).toHaveBeenCalled();
		});
	});

	describe("renderRallyPoints", () => {
		it("should render rally point for selected building with rally", () => {
			world.spawn(Selected, IsBuilding, Position({ x: 5, y: 5 }), RallyPoint({ x: 8, y: 5 }));

			renderRallyPoints(world, graphics as any);

			// Should draw dashed line (multiple lineBetween calls)
			expect(graphics.lineBetween.mock.calls.length).toBeGreaterThan(0);
			// Should draw marker
			expect(graphics.fillCircle).toHaveBeenCalled();
		});

		it("should not render for unselected buildings", () => {
			world.spawn(IsBuilding, Position({ x: 5, y: 5 }), RallyPoint({ x: 8, y: 5 }));

			renderRallyPoints(world, graphics as any);

			expect(graphics.lineBetween).not.toHaveBeenCalled();
		});

		it("should not render for buildings without rally point", () => {
			world.spawn(Selected, IsBuilding, Position({ x: 5, y: 5 }));

			renderRallyPoints(world, graphics as any);

			expect(graphics.lineBetween).not.toHaveBeenCalled();
		});

		it("should skip rendering when rally point equals building position", () => {
			world.spawn(Selected, IsBuilding, Position({ x: 5, y: 5 }), RallyPoint({ x: 5, y: 5 }));

			renderRallyPoints(world, graphics as any);

			expect(graphics.lineBetween).not.toHaveBeenCalled();
		});
	});
});
