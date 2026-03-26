// src/entities/terrain/map-painter.ts
// Paints a mission's terrain onto a single background Canvas.
// POC-grade visual richness: dense noise, organic scatter patches,
// smooth bezier rivers, edge blending, and decorative details.

import type { MissionDef, TerrainRegion, TerrainTileDef } from "../types";
import { TERRAIN_TILES } from "./tiles";

type Ctx = CanvasRenderingContext2D;

/**
 * Paint the terrain for a mission onto an offscreen Canvas.
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

	// 1. Fill base layer with rich, POC-grade noise
	const baseRegion = terrain.regions.find((r) => r.fill);
	if (baseRegion) {
		paintRegionFill(ctx, pixelW, pixelH, tileLookup[baseRegion.terrainId]);
	}

	// 2. Paint subsequent regions with edge blending
	for (const region of terrain.regions) {
		if (region.fill) continue;
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

	// 4. Add global terrain shimmer (subtle variation pass)
	addGlobalShimmer(ctx, pixelW, pixelH);

	return canvas;
}

// ─── Dense noise fill (POC used 50,000 pixels on 1280×1280) ───

function paintRegionFill(ctx: Ctx, width: number, height: number, tile: TerrainTileDef): void {
	if (!tile?.paintRules) return;
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules;

	// Solid base
	ctx.fillStyle = baseColor;
	ctx.fillRect(0, 0, width, height);

	// Dense noise — 4x the old density, varied pixel sizes
	const area = width * height;
	const noiseCount = Math.floor((area / 16) * noiseDensity * 4);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		const size = 2 + Math.floor(Math.random() * 4); // 2-5px
		ctx.fillRect(Math.random() * width, Math.random() * height, size, size);
	}

	// Organic scatter patches — creates natural terrain variation (like POC's 100 patches)
	const patchCount = Math.floor((area / (128 * 128)) * 8);
	for (let p = 0; p < patchCount; p++) {
		const px = Math.random() * width;
		const py = Math.random() * height;
		const radius = 20 + Math.random() * 60;
		const patchColor = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		paintScatterPatch(ctx, px, py, radius, patchColor, 0.4);
	}

	// Additional dark splotches for depth
	const darkCount = Math.floor(patchCount * 0.3);
	for (let d = 0; d < darkCount; d++) {
		const px = Math.random() * width;
		const py = Math.random() * height;
		const radius = 10 + Math.random() * 40;
		paintScatterPatch(ctx, px, py, radius, darken(baseColor, 0.15), 0.25);
	}
}

/** Paint an organic scatter patch — a cluster of small rects in a rough circle. */
function paintScatterPatch(
	ctx: Ctx,
	cx: number,
	cy: number,
	radius: number,
	color: string,
	density: number,
): void {
	const count = Math.floor(radius * density * 12);
	ctx.fillStyle = color;
	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const dist = Math.random() * radius;
		const size = 2 + Math.floor(Math.random() * 5);
		ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, size, size);
	}
}

// ─── Rectangle region with edge feathering ───

function paintRect(
	ctx: Ctx,
	rect: NonNullable<TerrainRegion["rect"]>,
	tileSize: number,
	tile: TerrainTileDef,
): void {
	const px = rect.x * tileSize;
	const py = rect.y * tileSize;
	const pw = rect.w * tileSize;
	const ph = rect.h * tileSize;
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;

	// Solid fill
	ctx.fillStyle = baseColor;
	ctx.fillRect(px, py, pw, ph);

	// Dense noise
	const area = pw * ph;
	const noiseCount = Math.floor((area / 16) * noiseDensity * 4);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		const size = 2 + Math.floor(Math.random() * 4);
		ctx.fillRect(px + Math.random() * pw, py + Math.random() * ph, size, size);
	}

	// Scatter patches within region
	const patchCount = Math.max(3, Math.floor((area / (64 * 64)) * 3));
	for (let p = 0; p < patchCount; p++) {
		const pcx = px + Math.random() * pw;
		const pcy = py + Math.random() * ph;
		const radius = 10 + Math.random() * 30;
		paintScatterPatch(
			ctx,
			pcx,
			pcy,
			radius,
			noiseColors[Math.floor(Math.random() * noiseColors.length)],
			0.3,
		);
	}

	// Edge feathering — scatter base-color dots along edges to soften transitions
	paintEdgeFeather(ctx, px, py, pw, ph, baseColor, tileSize);
}

/** Scatter noise along region edges to create softer transitions. */
function paintEdgeFeather(
	ctx: Ctx,
	px: number,
	py: number,
	pw: number,
	ph: number,
	color: string,
	featherWidth: number,
): void {
	const fw = Math.min(featherWidth, 16);
	const count = Math.floor((2 * (pw + ph)) / 3);
	ctx.fillStyle = color;
	for (let i = 0; i < count; i++) {
		const side = Math.floor(Math.random() * 4);
		let x: number, y: number;
		const offset = (Math.random() - 0.5) * fw * 2;
		switch (side) {
			case 0:
				x = px + Math.random() * pw;
				y = py + offset;
				break; // top
			case 1:
				x = px + Math.random() * pw;
				y = py + ph + offset;
				break; // bottom
			case 2:
				x = px + offset;
				y = py + Math.random() * ph;
				break; // left
			default:
				x = px + pw + offset;
				y = py + Math.random() * ph;
				break; // right
		}
		const size = 2 + Math.floor(Math.random() * 4);
		ctx.fillRect(x, y, size, size);
	}
}

// ─── Circle region ───

function paintCircle(
	ctx: Ctx,
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
	const noiseCount = Math.floor((area / 16) * noiseDensity * 4);
	for (let i = 0; i < noiseCount; i++) {
		const angle = Math.random() * Math.PI * 2;
		const r = Math.random() * radius;
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		const size = 2 + Math.floor(Math.random() * 4);
		ctx.fillRect(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, size, size);
	}

	ctx.restore();
}

// ─── River (smooth bezier curves, proper width) ───

function paintRiver(
	ctx: Ctx,
	river: NonNullable<TerrainRegion["river"]>,
	tileSize: number,
	tile: TerrainTileDef,
): void {
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;
	const halfWidth = (river.width * tileSize) / 2;

	const points = river.points.map(([x, y]) => [x * tileSize, y * tileSize]);
	if (points.length < 2) return;

	ctx.save();

	// Draw river using thick stroke path with smooth bezier interpolation
	ctx.beginPath();
	ctx.moveTo(points[0][0], points[0][1]);

	if (points.length === 2) {
		ctx.lineTo(points[1][0], points[1][1]);
	} else {
		// Catmull-Rom → Bezier for smooth river curves
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[Math.max(0, i - 1)];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[Math.min(points.length - 1, i + 2)];

			const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
			const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
			const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
			const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
		}
	}

	// Use thick stroke to create the river body
	ctx.lineWidth = halfWidth * 2;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.strokeStyle = baseColor;
	ctx.stroke();

	// Clip to river shape for noise
	ctx.lineWidth = halfWidth * 2;
	ctx.clip();

	// Dense water noise within the river
	const bounds = getRiverBounds(points, halfWidth);
	const area = bounds.w * bounds.h;
	const noiseCount = Math.floor((area / 16) * noiseDensity * 5);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		const size = 2 + Math.floor(Math.random() * 4);
		ctx.fillRect(
			bounds.x + Math.random() * bounds.w,
			bounds.y + Math.random() * bounds.h,
			size,
			size,
		);
	}

	// Water shimmer highlights
	const shimmerCount = Math.floor(noiseCount * 0.1);
	for (let i = 0; i < shimmerCount; i++) {
		ctx.fillStyle = "rgba(147, 197, 253, 0.15)"; // light blue shimmer
		const w = 3 + Math.floor(Math.random() * 8);
		ctx.fillRect(bounds.x + Math.random() * bounds.w, bounds.y + Math.random() * bounds.h, w, 2);
	}

	ctx.restore();

	// River banks — dark edge scatter along the river path
	paintRiverBanks(ctx, points, halfWidth);
}

/** Paint dark, muddy bank scatter along river edges. */
function paintRiverBanks(ctx: Ctx, points: number[][], halfWidth: number): void {
	const bankWidth = halfWidth * 0.4;
	const bankColor1 = "#451a03"; // dark mud
	const bankColor2 = "#5c4033"; // lighter mud

	// Sample points along the bezier and scatter bank noise
	for (let i = 0; i < points.length - 1; i++) {
		const p1 = points[i];
		const p2 = points[i + 1];
		const dist = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
		const steps = Math.floor(dist / 4);

		for (let s = 0; s < steps; s++) {
			const t = s / steps;
			const x = p1[0] + (p2[0] - p1[0]) * t;
			const y = p1[1] + (p2[1] - p1[1]) * t;

			// Perpendicular direction
			const dx = p2[0] - p1[0];
			const dy = p2[1] - p1[1];
			const len = Math.sqrt(dx * dx + dy * dy) || 1;
			const nx = -dy / len;
			const ny = dx / len;

			// Scatter along both banks
			for (let b = 0; b < 3; b++) {
				const spread = halfWidth + (Math.random() - 0.3) * bankWidth;
				ctx.fillStyle = Math.random() > 0.5 ? bankColor1 : bankColor2;
				const size = 2 + Math.floor(Math.random() * 4);
				ctx.fillRect(x + nx * spread, y + ny * spread, size, size);
				ctx.fillRect(x - nx * spread, y - ny * spread, size, size);
			}
		}
	}
}

// ─── Single tile override ───

function paintTile(ctx: Ctx, px: number, py: number, tileSize: number, tile: TerrainTileDef): void {
	const { baseColor, noiseColors, noiseDensity } = tile.paintRules!;
	ctx.fillStyle = baseColor;
	ctx.fillRect(px, py, tileSize, tileSize);

	const noiseCount = Math.floor(((tileSize * tileSize) / 16) * noiseDensity * 3);
	for (let i = 0; i < noiseCount; i++) {
		ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)];
		const size = 2 + Math.floor(Math.random() * 3);
		ctx.fillRect(px + Math.random() * tileSize, py + Math.random() * tileSize, size, size);
	}
}

// ─── Global shimmer pass ───

/** Adds subtle highlight/shadow variations across the entire terrain. */
function addGlobalShimmer(ctx: Ctx, width: number, height: number): void {
	// Light dappled patches (like filtered sunlight through canopy)
	const patchCount = Math.floor((width * height) / (200 * 200));
	for (let i = 0; i < patchCount; i++) {
		const x = Math.random() * width;
		const y = Math.random() * height;
		const r = 20 + Math.random() * 60;
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
		gradient.addColorStop(0, "rgba(255, 255, 255, 0.04)");
		gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
		ctx.fillStyle = gradient;
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
	}
}

// ─── Helpers ───

function getRiverBounds(points: number[][], halfWidth: number) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of points) {
		minX = Math.min(minX, x - halfWidth);
		minY = Math.min(minY, y - halfWidth);
		maxX = Math.max(maxX, x + halfWidth);
		maxY = Math.max(maxY, y + halfWidth);
	}
	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Darken a hex color by a factor (0-1). */
function darken(hex: string, amount: number): string {
	const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount));
	const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount));
	const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount));
	return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
