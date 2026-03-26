/**
 * US-R01: Procedural sprite generator — unit tests
 *
 * Validates:
 * - Every registered sprite type produces a canvas
 * - Unit sprites are 40×40 (16 × 2.5)
 * - Building sprites are 96×96 (32 × 3)
 * - initSprites() populates the cache for all types
 * - getSprite() returns cached canvases
 *
 * Uses @napi-rs/canvas (node-canvas) to provide a real Canvas2D backend
 * following the Konva reference testing pattern. This avoids relying on
 * happy-dom/jsdom's non-existent Canvas2D support.
 */

import { createCanvas } from "@napi-rs/canvas";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

// ─── Canvas2D backend via @napi-rs/canvas ───
// Patch document.createElement to return real node-canvas instances
// when 'canvas' is requested, following the Konva test setup pattern.

const origCreateElement = document.createElement.bind(document);

beforeAll(() => {
	// biome-ignore lint/suspicious/noExplicitAny: test setup for node-canvas
	(document as any).createElement = (tagName: string, ...args: any[]) => {
		if (tagName === "canvas") {
			return createCanvas(300, 300) as unknown as HTMLCanvasElement;
		}
		return origCreateElement(tagName, ...args);
	};
});

afterAll(() => {
	document.createElement = origCreateElement;
});

import {
	generateSprite,
	getSprite,
	initSprites,
	SPRITE_TYPES,
	type SpriteType,
	spriteCache,
} from "@/canvas/spriteGen";

const UNIT_TYPES: SpriteType[] = [
	"river_rat",
	"mudfoot",
	"shellcracker",
	"sapper",
	"raftsman",
	"mortar_otter",
	"diver",
	"skink",
	"gator",
	"viper",
	"snapper",
	"scout_lizard",
	"croc_champion",
	"siphon_drone",
	"serpent_king",
	"col_bubbles",
	"gen_whiskers",
	"cpl_splash",
	"sgt_fang",
	"medic_marina",
	"pvt_muskrat",
];
const BUILDING_TYPES: SpriteType[] = [
	"command_post",
	"barracks",
	"armory",
	"watchtower",
	"fish_trap",
	"burrow",
	"dock",
	"field_hospital",
	"sandbag_wall",
	"stone_wall",
	"gun_tower",
	"minefield",
	"flag_post",
	"fuel_tank",
	"great_siphon",
	"sludge_pit",
	"spawning_pool",
	"venom_spire",
	"siphon",
	"scale_wall",
	"shield_generator",
];
const RESOURCE_TYPES: SpriteType[] = [
	"fish_spot",
	"intel_marker",
	"mangrove_tree",
	"salvage_cache",
	"supply_crate",
];

afterEach(() => {
	spriteCache.clear();
});

describe("spriteGen", () => {
	describe("SPRITE_TYPES registry", () => {
		it("contains all 47 entity IDs from the registry", () => {
			// Spot-check representative IDs from each category
			expect(SPRITE_TYPES).toContain("river_rat");
			expect(SPRITE_TYPES).toContain("gator");
			expect(SPRITE_TYPES).toContain("col_bubbles");
			expect(SPRITE_TYPES).toContain("command_post");
			expect(SPRITE_TYPES).toContain("spawning_pool");
			expect(SPRITE_TYPES).toContain("fish_spot");
			expect(SPRITE_TYPES.length).toBe(47);
		});
	});

	describe("generateSprite()", () => {
		it.each(UNIT_TYPES)('generates a 40×40 canvas for unit/hero "%s"', (type) => {
			const canvas = generateSprite(type);
			expect(canvas.width).toBe(40);
			expect(canvas.height).toBe(40);
			expect(canvas.getContext("2d")).not.toBeNull();
		});

		it.each(BUILDING_TYPES)('generates a 96×96 canvas for building "%s"', (type) => {
			const canvas = generateSprite(type);
			expect(canvas.width).toBe(96);
			expect(canvas.height).toBe(96);
			expect(canvas.getContext("2d")).not.toBeNull();
		});

		it.each(RESOURCE_TYPES)('generates a 40×40 canvas for resource "%s"', (type) => {
			const canvas = generateSprite(type);
			expect(canvas.width).toBe(40);
			expect(canvas.height).toBe(40);
			expect(canvas.getContext("2d")).not.toBeNull();
		});

		it("produces canvases with non-transparent pixels", () => {
			for (const type of ["river_rat", "command_post", "fish_spot"] as SpriteType[]) {
				const canvas = generateSprite(type);
				const ctx = canvas.getContext("2d")!;
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				let hasPixels = false;
				for (let i = 3; i < imageData.data.length; i += 4) {
					if (imageData.data[i] > 0) {
						hasPixels = true;
						break;
					}
				}
				expect(hasPixels).toBe(true);
			}
		});
	});

	describe("initSprites()", () => {
		it("populates spriteCache with all 47 sprite types", () => {
			expect(spriteCache.size).toBe(0);
			initSprites();
			expect(spriteCache.size).toBe(SPRITE_TYPES.length);
			for (const type of SPRITE_TYPES) {
				expect(spriteCache.has(type)).toBe(true);
				const s = spriteCache.get(type);
				expect(s).toBeDefined();
				expect(s!.getContext("2d")).not.toBeNull();
			}
		});

		it("clears previous cache on re-init", () => {
			initSprites();
			const first = spriteCache.get("river_rat");
			initSprites();
			const second = spriteCache.get("river_rat");
			expect(first).not.toBe(second);
		});
	});

	describe("getSprite()", () => {
		it("returns undefined before initSprites()", () => {
			expect(getSprite("river_rat")).toBeUndefined();
		});

		it("returns cached canvas after initSprites()", () => {
			initSprites();
			const sprite = getSprite("river_rat");
			expect(sprite).toBeDefined();
			expect(sprite!.getContext("2d")).not.toBeNull();
			expect(sprite).toBe(spriteCache.get("river_rat"));
		});

		it("returns undefined for unknown types", () => {
			initSprites();
			expect(getSprite("nonexistent")).toBeUndefined();
		});
	});
});
