/**
 * OverlayLayer — visual overlays rendered above entities.
 *
 * Responsibilities:
 * - Weather particles: rain/monsoon lines when WeatherCondition is active
 * - Selection box: green translucent rect during drag-select
 * - Placement ghost: semi-transparent building tile following cursor with validity tint
 *
 * Day/night cycle REMOVED — classic RTS keeps the battlefield bright and readable.
 * Fog of war handles "unknown territory" without dimming the whole screen.
 *
 * All overlays are pointer-events-none (listening={false} on the Layer).
 */

import { useMemo } from "react";
import { Group, Layer, Line, Rect } from "react-konva";
import { useTrait, useWorld } from "koota/react";
import { GameClock, WeatherCondition } from "@/ecs/traits/state";

// ─── Constants ───

/** Grid cell size in pixels — consistent with other canvas layers. */
const CELL_SIZE = 32;

// ─── Weather particle generation ───

interface RainDrop {
  x: number;
  y: number;
  len: number;
  alpha: number;
}

function generateRainDrops(
  width: number,
  height: number,
  intensity: "rain" | "monsoon",
  seed: number,
): RainDrop[] {
  const count = intensity === "monsoon" ? 200 : 80;
  const drops: RainDrop[] = [];
  // Deterministic pseudo-random from seed
  let s = seed | 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    const len = intensity === "monsoon" ? 18 + rand() * 14 : 10 + rand() * 8;
    drops.push({
      x: rand() * width,
      y: rand() * height,
      len,
      alpha: intensity === "monsoon" ? 0.35 + rand() * 0.25 : 0.2 + rand() * 0.15,
    });
  }
  return drops;
}

// ─── Selection box state (read from external input) ───

export interface DragSelectState {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ─── Placement ghost state ───

export interface PlacementGhostState {
  active: boolean;
  /** Tile X the ghost is snapped to. */
  tileX: number;
  /** Tile Y the ghost is snapped to. */
  tileY: number;
  /** Whether the current position is valid for placement. */
  valid: boolean;
}

// ─── Props ───

export interface OverlayLayerProps {
  /** Viewport width in pixels. */
  width: number;
  /** Viewport height in pixels. */
  height: number;
  /** Camera X offset in world pixels. */
  camX: number;
  /** Camera Y offset in world pixels. */
  camY: number;
  /** Current drag-select rectangle (screen-space). */
  dragSelect?: DragSelectState;
  /** Current building placement ghost state (world-space tiles). */
  placementGhost?: PlacementGhostState;
}

// ─── Component ───

/**
 * Renders all visual overlays: day/night tint, weather, selection box,
 * and placement ghost. Wrapped in a non-interactive Layer.
 */
export function OverlayLayer({
  width,
  height,
  camX,
  camY,
  dragSelect,
  placementGhost,
}: OverlayLayerProps) {
  const world = useWorld();
  const clock = useTrait(world, GameClock);
  const weather = useTrait(world, WeatherCondition);

  // Day/night cycle REMOVED — bright, clear battlefield always.
  // Classic 90s RTS (StarCraft, WC2, C&C) keeps visibility consistent.
  // Fog of war handles "unknown territory" without dimming the whole screen.

  // Weather rain drops (regenerated each frame via seed from elapsed time)
  const rainDrops = useMemo(() => {
    const state = weather?.state ?? "clear";
    if (state === "clear") return [];
    // Use floored seconds as seed so drops shift each second
    const seed = Math.floor((clock?.elapsedMs ?? 0) / 100);
    return generateRainDrops(width, height, state, seed);
  }, [weather?.state, clock?.elapsedMs, width, height]);

  // Selection box rect (screen-space)
  const selBox = useMemo(() => {
    if (!dragSelect?.active) return null;
    const x = Math.min(dragSelect.startX, dragSelect.endX);
    const y = Math.min(dragSelect.startY, dragSelect.endY);
    const w = Math.abs(dragSelect.endX - dragSelect.startX);
    const h = Math.abs(dragSelect.endY - dragSelect.startY);
    return { x, y, w, h };
  }, [dragSelect]);

  // Placement ghost position (world → screen)
  const ghost = useMemo(() => {
    if (!placementGhost?.active) return null;
    return {
      x: placementGhost.tileX * CELL_SIZE - camX,
      y: placementGhost.tileY * CELL_SIZE - camY,
      fill: placementGhost.valid ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)",
      stroke: placementGhost.valid ? "#22c55e" : "#ef4444",
    };
  }, [placementGhost, camX, camY]);

  return (
    <Layer listening={false}>
      {/* No day/night tint — battlefield is always bright and readable */}

      {/* Weather particles */}
      {rainDrops.length > 0 && (
        <Group listening={false}>
          {rainDrops.map((drop, i) => (
            <Line
              key={i}
              points={[drop.x, drop.y, drop.x - 2, drop.y + drop.len]}
              stroke="rgba(180,200,220,0.6)"
              strokeWidth={1}
              opacity={drop.alpha}
              listening={false}
            />
          ))}
        </Group>
      )}

      {/* Selection box */}
      {selBox && (
        <Rect
          x={selBox.x}
          y={selBox.y}
          width={selBox.w}
          height={selBox.h}
          fill="rgba(34,197,94,0.2)"
          stroke="#22c55e"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Placement ghost */}
      {ghost && (
        <Group listening={false}>
          <Rect
            x={ghost.x}
            y={ghost.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={ghost.fill}
            stroke={ghost.stroke}
            strokeWidth={2}
            listening={false}
          />
        </Group>
      )}
    </Layer>
  );
}

