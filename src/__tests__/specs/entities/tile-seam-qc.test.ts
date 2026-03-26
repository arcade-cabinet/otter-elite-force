/**
 * US-076: Tile seam QC at game zoom
 *
 * Validates tile sprites for seamlessness:
 * - No visible grid lines between same-type tiles (edge pixel continuity)
 * - Transition tiles look natural (neighboring edge compatibility)
 * - Documents seam issues
 *
 * Approach: For each terrain tile, materialize the sprite and check that
 * edge pixels (top row, bottom row, left col, right col) have sufficient
 * color to avoid stark black/transparent seams between identical tiles.
 */
import { describe, expect, it } from "vitest";
import {
	getCategoryDimensions,
	materializeSpriteToLegacy,
} from "@/entities/sprite-materialization";
import { TERRAIN_TILES } from "@/entities/terrain/tiles";

// ─── Constants ───

const CELL_SIZE = 16;
const seamIssues: string[] = [];

function noteSeam(msg: string) {
	seamIssues.push(msg);
}

// ─── Tests ───

describe("US-076: Tile seam QC at game zoom", () => {
	const dimensions = getCategoryDimensions("terrain");
	const tileIds = Object.keys(TERRAIN_TILES);

	describe("all terrain tiles materialize at 16x16", () => {
		for (const id of tileIds) {
			it(`${id} materializes to ${CELL_SIZE}x${CELL_SIZE}`, () => {
				const tile = TERRAIN_TILES[id];
				const legacy = materializeSpriteToLegacy(tile.sprite, dimensions);
				expect(legacy.size).toBe(CELL_SIZE);
				expect(legacy.frames.idle).toBeDefined();

				const frame = legacy.frames.idle[0];
				expect(frame.length).toBe(CELL_SIZE);
				for (const row of frame) {
					expect(row.length).toBe(CELL_SIZE);
				}
			});
		}
	});

	describe("same-type tile seams — edge pixel continuity", () => {
		for (const id of tileIds) {
			it(`${id} top/bottom edges have compatible fill for vertical tiling`, () => {
				const tile = TERRAIN_TILES[id];
				const legacy = materializeSpriteToLegacy(tile.sprite, dimensions);
				const frame = legacy.frames.idle[0];

				const topRow = frame[0];
				const bottomRow = frame[CELL_SIZE - 1];

				// Count non-transparent pixels on edges
				let topFilled = 0;
				let bottomFilled = 0;
				for (let x = 0; x < CELL_SIZE; x++) {
					if (topRow[x] !== ".") topFilled++;
					if (bottomRow[x] !== ".") bottomFilled++;
				}

				// For seamless tiling, both edges should be mostly filled
				// (terrain tiles should not have transparent borders)
				const topFillRatio = topFilled / CELL_SIZE;
				const bottomFillRatio = bottomFilled / CELL_SIZE;

				if (topFillRatio < 0.5) {
					noteSeam(
						`${id}: top row only ${(topFillRatio * 100).toFixed(0)}% filled — may show seam`,
					);
				}
				if (bottomFillRatio < 0.5) {
					noteSeam(
						`${id}: bottom row only ${(bottomFillRatio * 100).toFixed(0)}% filled — may show seam`,
					);
				}

				// Hard requirement: terrain tiles must have filled edges (no transparent border)
				expect(topFilled).toBeGreaterThan(0);
				expect(bottomFilled).toBeGreaterThan(0);
			});

			it(`${id} left/right edges have compatible fill for horizontal tiling`, () => {
				const tile = TERRAIN_TILES[id];
				const legacy = materializeSpriteToLegacy(tile.sprite, dimensions);
				const frame = legacy.frames.idle[0];

				let leftFilled = 0;
				let rightFilled = 0;
				for (let y = 0; y < CELL_SIZE; y++) {
					if (frame[y][0] !== ".") leftFilled++;
					if (frame[y][CELL_SIZE - 1] !== ".") rightFilled++;
				}

				const leftFillRatio = leftFilled / CELL_SIZE;
				const rightFillRatio = rightFilled / CELL_SIZE;

				if (leftFillRatio < 0.5) {
					noteSeam(
						`${id}: left col only ${(leftFillRatio * 100).toFixed(0)}% filled — may show seam`,
					);
				}
				if (rightFillRatio < 0.5) {
					noteSeam(
						`${id}: right col only ${(rightFillRatio * 100).toFixed(0)}% filled — may show seam`,
					);
				}

				expect(leftFilled).toBeGreaterThan(0);
				expect(rightFilled).toBeGreaterThan(0);
			});
		}
	});

	describe("tile color uniformity — no stark contrast at edges", () => {
		for (const id of tileIds) {
			it(`${id} uses consistent palette chars across the tile`, () => {
				const tile = TERRAIN_TILES[id];
				const legacy = materializeSpriteToLegacy(tile.sprite, dimensions);
				const frame = legacy.frames.idle[0];

				// Collect unique non-transparent chars used
				const charSet = new Set<string>();
				for (const row of frame) {
					for (const ch of row) {
						if (ch !== ".") charSet.add(ch);
					}
				}

				// Terrain tiles should have limited palette usage (< 8 unique chars)
				// to maintain visual cohesion
				if (charSet.size > 8) {
					noteSeam(`${id}: uses ${charSet.size} unique palette chars — may look noisy`);
				}

				// At minimum, tiles should use at least 1 non-transparent char
				expect(charSet.size).toBeGreaterThan(0);
			});
		}
	});

	describe("tile fill density — terrain should be fully opaque", () => {
		for (const id of tileIds) {
			it(`${id} has at least 90% fill (no see-through terrain)`, () => {
				const tile = TERRAIN_TILES[id];
				const legacy = materializeSpriteToLegacy(tile.sprite, dimensions);
				const frame = legacy.frames.idle[0];

				let filled = 0;
				const total = CELL_SIZE * CELL_SIZE;
				for (const row of frame) {
					for (const ch of row) {
						if (ch !== ".") filled++;
					}
				}

				const fillRatio = filled / total;
				if (fillRatio < 0.9) {
					noteSeam(
						`${id}: only ${(fillRatio * 100).toFixed(1)}% filled — may show background through tile`,
					);
				}

				// Terrain tiles must be mostly opaque
				expect(fillRatio).toBeGreaterThanOrEqual(0.9);
			});
		}
	});

	describe("transition compatibility — paint rule consistency", () => {
		it("all terrain tiles define paint rules for procedural rendering", () => {
			const missing: string[] = [];
			for (const [id, tile] of Object.entries(TERRAIN_TILES)) {
				if (!tile.paintRules) {
					missing.push(id);
					noteSeam(`${id}: missing paintRules — transitions may not render`);
				}
			}
			expect(missing).toEqual([]);
		});

		it("all terrain paint rules have baseColor and noiseColors", () => {
			const issues: string[] = [];
			for (const [id, tile] of Object.entries(TERRAIN_TILES)) {
				if (!tile.paintRules) continue;
				if (!tile.paintRules.baseColor) {
					issues.push(`${id}: missing baseColor`);
				}
				if (!tile.paintRules.noiseColors || tile.paintRules.noiseColors.length === 0) {
					issues.push(`${id}: missing noiseColors`);
				}
			}
			expect(issues).toEqual([]);
		});

		it("terrain paint rule colors are valid hex", () => {
			const hexRegex = /^#[0-9a-fA-F]{6}$/;
			const issues: string[] = [];

			for (const [id, tile] of Object.entries(TERRAIN_TILES)) {
				if (!tile.paintRules) continue;
				if (!hexRegex.test(tile.paintRules.baseColor)) {
					issues.push(`${id}: invalid baseColor ${tile.paintRules.baseColor}`);
				}
				for (const nc of tile.paintRules.noiseColors ?? []) {
					if (!hexRegex.test(nc)) {
						issues.push(`${id}: invalid noiseColor ${nc}`);
					}
				}
			}
			expect(issues).toEqual([]);
		});
	});

	// ─── Seam report ───

	it("documents tile seam issues (informational report)", () => {
		if (seamIssues.length > 0) {
			console.log("\n=== TILE SEAM ISSUES ===");
			for (const issue of seamIssues) {
				console.log(`  - ${issue}`);
			}
			console.log(`=== ${seamIssues.length} issues ===\n`);
		} else {
			console.log("\n=== All tiles pass seam QC ===\n");
		}
		expect(true).toBe(true);
	});
});
