import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { SpriteDef } from "@/entities/types";

// happy-dom doesn't implement Canvas 2D context. Patch it before importing renderer.
const mockCtx = {
	fillStyle: "",
	fillRect: vi.fn(),
	imageSmoothingEnabled: true,
	drawImage: vi.fn(),
};

const origGetContext = HTMLCanvasElement.prototype.getContext;
beforeAll(() => {
	HTMLCanvasElement.prototype.getContext = vi
		.fn()
		.mockReturnValue(mockCtx) as unknown as typeof origGetContext;
});
afterAll(() => {
	HTMLCanvasElement.prototype.getContext = origGetContext;
});

// Import after mock is in place (vitest hoists imports, but the mock is on prototype so it works)
import { getScaleFactor, registerTextures, renderFrame, renderSprite } from "@/entities/renderer";

// A minimal 4x4 sprite for testing
const TINY_FRAME = ["..#.", ".BB.", ".BB.", "...."];

const TINY_SPRITE: SpriteDef = {
	size: 16,
	frames: {
		idle: [TINY_FRAME],
		walk: [TINY_FRAME, TINY_FRAME],
	},
	animationRates: { walk: 6 },
};

describe("getScaleFactor", () => {
	it("returns 3 for 16px grid on desktop", () => {
		expect(getScaleFactor(16)).toBe(3);
	});

	it("returns 3 for 32px grid on desktop", () => {
		expect(getScaleFactor(32)).toBe(3);
	});

	it("returns 1 for 64px+ grid with standard DPR", () => {
		expect(getScaleFactor(64)).toBe(1);
	});
});

describe("renderFrame", () => {
	it("returns a canvas with correct scaled dimensions", () => {
		const canvas = renderFrame(TINY_FRAME, 3);
		expect(canvas.width).toBe(4 * 3);
		expect(canvas.height).toBe(4 * 3);
	});

	it("returns a canvas at scale 1", () => {
		const canvas = renderFrame(TINY_FRAME, 1);
		expect(canvas.width).toBe(4);
		expect(canvas.height).toBe(4);
	});

	it("handles empty frame gracefully", () => {
		const canvas = renderFrame([], 2);
		expect(canvas.width).toBe(0);
		expect(canvas.height).toBe(0);
	});

	it("calls fillRect for non-transparent pixels", () => {
		mockCtx.fillRect.mockClear();
		renderFrame(["#."], 1);
		// '#' should trigger one fillRect, '.' should not
		expect(mockCtx.fillRect).toHaveBeenCalledTimes(1);
		expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1, 1);
	});
});

describe("renderSprite", () => {
	it("generates correct texture keys for idle + walk animations", () => {
		const result = renderSprite("mudfoot", TINY_SPRITE, 2);
		const keys = Array.from(result.textures.keys());

		expect(keys).toContain("mudfoot");
		expect(keys).toContain("mudfoot_walk_0");
		expect(keys).toContain("mudfoot_walk_1");
		expect(keys).toHaveLength(3);
	});

	it("sets width and height from rendered canvas", () => {
		const result = renderSprite("mudfoot", TINY_SPRITE, 2);
		expect(result.width).toBe(4 * 2);
		expect(result.height).toBe(4 * 2);
	});

	it("uses provided scale override", () => {
		const result = renderSprite("mudfoot", TINY_SPRITE, 5);
		expect(result.width).toBe(4 * 5);
	});
});

describe("registerTextures", () => {
	it("calls addCanvas for every texture in the rendered result", () => {
		const result = renderSprite("test", TINY_SPRITE, 1);
		const addCanvas = vi.fn();
		const mockTextureManager = { addCanvas };

		registerTextures(mockTextureManager, result);

		expect(addCanvas).toHaveBeenCalledTimes(result.textures.size);
		expect(addCanvas).toHaveBeenCalledWith("test", expect.any(HTMLCanvasElement));
		expect(addCanvas).toHaveBeenCalledWith("test_walk_0", expect.any(HTMLCanvasElement));
		expect(addCanvas).toHaveBeenCalledWith("test_walk_1", expect.any(HTMLCanvasElement));
	});
});
