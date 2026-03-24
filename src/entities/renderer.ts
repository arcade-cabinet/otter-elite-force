// src/entities/renderer.ts
// Renders ASCII sprite definitions into Canvas elements at a given scale.
// Follows the same pattern as the POC's buildSprites() but works with
// the new SpriteDef/PALETTE type system.

import type { SpriteDef } from "./types";
import { PALETTE } from "./palette";

/**
 * Determine scale factor based on device characteristics.
 * Units (16px): 2x mobile, 3x tablet/desktop, 4x high-DPI desktop
 * Buildings (32px): 2-3x
 * Portraits (64x96): 1-2x (already large)
 */
export function getScaleFactor(gridSize: number): number {
	const dpr = typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;
	const width = typeof window !== "undefined" ? (window.innerWidth ?? 1024) : 1024;

	if (gridSize >= 64) {
		// Portraits — already large
		return dpr >= 2 ? 2 : 1;
	}
	if (gridSize >= 32) {
		// Buildings
		return width < 768 ? 2 : 3;
	}
	// Units, props, terrain tiles (16px)
	if (width < 768) return 2;
	if (dpr >= 2 && width >= 1440) return 4;
	return 3;
}

/**
 * Render a single ASCII frame (string[]) into an offscreen Canvas.
 * Each character is looked up in PALETTE and drawn as a scale x scale block.
 * Returns the scaled Canvas.
 */
export function renderFrame(frame: string[], scale: number): HTMLCanvasElement {
	const height = frame.length;
	const width = height > 0 ? frame[0].length : 0;

	// Draw at 1:1 first
	const raw = document.createElement("canvas");
	raw.width = width;
	raw.height = height;
	const ctx = raw.getContext("2d")!;

	for (let y = 0; y < height; y++) {
		const row = frame[y];
		for (let x = 0; x < row.length; x++) {
			const char = row[x];
			const color = PALETTE[char];
			if (color && color !== "transparent") {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	// Scale up for that chunky pixel look
	const scaled = document.createElement("canvas");
	scaled.width = width * scale;
	scaled.height = height * scale;
	const sCtx = scaled.getContext("2d")!;
	sCtx.imageSmoothingEnabled = false;
	sCtx.drawImage(raw, 0, 0, width * scale, height * scale);

	return scaled;
}

/**
 * Result of rendering a full SpriteDef: one Canvas per animation frame,
 * keyed as `{entityId}` for idle frame 0, `{entityId}_{anim}_{frameIdx}` for others.
 */
export interface RenderedSprite {
	/** entityId → Canvas. The idle frame 0 is stored under just the entityId. */
	textures: Map<string, HTMLCanvasElement>;
	/** Rendered width in pixels (after scaling). */
	width: number;
	/** Rendered height in pixels (after scaling). */
	height: number;
}

/**
 * Render all animation frames for a SpriteDef at the given scale.
 * Returns a map of texture keys → Canvas elements.
 *
 * Key naming:
 *  - idle frame 0: `entityId`
 *  - other frames: `entityId_animationName_frameIndex`
 */
export function renderSprite(entityId: string, sprite: SpriteDef, scale?: number): RenderedSprite {
	const s = scale ?? getScaleFactor(sprite.size);
	const textures = new Map<string, HTMLCanvasElement>();
	let width = 0;
	let height = 0;

	for (const [animName, frames] of Object.entries(sprite.frames)) {
		for (let i = 0; i < frames.length; i++) {
			const canvas = renderFrame(frames[i], s);
			width = canvas.width;
			height = canvas.height;

			// idle frame 0 gets the bare entityId as key
			const key = animName === "idle" && i === 0 ? entityId : `${entityId}_${animName}_${i}`;
			textures.set(key, canvas);
		}
	}

	return { textures, width, height };
}

/**
 * Register all rendered textures with Phaser's texture manager.
 * Call this from BootScene after rendering all entity sprites.
 */
export function registerTextures(
	textureManager: { addCanvas: (key: string, canvas: HTMLCanvasElement) => void },
	rendered: RenderedSprite,
): void {
	for (const [key, canvas] of rendered.textures) {
		textureManager.addCanvas(key, canvas);
	}
}
