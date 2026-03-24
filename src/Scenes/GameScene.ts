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
import { EventBus } from "@/game/EventBus";
import type { DeploymentData } from "@/game/deployment";
import type { MissionDef, Placement } from "@/entities/types";
import { getUnit, getHero, getBuilding, getResource } from "@/entities/registry";
import { compileMissionScenario } from "@/entities/missions/compileMissionScenario";
import { getMissionById } from "@/entities/missions";
import { spawnUnit, spawnBuilding, spawnResource } from "@/entities/spawner";
import { paintMap } from "@/entities/terrain/map-painter";
import { Faction, IsBuilding, UnitType } from "@/ecs/traits/identity";
import { Health } from "@/ecs/traits/combat";
import { Position } from "@/ecs/traits/spatial";
import { world } from "@/ecs/world";
import { DesktopInput } from "@/input/desktopInput";
import { MobileInput } from "@/input/mobileInput";
import { ScenarioEngine } from "@/scenarios/engine";
import type { ScenarioWorldQuery, ActionHandler } from "@/scenarios/engine";
import type { TriggerAction } from "@/scenarios/types";
import { FogOfWarSystem } from "@/systems/fogSystem";
import { tickAllSystems } from "@/systems/gameLoop";
import type { GameLoopContext } from "@/systems/gameLoop";
import { destroyAllSprites } from "@/systems/syncSystem";
import { WeatherSystem } from "@/systems/weatherSystem";
import { resetSessionState } from "@/ecs/singletons";
import { CurrentMission, GamePhase, ResourcePool, PopulationState } from "@/ecs/traits/state";

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
	private mobileInput?: MobileInput;
	private scenarioEngine: ScenarioEngine | null = null;
	private scenarioWorldQuery: ScenarioWorldQuery | null = null;
	private elapsedTime = 0;

	constructor() {
		super({ key: "Game" });
	}

	init(data?: DeploymentData): void {
		this.missionData = data ?? { missionId: "mission_1", difficulty: "support" };
		this.elapsedTime = 0;
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#1a2e1a");

		// Reset session state for new mission
		resetSessionState(world);
		world.set(CurrentMission, { missionId: resolveMissionKey(this.missionData.missionId) });
		world.set(GamePhase, { phase: "playing" });

		// Camera setup: enable panning and zooming
		this.cameras.main.setZoom(1);
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

		// Mouse wheel zoom
		this.input.on(
			"wheel",
			(_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
				const cam = this.cameras.main;
				const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.5, 2.0);
				cam.setZoom(newZoom);
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
			new DesktopInput(this, world);
		}

		// Notify React that GameScene is ready (HUD is now a React overlay)
		EventBus.emit("current-scene-ready", this);

		// Pause input (ESC key) — React handles the pause overlay
		if (this.input.keyboard) {
			this.input.keyboard.on("keydown-ESC", () => {
				this.scene.pause();
				EventBus.emit("game-paused");
			});
		}

		// Clean up ECS and sprites when leaving the scene
		this.events.on("shutdown", () => {
			this.fogSystem?.destroy();
			this.weatherSystem?.destroy();
			destroyAllSprites();
			this.fogSystem = null;
			this.weatherSystem = null;
			this.scenarioEngine = null;
			this.scenarioWorldQuery = null;
		});
	}

	update(_time: number, delta: number): void {
		const deltaSec = delta / 1000;
		this.elapsedTime += deltaSec;

		// Camera controls (not part of ECS tick)
		this.handleCameraPan(delta);

		// Mobile input: check for long press each frame
		this.mobileInput?.update();

		// Update scenario world query elapsed time
		if (this.scenarioWorldQuery) {
			this.scenarioWorldQuery.elapsedTime = this.elapsedTime;
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
		};
		tickAllSystems(ctx);
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

		// Edge scrolling: pan when mouse is near screen edge
		const pointer = this.input.activePointer;
		const edgeThresholdX = Math.max(20, cam.width * 0.03);
		const edgeThresholdY = Math.max(20, cam.height * 0.04);

		if (pointer.x < edgeThresholdX) cam.scrollX -= speed;
		if (pointer.x > cam.width - edgeThresholdX) cam.scrollX += speed;
		if (pointer.y < edgeThresholdY) cam.scrollY -= speed;
		if (pointer.y > cam.height - edgeThresholdY) cam.scrollY += speed;
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

		this.scenarioEngine.on((event) => {
				if (event.type === "missionFailed") {
				this.handleDefeat(event.reason);
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
				break;
			case "completeObjective":
				EventBus.emit("objective-completed", { objectiveId: action.objectiveId });
				break;
			case "failMission":
				this.handleDefeat(action.reason);
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
			case "changeWeather":
			case "playSFX":
				break;
		}
	}

	private handleVictory(): void {
		world.set(GamePhase, { phase: "victory" });
		const elapsed = Math.floor(this.elapsedTime);
		const pool = world.get(ResourcePool);
		const resourcesGathered = (pool?.fish ?? 0) + (pool?.timber ?? 0) + (pool?.salvage ?? 0);
		const stars = elapsed < 300 ? 3 : elapsed < 600 ? 2 : 1;

		EventBus.emit("mission-complete", {
			missionId: resolveMissionKey(this.missionData.missionId),
			difficulty: this.missionData.difficulty,
			stars,
			stats: {
				unitsLost: 0,
				enemiesDefeated: 0,
				timeElapsed: elapsed,
				resourcesGathered,
			},
		});
	}

	private handleDefeat(reason: string): void {
		world.set(GamePhase, { phase: "defeat" });
		EventBus.emit("mission-failed", { reason });
	}
}
