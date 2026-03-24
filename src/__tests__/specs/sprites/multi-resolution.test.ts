/**
 * Multi-Resolution Output Specification Tests
 *
 * Defines the behavioral contract for generating sprites at 1x, 2x, and 3x
 * scale using nearest-neighbor interpolation.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §6
 *   - docs/architecture/testing-strategy.md §SP-DSL Build Tests
 *
 * Tests validate:
 *   - 16x16 base → 16, 32, 48 pixel outputs
 *   - Nearest-neighbor scaling (no interpolation artifacts)
 *   - Each resolution produces distinct atlas output
 */
import { describe, it, expect } from "vitest";
import { compileSpriteToPixels } from "@/sprites/compiler";
import { generateAtlas } from "@/sprites/atlas";
import type { SpriteDefinition } from "@/sprites/types";

// ---------------------------------------------------------------------------
// Test fixture: 4x4 sprite with known pixel pattern
// ---------------------------------------------------------------------------

const testSprite: SpriteDefinition = {
	meta: { name: "test_unit", width: 4, height: 4 },
	palette: {
		"#": "#FF0000", // red
		".": "#0000FF", // blue
		" ": "transparent",
	},
	animations: { idle: { frames: [0], rate: 1 } },
	frames: [
		{
			index: 0,
			art: ["#..#", ".##.", ".##.", "#..#"],
		},
	],
};

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("Multi-Resolution Output", () => {
	describe("compileSpriteToPixels at multiple scales", () => {
		it("produces 4x4 at scale 1", () => {
			const img = compileSpriteToPixels(testSprite, 0, 1);
			expect(img.width).toBe(4);
			expect(img.height).toBe(4);
		});

		it("produces 8x8 at scale 2", () => {
			const img = compileSpriteToPixels(testSprite, 0, 2);
			expect(img.width).toBe(8);
			expect(img.height).toBe(8);
		});

		it("produces 12x12 at scale 3", () => {
			const img = compileSpriteToPixels(testSprite, 0, 3);
			expect(img.width).toBe(12);
			expect(img.height).toBe(12);
		});
	});

	describe("nearest-neighbor scaling (no interpolation)", () => {
		it("at scale 2, each pixel becomes a 2x2 block of identical color", () => {
			const img = compileSpriteToPixels(testSprite, 0, 2);
			const d = img.data;
			const w = img.width;

			// Original pixel (0,0) = '#' = red
			// At scale 2, pixels (0,0), (1,0), (0,1), (1,1) should all be red
			for (let sy = 0; sy < 2; sy++) {
				for (let sx = 0; sx < 2; sx++) {
					const idx = ((0 + sy) * w + (0 + sx)) * 4;
					expect(d[idx]).toBe(255); // R
					expect(d[idx + 1]).toBe(0); // G
					expect(d[idx + 2]).toBe(0); // B
					expect(d[idx + 3]).toBe(255); // A
				}
			}
		});

		it("at scale 3, each pixel becomes a 3x3 block of identical color", () => {
			const img = compileSpriteToPixels(testSprite, 0, 3);
			const d = img.data;
			const w = img.width;

			// Original pixel (1,0) = '.' = blue
			// At scale 3, the 3x3 block starting at screen (3, 0) should be blue
			for (let sy = 0; sy < 3; sy++) {
				for (let sx = 0; sx < 3; sx++) {
					const idx = ((0 + sy) * w + (3 + sx)) * 4;
					expect(d[idx]).toBe(0); // R
					expect(d[idx + 1]).toBe(0); // G
					expect(d[idx + 2]).toBe(255); // B
					expect(d[idx + 3]).toBe(255); // A
				}
			}
		});

		it("no sub-pixel blending — pixel values are exact palette colors", () => {
			const img = compileSpriteToPixels(testSprite, 0, 3);
			const d = img.data;
			const w = img.width;

			// Check every pixel in the image is either red, blue, or transparent
			for (let y = 0; y < img.height; y++) {
				for (let x = 0; x < w; x++) {
					const idx = (y * w + x) * 4;
					const r = d[idx];
					const g = d[idx + 1];
					const b = d[idx + 2];
					const a = d[idx + 3];

					if (a === 0) continue; // transparent is fine

					const isRed = r === 255 && g === 0 && b === 0;
					const isBlue = r === 0 && g === 0 && b === 255;
					expect(isRed || isBlue).toBe(true);
				}
			}
		});
	});

	describe("16x16 base resolution (standard game unit)", () => {
		it("16x16 sprite compiles to 16x16 at 1x", () => {
			const row = "#.#.#.#.#.#.#.#.";
			const sprite16: SpriteDefinition = {
				meta: { name: "unit16", width: 16, height: 16 },
				palette: { "#": "#FF0000", ".": "#0000FF" },
				animations: { idle: { frames: [0], rate: 1 } },
				frames: [{ index: 0, art: Array(16).fill(row) }],
			};

			const img1 = compileSpriteToPixels(sprite16, 0, 1);
			expect(img1.width).toBe(16);
			expect(img1.height).toBe(16);

			const img2 = compileSpriteToPixels(sprite16, 0, 2);
			expect(img2.width).toBe(32);
			expect(img2.height).toBe(32);

			const img3 = compileSpriteToPixels(sprite16, 0, 3);
			expect(img3.width).toBe(48);
			expect(img3.height).toBe(48);
		});
	});

	describe("atlas at multiple resolutions", () => {
		it("generates distinct atlas sizes for 1x, 2x, 3x", () => {
			const sprites = [testSprite];
			const atlas1 = generateAtlas(sprites, 1);
			const atlas2 = generateAtlas(sprites, 2);
			const atlas3 = generateAtlas(sprites, 3);

			// Higher scale = larger frames
			expect(atlas1.frames.test_unit_0.w).toBe(4);
			expect(atlas2.frames.test_unit_0.w).toBe(8);
			expect(atlas3.frames.test_unit_0.w).toBe(12);
		});

		it("all three resolutions have the same frame keys", () => {
			const sprites = [testSprite];
			const keys1 = Object.keys(generateAtlas(sprites, 1).frames).sort();
			const keys2 = Object.keys(generateAtlas(sprites, 2).frames).sort();
			const keys3 = Object.keys(generateAtlas(sprites, 3).frames).sort();

			expect(keys1).toEqual(keys2);
			expect(keys2).toEqual(keys3);
		});
	});
});
