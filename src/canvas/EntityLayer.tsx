/**
 * EntityLayer — renders all ECS entities as Konva nodes.
 *
 * Queries Koota for entities with Position + UnitType, sorts by Y for depth,
 * applies frustum culling, and renders sprites from the procedural cache.
 *
 * Features:
 * - Y-sort depth ordering (painter's algorithm)
 * - Frustum culling (only renders entities within camera viewport)
 * - Selection circles (ellipse beneath selected entities)
 * - HP bars for damaged entities (green → yellow → red)
 * - Reduced alpha for buildings under construction
 * - Horizontal flip for facing direction
 * - 50×50 minimum touch hitboxes
 */

import { useQuery } from "koota/react";
import { useMemo } from "react";
import { Circle, Ellipse, Group, Image, Line, Rect, Text } from "react-konva";
import { drawRankEmblem, hasEmblem } from "@/canvas/rankEmblems";
import { getEntityAnimFrame, getEntitySprite } from "@/canvas/spriteAtlas";
import { AIState } from "@/ecs/traits/ai";
import { Health } from "@/ecs/traits/combat";
import { ConstructionProgress, Gatherer } from "@/ecs/traits/economy";
import { IsBuilding, IsProjectile, Selected, UnitType } from "@/ecs/traits/identity";
import { RallyPoint } from "@/ecs/traits/orders";
import { FacingDirection, Position } from "@/ecs/traits/spatial";
import { DetectionCone } from "@/ecs/traits/stealth";

// ─── Constants ───

/** Grid cell size in pixels — matches terrain painter. */
const CELL_SIZE = 32;

/** Minimum touch hitbox dimension (spec: ≥50px). */
const MIN_HITBOX = 50;

/** HP bar dimensions. */
const HP_BAR_WIDTH = 36;
const HP_BAR_HEIGHT = 4;
const HP_BAR_OFFSET_Y = -6;

/** Selection circle radii. */
const SELECTION_RX = 20;
const SELECTION_RY = 8;

/** Viewport padding for frustum culling (pixels beyond viewport edge). */
const CULL_PADDING = 64;

// ─── Sprite caches ───

/** Cache for static sprites (buildings, resources — no animation). */
const staticSpriteCache = new Map<string, HTMLCanvasElement>();

/** Get a static sprite with rank emblem. Used for buildings/resources that don't animate. */
function getStaticSprite(entityType: string): HTMLCanvasElement | undefined {
	const cached = staticSpriteCache.get(entityType);
	if (cached) return cached;

	const base = getEntitySprite(entityType);
	if (!base) return undefined;

	if (!hasEmblem(entityType)) {
		staticSpriteCache.set(entityType, base);
		return base;
	}

	const canvas = document.createElement("canvas");
	canvas.width = base.width;
	canvas.height = base.height;
	const ctx = canvas.getContext("2d")!;
	ctx.drawImage(base, 0, 0);
	drawRankEmblem(ctx, entityType, base.width);
	staticSpriteCache.set(entityType, canvas);
	return canvas;
}

/**
 * Get an animated sprite frame for a unit based on its AI state.
 * Falls back to static sprite for buildings/resources.
 */
function getAnimatedSprite(
	entityType: string,
	aiState: string | undefined,
	elapsedMs: number,
): HTMLCanvasElement | undefined {
	// Try animated frame first (units with atlas animations)
	const animName = getAnimForState(aiState);
	const frame = getEntityAnimFrame(entityType, animName, elapsedMs, 150);
	if (frame) return frame;

	// Fall back to static sprite (buildings, resources, or missing animations)
	return getStaticSprite(entityType);
}

/** Projectile rendering. */
const PROJECTILE_RADIUS = 3;
const PROJECTILE_COLOR = "#facc15";

/** Resource carrying pip. */
const PIP_WIDTH = 6;
const PIP_HEIGHT = 4;
const PIP_OFFSET_Y = -10;

/** Resource type → pip color. */
const RESOURCE_COLORS: Record<string, string> = {
	fish: "#38bdf8",
	timber: "#a3e635",
	salvage: "#fb923c",
};

/** Rally line styling. */
const RALLY_DASH = [4, 4];

/** Detection alert indicator styling. */
const ALERT_INDICATOR_OFFSET_Y = -18;
const ALERT_INDICATOR_FONT_SIZE = 16;
const ALERT_SUSPICIOUS_COLOR = "#eab308"; // yellow
const ALERT_ALERT_COLOR = "#ef4444"; // red

// ─── HP bar color helper ───

function hpColor(ratio: number): string {
	if (ratio > 0.6) return "#22c55e"; // green
	if (ratio > 0.3) return "#eab308"; // yellow
	return "#ef4444"; // red
}

// ─── Props ───

export interface EntityLayerProps {
	/** Camera X offset in world pixels. */
	camX: number;
	/** Camera Y offset in world pixels. */
	camY: number;
	/** Viewport width in pixels. */
	viewportW: number;
	/** Viewport height in pixels. */
	viewportH: number;
	/** Elapsed game time in ms — drives animation cycling. */
	elapsedMs?: number;
}

// ─── AIState → Animation name mapping ───

const AI_STATE_TO_ANIM: Record<string, string> = {
	idle: "Idle",
	moving: "Run",
	attacking: "Attack",
	gathering: "Walk",
	building: "Walk",
	patrolling: "Walk",
};

/** Get the correct animation name for an AI state, with animal-specific fallbacks. */
function getAnimForState(aiState: string | undefined): string {
	return AI_STATE_TO_ANIM[aiState ?? "idle"] ?? "Idle";
}

// ─── Component ───

/**
 * Renders all ECS entities with Position + UnitType as Konva Image nodes.
 *
 * Wrapped in a `<Group>` offset by camera position. Parent should be a
 * react-konva `<Layer>`.
 */
export function EntityLayer({ camX, camY, viewportW, viewportH, elapsedMs = 0 }: EntityLayerProps) {
	const entities = useQuery(Position, UnitType);
	const projectiles = useQuery(Position, IsProjectile);

	// Sort by Y for depth ordering + frustum cull
	const visible = useMemo(() => {
		const minX = camX - CULL_PADDING;
		const maxX = camX + viewportW + CULL_PADDING;
		const minY = camY - CULL_PADDING;
		const maxY = camY + viewportH + CULL_PADDING;

		return [...entities]
			.filter((e) => {
				const pos = e.get(Position);
				if (!pos) return false;
				const wx = pos.x * CELL_SIZE;
				const wy = pos.y * CELL_SIZE;
				return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
			})
			.sort((a, b) => {
				const ay = a.get(Position)?.y ?? 0;
				const by = b.get(Position)?.y ?? 0;
				return ay - by;
			});
	}, [entities, camX, camY, viewportW, viewportH]);

	// Frustum-cull projectiles
	const visibleProjectiles = useMemo(() => {
		const minX = camX - CULL_PADDING;
		const maxX = camX + viewportW + CULL_PADDING;
		const minY = camY - CULL_PADDING;
		const maxY = camY + viewportH + CULL_PADDING;

		return [...projectiles].filter((e) => {
			const pos = e.get(Position);
			if (!pos) return false;
			const wx = pos.x * CELL_SIZE;
			const wy = pos.y * CELL_SIZE;
			return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
		});
	}, [projectiles, camX, camY, viewportW, viewportH]);

	return (
		<Group x={-camX} y={-camY}>
			{visible.map((entity) => (
				<EntityNode key={entity.id()} entity={entity} elapsedMs={elapsedMs} />
			))}
			{visibleProjectiles.map((proj) => {
				const pos = proj.get(Position);
				if (!pos) return null;
				return (
					<Circle
						key={proj.id()}
						x={pos.x * CELL_SIZE + CELL_SIZE / 2}
						y={pos.y * CELL_SIZE + CELL_SIZE / 2}
						radius={PROJECTILE_RADIUS}
						fill={PROJECTILE_COLOR}
						listening={false}
					/>
				);
			})}
		</Group>
	);
}

// ─── Individual entity renderer ───

interface EntityNodeProps {
	entity: ReturnType<typeof useQuery>[number];
	elapsedMs: number;
}

/**
 * Renders a single ECS entity: animated sprite, selection circle, HP bar, alert indicator.
 */
function EntityNode({ entity, elapsedMs }: EntityNodeProps) {
	const pos = entity.get(Position);
	const unitType = entity.get(UnitType);
	if (!pos || !unitType) return null;

	const wx = pos.x * CELL_SIZE;
	const wy = pos.y * CELL_SIZE;

	// Get AI state for animation selection
	const aiState = entity.has(AIState) ? entity.get(AIState)?.state : undefined;

	// Animated sprite based on AI state (units) or static sprite (buildings/resources)
	const sprite = getAnimatedSprite(unitType.type, aiState, elapsedMs);
	const spriteW = sprite?.width ?? CELL_SIZE;
	const spriteH = sprite?.height ?? CELL_SIZE;

	// Facing direction → horizontal flip
	const facing = entity.has(FacingDirection) ? entity.get(FacingDirection) : null;
	const flipX = facing ? Math.cos(facing.angle) < 0 : false;
	const scaleX = flipX ? -1 : 1;

	// Construction progress → reduced alpha
	const construction = entity.has(ConstructionProgress) ? entity.get(ConstructionProgress) : null;
	const isUnderConstruction = construction != null && construction.progress < 100;
	const alpha = isUnderConstruction ? 0.3 + 0.7 * (construction.progress / 100) : 1;

	// Selection state
	const isSelected = entity.has(Selected);

	// Health state
	const health = entity.has(Health) ? entity.get(Health) : null;
	const hpRatio = health && health.max > 0 ? health.current / health.max : 1;

	// Resource carrying state (workers)
	const gatherer = entity.has(Gatherer) ? entity.get(Gatherer) : null;
	const isCarrying = gatherer != null && gatherer.amount > 0 && gatherer.carrying !== "";
	const pipColor = isCarrying ? (RESOURCE_COLORS[gatherer.carrying] ?? "#a1a1aa") : "";

	// Detection cone alert state (suspicious → "?", alert → "!")
	const detectionCone = entity.has(DetectionCone) ? entity.get(DetectionCone) : null;
	const alertIndicator =
		detectionCone?.alertState === "alert"
			? "!"
			: detectionCone?.alertState === "suspicious"
				? "?"
				: null;
	const alertColor =
		detectionCone?.alertState === "alert" ? ALERT_ALERT_COLOR : ALERT_SUSPICIOUS_COLOR;

	// Rally point (selected buildings only)
	const isBuilding = entity.has(IsBuilding);
	const rallyPoint =
		isSelected && isBuilding && entity.has(RallyPoint) ? entity.get(RallyPoint) : null;

	// Touch hitbox: ensure minimum 50×50
	const hitW = Math.max(spriteW, MIN_HITBOX);
	const hitH = Math.max(spriteH, MIN_HITBOX);

	return (
		<Group x={wx} y={wy}>
			{/* Selection circle (beneath sprite) */}
			{isSelected && (
				<Ellipse
					x={spriteW / 2}
					y={spriteH - 2}
					radiusX={SELECTION_RX}
					radiusY={SELECTION_RY}
					stroke="#22c55e"
					strokeWidth={2}
					listening={false}
				/>
			)}

			{/* Sprite image */}
			{sprite && (
				<Image
					image={sprite}
					width={spriteW}
					height={spriteH}
					offsetX={flipX ? spriteW : 0}
					scaleX={scaleX}
					opacity={alpha}
					listening={false}
				/>
			)}

			{/* Invisible touch hitbox (centered on sprite) */}
			<Rect
				x={(spriteW - hitW) / 2}
				y={(spriteH - hitH) / 2}
				width={hitW}
				height={hitH}
				opacity={0}
				listening={true}
			/>

			{/* HP bar (always visible for entities with health) */}
			{health && (
				<Group x={(spriteW - HP_BAR_WIDTH) / 2} y={HP_BAR_OFFSET_Y}>
					{/* Background */}
					<Rect
						width={HP_BAR_WIDTH}
						height={HP_BAR_HEIGHT}
						fill="#1f2937"
						cornerRadius={1}
						listening={false}
					/>
					{/* Fill */}
					<Rect
						width={HP_BAR_WIDTH * hpRatio}
						height={HP_BAR_HEIGHT}
						fill={hpColor(hpRatio)}
						cornerRadius={1}
						listening={false}
					/>
				</Group>
			)}

			{/* Resource carrying pip (above HP bar) */}
			{isCarrying && (
				<Rect
					x={(spriteW - PIP_WIDTH) / 2}
					y={PIP_OFFSET_Y}
					width={PIP_WIDTH}
					height={PIP_HEIGHT}
					fill={pipColor}
					cornerRadius={1}
					listening={false}
				/>
			)}

			{/* Rally point line (dashed, from building center to rally point) */}
			{rallyPoint && (
				<Line
					points={[
						spriteW / 2,
						spriteH / 2,
						rallyPoint.x * CELL_SIZE - wx + CELL_SIZE / 2,
						rallyPoint.y * CELL_SIZE - wy + CELL_SIZE / 2,
					]}
					stroke="#22c55e"
					strokeWidth={1}
					dash={RALLY_DASH}
					opacity={0.7}
					listening={false}
				/>
			)}

			{/* Detection alert indicator — "?" (suspicious, yellow) or "!" (alert, red) */}
			{alertIndicator && (
				<Text
					x={spriteW / 2 - ALERT_INDICATOR_FONT_SIZE / 4}
					y={ALERT_INDICATOR_OFFSET_Y}
					text={alertIndicator}
					fontSize={ALERT_INDICATOR_FONT_SIZE}
					fontStyle="bold"
					fill={alertColor}
					listening={false}
				/>
			)}
		</Group>
	);
}
