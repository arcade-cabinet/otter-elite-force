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

import { loadAllAtlases } from "@/canvas/spriteAtlas";
import {
	initAudioRuntime,
	playBattleMusic,
	playSfx,
	syncAudioFromWorld,
} from "@/engine/audio/audioRuntime";
import { TerrainTypeId } from "@/engine/content/terrainTypes";
import type { GameBridge, SelectionViewModel } from "../bridge/gameBridge";
import { serializeGameWorld } from "../persistence/gameWorldSaveLoad";
import { SqlitePersistenceStore } from "../persistence/sqlitePersistenceStore";
import { Faction, Flags, Health, Position, Selection } from "../world/components";
import type { GameWorld, Order } from "../world/gameWorld";
import { getOrderQueue } from "../world/gameWorld";

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

/** Terrain type → LittleJS Color (r, g, b, a scaled 0-1). */
const TERRAIN_COLORS: Record<number, [number, number, number, number]> = {
	[TerrainTypeId.grass]: [0.08, 0.33, 0.08, 1],
	[TerrainTypeId.water]: [0.06, 0.17, 0.25, 1],
	[TerrainTypeId.sand]: [0.76, 0.70, 0.50, 1],
	[TerrainTypeId.forest]: [0.04, 0.20, 0.04, 1],
	[TerrainTypeId.dirt]: [0.38, 0.27, 0.13, 1],
	[TerrainTypeId.stone]: [0.37, 0.38, 0.40, 1],
	[TerrainTypeId.mud]: [0.25, 0.20, 0.10, 1],
	[TerrainTypeId.mangrove]: [0.06, 0.22, 0.06, 1],
	[TerrainTypeId.bridge]: [0.40, 0.30, 0.18, 1],
	[TerrainTypeId.beach]: [0.85, 0.78, 0.58, 1],
	[TerrainTypeId.toxic_sludge]: [0.30, 0.50, 0.10, 1],
};

/** Minimap colors as CSS strings (screen-space drawing uses overlayCanvas). */
const MINIMAP_TERRAIN_COLORS: Record<number, string> = {
	[TerrainTypeId.grass]: "#1a3a1a",
	[TerrainTypeId.water]: "#0a2a4a",
	[TerrainTypeId.sand]: "#c2b280",
	[TerrainTypeId.forest]: "#0a330a",
	[TerrainTypeId.dirt]: "#3d2b1a",
	[TerrainTypeId.stone]: "#5e6166",
	[TerrainTypeId.mud]: "#2a2218",
	[TerrainTypeId.mangrove]: "#0f380f",
	[TerrainTypeId.bridge]: "#664d2e",
	[TerrainTypeId.beach]: "#d9c893",
	[TerrainTypeId.toxic_sludge]: "#4d8019",
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
				continue;
			}
			if (event.type === "enemy-spotted") {
				const ex = event.payload?.x as number | undefined;
				const ey = event.payload?.y as number | undefined;
				pushAlert("Enemy Spotted", "warning", ex, ey);
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
		return screenX >= m.x && screenX <= m.x + m.width && screenY >= m.y && screenY <= m.y + m.height;
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
		// Start loading sprite atlases (async, renders use them as they become available)
		loadAllAtlases().catch((err: unknown) => {
			console.error("[tacticalRuntime] Failed to load sprite atlases:", err);
		});

		// Initialize audio
		initAudioRuntime();
		playBattleMusic();

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
			const newScale = Math.max(TILE_SIZE, Math.min(TILE_SIZE * 5, ljs.cameraScale + ljs.mouseWheel * TILE_SIZE * 0.5));
			ljs.setCameraScale(newScale);
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
				selectEntitiesInWorldRect(
					dragStartWorldPos.x,
					dragStartWorldPos.y,
					mousePx.x,
					mousePx.y,
				);
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
				handlePrimaryAction(mousePx.x, mousePx.y);
			}
			dragStartWorldPos = null;
			isDragging = false;
			selectionBoxScreen = null;
		}

		// Right-click: contextual order or minimap move
		if (ljs.mouseWasPressed(2) && !isPanning) {
			const mouseScreen = ljs.mousePosScreen;
			if (screenPointInMinimap(mouseScreen.x, mouseScreen.y)) {
				const point = worldPointFromMinimap(mouseScreen.x, mouseScreen.y);
				if (getSelectedEntityIds().length > 0) {
					moveSelectedEntities(point.x, point.y);
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
				if (ljs.keyIsDown("ControlLeft") || ljs.keyIsDown("ControlRight") || ljs.keyIsDown("MetaLeft") || ljs.keyIsDown("MetaRight")) {
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
		// ── Terrain ──
		const terrainGrid = options.world.runtime.terrainGrid;
		if (terrainGrid) {
			const camSize = ljs.getCameraSize();
			const camPos = ljs.cameraPos;
			// Only draw visible tiles
			const startTileX = Math.max(0, Math.floor(camPos.x - camSize.x / 2));
			const startTileY = Math.max(0, Math.floor(camPos.y - camSize.y / 2));
			const endTileX = Math.min(terrainGrid[0]?.length ?? 0, Math.ceil(camPos.x + camSize.x / 2) + 1);
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

		// ── Weather overlay ──
		if (options.world.runtime.weather === "rain") {
			const camSize = ljs.getCameraSize();
			ljs.drawRect(ljs.cameraPos, camSize, new ljs.Color(0.23, 0.51, 0.96, 0.08));
		} else if (options.world.runtime.weather === "monsoon") {
			const camSize = ljs.getCameraSize();
			ljs.drawRect(ljs.cameraPos, camSize, new ljs.Color(0.12, 0.25, 0.69, 0.16));
		}

		// ── Entities ──
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

			// Entity color
			const entityColor = isResource
				? new ljs.Color(0.98, 0.80, 0.08, 1)
				: factionId === 1
					? new ljs.Color(0.13, 0.77, 0.37, 1)
					: factionId === 2
						? new ljs.Color(0.94, 0.27, 0.27, 1)
						: new ljs.Color(0.80, 0.84, 0.88, 1);

			const tilePos = ljs.vec2(tile.x, tile.y);

			if (isBuilding) {
				ljs.drawRect(tilePos, ljs.vec2(0.75, 0.75), entityColor);
				const outlineColor = factionId === 1
					? new ljs.Color(0.97, 0.98, 0.99, 1)
					: new ljs.Color(0.27, 0.04, 0.04, 1);
				ljs.drawRect(tilePos, ljs.vec2(0.8, 0.8), outlineColor.lerp(ljs.CLEAR_WHITE, 0.5));
			} else {
				ljs.drawCircle(tilePos, isResource ? 0.3 : 0.25, entityColor);
				if (!isResource) {
					const outlineColor = factionId === 1
						? new ljs.Color(0.97, 0.98, 0.99, 1)
						: new ljs.Color(0.27, 0.04, 0.04, 1);
					ljs.drawCircle(tilePos, 0.28, outlineColor.lerp(ljs.CLEAR_WHITE, 0.7));
				}
			}

			// Selection ring
			if (isSelected) {
				ljs.drawCircle(tilePos, isBuilding ? 0.55 : 0.38, ljs.CLEAR_WHITE);
				ljs.drawCircle(tilePos, isBuilding ? 0.52 : 0.35, new ljs.Color(1, 1, 1, 0.6));
			}

			// HP bar for damaged entities
			const hpCurrent = Health.current[eid];
			const hpMax = Health.max[eid];
			if (hpMax > 0 && hpCurrent < hpMax && hpCurrent > 0) {
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
				const fillColor = hpRatio > 0.5
					? new ljs.Color(0.13, 0.77, 0.37, 0.9)
					: hpRatio > 0.25
						? new ljs.Color(0.98, 0.80, 0.08, 0.9)
						: new ljs.Color(0.94, 0.27, 0.27, 0.9);
				const fillWidth = barWidth * hpRatio;
				ljs.drawRect(
					ljs.vec2(tile.x - (barWidth - fillWidth) / 2, barY),
					ljs.vec2(fillWidth, barHeight),
					fillColor,
				);
			}
		}

		// ── Fog of war overlay ──
		if (fogGrid && fogGridWidth > 0 && fogGridHeight > 0) {
			const camSize = ljs.getCameraSize();
			const camPos = ljs.cameraPos;
			const startTileX = Math.max(0, Math.floor(camPos.x - camSize.x / 2));
			const startTileY = Math.max(0, Math.floor(camPos.y - camSize.y / 2));
			const endTileX = Math.min(fogGridWidth, Math.ceil(camPos.x + camSize.x / 2) + 1);
			const endTileY = Math.min(fogGridHeight, Math.ceil(camPos.y + camSize.y / 2) + 1);

			for (let ty = startTileY; ty < endTileY; ty++) {
				for (let tx = startTileX; tx < endTileX; tx++) {
					const fogState = fogGrid[ty * fogGridWidth + tx];
					if (fogState === 0) {
						ljs.drawRect(ljs.vec2(tx + 0.5, ty + 0.5), ljs.vec2(1, 1), new ljs.Color(0, 0, 0, 0.85));
					} else if (fogState === 1) {
						ljs.drawRect(ljs.vec2(tx + 0.5, ty + 0.5), ljs.vec2(1, 1), new ljs.Color(0, 0, 0, 0.5));
					}
				}
			}
		}
	}

	function gameRenderPost(): void {
		// ── Minimap (drawn in screen space via overlayCanvas) ──
		const ctx = ljs.drawContext;
		if (!ctx) return;

		const minimap = getMinimapLayout();
		const worldSize = getWorldPixelSize();

		// Background
		ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
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
						ctx.fillStyle = MINIMAP_TERRAIN_COLORS[tileType] ?? "#1a3a1a";
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
						ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
						ctx.fillRect(minimap.x + fx * fTileW, minimap.y + fy * fTileH, Math.ceil(fTileW), Math.ceil(fTileH));
					} else if (fogState === 1) {
						ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
						ctx.fillRect(minimap.x + fx * fTileW, minimap.y + fy * fTileH, Math.ceil(fTileW), Math.ceil(fTileH));
					}
				}
			}
		}

		// Minimap border
		ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
		ctx.lineWidth = 1;
		ctx.strokeRect(minimap.x, minimap.y, minimap.width, minimap.height);

		// Entity dots on minimap
		for (const eid of options.world.runtime.alive) {
			const px = minimap.x + (Position.x[eid] / Math.max(1, worldSize.width)) * minimap.width;
			const py = minimap.y + (Position.y[eid] / Math.max(1, worldSize.height)) * minimap.height;

			if (fogGrid && fogGridWidth > 0 && Faction.id[eid] !== 1) {
				const tileX = Math.floor(Position.x[eid] / TILE_SIZE);
				const tileY = Math.floor(Position.y[eid] / TILE_SIZE);
				if (tileX >= 0 && tileY >= 0 && tileX < fogGridWidth && tileY < fogGridHeight) {
					if (fogGrid[tileY * fogGridWidth + tileX] < 2) continue;
				}
			}

			ctx.fillStyle =
				Flags.isResource[eid] === 1
					? "#facc15"
					: Faction.id[eid] === 1
						? "#22c55e"
						: Faction.id[eid] === 2
							? "#ef4444"
							: "#cbd5e1";
			ctx.fillRect(
				px - 1,
				py - 1,
				Flags.isBuilding[eid] === 1 ? 4 : 3,
				Flags.isBuilding[eid] === 1 ? 4 : 3,
			);
		}

		// Camera viewport rectangle on minimap
		const camSize = ljs.getCameraSize();
		const viewportRectW = Math.min(
			minimap.width,
			((camSize.x * TILE_SIZE) / Math.max(1, worldSize.width)) * minimap.width,
		);
		const viewportRectH = Math.min(
			minimap.height,
			((camSize.y * TILE_SIZE) / Math.max(1, worldSize.height)) * minimap.height,
		);
		const camWorldPx = tileToPixel(ljs.cameraPos.x - camSize.x / 2, ljs.cameraPos.y - camSize.y / 2);
		const viewportRectX = minimap.x + (camWorldPx.x / Math.max(1, worldSize.width)) * minimap.width;
		const viewportRectY = minimap.y + (camWorldPx.y / Math.max(1, worldSize.height)) * minimap.height;
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
				ljs.setCanvasPixelated(true);
				ljs.setTilesPixelated(true);

				// All 12 sprite atlas PNGs as image sources
				const BASE = import.meta.env.BASE_URL ?? "./";
				const atlasNames = [
					"otter", "crocodile", "boar", "cobra", "fox", "hedgehog",
					"naked_mole_rat", "porcupine", "skunk", "snake", "squirrel", "vulture",
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
