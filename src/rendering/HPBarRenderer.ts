/**
 * HP Bar Renderer — US-025
 *
 * Draws thin HP bars above units and buildings in Phaser.
 *
 * - >66% green, 33-66% yellow, <33% red
 * - Only visible for selected, damaged, or combat-active units
 * - Thin (2-3px height), positioned above sprites, doesn't obscure
 */

import type { Entity, World } from "koota";
import type Phaser from "phaser";
import { Targeting } from "@/ecs/relations";
import { Health } from "@/ecs/traits/combat";
import { IsBuilding, Selected } from "@/ecs/traits/identity";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";

const TILE_SIZE = 32;

/** HP bar dimensions */
const BAR_WIDTH = 28;
const BAR_HEIGHT = 3;
const BAR_OFFSET_Y = -14; // pixels above sprite center
const BAR_BG_COLOR = 0x111111;
const BAR_BG_ALPHA = 0.6;

/** Color thresholds */
const GREEN = 0x44cc44;
const YELLOW = 0xcccc44;
const RED = 0xcc4444;

/**
 * Get the HP bar color for a given health percentage (0..1).
 */
export function hpBarColor(ratio: number): number {
	if (ratio > 0.66) return GREEN;
	if (ratio > 0.33) return YELLOW;
	return RED;
}

/**
 * Determine if an entity should show its HP bar.
 *
 * Visible for: selected units, damaged units (health < max), or units in combat.
 */
export function shouldShowHPBar(entity: Entity): boolean {
	if (!entity.has(Health)) return false;

	// Always show for selected entities
	if (entity.has(Selected)) return true;

	// Show for damaged entities
	const health = entity.get(Health);
	if (health && health.current < health.max) return true;

	// Show for entities that are targeting or being targeted (in combat)
	if (entity.has(Targeting("*"))) return true;

	return false;
}

/**
 * Render HP bars for all visible entities.
 * Call once per frame from the render overlay.
 */
export function renderHPBars(
	world: World,
	graphics: Phaser.GameObjects.Graphics,
): void {
	const entities = world.query(Health, Position, PhaserSprite);

	for (const entity of entities) {
		if (!shouldShowHPBar(entity)) continue;

		const health = entity.get(Health);
		const pos = entity.get(Position);
		if (!health || !pos) continue;

		const ratio = Math.max(0, Math.min(1, health.current / health.max));
		if (ratio <= 0) continue; // Dead entities shouldn't show bars

		const isBuilding = entity.has(IsBuilding);
		const barWidth = isBuilding ? BAR_WIDTH + 6 : BAR_WIDTH;
		const centerX = pos.x * TILE_SIZE + TILE_SIZE / 2;
		const centerY = pos.y * TILE_SIZE + TILE_SIZE / 2;

		const barX = centerX - barWidth / 2;
		const barY = centerY + BAR_OFFSET_Y;

		// Background
		graphics.fillStyle(BAR_BG_COLOR, BAR_BG_ALPHA);
		graphics.fillRect(barX, barY, barWidth, BAR_HEIGHT);

		// Health fill
		const fillWidth = barWidth * ratio;
		const color = hpBarColor(ratio);
		graphics.fillStyle(color, 0.9);
		graphics.fillRect(barX, barY, fillWidth, BAR_HEIGHT);
	}
}
