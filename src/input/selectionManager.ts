/**
 * Selection Manager — handles unit selection via click and drag-rectangle.
 *
 * Pure ECS logic: operates on a Koota World, no framework dependency.
 * Visual feedback (selection rectangle) is handled by the tactical runtime overlay.
 */

import type { Entity, World } from "koota";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { EventBus } from "@/game/EventBus";
import { CELL_SIZE } from "@/maps/constants";

export class SelectionManager {
	private world: World;
	private enabled = true;

	constructor(world: World) {
		this.world = world;
	}

	/** Public entry point for tap-to-select. */
	selectAt(worldX: number, worldY: number, shiftKey = false): void {
		if (!this.enabled) return;
		this.clickSelect(worldX, worldY, shiftKey);
	}

	/** Public entry point for box selection (drag end). */
	selectBox(x1: number, y1: number, x2: number, y2: number, shiftKey = false): void {
		if (!this.enabled) return;
		this.boxSelect(x1, y1, x2, y2, shiftKey);
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	/** Single-click: find the nearest friendly entity under the cursor. */
	private clickSelect(worldX: number, worldY: number, shiftKey = false): void {
		const tileX = Math.floor(worldX / CELL_SIZE);
		const tileY = Math.floor(worldY / CELL_SIZE);
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

		if (shiftKey && closestEntity) {
			// Toggle: if already selected, deselect; otherwise add to selection
			if ((closestEntity as Entity).has(Selected)) {
				(closestEntity as Entity).remove(Selected);
			} else {
				(closestEntity as Entity).add(Selected);
				const unitTypeData = (closestEntity as Entity).get(UnitType);
				EventBus.emit("unit-selected", { unitType: unitTypeData?.type ?? "" });
			}
		} else {
			this.clearSelection();
			if (closestEntity) {
				(closestEntity as Entity).add(Selected);
				const unitTypeData = (closestEntity as Entity).get(UnitType);
				EventBus.emit("unit-selected", { unitType: unitTypeData?.type ?? "" });
			}
		}
	}

	/** Box-select: select all friendly entities within the drag rectangle. */
	private boxSelect(x1: number, y1: number, x2: number, y2: number, shiftKey = false): void {
		if (!shiftKey) this.clearSelection();

		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);

		// Convert pixel bounds to tile bounds (generous: include tiles that overlap)
		const tileMinX = Math.floor(minX / CELL_SIZE);
		const tileMaxX = Math.ceil(maxX / CELL_SIZE);
		const tileMinY = Math.floor(minY / CELL_SIZE);
		const tileMaxY = Math.ceil(maxY / CELL_SIZE);

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
	 * Check if a friendly (OEF/URA) entity exists near a world position.
	 * Used to decide between re-selecting and issuing commands.
	 */
	hasFriendlyAt(worldX: number, worldY: number): boolean {
		const tileX = Math.floor(worldX / CELL_SIZE);
		const tileY = Math.floor(worldY / CELL_SIZE);
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
		// No-op — no event bindings or graphics to clean up.
	}
}
