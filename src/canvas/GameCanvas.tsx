/**
 * GameCanvas — main canvas shell hosting the react-konva Stage.
 *
 * Responsibilities:
 * - Fills parent container via ResizeObserver
 * - Composes layers: TerrainLayer → EntityLayer → OverlayLayer (stub) → FogLayer (stub)
 * - Manages camera state via useCamera
 * - Runs the ECS game loop via useGameLoop
 * - Spawns entities from deploymentData on mount
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { useWorld } from "koota/react";
import type { World } from "koota";

import { resetSessionState } from "@/ecs/singletons";
import { CurrentMission, GamePhase, PopulationState, ResourcePool } from "@/ecs/traits/state";
import { getMissionById } from "@/entities/missions";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import { spawnBuilding, spawnResource, spawnUnit } from "@/entities/spawner";
import type { MissionDef, Placement } from "@/entities/types";
import type { DeploymentData } from "@/game/deployment";

import { CombatTextOverlay } from "@/ui/hud/CombatTextOverlay";

import { EntityLayer } from "./EntityLayer";
import { MinimapLayer } from "./MinimapLayer";
import { OverlayLayer } from "./OverlayLayer";
import { FogLayer } from "./FogLayer";
import { TerrainLayer } from "./TerrainLayer";
import { paintTerrain } from "./terrainPainter";
import { useCamera } from "./useCamera";
import { useGameLoop } from "./useGameLoop";
import { usePointerInput } from "./usePointerInput";

// ─── Constants ───

/** Grid cell size in pixels — consistent with EntityLayer and TerrainLayer. */
const CELL_SIZE = 32;

// ─── Placement helpers (mirrors GameScene logic) ───

function resolveMissionKey(missionId: string | number): string {
  return typeof missionId === "number" ? `mission_${missionId}` : missionId;
}

function resolvePlacementPosition(
  placement: Placement,
  mission: MissionDef,
  index: number,
): { x: number; y: number } {
  if (placement.x != null && placement.y != null) {
    return { x: placement.x, y: placement.y };
  }
  if (placement.zone) {
    const zone = mission.zones[placement.zone];
    if (zone) {
      const seed = `${placement.type}:${placement.zone}:${index}`;
      const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return {
        x: zone.x + (hash % zone.width),
        y: zone.y + (Math.floor(hash / Math.max(1, zone.width)) % zone.height),
      };
    }
  }
  return { x: index, y: 0 };
}

function spawnFromPlacement(world: World, placement: Placement, x: number, y: number): void {
  const faction = placement.faction ?? "neutral";
  const unitDef = getUnit(placement.type);
  if (unitDef) { spawnUnit(world, unitDef, x, y, faction); return; }
  const heroDef = getHero(placement.type);
  if (heroDef) { spawnUnit(world, heroDef, x, y, faction); return; }
  const buildingDef = getBuilding(placement.type);
  if (buildingDef) { spawnBuilding(world, buildingDef, x, y, faction); return; }
  const resourceDef = getResource(placement.type);
  if (resourceDef) { spawnResource(world, resourceDef, x, y); }
}

function initMission(world: World, mission: MissionDef): void {
  resetSessionState(world);
  world.set(CurrentMission, { missionId: mission.id });
  world.set(GamePhase, { phase: "playing" });
  const res = mission.startResources;
  world.set(ResourcePool, { fish: res.fish ?? 0, timber: res.timber ?? 0, salvage: res.salvage ?? 0 });
  world.set(PopulationState, { current: 0, max: mission.startPopCap });
  for (const placement of mission.placements) {
    const count = placement.count ?? 1;
    for (let i = 0; i < count; i++) {
      const pos = resolvePlacementPosition(placement, mission, i);
      spawnFromPlacement(world, placement, pos.x, pos.y);
    }
  }
}

// ─── Props ───

export interface GameCanvasProps {
  /** Mission deployment data — determines which mission to load. */
  deploymentData: DeploymentData;
}

// ─── Component ───

export function GameCanvas({ deploymentData }: GameCanvasProps) {
  const world = useWorld();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const initRef = useRef(false);

  // ResizeObserver → track container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setSize({ width: Math.round(width), height: Math.round(height) });
      }
    });
    ro.observe(el);
    // Set initial size
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    return () => ro.disconnect();
  }, []);

  // Camera
  const { camera, pan, setPosition, setZoom, setBounds } = useCamera(size.width, size.height);

  // Unified pointer input (mouse + touch → selection, commands, camera gestures)
  const { containerProps, dragSelect } = usePointerInput({
    world,
    camera,
    pan,
    setZoom,
  });

  // Load mission + spawn entities on mount
  const missionKey = resolveMissionKey(deploymentData.missionId);
  const mission = getMissionById(missionKey);

  // Compute world dimensions for minimap
  const worldW = mission ? mission.terrain.width * CELL_SIZE : 0;
  const worldH = mission ? mission.terrain.height * CELL_SIZE : 0;

  // Pre-paint terrain canvas for minimap (memoised on mission)
  const terrainCanvas = useMemo(
    () => (mission ? paintTerrain(mission) : null),
    [mission],
  );

  useEffect(() => {
    if (initRef.current || !mission) return;
    initRef.current = true;
    initMission(world, mission);
    setBounds({ worldW: worldW, worldH: worldH });
  }, [world, mission, setBounds, worldW, worldH]);

  // Game loop
  useGameLoop(world, { width: size.width, height: size.height });

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", touchAction: "none" }}
      {...containerProps}
    >
      <Stage width={size.width} height={size.height}>
        {/* Layer 1: Terrain */}
        {mission && <TerrainLayer missionDef={mission} />}

        {/* Layer 2: Entities */}
        <Layer>
          <EntityLayer camX={camera.x} camY={camera.y} viewportW={size.width} viewportH={size.height} />
        </Layer>

        {/* Layer 3: Overlay (day/night, weather, selection, placement) */}
        <OverlayLayer
          width={size.width}
          height={size.height}
          camX={camera.x}
          camY={camera.y}
          dragSelect={dragSelect}
        />

        {/* Layer 4: Fog of War */}
        <FogLayer camX={camera.x} camY={camera.y} viewportW={size.width} viewportH={size.height} />
      </Stage>

      {/* Minimap — positioned absolutely over the game canvas */}
      <MinimapLayer
        camera={camera}
        viewportW={size.width}
        viewportH={size.height}
        worldW={worldW}
        worldH={worldH}
        terrainCanvas={terrainCanvas}
        setPosition={setPosition}
      />

      {/* Floating combat/resource text — positioned absolutely over canvas */}
      <CombatTextOverlay
        camX={camera.x}
        camY={camera.y}
        viewportW={size.width}
        viewportH={size.height}
      />
    </div>
  );
}

