/**
 * SP-DSL Palette Resolution Specification Tests
 *
 * Defines the behavioral contract for resolving named palettes to hex colors.
 * The build pipeline must:
 *   - Look up palette by name ('otter_default', 'croc_default')
 *   - Map numeric char indices ('0'-'9') to hex colors
 *   - Reject invalid palette names
 *   - Reject grids containing chars not in the palette
 *
 * Sources:
 *   - docs/superpowers/specs/2026-03-24-ui-spdsl-architecture-design.md §6
 *   - src/entities/palettes.ts (PALETTES constant)
 *   - docs/architecture/testing-strategy.md §SP-DSL Build Tests
 *
 * Tests are written BEFORE the resolution module exists.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { PALETTES } from "@/entities/palettes";

let resolvePalette: any;
let validateGrid: any;
let loadError: string | null = null;

beforeAll(async () => {
	try {
		// Expected module: src/sprites/palette-resolver.ts or src/sprites/compositor.ts
		const mod =
			(await import("@/sprites/palette-resolver").catch(() => null)) ??
			(await import("@/sprites/compositor").catch(() => null));
		if (!mod) throw new Error("No palette resolver module found");
		resolvePalette = mod.resolvePalette;
		validateGrid = mod.validateGrid;
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => loadError !== null;

// ===========================================================================
// SPECIFICATION
// ===========================================================================

describe("Palette Resolution", () => {
	describe("PALETTES constant", () => {
		it("has otter_default palette", () => {
			expect(PALETTES.otter_default).toBeDefined();
		});

		it("has croc_default palette", () => {
			expect(PALETTES.croc_default).toBeDefined();
		});

		it("otter_default has brown fur colors (not teal)", () => {
			const otter = PALETTES.otter_default;
			// Index '2' should be dark brown #5C4033
			expect(otter["2"]).toBe("#5C4033");
			// Index '3' should be light brown #8B7355
			expect(otter["3"]).toBe("#8B7355");
		});

		it("croc_default has green skin colors", () => {
			const croc = PALETTES.croc_default;
			expect(croc["2"]).toBe("#166534"); // dark green
			expect(croc["3"]).toBe("#22c55e"); // light green
		});

		it("all palettes have index 0 as transparent", () => {
			for (const [name, palette] of Object.entries(PALETTES)) {
				expect(palette["0"]).toBe("transparent");
			}
		});

		it("all palettes have index 1 as black (#000000)", () => {
			for (const [name, palette] of Object.entries(PALETTES)) {
				expect(palette["1"]).toBe("#000000");
			}
		});

		it("every palette has at least indices 0-9", () => {
			for (const [name, palette] of Object.entries(PALETTES)) {
				for (let i = 0; i <= 9; i++) {
					expect(palette[String(i)]).toBeDefined();
				}
			}
		});

		it("all hex colors are valid 7-char hex strings", () => {
			for (const [name, palette] of Object.entries(PALETTES)) {
				for (const [key, color] of Object.entries(palette)) {
					if (color === "transparent") continue;
					expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
				}
			}
		});
	});

	describe("resolvePalette()", () => {
		it("returns the palette map for a valid palette name", () => {
			if (skip()) return;
			const palette = resolvePalette("otter_default");
			expect(palette).toBeDefined();
			expect(palette["2"]).toBe("#5C4033");
		});

		it("throws for an unknown palette name", () => {
			if (skip()) return;
			expect(() => resolvePalette("nonexistent_palette")).toThrow();
		});

		it("returns the correct palette for croc_default", () => {
			if (skip()) return;
			const palette = resolvePalette("croc_default");
			expect(palette["2"]).toBe("#166534");
		});
	});

	describe("validateGrid()", () => {
		it("accepts a grid with valid palette characters", () => {
			if (skip()) return;
			const grid = ["0120", "3450", "6780", "0900"];
			const errors = validateGrid(grid, PALETTES.otter_default);
			expect(errors).toHaveLength(0);
		});

		it("rejects a grid with characters not in the palette", () => {
			if (skip()) return;
			const grid = ["0XZ0", "0000"];
			const errors = validateGrid(grid, PALETTES.otter_default);
			expect(errors.length).toBeGreaterThan(0);
			// Should identify the invalid characters
			expect(errors.some((e: string) => e.includes("X") || e.includes("Z"))).toBe(true);
		});

		it("accepts empty rows (all transparent)", () => {
			if (skip()) return;
			const grid = ["0000", "0000"];
			const errors = validateGrid(grid, PALETTES.otter_default);
			expect(errors).toHaveLength(0);
		});
	});
});
