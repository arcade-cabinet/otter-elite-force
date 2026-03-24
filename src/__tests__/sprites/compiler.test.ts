import { describe, expect, it } from "vitest";
import { compileSpriteToPixels } from "@/sprites/compiler";
import type { SpriteDefinition } from "@/sprites/types";

function makeSimpleDef(): SpriteDefinition {
	return {
		meta: { name: "tiny", width: 2, height: 2 },
		palette: {
			"#": "#FF0000",
			".": "#00FF00",
		},
		animations: { idle: { frames: [0], rate: 1 } },
		frames: [
			{
				index: 0,
				art: ["#.", ".#"],
			},
		],
	};
}

describe("compileSpriteToPixels", () => {
	it("returns ImageData with correct dimensions at scale 1", () => {
		const def = makeSimpleDef();
		const img = compileSpriteToPixels(def, 0, 1);
		expect(img.width).toBe(2);
		expect(img.height).toBe(2);
	});

	it("returns ImageData with scaled dimensions at scale 2", () => {
		const def = makeSimpleDef();
		const img = compileSpriteToPixels(def, 0, 2);
		expect(img.width).toBe(4);
		expect(img.height).toBe(4);
	});

	it("maps palette characters to correct RGBA colors at scale 1", () => {
		const def = makeSimpleDef();
		const img = compileSpriteToPixels(def, 0, 1);
		const d = img.data;

		// Pixel (0,0) = '#' = #FF0000
		expect(d[0]).toBe(255); // R
		expect(d[1]).toBe(0); // G
		expect(d[2]).toBe(0); // B
		expect(d[3]).toBe(255); // A

		// Pixel (1,0) = '.' = #00FF00
		expect(d[4]).toBe(0); // R
		expect(d[5]).toBe(255); // G
		expect(d[6]).toBe(0); // B
		expect(d[7]).toBe(255); // A
	});

	it("treats space as transparent", () => {
		const def: SpriteDefinition = {
			meta: { name: "transparent", width: 2, height: 1 },
			palette: { "#": "#FF0000" },
			animations: { idle: { frames: [0], rate: 1 } },
			frames: [{ index: 0, art: ["# "] }],
		};
		const img = compileSpriteToPixels(def, 0, 1);
		const d = img.data;

		// Pixel (0,0) = '#' = opaque red
		expect(d[3]).toBe(255);

		// Pixel (1,0) = ' ' = transparent
		expect(d[4]).toBe(0);
		expect(d[5]).toBe(0);
		expect(d[6]).toBe(0);
		expect(d[7]).toBe(0);
	});

	it("scales pixels correctly at scale 2", () => {
		const def: SpriteDefinition = {
			meta: { name: "scaled", width: 1, height: 1 },
			palette: { "#": "#0000FF" },
			animations: { idle: { frames: [0], rate: 1 } },
			frames: [{ index: 0, art: ["#"] }],
		};
		const img = compileSpriteToPixels(def, 0, 2);
		const d = img.data;

		// All 4 pixels (2x2) should be blue
		for (let i = 0; i < 4; i++) {
			const offset = i * 4;
			expect(d[offset]).toBe(0); // R
			expect(d[offset + 1]).toBe(0); // G
			expect(d[offset + 2]).toBe(255); // B
			expect(d[offset + 3]).toBe(255); // A
		}
	});

	it("compiles specific frame index", () => {
		const def: SpriteDefinition = {
			meta: { name: "multi", width: 1, height: 1 },
			palette: { "#": "#FF0000", ".": "#00FF00" },
			animations: { idle: { frames: [0], rate: 1 } },
			frames: [
				{ index: 0, art: ["#"] },
				{ index: 1, art: ["."] },
			],
		};
		const img0 = compileSpriteToPixels(def, 0, 1);
		expect(img0.data[0]).toBe(255); // Red
		expect(img0.data[1]).toBe(0);

		const img1 = compileSpriteToPixels(def, 1, 1);
		expect(img1.data[0]).toBe(0);
		expect(img1.data[1]).toBe(255); // Green
	});
});
