/**
 * Sprite renderer — draws entity sprites from atlas data on a Canvas2D context.
 *
 * Uses the spriteAtlas system to resolve entity types to sprite frames, renders
 * them sorted by Y for depth, and draws selection circles, HP bars, and rank
 * emblems on top.
 */

import {
	atlasesLoaded,
	getEntityAnimFrame,
	getEntityFrameSize,
	getEntitySprite,
} from "@/canvas/spriteAtlas";
import { Faction, Flags, Health, Position, Selection } from "../world/components";
import type { GameWorld } from "../world/gameWorld";

/** Frames between animation ticks. At 60fps, 6 frames = ~100ms per sprite frame. */
const ANIM_FRAME_DURATION_MS = 100;

/** Faction colors used for selection circles and name overlays. */
const FACTION_COLORS: Record<number, string> = {
	1: "#22c55e", // OEF (player) — green
	2: "#ef4444", // Scale-Guard (enemy) — red
	0: "#cbd5e1", // neutral — slate
};

export interface SpriteRenderer {
	renderEntities(
		ctx: CanvasRenderingContext2D,
		camera: { x: number; y: number; zoom: number },
		viewport: { width: number; height: number },
		world: GameWorld,
		tick: number,
	): void;
}

/** Describes a single entity prepared for rendering, sorted by Y. */
interface RenderableEntity {
	eid: number;
	worldX: number;
	worldY: number;
	screenX: number;
	screenY: number;
	isBuilding: boolean;
	isResource: boolean;
	isSelected: boolean;
	factionId: number;
	healthRatio: number;
	entityType: string | undefined;
}

/**
 * Resolve the animation name for an entity based on its state.
 * For now we use "Idle" for stationary and "Walk" for moving entities.
 */
function resolveAnimation(eid: number): string {
	// Simple heuristic: if entity has velocity components set we could use "Walk"
	// For now, everything uses Idle — motion detection would need Velocity import
	void eid;
	return "Idle";
}

/**
 * Create a sprite renderer.
 *
 * The renderer checks if atlases are loaded and falls back to shape rendering
 * for entities without loaded sprites.
 */
export function createSpriteRenderer(): SpriteRenderer {
	function renderEntities(
		ctx: CanvasRenderingContext2D,
		camera: { x: number; y: number; zoom: number },
		viewport: { width: number; height: number },
		world: GameWorld,
		tick: number,
	): void {
		const spritesAvailable = atlasesLoaded();
		const elapsedMs = tick * 16.67; // approximate ms from tick count

		// Collect visible entities
		const renderables: RenderableEntity[] = [];

		for (const eid of world.runtime.alive) {
			const worldX = Position.x[eid];
			const worldY = Position.y[eid];
			const screenX = (worldX - camera.x) * camera.zoom;
			const screenY = (worldY - camera.y) * camera.zoom;

			// Cull entities outside viewport (with margin for sprite overhang)
			const margin = 64 * camera.zoom;
			if (
				screenX < -margin ||
				screenY < -margin ||
				screenX > viewport.width + margin ||
				screenY > viewport.height + margin
			) {
				continue;
			}

			const isBuilding = Flags.isBuilding[eid] === 1;
			const isResource = Flags.isResource[eid] === 1;
			const isSelected = Selection.selected[eid] === 1;
			const factionId = Faction.id[eid];
			const healthMax = Health.max[eid];
			const healthRatio = healthMax > 0 ? Health.current[eid] / healthMax : 1;
			const entityType = world.runtime.entityTypeIndex.get(eid);

			renderables.push({
				eid,
				worldX,
				worldY,
				screenX,
				screenY,
				isBuilding,
				isResource,
				isSelected,
				factionId,
				healthRatio,
				entityType,
			});
		}

		// Sort by Y (depth sorting — entities lower on screen render on top)
		renderables.sort((a, b) => a.worldY - b.worldY);

		for (const entity of renderables) {
			let drewSprite = false;

			if (spritesAvailable && entity.entityType) {
				// Try animated frame first
				const animName = resolveAnimation(entity.eid);
				const animFrame = getEntityAnimFrame(
					entity.entityType,
					animName,
					elapsedMs,
					ANIM_FRAME_DURATION_MS,
				);

				const frame = animFrame ?? getEntitySprite(entity.entityType);

				if (frame) {
					const size = getEntityFrameSize(entity.entityType);
					const frameW = (size?.w ?? frame.width) * camera.zoom;
					const frameH = (size?.h ?? frame.height) * camera.zoom;

					ctx.drawImage(
						frame,
						entity.screenX - frameW / 2,
						entity.screenY - frameH,
						frameW,
						frameH,
					);
					drewSprite = true;
				}
			}

			// Fallback to colored shapes if no sprite available
			if (!drewSprite) {
				drawShapeFallback(ctx, entity, camera.zoom);
			}

			// Selection circle
			if (entity.isSelected) {
				drawSelectionCircle(ctx, entity, camera.zoom);
			}

			// HP bar
			drawHpBar(ctx, entity, camera.zoom);
		}
	}

	return { renderEntities };
}

function drawShapeFallback(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
): void {
	ctx.fillStyle = entity.isResource ? "#facc15" : (FACTION_COLORS[entity.factionId] ?? "#cbd5e1");

	if (entity.isBuilding) {
		const size = 16 * zoom;
		ctx.fillRect(entity.screenX - size / 2, entity.screenY - size / 2, size, size);
	} else {
		ctx.beginPath();
		ctx.arc(entity.screenX, entity.screenY, Math.max(4, 6 * zoom), 0, Math.PI * 2);
		ctx.fill();
	}
}

function drawSelectionCircle(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
): void {
	ctx.strokeStyle = "#f8fafc";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(entity.screenX, entity.screenY, (entity.isBuilding ? 12 : 10) * zoom, 0, Math.PI * 2);
	ctx.stroke();
}

function drawHpBar(ctx: CanvasRenderingContext2D, entity: RenderableEntity, zoom: number): void {
	const barWidth = 20 * zoom;
	const barHeight = 3 * zoom;
	const barX = entity.screenX - barWidth / 2;
	const barY = entity.screenY - 14 * zoom;

	// Background
	ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
	ctx.fillRect(barX, barY, barWidth, barHeight);

	// Health fill
	const ratio = Math.max(0, Math.min(1, entity.healthRatio));
	ctx.fillStyle = ratio > 0.5 ? "#34d399" : ratio > 0.25 ? "#fbbf24" : "#ef4444";
	ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
}

/**
 * Resolve a sprite frame for a given entity type and animation tick.
 * Exported for testing purposes.
 */
export function resolveSpriteFrame(
	entityType: string,
	animName: string,
	elapsedMs: number,
	frameDurationMs: number = ANIM_FRAME_DURATION_MS,
): HTMLCanvasElement | undefined {
	return getEntityAnimFrame(entityType, animName, elapsedMs, frameDurationMs);
}
