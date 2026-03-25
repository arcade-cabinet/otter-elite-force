/**
 * ReconPhoto — Surveillance-style recon photograph for mission briefings (US-077).
 *
 * Each mission briefing includes a "recon photo" rendered as a greyscale image
 * with film-grain noise filter, surveillance camera aesthetic (timestamp,
 * coordinate overlay, vignette), "TOP SECRET" red stamp at an angle, and
 * the commander's pawprint signature.
 *
 * Since we have no real terrain images, the component renders a procedural
 * terrain map from mission data (regions rendered as colored blocks) and applies
 * greyscale + grain filters to achieve the surveillance look.
 */

import { useEffect, useMemo, useRef } from "react";
import type { MissionDef, TerrainRegion } from "@/entities/types";
import { cn } from "@/ui/lib/utils";

interface ReconPhotoProps {
	/** Mission definition — terrain is used to generate the recon image */
	mission: MissionDef;
	/** Optional CSS class */
	className?: string;
	/** Whether to show the TOP SECRET stamp (default: true) */
	showStamp?: boolean;
	/** Commander name for signature block */
	commanderName?: string;
}

/** Terrain type -> greyscale tone for the recon photo. */
const TERRAIN_TONES: Record<string, string> = {
	grass: "#5a5a5a",
	water: "#2a2a2a",
	beach: "#8a8a8a",
	marsh: "#3f3f3f",
	mud: "#4d4d4d",
	forest: "#383838",
	rock: "#6e6e6e",
	bridge: "#7a7a7a",
	road: "#666666",
	wall: "#999999",
	building: "#aaaaaa",
};

const DEFAULT_TONE = "#555555";

/**
 * Render the mission terrain as a greyscale surveillance photo onto a canvas.
 */
function drawReconTerrain(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	terrainWidth: number,
	terrainHeight: number,
	regions: TerrainRegion[],
) {
	const scaleX = width / terrainWidth;
	const scaleY = height / terrainHeight;

	// Base fill (default terrain)
	ctx.fillStyle = DEFAULT_TONE;
	ctx.fillRect(0, 0, width, height);

	for (const region of regions) {
		const tone = TERRAIN_TONES[region.terrainId] ?? DEFAULT_TONE;
		ctx.fillStyle = tone;

		if (region.fill) {
			ctx.fillRect(0, 0, width, height);
		} else if (region.rect) {
			ctx.fillRect(
				region.rect.x * scaleX,
				region.rect.y * scaleY,
				region.rect.w * scaleX,
				region.rect.h * scaleY,
			);
		} else if (region.circle) {
			ctx.beginPath();
			ctx.arc(
				region.circle.cx * scaleX,
				region.circle.cy * scaleY,
				region.circle.r * Math.min(scaleX, scaleY),
				0,
				Math.PI * 2,
			);
			ctx.fill();
		} else if (region.river) {
			ctx.strokeStyle = tone;
			ctx.lineWidth = (region.river.width ?? 3) * Math.min(scaleX, scaleY);
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.beginPath();
			for (let i = 0; i < region.river.points.length; i++) {
				const [px, py] = region.river.points[i];
				if (i === 0) {
					ctx.moveTo(px * scaleX, py * scaleY);
				} else {
					ctx.lineTo(px * scaleX, py * scaleY);
				}
			}
			ctx.stroke();
		}
	}

	// Film grain noise overlay
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const noise = (Math.random() - 0.5) * 30;
		data[i] = Math.max(0, Math.min(255, data[i] + noise));
		data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
		data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
	}
	ctx.putImageData(imageData, 0, 0);
}

export function ReconPhoto({
	mission,
	className,
	showStamp = true,
	commanderName = "CDR. LUTRA",
}: ReconPhotoProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const canvasWidth = 320;
	const canvasHeight = 220;

	const timestamp = useMemo(() => {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio ?? 1;
		canvas.width = canvasWidth * dpr;
		canvas.height = canvasHeight * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		drawReconTerrain(
			ctx,
			canvasWidth,
			canvasHeight,
			mission.terrain.width,
			mission.terrain.height,
			mission.terrain.regions,
		);

		// Surveillance camera timestamp
		ctx.fillStyle = "rgba(200,200,200,0.7)";
		ctx.font = '10px "Share Tech Mono", monospace';
		ctx.fillText(`RCN-${mission.id.toUpperCase()} ${timestamp}`, 6, 14);

		// Grid coordinates
		ctx.fillText(`${mission.terrain.width}x${mission.terrain.height} TILES`, 6, canvasHeight - 8);

		// Crosshair at center
		ctx.strokeStyle = "rgba(200,200,200,0.3)";
		ctx.lineWidth = 0.5;
		const cx = canvasWidth / 2;
		const cy = canvasHeight / 2;
		ctx.beginPath();
		ctx.moveTo(cx - 12, cy);
		ctx.lineTo(cx + 12, cy);
		ctx.moveTo(cx, cy - 12);
		ctx.lineTo(cx, cy + 12);
		ctx.stroke();
	}, [mission, timestamp]);

	return (
		<div
			data-testid="recon-photo"
			className={cn(
				"recon-photo relative overflow-hidden rounded-sm border border-steel-600/60",
				className,
			)}
		>
			{/* Greyscale canvas */}
			<canvas
				ref={canvasRef}
				style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
				className="block w-full grayscale"
			/>

			{/* Vignette overlay */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

			{/* Scanline overlay */}
			<div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)] opacity-60" />

			{/* TOP SECRET stamp (US-077) */}
			{showStamp ? (
				<div
					className="pointer-events-none absolute right-3 top-3 rotate-[-12deg] rounded border-2 border-red-700/70 px-3 py-1 font-heading text-[11px] uppercase tracking-[0.28em] text-red-700/80"
					aria-hidden="true"
				>
					TOP SECRET
				</div>
			) : null}

			{/* Commander's pawprint signature (US-077) */}
			<div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5">
				<span className="font-mono text-[8px] uppercase tracking-[0.2em] text-khaki-300/50">
					{commanderName}
				</span>
				<ReconPawprint />
			</div>

			{/* Corner brackets — surveillance camera feel */}
			<CornerMark position="tl" />
			<CornerMark position="tr" />
			<CornerMark position="bl" />
			<CornerMark position="br" />
		</div>
	);
}

function ReconPawprint() {
	return (
		<svg aria-hidden="true" viewBox="0 0 40 44" className="h-5 w-5 opacity-35" fill="none">
			<ellipse cx="20" cy="28" rx="9" ry="10" fill="#6b3a26" opacity="0.7" />
			<ellipse cx="11" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
			<ellipse cx="20" cy="11" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
			<ellipse cx="29" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
		</svg>
	);
}

function CornerMark({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
	const isTop = position === "tl" || position === "tr";
	const isLeft = position === "tl" || position === "bl";
	const arm = 10;
	const inset = 4;

	return (
		<div
			className="pointer-events-none absolute"
			style={{
				width: `${arm}px`,
				height: `${arm}px`,
				...(isTop ? { top: `${inset}px` } : { bottom: `${inset}px` }),
				...(isLeft ? { left: `${inset}px` } : { right: `${inset}px` }),
				borderColor: "rgba(200,200,200,0.3)",
				borderStyle: "solid",
				borderWidth: 0,
				...(isTop ? { borderTopWidth: "1px" } : { borderBottomWidth: "1px" }),
				...(isLeft ? { borderLeftWidth: "1px" } : { borderRightWidth: "1px" }),
			}}
		/>
	);
}
