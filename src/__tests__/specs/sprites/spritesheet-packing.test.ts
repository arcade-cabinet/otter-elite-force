/**
 * Spritesheet Packing Specification Tests
 *
 * Defines the behavioral contract for packing compiled sprite frames
 * into texture atlas spritesheets with JSON metadata.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §6 (Build Pipeline)
 *   - docs/architecture/testing-strategy.md §SP-DSL Build Tests
 *   - src/sprites/atlas.ts (existing shelf-pack implementation)
 *
 * Tests validate the existing atlas + the SP-DSL extension requirements.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { generateAtlas } from "@/sprites/atlas";
import type { SpriteDefinition } from "@/sprites/types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function make4x4Sprite(name: string, frameCount: number): SpriteDefinition {
	const frames = [];
	for (let i = 0; i < frameCount; i++) {
		frames.push({
			index: i,
			art: ["#.#.", ".#.#", "#.#.", ".#.#"],
		});
	}
	return {
		meta: { name, width: 4, height: 4 },
		palette: {
			"#": "#FF0000",
			".": "#00FF00",
		},
		animations: {
			idle: { frames: [0], rate: 1 },
			...(frameCount > 1
				? { walk: { frames: Array.from({ length: frameCount - 1 }, (_, i) => i + 1), rate: 6 } }
				: {}),
		},
		frames,
	};
}

function make16x16Sprite(name: string): SpriteDefinition {
	const row = "#.#.#.#.#.#.#.#.";
	const art = Array(16).fill(row);
	return {
		meta: { name, width: 16, height: 16 },
		palette: {
			"#": "#FF0000",
			".": "#00FF00",
		},
		animations: { idle: { frames: [0], rate: 1 } },
		frames: [{ index: 0, art }],
	};
}

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("Spritesheet Packing", () => {
	describe("single sprite atlas", () => {
		it("generates an atlas with correct frame key", () => {
			const sprite = make4x4Sprite("mudfoot", 1);
			const atlas = generateAtlas([sprite], 1);
			expect(atlas.frames).toHaveProperty("mudfoot_0");
		});

		it("frame rect matches sprite dimensions", () => {
			const sprite = make4x4Sprite("mudfoot", 1);
			const atlas = generateAtlas([sprite], 1);
			const rect = atlas.frames.mudfoot_0;
			expect(rect.w).toBe(4);
			expect(rect.h).toBe(4);
		});

		it("atlas image contains pixel data", () => {
			const sprite = make4x4Sprite("mudfoot", 1);
			const atlas = generateAtlas([sprite], 1);
			expect(atlas.image).toBeInstanceOf(ImageData);
			expect(atlas.image.width).toBeGreaterThanOrEqual(4);
			expect(atlas.image.height).toBeGreaterThanOrEqual(4);
		});
	});

	describe("multi-frame sprite", () => {
		it("generates separate frame rects for each animation frame", () => {
			const sprite = make4x4Sprite("mudfoot", 3);
			const atlas = generateAtlas([sprite], 1);
			expect(atlas.frames).toHaveProperty("mudfoot_0");
			expect(atlas.frames).toHaveProperty("mudfoot_1");
			expect(atlas.frames).toHaveProperty("mudfoot_2");
		});

		it("frame rects do not overlap", () => {
			const sprite = make4x4Sprite("mudfoot", 3);
			const atlas = generateAtlas([sprite], 1);
			const rects = Object.values(atlas.frames);

			for (let i = 0; i < rects.length; i++) {
				for (let j = i + 1; j < rects.length; j++) {
					const a = rects[i];
					const b = rects[j];
					// Check no overlap: one must be completely left, right, above, or below
					const noOverlap =
						a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
					expect(noOverlap).toBe(true);
				}
			}
		});
	});

	describe("multi-sprite atlas", () => {
		it("packs multiple sprites into one atlas", () => {
			const sprites = [
				make4x4Sprite("mudfoot", 2),
				make4x4Sprite("gator", 2),
				make4x4Sprite("river_rat", 1),
			];
			const atlas = generateAtlas(sprites, 1);
			expect(atlas.frames).toHaveProperty("mudfoot_0");
			expect(atlas.frames).toHaveProperty("mudfoot_1");
			expect(atlas.frames).toHaveProperty("gator_0");
			expect(atlas.frames).toHaveProperty("gator_1");
			expect(atlas.frames).toHaveProperty("river_rat_0");
		});

		it("total frame count matches sum of all sprite frames", () => {
			const sprites = [make4x4Sprite("mudfoot", 3), make4x4Sprite("gator", 2)];
			const atlas = generateAtlas(sprites, 1);
			expect(Object.keys(atlas.frames)).toHaveLength(5);
		});
	});

	describe("scaled atlas", () => {
		it("generates atlas at 2x scale", () => {
			const sprite = make4x4Sprite("mudfoot", 1);
			const atlas = generateAtlas([sprite], 2);
			const rect = atlas.frames.mudfoot_0;
			expect(rect.w).toBe(8); // 4 * 2
			expect(rect.h).toBe(8); // 4 * 2
		});

		it("generates atlas at 3x scale", () => {
			const sprite = make4x4Sprite("mudfoot", 1);
			const atlas = generateAtlas([sprite], 3);
			const rect = atlas.frames.mudfoot_0;
			expect(rect.w).toBe(12); // 4 * 3
			expect(rect.h).toBe(12); // 4 * 3
		});
	});

	describe("atlas dimensions", () => {
		it("atlas dimensions are power-of-two", () => {
			const sprites = [
				make16x16Sprite("mudfoot"),
				make16x16Sprite("gator"),
				make16x16Sprite("river_rat"),
			];
			const atlas = generateAtlas(sprites, 1);
			const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0;
			expect(isPow2(atlas.image.width)).toBe(true);
			expect(isPow2(atlas.image.height)).toBe(true);
		});

		it("all frame rects fit within the atlas image bounds", () => {
			const sprites = [
				make16x16Sprite("mudfoot"),
				make16x16Sprite("gator"),
				make4x4Sprite("river_rat", 4),
			];
			const atlas = generateAtlas(sprites, 2);
			for (const [key, rect] of Object.entries(atlas.frames)) {
				expect(rect.x + rect.w).toBeLessThanOrEqual(atlas.image.width);
				expect(rect.y + rect.h).toBeLessThanOrEqual(atlas.image.height);
			}
		});
	});

	describe("JSON atlas format (Phaser-compatible)", () => {
		it("frame keys follow {spriteName}_{frameIndex} convention", () => {
			const sprite = make4x4Sprite("mudfoot", 2);
			const atlas = generateAtlas([sprite], 1);
			const keys = Object.keys(atlas.frames);
			expect(keys).toContain("mudfoot_0");
			expect(keys).toContain("mudfoot_1");
		});

		it("each frame rect has x, y, w, h fields", () => {
			const sprite = make4x4Sprite("mudfoot", 1);
			const atlas = generateAtlas([sprite], 1);
			const rect = atlas.frames.mudfoot_0;
			expect(typeof rect.x).toBe("number");
			expect(typeof rect.y).toBe("number");
			expect(typeof rect.w).toBe("number");
			expect(typeof rect.h).toBe("number");
		});
	});
});
