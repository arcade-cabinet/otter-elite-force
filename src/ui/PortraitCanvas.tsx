/**
 * PortraitCanvas — renders a character portrait from the procedural renderer.
 *
 * Displays the portrait at the specified size with nearest-neighbor scaling
 * for crisp pixel art. Used in MainMenu, BriefingDialogue, and GameLayout.
 */

import { useEffect, useRef } from "react";
import { getPortraitCanvas } from "@/canvas/portraitRenderer";

export interface PortraitCanvasProps {
	portraitId: string;
	/** Display size in CSS pixels (the canvas renders at 128x128 native). */
	size?: number;
	className?: string;
}

export function PortraitCanvas({ portraitId, size = 128, className }: PortraitCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const portrait = getPortraitCanvas(portraitId);
		if (!portrait) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(portrait, 0, 0, canvas.width, canvas.height);
	}, [portraitId]);

	return (
		<canvas
			ref={canvasRef}
			width={size}
			height={size}
			className={className}
			style={{
				width: size,
				height: size,
				imageRendering: "pixelated",
				display: "block",
			}}
		/>
	);
}
