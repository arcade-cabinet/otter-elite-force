import { loadAllAtlases } from "@/canvas/spriteAtlas";
import type { GameBridge } from "../bridge/gameBridge";
import { loadTileImages } from "../rendering/assetLoader";
import { renderFogOverlay } from "../rendering/fogRenderer";
import { createSpriteRenderer, type SpriteRenderer } from "../rendering/spriteRenderer";
import { createTerrainRenderer, type TerrainRenderer } from "../rendering/terrainRenderer";
import { Faction, Flags, Health, Position, Selection } from "../world/components";
import type { GameWorld } from "../world/gameWorld";
import {
	advanceRuntimeLoopProjection,
	createInitialRuntimeLoopProjectionState,
} from "./loopProjection";

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
}

export interface TacticalRuntimeOptions {
	container: HTMLElement;
	world: GameWorld;
	bridge: GameBridge;
	onTick?: (world: GameWorld) => void;
}

interface RuntimeCamera {
	x: number;
	y: number;
	zoom: number;
}

interface PointerTrackingState {
	id: number;
	button: number;
	pointerType: string;
	startTimeMs: number;
	startClientX: number;
	startClientY: number;
	lastClientX: number;
	lastClientY: number;
	moved: boolean;
}

interface SelectionBox {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

interface MinimapLayout {
	x: number;
	y: number;
	width: number;
	height: number;
}

const TOUCH_BOX_SELECT_DELAY_MS = 260;
const MINIMAP_MARGIN = 12;

function createInitialCamera(world: GameWorld, container: HTMLElement): RuntimeCamera {
	for (const eid of world.runtime.alive) {
		if (Selection.selected[eid] === 1 || Faction.id[eid] === 1) {
			return {
				x: Math.max(0, Position.x[eid] - (container.clientWidth || 640) / 2),
				y: Math.max(0, Position.y[eid] - (container.clientHeight || 360) / 2),
				zoom: 1,
			};
		}
	}
	return { x: 0, y: 0, zoom: 1 };
}

let littleJsModulePromise: Promise<typeof import("littlejsengine")> | null = null;

async function loadLittleJsEngine(): Promise<typeof import("littlejsengine")> {
	if (typeof window === "undefined") {
		throw new Error("LittleJS runtime can only be loaded in a browser environment");
	}
	if (typeof AudioContext === "undefined") {
		throw new Error("LittleJS runtime requires AudioContext");
	}
	if (!littleJsModulePromise) {
		littleJsModulePromise = import("littlejsengine");
	}
	return littleJsModulePromise;
}

export async function createLittleJsRuntime(
	options: TacticalRuntimeOptions,
): Promise<TacticalRuntime> {
	const module = await loadLittleJsEngine();
	let started = false;
	let rafHandle = 0;
	let canvas: HTMLCanvasElement | null = null;
	let context: CanvasRenderingContext2D | null = null;
	let projection = createInitialRuntimeLoopProjectionState();
	let camera = createInitialCamera(options.world, options.container);
	const pointers = new Map<number, PointerTrackingState>();
	let lastTouchCenter: { x: number; y: number; distance: number } | null = null;
	let selectionBox: SelectionBox | null = null;
	const lastObjectiveStatuses = new Map<string, string>();
	let introAlertPublished = false;
	let lastScenarioPhase = options.world.runtime.scenarioPhase;
	let lastSessionPhase = options.world.session.phase;
	let scenarioPhaseInitialized = false;

	// ─── Rendering subsystems ───
	let terrainRenderer: TerrainRenderer | null = null;
	let spriteRenderer: SpriteRenderer | null = null;
	let fogGrid: Uint8Array | null = null;
	let fogGridWidth = 0;
	let fogGridHeight = 0;
	let renderingAssetsLoading = false;

	/** Kick off async loading of terrain tiles and sprite atlases. */
	function initRenderingAssets(): void {
		if (renderingAssetsLoading) return;
		renderingAssetsLoading = true;

		// Load sprite atlases (fire-and-forget; renderer checks atlasesLoaded())
		loadAllAtlases().catch((err: unknown) => {
			console.warn("[littlejsRuntime] Failed to load sprite atlases:", err);
		});

		// Load terrain tile images and build terrain renderer if navigation data exists
		loadTileImages()
			.then((tileImages) => {
				const navW = options.world.navigation.width;
				const navH = options.world.navigation.height;
				if (navW > 0 && navH > 0) {
					// Build a simple terrain grid from navigation dimensions
					// The actual terrain data would come from the mission definition;
					// for now, create a grass-filled grid sized to the navigation grid.
					const tileGrid: number[][] = Array.from({ length: navH }, () =>
						Array.from({ length: navW }, () => 0),
					);
					terrainRenderer = createTerrainRenderer(tileGrid, tileImages);

					// Initialize fog grid (all visible for now — scenario system will manage fog)
					fogGridWidth = navW;
					fogGridHeight = navH;
					fogGrid = new Uint8Array(navW * navH).fill(2);
				}
			})
			.catch((err: unknown) => {
				console.warn("[littlejsRuntime] Failed to load terrain tiles:", err);
			});

		// Create sprite renderer immediately (it checks atlasesLoaded() internally)
		spriteRenderer = createSpriteRenderer();
	}

	function getWorldPixelSize(): { width: number; height: number } {
		const fallbackWidth = Math.max(options.container.clientWidth || 0, 640);
		const fallbackHeight = Math.max(options.container.clientHeight || 0, 360);
		return {
			width:
				options.world.navigation.width > 0 ? options.world.navigation.width * 32 : fallbackWidth,
			height:
				options.world.navigation.height > 0 ? options.world.navigation.height * 32 : fallbackHeight,
		};
	}

	function clampCamera(next: RuntimeCamera): RuntimeCamera {
		const worldSize = getWorldPixelSize();
		const viewportWidth = (canvas?.width ?? options.container.clientWidth) || 1;
		const viewportHeight = (canvas?.height ?? options.container.clientHeight) || 1;
		const visibleWidth = viewportWidth / next.zoom;
		const visibleHeight = viewportHeight / next.zoom;
		return {
			x: Math.max(0, Math.min(next.x, Math.max(0, worldSize.width - visibleWidth))),
			y: Math.max(0, Math.min(next.y, Math.max(0, worldSize.height - visibleHeight))),
			zoom: Math.max(0.5, Math.min(next.zoom, 2.5)),
		};
	}

	function panCamera(dx: number, dy: number): void {
		camera = clampCamera({
			...camera,
			x: camera.x + dx / camera.zoom,
			y: camera.y + dy / camera.zoom,
		});
		renderCurrentFrame();
	}

	function zoomCamera(delta: number): void {
		camera = clampCamera({
			...camera,
			zoom: camera.zoom + delta,
		});
		renderCurrentFrame();
	}

	function focusCameraOnPoint(worldX: number, worldY: number): void {
		const viewportWidth = (canvas?.width ?? options.container.clientWidth) || 1;
		const viewportHeight = (canvas?.height ?? options.container.clientHeight) || 1;
		camera = clampCamera({
			...camera,
			x: worldX - viewportWidth / (2 * camera.zoom),
			y: worldY - viewportHeight / (2 * camera.zoom),
		});
		renderCurrentFrame();
	}

	function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
		const rect = canvas?.getBoundingClientRect() ?? options.container.getBoundingClientRect();
		const localX = clientX - rect.left;
		const localY = clientY - rect.top;
		return {
			x: localX / camera.zoom + camera.x,
			y: localY / camera.zoom + camera.y,
		};
	}

	function getScreenPoint(clientX: number, clientY: number): { x: number; y: number } {
		const rect = canvas?.getBoundingClientRect() ?? options.container.getBoundingClientRect();
		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
		};
	}

	function getMinimapLayout(width: number, height: number): MinimapLayout {
		const minimapWidth = Math.min(190, Math.max(132, Math.round(width * 0.24)));
		const minimapHeight = Math.min(128, Math.max(88, Math.round(height * 0.22)));
		return {
			x: width - minimapWidth - MINIMAP_MARGIN,
			y: height - minimapHeight - MINIMAP_MARGIN,
			width: minimapWidth,
			height: minimapHeight,
		};
	}

	function screenPointInMinimap(screenX: number, screenY: number): boolean {
		const width = (canvas?.width ?? options.container.clientWidth) || 1;
		const height = (canvas?.height ?? options.container.clientHeight) || 1;
		const minimap = getMinimapLayout(width, height);
		return (
			screenX >= minimap.x &&
			screenX <= minimap.x + minimap.width &&
			screenY >= minimap.y &&
			screenY <= minimap.y + minimap.height
		);
	}

	function worldPointFromMinimap(screenX: number, screenY: number): { x: number; y: number } {
		const width = (canvas?.width ?? options.container.clientWidth) || 1;
		const height = (canvas?.height ?? options.container.clientHeight) || 1;
		const minimap = getMinimapLayout(width, height);
		const worldSize = getWorldPixelSize();
		const localX = (screenX - minimap.x) / minimap.width;
		const localY = (screenY - minimap.y) / minimap.height;
		return {
			x: Math.max(0, Math.min(worldSize.width, localX * worldSize.width)),
			y: Math.max(0, Math.min(worldSize.height, localY * worldSize.height)),
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

	function applyWorldEvents(): void {
		while (options.world.events.length > 0) {
			const event = options.world.events.shift();
			if (!event) break;
			if (event.type === "camera-focus") {
				const x = Number(event.payload?.x ?? 0);
				const y = Number(event.payload?.y ?? 0);
				focusCameraOnPoint(x * 32 + 16, y * 32 + 16);
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
				pushAlert(`Boss engaged: ${String(event.payload?.name ?? "Unknown")}`, "critical");
				continue;
			}
			if (event.type === "reinforcements-arrived") {
				pushAlert("Reinforcements have arrived", "info");
			}
		}
	}

	function pushAlert(message: string, severity: "info" | "warning" | "critical"): void {
		const id = `runtime-alert-${options.world.time.tick}-${options.bridge.state.alerts.length}`;
		options.bridge.state.alerts = [...options.bridge.state.alerts, { id, message, severity }].slice(
			-4,
		);
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
			selectedIds.length > 0
				? {
						entityIds: selectedIds,
						primaryLabel:
							selectedIds.length === 1
								? `Entity ${selectedIds[0]}`
								: `${selectedIds.length} selected`,
					}
				: null;
		options.bridge.state.population = {
			current: playerOwned,
			max: Math.max(playerOwned, 24),
		};
		options.bridge.state.resources = { ...options.world.session.resources };
		options.bridge.state.objectives = options.world.session.objectives.map((objective) => ({
			id: objective.id,
			description: objective.description,
			status: objective.status,
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
			? {
					lines: options.world.session.dialogue.lines,
				}
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
		if (options.world.session.phase !== lastSessionPhase) {
			if (options.world.session.phase === "victory") {
				pushAlert("Mission complete", "info");
			} else if (options.world.session.phase === "defeat") {
				pushAlert("Mission failed", "critical");
			}
			lastSessionPhase = options.world.session.phase;
		}
		options.container.dataset.runtimeSelected = String(selectedIds.length);
	}

	function clearSelection(): void {
		for (const eid of options.world.runtime.alive) {
			Selection.selected[eid] = 0;
		}
		syncBridgeState();
		renderCurrentFrame();
	}

	function dismissDialogue(): void {
		options.world.session.dialogue = null;
		syncBridgeState();
		renderCurrentFrame();
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
			if (Selection.selected[eid] === 1) {
				selectedCount += 1;
			}
		}
		if (selectedCount === 0) {
			clearSelection();
			return;
		}
		syncBridgeState();
		renderCurrentFrame();
	}

	function selectInScreenRect(
		startClientX: number,
		startClientY: number,
		endClientX: number,
		endClientY: number,
	): void {
		const startWorldPoint = screenToWorld(startClientX, startClientY);
		const endWorldPoint = screenToWorld(endClientX, endClientY);
		selectionBox = {
			startX: getScreenPoint(startClientX, startClientY).x,
			startY: getScreenPoint(startClientX, startClientY).y,
			endX: getScreenPoint(endClientX, endClientY).x,
			endY: getScreenPoint(endClientX, endClientY).y,
		};
		selectEntitiesInWorldRect(
			startWorldPoint.x,
			startWorldPoint.y,
			endWorldPoint.x,
			endWorldPoint.y,
		);
	}

	function recenterFromMinimap(screenX: number, screenY: number): void {
		const point = worldPointFromMinimap(screenX, screenY);
		focusCameraOnPoint(point.x, point.y);
	}

	function findNearestEntity(worldX: number, worldY: number): number | null {
		let nearest: number | null = null;
		let nearestDistance = 18 / camera.zoom;
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

	function recenterCamera(): void {
		const selected = getSelectedEntityIds();
		if (selected.length > 0) {
			const anchor = selected[0];
			focusCameraOnPoint(Position.x[anchor], Position.y[anchor]);
			return;
		}
		for (const eid of options.world.runtime.alive) {
			if (Faction.id[eid] === 1) {
				focusCameraOnPoint(Position.x[eid], Position.y[eid]);
				return;
			}
		}
		const firstAlive = options.world.runtime.alive.values().next().value;
		if (typeof firstAlive === "number") {
			focusCameraOnPoint(Position.x[firstAlive], Position.y[firstAlive]);
		}
	}

	function handlePrimaryAction(worldX: number, worldY: number): void {
		const selected = getSelectedEntityIds();
		const targetEid = findNearestEntity(worldX, worldY);
		if (targetEid != null && Faction.id[targetEid] === 1 && Flags.isResource[targetEid] === 0) {
			clearSelection();
			Selection.selected[targetEid] = 1;
			syncBridgeState();
			renderCurrentFrame();
			return;
		}
		if (selected.length > 0) {
			moveSelectedEntities(worldX, worldY);
			syncBridgeState();
			renderCurrentFrame();
			return;
		}
		if (targetEid != null) {
			clearSelection();
			Selection.selected[targetEid] = 1;
			syncBridgeState();
			renderCurrentFrame();
		}
	}

	function handleSecondaryAction(worldX: number, worldY: number): void {
		if (getSelectedEntityIds().length === 0) return;
		moveSelectedEntities(worldX, worldY);
		syncBridgeState();
		renderCurrentFrame();
	}

	function ensureCanvas(): HTMLCanvasElement {
		if (canvas) return canvas;
		const nextCanvas = document.createElement("canvas");
		nextCanvas.dataset.runtimeCanvas = "littlejs";
		nextCanvas.style.width = "100%";
		nextCanvas.style.height = "100%";
		nextCanvas.style.display = "block";
		nextCanvas.style.touchAction = "none";
		options.container.appendChild(nextCanvas);
		canvas = nextCanvas;
		context = nextCanvas.getContext("2d");
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", onPointerMove);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointercancel", onPointerCancel);
		canvas.addEventListener("wheel", onWheel, { passive: false });
		canvas.addEventListener("contextmenu", preventContextMenu);
		return nextCanvas;
	}

	function destroyCanvas(): void {
		if (!canvas) return;
		canvas.removeEventListener("pointerdown", onPointerDown);
		canvas.removeEventListener("pointermove", onPointerMove);
		canvas.removeEventListener("pointerup", onPointerUp);
		canvas.removeEventListener("pointercancel", onPointerCancel);
		canvas.removeEventListener("wheel", onWheel);
		canvas.removeEventListener("contextmenu", preventContextMenu);
		canvas.remove();
		canvas = null;
		context = null;
	}

	function syncRuntimeDatasets(entityCount: number): void {
		options.container.dataset.runtime = "littlejs";
		options.container.dataset.littlejsVersion =
			(module as { engineName?: string }).engineName ?? "loaded";
		options.container.dataset.runtimeEntities = String(entityCount);
		options.container.dataset.runtimeTick = String(options.world.time.tick);
		options.container.dataset.runtimeSelected = String(getSelectedEntityIds().length);
		options.container.dataset.runtimeCameraX = camera.x.toFixed(2);
		options.container.dataset.runtimeCameraY = camera.y.toFixed(2);
		options.container.dataset.runtimeWeather = options.world.runtime.weather;
	}

	function drawScene(width: number, height: number): void {
		const targetCanvas = ensureCanvas();
		if (targetCanvas.width !== width) targetCanvas.width = width;
		if (targetCanvas.height !== height) targetCanvas.height = height;
		if (!context) {
			syncRuntimeDatasets(options.world.runtime.alive.size);
			return;
		}

		context.clearRect(0, 0, width, height);
		context.fillStyle = "#08111d";
		context.fillRect(0, 0, width, height);
		if (options.world.runtime.weather === "rain") {
			context.fillStyle = "rgba(59, 130, 246, 0.08)";
			context.fillRect(0, 0, width, height);
		} else if (options.world.runtime.weather === "monsoon") {
			context.fillStyle = "rgba(30, 64, 175, 0.16)";
			context.fillRect(0, 0, width, height);
		}

		// ── Terrain layer ──
		if (terrainRenderer) {
			terrainRenderer.render(context, camera, { width, height });
		} else {
			// Fallback: draw grid lines when terrain renderer isn't ready
			context.strokeStyle = "rgba(148, 163, 184, 0.08)";
			context.lineWidth = 1;
			const gridSize = 32 * camera.zoom;
			const offsetX = -((camera.x * camera.zoom) % gridSize);
			const offsetY = -((camera.y * camera.zoom) % gridSize);
			for (let gx = offsetX; gx <= width; gx += gridSize) {
				context.beginPath();
				context.moveTo(gx + 0.5, 0);
				context.lineTo(gx + 0.5, height);
				context.stroke();
			}
			for (let gy = offsetY; gy <= height; gy += gridSize) {
				context.beginPath();
				context.moveTo(0, gy + 0.5);
				context.lineTo(width, gy + 0.5);
				context.stroke();
			}
		}

		// ── Entity layer (sprite renderer with shape fallback) ──
		let entityCount = 0;
		if (spriteRenderer) {
			entityCount = options.world.runtime.alive.size;
			spriteRenderer.renderEntities(
				context,
				camera,
				{ width, height },
				options.world,
				options.world.time.tick,
			);
		} else {
			// Fallback: original colored shape rendering
			for (const eid of options.world.runtime.alive) {
				entityCount += 1;
				const ex = Position.x[eid];
				const ey = Position.y[eid];
				const screenX = (ex - camera.x) * camera.zoom;
				const screenY = (ey - camera.y) * camera.zoom;
				if (screenX < -32 || screenY < -32 || screenX > width + 32 || screenY > height + 32) {
					continue;
				}
				const isBuilding = Flags.isBuilding[eid] === 1;
				const isResource = Flags.isResource[eid] === 1;
				const isSelected = Selection.selected[eid] === 1;
				const factionId = Faction.id[eid];
				const healthRatio = Health.max[eid] > 0 ? Health.current[eid] / Health.max[eid] : 1;

				context.fillStyle = isResource
					? "#facc15"
					: factionId === 1
						? "#22c55e"
						: factionId === 2
							? "#ef4444"
							: "#cbd5e1";
				if (isBuilding) {
					const size = 16 * camera.zoom;
					context.fillRect(screenX - size / 2, screenY - size / 2, size, size);
				} else {
					context.beginPath();
					context.arc(screenX, screenY, Math.max(4, 6 * camera.zoom), 0, Math.PI * 2);
					context.fill();
				}

				context.fillStyle = "rgba(15, 23, 42, 0.9)";
				context.fillRect(
					screenX - 10 * camera.zoom,
					screenY - 14 * camera.zoom,
					20 * camera.zoom,
					3 * camera.zoom,
				);
				context.fillStyle = "#34d399";
				context.fillRect(
					screenX - 10 * camera.zoom,
					screenY - 14 * camera.zoom,
					20 * camera.zoom * Math.max(0, Math.min(1, healthRatio)),
					3 * camera.zoom,
				);

				if (isSelected) {
					context.strokeStyle = "#f8fafc";
					context.lineWidth = 2;
					context.beginPath();
					context.arc(screenX, screenY, (isBuilding ? 12 : 10) * camera.zoom, 0, Math.PI * 2);
					context.stroke();
				}
			}
		}

		// ── Fog of war layer ──
		if (fogGrid && fogGridWidth > 0 && fogGridHeight > 0) {
			renderFogOverlay(context, camera, { width, height }, fogGrid, fogGridWidth, fogGridHeight);
		}

		context.fillStyle = "#f8fafc";
		context.font = "12px monospace";
		context.fillText(`Tick ${options.world.time.tick}`, 12, 20);
		context.fillText(`Entities ${entityCount}`, 12, 36);
		context.fillText(`Zoom ${camera.zoom.toFixed(2)}`, 12, 52);
		context.fillText(`Selected ${getSelectedEntityIds().length}`, 12, 68);
		context.fillText(`Weather ${options.world.runtime.weather}`, 12, 84);

		const minimap = getMinimapLayout(width, height);
		const worldSize = getWorldPixelSize();
		context.fillStyle = "rgba(2, 6, 23, 0.8)";
		context.fillRect(minimap.x, minimap.y, minimap.width, minimap.height);
		context.strokeStyle = "rgba(148, 163, 184, 0.8)";
		context.lineWidth = 1;
		context.strokeRect(minimap.x, minimap.y, minimap.width, minimap.height);
		for (const eid of options.world.runtime.alive) {
			const px = minimap.x + (Position.x[eid] / Math.max(1, worldSize.width)) * minimap.width;
			const py = minimap.y + (Position.y[eid] / Math.max(1, worldSize.height)) * minimap.height;
			context.fillStyle =
				Flags.isResource[eid] === 1
					? "#facc15"
					: Faction.id[eid] === 1
						? "#22c55e"
						: Faction.id[eid] === 2
							? "#ef4444"
							: "#cbd5e1";
			context.fillRect(
				px - 1,
				py - 1,
				Flags.isBuilding[eid] === 1 ? 4 : 3,
				Flags.isBuilding[eid] === 1 ? 4 : 3,
			);
		}
		const viewportRectW = Math.min(
			minimap.width,
			(width / camera.zoom / Math.max(1, worldSize.width)) * minimap.width,
		);
		const viewportRectH = Math.min(
			minimap.height,
			(height / camera.zoom / Math.max(1, worldSize.height)) * minimap.height,
		);
		const viewportRectX = minimap.x + (camera.x / Math.max(1, worldSize.width)) * minimap.width;
		const viewportRectY = minimap.y + (camera.y / Math.max(1, worldSize.height)) * minimap.height;
		context.strokeStyle = "#f8fafc";
		context.strokeRect(viewportRectX, viewportRectY, viewportRectW, viewportRectH);

		if (selectionBox) {
			const minX = Math.min(selectionBox.startX, selectionBox.endX);
			const minY = Math.min(selectionBox.startY, selectionBox.endY);
			const boxWidth = Math.abs(selectionBox.endX - selectionBox.startX);
			const boxHeight = Math.abs(selectionBox.endY - selectionBox.startY);
			context.fillStyle = "rgba(34, 197, 94, 0.15)";
			context.fillRect(minX, minY, boxWidth, boxHeight);
			context.strokeStyle = "rgba(134, 239, 172, 0.95)";
			context.lineWidth = 1;
			context.strokeRect(minX, minY, boxWidth, boxHeight);
		}

		syncRuntimeDatasets(entityCount);
		syncBridgeState();
	}

	function renderCurrentFrame(): void {
		const width = (canvas?.width ?? options.container.clientWidth) || 1;
		const height = (canvas?.height ?? options.container.clientHeight) || 1;
		drawScene(width, height);
	}

	function onPointerDown(event: PointerEvent): void {
		if (!canvas) return;
		canvas.setPointerCapture(event.pointerId);
		pointers.set(event.pointerId, {
			id: event.pointerId,
			button: event.button,
			pointerType: event.pointerType,
			startTimeMs: event.timeStamp,
			startClientX: event.clientX,
			startClientY: event.clientY,
			lastClientX: event.clientX,
			lastClientY: event.clientY,
			moved: false,
		});
	}

	function onPointerMove(event: PointerEvent): void {
		const tracked = pointers.get(event.pointerId);
		if (!tracked) return;
		const dx = event.clientX - tracked.lastClientX;
		const dy = event.clientY - tracked.lastClientY;
		tracked.lastClientX = event.clientX;
		tracked.lastClientY = event.clientY;
		if (
			Math.abs(event.clientX - tracked.startClientX) > 4 ||
			Math.abs(event.clientY - tracked.startClientY) > 4
		) {
			tracked.moved = true;
		}

		if (pointers.size >= 2) {
			const entries = [...pointers.values()].slice(0, 2);
			const center = {
				x: (entries[0].lastClientX + entries[1].lastClientX) / 2,
				y: (entries[0].lastClientY + entries[1].lastClientY) / 2,
			};
			const distance = Math.hypot(
				entries[0].lastClientX - entries[1].lastClientX,
				entries[0].lastClientY - entries[1].lastClientY,
			);
			if (lastTouchCenter) {
				panCamera(lastTouchCenter.x - center.x, lastTouchCenter.y - center.y);
				const scaleDelta = (distance - lastTouchCenter.distance) / 320;
				if (Math.abs(scaleDelta) > 0.001) {
					zoomCamera(scaleDelta);
				}
			}
			lastTouchCenter = { ...center, distance };
			return;
		}

		lastTouchCenter = null;
		if (tracked.button === 1 || tracked.button === 2) {
			panCamera(-dx, -dy);
			return;
		}

		if (tracked.button === 0 && pointers.size === 1) {
			const startPoint = getScreenPoint(tracked.startClientX, tracked.startClientY);
			const endPoint = getScreenPoint(event.clientX, event.clientY);
			selectionBox = {
				startX: startPoint.x,
				startY: startPoint.y,
				endX: endPoint.x,
				endY: endPoint.y,
			};
			if (
				tracked.pointerType === "mouse" ||
				event.timeStamp - tracked.startTimeMs >= TOUCH_BOX_SELECT_DELAY_MS
			) {
				const startWorldPoint = screenToWorld(tracked.startClientX, tracked.startClientY);
				const endWorldPoint = screenToWorld(event.clientX, event.clientY);
				selectEntitiesInWorldRect(
					startWorldPoint.x,
					startWorldPoint.y,
					endWorldPoint.x,
					endWorldPoint.y,
				);
				return;
			}
			renderCurrentFrame();
		}
	}

	function onPointerUp(event: PointerEvent): void {
		const tracked = pointers.get(event.pointerId);
		pointers.delete(event.pointerId);
		if (pointers.size < 2) {
			lastTouchCenter = null;
		}
		if (!tracked) return;
		const screenPoint = getScreenPoint(event.clientX, event.clientY);
		if (screenPointInMinimap(screenPoint.x, screenPoint.y)) {
			selectionBox = null;
			recenterFromMinimap(screenPoint.x, screenPoint.y);
			return;
		}

		const heldLongEnough = event.timeStamp - tracked.startTimeMs >= TOUCH_BOX_SELECT_DELAY_MS;
		if (
			tracked.moved &&
			tracked.button === 0 &&
			(tracked.pointerType === "mouse" || heldLongEnough)
		) {
			selectionBox = null;
			selectInScreenRect(tracked.startClientX, tracked.startClientY, event.clientX, event.clientY);
			return;
		}
		selectionBox = null;
		if (
			tracked.moved &&
			(tracked.button === 1 || tracked.button === 2 || tracked.pointerType === "touch")
		) {
			renderCurrentFrame();
			return;
		}
		const point = screenToWorld(event.clientX, event.clientY);
		if (tracked.button === 2) {
			handleSecondaryAction(point.x, point.y);
		} else {
			handlePrimaryAction(point.x, point.y);
		}
	}

	function onPointerCancel(event: PointerEvent): void {
		pointers.delete(event.pointerId);
		if (pointers.size < 2) {
			lastTouchCenter = null;
		}
		selectionBox = null;
		renderCurrentFrame();
	}

	function onWheel(event: WheelEvent): void {
		event.preventDefault();
		zoomCamera(-event.deltaY * 0.001);
	}

	function preventContextMenu(event: MouseEvent): void {
		event.preventDefault();
	}

	function tick(timestamp: number): void {
		if (!started) return;
		const phase = options.world.session.phase === "playing" ? "playing" : "paused";
		const frame = advanceRuntimeLoopProjection(projection, timestamp, phase);
		projection = frame.state;
		options.world.time.elapsedMs = frame.state.elapsedMs;
		options.world.time.deltaMs = frame.shouldTickSystems ? frame.deltaMs : 0;
		options.world.time.tick = frame.state.simulationTick;
		options.world.diagnostics.tick = options.world.time.tick;
		options.world.diagnostics.performance = {
			fps: frame.state.fps,
			frameTimeMs: frame.deltaMs,
			systemTimeMs: frame.deltaMs,
		};
		options.onTick?.(options.world);
		applyWorldEvents();
		drawScene(
			(canvas?.width ?? options.container.clientWidth) || 1,
			(canvas?.height ?? options.container.clientHeight) || 1,
		);
		rafHandle = requestAnimationFrame(tick);
	}

	return {
		async start(): Promise<void> {
			if (started) return;
			started = true;
			if (options.world.session.phase !== "playing") {
				options.world.session.phase = "playing";
			}
			initRenderingAssets();
			syncBridgeState();
			const targetCanvas = ensureCanvas();
			applyWorldEvents();
			drawScene(
				Math.max(1, targetCanvas.clientWidth || options.container.clientWidth || 1),
				Math.max(1, targetCanvas.clientHeight || options.container.clientHeight || 1),
			);
			rafHandle = requestAnimationFrame(tick);
		},
		async stop(): Promise<void> {
			if (!started) return;
			started = false;
			if (rafHandle) {
				cancelAnimationFrame(rafHandle);
				rafHandle = 0;
			}
			destroyCanvas();
			pointers.clear();
			lastTouchCenter = null;
			delete options.container.dataset.runtime;
			delete options.container.dataset.littlejsVersion;
			delete options.container.dataset.runtimeEntities;
			delete options.container.dataset.runtimeTick;
			delete options.container.dataset.runtimeSelected;
			delete options.container.dataset.runtimeCameraX;
			delete options.container.dataset.runtimeCameraY;
		},
		resize(width: number, height: number): void {
			const targetCanvas = ensureCanvas();
			targetCanvas.width = Math.max(1, width);
			targetCanvas.height = Math.max(1, height);
			options.container.dataset.runtimeWidth = String(width);
			options.container.dataset.runtimeHeight = String(height);
			drawScene(targetCanvas.width, targetCanvas.height);
		},
		clearSelection,
		dismissDialogue,
		recenter(): void {
			recenterCamera();
		},
		zoomIn(): void {
			zoomCamera(0.15);
		},
		zoomOut(): void {
			zoomCamera(-0.15);
		},
		selectInScreenRect,
		recenterFromMinimap,
	};
}

export async function canLoadLittleJsRuntime(): Promise<boolean> {
	try {
		await loadLittleJsEngine();
		return true;
	} catch {
		return false;
	}
}
