/**
 * GameCanvas — main canvas shell hosting the react-konva Stage.
 *
 * Responsibilities:
 * - Fills parent container via ResizeObserver
 * - Composes layers: TerrainLayer → EntityLayer → OverlayLayer → FogLayer
 * - Manages camera state via useCamera
 * - Runs the ECS game loop via useGameLoop
 * - Spawns entities from deploymentData on mount
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { useWorld } from "koota/react";
import type { World } from "koota";

import { resetSessionState } from "@/ecs/singletons";
import { Health } from "@/ecs/traits/combat";
import { Faction, IsBuilding, UnitType } from "@/ecs/traits/identity";
import { CurrentMission, DialogueState, GamePhase, Objectives, PopulationState, ResourcePool } from "@/ecs/traits/state";
import { getMissionById } from "@/entities/missions";
import { compileMissionScenario } from "@/entities/missions/compileMissionScenario";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import { spawnBuilding, spawnResource, spawnUnit } from "@/entities/spawner";
import type { MissionDef, Placement } from "@/entities/types";
import type { DeploymentData } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";
import { ScenarioEngine, type ActionHandler, type ScenarioWorldQuery } from "@/scenarios/engine";
import type { TriggerAction } from "@/scenarios/types";

import { AIState } from "@/ecs/traits/ai";
import { Gatherer } from "@/ecs/traits/economy";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { CombatTextOverlay } from "@/ui/hud/CombatTextOverlay";
import { buildGraphFromTilemap } from "@/ai/graphBuilder";
import { NavGraphState } from "@/ecs/traits/state";
import { buildTerrainGridForPathfinding } from "@/canvas/tilePainter";

import { EntityLayer } from "./EntityLayer";
import { MinimapLayer } from "./MinimapLayer";
import { OverlayLayer } from "./OverlayLayer";
import { FogLayer } from "./FogLayer";
import { TerrainLayer } from "./TerrainLayer";
import { paintMinimapTerrain } from "./terrainPainter";
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

  // Resolve mission early so build handler can access it
  const missionKey = resolveMissionKey(deploymentData.missionId);
  const mission = getMissionById(missionKey);

  // Listen for build placement events — instant build near player base
  useEffect(() => {
    const onStartBuild = (data: { buildingType: string }) => {
      const buildingDef = getBuilding(data.buildingType);
      if (!buildingDef) return;

      // Deduct resources
      const res = world.get(ResourcePool);
      if (!res) return;
      const cost = buildingDef.cost ?? {};
      if ((cost.fish ?? 0) > res.fish || (cost.timber ?? 0) > res.timber || (cost.salvage ?? 0) > res.salvage) {
        EventBus.emit("hud-alert", { message: "Not enough resources!", severity: "critical" });
        return;
      }
      world.set(ResourcePool, {
        fish: res.fish - (cost.fish ?? 0),
        timber: res.timber - (cost.timber ?? 0),
        salvage: res.salvage - (cost.salvage ?? 0),
      });

      // Find a suitable build position near the player start zone
      const startZone = mission?.zones?.base_clearing ?? mission?.zones?.ura_start;
      const bx = (startZone?.x ?? 12) + Math.floor(Math.random() * (startZone?.width ?? 6));
      const by = (startZone?.y ?? 37) + Math.floor(Math.random() * (startZone?.height ?? 4));

      spawnBuilding(world, buildingDef, bx, by, "ura");
      EventBus.emit("hud-alert", { message: `${buildingDef.name} placed!`, severity: "info" });

      // Rally idle workers to construct it
      for (const entity of world.query(OrderQueue, Faction, Gatherer)) {
        if (entity.get(Faction)?.id !== "ura") continue;
        const ai = entity.has(AIState) ? entity.get(AIState) : null;
        if (ai && ai.state !== "idle") continue;
        const queue = entity.get(OrderQueue);
        if (!queue) continue;
        queue.length = 0;
        queue.push({ type: "build", targetX: bx, targetY: by });
        if (entity.has(AIState)) entity.set(AIState, (prev) => ({ ...prev, state: "idle" }));
      }
    };
    EventBus.on("start-build-placement", onStartBuild);
    return () => { EventBus.off("start-build-placement", onStartBuild); };
  }, [world, mission]);

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

  // Compute world dimensions for minimap
  const worldW = mission ? mission.terrain.width * CELL_SIZE : 0;
  const worldH = mission ? mission.terrain.height * CELL_SIZE : 0;

  // Pre-paint terrain canvas for minimap (memoised on mission).
  // Uses paintMinimapTerrain for large maps to avoid exceeding canvas limits.
  const terrainCanvas = useMemo(
    () => (mission ? paintMinimapTerrain(mission) : null),
    [mission],
  );

  // ─── Scenario Engine ───

  const scenarioRef = useRef<{ engine: ScenarioEngine; worldQuery: ScenarioWorldQuery } | null>(null);

  // Action handler for scenario trigger actions
  const handleAction = useCallback((action: TriggerAction) => {
    if (action.type === "spawnUnits") {
      const unitDef = getUnit(action.unitType) ?? getHero(action.unitType);
      if (unitDef) {
        for (let i = 0; i < (action.count ?? 1); i++) {
          spawnUnit(world, unitDef, action.position.x + (Math.random() - 0.5) * 2, action.position.y + (Math.random() - 0.5) * 2, action.faction);
        }
      }
    } else if (action.type === "showDialogue") {
      EventBus.emit("hud-alert", { message: `${action.speaker}: ${action.text}`, severity: "info" });
    } else if (action.type === "showDialogueExchange") {
      world.set(DialogueState, {
        active: true,
        lines: action.lines,
        currentLine: 0,
        pauseGame: action.pauseGame ?? true,
        triggerId: null,
      });
      if (action.pauseGame !== false) {
        world.set(GamePhase, { phase: "paused" });
      }
    } else if (action.type === "victory") {
      EventBus.emit("mission-complete", { missionId: missionKey, stars: 1, stats: {} });
    } else if (action.type === "failMission") {
      EventBus.emit("mission-failed", { reason: action.reason });
    }
  }, [world, missionKey]);

  useEffect(() => {
    if (initRef.current || !mission) return;
    initRef.current = true;
    initMission(world, mission);
    setBounds({ worldW: worldW, worldH: worldH });

    // Build navigation graph for A* pathfinding
    const terrainGrid = buildTerrainGridForPathfinding(mission);
    const navGraph = buildGraphFromTilemap(terrainGrid, { eightWay: true });
    world.set(NavGraphState, { graph: navGraph, width: mission.terrain.width, height: mission.terrain.height });

    // Center camera on starting lodge — push to maximum scroll to show the player base area
    const uraBuilding = mission.placements.find(
      (p) => p.faction === "ura" && (p.type === "burrow" || p.type === "command_post"),
    );
    const uraUnit = mission.placements.find((p) => p.faction === "ura" && p.x != null);
    const focusX = uraBuilding?.x ?? uraUnit?.x ?? mission.zones?.ura_start?.x ?? 0;
    const focusY = uraBuilding?.y ?? uraUnit?.y ?? mission.zones?.ura_start?.y ?? 0;
    // Target: lodge in the center of viewport. Camera clamp will handle out-of-bounds.
    const cx = focusX * 32 - size.width / 2;
    const cy = focusY * 32 - size.height / 2;
    setPosition(cx, cy); // useCamera.setPosition clamps to valid bounds

    // Compile and start scenario engine
    const scenario = compileMissionScenario(mission);
    const engine = new ScenarioEngine(scenario, handleAction as ActionHandler);

    // Set objectives in ECS
    world.set(Objectives, {
      list: scenario.objectives.map((o) => ({
        id: o.id,
        description: o.description,
        status: o.status,
        bonus: o.type === "bonus",
      })),
    });

    // Create world query adapter for the scenario engine
    const worldQuery: ScenarioWorldQuery = {
      elapsedTime: 0,
      countUnits: (faction, unitType) => {
        let count = 0;
        for (const e of world.query(Faction, Health)) {
          if (e.get(Faction)?.id !== faction) continue;
          if (unitType && e.get(UnitType)?.type !== unitType) continue;
          count++;
        }
        return count;
      },
      countBuildings: (faction, buildingType) => {
        let count = 0;
        for (const e of world.query(Faction, UnitType, Health, IsBuilding)) {
          if (e.get(Faction)?.id !== faction) continue;
          if (buildingType && e.get(UnitType)?.type !== buildingType) continue;
          count++;
        }
        return count;
      },
      countUnitsInArea: (faction, area, unitType) => {
        let count = 0;
        for (const e of world.query(Faction, Position, Health)) {
          if (e.get(Faction)?.id !== faction) continue;
          if (unitType && e.get(UnitType)?.type !== unitType) continue;
          const pos = e.get(Position);
          if (!pos) continue;
          if (
            pos.x >= area.x &&
            pos.x < area.x + area.width &&
            pos.y >= area.y &&
            pos.y < area.y + area.height
          ) {
            count++;
          }
        }
        return count;
      },
      isBuildingDestroyed: (buildingTag) => {
        // Check if any building with a matching UnitType tag has health <= 0
        // buildingTag is used as both a UnitType and a scenario tag
        for (const e of world.query(Faction, UnitType, Health, IsBuilding)) {
          const ut = e.get(UnitType);
          if (ut?.type === buildingTag) {
            const hp = e.get(Health);
            if (hp && hp.current <= 0) return true;
          }
        }
        return false;
      },
      getEntityHealthPercent: (entityTag) => {
        // Search for entity by UnitType id matching the tag
        for (const e of world.query(UnitType, Health)) {
          if (e.get(UnitType)?.type === entityTag) {
            const hp = e.get(Health);
            if (hp) return (hp.current / Math.max(hp.max, 1)) * 100;
          }
        }
        return null;
      },
      getResourceAmount: (resource: "fish" | "timber" | "salvage") => {
        const pool = world.get(ResourcePool);
        return pool?.[resource] ?? 0;
      },
    };

    // Listen for scenario events
    engine.on((event) => {
      if (event.type === "objectiveCompleted") {
        EventBus.emit("hud-alert", { message: `Objective: ${event.objectiveId}`, severity: "info" });
      } else if (event.type === "allObjectivesCompleted") {
        EventBus.emit("hud-alert", { message: "All objectives complete!", severity: "info" });
      } else if (event.type === "missionFailed") {
        EventBus.emit("hud-alert", { message: `Mission failed: ${event.reason}`, severity: "critical" });
      }
    });

    scenarioRef.current = { engine, worldQuery };
  }, [world, mission, setBounds, worldW, worldH, handleAction]);

  // Game loop — pass scenario engine to tickAllSystems
  const scenarioEngine = scenarioRef.current?.engine ?? null;
  const scenarioWorldQuery = scenarioRef.current?.worldQuery ?? null;

  useGameLoop(world, {
    width: size.width,
    height: size.height,
    scenarioEngine,
    scenarioWorldQuery,
  });

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Game battlefield — click to select units, right-click to issue commands"
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", touchAction: "none", cursor: "crosshair" }}
      {...containerProps}
    >
      <Stage width={size.width} height={size.height}>
        {/* Layer 1: Terrain */}
        {mission && <TerrainLayer missionDef={mission} />}

        {/* Layer 2: Entities */}
        <Layer>
          <EntityLayer camX={camera.x} camY={camera.y} viewportW={size.width} viewportH={size.height} elapsedMs={Date.now()} />
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
        <FogLayer camX={camera.x} camY={camera.y} viewportW={size.width} viewportH={size.height} worldTilesW={Math.ceil(worldW / 32)} worldTilesH={Math.ceil(worldH / 32)} />
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

