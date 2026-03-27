/**
 * Sprite renderer — draws entity sprites from atlas data on a Canvas2D context.
 *
 * Uses the spriteAtlas system to resolve entity types to sprite frames, renders
 * them sorted by Y for depth, and draws selection circles, HP bars, and rank
 * emblems on top.
 *
 * When sprites are not available, renders high-quality shape fallbacks:
 *   - Player units: bright green circles with white border
 *   - Enemy units: red circles with dark border
 *   - Buildings: large squares with faction color and dark border
 *   - Resource trees: tall green triangles
 *   - Fish spots: blue circles
 *   - Salvage caches: yellow diamonds
 *   - HP bars: color-coded (green > 75%, yellow 25-75%, red < 25%)
 *   - Selected: pulsing white selection ring
 *   - Labels: entity type text below each entity
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

/** Faction fill colors for units. */
const FACTION_FILL: Record<number, string> = {
	1: "#22c55e", // OEF (player) — green
	2: "#ef4444", // Scale-Guard (enemy) — red
	0: "#94a3b8", // neutral — slate
};

/** Faction border colors for units. */
const FACTION_STROKE: Record<number, string> = {
	1: "#f8fafc", // player — white border
	2: "#450a0a", // enemy — dark red border
	0: "#64748b", // neutral — darker slate border
};

/** Resource type -> distinct visual config. */
const RESOURCE_VISUALS: Record<
	string,
	{ shape: "triangle" | "circle" | "diamond"; fill: string; stroke: string; label: string }
> = {
	mangrove_tree: { shape: "triangle", fill: "#15803d", stroke: "#052e16", label: "Tree" },
	fish_spot: { shape: "circle", fill: "#0ea5e9", stroke: "#0c4a6e", label: "Fish" },
	salvage_cache: { shape: "diamond", fill: "#eab308", stroke: "#713f12", label: "Salvage" },
};

/** Default resource visual for unknown resource types. */
const DEFAULT_RESOURCE_VISUAL = {
	shape: "circle" as const,
	fill: "#facc15",
	stroke: "#854d0e",
	label: "Resource",
};

/** Human-readable labels for known building types. */
const BUILDING_LABELS: Record<string, string> = {
	burrow: "Lodge",
	command_post: "Command Post",
	barracks: "Barracks",
	watchtower: "Watchtower",
	fish_trap: "Fish Trap",
	sandbag_wall: "Wall",
	flag_post: "Flag Post",
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

			// Selection circle (pulsing)
			if (entity.isSelected) {
				drawSelectionCircle(ctx, entity, camera.zoom, elapsedMs);
			}

			// HP bar (skip for resources — they don't have meaningful HP)
			if (!entity.isResource) {
				drawHpBar(ctx, entity, camera.zoom);
			}

			// Entity label below
			drawEntityLabel(ctx, entity, camera.zoom);
		}
	}

	return { renderEntities };
}

function drawShapeFallback(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
): void {
	if (entity.isResource) {
		drawResourceShape(ctx, entity, zoom);
		return;
	}

	if (entity.isBuilding) {
		drawBuildingShape(ctx, entity, zoom);
		return;
	}

	// Unit circle with border
	const radius = Math.max(5, 8 * zoom);
	const fillColor = FACTION_FILL[entity.factionId] ?? FACTION_FILL[0];
	const strokeColor = FACTION_STROKE[entity.factionId] ?? FACTION_STROKE[0];

	ctx.beginPath();
	ctx.arc(entity.screenX, entity.screenY, radius, 0, Math.PI * 2);
	ctx.fillStyle = fillColor;
	ctx.fill();
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = Math.max(1.5, 2 * zoom);
	ctx.stroke();
}

function drawResourceShape(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
): void {
	const visual = RESOURCE_VISUALS[entity.entityType ?? ""] ?? DEFAULT_RESOURCE_VISUAL;
	const size = Math.max(8, 12 * zoom);

	ctx.fillStyle = visual.fill;
	ctx.strokeStyle = visual.stroke;
	ctx.lineWidth = Math.max(1.5, 2 * zoom);

	if (visual.shape === "triangle") {
		// Tall green triangle for trees
		const halfW = size * 0.7;
		const treeH = size * 1.6;
		ctx.beginPath();
		ctx.moveTo(entity.screenX, entity.screenY - treeH);
		ctx.lineTo(entity.screenX + halfW, entity.screenY);
		ctx.lineTo(entity.screenX - halfW, entity.screenY);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		// Trunk
		const trunkW = size * 0.2;
		const trunkH = size * 0.4;
		ctx.fillStyle = "#713f12";
		ctx.fillRect(entity.screenX - trunkW / 2, entity.screenY, trunkW, trunkH);
	} else if (visual.shape === "diamond") {
		// Diamond for salvage
		ctx.beginPath();
		ctx.moveTo(entity.screenX, entity.screenY - size);
		ctx.lineTo(entity.screenX + size * 0.6, entity.screenY);
		ctx.lineTo(entity.screenX, entity.screenY + size);
		ctx.lineTo(entity.screenX - size * 0.6, entity.screenY);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	} else {
		// Circle for fish spots
		ctx.beginPath();
		ctx.arc(entity.screenX, entity.screenY, size * 0.7, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();

		// Wave lines for fish
		ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
		ctx.lineWidth = Math.max(1, 1.5 * zoom);
		ctx.beginPath();
		const waveW = size * 0.4;
		ctx.moveTo(entity.screenX - waveW, entity.screenY - 2 * zoom);
		ctx.quadraticCurveTo(
			entity.screenX,
			entity.screenY - 5 * zoom,
			entity.screenX + waveW,
			entity.screenY - 2 * zoom,
		);
		ctx.stroke();
	}
}

function drawBuildingShape(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
): void {
	// Buildings render at 2x unit size
	const size = Math.max(12, 24 * zoom);
	const fillColor = FACTION_FILL[entity.factionId] ?? FACTION_FILL[0];
	const strokeColor = FACTION_STROKE[entity.factionId] ?? FACTION_STROKE[0];

	// Main building body
	ctx.fillStyle = fillColor;
	ctx.fillRect(entity.screenX - size / 2, entity.screenY - size / 2, size, size);

	// Dark border
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = Math.max(2, 3 * zoom);
	ctx.strokeRect(entity.screenX - size / 2, entity.screenY - size / 2, size, size);

	// Inner highlight for depth
	ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
	ctx.lineWidth = 1;
	const inner = size * 0.7;
	ctx.strokeRect(entity.screenX - inner / 2, entity.screenY - inner / 2, inner, inner);
}

function drawSelectionCircle(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
	elapsedMs: number,
): void {
	// Pulsing white selection ring
	const pulsePhase = Math.sin(elapsedMs * 0.005) * 0.3 + 0.7;
	const baseRadius = entity.isBuilding ? 18 : entity.isResource ? 14 : 12;
	const radius = baseRadius * zoom;

	ctx.strokeStyle = `rgba(248, 250, 252, ${pulsePhase})`;
	ctx.lineWidth = Math.max(2, 2.5 * zoom);
	ctx.beginPath();
	ctx.arc(entity.screenX, entity.screenY, radius, 0, Math.PI * 2);
	ctx.stroke();

	// Inner glow
	ctx.strokeStyle = `rgba(134, 239, 172, ${pulsePhase * 0.5})`;
	ctx.lineWidth = Math.max(1, 1.5 * zoom);
	ctx.beginPath();
	ctx.arc(entity.screenX, entity.screenY, radius + 2 * zoom, 0, Math.PI * 2);
	ctx.stroke();
}

function drawHpBar(ctx: CanvasRenderingContext2D, entity: RenderableEntity, zoom: number): void {
	const barWidth = (entity.isBuilding ? 28 : 20) * zoom;
	const barHeight = Math.max(2, 3 * zoom);
	const barX = entity.screenX - barWidth / 2;
	const barY = entity.screenY - (entity.isBuilding ? 18 : 14) * zoom;

	// Background
	ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
	ctx.fillRect(barX, barY, barWidth, barHeight);

	// Health fill — color-coded thresholds
	const ratio = Math.max(0, Math.min(1, entity.healthRatio));
	if (ratio > 0.75) {
		ctx.fillStyle = "#34d399"; // green
	} else if (ratio > 0.25) {
		ctx.fillStyle = "#fbbf24"; // yellow
	} else {
		ctx.fillStyle = "#ef4444"; // red
	}
	ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

	// HP bar border
	ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
	ctx.lineWidth = 0.5;
	ctx.strokeRect(barX, barY, barWidth, barHeight);
}

function drawEntityLabel(
	ctx: CanvasRenderingContext2D,
	entity: RenderableEntity,
	zoom: number,
): void {
	if (!entity.entityType || zoom < 1.0) return; // skip labels at low zoom

	let label: string;

	if (entity.isBuilding) {
		label = BUILDING_LABELS[entity.entityType] ?? entity.entityType;
	} else if (entity.isResource) {
		const visual = RESOURCE_VISUALS[entity.entityType] ?? DEFAULT_RESOURCE_VISUAL;
		label = visual.label;
	} else {
		// Unit type — capitalize and clean up underscores
		label = entity.entityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const fontSize = Math.max(8, Math.round(9 * zoom));
	ctx.font = `${fontSize}px monospace`;
	ctx.textAlign = "center";

	const labelY = entity.screenY + (entity.isBuilding ? 18 : entity.isResource ? 16 : 12) * zoom;

	// Text shadow for readability
	ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
	ctx.fillText(label, entity.screenX + 1, labelY + 1);

	// Label text
	ctx.fillStyle = "#e2e8f0";
	ctx.fillText(label, entity.screenX, labelY);
	ctx.textAlign = "start"; // reset
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
