/**
 * FogLayer — canvas-compositing fog of war rendered via Konva Shape.
 *
 * Draws a tiled procedural noise texture, then punches radial-gradient
 * vision holes for each player-faction entity using Canvas2D
 * `destination-out` compositing.
 *
 * Performance: listening={false} disables hit detection on this layer.
 */

import { useMemo } from "react";
import { Layer, Shape } from "react-konva";
import { useQuery } from "koota/react";
import type { Context } from "konva/lib/Context";
import type { Shape as KonvaShape } from "konva/lib/Shape";

import { VisionRadius } from "@/ecs/traits/combat";
import { Faction } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

// ─── Constants ───

/** Tile size in pixels — consistent with other layers. */
const TILE_SIZE = 32;

/** Size of the seamless fog noise tile (px). */
const FOG_TILE_SIZE = 256;

/** Base fog colour — dark slate blue matching POC. */
const FOG_BASE = "#0f172a";

/** Cloud accent colour (slate-700). */
const FOG_CLOUD = "rgba(51, 65, 85, 0.5)";
const FOG_CLOUD_EDGE = "rgba(51, 65, 85, 0)";

/** Number of cloud blobs in the noise tile. */
const CLOUD_COUNT = 150;

/** Player faction identifier. */
const PLAYER_FACTION = "ura";

// ─── Fog noise texture (built once) ───

/**
 * Build a seamless tileable fog noise canvas — mirrors POC `buildFogTexture`.
 * Uses seeded-ish random (Math.random) since the pattern is decorative.
 */
function buildFogTexture(): HTMLCanvasElement {
  const size = FOG_TILE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = FOG_BASE;
  ctx.fillRect(0, 0, size, size);

  // Procedural seamless cloudy noise — draw 9× for wrap-around tiling
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],  [0, 0],  [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];

  for (let i = 0; i < CLOUD_COUNT; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 15 + Math.random() * 30;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, FOG_CLOUD);
    grad.addColorStop(1, FOG_CLOUD_EDGE);
    ctx.fillStyle = grad;

    for (const [ox, oy] of offsets) {
      ctx.beginPath();
      ctx.arc(x + ox * size, y + oy * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

// ─── Props ───

export interface FogLayerProps {
  /** Camera X offset in pixels. */
  camX: number;
  /** Camera Y offset in pixels. */
  camY: number;
  /** Viewport width in pixels. */
  viewportW: number;
  /** Viewport height in pixels. */
  viewportH: number;
}

// ─── Component ───

/**
 * Renders fog of war as a single Konva Shape with custom sceneFunc.
 *
 * 1. Fills viewport with tiled fog noise pattern (with slow drift).
 * 2. Switches to `destination-out` compositing.
 * 3. Punches soft radial-gradient holes for each player entity's vision.
 */
export function FogLayer({ camX, camY, viewportW, viewportH }: FogLayerProps) {
  // Build fog noise tile once
  const fogTile = useMemo(() => buildFogTexture(), []);

  // Query player entities with vision
  const visibleEntities = useQuery(Position, Faction, VisionRadius);

  const sceneFunc = (ctx: Context, shape: KonvaShape) => {
    const canvas2d = ctx._context as CanvasRenderingContext2D;

    // ── 1. Fill with tiled fog pattern ──
    const pattern = canvas2d.createPattern(fogTile, "repeat");
    if (pattern) {
      canvas2d.save();
      // Slow atmospheric drift (mirrors POC)
      const driftX = -(camX * 0.2) % FOG_TILE_SIZE;
      const driftY = -(camY * 0.2) % FOG_TILE_SIZE;
      canvas2d.translate(driftX, driftY);
      canvas2d.fillStyle = pattern;
      // Overdraw to prevent clipping during drift
      canvas2d.fillRect(-FOG_TILE_SIZE, -FOG_TILE_SIZE, viewportW + FOG_TILE_SIZE * 2, viewportH + FOG_TILE_SIZE * 2);
      canvas2d.restore();
    }

    // ── 2. Punch vision holes with destination-out ──
    canvas2d.globalCompositeOperation = "destination-out";

    for (const entity of visibleEntities) {
      const pos = entity.get(Position);
      const faction = entity.get(Faction);
      const vision = entity.get(VisionRadius);

      if (!pos || !faction || !vision) continue;
      if (faction.id !== PLAYER_FACTION) continue;

      // Convert tile coords → pixel coords → screen coords
      const screenX = pos.x * TILE_SIZE - camX;
      const screenY = pos.y * TILE_SIZE - camY;
      const radiusPx = vision.radius * TILE_SIZE;

      // Frustum cull — skip entities whose vision circle is off-screen
      if (
        screenX + radiusPx < 0 || screenX - radiusPx > viewportW ||
        screenY + radiusPx < 0 || screenY - radiusPx > viewportH
      ) continue;

      // Soft feathered radial gradient (mirrors POC)
      const grad = canvas2d.createRadialGradient(
        screenX, screenY, radiusPx * 0.2,
        screenX, screenY, radiusPx,
      );
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.6, "rgba(0,0,0,0.8)");
      grad.addColorStop(1, "rgba(0,0,0,0)");

      canvas2d.fillStyle = grad;
      canvas2d.beginPath();
      canvas2d.arc(screenX, screenY, radiusPx, 0, Math.PI * 2);
      canvas2d.fill();
    }

    // Reset compositing
    canvas2d.globalCompositeOperation = "source-over";

    // Tell Konva we drew something
    ctx.fillStrokeShape(shape);
  };

  return (
    <Layer listening={false} opacity={0.9}>
      <Shape
        sceneFunc={sceneFunc}
        width={viewportW}
        height={viewportH}
        listening={false}
      />
    </Layer>
  );
}

