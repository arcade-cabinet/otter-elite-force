/**
 * Rally Point Visualization — US-024
 *
 * Renders rally point indicators for selected buildings:
 * - Dashed line from building center to rally point
 * - Flag/dot marker at rally point position
 * - Only visible when building is selected
 */

import type { World } from "koota";
import type Phaser from "phaser";
import { IsBuilding, Selected } from "@/ecs/traits/identity";
import { RallyPoint } from "@/ecs/traits/orders";
import { Position } from "@/ecs/traits/spatial";

const TILE_SIZE = 32;

/** Dash pattern: 6px dash, 4px gap */
const DASH_LENGTH = 6;
const GAP_LENGTH = 4;

/** Rally point line color (cyan-ish) */
const RALLY_LINE_COLOR = 0x5fd0ff;
const RALLY_LINE_ALPHA = 0.88;
const RALLY_DOT_FILL_COLOR = 0x08131a;
const RALLY_DOT_FILL_ALPHA = 0.72;
const RALLY_DOT_INNER_RADIUS = 6;
const RALLY_DOT_OUTER_RADIUS = 10;
const RALLY_RING_COLOR = 0xbcecff;
const RALLY_RING_RADIUS = 16;

/**
 * Draw a dashed line between two points on a Phaser graphics object.
 */
export function drawDashedLine(
	graphics: Phaser.GameObjects.Graphics,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	dashLen = DASH_LENGTH,
	gapLen = GAP_LENGTH,
): void {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const totalLen = Math.sqrt(dx * dx + dy * dy);
	if (totalLen === 0) return;

	const nx = dx / totalLen;
	const ny = dy / totalLen;
	const segmentLen = dashLen + gapLen;
	let traveled = 0;

	while (traveled < totalLen) {
		const dashEnd = Math.min(traveled + dashLen, totalLen);
		graphics.lineBetween(
			x1 + nx * traveled,
			y1 + ny * traveled,
			x1 + nx * dashEnd,
			y1 + ny * dashEnd,
		);
		traveled += segmentLen;
	}
}

/**
 * Draw rally point flag/dot marker at a position.
 */
export function drawRallyMarker(
	graphics: Phaser.GameObjects.Graphics,
	x: number,
	y: number,
): void {
	// Inner filled dot
	graphics.fillStyle(RALLY_DOT_FILL_COLOR, RALLY_DOT_FILL_ALPHA);
	graphics.fillCircle(x, y, RALLY_DOT_INNER_RADIUS);

	// Middle ring
	graphics.lineStyle(2, RALLY_LINE_COLOR, 0.95);
	graphics.strokeCircle(x, y, RALLY_DOT_OUTER_RADIUS);

	// Outer ring
	graphics.lineStyle(1, RALLY_RING_COLOR, 0.8);
	graphics.strokeCircle(x, y, RALLY_RING_RADIUS);

	// Small flag pole (upward from dot)
	graphics.lineStyle(2, RALLY_LINE_COLOR, 0.9);
	graphics.lineBetween(x, y - RALLY_DOT_INNER_RADIUS, x, y - 20);

	// Flag triangle
	graphics.fillStyle(RALLY_LINE_COLOR, 0.85);
	graphics.fillTriangle(x, y - 20, x + 10, y - 16, x, y - 12);
}

/**
 * Render rally points for all selected buildings that have a RallyPoint trait.
 * Call once per frame from the render overlay.
 */
export function renderRallyPoints(
	world: World,
	graphics: Phaser.GameObjects.Graphics,
): void {
	const buildings = world.query(Selected, IsBuilding, Position, RallyPoint);

	for (const building of buildings) {
		const pos = building.get(Position);
		const rally = building.get(RallyPoint);
		if (!pos || !rally) continue;

		const startX = pos.x * TILE_SIZE + TILE_SIZE / 2;
		const startY = pos.y * TILE_SIZE + TILE_SIZE / 2;
		const targetX = rally.x * TILE_SIZE + TILE_SIZE / 2;
		const targetY = rally.y * TILE_SIZE + TILE_SIZE / 2;

		// Skip if rally is at building position (no meaningful rally)
		if (startX === targetX && startY === targetY) continue;

		// Dashed line from building to rally point
		graphics.lineStyle(2, RALLY_LINE_COLOR, RALLY_LINE_ALPHA);
		drawDashedLine(graphics, startX, startY, targetX, targetY);

		// Flag/dot marker at rally point
		drawRallyMarker(graphics, targetX, targetY);
	}
}
