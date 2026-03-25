/**
 * Resource Carrying Indicator — US-026
 *
 * Renders a small colored pip near workers carrying resources.
 *
 * - Fish: blue pip
 * - Timber: brown pip
 * - Salvage: grey pip
 * - Pip disappears after deposit (carrying amount = 0 or carrying = "")
 * - Small (4-6px circle)
 */

import type { World } from "koota";
import type Phaser from "phaser";
import { Gatherer } from "@/ecs/traits/economy";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";

const TILE_SIZE = 32;

/** Pip radius in pixels */
const PIP_RADIUS = 3;
/** Pip offset from sprite center (lower-right) */
const PIP_OFFSET_X = 8;
const PIP_OFFSET_Y = 6;

/** Resource type to pip color mapping */
const RESOURCE_COLORS: Record<string, number> = {
	fish: 0x4488ff,
	timber: 0x8b5a2b,
	salvage: 0x999999,
};

/**
 * Get the pip color for a given resource type.
 * Returns null for unknown or empty resource types.
 */
export function getCarryPipColor(resourceType: string): number | null {
	return RESOURCE_COLORS[resourceType] ?? null;
}

/**
 * Render carry indicator pips for all workers carrying resources.
 * Call once per frame from the render overlay.
 */
export function renderCarryIndicators(
	world: World,
	graphics: Phaser.GameObjects.Graphics,
): void {
	const gatherers = world.query(Gatherer, Position, PhaserSprite);

	for (const entity of gatherers) {
		const gatherer = entity.get(Gatherer);
		if (!gatherer) continue;

		// Skip if not carrying anything
		if (!gatherer.carrying || gatherer.amount <= 0) continue;

		const color = getCarryPipColor(gatherer.carrying);
		if (color === null) continue;

		const pos = entity.get(Position);
		if (!pos) continue;

		const centerX = pos.x * TILE_SIZE + TILE_SIZE / 2;
		const centerY = pos.y * TILE_SIZE + TILE_SIZE / 2;

		// Draw pip with dark outline for visibility
		graphics.fillStyle(0x000000, 0.5);
		graphics.fillCircle(
			centerX + PIP_OFFSET_X,
			centerY + PIP_OFFSET_Y,
			PIP_RADIUS + 1,
		);

		graphics.fillStyle(color, 0.95);
		graphics.fillCircle(
			centerX + PIP_OFFSET_X,
			centerY + PIP_OFFSET_Y,
			PIP_RADIUS,
		);
	}
}
