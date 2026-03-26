/**
 * OverlayLayer — visual overlays rendered above entities.
 *
 * Responsibilities:
 * - Selection box: green translucent rect during drag-select
 * - Placement ghost: semi-transparent building tile following cursor with validity tint
 *
 * Day/night cycle REMOVED — classic RTS keeps the battlefield bright and readable.
 * Weather particles REMOVED — weather is expressed through terrain, dialogue,
 * and gameplay modifiers (vision/accuracy/speed), not visual noise.
 *
 * All overlays are pointer-events-none (listening={false} on the Layer).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Circle, Group, Layer, Rect } from "react-konva";
import { EventBus } from "@/game/EventBus";

// ─── Constants ───

/** Grid cell size in pixels — consistent with other canvas layers. */
const CELL_SIZE = 32;

// ─── Props ───

export interface DragSelectState {
	active: boolean;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

export interface PlacementGhostState {
	active: boolean;
	tileX: number;
	tileY: number;
	valid: boolean;
}

export interface OverlayLayerProps {
	width: number;
	height: number;
	camX: number;
	camY: number;
	dragSelect?: DragSelectState | null;
	placementGhost?: PlacementGhostState | null;
}

// ─── Component ───

/**
 * Renders selection box and placement ghost above the game entities.
 */
interface CommandMarker {
	id: number;
	x: number;
	y: number;
	color: string;
}

let markerIdCounter = 0;

export function OverlayLayer({
	camX,
	camY,
	dragSelect,
	placementGhost,
}: Readonly<OverlayLayerProps>) {
	// Command markers — brief green/red circles at click point
	const [markers, setMarkers] = useState<CommandMarker[]>([]);

	const addMarker = useCallback((data: { x: number; y: number; color?: string }) => {
		const id = ++markerIdCounter;
		const color = data.color === "red" ? "#ef4444" : "#22c55e";
		setMarkers((prev) => [...prev.slice(-4), { id, x: data.x, y: data.y, color }]);
		window.setTimeout(() => {
			setMarkers((prev) => prev.filter((m) => m.id !== id));
		}, 600);
	}, []);

	useEffect(() => {
		EventBus.on("command-marker", addMarker);
		return () => {
			EventBus.off("command-marker", addMarker);
		};
	}, [addMarker]);

	// Selection box rect (screen-space)
	const selBox = useMemo(() => {
		if (!dragSelect?.active) return null;
		const x = Math.min(dragSelect.startX, dragSelect.endX);
		const y = Math.min(dragSelect.startY, dragSelect.endY);
		const w = Math.abs(dragSelect.endX - dragSelect.startX);
		const h = Math.abs(dragSelect.endY - dragSelect.startY);
		return { x, y, w, h };
	}, [dragSelect]);

	// Placement ghost position (world → screen)
	const ghost = useMemo(() => {
		if (!placementGhost?.active) return null;
		return {
			x: placementGhost.tileX * CELL_SIZE - camX,
			y: placementGhost.tileY * CELL_SIZE - camY,
			fill: placementGhost.valid ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)",
			stroke: placementGhost.valid ? "#22c55e" : "#ef4444",
		};
	}, [placementGhost, camX, camY]);

	return (
		<Layer listening={false}>
			{/* Selection box */}
			{selBox && (
				<Rect
					x={selBox.x}
					y={selBox.y}
					width={selBox.w}
					height={selBox.h}
					fill="rgba(34,197,94,0.2)"
					stroke="#22c55e"
					strokeWidth={2}
					listening={false}
				/>
			)}

			{/* Placement ghost */}
			{ghost && (
				<Group listening={false}>
					<Rect
						x={ghost.x}
						y={ghost.y}
						width={CELL_SIZE}
						height={CELL_SIZE}
						fill={ghost.fill}
						stroke={ghost.stroke}
						strokeWidth={2}
						listening={false}
					/>
				</Group>
			)}

			{/* Command markers — brief circles at click point */}
			{markers.map((m) => (
				<Circle
					key={m.id}
					x={m.x * CELL_SIZE - camX + CELL_SIZE / 2}
					y={m.y * CELL_SIZE - camY + CELL_SIZE / 2}
					radius={12}
					fill={`${m.color}40`}
					stroke={m.color}
					strokeWidth={2}
					listening={false}
				/>
			))}
		</Layer>
	);
}
