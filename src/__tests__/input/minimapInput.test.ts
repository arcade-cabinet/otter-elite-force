import { describe, expect, it } from "vitest";
import {
	clampCameraScroll,
	minimapToWorld,
	type MinimapDimensions,
} from "@/input/minimapInput";

const TILE_SIZE = 32;

describe("minimapToWorld", () => {
	const dims: MinimapDimensions = {
		canvasWidth: 160,
		canvasHeight: 160,
		worldTilesW: 80,
		worldTilesH: 60,
	};
	const vpW = 800;
	const vpH = 600;

	it("maps center of minimap to center of the map minus half viewport", () => {
		const result = minimapToWorld(80, 80, dims, vpW, vpH);
		// canvasX=80 / canvasWidth=160 => 0.5 * 80 tiles = 40 tiles => 40*32 = 1280 px
		// scrollX = 1280 - 800/2 = 880
		expect(result.scrollX).toBe(880);
		// canvasY=80 / canvasHeight=160 => 0.5 * 60 tiles = 30 tiles => 30*32 = 960 px
		// scrollY = 960 - 600/2 = 660
		expect(result.scrollY).toBe(660);
	});

	it("maps top-left corner (0,0) to negative scroll (would be clamped later)", () => {
		const result = minimapToWorld(0, 0, dims, vpW, vpH);
		expect(result.scrollX).toBe(-vpW / 2);
		expect(result.scrollY).toBe(-vpH / 2);
	});

	it("maps bottom-right corner to max scroll", () => {
		const result = minimapToWorld(160, 160, dims, vpW, vpH);
		// tileX = 80, tileY = 60
		expect(result.scrollX).toBe(80 * TILE_SIZE - vpW / 2);
		expect(result.scrollY).toBe(60 * TILE_SIZE - vpH / 2);
	});

	it("handles zero-size canvas gracefully", () => {
		const zeroDims: MinimapDimensions = {
			canvasWidth: 0,
			canvasHeight: 0,
			worldTilesW: 40,
			worldTilesH: 40,
		};
		const result = minimapToWorld(0, 0, zeroDims, vpW, vpH);
		expect(Number.isFinite(result.scrollX)).toBe(true);
		expect(Number.isFinite(result.scrollY)).toBe(true);
	});
});

describe("clampCameraScroll", () => {
	it("clamps negative scroll to zero", () => {
		const result = clampCameraScroll({ scrollX: -100, scrollY: -50 }, 2000, 1500, 800, 600);
		expect(result.scrollX).toBe(0);
		expect(result.scrollY).toBe(0);
	});

	it("clamps scroll that exceeds map minus viewport", () => {
		const mapW = 2000;
		const mapH = 1500;
		const vpW = 800;
		const vpH = 600;
		const result = clampCameraScroll({ scrollX: 5000, scrollY: 5000 }, mapW, mapH, vpW, vpH);
		expect(result.scrollX).toBe(mapW - vpW);
		expect(result.scrollY).toBe(mapH - vpH);
	});

	it("leaves scroll unchanged if within bounds", () => {
		const result = clampCameraScroll({ scrollX: 500, scrollY: 300 }, 2000, 1500, 800, 600);
		expect(result.scrollX).toBe(500);
		expect(result.scrollY).toBe(300);
	});
});
