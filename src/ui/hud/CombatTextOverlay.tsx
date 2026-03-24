import { useEffect, useRef, useState } from "react";
import { useWorld } from "koota/react";
import { ResourceNode } from "@/ecs/traits/economy";
import { IsBuilding, UnitType } from "@/ecs/traits/identity";
import { Health } from "@/ecs/traits/combat";
import { Position } from "@/ecs/traits/spatial";
import { ResourcePool } from "@/ecs/traits/state";
import { EventBus } from "@/game/EventBus";

const TILE_SIZE = 32;
const FLOAT_LIFETIME_MS = 900;

interface Floater {
	id: number;
	text: string;
	color: string;
	worldX: number;
	worldY: number;
	createdAt: number;
}

export function CombatTextOverlay() {
	const world = useWorld();
	const sceneRef = useRef<Phaser.Scene | null>(null);
	const previousHealth = useRef(new Map<number, number>());
	const previousResources = useRef(new Map<number, number>());
	const previousPool = useRef<{ fish: number; timber: number; salvage: number } | null>(null);
	const floatersRef = useRef<Floater[]>([]);
	const [floaters, setFloaters] = useState<Floater[]>([]);
	const floaterId = useRef(0);

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

		const spawnFloater = (text: string, color: string, worldX: number, worldY: number) => {
			floatersRef.current.push({
				id: floaterId.current++,
				text,
				color,
				worldX,
				worldY,
				createdAt: performance.now(),
			});
		};

		const tick = () => {
			const now = performance.now();
			const seenHealth = new Set<number>();
			const seenResources = new Set<number>();

			world.query(Position, Health).forEach((entity) => {
				const pos = entity.get(Position);
				const health = entity.get(Health);
				if (!pos || !health) return;

				const id = Number(entity);
				seenHealth.add(id);
				const previous = previousHealth.current.get(id);
				if (previous != null && previous !== health.current) {
					const delta = Math.round(health.current - previous);
					if (delta !== 0) {
						spawnFloater(
							`${delta > 0 ? "+" : ""}${delta} HP`,
							delta > 0 ? "#5eead4" : "#f87171",
							pos.x,
							pos.y,
						);
					}
				}
				previousHealth.current.set(id, health.current);
			});

			for (const id of previousHealth.current.keys()) {
				if (!seenHealth.has(id)) {
					previousHealth.current.delete(id);
				}
			}

			world.query(Position, ResourceNode).forEach((entity) => {
				const pos = entity.get(Position);
				const node = entity.get(ResourceNode);
				if (!pos || !node) return;

				const id = Number(entity);
				seenResources.add(id);
				const previous = previousResources.current.get(id);
				if (previous != null && previous > node.remaining) {
					const harvested = Math.round(previous - node.remaining);
					if (harvested > 0) {
						spawnFloater(`-${harvested} ${node.type.toUpperCase()}`, "#facc15", pos.x, pos.y);
					}
				}
				previousResources.current.set(id, node.remaining);
			});

			for (const id of previousResources.current.keys()) {
				if (!seenResources.has(id)) {
					previousResources.current.delete(id);
				}
			}

			const pool = world.get(ResourcePool);
			if (pool) {
				const previous = previousPool.current;
				if (previous) {
					const deltas: Array<[keyof typeof pool, number]> = [
						["fish", pool.fish - previous.fish],
						["timber", pool.timber - previous.timber],
						["salvage", pool.salvage - previous.salvage],
					];

					let commandPostX = 1;
					let commandPostY = 1;
					world.query(Position, UnitType).forEach((entity) => {
						if (commandPostX !== 1 || commandPostY !== 1) return;
						const unitType = entity.get(UnitType);
						const pos = entity.get(Position);
						if (unitType?.type === "command_post" && pos && entity.has(IsBuilding)) {
							commandPostX = pos.x;
							commandPostY = pos.y;
						}
					});

					for (const [resource, delta] of deltas) {
						if (delta > 0) {
							spawnFloater(
								`+${delta} ${resource.toUpperCase()}`,
								"#fde047",
								commandPostX,
								commandPostY,
							);
						}
					}
				}

				previousPool.current = { fish: pool.fish, timber: pool.timber, salvage: pool.salvage };
			}

			floatersRef.current = floatersRef.current.filter(
				(floater) => now - floater.createdAt < FLOAT_LIFETIME_MS,
			);
			setFloaters([...floatersRef.current]);
			frameId = requestAnimationFrame(tick);
		};

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	}, [world]);

	const camera = sceneRef.current?.cameras.main;

	return (
		<div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
			{floaters.map((floater) => {
				if (!camera) return null;
				const age = performance.now() - floater.createdAt;
				const progress = age / FLOAT_LIFETIME_MS;
				const screenX = (floater.worldX * TILE_SIZE - camera.worldView.x) * camera.zoom;
				const screenY = (floater.worldY * TILE_SIZE - camera.worldView.y) * camera.zoom;

				if (
					screenX < -32 ||
					screenY < -32 ||
					screenX > camera.width + 32 ||
					screenY > camera.height + 32
				) {
					return null;
				}

				return (
					<div
						key={floater.id}
						className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-xs font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
						style={{
							left: screenX + TILE_SIZE / 2,
							top: screenY - progress * 28,
							color: floater.color,
							opacity: Math.max(0, 1 - progress),
						}}
					>
						{floater.text}
					</div>
				);
			})}
		</div>
	);
}
