/**
 * GameScene — Main gameplay scene.
 *
 * Responsibilities:
 * 1. Paint terrain from MissionDef using paintMap()
 * 2. Spawn ECS entities from MissionDef.placements via spawner
 * 3. Initialize subsystems (fog, weather, scenario engine)
 * 4. Tick all ECS systems via tickAllSystems() each frame
 * 5. Handle camera controls (WASD/arrows/edge scroll/zoom)
 * 6. Bridge scenario events to scene transitions (victory/defeat)
 */

import Phaser from "phaser";
import { ConstructingAt, GatheringFrom, OwnedBy, Targeting } from "@/ecs/relations";
import { resetSessionState } from "@/ecs/singletons";
import { Health } from "@/ecs/traits/combat";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { type Order, OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import {
	CurrentMission,
	GameClock,
	GamePhase,
	Objectives,
	PopulationState,
	ResourcePool,
} from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { getMissionById } from "@/entities/missions";
import { compileMissionScenario } from "@/entities/missions/compileMissionScenario";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import { ensureFactionOwner, spawnBuilding, spawnResource, spawnUnit } from "@/entities/spawner";
import { paintMap } from "@/entities/terrain/map-painter";
import type { MissionDef, Placement } from "@/entities/types";
import type { DeploymentData } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";
import {
	type DeviceClass,
	EDGE_SCROLL_THRESHOLD,
	clampZoom,
	detectDeviceClass,
	getZoomRange,
	lerpZoom,
} from "@/input/cameraLimits";
import { DesktopInput } from "@/input/desktopInput";
import { MobileInput } from "@/input/mobileInput";
import type { ActionHandler, ScenarioWorldQuery } from "@/scenarios/engine";
import { ScenarioEngine } from "@/scenarios/engine";
import type { ObjectiveStatus, TriggerAction } from "@/scenarios/types";
import {
	canPlaceBuilding,
	placeBuilding,
	type TerrainType,
	type TileMap,
} from "@/systems/buildingSystem";
import { DayNightSystem } from "@/systems/dayNightSystem";
import { FogOfWarSystem } from "@/systems/fogSystem";
import type { GameLoopContext } from "@/systems/gameLoop";
import { tickAllSystems } from "@/systems/gameLoop";
import { calculateMissionScore } from "@/systems/scoringSystem";
import { destroyAllSprites } from "@/systems/syncSystem";
import { FloatingTextManager } from "@/rendering/FloatingTextManager";
import { renderHPBars } from "@/rendering/HPBarRenderer";
import { renderRallyPoints } from "@/rendering/RallyPointRenderer";
import { WeatherSystem } from "@/systems/weatherSystem";

/** Tile size in pixels — matches the sync layer (32px). */
const TILE_SIZE = 32;

function resolveMissionKey(missionId: string | number): string {
	return typeof missionId === "number" ? `mission_${missionId}` : missionId;
}

function resolveMissionNumber(missionId: string | number): number {
	if (typeof missionId === "number") {
		return missionId;
	}
	const numeric = Number.parseInt(missionId.replace("mission_", ""), 10);
	return Number.isNaN(numeric) ? 1 : numeric;
}

export class GameScene extends Phaser.Scene {
	private missionData!: DeploymentData;
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
	private cameraPanSpeed = 400;
	private fogSystem: FogOfWarSystem | null = null;
	private weatherSystem: WeatherSystem | null = null;
	private dayNightSystem: DayNightSystem | null = null;
	private desktopInput?: DesktopInput;
	private mobileInput?: MobileInput;
	private scenarioEngine: ScenarioEngine | null = null;
	private scenarioWorldQuery: ScenarioWorldQuery | null = null;
	private activeMission: MissionDef | null = null;
	private placementMode: { workerEntityId: number; buildingId: string } | null = null;
	private battlefieldOverlay: Phaser.GameObjects.Graphics | null = null;
	private placementPreview: Phaser.GameObjects.Graphics | null = null;
	private deviceClass: DeviceClass = "desktop";
	private zoomTarget = 1;
	private floatingTextManager: FloatingTextManager | null = null;

	private setScenarioObjectives(
		objectives: Array<{
			id: string;
			description: string;
			type: "primary" | "bonus";
			status: ObjectiveStatus;
		}>,
	): void {
		world.set(Objectives, {
			list: objectives.map((objective) => ({
				id: objective.id,
				description: objective.description,
				status: objective.status,
				bonus: objective.type === "bonus",
			})),
		});
	}

	private updateObjectiveStatus(objectiveId: string, status: ObjectiveStatus): void {
		const objectives = world.get(Objectives);
		if (!objectives) return;

		world.set(Objectives, {
			list: objectives.list.map((objective) =>
				objective.id === objectiveId ? { ...objective, status } : objective,
			),
		});
	}

	private getObjectiveDescription(objectiveId: string): string {
		return (
			world.get(Objectives)?.list.find((objective) => objective.id === objectiveId)?.description ??
			objectiveId.replace(/-/g, " ")
		);
	}

	private emitCommandTransmission(payload: {
		speaker: string;
		text: string;
		portrait?: string;
		duration?: number;
	}): void {
		EventBus.emit("command-transmission", {
			missionId: resolveMissionKey(this.missionData.missionId),
			...payload,
		});
	}

	constructor() {
		super({ key: "Game" });
	}

	init(data?: DeploymentData): void {
		this.missionData = data ?? { missionId: "mission_1", difficulty: "support" };
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#1a2e1a");

		// Reset session state for new mission
		resetSessionState(world);
		world.set(CurrentMission, { missionId: resolveMissionKey(this.missionData.missionId) });
		world.set(GamePhase, { phase: "playing" });

		// Detect device class for zoom limits
		const isTouchCapable = this.sys.game.device.input.touch;
		this.deviceClass = detectDeviceClass(this.scale.width, isTouchCapable);

		// Camera setup: enable panning and zooming
		this.cameras.main.setZoom(1);
		this.zoomTarget = 1;
		this.cameras.main.setBounds(0, 0, this.scale.width * 2, this.scale.height * 2);

		// Keyboard input for camera pan
		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
			this.wasd = {
				W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
				A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
				S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
				D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
			};
		}

		// Mouse wheel zoom — sets target; actual zoom is lerped in update()
		this.input.on(
			"wheel",
			(_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
				const range = getZoomRange(this.deviceClass);
				this.zoomTarget = Phaser.Math.Clamp(
					this.zoomTarget - dy * 0.001,
					range.min,
					range.max,
				);
			},
		);

		// Load mission from new MissionDef format
		const mission = getMissionById(resolveMissionKey(this.missionData.missionId));
		if (mission) {
			this.loadMission(mission);
		} else {
			this.drawPlaceholderGrid();
		}

		// Platform-adaptive input: touch devices get MobileInput, others get DesktopInput
		const isTouchDevice = this.sys.game.device.input.touch;
		if (isTouchDevice) {
			this.mobileInput = new MobileInput(this, world);
			// Lock to landscape on mobile (async, fire-and-forget)
			import("@/input/screenOrientation").then((m) => m.lockLandscape());
		} else {
			this.desktopInput = new DesktopInput(this, world);
		}

		this.battlefieldOverlay = this.add.graphics();
		this.battlefieldOverlay.setDepth(950);
		this.floatingTextManager = new FloatingTextManager(this);
		this.placementPreview = this.add.graphics();
		this.placementPreview.setDepth(1200);
		this.input.on("pointermove", this.handlePlacementPointerMove, this);
		this.input.on("pointerdown", this.handlePlacementPointerDown, this);
		EventBus.on("start-build-placement", this.startBuildPlacement, this);

		// Notify React that GameScene is ready (HUD is now a React overlay)
		EventBus.emit("current-scene-ready", this);

		// Pause input (ESC key) — React handles the pause overlay.
		// The keyboard hotkeys module handles ESC for deselect/cancel-pending-action.
		// If the hotkeys module consumed the ESC (pending action or selection), we skip pause.
		// Build placement mode takes priority over everything.
		if (this.input.keyboard) {
			this.input.keyboard.on("keydown-ESC", () => {
				if (this.placementMode) {
					this.cancelBuildPlacement();
					return;
				}
				// If hotkeys have a pending action, let them consume ESC (already handled in hotkeys)
				if (this.desktopInput?.hotkeys.pendingAction !== "none") {
					return;
				}
				// If there are selected entities, deselect first (handled by hotkeys)
				// Only pause if nothing else consumed the ESC
				const hasSelection = world.query(Selected).length > 0;
				if (hasSelection) {
					return; // hotkeys already cleared selection
				}
				this.scene.pause();
				EventBus.emit("game-paused");
			});
		}

		// Clean up ECS and sprites when leaving the scene
		this.events.on("shutdown", () => {
			this.fogSystem?.destroy();
			this.weatherSystem?.destroy();
			this.dayNightSystem?.destroy();
			this.desktopInput?.destroy();
			this.mobileInput?.destroy();
			this.floatingTextManager?.destroy();
			this.battlefieldOverlay?.destroy();
			this.placementPreview?.destroy();
			this.input.off("pointermove", this.handlePlacementPointerMove, this);
			this.input.off("pointerdown", this.handlePlacementPointerDown, this);
			EventBus.off("start-build-placement", this.startBuildPlacement, this);
			destroyAllSprites();
			this.desktopInput = undefined;
			this.mobileInput = undefined;
			this.activeMission = null;
			this.placementMode = null;
			this.floatingTextManager = null;
			this.battlefieldOverlay = null;
			this.placementPreview = null;
			this.fogSystem = null;
			this.weatherSystem = null;
			this.dayNightSystem = null;
			this.scenarioEngine = null;
			this.scenarioWorldQuery = null;
		});
	}

	update(_time: number, delta: number): void {
		const deltaSec = delta / 1000;
		const clock = world.get(GameClock);
		const elapsedMs = clock?.elapsedMs ?? 0;
		const phase = world.get(GamePhase)?.phase ?? "loading";
		const paused = (clock?.paused ?? false) || phase !== "playing";
		const nextElapsedMs = paused ? elapsedMs : elapsedMs + delta;
		world.set(GameClock, {
			elapsedMs: nextElapsedMs,
			lastDeltaMs: paused ? 0 : delta,
			tick: (clock?.tick ?? 0) + 1,
			paused,
		});

		// Camera controls (not part of ECS tick)
		this.handleCameraPan(delta);
		this.handleSmoothZoom();

		// Mobile input: check for long press each frame
		this.mobileInput?.update();

		// Update scenario world query elapsed time
		if (this.scenarioWorldQuery) {
			this.scenarioWorldQuery.elapsedTime = nextElapsedMs / 1000;
		}

		// Tick all ECS systems in correct order
		const ctx: GameLoopContext = {
			world,
			scene: this,
			delta: deltaSec,
			scenarioEngine: this.scenarioEngine,
			scenarioWorldQuery: this.scenarioWorldQuery,
			fogSystem: this.fogSystem,
			weatherSystem: this.weatherSystem,
			dayNightSystem: this.dayNightSystem,
			elapsedMs: nextElapsedMs,
		};
		tickAllSystems(ctx);

		// Update rendering modules
		this.floatingTextManager?.update(deltaSec);

		this.renderBattlefieldReadabilityOverlay();
	}

	getFogSystem(): FogOfWarSystem | null {
		return this.fogSystem;
	}

	getMapDimensions(): { cols: number; rows: number } | null {
		const terrain = this.activeMission?.terrain;
		if (terrain) {
			return { cols: terrain.width, rows: terrain.height };
		}

		const bounds = this.cameras.main.getBounds();
		if (bounds.width <= 0 || bounds.height <= 0) return null;

		return {
			cols: Math.round(bounds.width / TILE_SIZE),
			rows: Math.round(bounds.height / TILE_SIZE),
		};
	}

	getSceneCanvas(): HTMLCanvasElement {
		return this.sys.game.canvas as HTMLCanvasElement;
	}

	private handleCameraPan(delta: number): void {
		const cam = this.cameras.main;
		const speed = (this.cameraPanSpeed * delta) / 1000;

		if (!this.input.keyboard) return;

		// WASD + arrow keys
		if (this.wasd.A?.isDown || this.cursors?.left?.isDown) {
			cam.scrollX -= speed;
		}
		if (this.wasd.D?.isDown || this.cursors?.right?.isDown) {
			cam.scrollX += speed;
		}
		if (this.wasd.W?.isDown || this.cursors?.up?.isDown) {
			cam.scrollY -= speed;
		}
		if (this.wasd.S?.isDown || this.cursors?.down?.isDown) {
			cam.scrollY += speed;
		}

		// Edge scrolling: pan when mouse is within EDGE_SCROLL_THRESHOLD px of screen edge
		const pointer = this.input.activePointer;
		const edgeThreshold = EDGE_SCROLL_THRESHOLD;

		if (pointer.x < edgeThreshold) cam.scrollX -= speed;
		if (pointer.x > cam.width - edgeThreshold) cam.scrollX += speed;
		if (pointer.y < edgeThreshold) cam.scrollY -= speed;
		if (pointer.y > cam.height - edgeThreshold) cam.scrollY += speed;
	}

	/** Smoothly interpolate camera zoom toward target each frame. */
	private handleSmoothZoom(): void {
		const cam = this.cameras.main;
		if (Math.abs(cam.zoom - this.zoomTarget) < 0.001) {
			cam.setZoom(this.zoomTarget);
			return;
		}
		const smoothed = lerpZoom(cam.zoom, this.zoomTarget, 0.15);
		cam.setZoom(clampZoom(smoothed, this.deviceClass));
	}

	private renderBattlefieldReadabilityOverlay(): void {
		if (!this.battlefieldOverlay) return;

		this.battlefieldOverlay.clear();
		this.renderSelectedOrderIndicators();
		this.renderSelectionIndicators();
		renderRallyPoints(world, this.battlefieldOverlay);
		renderHPBars(world, this.battlefieldOverlay);
	}

	private renderSelectedOrderIndicators(): void {
		if (!this.battlefieldOverlay) return;

		for (const entity of world.query(Selected, Position, OrderQueue)) {
			if (entity.has(IsBuilding)) continue;

			const pos = entity.get(Position);
			const orders = entity.get(OrderQueue);
			if (!pos || !orders || orders.length === 0) continue;

			const currentOrder = orders[0];
			if (currentOrder.type === "stop") continue;

			const startX = pos.x * TILE_SIZE + TILE_SIZE / 2;
			const startY = pos.y * TILE_SIZE + TILE_SIZE / 2;
			const target = this.resolveOrderTarget(entity, currentOrder);
			if (!target) continue;

			const style = this.getOrderIndicatorStyle(currentOrder.type);
			this.battlefieldOverlay.lineStyle(2, style.lineColor, 0.78);
			this.battlefieldOverlay.lineBetween(startX, startY, target.x, target.y);
			this.drawOrderMarker(target.x, target.y, style, currentOrder);
		}
	}

	private renderSelectionIndicators(): void {
		if (!this.battlefieldOverlay) return;

		for (const entity of world.query(Selected, Position)) {
			const pos = entity.get(Position);
			if (!pos) continue;

			const centerX = pos.x * TILE_SIZE + TILE_SIZE / 2;
			const centerY = pos.y * TILE_SIZE + TILE_SIZE / 2;
			const radius = entity.has(IsBuilding) ? 18 : 12;

			this.battlefieldOverlay.lineStyle(2, 0xa6ef7b, 0.95);
			this.battlefieldOverlay.strokeCircle(centerX, centerY, radius);

			if (!entity.has(IsBuilding)) {
				this.battlefieldOverlay.lineStyle(1, 0x16301a, 0.9);
				this.battlefieldOverlay.strokeCircle(centerX, centerY, Math.max(6, radius - 3));
			}
		}
	}

	private resolveOrderTarget(entity: ReturnType<typeof world.query>[number], order: Order) {
		if (order.type === "attack") {
			const explicitTarget =
				order.targetEntity !== undefined ? this.resolveEntity(order.targetEntity) : null;
			const attackTarget = explicitTarget ?? entity.targetFor(Targeting);
			const targetPos = attackTarget?.get(Position);
			if (targetPos) {
				return {
					x: targetPos.x * TILE_SIZE + TILE_SIZE / 2,
					y: targetPos.y * TILE_SIZE + TILE_SIZE / 2,
				};
			}
		}

		if (order.type === "gather") {
			const explicitTarget =
				order.targetEntity !== undefined ? this.resolveEntity(order.targetEntity) : null;
			const gatherTarget = explicitTarget ?? entity.targetFor(GatheringFrom);
			const targetPos = gatherTarget?.get(Position);
			if (targetPos) {
				return {
					x: targetPos.x * TILE_SIZE + TILE_SIZE / 2,
					y: targetPos.y * TILE_SIZE + TILE_SIZE / 2,
				};
			}
		}

		if (order.type === "patrol" && order.waypoints && order.waypoints.length > 0) {
			const first = order.waypoints[0];
			return {
				x: first.x * TILE_SIZE + TILE_SIZE / 2,
				y: first.y * TILE_SIZE + TILE_SIZE / 2,
			};
		}

		if (order.targetX !== undefined && order.targetY !== undefined) {
			return {
				x: order.targetX * TILE_SIZE + TILE_SIZE / 2,
				y: order.targetY * TILE_SIZE + TILE_SIZE / 2,
			};
		}

		return null;
	}

	private getOrderIndicatorStyle(orderType: Order["type"]) {
		switch (orderType) {
			case "move":
				return { lineColor: 0x7cff8a, accentColor: 0xdafee2, mode: "circle" as const };
			case "attack":
				return { lineColor: 0xff6b6b, accentColor: 0xffd4d4, mode: "crosshair" as const };
			case "gather":
				return { lineColor: 0xfbbf24, accentColor: 0xfff2c0, mode: "resource" as const };
			case "build":
				return { lineColor: 0xffa94d, accentColor: 0xffe0b3, mode: "tile" as const };
			case "patrol":
				return { lineColor: 0x8ec5ff, accentColor: 0xd7ecff, mode: "circle" as const };
			default:
				return { lineColor: 0xffffff, accentColor: 0xffffff, mode: "circle" as const };
		}
	}

	private drawOrderMarker(
		targetX: number,
		targetY: number,
		style: {
			lineColor: number;
			accentColor: number;
			mode: "circle" | "crosshair" | "resource" | "tile";
		},
		order: Order,
	): void {
		if (!this.battlefieldOverlay) return;

		if (style.mode === "tile") {
			this.battlefieldOverlay.fillStyle(0x1a1208, 0.4);
			this.battlefieldOverlay.fillRect(
				targetX - TILE_SIZE / 2,
				targetY - TILE_SIZE / 2,
				TILE_SIZE,
				TILE_SIZE,
			);
			this.battlefieldOverlay.lineStyle(2, style.lineColor, 0.95);
			this.battlefieldOverlay.strokeRect(
				targetX - TILE_SIZE / 2,
				targetY - TILE_SIZE / 2,
				TILE_SIZE,
				TILE_SIZE,
			);
			return;
		}

		if (style.mode === "crosshair") {
			this.battlefieldOverlay.lineStyle(2, style.lineColor, 0.95);
			this.battlefieldOverlay.strokeCircle(targetX, targetY, 11);
			this.battlefieldOverlay.lineBetween(targetX - 16, targetY, targetX - 6, targetY);
			this.battlefieldOverlay.lineBetween(targetX + 6, targetY, targetX + 16, targetY);
			this.battlefieldOverlay.lineBetween(targetX, targetY - 16, targetX, targetY - 6);
			this.battlefieldOverlay.lineBetween(targetX, targetY + 6, targetX, targetY + 16);
			return;
		}

		if (style.mode === "resource") {
			this.battlefieldOverlay.fillStyle(0x241b04, 0.7);
			this.battlefieldOverlay.fillCircle(targetX, targetY, 5);
			this.battlefieldOverlay.lineStyle(2, style.lineColor, 0.95);
			this.battlefieldOverlay.strokeCircle(targetX, targetY, 9);
			this.battlefieldOverlay.lineStyle(1, style.accentColor, 0.9);
			this.battlefieldOverlay.strokeCircle(targetX, targetY, 14);
			return;
		}

		this.battlefieldOverlay.fillStyle(0x08130a, 0.7);
		this.battlefieldOverlay.fillCircle(targetX, targetY, 5);
		this.battlefieldOverlay.lineStyle(2, style.lineColor, 0.95);
		this.battlefieldOverlay.strokeCircle(targetX, targetY, order.type === "move" ? 9 : 10);
		this.battlefieldOverlay.lineStyle(1, style.accentColor, 0.75);
		this.battlefieldOverlay.strokeCircle(targetX, targetY, order.type === "move" ? 14 : 16);
	}

	private drawPlaceholderGrid(): void {
		const cols = 50;
		const rows = 40;
		const gfx = this.add.graphics();
		gfx.lineStyle(1, 0x2a4a2a, 0.3);

		for (let x = 0; x <= cols; x++) {
			gfx.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, rows * TILE_SIZE);
		}
		for (let y = 0; y <= rows; y++) {
			gfx.lineBetween(0, y * TILE_SIZE, cols * TILE_SIZE, y * TILE_SIZE);
		}

		this.cameras.main.setBounds(0, 0, cols * TILE_SIZE, rows * TILE_SIZE);
	}

	// =========================================================================
	// Mission Loading (new entity architecture)
	// =========================================================================

	private loadMission(mission: MissionDef): void {
		this.activeMission = mission;
		// 1. Paint terrain onto a Canvas and register as background
		const terrainCanvas = paintMap(mission.terrain, TILE_SIZE);
		if (this.textures.exists("terrain-bg")) {
			this.textures.remove("terrain-bg");
		}
		this.textures.addCanvas("terrain-bg", terrainCanvas);
		this.add.image(0, 0, "terrain-bg").setOrigin(0, 0);

		// Set camera bounds to terrain size
		const mapWidth = terrainCanvas.width;
		const mapHeight = terrainCanvas.height;
		this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

		// Center camera on the ura_start zone if it exists, otherwise center of map
		const startZone = mission.zones.ura_start;
		if (startZone) {
			const cam = this.cameras.main;
			cam.scrollX = startZone.x * TILE_SIZE - cam.width / 2;
			cam.scrollY = startZone.y * TILE_SIZE - cam.height / 2;
		}

		// 2. Set starting resources from mission definition via Koota
		const res = mission.startResources;
		world.set(ResourcePool, {
			fish: res.fish ?? 0,
			timber: res.timber ?? 0,
			salvage: res.salvage ?? 0,
		});
		world.set(PopulationState, { current: 0, max: mission.startPopCap });

		// 3. Spawn all entities from placements using the spawner
		this.spawnPlacements(mission);

		// 4. Initialize subsystems
		this.fogSystem = new FogOfWarSystem(this, world, mission.terrain.width, mission.terrain.height);
		this.weatherSystem = new WeatherSystem(this);

		// 5. Initialize scenario engine with mission data
		this.initScenarioEngine(mission);
	}

	// =========================================================================
	// Entity Spawning (via spawner)
	// =========================================================================

	private spawnPlacements(mission: MissionDef): void {
		for (const placement of mission.placements) {
			const count = placement.count ?? 1;
			for (let i = 0; i < count; i++) {
				const { x, y } = this.resolvePlacementPosition(placement, mission, i);
				this.spawnFromPlacement(placement, x, y);
			}
		}
	}

	/** Resolve (x, y) for a placement — exact coords or scattered within zone. */
	private resolvePlacementPosition(
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

		// Fallback: offset from origin
		return { x: index, y: 0 };
	}

	/** Spawn a single entity from a Placement at resolved coordinates. */
	private spawnFromPlacement(placement: Placement, x: number, y: number): void {
		const faction = placement.faction ?? "neutral";

		// Try unit definitions first
		const unitDef = getUnit(placement.type);
		if (unitDef) {
			spawnUnit(world, unitDef, x, y, faction);
			return;
		}

		// Try hero definitions
		const heroDef = getHero(placement.type);
		if (heroDef) {
			spawnUnit(world, heroDef, x, y, faction);
			return;
		}

		// Try building definitions
		const buildingDef = getBuilding(placement.type);
		if (buildingDef) {
			spawnBuilding(world, buildingDef, x, y, faction);
			return;
		}

		// Try resource definitions
		const resourceDef = getResource(placement.type);
		if (resourceDef) {
			spawnResource(world, resourceDef, x, y);
			return;
		}
	}

	// =========================================================================
	// Scenario Engine
	// =========================================================================

	private initScenarioEngine(mission?: MissionDef): void {
		const actionHandler: ActionHandler = (action: TriggerAction) => {
			this.handleScenarioAction(action);
		};

		const scenario = mission
			? compileMissionScenario(mission)
			: {
					id: `mission-${resolveMissionNumber(this.missionData.missionId)}`,
					chapter: 1,
					mission: resolveMissionNumber(this.missionData.missionId),
					name: `Mission ${resolveMissionNumber(this.missionData.missionId)}`,
					briefing: { title: "", lines: [], objectives: [] },
					startConditions: {},
					objectives: [],
					triggers: [],
				};

		this.scenarioEngine = new ScenarioEngine(scenario, actionHandler);
		this.setScenarioObjectives(scenario.objectives);

		this.scenarioEngine.on((event) => {
			switch (event.type) {
				case "missionFailed":
					this.handleDefeat(event.reason);
					break;
				case "objectiveCompleted": {
					const description = this.getObjectiveDescription(event.objectiveId);
					this.updateObjectiveStatus(event.objectiveId, "completed");
					EventBus.emit("objective-completed", {
						objectiveId: event.objectiveId,
						description,
					});
					EventBus.emit("hud-alert", {
						message: `Directive complete: ${description}`,
						severity: "info",
					});
					break;
				}
				case "objectiveFailed": {
					const description = this.getObjectiveDescription(event.objectiveId);
					this.updateObjectiveStatus(event.objectiveId, "failed");
					EventBus.emit("hud-alert", {
						message: `Directive failed: ${description}`,
						severity: "critical",
					});
					break;
				}
				case "allObjectivesCompleted":
					EventBus.emit("hud-alert", {
						message: "Primary directives complete. Await command handoff.",
						severity: "info",
					});
					break;
				case "triggerFired":
					break;
			}
		});

		this.scenarioWorldQuery = {
			elapsedTime: 0,
			countUnits: (faction: string, unitType?: string) => {
				let count = 0;
				world.query(Faction, Health).forEach((entity) => {
					const f = entity.get(Faction);
					if (!f || f.id !== faction) return;
					if (unitType) {
						const ut = entity.get(UnitType);
						if (!ut || ut.type !== unitType) return;
					}
					count++;
				});
				return count;
			},
			countBuildings: (faction: string, buildingType?: string) => {
				let count = 0;
				world.query(Faction, UnitType, Health, IsBuilding).forEach((entity) => {
					const entityFaction = entity.get(Faction);
					if (!entityFaction || entityFaction.id !== faction) return;
					if (buildingType) {
						const entityType = entity.get(UnitType);
						if (!entityType || entityType.type !== buildingType) return;
					}
					count++;
				});
				return count;
			},
			countUnitsInArea: (
				faction: string,
				area: { x: number; y: number; width: number; height: number },
				unitType?: string,
			) => {
				let count = 0;
				world.query(Faction, Position, Health).forEach((entity) => {
					const f = entity.get(Faction);
					if (!f || f.id !== faction) return;
					if (unitType) {
						const ut = entity.get(UnitType);
						if (!ut || ut.type !== unitType) return;
					}
					const pos = entity.get(Position);
					if (!pos) return;
					if (
						pos.x >= area.x &&
						pos.x < area.x + area.width &&
						pos.y >= area.y &&
						pos.y < area.y + area.height
					) {
						count++;
					}
				});
				return count;
			},
			isBuildingDestroyed: (_buildingTag: string) => false,
			getEntityHealthPercent: (_entityTag: string) => null,
		};
	}

	private handleScenarioAction(action: TriggerAction): void {
		switch (action.type) {
			case "spawnUnits": {
				const unitDef = getUnit(action.unitType);
				const faction = action.faction === "scale-guard" ? "scale_guard" : action.faction;
				for (let i = 0; i < action.count; i++) {
					if (unitDef) {
						spawnUnit(world, unitDef, action.position.x + i, action.position.y, faction);
					}
				}
				break;
			}
			case "spawnReinforcements":
				for (const group of action.units) {
					const unitDef = getUnit(group.unitType);
					const faction = action.faction === "scale-guard" ? "scale_guard" : action.faction;
					for (let i = 0; i < group.count; i++) {
						if (unitDef) {
							spawnUnit(world, unitDef, group.position.x + i, group.position.y, faction);
						}
					}
				}
				if (action.dialogue) {
					this.emitCommandTransmission(action.dialogue);
				}
				break;
			case "completeObjective":
				break;
			case "failMission":
				break;
			case "camera":
				this.cameras.main.pan(
					action.target.x * TILE_SIZE,
					action.target.y * TILE_SIZE,
					action.duration * 1000,
				);
				break;
			case "victory":
				this.handleVictory();
				break;
			case "showDialogue":
				this.emitCommandTransmission({
					speaker: action.speaker,
					text: action.text,
					portrait: action.portrait,
					duration: action.duration,
				});
				break;
			case "changeWeather":
			case "playSFX":
				break;
		}
	}

	private handleVictory(): void {
		world.set(GamePhase, { phase: "victory" });
		world.set(GameClock, { paused: true, lastDeltaMs: 0 });
		const elapsedMs = world.get(GameClock)?.elapsedMs ?? 0;
		const elapsed = Math.floor(elapsedMs / 1000);
		const pool = world.get(ResourcePool);
		const resourcesGathered = (pool?.fish ?? 0) + (pool?.timber ?? 0) + (pool?.salvage ?? 0);

		// Count units lost and enemies defeated from ECS world
		let unitsLost = 0;
		let enemiesDefeated = 0;
		for (const eid of world.query(Faction, Health)) {
			const f = world.get(eid, Faction);
			const h = world.get(eid, Health);
			if (!f || !h) continue;
			if (f.faction === "ura" && h.current <= 0) unitsLost++;
			if (f.faction === "scale_guard" && h.current <= 0) enemiesDefeated++;
		}

		// Use the scoring system with mission par time
		const parTime = this.activeMission?.parTime ?? 300;
		const bonusObjectives = world.get(Objectives);
		const bonusTotal = bonusObjectives?.list.filter((o) => o.bonus).length ?? 0;
		const bonusCompleted =
			bonusObjectives?.list.filter((o) => o.bonus && o.status === "complete").length ?? 0;

		// Estimate total units spawned as surviving friendly units + units lost
		let survivingFriendly = 0;
		for (const eid of world.query(Faction, Health)) {
			const f = world.get(eid, Faction);
			const h = world.get(eid, Health);
			if (f?.faction === "ura" && h && h.current > 0) survivingFriendly++;
		}
		const unitsSpawned = survivingFriendly + unitsLost;

		const scoreResult = calculateMissionScore({
			elapsedSeconds: elapsed,
			parTimeSeconds: parTime,
			unitsLost,
			unitsSpawned,
			bonusCompleted,
			bonusTotal,
		});

		EventBus.emit("mission-complete", {
			missionId: resolveMissionKey(this.missionData.missionId),
			difficulty: this.missionData.difficulty,
			stars: scoreResult.stars,
			stats: {
				unitsLost,
				enemiesDefeated,
				timeElapsedMs: elapsedMs,
				timeElapsed: elapsed,
				resourcesGathered,
			},
		});
	}

	private handleDefeat(reason: string): void {
		world.set(GamePhase, { phase: "defeat" });
		world.set(GameClock, { paused: true, lastDeltaMs: 0 });
		EventBus.emit("mission-failed", { reason });
	}

	private startBuildPlacement(payload: { workerEntityId: number; buildingId: string }): void {
		if (!getBuilding(payload.buildingId)) return;
		this.placementMode = payload;
		this.setCommandInputEnabled(false);
		EventBus.emit("hud-alert", {
			message: `Placement mode: ${getBuilding(payload.buildingId)?.name ?? payload.buildingId}. Left-click to place, Esc to cancel.`,
			severity: "info",
		});
	}

	private cancelBuildPlacement(): void {
		this.placementMode = null;
		this.placementPreview?.clear();
		this.setCommandInputEnabled(true);
	}

	private handlePlacementPointerMove(pointer: Phaser.Input.Pointer): void {
		if (!this.placementMode || !this.placementPreview) return;
		const tileX = Math.floor(pointer.worldX / TILE_SIZE);
		const tileY = Math.floor(pointer.worldY / TILE_SIZE);
		const validation = canPlaceBuilding(
			this.placementMode.buildingId,
			tileX,
			tileY,
			this.createPlacementTileMap(),
			world,
		);
		this.placementPreview.clear();
		this.placementPreview.lineStyle(2, validation.valid ? 0x7cff8a : 0xff5f5f, 0.95);
		this.placementPreview.fillStyle(validation.valid ? 0x7cff8a : 0xff5f5f, 0.18);
		this.placementPreview.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		this.placementPreview.strokeRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
	}

	private handlePlacementPointerDown(pointer: Phaser.Input.Pointer): void {
		if (!this.placementMode) return;
		if (pointer.rightButtonDown()) {
			this.cancelBuildPlacement();
			return;
		}

		const worker = this.resolveEntity(this.placementMode.workerEntityId);
		if (!worker) {
			this.cancelBuildPlacement();
			return;
		}

		const tileX = Math.floor(pointer.worldX / TILE_SIZE);
		const tileY = Math.floor(pointer.worldY / TILE_SIZE);
		const ownerFaction =
			worker.targetFor(OwnedBy) ?? ensureFactionOwner(world, worker.get(Faction)?.id ?? "ura");
		const building = placeBuilding(
			world,
			this.placementMode.buildingId,
			tileX,
			tileY,
			this.createPlacementTileMap(),
			ownerFaction,
		);

		if (!building) {
			EventBus.emit("hud-alert", {
				message: "Unable to place structure here.",
				severity: "warning",
			});
			return;
		}

		worker.add(ConstructingAt(building));
		if (worker.has(OrderQueue)) {
			const orders = worker.get(OrderQueue);
			if (orders) {
				orders.length = 0;
				orders.push({
					type: "build",
					targetX: tileX,
					targetY: tileY,
					targetEntity: building.id(),
					buildingType: this.placementMode.buildingId,
				});
			}
		}

		EventBus.emit("hud-alert", {
			message: `${getBuilding(this.placementMode.buildingId)?.name ?? "Structure"} site marked. Builder en route.`,
			severity: "info",
		});
		this.placementMode = null;
		this.placementPreview?.clear();
		this.setCommandInputEnabled(true);
	}

	private setCommandInputEnabled(enabled: boolean): void {
		this.desktopInput?.setEnabled(enabled);
		this.mobileInput?.setEnabled(enabled);
	}

	private createPlacementTileMap(): TileMap {
		return {
			getTerrain: (x, y) => this.resolveTerrainAt(x, y),
			isOccupied: (x, y) => {
				let occupied = false;
				world.query(IsBuilding, Position).forEach((entity) => {
					if (occupied) return;
					const pos = entity.get(Position);
					if (pos?.x === x && pos?.y === y) occupied = true;
				});
				return occupied;
			},
		};
	}

	private resolveTerrainAt(x: number, y: number): TerrainType | null {
		const terrain = this.activeMission?.terrain;
		if (!terrain || x < 0 || y < 0 || x >= terrain.width || y >= terrain.height) return null;
		let terrainId = terrain.regions.find((region) => region.fill)?.terrainId ?? null;
		for (const region of terrain.regions) {
			if (region.fill) continue;
			if (
				region.rect &&
				x >= region.rect.x &&
				x < region.rect.x + region.rect.w &&
				y >= region.rect.y &&
				y < region.rect.y + region.rect.h
			)
				terrainId = region.terrainId;
			if (region.circle) {
				const dx = x - region.circle.cx;
				const dy = y - region.circle.cy;
				if (Math.hypot(dx, dy) <= region.circle.r) terrainId = region.terrainId;
			}
			if (region.river && this.pointNearRiver(x, y, region.river.points, region.river.width / 2))
				terrainId = region.terrainId;
		}
		for (const override of terrain.overrides) {
			if (override.x === x && override.y === y) terrainId = override.terrainId;
		}
		if (terrainId === "water") return "water";
		if (terrainId === "mangrove") return "mangrove";
		if (terrainId === "bridge") return "bridge";
		if (terrainId === "mud") return "mud";
		if (terrainId === "dirt") return "dirt";
		return "grass";
	}

	private pointNearRiver(
		x: number,
		y: number,
		points: [number, number][],
		halfWidth: number,
	): boolean {
		for (let i = 0; i < points.length - 1; i++) {
			const [x1, y1] = points[i];
			const [x2, y2] = points[i + 1];
			if (this.distanceToSegment(x, y, x1, y1, x2, y2) <= halfWidth) return true;
		}
		return false;
	}

	private distanceToSegment(
		px: number,
		py: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	): number {
		const dx = x2 - x1;
		const dy = y2 - y1;
		if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
		const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
		const projX = x1 + t * dx;
		const projY = y1 + t * dy;
		return Math.hypot(px - projX, py - projY);
	}

	private resolveEntity(entityId: number) {
		for (const entity of world.query(Position)) {
			if (entity.id() === entityId) return entity;
		}
		return null;
	}
}
