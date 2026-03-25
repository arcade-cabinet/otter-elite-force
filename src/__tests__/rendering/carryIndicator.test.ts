import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Gatherer } from "@/ecs/traits/economy";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";
import { getCarryPipColor, renderCarryIndicators } from "@/rendering/CarryIndicator";

function createMockGraphics() {
	return {
		fillStyle: vi.fn(),
		fillCircle: vi.fn(),
	};
}

describe("CarryIndicator (US-026)", () => {
	let world: ReturnType<typeof createWorld>;
	let graphics: ReturnType<typeof createMockGraphics>;

	beforeEach(() => {
		world = createWorld();
		graphics = createMockGraphics();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("getCarryPipColor", () => {
		it("should return blue for fish", () => {
			expect(getCarryPipColor("fish")).toBe(0x4488ff);
		});

		it("should return brown for timber", () => {
			expect(getCarryPipColor("timber")).toBe(0x8b5a2b);
		});

		it("should return grey for salvage", () => {
			expect(getCarryPipColor("salvage")).toBe(0x999999);
		});

		it("should return null for unknown resource type", () => {
			expect(getCarryPipColor("gold")).toBeNull();
		});

		it("should return null for empty string", () => {
			expect(getCarryPipColor("")).toBeNull();
		});
	});

	describe("renderCarryIndicators", () => {
		it("should render pip for worker carrying fish", () => {
			world.spawn(
				Gatherer({ carrying: "fish", amount: 5, capacity: 10 }),
				Position({ x: 3, y: 4 }),
				PhaserSprite,
			);

			renderCarryIndicators(world, graphics as any);

			// Outline + pip fill = 2 circles
			expect(graphics.fillCircle).toHaveBeenCalledTimes(2);
			// Blue pip for fish
			expect(graphics.fillStyle).toHaveBeenCalledWith(0x4488ff, 0.95);
		});

		it("should render pip for worker carrying timber", () => {
			world.spawn(
				Gatherer({ carrying: "timber", amount: 3, capacity: 10 }),
				Position({ x: 1, y: 1 }),
				PhaserSprite,
			);

			renderCarryIndicators(world, graphics as any);

			// Brown pip for timber
			expect(graphics.fillStyle).toHaveBeenCalledWith(0x8b5a2b, 0.95);
		});

		it("should not render pip when carrying nothing", () => {
			world.spawn(
				Gatherer({ carrying: "", amount: 0, capacity: 10 }),
				Position({ x: 1, y: 1 }),
				PhaserSprite,
			);

			renderCarryIndicators(world, graphics as any);

			expect(graphics.fillCircle).not.toHaveBeenCalled();
		});

		it("should not render pip when amount is 0", () => {
			world.spawn(
				Gatherer({ carrying: "fish", amount: 0, capacity: 10 }),
				Position({ x: 1, y: 1 }),
				PhaserSprite,
			);

			renderCarryIndicators(world, graphics as any);

			expect(graphics.fillCircle).not.toHaveBeenCalled();
		});

		it("should render pips for multiple carriers", () => {
			world.spawn(
				Gatherer({ carrying: "fish", amount: 5, capacity: 10 }),
				Position({ x: 1, y: 1 }),
				PhaserSprite,
			);
			world.spawn(
				Gatherer({ carrying: "timber", amount: 3, capacity: 10 }),
				Position({ x: 5, y: 5 }),
				PhaserSprite,
			);

			renderCarryIndicators(world, graphics as any);

			// 2 workers × (outline + pip) = 4 circles
			expect(graphics.fillCircle).toHaveBeenCalledTimes(4);
		});
	});
});
