/**
 * Tactical Runtime — LittleJS engineInit()-based game loop.
 *
 * This replaces the old Canvas2D littlejsRuntime.ts with a proper LittleJS
 * bootstrap that uses:
 *   - engineInit() with the 5 standard callbacks
 *   - cameraPos/cameraScale for camera (not custom camera object)
 *   - mousePos/keyIsDown for input (not custom event listeners)
 *   - drawRect/drawTile/drawText for rendering (not ctx.fillRect)
 *
 * The LittleJS engine owns the game loop, canvas, and rendering pipeline.
 * Our callbacks synchronize bitECS world state with LittleJS each frame.
 */

import { drawRankEmblem, hasEmblem } from "@/canvas/rankEmblems";
import { loadAllAtlases } from "@/canvas/spriteAtlas";
import { loadTerrainTiles, paintTerrainChunked, type TerrainChunk } from "@/canvas/tilePainter";
import { GestureDetector, GestureType, type GestureResult, type PointerState } from "@/input/gestureDetector";
import {
	initAudioRuntime,
	notifyCombat,
	playAmbientMusic,
	playSfx,
	syncAudioFromWorld,
	tickMusicController,
} from "@/engine/audio/audioRuntime";
import { TerrainTypeId } from "@/engine/content/terrainTypes";
import {
	getEntityDrawSize,
	getEntityTileInfo,
	initAtlasAdapter,
	isAtlasAdapterReady,
} from "@/engine/rendering/atlasAdapter";
import { getMissionById } from "@/entities/missions";
import type { GameBridge, SelectionViewModel } from "../bridge/gameBridge";
import { serializeGameWorld } from "../persistence/gameWorldSaveLoad";
import { SqlitePersistenceStore } from "../persistence/sqlitePersistenceStore";
import { Construction, Faction, Flags, Health, Position, Selection } from "../world/components";
import type { GameWorld, Order } from "../world/gameWorld";
import { getOrderQueue, tickFloatingTexts } from "../world/gameWorld";

export type OrderType = "move" | "attack" | "gather" | "garrison";

export interface TacticalRuntime {
	start(): Promise<void>;
	stop(): Promise<void>;
	resize(width: number, height: number): void;
	clearSelection(): void;
	dismissDialogue(): void;
	recenter(): void;
	zoomIn(): void;
	zoomOut(): void;
	selectInScreenRect(
		startClientX: number,
		startClientY: number,
		endClientX: number,
		endClientY: number,
	): void;
	recenterFromMinimap(screenX: number, screenY: number): void;
	getControlGroups(): Map<number, number[]>;
}

export interface TacticalRuntimeOptions {
	container: HTMLElement;
	world: GameWorld;
	bridge: GameBridge;
	onTick?: (world: GameWorld) => void;
}

/** Terrain type → LittleJS Color (r, g, b, a scaled 0-1).
 * Colors chosen for high contrast and readability on dark monitors:
 *   grass=#218c47 water=#2666b3 sand=#d9bf8c forest=#14591f
 *   dirt=#8c6133  stone=#80858c mud=#664d38  mangrove=#1a6126
 *   bridge=#997a33 beach=#e6d1a6 toxic_sludge=#4d2673
 */
const TERRAIN_COLORS: Record<number, [number, number, number, number]> = {
	[TerrainTypeId.grass]: [0.13, 0.55, 0.28, 1], // #218c47
	[TerrainTypeId.water]: [0.15, 0.4, 0.7, 1], // #2666b3
	[TerrainTypeId.sand]: [0.85, 0.75, 0.55, 1], // #d9bf8c
	[TerrainTypeId.forest]: [0.08, 0.35, 0.12, 1], // #14591f
	[TerrainTypeId.dirt]: [0.55, 0.38, 0.2, 1], // #8c6133
	[TerrainTypeId.stone]: [0.5, 0.52, 0.55, 1], // #80858c
	[TerrainTypeId.mud]: [0.4, 0.3, 0.22, 1], // #664d38
	[TerrainTypeId.mangrove]: [0.1, 0.38, 0.15, 1], // #1a6126
	[TerrainTypeId.bridge]: [0.6, 0.48, 0.2, 1], // #997a33
	[TerrainTypeId.beach]: [0.9, 0.82, 0.65, 1], // #e6d1a6
	[TerrainTypeId.toxic_sludge]: [0.3, 0.15, 0.45, 1], // #4d2673
};

/** Minimap colors as CSS strings — brighter than world terrain for readability. */
const MINIMAP_TERRAIN_COLORS: Record<number, string> = {
	[TerrainTypeId.grass]: "#2ecc71",
	[TerrainTypeId.water]: "#3498db",
	[TerrainTypeId.sand]: "#f0d9a0",
	[TerrainTypeId.forest]: "#27ae60",
	[TerrainTypeId.dirt]: "#b07840",
	[TerrainTypeId.stone]: "#95a5a6",
	[TerrainTypeId.mud]: "#8b6c50",
	[TerrainTypeId.mangrove]: "#229944",
	[TerrainTypeId.bridge]: "#c8a850",
	[TerrainTypeId.beach]: "#f5e6c8",
	[TerrainTypeId.toxic_sludge]: "#7d3ebd",
};

const TILE_SIZE = 32;
const MINIMAP_MARGIN = 12;

function formatUnitTypeName(raw: string): string {
	return raw
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function buildSelectionViewModel(selectedIds: number[], world: GameWorld): SelectionViewModel {
	const typeCounts = new Map<string, number>();
	for (const eid of selectedIds) {
		const raw = world.runtime.entityTypeIndex.get(eid) ?? "unit";
		typeCounts.set(raw, (typeCounts.get(raw) ?? 0) + 1);
	}

	let primaryLabel: string;
	let unitBreakdown: string;

	if (selectedIds.length === 1) {
		const raw = world.runtime.entityTypeIndex.get(selectedIds[0]) ?? "Unit";
		primaryLabel = formatUnitTypeName(raw);
		unitBreakdown = primaryLabel;
	} else {
		primaryLabel = `${selectedIds.length} units`;
		const parts: string[] = [];
		for (const [type, count] of typeCounts) {
			const name = formatUnitTypeName(type);
			parts.push(count > 1 ? `${count} ${name}s` : `1 ${name}`);
		}
		unitBreakdown = parts.join(", ");
	}

	return { entityIds: selectedIds, primaryLabel, unitBreakdown };
}

/**
 * Create a LittleJS-powered tactical runtime.
 *
 * Calls LittleJS engineInit() with the 5 standard callbacks. The engine owns
 * the game loop and canvas. Our callbacks bridge bitECS world state to LittleJS
 * rendering primitives.
 */
export async function createTacticalRuntime(
	options: TacticalRuntimeOptions,
): Promise<TacticalRuntime> {
	const ljs = await import("littlejsengine");
	let started = false;
	let engineInitialized = false;
	const controlGroups = new Map<number, number[]>();
	const lastObjectiveStatuses = new Map<string, string>();
	let introAlertPublished = false;
	let lastScenarioPhase = options.world.runtime.scenarioPhase;
	let lastSessionPhase = options.world.session.phase;
	let scenarioPhaseInitialized = false;

	// Fog grid
	let fogGrid: Uint8Array | null = null;
	let fogGridWidth = 0;
	let fogGridHeight = 0;
	let terrainChunks: TerrainChunk[] = [];

	// Building tile infos — keyed by building type (e.g. "barracks", "watchtower")
	// Uses LittleJS TileInfo so buildings render on the WebGL layer (same as units/shapes).
	const buildingTileInfos = new Map<string, InstanceType<typeof ljs.TileInfo>>();
	const BUILDING_PNG_NAMES = [
		"armory",
		"barracks",
		"burrow",
		"command_post",
		"dock",
		"field_hospital",
		"fish_trap",
		"flag_post",
		"fuel_tank",
		"great_siphon",
		"gun_tower",
		"minefield",
		"sandbag_wall",
		"scale_wall",
		"shield_generator",
		"siphon",
		"sludge_pit",
		"spawning_pool",
		"stone_wall",
		"venom_spire",
		"watchtower",
	];

	// Resource tile infos — keyed by resource type (e.g. "mangrove_tree", "salvage_cache")
	// Uses LittleJS TileInfo so resources render on the WebGL layer (same as units/shapes).
	const resourceTileInfos = new Map<string, InstanceType<typeof ljs.TileInfo>>();
	const RESOURCE_PNG_MAP: Record<string, string> = {
		mangrove_tree: "props/forest_full.png",
		mangrove_tree_alt: "props/forest_dense_1.png",
		salvage_cache: "resources/salvage_cache.png",
		supply_crate: "resources/supply_crate.png",
		intel_marker: "resources/intel_marker.png",
	};
	// Debug: track which resource entity types have been logged as missing a tile
	const loggedMissingResourceTypes = new Set<string>();

	// Input mode flags for hotkeys
	let inputMode: "normal" | "attack-move" | "patrol" = "normal";
	let lastAlertWorldPos: { x: number; y: number } | null = null;

	// Selection box (screen-space during drag)
	let selectionBoxScreen: {
		startX: number;
		startY: number;
		endX: number;
		endY: number;
	} | null = null;

	// Pointer tracking for custom input (we use LittleJS mouse for most,
	// but need pointer tracking for drag-select and right-drag-pan)
	let dragStartWorldPos: { x: number; y: number } | null = null;
	let isDragging = false;
	let isPanning = false;

	// Touch gesture detector for mobile: two-finger pan, pinch zoom, long-press
	const gestureDetector = new GestureDetector();
	const activePointers = new Map<number, PointerState>();
	let lastGesture: GestureResult | null = null;

	// ═══════════════════════════════════════════════════════
	// Fog of war
	// ═══════════════════════════════════════════════════════

	function initFog(): void {
		const navW = options.world.navigation.width;
		const navH = options.world.navigation.height;
		if (navW > 0 && navH > 0) {
			fogGridWidth = navW;
			fogGridHeight = navH;
			fogGrid = new Uint8Array(navW * navH).fill(0);
			revealFogAroundPlayerEntities();
		}
	}

	function revealFogAroundPlayerEntities(): void {
		if (!fogGrid || fogGridWidth === 0 || fogGridHeight === 0) return;

		for (const eid of options.world.runtime.alive) {
			if (Faction.id[eid] !== 1) continue;
			const tileX = Math.floor(Position.x[eid] / TILE_SIZE);
			const tileY = Math.floor(Position.y[eid] / TILE_SIZE);
			const isBuilding = Flags.isBuilding[eid] === 1;
			const visionRadius = isBuilding ? 10 : 8;

			for (let dy = -visionRadius; dy <= visionRadius; dy++) {
				for (let dx = -visionRadius; dx <= visionRadius; dx++) {
					if (dx * dx + dy * dy > visionRadius * visionRadius) continue;
					const fx = tileX + dx;
					const fy = tileY + dy;
					if (fx < 0 || fy < 0 || fx >= fogGridWidth || fy >= fogGridHeight) continue;
					fogGrid[fy * fogGridWidth + fx] = 2;
				}
			}

			const exploredRadius = visionRadius + 3;
			for (let dy = -exploredRadius; dy <= exploredRadius; dy++) {
				for (let dx = -exploredRadius; dx <= exploredRadius; dx++) {
					const dist2 = dx * dx + dy * dy;
					if (dist2 <= visionRadius * visionRadius || dist2 > exploredRadius * exploredRadius)
						continue;
					const fx = tileX + dx;
					const fy = tileY + dy;
					if (fx < 0 || fy < 0 || fx >= fogGridWidth || fy >= fogGridHeight) continue;
					if (fogGrid[fy * fogGridWidth + fx] === 0) {
						fogGrid[fy * fogGridWidth + fx] = 1;
					}
				}
			}
		}
	}

	// ═══════════════════════════════════════════════════════
	// World helpers
	// ═══════════════════════════════════════════════════════

	function getWorldPixelSize(): { width: number; height: number } {
		return {
			width: Math.max(1, options.world.navigation.width * TILE_SIZE),
			height: Math.max(1, options.world.navigation.height * TILE_SIZE),
		};
	}

	function getSelectedEntityIds(): number[] {
		return [...options.world.runtime.alive].filter((eid) => Selection.selected[eid] === 1);
	}

	function getLockedZoneAt(worldX: number, worldY: number): string | null {
		for (const zoneId of options.world.runtime.lockedZones) {
			const zone = options.world.runtime.zoneRects.get(zoneId);
			if (!zone) continue;
			if (
				worldX >= zone.x &&
				worldX <= zone.x + zone.width &&
				worldY >= zone.y &&
				worldY <= zone.y + zone.height
			) {
				return zoneId;
			}
		}
		return null;
	}

	function findNearestEntity(worldX: number, worldY: number): number | null {
		let nearest: number | null = null;
		const camScale = ljs.cameraScale;
		let nearestDistance = 18 / camScale;
		for (const eid of options.world.runtime.alive) {
			const dx = Position.x[eid] - worldX;
			const dy = Position.y[eid] - worldY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance < nearestDistance) {
				nearest = eid;
				nearestDistance = distance;
			}
		}
		return nearest;
	}

	// ═══════════════════════════════════════════════════════
	// Commands and orders
	// ═══════════════════════════════════════════════════════

	function resolveContextualOrder(worldX: number, worldY: number): Order {
		const targetEid = findNearestEntity(worldX, worldY);
		if (targetEid != null) {
			const targetFaction = Faction.id[targetEid];
			const isResource = Flags.isResource[targetEid] === 1;
			const isBuilding = Flags.isBuilding[targetEid] === 1;
			const isEnemy = targetFaction !== 0 && targetFaction !== 1;
			if (isEnemy) return { type: "attack", targetEid, targetX: worldX, targetY: worldY };
			if (isResource) return { type: "gather", targetEid, targetX: worldX, targetY: worldY };
			if (isBuilding && targetFaction === 1)
				return { type: "garrison", targetEid, targetX: worldX, targetY: worldY };
		}
		return { type: "move", targetX: worldX, targetY: worldY };
	}

	function issueOrderToSelected(order: Order): void {
		const selected = getSelectedEntityIds();
		for (const eid of selected) {
			const queue = getOrderQueue(options.world, eid);
			queue.length = 0;
			queue.push(order);
		}
		if (order.type === "move" && order.targetX !== undefined && order.targetY !== undefined) {
			moveSelectedEntities(order.targetX, order.targetY);
		}
	}

	function moveSelectedEntities(worldX: number, worldY: number): void {
		const lockedZoneId = getLockedZoneAt(worldX, worldY);
		if (lockedZoneId) {
			options.world.diagnostics.pathfinding.boundaryViolations.push(options.world.time.tick);
			pushAlert(`Route blocked: ${lockedZoneId}`, "warning");
			return;
		}
		const selected = getSelectedEntityIds();
		selected.forEach((eid, index) => {
			const offsetX = (index % 3) * 18 - 18;
			const offsetY = Math.floor(index / 3) * 18;
			Position.x[eid] = worldX + offsetX;
			Position.y[eid] = worldY + offsetY;
		});
	}

	// ═══════════════════════════════════════════════════════
	// Bridge state sync
	// ═══════════════════════════════════════════════════════

	function pushAlert(
		message: string,
		severity: "info" | "warning" | "critical",
		worldX?: number,
		worldY?: number,
	): void {
		const id = `runtime-alert-${options.world.time.tick}-${options.bridge.state.alerts.length}`;
		options.bridge.state.alerts = [
			...options.bridge.state.alerts,
			{ id, message, severity, worldX, worldY },
		].slice(-4);
		if (worldX !== undefined && worldY !== undefined) {
			lastAlertWorldPos = { x: worldX, y: worldY };
		}
	}

	function syncBridgeState(): void {
		if (
			options.world.session.dialogue?.active &&
			options.world.session.dialogue.expiresAtMs != null &&
			options.world.time.elapsedMs >= options.world.session.dialogue.expiresAtMs
		) {
			options.world.session.dialogue = null;
		}
		const selectedIds = getSelectedEntityIds();
		const playerOwned = [...options.world.runtime.alive].filter(
			(eid) => Faction.id[eid] === 1 && Flags.isResource[eid] === 0,
		).length;
		options.bridge.state.selection =
			selectedIds.length > 0 ? buildSelectionViewModel(selectedIds, options.world) : null;
		options.bridge.state.population = {
			current: playerOwned,
			max: Math.max(playerOwned, 24),
		};
		options.bridge.state.resources = { ...options.world.session.resources };
		options.bridge.state.objectives = options.world.session.objectives.map((o) => ({
			id: o.id,
			description: o.description,
			status: o.status,
		}));
		options.bridge.state.weather = options.world.runtime.weather;
		const bossEntry = [...options.world.runtime.bossConfigs.entries()].find(([eid]) =>
			options.world.runtime.alive.has(eid),
		);
		options.bridge.state.boss = bossEntry
			? {
					name: String((bossEntry[1] as { name?: string }).name ?? "Boss"),
					currentHp: Health.current[bossEntry[0]],
					maxHp: Health.max[bossEntry[0]],
				}
			: null;
		options.bridge.state.dialogue = options.world.session.dialogue?.active
			? { lines: options.world.session.dialogue.lines }
			: null;
		for (const objective of options.world.session.objectives) {
			const previousStatus = lastObjectiveStatuses.get(objective.id);
			if (previousStatus && previousStatus !== objective.status) {
				if (objective.status === "completed") {
					pushAlert(`Objective complete: ${objective.description}`, "info");
				} else if (objective.status === "failed") {
					pushAlert(`Objective failed: ${objective.description}`, "warning");
				}
			}
			lastObjectiveStatuses.set(objective.id, objective.status);
		}
		if (!introAlertPublished && options.world.session.objectives.length > 0) {
			pushAlert(`Orders: ${options.world.session.objectives[0]?.description}`, "info");
			introAlertPublished = true;
		}
		if (!scenarioPhaseInitialized) {
			scenarioPhaseInitialized = true;
			if (options.world.runtime.scenarioPhase !== "initial") {
				pushAlert(`Phase: ${options.world.runtime.scenarioPhase}`, "info");
			}
			lastScenarioPhase = options.world.runtime.scenarioPhase;
		} else if (options.world.runtime.scenarioPhase !== lastScenarioPhase) {
			pushAlert(`Phase: ${options.world.runtime.scenarioPhase}`, "info");
			lastScenarioPhase = options.world.runtime.scenarioPhase;
		}
		syncAudioFromWorld(options.world);
		tickMusicController();
		if (options.world.session.phase !== lastSessionPhase) {
			if (options.world.session.phase === "victory") {
				pushAlert("Mission complete", "info");
				playSfx("buildComplete");
			} else if (options.world.session.phase === "defeat") {
				pushAlert("Mission failed", "critical");
				playSfx("unitDeath");
			}
			lastSessionPhase = options.world.session.phase;
		}
		options.container.dataset.runtimeSelected = String(selectedIds.length);
	}

	function applyWorldEvents(): void {
		while (options.world.events.length > 0) {
			const event = options.world.events.shift();
			if (!event) break;
			if (event.type === "camera-focus") {
				const x = Number(event.payload?.x ?? 0);
				const y = Number(event.payload?.y ?? 0);
				ljs.setCameraPos(ljs.vec2(x + 0.5, y + 0.5));
				pushAlert("Camera refocused on mission event", "info");
				continue;
			}
			if (event.type === "zone-revealed") {
				pushAlert(`Zone revealed: ${String(event.payload?.zoneId ?? "unknown")}`, "info");
				continue;
			}
			if (event.type === "zone-locked") {
				pushAlert(`Zone locked: ${String(event.payload?.zoneId ?? "unknown")}`, "warning");
				continue;
			}
			if (event.type === "zone-unlocked") {
				pushAlert(`Zone unlocked: ${String(event.payload?.zoneId ?? "unknown")}`, "info");
				continue;
			}
			if (event.type === "weather-changed") {
				pushAlert(`Weather: ${String(event.payload?.weather ?? "clear")}`, "warning");
				continue;
			}
			if (event.type === "boss-spawned") {
				const bossX = event.payload?.x as number | undefined;
				const bossY = event.payload?.y as number | undefined;
				pushAlert(
					`Boss engaged: ${String(event.payload?.name ?? "Unknown")}`,
					"critical",
					bossX,
					bossY,
				);
				continue;
			}
			if (event.type === "building-complete") {
				const bx = event.payload?.x as number | undefined;
				const by = event.payload?.y as number | undefined;
				pushAlert("Construction complete", "info", bx, by);
				playSfx("buildComplete");
				continue;
			}
			if (event.type === "research-complete") {
				pushAlert(`Research complete: ${String(event.payload?.researchId ?? "")}`, "info");
				playSfx("researchComplete");
				continue;
			}
			if (event.type === "reinforcements-arrived") {
				const rx = event.payload?.x as number | undefined;
				const ry = event.payload?.y as number | undefined;
				pushAlert("Reinforcements have arrived", "info", rx, ry);
			}
			if (event.type === "under-attack") {
				const ax = event.payload?.x as number | undefined;
				const ay = event.payload?.y as number | undefined;
				pushAlert("Under Attack!", "critical", ax, ay);
				notifyCombat();
				continue;
			}
			if (event.type === "enemy-spotted") {
				const ex = event.payload?.x as number | undefined;
				const ey = event.payload?.y as number | undefined;
				pushAlert("Enemy Spotted", "warning", ex, ey);
				notifyCombat();
				continue;
			}
			if (event.type === "unit-died") {
				const ux = event.payload?.x as number | undefined;
				const uy = event.payload?.y as number | undefined;
				playSfx("unitDeath");
				pushAlert("Unit lost", "warning", ux, uy);
				notifyCombat();
				continue;
			}
			if (event.type === "training-complete") {
				const unitType = String(event.payload?.unitType ?? "unit");
				const tx = event.payload?.x as number | undefined;
				const ty = event.payload?.y as number | undefined;
				pushAlert(`Training complete: ${unitType.replace(/_/g, " ")}`, "info", tx, ty);
				playSfx("trainingComplete");
				continue;
			}
			if (event.type === "resource-depleted") {
				const dx = event.payload?.x as number | undefined;
				const dy = event.payload?.y as number | undefined;
				pushAlert("Resource depleted", "warning", dx, dy);
				continue;
			}
			if (event.type === "save-requested") {
				const snapshot = serializeGameWorld(options.world);
				const store = new SqlitePersistenceStore();
				void store
					.initialize()
					.then(() =>
						store.saveMission({
							slot: 0,
							missionId: options.world.session.currentMissionId ?? "unknown",
							seed: {
								phrase: options.world.rng.phrase,
								source: options.world.rng.source,
								numericSeed: options.world.rng.numericSeed,
								designSeed: options.world.rng.designSeed,
								gameplaySeeds: { ...options.world.rng.gameplaySeeds },
							},
							snapshot: JSON.stringify(snapshot),
							playTimeMs: options.world.time.elapsedMs,
							savedAt: Date.now(),
						}),
					)
					.then(() => pushAlert("Game saved", "info"))
					.catch((err: unknown) => {
						console.error("[tacticalRuntime] Save failed:", err);
						pushAlert("Save failed", "critical");
					});
			}
		}
	}

	// ═══════════════════════════════════════════════════════
	// Selection helpers
	// ═══════════════════════════════════════════════════════

	function clearSelectionState(): void {
		for (const eid of options.world.runtime.alive) {
			Selection.selected[eid] = 0;
		}
	}

	function selectEntitiesInWorldRect(
		startX: number,
		startY: number,
		endX: number,
		endY: number,
	): void {
		const minX = Math.min(startX, endX);
		const maxX = Math.max(startX, endX);
		const minY = Math.min(startY, endY);
		const maxY = Math.max(startY, endY);
		let selectedCount = 0;
		for (const eid of options.world.runtime.alive) {
			const selectable = Faction.id[eid] === 1 && Flags.isResource[eid] === 0;
			const inside =
				Position.x[eid] >= minX &&
				Position.x[eid] <= maxX &&
				Position.y[eid] >= minY &&
				Position.y[eid] <= maxY;
			Selection.selected[eid] = selectable && inside ? 1 : 0;
			if (Selection.selected[eid] === 1) selectedCount++;
		}
		if (selectedCount === 0) {
			clearSelectionState();
			return;
		}
		playSfx("unitSelect");
	}

	function handlePrimaryAction(worldX: number, worldY: number): void {
		const selected = getSelectedEntityIds();
		const targetEid = findNearestEntity(worldX, worldY);
		if (targetEid != null && Faction.id[targetEid] === 1 && Flags.isResource[targetEid] === 0) {
			clearSelectionState();
			Selection.selected[targetEid] = 1;
			return;
		}
		if (selected.length > 0) {
			moveSelectedEntities(worldX, worldY);
			return;
		}
		if (targetEid != null) {
			clearSelectionState();
			Selection.selected[targetEid] = 1;
		}
	}

	function handleSecondaryAction(worldX: number, worldY: number): void {
		if (getSelectedEntityIds().length === 0) return;
		const order = resolveContextualOrder(worldX, worldY);
		issueOrderToSelected(order);
	}

	// ═══════════════════════════════════════════════════════
	// Minimap helpers
	// ═══════════════════════════════════════════════════════

	function getMinimapLayout(): { x: number; y: number; width: number; height: number } {
		const sw = ljs.mainCanvasSize.x;
		const sh = ljs.mainCanvasSize.y;
		const minimapWidth = Math.min(200, Math.max(160, Math.round(sw * 0.26)));
		const minimapHeight = Math.min(150, Math.max(110, Math.round(sh * 0.24)));
		return {
			x: sw - minimapWidth - MINIMAP_MARGIN,
			y: sh - minimapHeight - MINIMAP_MARGIN,
			width: minimapWidth,
			height: minimapHeight,
		};
	}

	function screenPointInMinimap(screenX: number, screenY: number): boolean {
		const m = getMinimapLayout();
		return (
			screenX >= m.x && screenX <= m.x + m.width && screenY >= m.y && screenY <= m.y + m.height
		);
	}

	function worldPointFromMinimap(screenX: number, screenY: number): { x: number; y: number } {
		const m = getMinimapLayout();
		const worldSize = getWorldPixelSize();
		const localX = (screenX - m.x) / m.width;
		const localY = (screenY - m.y) / m.height;
		return {
			x: Math.max(0, Math.min(worldSize.width, localX * worldSize.width)),
			y: Math.max(0, Math.min(worldSize.height, localY * worldSize.height)),
		};
	}

	// ═══════════════════════════════════════════════════════
	// Pixel-to-world conversion for LittleJS coordinate system.
	//
	// LittleJS uses a world coordinate system where Y increases upward
	// and cameraPos is in world units (tiles). Our game stores positions
	// in pixel space (Position.x/y). We convert: tile = pixel / TILE_SIZE.
	// ═══════════════════════════════════════════════════════

	function pixelToTile(px: number, py: number): { x: number; y: number } {
		return { x: px / TILE_SIZE, y: py / TILE_SIZE };
	}

	function tileToPixel(tx: number, ty: number): { x: number; y: number } {
		return { x: tx * TILE_SIZE, y: ty * TILE_SIZE };
	}

	// ═══════════════════════════════════════════════════════
	// LittleJS 5 standard callbacks
	// ═══════════════════════════════════════════════════════

	function gameInit(): void {
		// Load terrain tile images and paint terrain chunks from mission definition
		const missionId = options.world.session.currentMissionId;
		if (missionId) {
			const missionDef = getMissionById(missionId);
			if (missionDef) {
				loadTerrainTiles()
					.then(() => {
						terrainChunks = paintTerrainChunked(missionDef);
					})
					.catch((err: unknown) => {
						console.error("[tacticalRuntime] Failed to paint terrain:", err);
					});
			}
		}

		// Start loading sprite atlases (async, renders use them as they become available)
		loadAllAtlases().catch((err: unknown) => {
			console.error("[tacticalRuntime] Failed to load sprite atlases:", err);
		});

		// Initialize atlas adapter for LittleJS TileInfo rendering
		initAtlasAdapter().catch((err: unknown) => {
			console.error("[tacticalRuntime] Failed to init atlas adapter:", err);
		});

		// Load building PNG images as LittleJS TileInfo objects
		// (renders on the WebGL layer — avoids Canvas2D-behind-WebGL layering issues)
		// crossOrigin must be set before src so WebGL texImage2D doesn't hit a CORS error
		const buildingBase = `${import.meta.env.BASE_URL ?? "./"}assets/tiles/buildings/`;
		for (const name of BUILDING_PNG_NAMES) {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				const texInfo = new ljs.TextureInfo(img);
				const tileInfo = new ljs.TileInfo().setFullImage(texInfo);
				buildingTileInfos.set(name, tileInfo);
			};
			img.onerror = () => {
				console.error(`[tacticalRuntime] Failed to load building image: ${buildingBase}${name}.png`);
			};
			img.src = `${buildingBase}${name}.png`;
		}

		// Load resource PNG images as LittleJS TileInfo objects
		// (renders on the WebGL layer — avoids Canvas2D-behind-WebGL layering issues)
		// crossOrigin must be set before src so WebGL texImage2D doesn't hit a CORS error
		const tileBase = `${import.meta.env.BASE_URL ?? "./"}assets/tiles/`;
		for (const [key, relPath] of Object.entries(RESOURCE_PNG_MAP)) {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				const texInfo = new ljs.TextureInfo(img);
				const tileInfo = new ljs.TileInfo().setFullImage(texInfo);
				resourceTileInfos.set(key, tileInfo);
			};
			img.onerror = () => {
				console.error(
					`[tacticalRuntime] Failed to load resource image: ${tileBase}${relPath} (key=${key})`,
				);
			};
			img.src = `${tileBase}${relPath}`;
		}

		// Initialize audio (real Tone.js engine + SFX bridge + music controller)
		initAudioRuntime();
		playAmbientMusic();

		// Initialize fog grid
		initFog();

		// Position camera on first player entity
		const worldSize = getWorldPixelSize();
		const centerTileX = worldSize.width / TILE_SIZE / 2;
		const centerTileY = worldSize.height / TILE_SIZE / 2;

		for (const eid of options.world.runtime.alive) {
			if (Faction.id[eid] === 1 && Flags.isBuilding[eid] === 1) {
				const tile = pixelToTile(Position.x[eid], Position.y[eid]);
				ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
				ljs.setCameraScale(TILE_SIZE * 2);
				return;
			}
		}
		for (const eid of options.world.runtime.alive) {
			if (Faction.id[eid] === 1) {
				const tile = pixelToTile(Position.x[eid], Position.y[eid]);
				ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
				ljs.setCameraScale(TILE_SIZE * 2);
				return;
			}
		}
		ljs.setCameraPos(ljs.vec2(centerTileX, centerTileY));
		ljs.setCameraScale(TILE_SIZE * 2);

		// Attach touch gesture listeners for mobile two-finger pan/pinch
		setupTouchGestureListeners();
	}

	/** Wire pointer events from the LittleJS canvas to the gesture detector. */
	function setupTouchGestureListeners(): void {
		const canvas = ljs.mainCanvas;
		if (!canvas || !("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;

		function makePointerState(e: PointerEvent): PointerState {
			const rect = canvas.getBoundingClientRect();
			const screenX = e.clientX - rect.left;
			const screenY = e.clientY - rect.top;
			const worldVec = ljs.screenToWorld(ljs.vec2(screenX, screenY));
			return {
				id: e.pointerId,
				x: screenX,
				y: screenY,
				worldX: worldVec.x * TILE_SIZE,
				worldY: worldVec.y * TILE_SIZE,
				isDown: true,
				time: performance.now(),
			};
		}

		function allActivePointers(): PointerState[] {
			return [...activePointers.values()];
		}

		canvas.addEventListener("pointerdown", (e: PointerEvent) => {
			if (e.pointerType !== "touch") return;
			const ps = makePointerState(e);
			activePointers.set(e.pointerId, ps);
			gestureDetector.onPointerDown(allActivePointers());
		});

		canvas.addEventListener("pointermove", (e: PointerEvent) => {
			if (e.pointerType !== "touch") return;
			const ps = makePointerState(e);
			activePointers.set(e.pointerId, ps);
			const gesture = gestureDetector.onPointerMove(allActivePointers());
			if (gesture) lastGesture = gesture;
		});

		canvas.addEventListener("pointerup", (e: PointerEvent) => {
			if (e.pointerType !== "touch") return;
			const ps = makePointerState(e);
			ps.isDown = false;
			const gesture = gestureDetector.onPointerUp([ps]);
			if (gesture) lastGesture = gesture;
			activePointers.delete(e.pointerId);
		});

		canvas.addEventListener("pointercancel", (e: PointerEvent) => {
			activePointers.delete(e.pointerId);
		});
	}

	function gameUpdate(): void {
		if (!started) return;

		// Advance world time
		options.world.time.elapsedMs += ljs.timeDelta * 1000;
		options.world.time.deltaMs = ljs.timeDelta * 1000;
		options.world.time.tick++;

		// Run game systems via callback
		options.onTick?.(options.world);

		// Process world events
		applyWorldEvents();

		// Update fog
		revealFogAroundPlayerEntities();

		// Tick floating texts (remove expired)
		tickFloatingTexts(options.world);

		// ── Input handling ──

		// Camera pan via right-drag or middle-drag
		if (ljs.mouseIsDown(2) || ljs.mouseIsDown(1)) {
			const delta = ljs.mouseDelta;
			if (delta.x !== 0 || delta.y !== 0) {
				isPanning = true;
				ljs.setCameraPos(ljs.cameraPos.subtract(delta));
			}
		} else {
			isPanning = false;
		}

		// Mouse wheel zoom
		if (ljs.mouseWheel !== 0) {
			const newScale = Math.max(
				TILE_SIZE,
				Math.min(TILE_SIZE * 5, ljs.cameraScale + ljs.mouseWheel * TILE_SIZE * 0.5),
			);
			ljs.setCameraScale(newScale);
		}

		// Touch gesture handling: two-finger pan and pinch zoom
		if (lastGesture) {
			const g = lastGesture;
			lastGesture = null;
			if (g.type === GestureType.TwoFingerDrag && g.deltaX != null && g.deltaY != null) {
				// Two-finger drag = camera pan (convert screen delta to tile delta)
				const tileDeltaX = g.deltaX / ljs.cameraScale;
				const tileDeltaY = g.deltaY / ljs.cameraScale;
				ljs.setCameraPos(ljs.cameraPos.subtract(ljs.vec2(tileDeltaX, -tileDeltaY)));
				isPanning = true;
			} else if (g.type === GestureType.Pinch && g.scale != null) {
				// Pinch = camera zoom
				const newScale = Math.max(
					TILE_SIZE,
					Math.min(TILE_SIZE * 5, ljs.cameraScale * g.scale),
				);
				ljs.setCameraScale(newScale);
			}
		}

		// Long-press check for touch (radial menu or box select start)
		if (activePointers.size === 1) {
			const holdResult = gestureDetector.onHoldCheck(
				[...activePointers.values()],
				performance.now(),
			);
			if (holdResult && holdResult.type === GestureType.LongPress) {
				// Long press starts a drag-select from the held position
				if (holdResult.currentWorldX != null && holdResult.currentWorldY != null) {
					dragStartWorldPos = {
						x: holdResult.currentWorldX,
						y: holdResult.currentWorldY,
					};
				}
			}
		}

		// Left-click / drag-select
		if (ljs.mouseWasPressed(0)) {
			const mouseWorld = ljs.mousePos;
			const mousePx = tileToPixel(mouseWorld.x, mouseWorld.y);

			// Check if click is on minimap (screen-space)
			const mouseScreen = ljs.mousePosScreen;
			if (screenPointInMinimap(mouseScreen.x, mouseScreen.y)) {
				const point = worldPointFromMinimap(mouseScreen.x, mouseScreen.y);
				const tile = pixelToTile(point.x, point.y);
				ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
			} else {
				dragStartWorldPos = { x: mousePx.x, y: mousePx.y };
				isDragging = false;
			}
		}

		if (ljs.mouseIsDown(0) && dragStartWorldPos) {
			const mouseWorld = ljs.mousePos;
			const mousePx = tileToPixel(mouseWorld.x, mouseWorld.y);
			const dx = Math.abs(mousePx.x - dragStartWorldPos.x);
			const dy = Math.abs(mousePx.y - dragStartWorldPos.y);
			if (dx > 4 || dy > 4) {
				isDragging = true;
				selectEntitiesInWorldRect(dragStartWorldPos.x, dragStartWorldPos.y, mousePx.x, mousePx.y);
				// Track selection box in screen space for visual
				const startScreen = ljs.worldToScreen(
					ljs.vec2(dragStartWorldPos.x / TILE_SIZE, dragStartWorldPos.y / TILE_SIZE),
				);
				const endScreen = ljs.mousePosScreen;
				selectionBoxScreen = {
					startX: startScreen.x,
					startY: startScreen.y,
					endX: endScreen.x,
					endY: endScreen.y,
				};
			}
		}

		if (ljs.mouseWasReleased(0)) {
			if (dragStartWorldPos && !isDragging) {
				const mouseWorld = ljs.mousePos;
				const mousePx = tileToPixel(mouseWorld.x, mouseWorld.y);
				if (inputMode === "attack-move") {
					// Attack-move: issue attack order to destination
					const selected = getSelectedEntityIds();
					if (selected.length > 0) {
						issueOrderToSelected({ type: "attack", targetX: mousePx.x, targetY: mousePx.y });
					}
					inputMode = "normal";
				} else if (inputMode === "patrol") {
					// Patrol: issue move order (patrol uses move with return logic)
					const selected = getSelectedEntityIds();
					if (selected.length > 0) {
						issueOrderToSelected({ type: "move", targetX: mousePx.x, targetY: mousePx.y });
					}
					inputMode = "normal";
				} else {
					handlePrimaryAction(mousePx.x, mousePx.y);
				}
			}
			dragStartWorldPos = null;
			isDragging = false;
			selectionBoxScreen = null;
		}

		// Right-click: contextual order or minimap move
		if (ljs.mouseWasPressed(2) && !isPanning) {
			const mouseScreen = ljs.mousePosScreen;
			if (screenPointInMinimap(mouseScreen.x, mouseScreen.y)) {
				// Right-click on minimap: move selected units to that world position
				const point = worldPointFromMinimap(mouseScreen.x, mouseScreen.y);
				if (getSelectedEntityIds().length > 0) {
					issueOrderToSelected({ type: "move", targetX: point.x, targetY: point.y });
				}
			} else {
				const mouseWorld = ljs.mousePos;
				const mousePx = tileToPixel(mouseWorld.x, mouseWorld.y);
				handleSecondaryAction(mousePx.x, mousePx.y);
			}
		}

		// Control groups
		for (let digit = 1; digit <= 9; digit++) {
			const key = `Digit${digit}`;
			if (ljs.keyWasPressed(key)) {
				if (
					ljs.keyIsDown("ControlLeft") ||
					ljs.keyIsDown("ControlRight") ||
					ljs.keyIsDown("MetaLeft") ||
					ljs.keyIsDown("MetaRight")
				) {
					const selected = getSelectedEntityIds();
					if (selected.length > 0) {
						controlGroups.set(digit, [...selected]);
					}
				} else {
					const group = controlGroups.get(digit);
					if (group && group.length > 0) {
						const alive = group.filter((eid) => options.world.runtime.alive.has(eid));
						if (alive.length > 0) {
							controlGroups.set(digit, alive);
							clearSelectionState();
							for (const eid of alive) {
								Selection.selected[eid] = 1;
							}
						}
					}
				}
			}
		}

		// Arrow key panning
		const panSpeed = 0.5; // tiles per frame
		if (ljs.keyIsDown("ArrowLeft")) ljs.setCameraPos(ljs.cameraPos.add(ljs.vec2(-panSpeed, 0)));
		if (ljs.keyIsDown("ArrowRight")) ljs.setCameraPos(ljs.cameraPos.add(ljs.vec2(panSpeed, 0)));
		if (ljs.keyIsDown("ArrowUp")) ljs.setCameraPos(ljs.cameraPos.add(ljs.vec2(0, panSpeed)));
		if (ljs.keyIsDown("ArrowDown")) ljs.setCameraPos(ljs.cameraPos.add(ljs.vec2(0, -panSpeed)));

		// ── Keyboard hotkeys ──

		// H — halt selected units (clear order queues)
		if (ljs.keyWasPressed("KeyH")) {
			const selected = getSelectedEntityIds();
			for (const eid of selected) {
				const queue = getOrderQueue(options.world, eid);
				queue.length = 0;
			}
			if (selected.length > 0) {
				pushAlert("Units halted", "info");
			}
		}

		// A — enter attack-move mode
		if (ljs.keyWasPressed("KeyA")) {
			inputMode = inputMode === "attack-move" ? "normal" : "attack-move";
			if (inputMode === "attack-move") {
				pushAlert("Attack-move: click destination", "info");
			}
		}

		// P — enter patrol mode
		if (ljs.keyWasPressed("KeyP")) {
			inputMode = inputMode === "patrol" ? "normal" : "patrol";
			if (inputMode === "patrol") {
				pushAlert("Patrol: click destination", "info");
			}
		}

		// Escape — cancel current mode, deselect all
		if (ljs.keyWasPressed("Escape")) {
			if (inputMode !== "normal") {
				inputMode = "normal";
			} else {
				clearSelectionState();
			}
		}

		// Space — center camera on last alert position
		if (ljs.keyWasPressed("Space")) {
			if (lastAlertWorldPos) {
				const tile = pixelToTile(lastAlertWorldPos.x, lastAlertWorldPos.y);
				ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
			}
		}

		// Delete — delete selected player building
		if (ljs.keyWasPressed("Delete")) {
			const selected = getSelectedEntityIds();
			for (const eid of selected) {
				if (Flags.isBuilding[eid] === 1 && Faction.id[eid] === 1) {
					options.world.runtime.alive.delete(eid);
					Selection.selected[eid] = 0;
					pushAlert("Building demolished", "warning");
				}
			}
		}

		// Clamp camera to world bounds
		const worldSize = getWorldPixelSize();
		const camSize = ljs.getCameraSize();
		const halfW = camSize.x / 2;
		const halfH = camSize.y / 2;
		const maxTileX = worldSize.width / TILE_SIZE;
		const maxTileY = worldSize.height / TILE_SIZE;
		const clampedX = Math.max(halfW, Math.min(maxTileX - halfW, ljs.cameraPos.x));
		const clampedY = Math.max(halfH, Math.min(maxTileY - halfH, ljs.cameraPos.y));
		if (clampedX !== ljs.cameraPos.x || clampedY !== ljs.cameraPos.y) {
			ljs.setCameraPos(ljs.vec2(clampedX, clampedY));
		}

		// Sync bridge state
		syncBridgeState();

		// Update runtime datasets on container
		options.container.dataset.runtime = "littlejs";
		options.container.dataset.runtimeEntities = String(options.world.runtime.alive.size);
		options.container.dataset.runtimeTick = String(options.world.time.tick);
		options.container.dataset.runtimeSelected = String(getSelectedEntityIds().length);
		options.container.dataset.runtimeCameraX = ljs.cameraPos.x.toFixed(2);
		options.container.dataset.runtimeCameraY = ljs.cameraPos.y.toFixed(2);
		options.container.dataset.runtimeWeather = options.world.runtime.weather;
	}

	function gameUpdatePost(): void {
		// Reserved for post-update logic (bridge batch updates, etc.)
	}

	function gameRender(): void {
		// ── Terrain (pre-rendered tile chunks from tilePainter) ──
		if (terrainChunks.length > 0) {
			const ctx = ljs.mainContext;
			const scale = ljs.cameraScale;
			const camPos = ljs.cameraPos;
			const canvasW = ljs.mainCanvas.width;
			const canvasH = ljs.mainCanvas.height;
			// LittleJS camera: center of screen = cameraPos in world units
			// LittleJS worldToScreen: screenX = (wx - cx) * scale + W/2
			//                         screenY = (wy - cy) * -scale + H/2  (Y-up)
			// Canvas2D drawImage uses Y-down, so we flip the image vertically.
			const camPixelX = camPos.x * TILE_SIZE;
			const camPixelY = camPos.y * TILE_SIZE;
			const screenScale = scale / TILE_SIZE;
			for (const chunk of terrainChunks) {
				// Chunk is in pixel coords (chunk.x, chunk.y) with Y-down convention.
				// Apply LittleJS Y-flip: negate Y component.
				const screenX = (chunk.x - camPixelX) * screenScale + canvasW / 2;
				const screenYGameTop = -(chunk.y - camPixelY) * screenScale + canvasH / 2;
				const screenW = chunk.width * screenScale;
				const screenH = chunk.height * screenScale;
				// In LittleJS screen space, the chunk spans from
				// screenYGameTop - screenH (screen top) to screenYGameTop (screen bottom)
				const screenTop = screenYGameTop - screenH;
				// Frustum cull
				if (
					screenX + screenW < 0 ||
					screenTop + screenH < 0 ||
					screenX > canvasW ||
					screenTop > canvasH
				)
					continue;
				// Draw chunk flipped vertically to match LittleJS Y-up convention
				ctx.save();
				ctx.translate(screenX, screenYGameTop);
				ctx.scale(1, -1);
				ctx.drawImage(chunk.canvas, 0, 0, screenW, screenH);
				ctx.restore();
			}
		} else {
			// Fallback: flat color terrain while tiles load
			const terrainGrid = options.world.runtime.terrainGrid;
			if (terrainGrid) {
				const camSize = ljs.getCameraSize();
				const camPos = ljs.cameraPos;
				const startTileX = Math.max(0, Math.floor(camPos.x - camSize.x / 2));
				const startTileY = Math.max(0, Math.floor(camPos.y - camSize.y / 2));
				const endTileX = Math.min(
					terrainGrid[0]?.length ?? 0,
					Math.ceil(camPos.x + camSize.x / 2) + 1,
				);
				const endTileY = Math.min(terrainGrid.length, Math.ceil(camPos.y + camSize.y / 2) + 1);
				for (let ty = startTileY; ty < endTileY; ty++) {
					const row = terrainGrid[ty];
					if (!row) continue;
					for (let tx = startTileX; tx < endTileX; tx++) {
						const terrainId = row[tx];
						const color = TERRAIN_COLORS[terrainId] ?? TERRAIN_COLORS[TerrainTypeId.grass];
						ljs.drawRect(
							ljs.vec2(tx + 0.5, ty + 0.5),
							ljs.vec2(1, 1),
							new ljs.Color(color[0], color[1], color[2], color[3]),
						);
					}
				}
			}
		}

		// ── Weather overlay ──
		if (options.world.runtime.weather === "rain") {
			const camSize = ljs.getCameraSize();
			ljs.drawRect(ljs.cameraPos, camSize, new ljs.Color(0.23, 0.51, 0.96, 0.08));
		} else if (options.world.runtime.weather === "monsoon") {
			const camSize = ljs.getCameraSize();
			ljs.drawRect(ljs.cameraPos, camSize, new ljs.Color(0.12, 0.25, 0.69, 0.16));
		}

		// ── Entities ──
		const atlasReady = isAtlasAdapterReady();
		const worldElapsed = options.world.time.elapsedMs;

		for (const eid of options.world.runtime.alive) {
			const px = Position.x[eid];
			const py = Position.y[eid];
			const tile = pixelToTile(px, py);

			// Fog culling: don't render entities in unexplored tiles (unless player)
			if (fogGrid && fogGridWidth > 0 && Faction.id[eid] !== 1) {
				const tileX = Math.floor(px / TILE_SIZE);
				const tileY = Math.floor(py / TILE_SIZE);
				if (tileX >= 0 && tileY >= 0 && tileX < fogGridWidth && tileY < fogGridHeight) {
					if (fogGrid[tileY * fogGridWidth + tileX] < 2) continue;
				}
			}

			const isBuilding = Flags.isBuilding[eid] === 1;
			const isResource = Flags.isResource[eid] === 1;
			const isSelected = Selection.selected[eid] === 1;
			const factionId = Faction.id[eid];
			const entityType = options.world.runtime.entityTypeIndex.get(eid);

			// Entity color (used for buildings, resources, and unit fallback)
			const entityColor = isResource
				? new ljs.Color(0.98, 0.8, 0.08, 1)
				: factionId === 1
					? new ljs.Color(0.13, 0.77, 0.37, 1)
					: factionId === 2
						? new ljs.Color(0.94, 0.27, 0.27, 1)
						: new ljs.Color(0.8, 0.84, 0.88, 1);

			const tilePos = ljs.vec2(tile.x, tile.y);

			if (isBuilding) {
				// Construction progress (0-100 normalized to 0-1)
				const rawProgress = Construction.buildTime[eid] > 0 ? Construction.progress[eid] : -1;
				const constructionProg = rawProgress >= 0 ? rawProgress / 100 : -1;
				const isUnderConstruction = constructionProg >= 0 && constructionProg < 1;

				// Try PNG rendering via LittleJS drawTile (WebGL layer)
				const buildingTile = entityType ? buildingTileInfos.get(entityType) : undefined;
				if (buildingTile) {
					// Building occupies 2x2 tiles
					const buildColor = isUnderConstruction
						? new ljs.Color(1, 1, 1, 0.4)
						: ljs.WHITE;
					ljs.drawTile(tilePos, ljs.vec2(2, 2), buildingTile, buildColor);
				} else {
					// Fallback: colored rectangle while image loads
					const outlineColor =
						factionId === 1
							? new ljs.Color(0.05, 0.35, 0.15, 1)
							: factionId === 2
								? new ljs.Color(0.5, 0.1, 0.1, 1)
								: new ljs.Color(0.4, 0.42, 0.44, 1);
					ljs.drawRect(tilePos, ljs.vec2(0.9, 0.9), outlineColor);
					if (isUnderConstruction) {
						const buildAlpha = 0.4 + 0.6 * constructionProg;
						ljs.drawRect(
							tilePos,
							ljs.vec2(0.8, 0.8),
							new ljs.Color(entityColor.r, entityColor.g, entityColor.b, buildAlpha),
						);
					} else {
						ljs.drawRect(tilePos, ljs.vec2(0.8, 0.8), entityColor);
					}
				}

				// Construction progress bar (under construction)
				if (isUnderConstruction) {
					const barWidth = 0.8;
					const barHeight = 0.07;
					const barY = tilePos.y + 0.55;
					// Background
					ljs.drawRect(
						ljs.vec2(tilePos.x, barY),
						ljs.vec2(barWidth, barHeight),
						new ljs.Color(0.2, 0.2, 0.2, 0.8),
					);
					// Fill
					const fillWidth = barWidth * constructionProg;
					ljs.drawRect(
						ljs.vec2(tilePos.x - (barWidth - fillWidth) / 2, barY),
						ljs.vec2(fillWidth, barHeight),
						new ljs.Color(0.3, 0.6, 0.95, 0.9),
					);
					// Progress percentage text
					const pctText = `${Math.round(constructionProg * 100)}%`;
					ljs.drawText(
						pctText,
						ljs.vec2(tilePos.x, barY + 0.12),
						0.12,
						new ljs.Color(1, 1, 1, 0.9),
					);
				}

				// Building label text below — white text with dark shadow for readability
				if (entityType) {
					const label = entityType.replace(/_/g, " ");
					ljs.drawText(
						label,
						ljs.vec2(tilePos.x + 0.02, tilePos.y - 0.57),
						0.15,
						new ljs.Color(0, 0, 0, 0.7),
					);
					ljs.drawText(
						label,
						ljs.vec2(tilePos.x, tilePos.y - 0.55),
						0.15,
						new ljs.Color(1, 1, 1, 0.95),
					);
				}
			} else if (isResource) {
				// Resources: try PNG tile first, fall back to procedural shapes
				const resType = entityType ?? "resource";
				const resTileInfo = entityType ? resourceTileInfos.get(entityType) : undefined;

				// Log once per resource type when PNG tile is missing (debug aid)
				if (!resTileInfo && entityType && !loggedMissingResourceTypes.has(entityType)) {
					loggedMissingResourceTypes.add(entityType);
					const hasPngEntry = entityType in RESOURCE_PNG_MAP;
					console.warn(
						`[tacticalRuntime] Resource eid=${eid} type="${entityType}" ` +
							`has no loaded TileInfo (PNG mapped=${hasPngEntry}, ` +
							`loaded=${resourceTileInfos.size}/${Object.keys(RESOURCE_PNG_MAP).length})`,
					);
				}

				if (resTileInfo) {
					// Render resource PNG via LittleJS drawTile (WebGL layer, no layering issues)
					ljs.drawTile(tilePos, ljs.vec2(1, 1), resTileInfo);
				} else if (resType.includes("fish") || resType.includes("shellfish")) {
					// Fish spots: larger blue circle with sparkle highlights (no specific PNG)
					ljs.drawCircle(tilePos, 0.5, new ljs.Color(0.15, 0.4, 0.75, 0.8));
					ljs.drawCircle(tilePos, 0.35, new ljs.Color(0.2, 0.55, 0.9, 1));
					const sparkleTime = worldElapsed * 0.003;
					const sparkleOffset1 = Math.sin(sparkleTime) * 0.15;
					const sparkleOffset2 = Math.cos(sparkleTime * 1.3) * 0.12;
					ljs.drawCircle(
						ljs.vec2(tilePos.x + sparkleOffset1, tilePos.y + 0.1),
						0.08,
						new ljs.Color(0.9, 0.95, 1, 0.9),
					);
					ljs.drawCircle(
						ljs.vec2(tilePos.x - 0.1, tilePos.y + sparkleOffset2),
						0.06,
						new ljs.Color(0.85, 0.92, 1, 0.7),
					);
				} else if (
					resType.includes("tree") ||
					resType.includes("mangrove") ||
					resType.includes("lumber")
				) {
					// Trees fallback while image loads
					ljs.drawRect(tilePos, ljs.vec2(0.12, 0.5), new ljs.Color(0.35, 0.22, 0.1, 1));
					ljs.drawCircle(
						ljs.vec2(tilePos.x, tilePos.y + 0.2),
						0.6,
						new ljs.Color(0.08, 0.42, 0.12, 1),
					);
					ljs.drawCircle(
						ljs.vec2(tilePos.x - 0.1, tilePos.y + 0.3),
						0.25,
						new ljs.Color(0.15, 0.6, 0.2, 0.7),
					);
				} else if (
					resType.includes("salvage") ||
					resType.includes("cache") ||
					resType.includes("scrap")
				) {
					// Salvage fallback while image loads
					ljs.drawRect(tilePos, ljs.vec2(0.6, 0.5), new ljs.Color(0.55, 0.35, 0.1, 1));
					ljs.drawRect(tilePos, ljs.vec2(0.5, 0.4), new ljs.Color(0.85, 0.6, 0.2, 1));
					ljs.drawRect(tilePos, ljs.vec2(0.5, 0.06), new ljs.Color(0.45, 0.3, 0.08, 0.8));
					ljs.drawRect(tilePos, ljs.vec2(0.06, 0.4), new ljs.Color(0.45, 0.3, 0.08, 0.8));
				} else {
					// Generic resource: yellow circle fallback
					ljs.drawCircle(tilePos, 0.45, entityColor);
				}
				// Resource label — with dark shadow
				if (entityType) {
					const resLabel = entityType.replace(/_/g, " ");
					ljs.drawText(
						resLabel,
						ljs.vec2(tilePos.x + 0.02, tilePos.y - 0.62),
						0.13,
						new ljs.Color(0, 0, 0, 0.6),
					);
					ljs.drawText(
						resLabel,
						ljs.vec2(tilePos.x, tilePos.y - 0.6),
						0.13,
						new ljs.Color(1, 0.9, 0.5, 0.9),
					);
				}
			} else {
				// Units: try sprite rendering via atlas adapter, fall back to circles
				let rendered = false;
				if (atlasReady && entityType) {
					// Determine animation based on entity state
					const orderQueue = options.world.runtime.orderQueues.get(eid);
					const currentOrder = orderQueue?.[0]?.type;
					const isMoving = currentOrder === "move";
					const animName = isMoving ? "Run" : currentOrder === "attack" ? "Spin" : "Idle";

					const tileInfo = getEntityTileInfo(entityType, animName, worldElapsed);
					if (tileInfo) {
						const drawSize = getEntityDrawSize(entityType);
						let size = drawSize ? ljs.vec2(drawSize.x, drawSize.y) : ljs.vec2(1.2, 1.2);

						// Flip sprite horizontally when moving left
						// Check target position vs current position for direction
						if (isMoving && orderQueue?.[0]) {
							const targetX = orderQueue[0].targetX;
							if (targetX !== undefined && targetX < px) {
								// Moving left: flip by making width negative
								size = ljs.vec2(-Math.abs(size.x), size.y);
							}
						}

						ljs.drawTile(tilePos, size, tileInfo);
						rendered = true;
					}
				}
				if (!rendered) {
					// Atlas not ready yet — skip rendering until loaded.
					// After atlas init, missing sprites are an error (no fallback shapes).
				}

				// Red faction ring for enemy units (factionId === 2) so they stand out
				if (factionId === 2) {
					ljs.drawCircle(
						tilePos,
						0.45,
						new ljs.Color(0, 0, 0, 0), // transparent fill
						0.04,
						new ljs.Color(0.94, 0.27, 0.27, 0.75), // red outline
					);
				}
			}

			// Selection ring — bright white ring with green glow, pulsing opacity
			if (isSelected) {
				const ringRadius = isBuilding ? 0.6 : 0.5;
				// Pulsing opacity: cycles between 0.6 and 1.0 based on world time
				const pulseAlpha = 0.6 + 0.4 * Math.sin(worldElapsed * 0.005);
				// Green glow fill
				ljs.drawCircle(
					tilePos,
					ringRadius,
					new ljs.Color(0.2, 0.9, 0.3, 0.15 * pulseAlpha), // green glow fill
					0.06, // thicker lineWidth
					new ljs.Color(1, 1, 1, pulseAlpha), // white stroke
				);
				// Second ring for green glow effect
				ljs.drawCircle(
					tilePos,
					ringRadius + 0.03,
					new ljs.Color(0, 0, 0, 0), // transparent fill
					0.03, // lineWidth
					new ljs.Color(0.3, 1, 0.4, 0.5 * pulseAlpha), // green outer glow
				);
			}

			// HP bar — shown for ALL units/buildings that are damaged OR selected
			// Also always shown for non-resource entities so players can see health
			const hpCurrent = Health.current[eid];
			const hpMax = Health.max[eid];
			if (hpMax > 0 && hpCurrent > 0 && (hpCurrent < hpMax || isSelected) && !isResource) {
				const barWidth = isBuilding ? 0.8 : 0.5;
				const barHeight = 0.06;
				const barY = tile.y + (isBuilding ? 0.5 : 0.35);
				const hpRatio = hpCurrent / hpMax;
				// Background
				ljs.drawRect(
					ljs.vec2(tile.x, barY),
					ljs.vec2(barWidth, barHeight),
					new ljs.Color(0.2, 0.2, 0.2, 0.8),
				);
				// Fill
				const fillColor =
					hpRatio > 0.5
						? new ljs.Color(0.13, 0.77, 0.37, 0.9)
						: hpRatio > 0.25
							? new ljs.Color(0.98, 0.8, 0.08, 0.9)
							: new ljs.Color(0.94, 0.27, 0.27, 0.9);
				const fillWidth = barWidth * hpRatio;
				ljs.drawRect(
					ljs.vec2(tile.x - (barWidth - fillWidth) / 2, barY),
					ljs.vec2(fillWidth, barHeight),
					fillColor,
				);
			}

			// Rank emblem using the full emblem system from rankEmblems.ts
			// This draws faction badges + unit-type symbols (chevron, star, etc.)
			if (!isBuilding && !isResource && entityType && hasEmblem(entityType)) {
				const screenPos = ljs.worldToScreen(ljs.vec2(tile.x, tile.y));
				const spriteScreenW = ljs.cameraScale * 0.6;
				const ctx = ljs.mainContext;
				ctx.save();
				ctx.translate(screenPos.x - spriteScreenW / 2, screenPos.y - spriteScreenW);
				drawRankEmblem(ctx, entityType, spriteScreenW);
				ctx.restore();
			}
		}

		// ── Fog of war overlay (smoothed edges) ──
		if (fogGrid && fogGridWidth > 0 && fogGridHeight > 0) {
			const fg = fogGrid; // capture for closure
			const camSize = ljs.getCameraSize();
			const camPos = ljs.cameraPos;
			const startTileX = Math.max(0, Math.floor(camPos.x - camSize.x / 2));
			const startTileY = Math.max(0, Math.floor(camPos.y - camSize.y / 2));
			const endTileX = Math.min(fogGridWidth, Math.ceil(camPos.x + camSize.x / 2) + 1);
			const endTileY = Math.min(fogGridHeight, Math.ceil(camPos.y + camSize.y / 2) + 1);

			// Helper: get fog state with bounds check (out of bounds = unexplored)
			const getFog = (x: number, y: number): number => {
				if (x < 0 || y < 0 || x >= fogGridWidth || y >= fogGridHeight) return 0;
				return fg[y * fogGridWidth + x];
			};

			for (let ty = startTileY; ty < endTileY; ty++) {
				for (let tx = startTileX; tx < endTileX; tx++) {
					const fogState = getFog(tx, ty);

					if (fogState === 2) {
						// Fully visible — check if any neighbor is less visible for soft edge
						let minNeighbor = 2;
						for (let dy = -1; dy <= 1; dy++) {
							for (let dx = -1; dx <= 1; dx++) {
								if (dx === 0 && dy === 0) continue;
								minNeighbor = Math.min(minNeighbor, getFog(tx + dx, ty + dy));
							}
						}
						// Draw a subtle darkening at edges where visibility drops
						if (minNeighbor < 2) {
							const edgeAlpha = minNeighbor === 0 ? 0.18 : 0.08;
							ljs.drawRect(
								ljs.vec2(tx + 0.5, ty + 0.5),
								ljs.vec2(1, 1),
								new ljs.Color(0, 0, 0, edgeAlpha),
							);
						}
					} else if (fogState === 1) {
						// Explored but not visible — check neighbor average for soft transition
						let visibleNeighbors = 0;
						let totalNeighbors = 0;
						for (let dy = -1; dy <= 1; dy++) {
							for (let dx = -1; dx <= 1; dx++) {
								if (dx === 0 && dy === 0) continue;
								totalNeighbors++;
								if (getFog(tx + dx, ty + dy) === 2) visibleNeighbors++;
							}
						}
						// Blend: more visible neighbors = less fog
						const baseAlpha = 0.45;
						const blend = totalNeighbors > 0 ? visibleNeighbors / totalNeighbors : 0;
						const alpha = baseAlpha - blend * 0.2;
						ljs.drawRect(
							ljs.vec2(tx + 0.5, ty + 0.5),
							ljs.vec2(1, 1),
							new ljs.Color(0, 0, 0, alpha),
						);
					} else {
						// Unexplored — check if any neighbor is explored for soft edge
						let maxNeighbor = 0;
						for (let dy = -1; dy <= 1; dy++) {
							for (let dx = -1; dx <= 1; dx++) {
								if (dx === 0 && dy === 0) continue;
								maxNeighbor = Math.max(maxNeighbor, getFog(tx + dx, ty + dy));
							}
						}
						// Fully dark with slightly softer edge near explored areas
						const alpha = maxNeighbor > 0 ? 0.72 : 0.88;
						ljs.drawRect(
							ljs.vec2(tx + 0.5, ty + 0.5),
							ljs.vec2(1, 1),
							new ljs.Color(0, 0, 0, alpha),
						);
					}
				}
			}
		}

		// ── Floating combat text ──
		const now = options.world.time.elapsedMs;
		for (const ft of options.world.runtime.floatingTexts) {
			const age = now - ft.spawnedAtMs;
			const progress = Math.min(1, age / ft.durationMs);
			const alpha = 1 - progress;
			const driftY = progress * 1.2; // drift upward in tile units
			const ftTile = pixelToTile(ft.x, ft.y);
			const textColor =
				ft.color === "red"
					? new ljs.Color(0.94, 0.27, 0.27, alpha)
					: ft.color === "green"
						? new ljs.Color(0.13, 0.77, 0.37, alpha)
						: ft.color === "yellow"
							? new ljs.Color(0.98, 0.8, 0.08, alpha)
							: new ljs.Color(1, 1, 1, alpha);
			ljs.drawText(ft.text, ljs.vec2(ftTile.x, ftTile.y + driftY), 0.4, textColor);
		}
	}

	function gameRenderPost(): void {
		// ── CRT-styled Minimap (drawn in screen space via overlayCanvas) ──
		const ctx = ljs.drawContext;
		if (!ctx) return;

		const minimap = getMinimapLayout();
		const worldSize = getWorldPixelSize();

		// CRT dark background with green tint
		ctx.fillStyle = "#0a1a0f";
		ctx.fillRect(minimap.x, minimap.y, minimap.width, minimap.height);

		// Terrain colors
		const tGrid = options.world.runtime.terrainGrid;
		if (tGrid) {
			const gridH = tGrid.length;
			const gridW = gridH > 0 ? tGrid[0].length : 0;
			if (gridW > 0 && gridH > 0) {
				const tileW = minimap.width / gridW;
				const tileH = minimap.height / gridH;
				for (let ty = 0; ty < gridH; ty++) {
					for (let tx = 0; tx < gridW; tx++) {
						const tileType = tGrid[ty][tx];
						ctx.fillStyle = MINIMAP_TERRAIN_COLORS[tileType] ?? "#0a1a0f";
						ctx.fillRect(
							minimap.x + tx * tileW,
							minimap.y + ty * tileH,
							Math.ceil(tileW),
							Math.ceil(tileH),
						);
					}
				}
			}
		}

		// Fog overlay on minimap
		if (fogGrid && fogGridWidth > 0 && fogGridHeight > 0) {
			const fTileW = minimap.width / fogGridWidth;
			const fTileH = minimap.height / fogGridHeight;
			for (let fy = 0; fy < fogGridHeight; fy++) {
				for (let fx = 0; fx < fogGridWidth; fx++) {
					const fogState = fogGrid[fy * fogGridWidth + fx];
					if (fogState === 0) {
						ctx.fillStyle = "rgba(10, 26, 15, 0.8)";
						ctx.fillRect(
							minimap.x + fx * fTileW,
							minimap.y + fy * fTileH,
							Math.ceil(fTileW),
							Math.ceil(fTileH),
						);
					} else if (fogState === 1) {
						ctx.fillStyle = "rgba(10, 26, 15, 0.4)";
						ctx.fillRect(
							minimap.x + fx * fTileW,
							minimap.y + fy * fTileH,
							Math.ceil(fTileW),
							Math.ceil(fTileH),
						);
					}
				}
			}
		}

		// CRT scanline effect: thin horizontal lines every 2px at very low opacity
		ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
		for (let sy = 0; sy < minimap.height; sy += 2) {
			ctx.fillRect(minimap.x, minimap.y + sy, minimap.width, 1);
		}

		// CRT green border (1px, #22c55e at 50% opacity)
		ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
		ctx.lineWidth = 1;
		ctx.strokeRect(minimap.x + 0.5, minimap.y + 0.5, minimap.width - 1, minimap.height - 1);

		// Entity dots on minimap — brighter CRT-styled colors
		for (const eid of options.world.runtime.alive) {
			const dotPx = minimap.x + (Position.x[eid] / Math.max(1, worldSize.width)) * minimap.width;
			const dotPy = minimap.y + (Position.y[eid] / Math.max(1, worldSize.height)) * minimap.height;

			if (fogGrid && fogGridWidth > 0 && Faction.id[eid] !== 1) {
				const tileX = Math.floor(Position.x[eid] / TILE_SIZE);
				const tileY = Math.floor(Position.y[eid] / TILE_SIZE);
				if (tileX >= 0 && tileY >= 0 && tileX < fogGridWidth && tileY < fogGridHeight) {
					if (fogGrid[tileY * fogGridWidth + tileX] < 2) continue;
				}
			}

			// Bright CRT entity colors: player=#22c55e, enemy=#ef4444, resource=#facc15
			ctx.fillStyle =
				Flags.isResource[eid] === 1
					? "#facc15"
					: Faction.id[eid] === 1
						? "#22c55e"
						: Faction.id[eid] === 2
							? "#ef4444"
							: "#94a3b8";
			const dotSize = Flags.isBuilding[eid] === 1 ? 5 : 3;
			ctx.fillRect(
				dotPx - Math.floor(dotSize / 2),
				dotPy - Math.floor(dotSize / 2),
				dotSize,
				dotSize,
			);
		}

		// Camera viewport rectangle in bright white (#f8fafc)
		const camSize = ljs.getCameraSize();
		const viewportRectW = Math.min(
			minimap.width,
			((camSize.x * TILE_SIZE) / Math.max(1, worldSize.width)) * minimap.width,
		);
		const viewportRectH = Math.min(
			minimap.height,
			((camSize.y * TILE_SIZE) / Math.max(1, worldSize.height)) * minimap.height,
		);
		const camWorldPx = tileToPixel(
			ljs.cameraPos.x - camSize.x / 2,
			ljs.cameraPos.y - camSize.y / 2,
		);
		const viewportRectX = minimap.x + (camWorldPx.x / Math.max(1, worldSize.width)) * minimap.width;
		const viewportRectY =
			minimap.y + (camWorldPx.y / Math.max(1, worldSize.height)) * minimap.height;
		ctx.strokeStyle = "#f8fafc";
		ctx.lineWidth = 1.5;
		ctx.strokeRect(viewportRectX, viewportRectY, viewportRectW, viewportRectH);

		// ── Selection box overlay ──
		if (selectionBoxScreen) {
			const minX = Math.min(selectionBoxScreen.startX, selectionBoxScreen.endX);
			const minY = Math.min(selectionBoxScreen.startY, selectionBoxScreen.endY);
			const boxWidth = Math.abs(selectionBoxScreen.endX - selectionBoxScreen.startX);
			const boxHeight = Math.abs(selectionBoxScreen.endY - selectionBoxScreen.startY);
			ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
			ctx.fillRect(minX, minY, boxWidth, boxHeight);
			ctx.strokeStyle = "rgba(134, 239, 172, 0.95)";
			ctx.lineWidth = 1;
			ctx.strokeRect(minX, minY, boxWidth, boxHeight);
		}
	}

	// ═══════════════════════════════════════════════════════
	// Public TacticalRuntime interface
	// ═══════════════════════════════════════════════════════

	return {
		async start(): Promise<void> {
			if (started) return;
			started = true;
			if (options.world.session.phase !== "playing") {
				options.world.session.phase = "playing";
			}

			if (!engineInitialized) {
				engineInitialized = true;

				// Configure LittleJS settings before engineInit
				ljs.setShowSplashScreen(false);
				ljs.setDebugWatermark(false);
				ljs.setCanvasPixelated(true);
				ljs.setTilesPixelated(true);
				ljs.setCanvasClearColor(new ljs.Color(0.05, 0.15, 0.08));

				// All 12 sprite atlas PNGs as image sources
				const BASE = import.meta.env.BASE_URL ?? "./";
				const atlasNames = [
					"otter",
					"crocodile",
					"boar",
					"cobra",
					"fox",
					"hedgehog",
					"naked_mole_rat",
					"porcupine",
					"skunk",
					"snake",
					"squirrel",
					"vulture",
				];
				const imageSources = atlasNames.map((name) => `${BASE}assets/sprites/${name}.png`);

				await ljs.engineInit(
					gameInit,
					gameUpdate,
					gameUpdatePost,
					gameRender,
					gameRenderPost,
					imageSources,
					options.container,
				);
			}
		},

		async stop(): Promise<void> {
			if (!started) return;
			started = false;
			// LittleJS doesn't have a clean shutdown API, but we can pause
			ljs.setPaused(true);
			delete options.container.dataset.runtime;
			delete options.container.dataset.runtimeEntities;
			delete options.container.dataset.runtimeTick;
			delete options.container.dataset.runtimeSelected;
			delete options.container.dataset.runtimeCameraX;
			delete options.container.dataset.runtimeCameraY;
		},

		resize(_width: number, _height: number): void {
			// LittleJS handles canvas resizing internally via its canvas system.
			// No-op: the engine auto-sizes to the container element.
		},

		clearSelection(): void {
			clearSelectionState();
			syncBridgeState();
		},

		dismissDialogue(): void {
			options.world.session.dialogue = null;
			syncBridgeState();
		},

		recenter(): void {
			const selected = getSelectedEntityIds();
			if (selected.length > 0) {
				const anchor = selected[0];
				const tile = pixelToTile(Position.x[anchor], Position.y[anchor]);
				ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
				return;
			}
			for (const eid of options.world.runtime.alive) {
				if (Faction.id[eid] === 1) {
					const tile = pixelToTile(Position.x[eid], Position.y[eid]);
					ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
					return;
				}
			}
		},

		zoomIn(): void {
			ljs.setCameraScale(Math.min(TILE_SIZE * 5, ljs.cameraScale + TILE_SIZE * 0.5));
		},

		zoomOut(): void {
			ljs.setCameraScale(Math.max(TILE_SIZE, ljs.cameraScale - TILE_SIZE * 0.5));
		},

		selectInScreenRect(
			startClientX: number,
			startClientY: number,
			endClientX: number,
			endClientY: number,
		): void {
			// Convert screen to world via LittleJS screenToWorld
			const rect = options.container.getBoundingClientRect();
			const startScreen = ljs.vec2(startClientX - rect.left, startClientY - rect.top);
			const endScreen = ljs.vec2(endClientX - rect.left, endClientY - rect.top);
			const startWorld = ljs.screenToWorld(startScreen);
			const endWorld = ljs.screenToWorld(endScreen);
			const startPx = tileToPixel(startWorld.x, startWorld.y);
			const endPx = tileToPixel(endWorld.x, endWorld.y);
			selectEntitiesInWorldRect(startPx.x, startPx.y, endPx.x, endPx.y);
			syncBridgeState();
		},

		recenterFromMinimap(screenX: number, screenY: number): void {
			const point = worldPointFromMinimap(screenX, screenY);
			const tile = pixelToTile(point.x, point.y);
			ljs.setCameraPos(ljs.vec2(tile.x, tile.y));
		},

		getControlGroups(): Map<number, number[]> {
			return controlGroups;
		},
	};
}

export async function canLoadTacticalRuntime(): Promise<boolean> {
	try {
		if (typeof window === "undefined") return false;
		if (typeof AudioContext === "undefined") return false;
		await import("littlejsengine");
		return true;
	} catch {
		return false;
	}
}
