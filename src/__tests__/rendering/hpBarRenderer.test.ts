import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Targeting } from "@/ecs/relations";
import { Health } from "@/ecs/traits/combat";
import { IsBuilding, Selected } from "@/ecs/traits/identity";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";
import { hpBarColor, renderHPBars, shouldShowHPBar } from "@/rendering/HPBarRenderer";

function createMockGraphics() {
	return {
		fillStyle: vi.fn(),
		fillRect: vi.fn(),
	};
}

describe("HPBarRenderer (US-025)", () => {
	let world: ReturnType<typeof createWorld>;
	let graphics: ReturnType<typeof createMockGraphics>;

	beforeEach(() => {
		world = createWorld();
		graphics = createMockGraphics();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("hpBarColor", () => {
		it("should return green for >66% health", () => {
			expect(hpBarColor(0.8)).toBe(0x44cc44);
			expect(hpBarColor(1.0)).toBe(0x44cc44);
			expect(hpBarColor(0.67)).toBe(0x44cc44);
		});

		it("should return yellow for 33-66% health", () => {
			expect(hpBarColor(0.5)).toBe(0xcccc44);
			expect(hpBarColor(0.34)).toBe(0xcccc44);
			expect(hpBarColor(0.66)).toBe(0xcccc44);
		});

		it("should return red for <33% health", () => {
			expect(hpBarColor(0.1)).toBe(0xcc4444);
			expect(hpBarColor(0.33)).toBe(0xcc4444);
			expect(hpBarColor(0.0)).toBe(0xcc4444);
		});
	});

	describe("shouldShowHPBar", () => {
		it("should show for selected entities with health", () => {
			const entity = world.spawn(
				Health({ current: 100, max: 100 }),
				Selected,
				Position({ x: 0, y: 0 }),
			);

			expect(shouldShowHPBar(entity)).toBe(true);
		});

		it("should show for damaged entities", () => {
			const entity = world.spawn(Health({ current: 50, max: 100 }), Position({ x: 0, y: 0 }));

			expect(shouldShowHPBar(entity)).toBe(true);
		});

		it("should not show for full-health unselected entities not in combat", () => {
			const entity = world.spawn(Health({ current: 100, max: 100 }), Position({ x: 0, y: 0 }));

			expect(shouldShowHPBar(entity)).toBe(false);
		});

		it("should not show for entities without health", () => {
			const entity = world.spawn(Position({ x: 0, y: 0 }));

			expect(shouldShowHPBar(entity)).toBe(false);
		});

		it("should show for entities in combat (targeting)", () => {
			const target = world.spawn(Health({ current: 100, max: 100 }), Position({ x: 1, y: 1 }));
			const attacker = world.spawn(
				Health({ current: 100, max: 100 }),
				Position({ x: 0, y: 0 }),
				Targeting(target),
			);

			expect(shouldShowHPBar(attacker)).toBe(true);
		});
	});

	describe("renderHPBars", () => {
		it("should render HP bars for damaged entities", () => {
			world.spawn(Health({ current: 50, max: 100 }), Position({ x: 5, y: 5 }), PhaserSprite);

			renderHPBars(world, graphics as any);

			// Background + health fill
			expect(graphics.fillRect).toHaveBeenCalledTimes(2);
			// Yellow for 50% health
			expect(graphics.fillStyle).toHaveBeenCalledWith(0xcccc44, 0.9);
		});

		it("should not render for full-health unselected entities", () => {
			world.spawn(Health({ current: 100, max: 100 }), Position({ x: 5, y: 5 }), PhaserSprite);

			renderHPBars(world, graphics as any);

			expect(graphics.fillRect).not.toHaveBeenCalled();
		});

		it("should render wider bars for buildings", () => {
			world.spawn(
				Health({ current: 50, max: 100 }),
				Position({ x: 5, y: 5 }),
				PhaserSprite,
				IsBuilding,
			);

			renderHPBars(world, graphics as any);

			// Should render with wider bar (34px vs 28px)
			const bgCall = graphics.fillRect.mock.calls[0];
			expect(bgCall[2]).toBe(34); // barWidth for buildings
		});

		it("should render green for selected full-health entities", () => {
			world.spawn(
				Health({ current: 100, max: 100 }),
				Position({ x: 5, y: 5 }),
				PhaserSprite,
				Selected,
			);

			renderHPBars(world, graphics as any);

			// Green color
			expect(graphics.fillStyle).toHaveBeenCalledWith(0x44cc44, 0.9);
		});
	});
});
