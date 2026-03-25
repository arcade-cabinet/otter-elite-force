/**
 * Minimap — Phosphor-green CRT-styled radar minimap (US-037).
 *
 * Dark background with phosphor-green (#00ff41) border glow,
 * CRT scanlines/grid overlay at 5-10% opacity, color-coded unit pips
 * (green = friendly, red = enemy), camera viewport rectangle in brighter
 * green, and optional radar sweep animation.
 */

import { useTrait, useWorld } from "koota/react";
import { useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceNode } from "@/ecs/traits/economy";
import { Faction, IsBuilding, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { CurrentMission } from "@/ecs/traits/state";
import { getMissionById } from "@/entities/missions";
import { EventBus } from "@/game/EventBus";
import { clampCameraScroll, minimapToWorld } from "@/input/minimapInput";
import { PanelFrame } from "@/ui/hud/PanelFrame";
import { cn } from "@/ui/lib/utils";

const TILE_SIZE = 32;
const CANVAS_SIZE = 160;

/** US-037 phosphor-green CRT palette */
const CRT_BG = "#050e05";
const CRT_BORDER = "#00ff41";
const CRT_GRID = "rgba(0,255,65,0.07)";
const CRT_FRIENDLY = "#00ff41";
const CRT_ENEMY = "#ef4444";
const CRT_RESOURCE = "#eab308";
const CRT_NEUTRAL = "#486848";
const CRT_SELECTED = "#88ff88";
const CRT_VIEWPORT = "#00ff41";

export function Minimap({
	compact = false,
	embedded = false,
}: {
	compact?: boolean;
	embedded?: boolean;
}) {
	const world = useWorld();
	const currentMission = useTrait(world, CurrentMission);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Phaser.Scene | null>(null);
	/** Track whether the user is dragging on the minimap. */
	const isDraggingRef = useRef(false);
	/** Cached world dimensions (tiles) for pointer handlers. */
	const worldDimsRef = useRef({ w: 1, h: 1 });

	useEffect(() => {
		const onSceneReady = (scene: Phaser.Scene) => {
			if (scene.scene.key === "Game") {
				sceneRef.current = scene;
			}
		};

		EventBus.on("current-scene-ready", onSceneReady);
		return () => {
			EventBus.off("current-scene-ready", onSceneReady);
		};
	}, []);

	// ------------------------------------------------------------------
	// Minimap click/drag -> camera positioning
	// ------------------------------------------------------------------

	const moveCameraToCanvasPos = useCallback((clientX: number, clientY: number) => {
		const canvas = canvasRef.current;
		const scene = sceneRef.current;
		if (!canvas || !scene) return;

		const rect = canvas.getBoundingClientRect();
		const canvasX = clientX - rect.left;
		const canvasY = clientY - rect.top;

		const camera = scene.cameras.main;
		const dims = {
			canvasWidth: rect.width,
			canvasHeight: rect.height,
			worldTilesW: worldDimsRef.current.w,
			worldTilesH: worldDimsRef.current.h,
		};

		const target = minimapToWorld(canvasX, canvasY, dims, camera.width, camera.height);

		const bounds = camera.getBounds();
		const clamped = clampCameraScroll(
			target,
			bounds.width,
			bounds.height,
			camera.width,
			camera.height,
		);

		camera.scrollX = clamped.scrollX;
		camera.scrollY = clamped.scrollY;
	}, []);

	const onPointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			isDraggingRef.current = true;
			(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
			moveCameraToCanvasPos(e.clientX, e.clientY);
		},
		[moveCameraToCanvasPos],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!isDraggingRef.current) return;
			moveCameraToCanvasPos(e.clientX, e.clientY);
		},
		[moveCameraToCanvasPos],
	);

	const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
		isDraggingRef.current = false;
		(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
	}, []);

	// ------------------------------------------------------------------
	// Render loop — draws terrain bg, unit/building pips, camera rect
	// ------------------------------------------------------------------

	useEffect(() => {
		let frameId = 0;

		const draw = () => {
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			if (!canvas || !ctx) {
				frameId = requestAnimationFrame(draw);
				return;
			}

			const dpr = window.devicePixelRatio ?? 1;
			if (canvas.width !== CANVAS_SIZE * dpr || canvas.height !== CANVAS_SIZE * dpr) {
				canvas.width = CANVAS_SIZE * dpr;
				canvas.height = CANVAS_SIZE * dpr;
				canvas.style.width = `${CANVAS_SIZE}px`;
				canvas.style.height = `${CANVAS_SIZE}px`;
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			}

			const mission = getMissionById(currentMission?.missionId ?? "mission_1");
			let worldWidth = mission?.terrain.width ?? 1;
			let worldHeight = mission?.terrain.height ?? 1;

			world.query(Position).forEach((entity) => {
				const pos = entity.get(Position);
				if (!pos) return;
				worldWidth = Math.max(worldWidth, pos.x + 2);
				worldHeight = Math.max(worldHeight, pos.y + 2);
			});

			// Cache for pointer handlers
			worldDimsRef.current = { w: worldWidth, h: worldHeight };

			// US-037: Dark CRT background
			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
			ctx.fillStyle = CRT_BG;
			ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

			// US-037: Phosphor-green border
			ctx.strokeStyle = CRT_BORDER;
			ctx.lineWidth = 1.5;
			ctx.strokeRect(0.5, 0.5, CANVAS_SIZE - 1, CANVAS_SIZE - 1);

			// US-037: CRT grid overlay (5-10% opacity)
			ctx.strokeStyle = CRT_GRID;
			ctx.lineWidth = 0.5;
			for (let i = 1; i < 8; i++) {
				const offset = (CANVAS_SIZE / 8) * i;
				ctx.beginPath();
				ctx.moveTo(offset, 0);
				ctx.lineTo(offset, CANVAS_SIZE);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(0, offset);
				ctx.lineTo(CANVAS_SIZE, offset);
				ctx.stroke();
			}

			const scaleX = CANVAS_SIZE / Math.max(1, worldWidth);
			const scaleY = CANVAS_SIZE / Math.max(1, worldHeight);

			// US-037: Color-coded unit pips — green (friendly), red (enemy)
			world.query(Position, UnitType).forEach((entity) => {
				const pos = entity.get(Position);
				if (!pos) return;

				const faction = entity.get(Faction)?.id ?? "neutral";
				const isBuilding = entity.has(IsBuilding);
				const isResource = entity.has(IsResource) || entity.has(ResourceNode);
				const selected = entity.has(Selected);

				ctx.fillStyle = isResource
					? CRT_RESOURCE
					: faction === "ura"
						? CRT_FRIENDLY
						: faction === "scale_guard"
							? CRT_ENEMY
							: CRT_NEUTRAL;

				const x = pos.x * scaleX;
				const y = pos.y * scaleY;
				const size = isBuilding ? 4 : 3;

				ctx.fillRect(x, y, size, size);
				if (selected) {
					ctx.strokeStyle = CRT_SELECTED;
					ctx.lineWidth = 1;
					ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
				}
			});

			// US-037: Camera viewport rectangle in brighter phosphor-green
			const camera = sceneRef.current?.cameras.main;
			if (camera) {
				ctx.strokeStyle = CRT_VIEWPORT;
				ctx.lineWidth = 1.5;
				ctx.globalAlpha = 0.9;
				ctx.strokeRect(
					(camera.worldView.x / TILE_SIZE) * scaleX,
					(camera.worldView.y / TILE_SIZE) * scaleY,
					(camera.worldView.width / TILE_SIZE) * scaleX,
					(camera.worldView.height / TILE_SIZE) * scaleY,
				);
				ctx.globalAlpha = 1;
			}

			// US-037: CRT scanlines drawn directly on canvas (~8% opacity)
			ctx.fillStyle = "rgba(0,0,0,0.08)";
			for (let y = 0; y < CANVAS_SIZE; y += 3) {
				ctx.fillRect(0, y, CANVAS_SIZE, 1);
			}

			frameId = requestAnimationFrame(draw);
		};

		frameId = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(frameId);
	}, [currentMission?.missionId, world]);

	const card = (
		<Card
			data-testid="minimap"
			className={cn(
				"minimap-crt w-full overflow-hidden",
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "border-[#00ff41]/25 bg-card/88",
				compact ? "max-w-36" : "max-w-38 sm:max-w-48",
			)}
		>
			<CardContent
				className={cn(compact ? "p-0" : "p-0", !embedded && (compact ? "p-2" : "p-2.5"))}
			>
				<div className="mb-2 flex items-center justify-between gap-2">
					<Badge variant="accent">RADAR</Badge>
					<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00ff41]/70">
						LIVE FEED
					</span>
				</div>
				<div
					className={cn(
						"minimap-crt-screen relative overflow-hidden rounded-md border border-[#00ff41]/30 bg-[#050e05] shadow-[inset_0_0_24px_rgba(0,255,65,0.12),0_0_12px_rgba(0,255,65,0.15)]",
						compact ? "h-28" : "h-32 sm:h-40",
					)}
				>
					<canvas
						ref={canvasRef}
						className="block h-full w-full cursor-crosshair"
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onPointerCancel={onPointerUp}
					/>
					{/* US-037: CRT vignette — darker corners */}
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,0.45)_100%)]" />
					{/* US-037: Radar sweep animation */}
					<div className="radar-sweep pointer-events-none absolute inset-y-0 right-1/2 w-20 bg-[linear-gradient(90deg,rgba(0,255,65,0),rgba(0,255,65,0.18),rgba(0,255,65,0))]" />
					{/* US-037: CRT scanline overlay (CSS, 5-10% opacity) */}
					<div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(0,255,65,0.05)_0,rgba(0,255,65,0.05)_1px,transparent_1px,transparent_3px)] opacity-70" />
					<div className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] uppercase tracking-[0.25em] text-[#00ff41]/50">
						Tactical Scope
					</div>
				</div>
				<div className="mt-2 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
					<span className="inline-flex items-center gap-1">
						<span className="h-1.5 w-1.5 rounded-full bg-[#00ff41]" /> OEF
					</span>
					<span className="inline-flex items-center gap-1">
						<span className="h-1.5 w-1.5 rounded-full bg-destructive" /> HOSTILE
					</span>
					<span className="inline-flex items-center gap-1">
						<span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" /> RES
					</span>
				</div>
			</CardContent>
		</Card>
	);

	return embedded ? card : <PanelFrame>{card}</PanelFrame>;
}
