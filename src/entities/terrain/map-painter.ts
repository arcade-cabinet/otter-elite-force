// src/entities/terrain/map-painter.ts
// Paints a mission's terrain onto a single background Canvas.
// Follows the POC's buildMap() pattern: fill base, apply regions, apply overrides.

import type { MissionDef, TerrainRegion, TerrainTileDef } from "../types";
import { TERRAIN_TILES } from "./tiles";

/**
 * Paint the terrain for a mission onto an offscreen Canvas.
 *
 * @param terrain - The mission's terrain definition (width, height, regions, overrides)
 * @param tileSize - Pixel size of a single tile after scaling (e.g., 48 at 3x)
 * @param tileLookup - Optional custom tile lookup; defaults to TERRAIN_TILES
 * @returns The painted Canvas
 */
export function paintMap(
	terrain: MissionDef["terrain"],
	tileSize: number,
	tileLookup: Record<string, TerrainTileDef> = TERRAIN_TILES,
): HTMLCanvasElement {
	const pixelW = terrain.width * tileSize;
	const pixelH = terrain.height * tileSize;

	const canvas = document.createElement("canvas");
	canvas.width = pixelW;
	canvas.height = pixelH;
	const ctx = canvas.getContext("2d", { alpha: false })!;

	// 1. Fill base layer (first region with fill: true)
	const baseRegion = terrain.regions.find((r) => r.fill);
	if (baseRegion) {
		paintRegionFill(ctx, pixelW, pixelH, tileLookup[baseRegion.terrainId]);
	}

	// 2. Paint subsequent regions
	for (const region of terrain.regions) {
		if (region.fill) continue; // already handled
		const tile = tileLookup[region.terrainId];
		if (!tile?.paintRules) continue;

		if (region.rect) {
			paintRect(ctx, region.rect, tileSize, tile);
		} else if (region.circle) {
			paintCircle(ctx, region.circle, tileSize, tile);
		} else if (region.river) {
			paintRiver(ctx, region.river, tileSize, tile);
		}
	}

	// 3. Apply sparse tile overrides
	for (const override of terrain.overrides) {
		const tile = tileLookup[override.terrainId];
		if (!tile?.paintRules) continue;
		paintTile(ctx, override.x * tileSize, override.y * tileSize, tileSize, tile);
	}

	return canvas;
}

/** Fill the entire canvas with a terrain's paint rules. */
function paintRegionFill(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	tile: TerrainTileDef,
): void {
	if (!tile?.paintRules) return;
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules;

	ctx.fillStyle = baseColor;
	ctx.fillRect(0, 0, width, height);

	// Scatter noise pixels
	const area = width * height;
	const noiseCount = Math.floor((area / 16) * noiseDensity);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		ctx.fillRect(Math.random() * width, Math.random() * height, 4, 4);
	}
}

/** Paint a rectangular region. */
function paintRect(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	rect: NonNullable<TerrainRegion["rect"]>,
	tileSize: number,
	tile: TerrainTileDef,
): void {
	const px = rect.x * tileSize;
	const py = rect.y * tileSize;
	const pw = rect.w * tileSize;
	const ph = rect.h * tileSize;
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;

	ctx.fillStyle = baseColor;
	ctx.fillRect(px, py, pw, ph);

	const area = pw * ph;
	const noiseCount = Math.floor((area / 16) * noiseDensity);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		ctx.fillRect(px + Math.random() * pw, py + Math.random() * ph, 4, 4);
	}
}

/** Paint a circular region. */
function paintCircle(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	circle: NonNullable<TerrainRegion["circle"]>,
	tileSize: number,
	tile: TerrainTileDef,
): void {
	const cx = circle.cx * tileSize;
	const cy = circle.cy * tileSize;
	const radius = circle.r * tileSize;
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;

	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.clip();

	ctx.fillStyle = baseColor;
	ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

	const area = Math.PI * radius * radius;
	const noiseCount = Math.floor((area / 16) * noiseDensity);
	for (let i = 0; i < noiseCount; i++) {
		const angle = Math.random() * Math.PI * 2;
		const r = Math.random() * radius;
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		ctx.fillRect(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4, 4);
	}

	ctx.restore();
}

/** Paint a river (series of connected segments with width). */
function paintRiver(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	river: NonNullable<TerrainRegion["river"]>,
	tileSize: number,
	tile: TerrainTileDef,
): void {
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;
	const halfWidth = (river.width * tileSize) / 2;

	ctx.save();
	ctx.beginPath();

	// Build path along river points
	const points = river.points.map(([x, y]) => [x * tileSize, y * tileSize]);
	if (points.length >= 2) {
		ctx.moveTo(points[0][0] - halfWidth, points[0][1]);
		// Forward pass (left bank)
		for (const [x, y] of points) {
			ctx.lineTo(x - halfWidth, y);
		}
		// Reverse pass (right bank)
		for (let i = points.length - 1; i >= 0; i--) {
			ctx.lineTo(points[i][0] + halfWidth, points[i][1]);
		}
		ctx.closePath();
		ctx.clip();

		// Fill river area
		const bounds = getRiverBounds(points, halfWidth);
		ctx.fillStyle = baseColor;
		ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

		const area = bounds.w * bounds.h;
		const noiseCount = Math.floor((area / 16) * noiseDensity);
		for (let i = 0; i < noiseCount; i++) {
			ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
			ctx.fillRect(bounds.x + Math.random() * bounds.w, bounds.y + Math.random() * bounds.h, 4, 4);
		}
	}

	ctx.restore();
}

/** Paint a single tile. */
function paintTile(
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	px: number,
	py: number,
	tileSize: number,
	tile: TerrainTileDef,
): void {
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;
	ctx.fillStyle = baseColor;
	ctx.fillRect(px, py, tileSize, tileSize);

	const noiseCount = Math.floor(((tileSize * tileSize) / 16) * noiseDensity);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		ctx.fillRect(px + Math.random() * tileSize, py + Math.random() * tileSize, 2, 2);
	}
}

function getRiverBounds(points: number[][], halfWidth: number) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of points) {
		minX = Math.min(minX, x - halfWidth);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x + halfWidth);
		maxY = Math.max(maxY, y);
	}
	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
