/**
 * MinimapLayer — small inset canvas showing terrain overview, entity pips,
 * and camera viewport rectangle. Click/tap to jump camera.
 *
 * Renders as an absolutely-positioned HTML canvas overlaid on the game container.
 * Uses requestAnimationFrame to redraw at ~15 fps for performance.
 *
 * Sizing: 150×100 on mobile (viewport < 768px), 200×150 on desktop.
 * Position: bottom-right corner with 8px margin.
 */

import { useQuery } from "koota/react";
import { useCallback, useEffect, useRef } from "react";
import { Faction, IsBuilding, IsResource } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import type { CameraState } from "./useCamera";

// ─── Constants ───

const CELL_SIZE = 32;
const MARGIN = 8;
const MOBILE_W = 150;
const MOBILE_H = 100;
const DESKTOP_W = 200;
const DESKTOP_H = 150;
const TARGET_FPS = 15;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// ─── Faction colors ───

/** OEF (ura) = green, Scale-Guard = red, neutral/resource = yellow, fallback = white */
function factionColor(factionId: string, isResource: boolean): string {
	if (isResource) return "#eab308";
	if (factionId === "ura") return "#22c55e";
	if (factionId === "scale_guard") return "#ef4444";
	return "#ffffff";
}

// ─── Props ───

export interface MinimapLayerProps {
	/** Current camera state (x, y in world pixels). */
	camera: CameraState;
	/** Main viewport width in pixels. */
	viewportW: number;
	/** Main viewport height in pixels. */
	viewportH: number;
	/** World width in pixels. */
	worldW: number;
	/** World height in pixels. */
	worldH: number;
	/** Terrain canvas (from paintTerrain). */
	terrainCanvas: HTMLCanvasElement | null;
	/** Jump camera to world position (centered). */
	setPosition: (x: number, y: number) => void;
}

// ─── Component ───

export function MinimapLayer({
	camera,
	viewportW,
	viewportH,
	worldW,
	worldH,
	terrainCanvas,
	setPosition,
}: MinimapLayerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const entities = useQuery(Position, Faction);
	const lastDrawRef = useRef(0);
	const rafRef = useRef(0);

	// Responsive sizing
	const isMobile = viewportW < 768;
	const mw = isMobile ? MOBILE_W : DESKTOP_W;
	const mh = isMobile ? MOBILE_H : DESKTOP_H;

	// Scale factors
	const sx = worldW > 0 ? mw / worldW : 1;
	const sy = worldH > 0 ? mh / worldH : 1;

	// Draw minimap
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;

		// 1. Terrain background (scaled down)
		if (terrainCanvas) {
			ctx.drawImage(terrainCanvas, 0, 0, mw, mh);
		} else {
			ctx.fillStyle = "#1a3a2a";
			ctx.fillRect(0, 0, mw, mh);
		}

		// 2. Entity pips
		for (const entity of entities) {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			if (!pos || !faction) continue;

			const isRes = entity.has(IsResource);
			const isBldg = entity.has(IsBuilding);
			const dotSize = isBldg ? 4 : 2;

			ctx.fillStyle = factionColor(faction.id, isRes);
			const ex = pos.x * CELL_SIZE * sx;
			const ey = pos.y * CELL_SIZE * sy;
			ctx.fillRect(ex - dotSize / 2, ey - dotSize / 2, dotSize, dotSize);
		}

		// 3. Camera viewport rectangle (white outline)
		const cx = camera.x * sx;
		const cy = camera.y * sy;
		const cw = viewportW * sx;
		const ch = viewportH * sy;
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 1.5;
		ctx.strokeRect(cx, cy, cw, ch);
	}, [entities, camera, viewportW, viewportH, terrainCanvas, mw, mh, sx, sy]);

	// Animation loop (throttled to ~15 fps)
	useEffect(() => {
		let running = true;
		const tick = (now: number) => {
			if (!running) return;
			if (now - lastDrawRef.current >= FRAME_INTERVAL) {
				lastDrawRef.current = now;
				draw();
			}
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			running = false;
			cancelAnimationFrame(rafRef.current);
		};
	}, [draw]);

	// Click/tap handler — jump camera to clicked world position (centered)
	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			e.stopPropagation();
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			const clickX = ((e.clientX - rect.left) / rect.width) * worldW;
			const clickY = ((e.clientY - rect.top) / rect.height) * worldH;
			// Center viewport on click position
			setPosition(clickX - viewportW / 2, clickY - viewportH / 2);
		},
		[worldW, worldH, viewportW, viewportH, setPosition],
	);

	return (
		<canvas
			ref={canvasRef}
			width={mw}
			height={mh}
			onPointerDown={handlePointerDown}
			tabIndex={0}
			aria-label="Minimap — click or drag to move camera"
			role="img"
			style={{
				position: "absolute",
				bottom: MARGIN,
				right: MARGIN,
				width: mw,
				height: mh,
				border: "1px solid rgba(255,255,255,0.3)",
				borderRadius: 4,
				cursor: "crosshair",
				touchAction: "none",
				zIndex: 30,
				imageRendering: "pixelated",
			}}
		/>
	);
}
