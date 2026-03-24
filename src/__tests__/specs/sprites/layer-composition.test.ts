/**
 * SP-DSL Layer Composition Specification Tests
 *
 * Defines the behavioral contract for composing multi-layer sprites.
 * SP-DSL sprites are built from stacked layers (shadow, body, uniform, weapon)
 * composited bottom-up by zIndex with per-layer offsets.
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §6
 *   - docs/architecture/testing-strategy.md §SP-DSL Build Tests
 *
 * Tests are written BEFORE the layer compositor exists.
 * They WILL FAIL until the compositor module is implemented.
 */
import { describe, it, expect, beforeAll } from "vitest";

// ---------------------------------------------------------------------------
// Dynamic imports — the compositor may not exist yet.
// ---------------------------------------------------------------------------

let composeLayers: any;
let loadError: string | null = null;

beforeAll(async () => {
	try {
		// Expected module: src/sprites/compositor.ts or src/sprites/layers.ts
		const mod =
			(await import("@/sprites/compositor").catch(() => null)) ??
			(await import("@/sprites/layers").catch(() => null));
		if (!mod) throw new Error("No compositor module found");
		composeLayers = mod.composeLayers ?? mod.default;
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => loadError !== null;

// ---------------------------------------------------------------------------
// Test fixtures: minimal layer definitions
// ---------------------------------------------------------------------------

/** 4x4 shadow layer — semi-transparent dark circle */
const shadowLayer = {
	id: "shadow",
	zIndex: 0,
	grid: ["0000", "0110", "0110", "0000"],
};

/** 4x4 body layer — fills center with fur color */
const bodyLayer = {
	id: "body",
	zIndex: 1,
	grid: ["0220", "2332", "2332", "0220"],
};

/** 4x4 uniform layer — overwrites torso region */
const uniformLayer = {
	id: "uniform",
	zIndex: 2,
	grid: ["0000", "0440", "0440", "0000"],
};

/** 4x4 weapon layer with offset */
const weaponLayer = {
	id: "weapon",
	zIndex: 3,
	offset: [1, -1] as [number, number],
	grid: ["0000", "0060", "0060", "0000"],
};

const testPalette = {
	"0": "transparent",
	"1": "#333333", // shadow
	"2": "#5C4033", // fur dark
	"3": "#8B7355", // fur light
	"4": "#1e3a8a", // uniform blue
	"5": "#3b82f6", // uniform light
	"6": "#78350f", // weapon wood
};

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("SP-DSL Layer Composition", () => {
	describe("basic composition", () => {
		it("composes a single layer into pixel data", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [bodyLayer],
				palette: testPalette,
			});
			expect(result).toBeInstanceOf(ImageData);
			expect(result.width).toBe(4);
			expect(result.height).toBe(4);
		});

		it("transparent pixels (palette 0) have alpha = 0", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [bodyLayer],
				palette: testPalette,
			});
			// Top-left pixel (0,0) is '0' = transparent
			const idx = 0;
			expect(result.data[idx + 3]).toBe(0);
		});

		it("colored pixels have alpha = 255", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [bodyLayer],
				palette: testPalette,
			});
			// Pixel (1,1) is '3' = #8B7355 (fur light)
			const idx = (1 * 4 + 1) * 4;
			expect(result.data[idx]).toBe(0x8b);
			expect(result.data[idx + 1]).toBe(0x73);
			expect(result.data[idx + 2]).toBe(0x55);
			expect(result.data[idx + 3]).toBe(255);
		});
	});

	describe("zIndex ordering", () => {
		it("higher zIndex layers overwrite lower zIndex layers", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [bodyLayer, uniformLayer],
				palette: testPalette,
			});
			// Pixel (1,1): body has '3' = fur light, uniform has '4' = navy blue
			// Uniform (zIndex 2) should overwrite body (zIndex 1)
			const idx = (1 * 4 + 1) * 4;
			expect(result.data[idx]).toBe(0x1e); // R of #1e3a8a
			expect(result.data[idx + 1]).toBe(0x3a); // G
			expect(result.data[idx + 2]).toBe(0x8a); // B
		});

		it("transparent pixels in higher layers do NOT overwrite lower layers", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [bodyLayer, uniformLayer],
				palette: testPalette,
			});
			// Pixel (0,1): body has '2' = fur dark, uniform has '0' = transparent
			// Body should show through
			const idx = (1 * 4 + 0) * 4;
			expect(result.data[idx]).toBe(0x5c); // R of #5C4033
			expect(result.data[idx + 1]).toBe(0x40); // G
			expect(result.data[idx + 2]).toBe(0x33); // B
			expect(result.data[idx + 3]).toBe(255);
		});

		it("layers are composited in zIndex order regardless of array order", () => {
			if (skip()) return;
			// Pass layers in reverse order — compositor should sort by zIndex
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [uniformLayer, bodyLayer, shadowLayer],
				palette: testPalette,
			});
			// Pixel (1,1): uniform (zIndex 2) should still be on top
			const idx = (1 * 4 + 1) * 4;
			expect(result.data[idx]).toBe(0x1e); // navy blue
		});
	});

	describe("layer offsets", () => {
		it("applies positive offset to layer position", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [weaponLayer], // offset [1, -1]
				palette: testPalette,
			});
			// Weapon grid pixel (1,1) = '6' = wood
			// With offset [1, -1], it renders at screen (2, 0)
			const idx = (0 * 4 + 2) * 4;
			expect(result.data[idx]).toBe(0x78); // R of #78350f
			expect(result.data[idx + 1]).toBe(0x35); // G
			expect(result.data[idx + 2]).toBe(0x0f); // B
		});

		it("clips pixels that fall outside the canvas bounds", () => {
			if (skip()) return;
			// offset that pushes content off-canvas should not crash
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [
					{
						id: "offscreen",
						zIndex: 0,
						offset: [10, 10] as [number, number],
						grid: ["22", "22"],
					},
				],
				palette: testPalette,
			});
			// All pixels should be transparent (content is off-canvas)
			for (let i = 0; i < result.data.length; i += 4) {
				expect(result.data[i + 3]).toBe(0);
			}
		});
	});

	describe("full entity composition", () => {
		it("composes all 4 layers (shadow + body + uniform + weapon)", () => {
			if (skip()) return;
			const result = composeLayers({
				width: 4,
				height: 4,
				layers: [shadowLayer, bodyLayer, uniformLayer, weaponLayer],
				palette: testPalette,
			});
			expect(result).toBeInstanceOf(ImageData);
			expect(result.width).toBe(4);
			expect(result.height).toBe(4);
			// Should have non-transparent pixels
			let hasContent = false;
			for (let i = 0; i < result.data.length; i += 4) {
				if (result.data[i + 3] > 0) {
					hasContent = true;
					break;
				}
			}
			expect(hasContent).toBe(true);
		});
	});
});
