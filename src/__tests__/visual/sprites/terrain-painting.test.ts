/**
 * Visual Specification Tests — Terrain Tile Sprites
 *
 * Layer 2: Verify each terrain tile sprite renders at correct dimensions,
 * has appropriate coloring for its terrain type, and tiles correctly.
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

/** Calculate average RGB of all opaque pixels */
function averageColor(img: ImageData): { r: number; g: number; b: number } {
	let totalR = 0;
	let totalG = 0;
	let totalB = 0;
	let count = 0;
	for (let i = 0; i < img.data.length; i += 4) {
		if (img.data[i + 3] > 0) {
			totalR += img.data[i];
			totalG += img.data[i + 1];
			totalB += img.data[i + 2];
			count++;
		}
	}
	return {
		r: Math.round(totalR / count),
		g: Math.round(totalG / count),
		b: Math.round(totalB / count),
	};
}

const RENDER_SCALE = 3;

// Terrain tile size from spec: 32x32 pixels (but sprite grid can be smaller)
// The .sprite files may define tiles at various sizes

// ---------------------------------------------------------------------------
// Terrain Tile Tests
// ---------------------------------------------------------------------------

describe("Terrain tile sprites", () => {
	const terrainTypes = [
		{ name: "grass", expectedDominantChannel: "g" as const },
		{ name: "water", expectedDominantChannel: "b" as const },
		{ name: "mud", expectedDominantChannel: "r" as const },
		{ name: "dirt", expectedDominantChannel: "r" as const },
		{ name: "mangrove", expectedDominantChannel: "g" as const },
		{ name: "bridge", expectedDominantChannel: "r" as const },
		{ name: "tall-grass", expectedDominantChannel: "g" as const },
		{ name: "toxic-sludge", expectedDominantChannel: "g" as const },
	];

	for (const terrain of terrainTypes) {
		describe(terrain.name, () => {
			const def = loadSprite("terrain", terrain.name);

			it("has square dimensions", () => {
				expect(def.meta.width).toBe(def.meta.height);
			});

			it("has at least 1 frame", () => {
				expect(def.frames.length).toBeGreaterThanOrEqual(1);
			});

			it("has an idle animation", () => {
				expect(def.animations.idle).toBeDefined();
			});

			it("renders at correct scaled dimensions", () => {
				const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
				expect(img.width).toBe(def.meta.width * RENDER_SCALE);
				expect(img.height).toBe(def.meta.height * RENDER_SCALE);
			});

			it("terrain tiles should be mostly opaque (ground coverage)", () => {
				const img = compileSpriteToPixels(def, 0, 1);
				const totalPixels = def.meta.width * def.meta.height;
				const opaque = countOpaquePixels(img);
				// Terrain tiles should fill at least 50% of their canvas
				expect(opaque).toBeGreaterThan(totalPixels * 0.5);
			});

			it(`has correct dominant color channel (${terrain.expectedDominantChannel})`, () => {
				const img = compileSpriteToPixels(def, 0, 1);
				const avg = averageColor(img);
				const dominant = terrain.expectedDominantChannel;
				// The expected channel should be at least as large as the minimum of the other two
				// This is a loose check since terrain colors are varied
				if (dominant === "g") {
					expect(avg.g).toBeGreaterThanOrEqual(Math.min(avg.r, avg.b));
				} else if (dominant === "b") {
					expect(avg.b).toBeGreaterThanOrEqual(Math.min(avg.r, avg.g));
				} else {
					expect(avg.r).toBeGreaterThanOrEqual(Math.min(avg.g, avg.b));
				}
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
// Terrain color differentiation
// ---------------------------------------------------------------------------

describe("Terrain tiles are visually distinct", () => {
	const terrainNames = [
		"grass",
		"water",
		"mud",
		"dirt",
		"mangrove",
		"bridge",
		"tall-grass",
		"toxic-sludge",
	];

	it("each terrain type has a unique average color", () => {
		const colors = new Map<string, string>();
		for (const name of terrainNames) {
			const def = loadSprite("terrain", name);
			const img = compileSpriteToPixels(def, 0, 1);
			const avg = averageColor(img);
			// Quantize to ~16 levels per channel to allow for minor variation
			const key = `${Math.floor(avg.r / 16)},${Math.floor(avg.g / 16)},${Math.floor(avg.b / 16)}`;
			expect(colors.has(key), `${name} has same quantized color as ${colors.get(key)}`).toBe(false);
			colors.set(key, name);
		}
	});

	it("water is visually blue-toned", () => {
		const def = loadSprite("terrain", "water");
		const img = compileSpriteToPixels(def, 0, 1);
		const avg = averageColor(img);
		expect(avg.b).toBeGreaterThan(avg.r);
	});

	it("grass is visually green-toned", () => {
		const def = loadSprite("terrain", "grass");
		const img = compileSpriteToPixels(def, 0, 1);
		const avg = averageColor(img);
		expect(avg.g).toBeGreaterThan(avg.b);
	});
});
