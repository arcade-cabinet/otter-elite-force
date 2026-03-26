/**
 * FogLayer — canvas-compositing fog of war rendered via Konva Shape.
 *
 * Three fog states:
 * 1. Unexplored — full fog texture (never seen)
 * 2. Explored — dimmed fog (seen before, units left)
 * 3. Visible — clear (unit currently has vision)
 *
 * Uses a tile grid to track explored state persistently.
 * Renders via Canvas2D `destination-out` compositing on a tiled noise texture.
 */

import type { Context } from "konva/lib/Context";
import type { Shape as KonvaShape } from "konva/lib/Shape";
import { useQuery } from "koota/react";
import { useEffect, useMemo, useRef } from "react";
import { Layer, Shape } from "react-konva";

import { VisionRadius } from "@/ecs/traits/combat";
import { Faction } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

// ─── Constants ───

const CELL_SIZE = 32;
const FOG_NOISE_SIZE = 512;
const FOG_BASE = "#0a0f1a";
const FOG_CLOUD = "rgba(30, 40, 55, 0.35)";
const FOG_CLOUD_EDGE = "rgba(30, 40, 55, 0)";
const CLOUD_COUNT = 80;
const PLAYER_FACTION = "ura";

/** Resolution of the explored-state grid (in world tiles). */
const FOG_GRID_CELL = 2; // each fog cell covers 2x2 tiles

// ─── Fog noise texture ───

function buildFogTexture(): HTMLCanvasElement {
	const size = FOG_NOISE_SIZE;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;

	ctx.fillStyle = FOG_BASE;
	ctx.fillRect(0, 0, size, size);

	const offsets = [
		[-1, -1],
		[0, -1],
		[1, -1],
		[-1, 0],
		[0, 0],
		[1, 0],
		[-1, 1],
		[0, 1],
		[1, 1],
	];

	for (let i = 0; i < CLOUD_COUNT; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		const r = 30 + Math.random() * 60;
		const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
		grad.addColorStop(0, FOG_CLOUD);
		grad.addColorStop(1, FOG_CLOUD_EDGE);
		ctx.fillStyle = grad;

		for (const [ox, oy] of offsets) {
			ctx.beginPath();
			ctx.arc(x + ox * size, y + oy * size, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	return canvas;
}

// ─── Props ───

export interface FogLayerProps {
	camX: number;
	camY: number;
	viewportW: number;
	viewportH: number;
	/** World dimensions in tiles. */
	worldTilesW: number;
	worldTilesH: number;
}

// ─── Component ───

export function FogLayer({
	camX,
	camY,
	viewportW,
	viewportH,
	worldTilesW,
	worldTilesH,
}: Readonly<FogLayerProps>) {
	const fogTile = useMemo(() => buildFogTexture(), []);

	// Explored-state grid: 0 = unexplored, 1 = explored (seen before), 2 = currently visible
	const gridW = Math.ceil(worldTilesW / FOG_GRID_CELL);
	const gridH = Math.ceil(worldTilesH / FOG_GRID_CELL);
	const exploredGrid = useRef<Uint8Array | null>(null);

	// Initialize grid on first render or world size change
	useEffect(() => {
		exploredGrid.current = new Uint8Array(gridW * gridH);
	}, [gridW, gridH]);

	const visibleEntities = useQuery(Position, Faction, VisionRadius);

	const sceneFunc = (ctx: Context, shape: KonvaShape) => {
		const canvas2d = ctx._context as CanvasRenderingContext2D;
		const grid = exploredGrid.current;
		if (!grid) return;

		// ── Mark currently visible cells ──
		// Reset all cells from "visible" (2) to "explored" (1)
		for (let i = 0; i < grid.length; i++) {
			if (grid[i] === 2) grid[i] = 1;
		}

		// Mark cells within each player unit's vision as visible (2)
		for (const entity of visibleEntities) {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			const vision = entity.get(VisionRadius);
			if (!pos || !faction || !vision || faction.id !== PLAYER_FACTION) continue;

			const cx = Math.floor(pos.x / FOG_GRID_CELL);
			const cy = Math.floor(pos.y / FOG_GRID_CELL);
			const r = Math.ceil(vision.radius / FOG_GRID_CELL);

			for (let dy = -r; dy <= r; dy++) {
				for (let dx = -r; dx <= r; dx++) {
					if (dx * dx + dy * dy > r * r) continue;
					const gx = cx + dx;
					const gy = cy + dy;
					if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH) continue;
					grid[gy * gridW + gx] = 2;
				}
			}
		}

		// ── 1. Fill viewport with tiled fog pattern ──
		const pattern = canvas2d.createPattern(fogTile, "repeat");
		if (pattern) {
			canvas2d.save();
			const driftX = -(camX * 0.2) % FOG_NOISE_SIZE;
			const driftY = -(camY * 0.2) % FOG_NOISE_SIZE;
			canvas2d.translate(driftX, driftY);
			canvas2d.fillStyle = pattern;
			canvas2d.fillRect(
				-FOG_NOISE_SIZE,
				-FOG_NOISE_SIZE,
				viewportW + FOG_NOISE_SIZE * 2,
				viewportH + FOG_NOISE_SIZE * 2,
			);
			canvas2d.restore();
		}

		// ── 2. Punch holes for explored and visible cells ──
		canvas2d.globalCompositeOperation = "destination-out";

		const cellPx = FOG_GRID_CELL * CELL_SIZE;

		// First pass: explored cells get partial punch-through (dimmed, not black)
		for (let gy = 0; gy < gridH; gy++) {
			for (let gx = 0; gx < gridW; gx++) {
				const state = grid[gy * gridW + gx];
				if (state === 0) continue; // unexplored — leave full fog

				const screenX = gx * cellPx - camX + cellPx / 2;
				const screenY = gy * cellPx - camY + cellPx / 2;

				// Skip off-screen cells
				if (
					screenX + cellPx < 0 ||
					screenX - cellPx > viewportW ||
					screenY + cellPx < 0 ||
					screenY - cellPx > viewportH
				)
					continue;

				if (state === 1) {
					// Explored but not visible — punch 50% (leaves dimmed fog)
					canvas2d.fillStyle = "rgba(0,0,0,0.5)";
					canvas2d.fillRect(screenX - cellPx / 2, screenY - cellPx / 2, cellPx, cellPx);
				}
			}
		}

		// Second pass: currently visible — punch with soft radial gradients per unit
		for (const entity of visibleEntities) {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			const vision = entity.get(VisionRadius);
			if (!pos || !faction || !vision || faction.id !== PLAYER_FACTION) continue;

			const screenX = pos.x * CELL_SIZE - camX;
			const screenY = pos.y * CELL_SIZE - camY;
			const radiusPx = vision.radius * CELL_SIZE;

			if (
				screenX + radiusPx < 0 ||
				screenX - radiusPx > viewportW ||
				screenY + radiusPx < 0 ||
				screenY - radiusPx > viewportH
			)
				continue;

			const grad = canvas2d.createRadialGradient(screenX, screenY, 0, screenX, screenY, radiusPx);
			grad.addColorStop(0, "rgba(0,0,0,1)");
			grad.addColorStop(0.4, "rgba(0,0,0,1)");
			grad.addColorStop(0.7, "rgba(0,0,0,0.6)");
			grad.addColorStop(0.9, "rgba(0,0,0,0.2)");
			grad.addColorStop(1, "rgba(0,0,0,0)");

			canvas2d.fillStyle = grad;
			canvas2d.beginPath();
			canvas2d.arc(screenX, screenY, radiusPx, 0, Math.PI * 2);
			canvas2d.fill();
		}

		canvas2d.globalCompositeOperation = "source-over";
		ctx.fillStrokeShape(shape);
	};

	return (
		<Layer listening={false} opacity={0.85}>
			<Shape sceneFunc={sceneFunc} width={viewportW} height={viewportH} listening={false} />
		</Layer>
	);
}
