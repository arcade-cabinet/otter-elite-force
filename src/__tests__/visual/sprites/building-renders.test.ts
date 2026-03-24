/**
 * Visual Specification Tests — Building Sprites
 *
 * Layer 2: Verify each building sprite renders at correct dimensions,
 * has non-empty pixel content, and displays correct faction colors.
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

const RENDER_SCALE = 3;

// ---------------------------------------------------------------------------
// URA Buildings (32x32 sprites)
// ---------------------------------------------------------------------------

describe("URA building sprites", () => {
	const uraBuildings = [
		{ name: "command-post", width: 32, height: 32 },
		{ name: "barracks", width: 32, height: 32 },
		{ name: "watchtower", width: 32, height: 32 },
		{ name: "fish-trap", width: 32, height: 32 },
		{ name: "burrow", width: 32, height: 32 },
		{ name: "sandbag-wall", width: 32, height: 32 },
		{ name: "armory", width: 32, height: 32 },
		{ name: "dock", width: 32, height: 32 },
		{ name: "field-hospital", width: 32, height: 32 },
		{ name: "stone-wall", width: 32, height: 32 },
		{ name: "gun-tower", width: 32, height: 32 },
		{ name: "minefield", width: 32, height: 32 },
	];

	for (const building of uraBuildings) {
		describe(building.name, () => {
			const def = loadSprite("buildings", building.name);

			it(`parses with correct metadata (${building.width}x${building.height})`, () => {
				expect(def.meta.width).toBe(building.width);
				expect(def.meta.height).toBe(building.height);
			});

			it("has at least 1 frame", () => {
				expect(def.frames.length).toBeGreaterThanOrEqual(1);
			});

			it("has an idle animation", () => {
				expect(def.animations.idle).toBeDefined();
				expect(def.animations.idle.frames).toContain(0);
			});

			it(`renders at ${building.width * RENDER_SCALE}x${building.height * RENDER_SCALE} at 3x scale`, () => {
				const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
				expect(img.width).toBe(building.width * RENDER_SCALE);
				expect(img.height).toBe(building.height * RENDER_SCALE);
			});

			it("has non-trivial pixel content", () => {
				const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
				expect(countOpaquePixels(img)).toBeGreaterThan(50);
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
// Scale-Guard Buildings
// ---------------------------------------------------------------------------

describe("Scale-Guard building sprites", () => {
	describe("Siphon", () => {
		const def = loadSprite("buildings", "siphon");

		it("parses with correct metadata", () => {
			expect(def.meta.width).toBeGreaterThanOrEqual(16);
			expect(def.meta.height).toBeGreaterThanOrEqual(16);
		});

		it("has at least 1 frame", () => {
			expect(def.frames.length).toBeGreaterThanOrEqual(1);
		});

		it("has an idle animation", () => {
			expect(def.animations.idle).toBeDefined();
		});

		it("renders without error at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(def.meta.width * RENDER_SCALE);
			expect(img.height).toBe(def.meta.height * RENDER_SCALE);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(50);
		});
	});
});

// ---------------------------------------------------------------------------
// Cross-cutting: All building sprites
// ---------------------------------------------------------------------------

describe("All building sprites", () => {
	const buildingFiles = [
		"command-post",
		"barracks",
		"watchtower",
		"fish-trap",
		"burrow",
		"sandbag-wall",
		"armory",
		"dock",
		"field-hospital",
		"stone-wall",
		"gun-tower",
		"minefield",
		"siphon",
	];

	for (const name of buildingFiles) {
		describe(name, () => {
			const def = loadSprite("buildings", name);

			it("all animation frame indices reference existing frames", () => {
				const maxFrame = def.frames.length - 1;
				for (const [animName, anim] of Object.entries(def.animations)) {
					for (const fi of anim.frames) {
						expect(fi, `${name} animation ${animName} references frame ${fi}`).toBeLessThanOrEqual(
							maxFrame,
						);
						expect(fi).toBeGreaterThanOrEqual(0);
					}
				}
			});

			it("all frames render without error", () => {
				for (const frame of def.frames) {
					const img = compileSpriteToPixels(def, frame.index, 1);
					expect(img.width).toBe(def.meta.width);
					expect(img.height).toBe(def.meta.height);
					expect(countOpaquePixels(img)).toBeGreaterThan(0);
				}
			});
		});
	}
});
