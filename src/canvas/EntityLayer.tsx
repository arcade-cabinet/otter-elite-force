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
import { Ellipse, Group, Image, Rect } from "react-konva";
import { Health } from "@/ecs/traits/combat";
import { ConstructionProgress } from "@/ecs/traits/economy";
import { Selected, UnitType } from "@/ecs/traits/identity";
import { FacingDirection, Position } from "@/ecs/traits/spatial";
import { getSprite } from "@/canvas/spriteGen";

// ─── Constants ───

/** Tile size in pixels — matches terrain painter. */
const TILE_SIZE = 32;

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
}

// ─── Component ───

/**
 * Renders all ECS entities with Position + UnitType as Konva Image nodes.
 *
 * Wrapped in a `<Group>` offset by camera position. Parent should be a
 * react-konva `<Layer>`.
 */
export function EntityLayer({ camX, camY, viewportW, viewportH }: EntityLayerProps) {
  const entities = useQuery(Position, UnitType);

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
        const wx = pos.x * TILE_SIZE;
        const wy = pos.y * TILE_SIZE;
        return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
      })
      .sort((a, b) => {
        const ay = a.get(Position)?.y ?? 0;
        const by = b.get(Position)?.y ?? 0;
        return ay - by;
      });
  }, [entities, camX, camY, viewportW, viewportH]);

  return (
    <Group x={-camX} y={-camY}>
      {visible.map((entity) => (
        <EntityNode key={entity.id()} entity={entity} />
      ))}
    </Group>
  );
}

// ─── Individual entity renderer ───

interface EntityNodeProps {
  entity: ReturnType<typeof useQuery>[number];
}

/**
 * Renders a single ECS entity: sprite image, selection circle, HP bar.
 */
function EntityNode({ entity }: EntityNodeProps) {
  const pos = entity.get(Position);
  const unitType = entity.get(UnitType);
  if (!pos || !unitType) return null;

  const wx = pos.x * TILE_SIZE;
  const wy = pos.y * TILE_SIZE;

  // Sprite from procedural cache
  const sprite = getSprite(unitType.type);
  const spriteW = sprite?.width ?? TILE_SIZE;
  const spriteH = sprite?.height ?? TILE_SIZE;

  // Facing direction → horizontal flip
  const facing = entity.has(FacingDirection) ? entity.get(FacingDirection) : null;
  const flipX = facing ? Math.cos(facing.angle) < 0 : false;
  const scaleX = flipX ? -1 : 1;

  // Construction progress → reduced alpha
  const construction = entity.has(ConstructionProgress)
    ? entity.get(ConstructionProgress)
    : null;
  const isUnderConstruction = construction != null && construction.progress < 100;
  const alpha = isUnderConstruction ? 0.3 + 0.7 * (construction.progress / 100) : 1;

  // Selection state
  const isSelected = entity.has(Selected);

  // Health state
  const health = entity.has(Health) ? entity.get(Health) : null;
  const isDamaged = health != null && health.current < health.max;
  const hpRatio = health ? health.current / health.max : 1;

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

      {/* HP bar (above sprite, only when damaged) */}
      {isDamaged && health && (
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
    </Group>
  );
}

