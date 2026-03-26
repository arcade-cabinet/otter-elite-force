/**
 * TerrainLayer — renders the pre-painted terrain as Konva Images.
 *
 * The terrain is painted once per mission load (via useMemo on missionDef)
 * and displayed as non-interactive background images. Camera offset is
 * handled by the parent <Group> in GameCanvas.
 *
 * Large-map support: uses chunked rendering so each canvas stays within
 * browser limits (≤4096px). Small maps produce a single chunk.
 *
 * Performance: listening={false} disables hit detection on this layer.
 */

import { useMemo } from "react";
import { Image as KonvaImage, Layer } from "react-konva";
import type { MissionDef } from "@/entities/types";
import { paintTerrainChunks, type TerrainChunk } from "@/canvas/terrainPainter";

export interface TerrainLayerProps {
	/** The mission definition whose terrain should be rendered. */
	missionDef: MissionDef;
}

/**
 * Renders the mission terrain as one or more non-interactive Konva Images.
 *
 * For small maps (≤128 tiles per axis) a single image is rendered.
 * For larger maps the terrain is split into chunks, each positioned
 * at its world-space offset.
 *
 * The terrain chunks are painted once when the missionDef changes (not every frame).
 * The parent Group in GameCanvas offsets this layer by camera position.
 */
export function TerrainLayer({ missionDef }: TerrainLayerProps) {
	const chunks: TerrainChunk[] = useMemo(
		() => paintTerrainChunks(missionDef),
		[missionDef],
	);

	return (
		<Layer listening={false}>
			{chunks.map((chunk, i) => (
				<KonvaImage
					key={`terrain-chunk-${i}`}
					image={chunk.canvas}
					x={chunk.x}
					y={chunk.y}
					listening={false}
				/>
			))}
		</Layer>
	);
}

