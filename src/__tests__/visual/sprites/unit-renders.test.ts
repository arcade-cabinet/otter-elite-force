/**
 * Visual Specification Tests — Unit Sprites
 *
 * Layer 2: Verify each unit sprite renders at correct dimensions,
 * has non-empty pixel content, and displays correct faction colors.
 *
 * Runs in happy-dom with ImageData polyfill — pixel data is verified
 * directly from compileSpriteToPixels output.
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

/** Get RGBA at a pixel coordinate from ImageData */
function getPixel(img: ImageData, x: number, y: number): [number, number, number, number] {
	const idx = (y * img.width + x) * 4;
	return [img.data[idx], img.data[idx + 1], img.data[idx + 2], img.data[idx + 3]];
}

/** Count total opaque pixels in an ImageData */
function countOpaquePixels(img: ImageData): number {
	let count = 0;
	for (let i = 3; i < img.data.length; i += 4) {
		if (img.data[i] > 0) count++;
	}
	return count;
}

/** Check if pixel RGB matches expected (ignoring alpha) */
function pixelMatches(
	img: ImageData,
	x: number,
	y: number,
	r: number,
	g: number,
	b: number,
): boolean {
	const [pr, pg, pb, pa] = getPixel(img, x, y);
	return pa > 0 && pr === r && pg === g && pb === b;
}

/** Search for a color within a rectangular region of the image */
function findColor(
	img: ImageData,
	r: number,
	g: number,
	b: number,
	startX: number,
	startY: number,
	width: number,
	height: number,
): boolean {
	for (let y = startY; y < startY + height && y < img.height; y++) {
		for (let x = startX; x < startX + width && x < img.width; x++) {
			if (pixelMatches(img, x, y, r, g, b)) return true;
		}
	}
	return false;
}

// ---------------------------------------------------------------------------
// URA Unit Colors
// ---------------------------------------------------------------------------
// URA units use blue uniforms: "=" = #1E3A8A (dark blue), "-" = #3B82F6 (light blue)
const URA_BLUE = { r: 30, g: 58, b: 138 }; // #1E3A8A — torso/uniform base
const URA_LIGHT_BLUE = { r: 59, g: 130, b: 246 }; // #3B82F6 — uniform accent

// Scale-Guard units use green: "#" = #2D5A27 (dark green), "=" = #3D7A34
const SG_DARK_GREEN = { r: 45, g: 90, b: 39 }; // #2D5A27 — body base
const SG_RED_EYES = { r: 255, g: 68, b: 68 }; // #FF4444 — eyes

// Common across factions
const SKIN_TONE = { r: 255, g: 204, b: 153 }; // #FFCC99 — face/hands

const RENDER_SCALE = 3;

// ---------------------------------------------------------------------------
// URA Unit Sprites
// ---------------------------------------------------------------------------

describe("URA unit sprites", () => {
	describe("River Rat", () => {
		const def = loadSprite("units", "river-rat");

		it("parses with correct metadata", () => {
			expect(def.meta.name).toBe("river-rat");
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("has 2 frames (idle + walk)", () => {
			expect(def.frames).toHaveLength(2);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content (not all transparent)", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			const opaque = countOpaquePixels(img);
			expect(opaque).toBeGreaterThan(100);
		});

		it("has skin tone pixels in chin region", () => {
			// "o" = #FFCC99 at row 4, cols 6-9 (chin area after parseArtBlock strips leading blank)
			const img = compileSpriteToPixels(def, 0, 1);
			// Search for skin tone in the face/chin band (rows 3-6)
			const found = findColor(img, SKIN_TONE.r, SKIN_TONE.g, SKIN_TONE.b, 0, 3, 16, 4);
			expect(found).toBe(true);
		});

		it("walk animation has 2 frames", () => {
			expect(def.animations.walk.frames).toHaveLength(2);
		});
	});

	describe("Mudfoot", () => {
		const def = loadSprite("units", "mudfoot");

		it("parses with correct metadata", () => {
			expect(def.meta.name).toBe("mudfoot");
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("has 4 frames (idle, walk x2 unique, attack)", () => {
			expect(def.frames).toHaveLength(4);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});

		it("has URA blue pixels in torso region", () => {
			// "=" = #1E3A8A in the torso band (rows 5-10)
			const img = compileSpriteToPixels(def, 0, 1);
			const found = findColor(img, URA_BLUE.r, URA_BLUE.g, URA_BLUE.b, 0, 5, 16, 6);
			expect(found).toBe(true);
		});

		it("has URA light blue accent pixels", () => {
			// "-" = #3B82F6 in torso detail (rows 5-10)
			const img = compileSpriteToPixels(def, 0, 1);
			const found = findColor(
				img,
				URA_LIGHT_BLUE.r,
				URA_LIGHT_BLUE.g,
				URA_LIGHT_BLUE.b,
				0,
				5,
				16,
				6,
			);
			expect(found).toBe(true);
		});

		it("has skin tone pixels in chin region", () => {
			// "o" = #FFCC99 in the chin/face band
			const img = compileSpriteToPixels(def, 0, 1);
			const found = findColor(img, SKIN_TONE.r, SKIN_TONE.g, SKIN_TONE.b, 0, 3, 16, 4);
			expect(found).toBe(true);
		});

		it("walk animation cycles 4 frames", () => {
			expect(def.animations.walk.frames).toHaveLength(4);
		});

		it("attack animation has 2 frames", () => {
			expect(def.animations.attack.frames).toHaveLength(2);
		});
	});

	describe("Shellcracker", () => {
		const def = loadSprite("units", "shellcracker");

		it("parses with correct metadata", () => {
			expect(def.meta.name).toBe("shellcracker");
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("has 4 frames", () => {
			expect(def.frames).toHaveLength(4);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has URA blue in torso", () => {
			const img = compileSpriteToPixels(def, 0, 1);
			// "=" = #1E3A8A in the torso region (rows 4-10)
			const found = findColor(img, URA_BLUE.r, URA_BLUE.g, URA_BLUE.b, 0, 4, 16, 7);
			expect(found).toBe(true);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});

		it("walk animation cycles 4 frames", () => {
			expect(def.animations.walk.frames).toHaveLength(4);
		});

		it("attack animation has 2 frames at rate 4", () => {
			expect(def.animations.attack.frames).toHaveLength(2);
			expect(def.animations.attack.rate).toBe(4);
		});
	});

	describe("Sapper", () => {
		const def = loadSprite("units", "sapper");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});

	describe("Raftsman", () => {
		const def = loadSprite("units", "raftsman");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});

	describe("Mortar Otter", () => {
		const def = loadSprite("units", "mortar-otter");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});

	describe("Diver", () => {
		const def = loadSprite("units", "diver");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});
});

// ---------------------------------------------------------------------------
// Scale-Guard Unit Sprites
// ---------------------------------------------------------------------------

describe("Scale-Guard unit sprites", () => {
	describe("Gator", () => {
		const def = loadSprite("units", "gator");

		it("parses with correct metadata", () => {
			expect(def.meta.name).toBe("gator");
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("has 3 frames (idle, walk, attack)", () => {
			expect(def.frames).toHaveLength(3);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});

		it("has Scale-Guard dark green body pixels", () => {
			const img = compileSpriteToPixels(def, 0, 1);
			// "#" = #2D5A27 — body fill on the head/torso area (rows 0-8)
			const found = findColor(img, SG_DARK_GREEN.r, SG_DARK_GREEN.g, SG_DARK_GREEN.b, 0, 0, 16, 9);
			expect(found).toBe(true);
		});

		it("has red eye pixels", () => {
			const img = compileSpriteToPixels(def, 0, 1);
			// "." = #FF4444 — eyes in the head region (rows 0-5)
			const found = findColor(img, SG_RED_EYES.r, SG_RED_EYES.g, SG_RED_EYES.b, 0, 0, 16, 6);
			expect(found).toBe(true);
		});

		it("walk animation has 2 frames", () => {
			expect(def.animations.walk.frames).toHaveLength(2);
		});

		it("attack animation has 2 frames", () => {
			expect(def.animations.attack.frames).toHaveLength(2);
		});
	});

	describe("Viper", () => {
		const def = loadSprite("units", "viper");

		it("parses with correct metadata", () => {
			expect(def.meta.name).toBe("viper");
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("has 3 frames", () => {
			expect(def.frames).toHaveLength(3);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});

		it("has red eye pixels (Scale-Guard faction marker)", () => {
			const img = compileSpriteToPixels(def, 0, 1);
			// "." = #FF4444 — eyes in the head region (rows 0-6)
			const found = findColor(img, SG_RED_EYES.r, SG_RED_EYES.g, SG_RED_EYES.b, 0, 0, 16, 7);
			expect(found).toBe(true);
		});

		it("has spit animation with 2 frames", () => {
			expect(def.animations.spit.frames).toHaveLength(2);
		});
	});

	describe("Snapper", () => {
		const def = loadSprite("units", "snapper");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});

	describe("Scout Lizard", () => {
		const def = loadSprite("units", "scout-lizard");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});

	describe("Croc Champion", () => {
		const def = loadSprite("units", "croc-champion");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});

	describe("Siphon Drone", () => {
		const def = loadSprite("units", "siphon-drone");

		it("parses with correct metadata (16x16)", () => {
			expect(def.meta.width).toBe(16);
			expect(def.meta.height).toBe(16);
		});

		it("renders at 48x48 at 3x scale", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(img.width).toBe(48);
			expect(img.height).toBe(48);
		});

		it("has non-trivial pixel content", () => {
			const img = compileSpriteToPixels(def, 0, RENDER_SCALE);
			expect(countOpaquePixels(img)).toBeGreaterThan(100);
		});
	});
});

// ---------------------------------------------------------------------------
// Cross-cutting: All unit sprites
// ---------------------------------------------------------------------------

describe("All unit sprites", () => {
	const unitFiles = [
		"river-rat",
		"mudfoot",
		"shellcracker",
		"sapper",
		"raftsman",
		"mortar-otter",
		"diver",
		"gator",
		"viper",
		"snapper",
		"scout-lizard",
		"croc-champion",
		"siphon-drone",
	];

	for (const name of unitFiles) {
		describe(name, () => {
			const def = loadSprite("units", name);

			it("has at least 1 frame", () => {
				expect(def.frames.length).toBeGreaterThanOrEqual(1);
			});

			it("has an idle animation referencing frame 0", () => {
				expect(def.animations.idle).toBeDefined();
				expect(def.animations.idle.frames).toContain(0);
			});

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

			it("palette has no empty color values", () => {
				for (const [char, color] of Object.entries(def.palette)) {
					expect(color, `${name} palette char '${char}'`).toMatch(/^#[0-9A-Fa-f]{6}$/);
				}
			});

			it("all frames render without error at 3x", () => {
				for (const frame of def.frames) {
					const img = compileSpriteToPixels(def, frame.index, RENDER_SCALE);
					expect(img.width).toBe(def.meta.width * RENDER_SCALE);
					expect(img.height).toBe(def.meta.height * RENDER_SCALE);
				}
			});

			it("all frames have non-zero opaque pixel count", () => {
				for (const frame of def.frames) {
					const img = compileSpriteToPixels(def, frame.index, 1);
					expect(countOpaquePixels(img), `${name} frame ${frame.index}`).toBeGreaterThan(0);
				}
			});
		});
	}
});
