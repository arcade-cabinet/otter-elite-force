import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseSpriteFile } from "@/sprites/parser";
import { compileSpriteToPixels } from "@/sprites/compiler";
import { generateAtlas } from "@/sprites/atlas";
import { categorizeSprites, buildAtlasManifest, SPRITE_CATEGORIES } from "@/sprites/vitePlugin";
import type { SpriteDefinition } from "@/sprites/types";

const ASSETS_ROOT = join(__dirname, "../../sprites/assets");

function findSpriteFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) results.push(...findSpriteFiles(full));
		else if (entry.endsWith(".sprite")) results.push(full);
	}
	return results;
}

function loadAllSprites(): Map<string, SpriteDefinition> {
	const map = new Map<string, SpriteDefinition>();
	for (const file of findSpriteFiles(ASSETS_ROOT)) {
		const content = readFileSync(file, "utf-8");
		const def = parseSpriteFile(content);
		map.set(file, def);
	}
	return map;
}

describe("categorizeSprites", () => {
	it("sorts sprite files into correct categories", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const categories = categorizeSprites(files);

		expect(categories.units.length).toBeGreaterThan(0);
		expect(categories.buildings.length).toBeGreaterThan(0);
		expect(categories.terrain.length).toBeGreaterThan(0);
		expect(categories.portraits.length).toBeGreaterThan(0);
	});

	it("categorizes unit files into units category", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const categories = categorizeSprites(files);

		const unitNames = categories.units.map((f) => f.split("/").pop()?.replace(".sprite", ""));
		expect(unitNames).toContain("mudfoot");
		expect(unitNames).toContain("gator");
		expect(unitNames).toContain("river-rat");
	});

	it("puts campaign-map in misc category", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const categories = categorizeSprites(files);

		const miscNames = categories.misc.map((f) => f.split("/").pop()?.replace(".sprite", ""));
		expect(miscNames).toContain("campaign-map");
	});
});

describe("buildAtlasManifest", () => {
	it("generates atlas data for each category", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const manifest = buildAtlasManifest(files, 1);

		expect(manifest.units).toBeDefined();
		expect(manifest.buildings).toBeDefined();
		expect(manifest.terrain).toBeDefined();
		expect(manifest.portraits).toBeDefined();
	});

	it("atlas contains frame rects for all sprites in category", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const manifest = buildAtlasManifest(files, 1);

		// Units atlas should contain mudfoot frames
		const unitFrameKeys = Object.keys(manifest.units.frames);
		expect(unitFrameKeys.some((k) => k.startsWith("mudfoot_"))).toBe(true);
		expect(unitFrameKeys.some((k) => k.startsWith("gator_"))).toBe(true);
	});

	it("atlas image dimensions are positive", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const manifest = buildAtlasManifest(files, 1);

		expect(manifest.units.image.width).toBeGreaterThan(0);
		expect(manifest.units.image.height).toBeGreaterThan(0);
		expect(manifest.terrain.image.width).toBeGreaterThan(0);
	});

	it("respects scale parameter", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		const m1 = buildAtlasManifest(files, 1);
		const m2 = buildAtlasManifest(files, 2);

		// Each individual frame should be 2x the size at scale 2
		const unitFrame1 = m1.units.frames["mudfoot_0"];
		const unitFrame2 = m2.units.frames["mudfoot_0"];
		expect(unitFrame2.w).toBe(unitFrame1.w * 2);
		expect(unitFrame2.h).toBe(unitFrame1.h * 2);
	});
});

describe("SPRITE_CATEGORIES", () => {
	it("defines expected category names", () => {
		expect(SPRITE_CATEGORIES).toContain("units");
		expect(SPRITE_CATEGORIES).toContain("buildings");
		expect(SPRITE_CATEGORIES).toContain("terrain");
		expect(SPRITE_CATEGORIES).toContain("portraits");
		expect(SPRITE_CATEGORIES).toContain("misc");
	});
});

describe("end-to-end sprite pipeline", () => {
	it("every .sprite file in assets/ can be parsed and compiled", () => {
		const files = findSpriteFiles(ASSETS_ROOT);
		expect(files.length).toBeGreaterThanOrEqual(41);

		for (const file of files) {
			const content = readFileSync(file, "utf-8");
			const def = parseSpriteFile(content);

			expect(def.meta.name).toBeTruthy();
			expect(def.meta.width).toBeGreaterThan(0);
			expect(def.meta.height).toBeGreaterThan(0);
			expect(def.frames.length).toBeGreaterThan(0);

			// Compile frame 0
			const img = compileSpriteToPixels(def, 0, 1);
			expect(img.width).toBe(def.meta.width);
			expect(img.height).toBe(def.meta.height);
			expect(img.data.length).toBe(def.meta.width * def.meta.height * 4);
		}
	});
});
