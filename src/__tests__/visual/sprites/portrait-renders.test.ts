/**
 * Visual Specification Tests — Portrait Sprites
 *
 * Layer 2: Verify each portrait sprite renders at correct dimensions (64x96),
 * has substantial pixel content (portraits are dense), and is recognizable
 * at intended display size.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compileSpriteToPixels } from "@/sprites/compiler";
import { parseSpriteFile } from "@/sprites/parser";
import type { SpriteDefinition } from "@/sprites/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SPRITES_DIR = path.resolve(__dirname, "../../../sprites/assets");

function loadSprite(category: string, name: string): SpriteDefinition {
	const filePath = path.join(SPRITES_DIR, category, `${name}.sprite`);
	const content = fs.readFileSync(filePath, "utf-8");
	return parseSpriteFile(content);
}

function countOpaquePixels(img: ImageData): number {
	let count = 0;
	for (let i = 3; i < img.data.length; i += 4) {
		if (img.data[i] > 0) count++;
	}
	return count;
}

function getPixel(img: ImageData, x: number, y: number): [number, number, number, number] {
	const idx = (y * img.width + x) * 4;
	return [img.data[idx], img.data[idx + 1], img.data[idx + 2], img.data[idx + 3]];
}

// Portrait dimensions from spec: 64x96
const PORTRAIT_WIDTH = 64;
const PORTRAIT_HEIGHT = 96;
const RENDER_SCALE = 3;

// ---------------------------------------------------------------------------
// Individual Portrait Tests
// ---------------------------------------------------------------------------

describe("Portrait sprites", () => {
	const portraits = [
		{ name: "foxhound", speaker: "FOXHOUND" },
		{ name: "gen-whiskers", speaker: "Gen. Whiskers" },
		{ name: "cpl-splash", speaker: "Cpl. Splash" },
		{ name: "sgt-fang", speaker: "Sgt. Fang" },
		{ name: "medic-marina", speaker: "Medic Marina" },
		{ name: "pvt-muskrat", speaker: "Pvt. Muskrat" },
	];

	for (const portrait of portraits) {
		describe(portrait.name, () => {
			const def = loadSprite("portraits", portrait.name);

			it("parses with correct portrait dimensions (64x96)", () => {
				expect(def.meta.width).toBe(PORTRAIT_WIDTH);
				expect(def.meta.height).toBe(PORTRAIT_HEIGHT);
			});

			it("has exactly 1 frame (static portrait)", () => {
				expect(def.frames).toHaveLength(1);
			});

			it("has an idle animation", () => {
				expect(def.animations.idle).toBeDefined();
				expect(def.animations.idle.frames).toContain(0);
			});

			it(`renders at ${PORTRAIT_WIDTH * RENDER_SCALE}x${PORTRAIT_HEIGHT * RENDER_SCALE} at 3x scale`, () => {
				const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
				expect(img.width).toBe(PORTRAIT_WIDTH * RENDER_SCALE);
				expect(img.height).toBe(PORTRAIT_HEIGHT * RENDER_SCALE);
			});

			it("has substantial pixel content (portraits are dense art)", () => {
				const img = compileSpriteToPixels(def, 0, 1);
				const totalPixels = PORTRAIT_WIDTH * PORTRAIT_HEIGHT;
				const opaque = countOpaquePixels(img);
				// Portraits should fill at least 70% of their canvas
				expect(opaque).toBeGreaterThan(totalPixels * 0.7);
			});

			it("is not a solid block of one color", () => {
				const img = compileSpriteToPixels(def, 0, 1);
				// Sample a few different positions — they should not all be identical
				const colors = new Set<string>();
				const samplePoints = [
					[10, 10],
					[32, 48],
					[50, 80],
					[20, 30],
					[40, 60],
				];
				for (const [x, y] of samplePoints) {
					const [r, g, b] = getPixel(img, x, y);
					colors.add(`${r},${g},${b}`);
				}
				// At least 3 distinct colors among the 5 samples
				expect(colors.size).toBeGreaterThanOrEqual(3);
			});

			it("palette has valid hex color values", () => {
				for (const [char, color] of Object.entries(def.palette)) {
					expect(color, `palette char '${char}'`).toMatch(/^#[0-9A-Fa-f]{6}$/);
				}
			});
		});
	}
});

// ---------------------------------------------------------------------------
// Portrait consistency checks
// ---------------------------------------------------------------------------

describe("Portrait sprite consistency", () => {
	const portraitNames = [
		"foxhound",
		"gen-whiskers",
		"cpl-splash",
		"sgt-fang",
		"medic-marina",
		"pvt-muskrat",
	];

	it("all portraits have identical dimensions", () => {
		for (const name of portraitNames) {
			const def = loadSprite("portraits", name);
			expect(def.meta.width, `${name} width`).toBe(PORTRAIT_WIDTH);
			expect(def.meta.height, `${name} height`).toBe(PORTRAIT_HEIGHT);
		}
	});

	it("all portraits render without error at 3x", () => {
		for (const name of portraitNames) {
			const def = loadSprite("portraits", name);
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(PORTRAIT_WIDTH * RENDER_SCALE);
			expect(img.height).toBe(PORTRAIT_HEIGHT * RENDER_SCALE);
		}
	});

	it("each portrait has unique pixel data", () => {
		// Compare pixel data hashes to ensure portraits are visually distinct
		const pixelHashes = new Map<string, string>();
		for (const name of portraitNames) {
			const def = loadSprite("portraits", name);
			const img = compileSpriteToPixels(def, 0, 1);
			// Hash: sum every 50th pixel's RGB values
			let hash = 0;
			for (let i = 0; i < img.data.length; i += 200) {
				hash = (hash * 31 + img.data[i] + img.data[i + 1] * 256 + img.data[i + 2] * 65536) | 0;
			}
			const key = String(hash);
			expect(pixelHashes.has(key), `${name} has same pixel hash as ${pixelHashes.get(key)}`).toBe(
				false,
			);
			pixelHashes.set(key, name);
		}
	});
});
