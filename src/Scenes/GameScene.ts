/**
 * GameScene — Main gameplay scene.
 *
 * Responsibilities:
 * 1. Load tilemap from mission data
 * 2. Spawn ECS entities from mission map definitions
 * 3. Initialize subsystems (fog, weather, scenario engine)
 * 4. Tick all ECS systems via tickAllSystems() each frame
 * 5. Handle camera controls (WASD/arrows/edge scroll/zoom)
 * 6. Bridge scenario events to scene transitions (victory/defeat)
 */

import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";
import { ALL_UNITS } from "@/data/units";
import { AIState } from "@/ecs/traits/ai";
import { Attack, Armor, Health, VisionRadius } from "@/ecs/traits/combat";
import { ResourceNode } from "@/ecs/traits/economy";
import { Faction, IsResource, UnitType } from "@/ecs/traits/identity";
import { OrderQueue } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";
import { world } from "@/ecs/world";
import { DesktopInput } from "@/input/desktopInput";
import { MobileInput } from "@/input/mobileInput";
import { loadMission, TILE_SIZE } from "@/maps/loader";
import { mission01Beachhead } from "@/maps/missions/mission-01-beachhead";
import { mission02Causeway } from "@/maps/missions/mission-02-causeway";
import { mission03FirebaseDelta } from "@/maps/missions/mission-03-firebase-delta";
import { mission04PrisonBreak } from "@/maps/missions/mission-04-prison-break";
import type { MapEntity, MissionMapData } from "@/maps/types";
import { ScenarioEngine } from "@/scenarios/engine";
import type { ScenarioWorldQuery, ActionHandler } from "@/scenarios/engine";
import type { TriggerAction } from "@/scenarios/types";
import { FogOfWarSystem } from "@/systems/fogSystem";
import { tickAllSystems } from "@/systems/gameLoop";
import type { GameLoopContext } from "@/systems/gameLoop";
import { destroyAllSprites } from "@/systems/syncSystem";
import { WeatherSystem } from "@/systems/weatherSystem";
import { resourceStore } from "@/stores/resourceStore";
import { useRTSGameStore } from "@/stores/rtsGameStore";

interface GameData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
}

/** Mission map registry — maps missionId to map data. */
const MISSION_MAPS: Record<number, MissionMapData> = {
	1: mission01Beachhead,
	2: mission02Causeway,
	3: mission03FirebaseDelta,
	4: mission04PrisonBreak,
};

export class GameScene extends Phaser.Scene {
	private missionData!: GameData;
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

	init(data: GameData): void {
		this.missionData = data;
		this.elapsedTime = 0;
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#1a2e1a");

		// Reset stores for new mission
		resourceStore.getState().reset();
		useRTSGameStore.getState().resetGame();
		useRTSGameStore.getState().setMission(String(this.missionData.missionId));
		useRTSGameStore.getState().setPhase("playing");

		// Camera setup: enable panning and zooming
		this.cameras.main.setZoom(1);
		this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT * 2);

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

		// Load mission tilemap and spawn entities
		const mapData = MISSION_MAPS[this.missionData.missionId];
		if (mapData) {
			const { tilemap } = loadMission(this, mapData);
			const mapWidth = tilemap.widthInPixels;
			const mapHeight = tilemap.heightInPixels;
			this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

			// Center camera on player start
			this.cameras.main.scrollX = mapData.playerStart.tileX * TILE_SIZE - GAME_WIDTH / 2;
			this.cameras.main.scrollY = mapData.playerStart.tileY * TILE_SIZE - GAME_HEIGHT / 2;

			// Spawn ECS entities from map definitions
			this.spawnMapEntities(mapData.entities);

			// Initialize subsystems
			this.fogSystem = new FogOfWarSystem(this, world, mapData.cols, mapData.rows);
			this.weatherSystem = new WeatherSystem(this);

			// Initialize scenario engine
			this.initScenarioEngine();
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

		// Launch HUD scene in parallel
		this.scene.launch("HUD", {
			missionId: this.missionData.missionId,
			difficulty: this.missionData.difficulty,
			isMobile: !!isTouchDevice,
			mobileInput: isTouchDevice ? this.mobileInput : undefined,
		});

		// Pause input (ESC key)
		if (this.input.keyboard) {
			this.input.keyboard.on("keydown-ESC", () => {
				this.scene.launch("Pause");
				this.scene.pause();
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

		// Update game clock in Zustand store
		useRTSGameStore.getState().tickClock(delta);

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
		const edgeThreshold = 30;

		if (pointer.x < edgeThreshold) cam.scrollX -= speed;
		if (pointer.x > GAME_WIDTH - edgeThreshold) cam.scrollX += speed;
		if (pointer.y < edgeThreshold) cam.scrollY -= speed;
		if (pointer.y > GAME_HEIGHT - edgeThreshold) cam.scrollY += speed;
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
	// Entity Spawning
	// =========================================================================

	private spawnMapEntities(entities: MapEntity[]): void {
		for (const mapEntity of entities) {
			const factionId =
				mapEntity.faction === "scale-guard" ? "scale_guard" : (mapEntity.faction ?? "neutral");

			if (mapEntity.type.startsWith("resource-")) {
				const resourceType = mapEntity.type.replace("resource-", "");
				const amount = (mapEntity.properties?.amount as number) ?? 100;
				world.spawn(
					IsResource(),
					UnitType({ type: resourceType }),
					Position({ x: mapEntity.tileX, y: mapEntity.tileY }),
					ResourceNode({ type: resourceType, remaining: amount }),
				);
			} else {
				const unitId = mapEntity.type.replace(/-/g, "_");
				const unitDef = ALL_UNITS[unitId];

				if (unitDef) {
					world.spawn(
						UnitType({ type: unitId }),
						Faction({ id: factionId }),
						Position({ x: mapEntity.tileX, y: mapEntity.tileY }),
						Health({ current: unitDef.hp, max: unitDef.hp }),
						Attack({
							damage: unitDef.damage,
							range: unitDef.range,
							cooldown: 1.0,
							timer: 0,
						}),
						Armor({ value: unitDef.armor }),
						VisionRadius({ radius: 5 }),
						AIState,
						OrderQueue,
					);
				} else {
					world.spawn(
						UnitType({ type: unitId }),
						Faction({ id: factionId }),
						Position({ x: mapEntity.tileX, y: mapEntity.tileY }),
						Health({ current: 100, max: 100 }),
						VisionRadius({ radius: 5 }),
					);
				}
			}
		}
	}

	// =========================================================================
	// Scenario Engine
	// =========================================================================

	private initScenarioEngine(): void {
		const actionHandler: ActionHandler = (action: TriggerAction) => {
			this.handleScenarioAction(action);
		};

		const placeholderScenario = {
			id: `mission-${this.missionData.missionId}`,
			chapter: 1,
			mission: this.missionData.missionId,
			name: `Mission ${this.missionData.missionId}`,
			briefing: { title: "", lines: [], objectives: [] },
			startConditions: {},
			objectives: [],
			triggers: [],
		};

		this.scenarioEngine = new ScenarioEngine(placeholderScenario, actionHandler);

		this.scenarioEngine.on((event) => {
			if (event.type === "allObjectivesCompleted") {
				this.handleVictory();
			} else if (event.type === "missionFailed") {
				this.handleDefeat(event.reason);
			}
		});

		this.scenarioWorldQuery = {
			elapsedTime: 0,
			countUnits: (faction: string, unitType?: string) => {
				let count = 0;
				world.query(Faction, Health).forEach((entity) => {
					// Query guarantees Faction+Health exist; guard satisfies strict null checks
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
				for (let i = 0; i < action.count; i++) {
					const unitId = action.unitType.replace(/-/g, "_");
					const unitDef = ALL_UNITS[unitId];
					const hp = unitDef?.hp ?? 100;
					const factionId = action.faction === "scale-guard" ? "scale_guard" : action.faction;
					world.spawn(
						UnitType({ type: unitId }),
						Faction({ id: factionId }),
						Position({ x: action.position.x + i, y: action.position.y }),
						Health({ current: hp, max: hp }),
						Attack({
							damage: unitDef?.damage ?? 10,
							range: unitDef?.range ?? 1,
							cooldown: 1.0,
							timer: 0,
						}),
						Armor({ value: unitDef?.armor ?? 0 }),
						VisionRadius({ radius: 5 }),
						AIState,
						OrderQueue,
					);
				}
				break;
			}
			case "spawnReinforcements":
				for (const group of action.units) {
					for (let i = 0; i < group.count; i++) {
						const unitId = group.unitType.replace(/-/g, "_");
						const unitDef = ALL_UNITS[unitId];
						const hp = unitDef?.hp ?? 100;
						const factionId = action.faction === "scale-guard" ? "scale_guard" : action.faction;
						world.spawn(
							UnitType({ type: unitId }),
							Faction({ id: factionId }),
							Position({ x: group.position.x + i, y: group.position.y }),
							Health({ current: hp, max: hp }),
							VisionRadius({ radius: 5 }),
							AIState,
							OrderQueue,
						);
					}
				}
				break;
			case "completeObjective":
				useRTSGameStore.getState().completeObjective(action.objectiveId);
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
			case "showDialogue":
			case "changeWeather":
			case "playSFX":
				break;
		}
	}

	private handleVictory(): void {
		useRTSGameStore.getState().setPhase("victory");
		const elapsed = Math.floor(this.elapsedTime);
		const res = resourceStore.getState();
		const resourcesGathered = res.fish + res.timber + res.salvage;
		const stars = elapsed < 300 ? 3 : elapsed < 600 ? 2 : 1;

		this.scene.stop("HUD");
		this.scene.start("Victory", {
			missionId: this.missionData.missionId,
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

	private handleDefeat(_reason: string): void {
		useRTSGameStore.getState().setPhase("defeat");
		this.scene.stop("HUD");
		this.scene.start("Menu");
	}
}
