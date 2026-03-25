import { useTrait, useWorld } from "koota/react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceNode } from "@/ecs/traits/economy";
import { Faction, IsBuilding, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { CurrentMission } from "@/ecs/traits/state";
import { getMissionById } from "@/entities/missions";
import { EventBus } from "@/game/EventBus";
import { PanelFrame } from "@/ui/hud/PanelFrame";
import { cn } from "@/ui/lib/utils";

const TILE_SIZE = 32;
const CANVAS_SIZE = 160;

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

			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
			ctx.fillStyle = "#08110b";
			ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
			ctx.strokeStyle = "rgba(94,234,212,0.35)";
			ctx.lineWidth = 1;
			ctx.strokeRect(0.5, 0.5, CANVAS_SIZE - 1, CANVAS_SIZE - 1);

			ctx.strokeStyle = "rgba(94,234,212,0.12)";
			for (let i = 1; i < 4; i++) {
				const offset = (CANVAS_SIZE / 4) * i;
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

			world.query(Position, UnitType).forEach((entity) => {
				const pos = entity.get(Position);
				if (!pos) return;

				const faction = entity.get(Faction)?.id ?? "neutral";
				const isBuilding = entity.has(IsBuilding);
				const isResource = entity.has(IsResource) || entity.has(ResourceNode);
				const selected = entity.has(Selected);

				ctx.fillStyle = isResource
					? "#eab308"
					: faction === "ura"
						? "#5eead4"
						: faction === "scale_guard"
							? "#ef4444"
							: "#cbd5e1";

				const x = pos.x * scaleX;
				const y = pos.y * scaleY;
				const size = isBuilding ? 4 : 3;

				ctx.fillRect(x, y, size, size);
				if (selected) {
					ctx.strokeStyle = "#fef08a";
					ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
				}
			});

			const camera = sceneRef.current?.cameras.main;
			if (camera) {
				ctx.strokeStyle = "rgba(254,240,138,0.9)";
				ctx.lineWidth = 1.5;
				ctx.strokeRect(
					(camera.worldView.x / TILE_SIZE) * scaleX,
					(camera.worldView.y / TILE_SIZE) * scaleY,
					(camera.worldView.width / TILE_SIZE) * scaleX,
					(camera.worldView.height / TILE_SIZE) * scaleY,
				);
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
				"w-full overflow-hidden",
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "border-accent/18 bg-card/88",
				compact ? "max-w-36" : "max-w-38 sm:max-w-48",
			)}
		>
			<CardContent
				className={cn(compact ? "p-0" : "p-0", !embedded && (compact ? "p-2" : "p-2.5"))}
			>
				<div className="mb-2 flex items-center justify-between gap-2">
					<Badge variant="accent">RADAR</Badge>
					<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
						LIVE FEED
					</span>
				</div>
				<div
					className={cn(
						"relative overflow-hidden rounded-md border border-border bg-background shadow-[inset_0_0_24px_rgba(0,255,65,0.08)]",
						compact ? "h-28" : "h-32 sm:h-40",
					)}
				>
					<canvas ref={canvasRef} className="block h-full w-full" />
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,0.35)_100%)]" />
					<div className="radar-sweep pointer-events-none absolute inset-y-0 right-1/2 w-20 bg-[linear-gradient(90deg,rgba(138,255,156,0),rgba(138,255,156,0.16),rgba(138,255,156,0))]" />
					<div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(138,255,156,0.04)_0,rgba(138,255,156,0.04)_1px,transparent_1px,transparent_4px)] opacity-60" />
					<div className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] uppercase tracking-[0.25em] text-accent/60">
						Tactical Scope
					</div>
				</div>
				<div className="mt-2 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
					<span className="inline-flex items-center gap-1">
						<span className="h-1.5 w-1.5 rounded-full bg-accent" /> OEF
					</span>
					<span className="inline-flex items-center gap-1">
						<span className="h-1.5 w-1.5 rounded-full bg-destructive" /> HOSTILE
					</span>
				</div>
			</CardContent>
		</Card>
	);

	return embedded ? card : <PanelFrame>{card}</PanelFrame>;
}
