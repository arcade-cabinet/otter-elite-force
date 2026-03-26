import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFogValue, renderFogOverlay } from "./fogRenderer";

// ─── getFogValue tests ───

describe("engine/rendering/fogRenderer/getFogValue", () => {
	it("returns 0 for unexplored tiles", () => {
		const grid = new Uint8Array([0, 1, 2, 0]);
		expect(getFogValue(grid, 2, 0, 0)).toBe(0);
		expect(getFogValue(grid, 2, 1, 1)).toBe(0);
	});

	it("returns 1 for explored tiles", () => {
		const grid = new Uint8Array([0, 1, 2, 0]);
		expect(getFogValue(grid, 2, 1, 0)).toBe(1);
	});

	it("returns 2 for visible tiles", () => {
		const grid = new Uint8Array([0, 1, 2, 0]);
		expect(getFogValue(grid, 2, 0, 1)).toBe(2);
	});

	it("returns 0 for out-of-bounds negative coordinates", () => {
		const grid = new Uint8Array([2, 2, 2, 2]);
		expect(getFogValue(grid, 2, -1, 0)).toBe(0);
		expect(getFogValue(grid, 2, 0, -1)).toBe(0);
	});

	it("returns 0 for out-of-bounds positive coordinates", () => {
		const grid = new Uint8Array([2, 2, 2, 2]);
		expect(getFogValue(grid, 2, 2, 0)).toBe(0);
		expect(getFogValue(grid, 2, 0, 5)).toBe(0);
	});

	it("handles a 1x1 grid", () => {
		const grid = new Uint8Array([1]);
		expect(getFogValue(grid, 1, 0, 0)).toBe(1);
	});

	it("handles a larger grid correctly", () => {
		// 4x3 grid
		const grid = new Uint8Array([0, 0, 0, 0, 0, 2, 2, 0, 0, 1, 1, 0]);
		expect(getFogValue(grid, 4, 0, 0)).toBe(0); // top-left unexplored
		expect(getFogValue(grid, 4, 1, 1)).toBe(2); // center visible
		expect(getFogValue(grid, 4, 2, 1)).toBe(2); // center visible
		expect(getFogValue(grid, 4, 1, 2)).toBe(1); // bottom explored
		expect(getFogValue(grid, 4, 3, 2)).toBe(0); // bottom-right unexplored
	});
});

// ─── renderFogOverlay tests ───

describe("engine/rendering/fogRenderer/renderFogOverlay", () => {
	let ctx: CanvasRenderingContext2D;
	let fillRectCalls: Array<{ style: string; x: number; y: number; w: number; h: number }>;

	beforeEach(() => {
		fillRectCalls = [];
		let currentFillStyle = "";
		ctx = {
			get fillStyle() {
				return currentFillStyle;
			},
			set fillStyle(v: string) {
				currentFillStyle = v;
			},
			fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
				fillRectCalls.push({ style: currentFillStyle, x, y, w, h });
			}),
		} as unknown as CanvasRenderingContext2D;
	});

	it("does nothing for empty fog grid", () => {
		renderFogOverlay(
			ctx,
			{ x: 0, y: 0, zoom: 1 },
			{ width: 320, height: 240 },
			new Uint8Array(0),
			0,
			0,
		);
		expect(fillRectCalls).toHaveLength(0);
	});

	it("does nothing for a fully visible grid", () => {
		const fog = new Uint8Array([2, 2, 2, 2]);
		renderFogOverlay(ctx, { x: 0, y: 0, zoom: 1 }, { width: 128, height: 128 }, fog, 2, 2);
		expect(fillRectCalls).toHaveLength(0);
	});

	it("draws black for unexplored tiles", () => {
		const fog = new Uint8Array([0]);
		renderFogOverlay(ctx, { x: 0, y: 0, zoom: 1 }, { width: 64, height: 64 }, fog, 1, 1);
		expect(fillRectCalls).toHaveLength(1);
		expect(fillRectCalls[0].style).toBe("#000000");
		expect(fillRectCalls[0].x).toBe(0);
		expect(fillRectCalls[0].y).toBe(0);
		expect(fillRectCalls[0].w).toBe(32);
		expect(fillRectCalls[0].h).toBe(32);
	});

	it("draws semi-transparent for explored tiles", () => {
		const fog = new Uint8Array([1]);
		renderFogOverlay(ctx, { x: 0, y: 0, zoom: 1 }, { width: 64, height: 64 }, fog, 1, 1);
		expect(fillRectCalls).toHaveLength(1);
		expect(fillRectCalls[0].style).toBe("rgba(0, 0, 0, 0.5)");
	});

	it("applies camera offset correctly", () => {
		const fog = new Uint8Array([0, 2, 2, 2]);
		renderFogOverlay(ctx, { x: 32, y: 32, zoom: 1 }, { width: 64, height: 64 }, fog, 2, 2);
		// Only tile (1,1) is in viewport at camera (32,32) + viewport 64x64
		// Tiles at (1,1) = visible, so nothing drawn
		// Tile (0,0) = unexplored but at screen pos (-32, -32), partially visible
		// Actually: camera at (32,32), viewport covers world x=[32..96], y=[32..96]
		// startTileX = floor(32/32) = 1, startTileY = 1
		// endTileX = ceil((32+64)/32) = 3 -> clamped to 2
		// endTileY = ceil((32+64)/32) = 3 -> clamped to 2
		// Only tile (1,1) which is visible, so no draws
		expect(fillRectCalls).toHaveLength(0);
	});

	it("applies zoom correctly", () => {
		const fog = new Uint8Array([0]);
		renderFogOverlay(ctx, { x: 0, y: 0, zoom: 2 }, { width: 128, height: 128 }, fog, 1, 1);
		expect(fillRectCalls).toHaveLength(1);
		// At zoom 2, tile 0,0 renders at screen (0,0) with size 64x64
		expect(fillRectCalls[0].w).toBe(64);
		expect(fillRectCalls[0].h).toBe(64);
	});

	it("only renders tiles within viewport (culling)", () => {
		// 4x4 grid, all unexplored
		const fog = new Uint8Array(16).fill(0);
		// Camera shows only the first 2x2 tiles
		renderFogOverlay(ctx, { x: 0, y: 0, zoom: 1 }, { width: 64, height: 64 }, fog, 4, 4);
		// Should render tiles (0,0), (0,1), (1,0), (1,1) = 4 tiles
		expect(fillRectCalls).toHaveLength(4);
	});

	it("handles mixed fog states", () => {
		// 2x2 grid: [unexplored, explored, visible, unexplored]
		const fog = new Uint8Array([0, 1, 2, 0]);
		renderFogOverlay(ctx, { x: 0, y: 0, zoom: 1 }, { width: 128, height: 128 }, fog, 2, 2);
		// Tile (0,0)=0 -> black, (1,0)=1 -> semi, (0,1)=2 -> skip, (1,1)=0 -> black
		expect(fillRectCalls).toHaveLength(3);

		const blackCalls = fillRectCalls.filter((c) => c.style === "#000000");
		const semiCalls = fillRectCalls.filter((c) => c.style.startsWith("rgba"));
		expect(blackCalls).toHaveLength(2);
		expect(semiCalls).toHaveLength(1);
	});
});
