// src/canvas/terrainPainter.ts
// Terrain painter — uses tile-based rendering from curated Kenney tiles,
// with procedural fallback if tiles haven't loaded yet.

import type { TerrainChunk } from "@/canvas/tilePainter";
import { paintTerrainChunked, paintTerrainMinimap, paintTerrainTiled } from "@/canvas/tilePainter";
import type { MissionDef } from "@/entities/types";

export type { TerrainChunk };

/** Fixed terrain cell size (matches spec §8.1). */
export const TERRAIN_CELL_SIZE = 32;

/**
 * Paint the terrain described by a MissionDef onto an offscreen canvas.
 * Uses tile-based rendering with auto-tile edge transitions and prop scatter.
 *
 * For maps ≤ 128 tiles per axis this returns a full-res canvas.
 * For larger maps the canvas is scaled down to fit within browser limits.
 * Use paintTerrainChunks() for the main game view on large maps.
 */
export function paintTerrain(missionDef: MissionDef): HTMLCanvasElement {
	return paintTerrainTiled(missionDef);
}

/**
 * Paint the terrain as an array of chunked canvases.
 * Each chunk stays within browser canvas limits (≤4096px per axis).
 * The tactical runtime should use this for rendering large maps.
 */
export function paintTerrainChunks(missionDef: MissionDef): TerrainChunk[] {
	return paintTerrainChunked(missionDef);
}

/**
 * Paint a low-resolution minimap canvas.
 * Always returns a single canvas regardless of map size.
 */
export function paintMinimapTerrain(missionDef: MissionDef): HTMLCanvasElement {
	return paintTerrainMinimap(missionDef);
}
