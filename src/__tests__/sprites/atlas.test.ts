import { describe, expect, it } from "vitest";
import { generateAtlas } from "@/sprites/atlas";
import type { SpriteDefinition } from "@/sprites/types";

function makeDef(
	name: string,
	w: number,
	h: number,
	char: string,
	color: string,
): SpriteDefinition {
	const art = Array.from({ length: h }, () => char.repeat(w));
	return {
		meta: { name, width: w, height: h },
		palette: { [char]: color },
		animations: { idle: { frames: [0], rate: 1 } },
		frames: [{ index: 0, art }],
	};
}

describe("generateAtlas", () => {
	it("packs a single sprite into an atlas", () => {
		const sprites = [makeDef("a", 4, 4, "#", "#FF0000")];
		const result = generateAtlas(sprites, 1);
		expect(result.image.width).toBeGreaterThanOrEqual(4);
		expect(result.image.height).toBeGreaterThanOrEqual(4);
		expect(result.frames["a_0"]).toBeDefined();
		expect(result.frames["a_0"].w).toBe(4);
		expect(result.frames["a_0"].h).toBe(4);
	});

	it("packs multiple sprites and all frames have non-overlapping rects", () => {
		const sprites = [makeDef("a", 4, 4, "#", "#FF0000"), makeDef("b", 4, 4, ".", "#00FF00")];
		const result = generateAtlas(sprites, 1);

		const rectA = result.frames["a_0"];
		const rectB = result.frames["b_0"];
		expect(rectA).toBeDefined();
		expect(rectB).toBeDefined();

		// Rects should not overlap
		const overlapX = rectA.x < rectB.x + rectB.w && rectA.x + rectA.w > rectB.x;
		const overlapY = rectA.y < rectB.y + rectB.h && rectA.y + rectA.h > rectB.y;
		expect(overlapX && overlapY).toBe(false);
	});

	it("atlas contains pixel data from source sprites", () => {
		const sprites = [makeDef("red", 2, 2, "#", "#FF0000")];
		const result = generateAtlas(sprites, 1);
		const rect = result.frames["red_0"];

		// Check that the pixel at the rect location is red
		const idx = (rect.y * result.image.width + rect.x) * 4;
		expect(result.image.data[idx]).toBe(255); // R
		expect(result.image.data[idx + 1]).toBe(0); // G
		expect(result.image.data[idx + 2]).toBe(0); // B
		expect(result.image.data[idx + 3]).toBe(255); // A
	});

	it("packs multi-frame sprites as separate rects", () => {
		const def: SpriteDefinition = {
			meta: { name: "anim", width: 2, height: 2 },
			palette: { "#": "#FF0000", ".": "#00FF00" },
			animations: { walk: { frames: [0, 1], rate: 4 } },
			frames: [
				{ index: 0, art: ["##", "##"] },
				{ index: 1, art: ["..", ".."] },
			],
		};
		const result = generateAtlas([def], 1);
		expect(result.frames["anim_0"]).toBeDefined();
		expect(result.frames["anim_1"]).toBeDefined();
	});

	it("respects scale parameter", () => {
		const sprites = [makeDef("s", 2, 2, "#", "#FF0000")];
		const result = generateAtlas(sprites, 2);
		expect(result.frames["s_0"].w).toBe(4);
		expect(result.frames["s_0"].h).toBe(4);
	});
});
