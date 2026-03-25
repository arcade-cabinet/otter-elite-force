/**
 * Production Overlay — US-017
 *
 * Renders a small progress bar below building sprites in the game view
 * for buildings that have an active ProductionQueue or ResearchSlot.
 *
 * - Progress fills 0% to 100% for the current training item
 * - Accent color for production, primary color for research
 * - Only visible for buildings with active queue/research
 * - Thin (2px height), positioned below the sprite
 */

import type { World } from "koota";
import type Phaser from "phaser";
import { ProductionQueue, ResearchSlot } from "@/ecs/traits/economy";
import { IsBuilding } from "@/ecs/traits/identity";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";

const TILE_SIZE = 32;

/** Production bar dimensions */
const BAR_WIDTH = 30;
const BAR_HEIGHT = 2;
const BAR_OFFSET_Y = 12; // pixels below sprite center
const BAR_BG_COLOR = 0x111111;
const BAR_BG_ALPHA = 0.6;

/** Colors */
const PRODUCTION_COLOR = 0x8aff9c; // accent green
const RESEARCH_COLOR = 0x9ca3ff; // primary blue/purple

/**
 * Calculate the production progress ratio (0..1) for a building.
 * Returns null if nothing is being produced.
 */
export function getProductionProgress(
	queue: Array<{ unitType: string; progress: number; buildTime: number }> | null | undefined,
): number | null {
	if (!queue || queue.length === 0) return null;
	const current = queue[0];
	return Math.max(0, Math.min(1, current.progress / 100));
}

/**
 * Calculate the research progress ratio (0..1) for a building.
 * Returns null if no research is active.
 */
export function getResearchProgress(
	slot: { researchId: string; progress: number; researchTime: number } | null | undefined,
): number | null {
	if (!slot) return null;
	return Math.max(0, Math.min(1, slot.progress / 100));
}

/**
 * Render production/research progress bars below all active buildings.
 * Call once per frame from the render overlay.
 */
export function renderProductionOverlays(
	world: World,
	graphics: Phaser.GameObjects.Graphics,
): void {
	const buildings = world.query(IsBuilding, Position, PhaserSprite);

	for (const building of buildings) {
		const pos = building.get(Position);
		if (!pos) continue;

		const centerX = pos.x * TILE_SIZE + TILE_SIZE / 2;
		const centerY = pos.y * TILE_SIZE + TILE_SIZE / 2;
		const barX = centerX - BAR_WIDTH / 2;

		const barY = centerY + BAR_OFFSET_Y;
		let drewProduction = false;

		// Production queue progress
		if (building.has(ProductionQueue)) {
			const queue = building.get(ProductionQueue);
			const progress = getProductionProgress(queue);
			if (progress !== null) {
				drawProgressBar(graphics, barX, barY, BAR_WIDTH, BAR_HEIGHT, progress, PRODUCTION_COLOR);
				drewProduction = true;
			}
		}

		// Research progress (offset down if production bar exists)
		if (building.has(ResearchSlot)) {
			const slot = building.get(ResearchSlot);
			const progress = getResearchProgress(slot);
			if (progress !== null) {
				const researchBarY = drewProduction ? barY + BAR_HEIGHT + 1 : barY;
				drawProgressBar(
					graphics,
					barX,
					researchBarY,
					BAR_WIDTH,
					BAR_HEIGHT,
					progress,
					RESEARCH_COLOR,
				);
			}
		}
	}
}

/** Draw a single progress bar at a world-space position. */
function drawProgressBar(
	graphics: Phaser.GameObjects.Graphics,
	x: number,
	y: number,
	width: number,
	height: number,
	ratio: number,
	color: number,
): void {
	// Background
	graphics.fillStyle(BAR_BG_COLOR, BAR_BG_ALPHA);
	graphics.fillRect(x, y, width, height);

	// Progress fill
	const fillWidth = width * ratio;
	if (fillWidth > 0) {
		graphics.fillStyle(color, 0.9);
		graphics.fillRect(x, y, fillWidth, height);
	}
}
