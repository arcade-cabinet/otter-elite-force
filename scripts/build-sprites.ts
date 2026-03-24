#!/usr/bin/env tsx
/**
 * scripts/build-sprites.ts
 *
 * SP-DSL sprite build pipeline.
 * Imports all entity definitions, resolves palettes, composites layers,
 * renders at multiple scales (1x/2x/3x), packs into spritesheets,
 * and outputs PNG + JSON atlas files to public/assets/.
 *
 * Usage: pnpm build:sprites
 * Requires: canvas (node-canvas)
 */

import { createCanvas, type Canvas } from "@napi-rs/canvas";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Imports from entity system ───

import { PALETTE, PALETTES } from "../src/entities/palettes.js";
import type { SpriteDef, SPDSLSprite, SpriteLayer } from "../src/entities/types.js";
import {
	ALL_UNITS,
	ALL_HEROES,
	ALL_BUILDINGS,
	ALL_PORTRAITS,
	ALL_RESOURCES,
	ALL_PROPS,
} from "../src/entities/registry.js";
import { TERRAIN_TILES } from "../src/entities/terrain/tiles.js";

// ─── Configuration ───

const SCALES = [1, 2, 3] as const;
const OUTPUT_ROOT = path.resolve(import.meta.dirname, "..", "public", "assets");
const SHEET_MAX_WIDTH = 2048;

// Category → output subdirectory
const CATEGORIES = {
	units: "units",
	buildings: "buildings",
	terrain: "terrain",
	portraits: "portraits",
} as const;

// ─── Types ───

interface RenderedFrame {
	canvas: Canvas;
	width: number;
	height: number;
}

interface AtlasEntry {
	frame: { x: number; y: number; w: number; h: number };
	sourceSize: { w: number; h: number };
}

interface AtlasJSON {
	meta: { image: string; size: { w: number; h: number }; scale: number };
	frames: Record<string, AtlasEntry>;
}

// ─── Legacy Renderer (char-based PALETTE) ───

function renderLegacyFrame(frame: string[]): Canvas {
	const height = frame.length;
	const width = height > 0 ? frame[0].length : 0;

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	for (let y = 0; y < height; y++) {
		const row = frame[y];
		for (let x = 0; x < row.length; x++) {
			const ch = row[x];
			const color = PALETTE[ch];
			if (color && color !== "transparent") {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	return canvas;
}

// ─── SP-DSL Renderer (numeric-index layered) ───

/**
 * Resolve a layer grid to its rows for a given frame index.
 * SP-DSL grids can be either:
 *   - string[][] where outer = frames, inner = rows (e.g. [["row1","row2",...]])
 *   - string[] where each element is a row (flat single-frame grid)
 * We detect by checking if grid[0] is a string or array.
 */
function resolveGrid(grid: string[][], frameIndex: number): string[] {
	if (grid.length === 0) return [];
	if (Array.isArray(grid[0]) && typeof grid[0] !== "string") {
		// grid is frames-of-rows: string[frames][rows]
		return (
			(grid as unknown as string[][][])[frameIndex] ?? (grid as unknown as string[][][])[0] ?? []
		);
	}
	// grid is flat rows: string[rows] (single frame)
	return grid as unknown as string[];
}

function renderSPDSLFrame(
	layers: SpriteLayer[],
	paletteName: string,
	size: number,
	frameIndex = 0,
): Canvas {
	const palette = PALETTES[paletteName];
	if (!palette) {
		throw new Error(`Unknown palette: ${paletteName}`);
	}

	const canvas = createCanvas(size, size);
	const ctx = canvas.getContext("2d");

	// Sort layers by zIndex (ascending = back to front)
	const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);

	for (const layer of sorted) {
		const offX = layer.offset?.[0] ?? 0;
		const offY = layer.offset?.[1] ?? 0;

		if (layer.blendMode) {
			ctx.globalCompositeOperation = layer.blendMode;
		}

		const rows = resolveGrid(layer.grid, frameIndex);
		for (let y = 0; y < rows.length; y++) {
			const row = rows[y];
			for (let x = 0; x < row.length; x++) {
				const ch = row[x];
				const color = palette[ch];
				if (color && color !== "transparent") {
					ctx.fillStyle = color;
					ctx.fillRect(x + offX, y + offY, 1, 1);
				}
			}
		}

		ctx.globalCompositeOperation = "source-over";
	}

	return canvas;
}

// ─── Scaling ───

function scaleCanvas(src: Canvas, scale: number): Canvas {
	const w = src.width * scale;
	const h = src.height * scale;
	const dest = createCanvas(w, h);
	const ctx = dest.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(src, 0, 0, w, h);
	return dest;
}

// ─── Type Guards ───

function isLegacySprite(sprite: SpriteDef | SPDSLSprite): sprite is SpriteDef {
	return "frames" in sprite && "size" in sprite;
}

// ─── Sprite Extraction ───

interface SpriteEntry {
	id: string;
	category: string;
	sprite: SpriteDef | SPDSLSprite;
}

function collectAllSprites(): SpriteEntry[] {
	const entries: SpriteEntry[] = [];

	// Units + Heroes (16x16)
	for (const [id, def] of Object.entries(ALL_UNITS)) {
		entries.push({ id, category: "units", sprite: def.sprite });
	}
	for (const [id, def] of Object.entries(ALL_HEROES)) {
		entries.push({ id, category: "units", sprite: def.sprite });
	}

	// Buildings (32x32)
	for (const [id, def] of Object.entries(ALL_BUILDINGS)) {
		entries.push({ id, category: "buildings", sprite: def.sprite });
	}

	// Terrain tiles
	for (const [id, def] of Object.entries(TERRAIN_TILES)) {
		entries.push({ id, category: "terrain", sprite: def.sprite });
	}

	// Portraits (64x96)
	for (const [id, def] of Object.entries(ALL_PORTRAITS)) {
		entries.push({ id, category: "portraits", sprite: def.sprite });
	}

	// Resources
	for (const [id, def] of Object.entries(ALL_RESOURCES)) {
		entries.push({ id, category: "units", sprite: def.sprite });
	}

	// Props
	for (const [id, def] of Object.entries(ALL_PROPS)) {
		entries.push({
			id,
			category: "units",
			sprite: (def as { sprite: SpriteDef | SPDSLSprite }).sprite,
		});
	}

	return entries;
}

// ─── Render All Frames ───

interface FrameResult {
	key: string; // e.g. "mudfoot_idle_0"
	canvas: Canvas;
}

function renderAllFrames(entry: SpriteEntry): FrameResult[] {
	const results: FrameResult[] = [];
	const sprite = entry.sprite;

	if (isLegacySprite(sprite)) {
		// Legacy char-based sprite
		for (const [animName, frames] of Object.entries(sprite.frames)) {
			for (let i = 0; i < frames.length; i++) {
				const canvas = renderLegacyFrame(frames[i]);
				const key = animName === "idle" && i === 0 ? entry.id : `${entry.id}_${animName}_${i}`;
				results.push({ key, canvas });
			}
		}
	} else {
		// SP-DSL layered sprite — detect size from grid content
		const firstGrid = sprite.layers[0]?.grid;
		let size = 16;
		if (firstGrid && firstGrid.length > 0) {
			const firstRow = resolveGrid(firstGrid, 0);
			size = firstRow.length; // width = chars per row
		}

		// Render base layers as idle frame
		const canvas = renderSPDSLFrame(sprite.layers, sprite.palette, size);
		results.push({ key: entry.id, canvas });

		// Render animation frames if present
		if (sprite.animations) {
			for (const [animName, animFrames] of Object.entries(sprite.animations)) {
				for (let i = 0; i < animFrames.length; i++) {
					const frame = animFrames[i];
					// Apply layer overrides for this frame
					const frameLayers = sprite.layers.map((layer) => {
						if (frame.layerOverrides?.[layer.id]) {
							return { ...layer, grid: frame.layerOverrides[layer.id].grid };
						}
						return layer;
					});
					const frameCanvas = renderSPDSLFrame(frameLayers, sprite.palette, size);
					results.push({ key: `${entry.id}_${animName}_${i}`, canvas: frameCanvas });
				}
			}
		}
	}

	return results;
}

// ─── Spritesheet Packer ───

interface PackResult {
	sheet: Canvas;
	atlas: AtlasJSON;
}

function packFrames(frames: FrameResult[], scale: number, sheetName: string): PackResult {
	// Scale all frames
	const scaled = frames.map((f) => ({
		key: f.key,
		canvas: scale === 1 ? f.canvas : scaleCanvas(f.canvas, scale),
	}));

	if (scaled.length === 0) {
		const sheet = createCanvas(1, 1);
		return {
			sheet,
			atlas: {
				meta: { image: `${sheetName}.png`, size: { w: 1, h: 1 }, scale },
				frames: {},
			},
		};
	}

	// Simple row-packing algorithm
	const padding = 1;
	let curX = 0;
	let curY = 0;
	let rowHeight = 0;
	let sheetWidth = 0;

	// Placement pass
	const placements: { key: string; x: number; y: number; w: number; h: number }[] = [];

	for (const { key, canvas } of scaled) {
		const w = canvas.width;
		const h = canvas.height;

		if (curX + w > SHEET_MAX_WIDTH && curX > 0) {
			curX = 0;
			curY += rowHeight + padding;
			rowHeight = 0;
		}

		placements.push({ key, x: curX, y: curY, w, h });
		curX += w + padding;
		if (curX > sheetWidth) sheetWidth = curX;
		if (h > rowHeight) rowHeight = h;
	}

	const sheetHeight = curY + rowHeight;
	const sheet = createCanvas(sheetWidth, sheetHeight);
	const ctx = sheet.getContext("2d");

	const atlasFrames: Record<string, AtlasEntry> = {};

	for (const p of placements) {
		const frame = scaled.find((s) => s.key === p.key)!;
		ctx.drawImage(frame.canvas, p.x, p.y);
		atlasFrames[p.key] = {
			frame: { x: p.x, y: p.y, w: p.w, h: p.h },
			sourceSize: { w: p.w, h: p.h },
		};
	}

	return {
		sheet,
		atlas: {
			meta: { image: `${sheetName}.png`, size: { w: sheetWidth, h: sheetHeight }, scale },
			frames: atlasFrames,
		},
	};
}

// ─── Main ───

async function main() {
	console.log("[build-sprites] Collecting entity definitions...");
	const allSprites = collectAllSprites();
	console.log(`[build-sprites] Found ${allSprites.length} entities`);

	// Group by category
	const grouped: Record<string, SpriteEntry[]> = {};
	for (const entry of allSprites) {
		if (!grouped[entry.category]) grouped[entry.category] = [];
		grouped[entry.category].push(entry);
	}

	// Ensure output directories exist
	for (const subdir of Object.values(CATEGORIES)) {
		const dir = path.join(OUTPUT_ROOT, subdir);
		fs.mkdirSync(dir, { recursive: true });
	}

	let totalSheets = 0;
	let totalFrames = 0;

	for (const [category, entries] of Object.entries(grouped)) {
		console.log(`[build-sprites] Rendering ${category}: ${entries.length} entities`);

		// Render all frames at 1x
		const allFrames: FrameResult[] = [];
		for (const entry of entries) {
			const frames = renderAllFrames(entry);
			allFrames.push(...frames);
		}

		totalFrames += allFrames.length;

		// Pack at each scale
		for (const scale of SCALES) {
			const sheetName = `${category}_${scale}x`;
			const { sheet, atlas } = packFrames(allFrames, scale, sheetName);

			const outDir = path.join(OUTPUT_ROOT, category);
			const pngPath = path.join(outDir, `${sheetName}.png`);
			const jsonPath = path.join(outDir, `${sheetName}.json`);

			// Write PNG
			const buf = sheet.toBuffer("image/png");
			fs.writeFileSync(pngPath, buf);

			// Write atlas JSON
			fs.writeFileSync(jsonPath, JSON.stringify(atlas, null, 2));

			console.log(
				`  [${scale}x] ${sheetName}.png (${sheet.width}x${sheet.height}) — ${Object.keys(atlas.frames).length} frames`,
			);
			totalSheets++;
		}
	}

	console.log(
		`\n[build-sprites] Done! ${totalFrames} frames → ${totalSheets} spritesheets in ${OUTPUT_ROOT}`,
	);
}

main().catch((err) => {
	console.error("[build-sprites] FATAL:", err);
	process.exit(1);
});
