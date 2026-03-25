/**
 * Building Placement Ghost — US-022
 *
 * Renders a semi-transparent building preview that follows the cursor/touch
 * during placement mode. Snaps to a 32px tile grid.
 *
 * - 50% alpha sprite following cursor/touch
 * - Snaps to 32px tile grid
 * - Green tint when valid, red tint when invalid
 * - Invalid shows reason tooltip ("Blocked" / "Not enough resources")
 * - Despawns on placement, right-click, or Escape
 */

import type Phaser from "phaser";

const TILE_SIZE = 32;

export interface PlacementValidation {
	valid: boolean;
	reason?: string;
}

export type ValidateFn = (tileX: number, tileY: number) => PlacementValidation;

export class PlacementGhost {
	private scene: Phaser.Scene;
	private graphics: Phaser.GameObjects.Graphics;
	private tooltip: Phaser.GameObjects.Text | null = null;
	private active = false;
	private buildingId = "";
	private lastTileX = -1;
	private lastTileY = -1;
	private lastValid = true;
	private validateFn: ValidateFn | null = null;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.graphics = scene.add.graphics();
		this.graphics.setDepth(1200);
	}

	/**
	 * Enter placement mode for a building type.
	 */
	activate(buildingId: string, validateFn: ValidateFn): void {
		this.active = true;
		this.buildingId = buildingId;
		this.validateFn = validateFn;
		this.lastTileX = -1;
		this.lastTileY = -1;
	}

	/**
	 * Whether placement mode is currently active.
	 */
	get isActive(): boolean {
		return this.active;
	}

	/**
	 * Get the current building ID being placed.
	 */
	get currentBuildingId(): string {
		return this.buildingId;
	}

	/**
	 * Update ghost position from pointer (call on pointermove).
	 */
	updatePosition(worldX: number, worldY: number): PlacementValidation {
		if (!this.active || !this.validateFn) {
			return { valid: false, reason: "Not in placement mode" };
		}

		const tileX = Math.floor(worldX / TILE_SIZE);
		const tileY = Math.floor(worldY / TILE_SIZE);

		// Skip redraw if tile hasn't changed
		if (tileX === this.lastTileX && tileY === this.lastTileY) {
			return { valid: this.lastValid };
		}

		this.lastTileX = tileX;
		this.lastTileY = tileY;

		const validation = this.validateFn(tileX, tileY);
		this.lastValid = validation.valid;

		this.graphics.clear();

		// Ghost fill: 50% alpha with green/red tint
		const tintColor = validation.valid ? 0x7cff8a : 0xff5f5f;
		this.graphics.fillStyle(tintColor, 0.5);
		this.graphics.fillRect(
			tileX * TILE_SIZE,
			tileY * TILE_SIZE,
			TILE_SIZE,
			TILE_SIZE,
		);

		// Border
		this.graphics.lineStyle(2, tintColor, 0.95);
		this.graphics.strokeRect(
			tileX * TILE_SIZE,
			tileY * TILE_SIZE,
			TILE_SIZE,
			TILE_SIZE,
		);

		// Tooltip for invalid placement
		this.updateTooltip(tileX, tileY, validation);

		return validation;
	}

	/**
	 * Deactivate placement mode and clear visuals.
	 */
	deactivate(): void {
		this.active = false;
		this.buildingId = "";
		this.validateFn = null;
		this.graphics.clear();
		this.clearTooltip();
		this.lastTileX = -1;
		this.lastTileY = -1;
	}

	/**
	 * Get the tile coordinates the ghost is currently snapped to.
	 */
	getTilePosition(): { x: number; y: number } | null {
		if (!this.active || this.lastTileX < 0) return null;
		return { x: this.lastTileX, y: this.lastTileY };
	}

	/**
	 * Destroy all game objects.
	 */
	destroy(): void {
		this.graphics.destroy();
		this.clearTooltip();
	}

	private updateTooltip(
		tileX: number,
		tileY: number,
		validation: PlacementValidation,
	): void {
		if (validation.valid) {
			this.clearTooltip();
			return;
		}

		const reason = validation.reason ?? "Invalid";
		const tooltipX = tileX * TILE_SIZE + TILE_SIZE / 2;
		const tooltipY = tileY * TILE_SIZE - 8;

		if (!this.tooltip) {
			this.tooltip = this.scene.add.text(tooltipX, tooltipY, reason, {
				fontSize: "11px",
				fontFamily: "monospace",
				color: "#ff5f5f",
				backgroundColor: "#1a0808cc",
				padding: { x: 4, y: 2 },
			});
			this.tooltip.setOrigin(0.5, 1);
			this.tooltip.setDepth(1300);
		} else {
			this.tooltip.setText(reason);
			this.tooltip.setPosition(tooltipX, tooltipY);
		}
	}

	private clearTooltip(): void {
		if (this.tooltip) {
			this.tooltip.destroy();
			this.tooltip = null;
		}
	}
}
