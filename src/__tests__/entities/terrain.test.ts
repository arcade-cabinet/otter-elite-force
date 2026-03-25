import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { MissionDef, TerrainTileDef } from "@/entities/types";

// Mock canvas context for happy-dom
const mockCtx = {
	fillStyle: "",
	fillRect: vi.fn(),
	imageSmoothingEnabled: true,
	drawImage: vi.fn(),
	save: vi.fn(),
	restore: vi.fn(),
	beginPath: vi.fn(),
	arc: vi.fn(),
	clip: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	closePath: vi.fn(),
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

import { paintMap } from "@/entities/terrain/map-painter";
import { TERRAIN_TILES } from "@/entities/terrain/tiles";

describe("TERRAIN_TILES", () => {
	it("defines all 8 terrain types", () => {
		const expected = [
			"grass",
			"dirt",
			"beach",
			"mud",
			"water",
			"mangrove",
			"toxic_sludge",
			"bridge",
		];
		for (const id of expected) {
			expect(TERRAIN_TILES).toHaveProperty(id);
		}
		expect(Object.keys(TERRAIN_TILES)).toHaveLength(8);
	});

	it("every tile has paintRules with baseColor and noiseColors", () => {
		for (const [id, tile] of Object.entries(TERRAIN_TILES)) {
			expect(tile.paintRules, `${id} missing paintRules`).toBeDefined();
			expect(tile.paintRules!.baseColor).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(tile.paintRules!.noiseColors.length).toBeGreaterThan(0);
			expect(tile.paintRules!.noiseDensity).toBeGreaterThan(0);
			expect(tile.paintRules!.noiseDensity).toBeLessThanOrEqual(1);
		}
	});

	it("every tile uses layered SP-DSL sprite definitions", () => {
		for (const [id, tile] of Object.entries(TERRAIN_TILES)) {
			expect("layers" in tile.sprite, `${id} should use SP-DSL layers`).toBe(true);
			if ("layers" in tile.sprite) {
				expect(tile.sprite.layers.length).toBeGreaterThan(0);
			}
		}
	});

	it("water is impassable without swimming", () => {
		expect(TERRAIN_TILES.water.movementCost).toBe(Infinity);
		expect(TERRAIN_TILES.water.swimCost).toBe(2);
	});

	it("mangrove blocks vision and provides concealment", () => {
		expect(TERRAIN_TILES.mangrove.blocksVision).toBe(true);
		expect(TERRAIN_TILES.mangrove.providesConcealment).toBe(true);
	});

	it("toxic sludge deals damage", () => {
		expect(TERRAIN_TILES.toxic_sludge.damagePerSecond).toBe(5);
	});

	it("grass and dirt have normal movement cost", () => {
		expect(TERRAIN_TILES.grass.movementCost).toBe(1);
		expect(TERRAIN_TILES.dirt.movementCost).toBe(1);
	});

	it("mud slows movement", () => {
		expect(TERRAIN_TILES.mud.movementCost).toBe(2);
	});
});

describe("paintMap", () => {
	const terrain: MissionDef["terrain"] = {
		width: 10,
		height: 8,
		regions: [
			{ terrainId: "grass", fill: true },
			{ terrainId: "water", rect: { x: 3, y: 2, w: 4, h: 3 } },
			{ terrainId: "dirt", circle: { cx: 8, cy: 6, r: 2 } },
		],
		overrides: [{ x: 5, y: 5, terrainId: "bridge" }],
	};

	it("returns a canvas with correct pixel dimensions", () => {
		mockCtx.fillRect.mockClear();
		const canvas = paintMap(terrain, 48);
		expect(canvas.width).toBe(10 * 48);
		expect(canvas.height).toBe(8 * 48);
	});

	it("calls fillRect for base fill, rect region, circle region, and override", () => {
		mockCtx.fillRect.mockClear();
		paintMap(terrain, 16);
		// At minimum: 1 base fill + noise, rect fill + noise, circle fill + noise, override fill + noise
		expect(mockCtx.fillRect.mock.calls.length).toBeGreaterThan(4);
	});

	it("paints circle region with save/clip/restore", () => {
		mockCtx.save.mockClear();
		mockCtx.arc.mockClear();
		mockCtx.clip.mockClear();
		mockCtx.restore.mockClear();

		paintMap(terrain, 16);

		expect(mockCtx.save).toHaveBeenCalled();
		expect(mockCtx.arc).toHaveBeenCalled();
		expect(mockCtx.clip).toHaveBeenCalled();
		expect(mockCtx.restore).toHaveBeenCalled();
	});
});
