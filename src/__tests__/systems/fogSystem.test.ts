import { createWorld } from "koota";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VisionRadius } from "../../ecs/traits/combat";
import { Faction, UnitType } from "../../ecs/traits/identity";
import { Position } from "../../ecs/traits/spatial";
import { FogOfWarSystem, FogState } from "../../systems/fogSystem";

/**
 * Create a minimal mock Phaser scene with just enough surface
 * for FogOfWarSystem's constructor and update() to run.
 */
function createMockScene() {
	const mockRenderTexture = {
		setOrigin: vi.fn(),
		setDepth: vi.fn(),
		fill: vi.fn(),
		clear: vi.fn(),
		erase: vi.fn(),
		draw: vi.fn(),
		destroy: vi.fn(),
	};

	const mockGraphics = {
		setVisible: vi.fn(),
		clear: vi.fn(),
		fillStyle: vi.fn(),
		fillRect: vi.fn(),
		destroy: vi.fn(),
	};

	return {
		add: {
			renderTexture: vi.fn(() => mockRenderTexture),
			graphics: vi.fn(() => mockGraphics),
		},
		_mockRenderTexture: mockRenderTexture,
		_mockGraphics: mockGraphics,
	} as unknown as import("phaser").Scene & {
		_mockRenderTexture: typeof mockRenderTexture;
		_mockGraphics: typeof mockGraphics;
	};
}

describe("FogOfWarSystem", () => {
	let world: ReturnType<typeof createWorld>;
	let scene: ReturnType<typeof createMockScene>;

	beforeEach(() => {
		world = createWorld();
		scene = createMockScene();
	});

	afterEach(() => {
		world.destroy();
	});

	describe("initialization", () => {
		it("should start with all tiles unexplored", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 8);

			for (let y = 0; y < 8; y++) {
				for (let x = 0; x < 10; x++) {
					expect(fog.getFogState(x, y)).toBe(FogState.Unexplored);
				}
			}

			fog.destroy();
		});

		it("should create RenderTexture at correct dimensions", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 8);

			// 10 cols * 32px = 320, 8 rows * 32px = 256
			expect(scene.add.renderTexture).toHaveBeenCalledWith(0, 0, 320, 256);

			fog.destroy();
		});

		it("should fill fog with unexplored alpha on creation", () => {
			const fog = new FogOfWarSystem(scene, world, 5, 5);

			expect(scene._mockRenderTexture.fill).toHaveBeenCalledWith(0x000000, 0.95);

			fog.destroy();
		});
	});

	describe("getFogState", () => {
		it("should return Unexplored for out-of-bounds tiles", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 10);

			expect(fog.getFogState(-1, 0)).toBe(FogState.Unexplored);
			expect(fog.getFogState(0, -1)).toBe(FogState.Unexplored);
			expect(fog.getFogState(10, 0)).toBe(FogState.Unexplored);
			expect(fog.getFogState(0, 10)).toBe(FogState.Unexplored);

			fog.destroy();
		});
	});

	describe("vision and exploration", () => {
		it("should mark tiles as explored after a unit reveals them", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			// Spawn a friendly unit at tile (5, 5) with vision radius 3
			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 3 }),
			);

			fog.update();

			// Tile at the unit's position should be explored
			expect(fog.getFogState(5, 5)).toBe(FogState.Explored);

			// Tiles within radius should be explored
			expect(fog.getFogState(5, 3)).toBe(FogState.Explored); // 2 tiles north
			expect(fog.getFogState(7, 5)).toBe(FogState.Explored); // 2 tiles east

			fog.destroy();
		});

		it("should not mark tiles outside vision radius as explored", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 2 }),
			);

			fog.update();

			// Tiles far outside radius should remain unexplored
			expect(fog.getFogState(0, 0)).toBe(FogState.Unexplored);
			expect(fog.getFogState(10, 10)).toBe(FogState.Unexplored);

			fog.destroy();
		});

		it("should persist explored state after unit moves away", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			const unit = world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 2 }),
			);

			// Unit reveals tiles around (5, 5)
			fog.update();
			expect(fog.getFogState(5, 5)).toBe(FogState.Explored);

			// Move unit to (15, 15)
			unit.set(Position, { x: 15, y: 15 });
			fog.update();

			// Original tiles should remain explored (never revert to unexplored)
			expect(fog.getFogState(5, 5)).toBe(FogState.Explored);

			// New position should also be explored
			expect(fog.getFogState(15, 15)).toBe(FogState.Explored);

			fog.destroy();
		});

		it("should use circular vision (Euclidean distance), not square", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 10, y: 10 }),
				VisionRadius({ radius: 3 }),
			);

			fog.update();

			// Corner at (13, 13) — distance = sqrt(9+9) = 4.24 > 3, should NOT be explored
			expect(fog.getFogState(13, 13)).toBe(FogState.Unexplored);

			// Directly adjacent within radius should be explored
			expect(fog.getFogState(13, 10)).toBe(FogState.Explored); // distance = 3

			fog.destroy();
		});

		it("should only track friendly faction units", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			// Enemy unit — should NOT reveal fog for the player
			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 5 }),
			);

			fog.update();

			expect(fog.getFogState(5, 5)).toBe(FogState.Unexplored);

			fog.destroy();
		});

		it("should support custom player faction", () => {
			// Pass 'scale_guard' as the player faction
			const fog = new FogOfWarSystem(scene, world, 20, 20, "scale_guard");

			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 2 }),
			);

			fog.update();

			expect(fog.getFogState(5, 5)).toBe(FogState.Explored);

			fog.destroy();
		});

		it("should combine vision from multiple friendly units", () => {
			const fog = new FogOfWarSystem(scene, world, 30, 30);

			// Two units far apart
			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 2 }),
			);

			world.spawn(
				UnitType({ type: "river_rat" }),
				Faction({ id: "ura" }),
				Position({ x: 20, y: 20 }),
				VisionRadius({ radius: 2 }),
			);

			fog.update();

			// Both areas should be explored
			expect(fog.getFogState(5, 5)).toBe(FogState.Explored);
			expect(fog.getFogState(20, 20)).toBe(FogState.Explored);

			// Area between them should remain unexplored
			expect(fog.getFogState(12, 12)).toBe(FogState.Unexplored);

			fog.destroy();
		});
	});

	describe("isTileVisible", () => {
		it("should return true for tiles within friendly unit vision", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 3 }),
			);

			expect(fog.isTileVisible(5, 5)).toBe(true);
			expect(fog.isTileVisible(6, 5)).toBe(true);

			fog.destroy();
		});

		it("should return false for tiles outside all friendly unit vision", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 2 }),
			);

			expect(fog.isTileVisible(15, 15)).toBe(false);

			fog.destroy();
		});

		it("should return false for enemy unit positions", () => {
			const fog = new FogOfWarSystem(scene, world, 20, 20);

			world.spawn(
				UnitType({ type: "gator" }),
				Faction({ id: "scale_guard" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 5 }),
			);

			expect(fog.isTileVisible(5, 5)).toBe(false);

			fog.destroy();
		});
	});

	describe("rendering passes", () => {
		it("should clear and redraw fog texture on each update", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 10);

			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 2 }),
			);

			fog.update();

			// Should have cleared the texture
			expect(scene._mockRenderTexture.clear).toHaveBeenCalled();
			// Should have refilled with full fog
			expect(scene._mockRenderTexture.fill).toHaveBeenCalledWith(0x000000, 0.95);
			// Should have erased visible tiles
			expect(scene._mockRenderTexture.erase).toHaveBeenCalled();

			fog.destroy();
		});
	});

	describe("edge cases", () => {
		it("should handle unit at map boundary without errors", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 10);

			// Unit at corner — vision extends beyond map bounds
			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 0, y: 0 }),
				VisionRadius({ radius: 3 }),
			);

			// Should not throw
			expect(() => fog.update()).not.toThrow();

			// Tile at origin should be explored
			expect(fog.getFogState(0, 0)).toBe(FogState.Explored);

			fog.destroy();
		});

		it("should handle zero-size vision radius", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 10);

			world.spawn(
				UnitType({ type: "mudfoot" }),
				Faction({ id: "ura" }),
				Position({ x: 5, y: 5 }),
				VisionRadius({ radius: 0 }),
			);

			fog.update();

			// Only the exact tile should be explored (radius 0 → dx*dx+dy*dy <= 0)
			expect(fog.getFogState(5, 5)).toBe(FogState.Explored);
			expect(fog.getFogState(6, 5)).toBe(FogState.Unexplored);

			fog.destroy();
		});

		it("should handle empty world with no units", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 10);

			// No units spawned — should not throw
			expect(() => fog.update()).not.toThrow();

			// All tiles remain unexplored
			expect(fog.getFogState(5, 5)).toBe(FogState.Unexplored);

			fog.destroy();
		});

		it("should properly clean up on destroy", () => {
			const fog = new FogOfWarSystem(scene, world, 10, 10);

			fog.destroy();

			expect(scene._mockRenderTexture.destroy).toHaveBeenCalled();
			expect(scene._mockGraphics.destroy).toHaveBeenCalled();
		});
	});
});
