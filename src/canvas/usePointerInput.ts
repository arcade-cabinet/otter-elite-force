/**
 * usePointerInput — unified pointer/touch input following the POC pattern.
 *
 * Simple, proven approach from docs/references/poc_final.html:
 * - Single click/tap: select unit or issue context command
 * - Hold + drag (left button): box selection rectangle
 * - Right-click: context command (move/attack/gather)
 * - Two-finger drag: camera pan (mobile)
 * - Right-click drag / middle-click drag: camera pan (desktop)
 * - Mouse wheel: zoom
 * - Arrow keys / WASD: camera pan
 *
 * NO edge scroll. NO gesture detector class. NO complex state machine.
 * Just pointer events → world coords → ECS queries.
 */

import type { World } from "koota";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Faction, IsBuilding, IsResource, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { Health } from "@/ecs/traits/combat";
import { Gatherer } from "@/ecs/traits/economy";
import { AIState } from "@/ecs/traits/ai";
import { OrderQueue } from "@/ecs/traits/orders";
import { EventBus } from "@/game/EventBus";
import { CELL_SIZE } from "@/maps/constants";
import type { CameraState } from "./useCamera";

// ─── Types ───

export interface DragSelectState {
	active: boolean;
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

export interface UsePointerInputOptions {
	world: World;
	camera: CameraState;
	pan: (dx: number, dy: number) => void;
	setZoom: (zoom: number) => void;
}

export interface UsePointerInputResult {
	containerProps: {
		onPointerDown: (e: React.PointerEvent) => void;
		onPointerMove: (e: React.PointerEvent) => void;
		onPointerUp: (e: React.PointerEvent) => void;
		onWheel: (e: React.WheelEvent) => void;
		onContextMenu: (e: React.MouseEvent) => void;
	};
	dragSelect: DragSelectState;
}

// ─── Constants ───

/** Max pixel distance to count as a tap (not a drag). */
const TAP_THRESHOLD = 10;

/** Entity hit detection radius in world pixels. */
const HIT_RADIUS = 25;

/** Wheel zoom factor. */
const WHEEL_ZOOM_FACTOR = 0.001;

// ─── Hook ───

export function usePointerInput({ world, camera, pan, setZoom }: UsePointerInputOptions): UsePointerInputResult {
	const cameraRef = useRef(camera);
	cameraRef.current = camera;

	// Active pointers (for multi-touch)
	const pointersRef = useRef(new Map<number, { x: number; y: number }>());
	const lastPanCenterRef = useRef<{ x: number; y: number } | null>(null);

	// Mouse state (mirrors POC)
	const mouseRef = useRef({
		isDown: false,
		btn: 0,
		startWorldX: 0,
		startWorldY: 0,
		worldX: 0,
		worldY: 0,
		screenX: 0,
		screenY: 0,
	});

	// Drag select box
	const [dragSelect, setDragSelect] = useState<DragSelectState>({
		active: false,
		startX: 0,
		startY: 0,
		endX: 0,
		endY: 0,
	});

	// ─── Entity lookup (mirrors POC getEntityAt) ───

	const getEntityAt = useCallback(
		(worldX: number, worldY: number) => {
			const entities = world.query(Position, UnitType, Faction);
			let closest: ReturnType<typeof world.query>[number] | null = null;
			let closestDist = HIT_RADIUS;

			for (const entity of entities) {
				const pos = entity.get(Position);
				if (!pos) continue;
				const ex = pos.x * CELL_SIZE + CELL_SIZE / 2;
				const ey = pos.y * CELL_SIZE + CELL_SIZE / 2;
				const dx = Math.abs(ex - worldX);
				const dy = Math.abs(ey - worldY);
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < closestDist) {
					closestDist = dist;
					closest = entity;
				}
			}
			return closest;
		},
		[world],
	);

	// ─── Selection helpers ───

	const clearSelection = useCallback(() => {
		for (const e of world.query(Selected)) {
			e.remove(Selected);
		}
	}, [world]);

	const selectEntity = useCallback(
		(entity: ReturnType<typeof world.query>[number]) => {
			clearSelection();
			entity.add(Selected);
			const ut = entity.get(UnitType);
			if (ut) EventBus.emit("unit-selected", { unitType: ut.type });
		},
		[world, clearSelection],
	);

	const hasPlayerUnitsSelected = useCallback(() => {
		for (const e of world.query(Selected, Faction)) {
			if (e.get(Faction)?.id === "ura" && !e.has(IsBuilding)) return true;
		}
		return false;
	}, [world]);

	// ─── Context command (mirrors POC issueContextCommand) ───

	const issueContextCommand = useCallback(
		(worldX: number, worldY: number) => {
			const target = getEntityAt(worldX, worldY);
			const tileX = Math.floor(worldX / CELL_SIZE);
			const tileY = Math.floor(worldY / CELL_SIZE);

			if (target) {
				const faction = target.get(Faction);
				const isResource = target.has(IsResource);

				if (isResource) {
					// Swarm gather — all idle workers
					for (const e of world.query(OrderQueue, Faction, Gatherer)) {
						if (e.get(Faction)?.id !== "ura") continue;
						if (e.has(IsBuilding)) continue;
						const ai = e.has(AIState) ? e.get(AIState) : null;
						if (ai && ai.state !== "idle" && ai.state !== "gathering") continue;
						const q = e.get(OrderQueue);
						if (!q) continue;
						q.length = 0;
						q.push({ type: "gather", targetX: tileX, targetY: tileY, targetEntity: target.id() });
						if (e.has(AIState)) e.set(AIState, (prev) => ({ ...prev, state: "idle" }));
					}
					EventBus.emit("gather-command");
				} else if (faction && faction.id !== "ura") {
					// Attack enemy — all selected combat units
					for (const e of world.query(Selected, OrderQueue, Faction)) {
						if (e.get(Faction)?.id !== "ura") continue;
						const q = e.get(OrderQueue);
						if (!q) continue;
						q.length = 0;
						q.push({ type: "attack", targetEntity: target.id() });
						if (e.has(AIState)) e.set(AIState, (prev) => ({ ...prev, state: "idle" }));
					}
					EventBus.emit("attack-command");
				}
			} else {
				// Move to ground
				for (const e of world.query(Selected, OrderQueue, Faction)) {
					if (e.get(Faction)?.id !== "ura") continue;
					const q = e.get(OrderQueue);
					if (!q) continue;
					q.length = 0;
					q.push({ type: "move", targetX: tileX, targetY: tileY });
					if (e.has(AIState)) e.set(AIState, (prev) => ({ ...prev, state: "idle" }));
				}
				EventBus.emit("move-command");
			}
		},
		[world, getEntityAt],
	);

	// ─── Pointer event handlers (mirrors POC pattern) ───

	const screenToWorld = useCallback(
		(e: React.PointerEvent): { screenX: number; screenY: number; worldX: number; worldY: number } => {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const screenX = e.clientX - rect.left;
			const screenY = e.clientY - rect.top;
			return {
				screenX,
				screenY,
				worldX: screenX + cameraRef.current.x,
				worldY: screenY + cameraRef.current.y,
			};
		},
		[],
	);

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

			// Only track first pointer for click/drag
			if (pointersRef.current.size === 1) {
				const { screenX, screenY, worldX, worldY } = screenToWorld(e);
				const m = mouseRef.current;
				m.isDown = true;
				m.btn = e.button;
				m.startWorldX = worldX;
				m.startWorldY = worldY;
				m.worldX = worldX;
				m.worldY = worldY;
				m.screenX = screenX;
				m.screenY = screenY;
			}
		},
		[screenToWorld],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (pointersRef.current.has(e.pointerId)) {
				pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
			}

			// Two-finger pan (mobile)
			if (pointersRef.current.size === 2) {
				const pts = Array.from(pointersRef.current.values());
				const cx = (pts[0].x + pts[1].x) / 2;
				const cy = (pts[0].y + pts[1].y) / 2;
				if (lastPanCenterRef.current) {
					pan(lastPanCenterRef.current.x - cx, lastPanCenterRef.current.y - cy);
				}
				lastPanCenterRef.current = { x: cx, y: cy };
				return;
			}
			lastPanCenterRef.current = null;

			const { screenX, screenY, worldX, worldY } = screenToWorld(e);
			const m = mouseRef.current;
			m.worldX = worldX;
			m.worldY = worldY;
			m.screenX = screenX;
			m.screenY = screenY;

			// Right-click or middle-click drag → camera pan
			if (m.isDown && (m.btn === 1 || m.btn === 2)) {
				const dx = worldX - m.startWorldX;
				const dy = worldY - m.startWorldY;
				if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
					pan(-dx, -dy);
					m.startWorldX = m.worldX;
					m.startWorldY = m.worldY;
				}
				return;
			}

			// Left-click drag → show selection box
			if (m.isDown && m.btn === 0) {
				const dx = worldX - m.startWorldX;
				const dy = worldY - m.startWorldY;
				if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
					setDragSelect({
						active: true,
						startX: m.startWorldX - cameraRef.current.x,
						startY: m.startWorldY - cameraRef.current.y,
						endX: screenX,
						endY: screenY,
					});
				}
			}
		},
		[pan, screenToWorld],
	);

	const onPointerUp = useCallback(
		(e: React.PointerEvent) => {
			pointersRef.current.delete(e.pointerId);
			if (pointersRef.current.size > 0) return; // Wait for all fingers up
			lastPanCenterRef.current = null;

			const m = mouseRef.current;
			if (!m.isDown) return;
			m.isDown = false;

			// Clear drag select visual
			setDragSelect({ active: false, startX: 0, startY: 0, endX: 0, endY: 0 });

			const { worldX, worldY } = screenToWorld(e);
			const dx = worldX - m.startWorldX;
			const dy = worldY - m.startWorldY;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (e.pointerType === "touch" || m.btn === 0) {
				if (dist < TAP_THRESHOLD) {
					// TAP / SINGLE CLICK
					const clicked = getEntityAt(worldX, worldY);
					if (clicked) {
						const faction = clicked.get(Faction);
						if (faction?.id === "ura" && !clicked.has(IsBuilding)) {
							selectEntity(clicked);
						} else {
							if (hasPlayerUnitsSelected()) {
								issueContextCommand(worldX, worldY);
							} else {
								selectEntity(clicked);
							}
						}
					} else {
						if (hasPlayerUnitsSelected()) {
							issueContextCommand(worldX, worldY);
						} else {
							clearSelection();
						}
					}
				} else {
					// DRAG BOX SELECTION
					clearSelection();
					const minX = Math.min(m.startWorldX, worldX);
					const maxX = Math.max(m.startWorldX, worldX);
					const minY = Math.min(m.startWorldY, worldY);
					const maxY = Math.max(m.startWorldY, worldY);

					for (const entity of world.query(Position, Faction, UnitType)) {
						const pos = entity.get(Position);
						const faction = entity.get(Faction);
						if (!pos || !faction) continue;
						if (faction.id !== "ura" || entity.has(IsBuilding)) continue;
						const ex = pos.x * CELL_SIZE;
						const ey = pos.y * CELL_SIZE;
						if (ex >= minX && ex <= maxX && ey >= minY && ey <= maxY) {
							entity.add(Selected);
						}
					}
				}
			} else if (m.btn === 2 && dist < TAP_THRESHOLD) {
				// RIGHT-CLICK (not drag) → context command
				issueContextCommand(worldX, worldY);
			}
			// Right-click drag was handled in onPointerMove (camera pan)
		},
		[world, screenToWorld, getEntityAt, selectEntity, clearSelection, hasPlayerUnitsSelected, issueContextCommand],
	);

	const onWheel = useCallback(
		(e: React.WheelEvent) => {
			setZoom(cameraRef.current.zoom + -e.deltaY * WHEEL_ZOOM_FACTOR);
		},
		[setZoom],
	);

	const onContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	// ─── Arrow key camera pan ───

	useEffect(() => {
		const SCROLL_SPEED = 8;
		const keysDown = new Set<string>();
		const onKeyDown = (e: KeyboardEvent) => keysDown.add(e.key);
		const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.key);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);

		let raf = 0;
		const tick = () => {
			let dx = 0;
			let dy = 0;
			if (keysDown.has("ArrowLeft") || keysDown.has("a")) dx -= SCROLL_SPEED;
			if (keysDown.has("ArrowRight") || keysDown.has("d")) dx += SCROLL_SPEED;
			if (keysDown.has("ArrowUp") || keysDown.has("w")) dy -= SCROLL_SPEED;
			if (keysDown.has("ArrowDown") || keysDown.has("s")) dy += SCROLL_SPEED;
			if (dx !== 0 || dy !== 0) pan(dx, dy);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, [pan]);

	return {
		containerProps: { onPointerDown, onPointerMove, onPointerUp, onWheel, onContextMenu },
		dragSelect,
	};
}
