/**
 * Selection Manager — handles unit selection via click and drag-rectangle.
 *
 * Integrates with Koota ECS (Selected trait) and Zustand (rtsGameStore.selectedEntityIds).
 * Operates on the GameScene's input and camera.
 */

import type { Entity, World } from "koota";
import Phaser from "phaser";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { EventBus } from "@/game/EventBus";
import { TILE_SIZE } from "@/maps/loader";

const DRAG_THRESHOLD = 5;

export class SelectionManager {
	private scene: Phaser.Scene;
	private world: World;
	private selectionRect: Phaser.GameObjects.Graphics;
	private enabled = true;
	private isDragging = false;
	private dragStart: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

	constructor(scene: Phaser.Scene, world: World) {
		this.scene = scene;
		this.world = world;
		this.selectionRect = scene.add.graphics();
		this.selectionRect.setDepth(1000);

		this.bindEvents();
	}

	private bindEvents(): void {
		this.scene.input.on("pointerdown", this.onPointerDown, this);
		this.scene.input.on("pointermove", this.onPointerMove, this);
		this.scene.input.on("pointerup", this.onPointerUp, this);
	}

	private onPointerDown(pointer: Phaser.Input.Pointer): void {
		if (!this.enabled) return;
		if (pointer.rightButtonDown()) return;

		this.isDragging = false;
		this.dragStart.set(pointer.worldX, pointer.worldY);
	}

	private onPointerMove(pointer: Phaser.Input.Pointer): void {
		if (!this.enabled) return;
		if (!pointer.isDown || pointer.rightButtonDown()) return;

		const dx = pointer.worldX - this.dragStart.x;
		const dy = pointer.worldY - this.dragStart.y;

		if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
			this.isDragging = true;
			this.drawSelectionRect(this.dragStart.x, this.dragStart.y, pointer.worldX, pointer.worldY);
		}
	}

	private onPointerUp(pointer: Phaser.Input.Pointer): void {
		if (!this.enabled) return;
		if (pointer.rightButtonReleased()) return;

		this.selectionRect.clear();

		if (this.isDragging) {
			this.boxSelect(this.dragStart.x, this.dragStart.y, pointer.worldX, pointer.worldY);
		} else {
			this.clickSelect(pointer.worldX, pointer.worldY);
		}

		this.isDragging = false;
	}

	private drawSelectionRect(x1: number, y1: number, x2: number, y2: number): void {
		this.selectionRect.clear();
		this.selectionRect.lineStyle(2, 0x00ff00, 0.9);
		this.selectionRect.fillStyle(0x00ff00, 0.2);

		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		const w = Math.abs(x2 - x1);
		const h = Math.abs(y2 - y1);

		this.selectionRect.fillRect(x, y, w, h);
		this.selectionRect.strokeRect(x, y, w, h);
	}

	/** Public entry point for tap-to-select (used by MobileInput). */
	selectAt(worldX: number, worldY: number): void {
		if (!this.enabled) return;
		this.clickSelect(worldX, worldY);
	}

	/** Public entry point for box selection (used by MobileInput on drag end). */
	selectBox(x1: number, y1: number, x2: number, y2: number): void {
		if (!this.enabled) return;
		this.boxSelect(x1, y1, x2, y2);
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		this.selectionRect.clear();
		this.isDragging = false;
	}

	/** Single-click: find the nearest friendly entity under the cursor. */
	private clickSelect(worldX: number, worldY: number): void {
		this.clearSelection();

		const tileX = Math.floor(worldX / TILE_SIZE);
		const tileY = Math.floor(worldY / TILE_SIZE);
		let closestEntity: Entity | null = null;
		let closestDist = 2; // Max tile distance for click selection

		this.world.query(UnitType, Position, Faction).forEach((entity) => {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			if (!pos || !faction) return;

			const dx = pos.x - tileX;
			const dy = pos.y - tileY;
			const dist = Math.sqrt(dx * dx + dy * dy);

			// Prefer friendly units, but allow selecting enemy/buildings for info
			if (dist < closestDist) {
				closestDist = dist;
				closestEntity = entity;
			}
		});

		if (closestEntity) {
			(closestEntity as Entity).add(Selected);
			const unitTypeData = (closestEntity as Entity).get(UnitType);
			EventBus.emit("unit-selected", { unitType: unitTypeData?.type ?? "" });
		}
	}

	/** Box-select: select all friendly entities within the drag rectangle. */
	private boxSelect(x1: number, y1: number, x2: number, y2: number): void {
		this.clearSelection();

		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);

		// Convert pixel bounds to tile bounds (generous: include tiles that overlap)
		const tileMinX = Math.floor(minX / TILE_SIZE);
		const tileMaxX = Math.ceil(maxX / TILE_SIZE);
		const tileMinY = Math.floor(minY / TILE_SIZE);
		const tileMaxY = Math.ceil(maxY / TILE_SIZE);

		this.world.query(UnitType, Position, Faction).forEach((entity) => {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			if (!pos || !faction) return;

			// Only box-select friendly units (not enemies or buildings)
			if (faction.id !== "ura") return;
			if (entity.has(IsBuilding)) return;

			if (pos.x >= tileMinX && pos.x <= tileMaxX && pos.y >= tileMinY && pos.y <= tileMaxY) {
				entity.add(Selected);
			}
		});
	}

	/**
	 * US-058: Check if a friendly (URA) entity exists near a world position.
	 * Used by MobileInput to decide between re-selecting and issuing commands.
	 */
	hasFriendlyAt(worldX: number, worldY: number): boolean {
		const tileX = Math.floor(worldX / TILE_SIZE);
		const tileY = Math.floor(worldY / TILE_SIZE);
		let found = false;

		this.world.query(UnitType, Position, Faction).forEach((entity) => {
			if (found) return;
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			if (!pos || !faction) return;
			if (faction.id !== "ura") return;

			const dx = pos.x - tileX;
			const dy = pos.y - tileY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < 2) found = true;
		});

		return found;
	}

	/** Remove Selected trait from all entities. */
	clearSelection(): void {
		this.world.query(Selected).forEach((entity) => {
			entity.remove(Selected);
		});
	}

	destroy(): void {
		this.scene.input.off("pointerdown", this.onPointerDown, this);
		this.scene.input.off("pointermove", this.onPointerMove, this);
		this.scene.input.off("pointerup", this.onPointerUp, this);
		this.selectionRect.destroy();
	}
}
