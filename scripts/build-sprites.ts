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

import * as fs from "node:fs";
import * as path from "node:path";
import { type Canvas, createCanvas } from "@napi-rs/canvas";

// ─── Imports from entity system ───

import {
	ASSET_REFERENCE_CONTRACTS,
	type AssetReferenceContract,
} from "../src/entities/asset-contracts.js";
import type { AssetFamilyEntityType } from "../src/entities/asset-families.js";
import {
	ASSET_FAMILIES,
	type AssetFamilyDefinition,
	getFamilyReferenceContract,
} from "../src/entities/asset-families.js";
import { ASSET_GENERATOR_PRESETS } from "../src/entities/asset-generator-presets.js";
import {
	ASSET_VARIANT_RECIPES,
	assertAssetGeneratorPresetsValid,
	toAssetEntityKey,
} from "../src/entities/asset-variant-recipes.js";
import { PALETTE, PALETTES } from "../src/entities/palettes.js";
import {
	ALL_BUILDINGS,
	ALL_HEROES,
	ALL_PORTRAITS,
	ALL_PROPS,
	ALL_RESOURCES,
	ALL_UNITS,
} from "../src/entities/registry.js";
import type { SpriteCategory } from "../src/entities/sprite-materialization.js";
import { getCategoryDimensions } from "../src/entities/sprite-materialization.js";
import { TERRAIN_TILES } from "../src/entities/terrain/tiles.js";
import type { SPDSLSprite, SpriteDef, SpriteLayer } from "../src/entities/types.js";

// ─── Configuration ───

const SCALES = [1, 2, 3] as const;
const OUTPUT_ROOT = path.resolve(import.meta.dirname, "..", "public", "assets");
const SHEET_MAX_WIDTH = 2048;

// Category → output subdirectory
const CATEGORIES = {
	units: "units",
	buildings: "buildings",
	resources: "resources",
	props: "props",
	terrain: "terrain",
	portraits: "portraits",
} as const;

interface AtlasEntry {
	frame: { x: number; y: number; w: number; h: number };
	sourceSize: { w: number; h: number };
}

interface AtlasJSON {
	meta: { image: string; size: { w: number; h: number }; scale: number };
	frames: Record<string, AtlasEntry>;
}

interface BuiltAssetReferenceContract extends AssetReferenceContract {
	canonicalDimensions: { width: number; height: number; size: number };
	palette: string | null;
	primaryFrameKey: string;
}

interface BuiltAssetFamilyDefinition extends AssetFamilyDefinition {
	canonicalDimensions: { width: number; height: number; size: number };
	referenceContractId: string | null;
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

function resolveSpriteDimensions(layers: SpriteLayer[], frameIndex = 0) {
	let width = 0;
	let height = 0;

	for (const layer of layers) {
		const rows = resolveGrid(layer.grid, frameIndex);
		const offX = layer.offset?.[0] ?? 0;
		const offY = layer.offset?.[1] ?? 0;
		height = Math.max(height, rows.length + offY);
		for (const row of rows) {
			width = Math.max(width, row.length + offX);
		}
	}

	return { width, height };
}

function renderSPDSLFrame(
	layers: SpriteLayer[],
	paletteName: string,
	dimensions: { width: number; height: number },
	frameIndex = 0,
): Canvas {
	const palette = PALETTES[paletteName];
	if (!palette) {
		throw new Error(`Unknown palette: ${paletteName}`);
	}

	const canvas = createCanvas(dimensions.width, dimensions.height);
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

function hexToRgba(hex: string, alpha: number) {
	const normalized = hex.replace("#", "");
	const value =
		normalized.length === 3
			? normalized
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: normalized;
	const red = Number.parseInt(value.slice(0, 2), 16);
	const green = Number.parseInt(value.slice(2, 4), 16);
	const blue = Number.parseInt(value.slice(4, 6), 16);
	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function applyHitFlashCanvas(src: Canvas, overlayColor: string): Canvas {
	const dest = createCanvas(src.width, src.height);
	const ctx = dest.getContext("2d");
	ctx.drawImage(src, 0, 0);
	ctx.globalCompositeOperation = "source-atop";
	ctx.fillStyle = hexToRgba(overlayColor, 0.72);
	ctx.fillRect(0, 0, src.width, src.height);
	ctx.globalCompositeOperation = "screen";
	ctx.fillStyle = hexToRgba("#ffffff", 0.2);
	ctx.fillRect(0, 0, src.width, src.height);
	ctx.globalCompositeOperation = "source-over";
	return dest;
}

// ─── Type Guards ───

function isLegacySprite(sprite: SpriteDef | SPDSLSprite): sprite is SpriteDef {
	return "frames" in sprite && "size" in sprite;
}

function resolveSpritePalette(sprite: SpriteDef | SPDSLSprite): string | null {
	return isLegacySprite(sprite) ? null : sprite.palette;
}

// ─── Sprite Extraction ───

interface SpriteEntry {
	id: string;
	entityType: string;
	category: SpriteCategory;
	sprite: SpriteDef | SPDSLSprite;
}

function toEntryKey(entityType: string, id: string): string {
	return `${entityType}:${id}`;
}

function collectAllSprites(): SpriteEntry[] {
	const entries: SpriteEntry[] = [];

	// Units + Heroes (16x16)
	for (const [id, def] of Object.entries(ALL_UNITS)) {
		entries.push({ id, entityType: "unit", category: "units", sprite: def.sprite });
	}
	for (const [id, def] of Object.entries(ALL_HEROES)) {
		entries.push({ id, entityType: "hero", category: "units", sprite: def.sprite });
	}

	// Buildings (32x32)
	for (const [id, def] of Object.entries(ALL_BUILDINGS)) {
		entries.push({ id, entityType: "building", category: "buildings", sprite: def.sprite });
	}

	// Terrain tiles
	for (const [id, def] of Object.entries(TERRAIN_TILES)) {
		entries.push({ id, entityType: "terrain", category: "terrain", sprite: def.sprite });
	}

	// Portraits (64x96)
	for (const [id, def] of Object.entries(ALL_PORTRAITS)) {
		entries.push({ id, entityType: "portrait", category: "portraits", sprite: def.sprite });
	}

	// Resources
	for (const [id, def] of Object.entries(ALL_RESOURCES)) {
		entries.push({ id, entityType: "resource", category: "resources", sprite: def.sprite });
	}

	// Props
	for (const [id, def] of Object.entries(ALL_PROPS)) {
		entries.push({
			id,
			entityType: "prop",
			category: "props",
			sprite: (def as { sprite: SpriteDef | SPDSLSprite }).sprite,
		});
	}

	return entries;
}

function buildAssetContractManifest(entries: SpriteEntry[]): BuiltAssetReferenceContract[] {
	const entriesByKey = new Map(
		entries.map((entry) => [toEntryKey(entry.entityType, entry.id), entry]),
	);

	return ASSET_REFERENCE_CONTRACTS.map((contract) => {
		const entry = entriesByKey.get(toEntryKey(contract.entityType, contract.entityId));
		if (!entry) {
			throw new Error(`Missing sprite entry for asset contract ${contract.entityId}`);
		}
		if (entry.category !== contract.outputCategory) {
			throw new Error(
				`Asset contract ${contract.entityId} expected ${contract.outputCategory} but found ${entry.category}`,
			);
		}

		return {
			...contract,
			canonicalDimensions: getCategoryDimensions(contract.outputCategory),
			palette: resolveSpritePalette(entry.sprite),
			primaryFrameKey: contract.entityId,
		};
	});
}

function buildAssetFamilyManifest(entries: SpriteEntry[]): BuiltAssetFamilyDefinition[] {
	const entriesByKey = new Map(
		entries.map((entry) => [toEntryKey(entry.entityType, entry.id), entry]),
	);

	return ASSET_FAMILIES.map((family) => {
		for (const memberId of family.memberIds) {
			const entry = entriesByKey.get(toEntryKey(family.entityType, memberId));
			if (!entry) {
				throw new Error(`Missing sprite entry for family member ${memberId} in ${family.familyId}`);
			}
			if (entry.category !== family.outputCategory) {
				throw new Error(
					`Asset family ${family.familyId} member ${memberId} expected ${family.outputCategory} but found ${entry.category}`,
				);
			}
		}

		return {
			...family,
			canonicalDimensions: getCategoryDimensions(family.outputCategory),
			referenceContractId: getFamilyReferenceContract(family)?.entityId ?? null,
		};
	});
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
		const fallbackDimensions = resolveSpriteDimensions(sprite.layers, 0);
		const canonical = getCategoryDimensions(entry.category);
		const dimensions = canonical ?? {
			width: fallbackDimensions.width,
			height: fallbackDimensions.height,
			size: fallbackDimensions.width,
		};

		// Render base layers as idle frame
		const canvas = renderSPDSLFrame(sprite.layers, sprite.palette, dimensions);
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
					const frameFallbackDimensions = resolveSpriteDimensions(frameLayers, i);
					const frameDimensions = canonical ?? {
						width: frameFallbackDimensions.width,
						height: frameFallbackDimensions.height,
						size: frameFallbackDimensions.width,
					};
					const frameCanvas = renderSPDSLFrame(frameLayers, sprite.palette, frameDimensions, i);
					results.push({ key: `${entry.id}_${animName}_${i}`, canvas: frameCanvas });
				}
			}
		}
	}

	const recipe =
		entry.entityType === "unit" ||
		entry.entityType === "hero" ||
		entry.entityType === "building" ||
		entry.entityType === "portrait"
			? ASSET_VARIANT_RECIPES.find(
					(candidate) =>
						candidate.entityKey ===
						toAssetEntityKey(entry.entityType as AssetFamilyEntityType, entry.id),
				)
			: undefined;

	if (recipe) {
		const baseFrames = new Map(results.map((result) => [result.key, result.canvas]));
		for (const variant of recipe.generatedVariants) {
			if (variant.variantKind !== "hitflash") {
				continue;
			}

			for (let index = 0; index < variant.sourceFrameKeys.length; index++) {
				const sourceFrameKey = variant.sourceFrameKeys[index];
				const generatedFrameKey = variant.generatedFrameKeys[index];
				const sourceCanvas = baseFrames.get(sourceFrameKey);
				if (!sourceCanvas) {
					throw new Error(
						`Missing source frame ${sourceFrameKey} for generated variant ${generatedFrameKey}`,
					);
				}
				results.push({
					key: generatedFrameKey,
					canvas: applyHitFlashCanvas(sourceCanvas, variant.overlayColor),
				});
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
		const frame = scaled.find((s) => s.key === p.key);
		if (!frame) {
			throw new Error(`Missing scaled frame for placement ${p.key}`);
		}
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
	assertAssetGeneratorPresetsValid();
	const allSprites = collectAllSprites();
	console.log(`[build-sprites] Found ${allSprites.length} entities`);
	const assetContractManifest = buildAssetContractManifest(allSprites);
	const assetFamilyManifest = buildAssetFamilyManifest(allSprites);

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
	fs.writeFileSync(
		path.join(OUTPUT_ROOT, "asset-contracts.json"),
		JSON.stringify(assetContractManifest, null, 2),
	);
	fs.writeFileSync(
		path.join(OUTPUT_ROOT, "asset-families.json"),
		JSON.stringify(assetFamilyManifest, null, 2),
	);
	fs.writeFileSync(
		path.join(OUTPUT_ROOT, "asset-generator-presets.json"),
		JSON.stringify(ASSET_GENERATOR_PRESETS, null, 2),
	);
	fs.writeFileSync(
		path.join(OUTPUT_ROOT, "asset-variant-recipes.json"),
		JSON.stringify(ASSET_VARIANT_RECIPES, null, 2),
	);
	console.log(
		`[build-sprites] Wrote asset-contracts.json with ${assetContractManifest.length} golden-slice contracts`,
	);
	console.log(
		`[build-sprites] Wrote asset-families.json with ${assetFamilyManifest.length} canonical families`,
	);
	console.log(
		`[build-sprites] Wrote asset-generator-presets.json with ${ASSET_GENERATOR_PRESETS.length} family presets`,
	);
	console.log(
		`[build-sprites] Wrote asset-variant-recipes.json with ${ASSET_VARIANT_RECIPES.length} variant recipes`,
	);

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
