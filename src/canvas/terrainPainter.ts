// src/canvas/terrainPainter.ts
// Procedural terrain painter — renders a MissionDef's terrain as a continuous
// canvas background at 32 px per tile (no tile-grid seams).
//
// Delegates to the existing paintMap() in src/entities/terrain/map-painter.ts
// which already implements the POC's buildMap() pattern (fill base → regions → overrides).

import type { MissionDef } from "@/entities/types";
import { paintMap } from "@/entities/terrain/map-painter";

/** Fixed tile size for the terrain canvas (matches spec §8.1). */
export const TERRAIN_TILE_SIZE = 32;

/**
 * Paint the terrain described by a MissionDef onto an offscreen canvas.
 *
 * Output dimensions: `terrain.width * 32` × `terrain.height * 32`.
 *
 * @param missionDef - Full mission definition; only `.terrain` is read.
 * @returns An `HTMLCanvasElement` with the painted terrain background.
 */
export function paintTerrain(missionDef: MissionDef): HTMLCanvasElement {
	return paintMap(missionDef.terrain, TERRAIN_TILE_SIZE);
}

