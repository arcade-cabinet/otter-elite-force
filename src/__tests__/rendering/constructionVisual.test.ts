import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConstructionProgress } from "@/ecs/traits/economy";
import { IsBuilding, UnitType } from "@/ecs/traits/identity";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";
import {
	constructionAlpha,
	getConstructionPercent,
	resetConstructionVisuals,
	syncConstructionVisuals,
} from "@/rendering/ConstructionVisual";

function createMockSprite() {
	return {
		alpha: 1,
		setAlpha: vi.fn(function (this: any, a: number) {
			this.alpha = a;
		}),
		setTint: vi.fn(),
		clearTint: vi.fn(),
	};
}

describe("ConstructionVisual (US-023)", () => {
	let world: ReturnType<typeof createWorld>;
	const spriteMap = new Map<any, any>();

	beforeEach(() => {
		world = createWorld();
		spriteMap.clear();
		resetConstructionVisuals();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("constructionAlpha", () => {
		it("should return 0.3 at 0% progress", () => {
			expect(constructionAlpha(0)).toBeCloseTo(0.3);
		});

		it("should return 1.0 at 100% progress", () => {
			expect(constructionAlpha(100)).toBeCloseTo(1.0);
		});

		it("should return ~0.65 at 50% progress", () => {
			expect(constructionAlpha(50)).toBeCloseTo(0.65);
		});

		it("should clamp values below 0", () => {
			expect(constructionAlpha(-10)).toBeCloseTo(0.3);
		});

		it("should clamp values above 100", () => {
			expect(constructionAlpha(150)).toBeCloseTo(1.0);
		});
	});

	describe("getConstructionPercent", () => {
		it("should return progress for building under construction", () => {
			const entity = world.spawn(
				IsBuilding,
				Position({ x: 0, y: 0 }),
				ConstructionProgress({ progress: 45, buildTime: 30 }),
			);

			expect(getConstructionPercent(entity)).toBe(45);
		});

		it("should return null for completed building", () => {
			const entity = world.spawn(IsBuilding, Position({ x: 0, y: 0 }));

			expect(getConstructionPercent(entity)).toBeNull();
		});
	});

	describe("syncConstructionVisuals", () => {
		it("should set low alpha for building at 0% progress", () => {
			const entity = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Position({ x: 0, y: 0 }),
				PhaserSprite,
				ConstructionProgress({ progress: 0, buildTime: 30 }),
			);
			const sprite = createMockSprite();
			spriteMap.set(entity, sprite);

			syncConstructionVisuals(world, spriteMap, 0.016);

			expect(sprite.setAlpha).toHaveBeenCalledWith(expect.closeTo(0.3, 1));
		});

		it("should set medium alpha for building at 50% progress", () => {
			const entity = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Position({ x: 0, y: 0 }),
				PhaserSprite,
				ConstructionProgress({ progress: 50, buildTime: 30 }),
			);
			const sprite = createMockSprite();
			spriteMap.set(entity, sprite);

			syncConstructionVisuals(world, spriteMap, 0.016);

			expect(sprite.setAlpha).toHaveBeenCalledWith(expect.closeTo(0.65, 1));
		});

		it("should trigger flourish at 100% progress", () => {
			const entity = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Position({ x: 0, y: 0 }),
				PhaserSprite,
				ConstructionProgress({ progress: 100, buildTime: 30 }),
			);
			const sprite = createMockSprite();
			spriteMap.set(entity, sprite);

			syncConstructionVisuals(world, spriteMap, 0.016);

			expect(sprite.setTint).toHaveBeenCalledWith(0xffffff);
		});

		it("should set full alpha for completed building without ConstructionProgress", () => {
			const entity = world.spawn(
				IsBuilding,
				UnitType({ type: "barracks" }),
				Position({ x: 0, y: 0 }),
				PhaserSprite,
			);
			const sprite = createMockSprite();
			sprite.alpha = 0.5; // Simulate incomplete alpha
			spriteMap.set(entity, sprite);

			syncConstructionVisuals(world, spriteMap, 0.016);

			expect(sprite.setAlpha).toHaveBeenCalledWith(1.0);
		});
	});
});
