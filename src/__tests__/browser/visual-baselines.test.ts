/**
 * Visual baseline tests — render sprites and portraits in Vitest browser mode.
 *
 * Run with: pnpm test:browser
 *
 * These tests initialize the sprite and portrait generators in a real browser,
 * verify they produce canvas elements of correct dimensions, and check basic
 * pixel non-emptiness (not all transparent).
 */

import { describe, expect, it } from "vitest";
import { initSprites, spriteCache, getSprite, type SpriteType } from "../../canvas/spriteGen";
import { initPortraits, getPortraitCanvas, getPortraitIds } from "../../canvas/portraitRenderer";

describe("Visual: Sprite generation", () => {
	it("generates all 47+ entity sprites without errors", () => {
		initSprites();
		expect(spriteCache.size).toBeGreaterThanOrEqual(47);
	});

	it("each sprite canvas has non-zero dimensions", () => {
		initSprites();
		for (const [id, canvas] of spriteCache) {
			expect(canvas.width).toBeGreaterThan(0);
			expect(canvas.height).toBeGreaterThan(0);
		}
	});

	it("otter worker sprite has visible pixels", () => {
		initSprites();
		const sprite = getSprite("river_rat" as SpriteType);
		expect(sprite).not.toBeNull();
		const ctx = sprite!.getContext("2d")!;
		const data = ctx.getImageData(0, 0, sprite!.width, sprite!.height).data;
		// Check at least some non-transparent pixels exist
		let nonTransparent = 0;
		for (let i = 3; i < data.length; i += 4) {
			if (data[i] > 0) nonTransparent++;
		}
		expect(nonTransparent).toBeGreaterThan(50);
	});

	it("gator sprite has visible pixels", () => {
		initSprites();
		const sprite = getSprite("gator" as SpriteType);
		expect(sprite).not.toBeNull();
		const ctx = sprite!.getContext("2d")!;
		const data = ctx.getImageData(0, 0, sprite!.width, sprite!.height).data;
		let nonTransparent = 0;
		for (let i = 3; i < data.length; i += 4) {
			if (data[i] > 0) nonTransparent++;
		}
		expect(nonTransparent).toBeGreaterThan(50);
	});
});

describe("Visual: Portrait generation", () => {
	it("generates all 12 character portraits", () => {
		initPortraits();
		const ids = getPortraitIds();
		expect(ids.length).toBeGreaterThanOrEqual(12);
	});

	it("each portrait is 128x128", () => {
		initPortraits();
		for (const id of getPortraitIds()) {
			const canvas = getPortraitCanvas(id);
			expect(canvas).not.toBeNull();
			expect(canvas!.width).toBe(128);
			expect(canvas!.height).toBe(128);
		}
	});

	it("Sgt Bubbles portrait has visible pixels", () => {
		initPortraits();
		const canvas = getPortraitCanvas("sgt_bubbles");
		expect(canvas).not.toBeNull();
		const ctx = canvas!.getContext("2d")!;
		const data = ctx.getImageData(0, 0, canvas!.width, canvas!.height).data;
		let nonTransparent = 0;
		for (let i = 3; i < data.length; i += 4) {
			if (data[i] > 0) nonTransparent++;
		}
		// Portrait should have substantial content (at least 20% of pixels)
		expect(nonTransparent).toBeGreaterThan(canvas!.width * canvas!.height * 0.2);
	});

	it("Ironjaw portrait has visible pixels", () => {
		initPortraits();
		const canvas = getPortraitCanvas("ironjaw");
		expect(canvas).not.toBeNull();
		const ctx = canvas!.getContext("2d")!;
		const data = ctx.getImageData(0, 0, canvas!.width, canvas!.height).data;
		let nonTransparent = 0;
		for (let i = 3; i < data.length; i += 4) {
			if (data[i] > 0) nonTransparent++;
		}
		expect(nonTransparent).toBeGreaterThan(canvas!.width * canvas!.height * 0.2);
	});
});
