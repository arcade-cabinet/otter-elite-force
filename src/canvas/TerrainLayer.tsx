/**
 * TerrainLayer — renders the pre-painted terrain canvas as a single Konva Image.
 *
 * The terrain is painted once per mission load (via useMemo on missionDef)
 * and displayed as a non-interactive background image. Camera offset is
 * handled by the parent <Group> in GameCanvas.
 *
 * Performance: listening={false} disables hit detection on this layer.
 */

import { useMemo } from "react";
import { Image as KonvaImage, Layer } from "react-konva";
import type { MissionDef } from "@/entities/types";
import { paintTerrain } from "@/canvas/terrainPainter";

export interface TerrainLayerProps {
	/** The mission definition whose terrain should be rendered. */
	missionDef: MissionDef;
}

/**
 * Renders the mission terrain as a single non-interactive Konva Image.
 *
 * The terrain canvas is painted once when the missionDef changes (not every frame).
 * The parent Group in GameCanvas offsets this layer by camera position.
 */
export function TerrainLayer({ missionDef }: TerrainLayerProps) {
	const terrainCanvas = useMemo(
		() => paintTerrain(missionDef),
		[missionDef],
	);

	return (
		<Layer listening={false}>
			<KonvaImage image={terrainCanvas} x={0} y={0} listening={false} />
		</Layer>
	);
}

