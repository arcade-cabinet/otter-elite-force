/**
 * Construction Progress Visual — US-023
 *
 * Renders construction progress as alpha on building sprites:
 * - 0% progress: foundation outline at low alpha (0.3)
 * - Alpha increases linearly from 0.3 to 1.0 during construction
 * - 100% complete: brief flash flourish (white flash), then full alpha
 *
 * Also exposes construction percentage for the UnitPanel.
 */

import type { Entity, World } from "koota";
import type Phaser from "phaser";
import { ConstructionProgress } from "@/ecs/traits/economy";
import { IsBuilding } from "@/ecs/traits/identity";
import { PhaserSprite } from "@/ecs/traits/phaser";

const MIN_ALPHA = 0.3;
const MAX_ALPHA = 1.0;

/** Duration of the completion flourish in seconds. */
const FLOURISH_DURATION = 0.3;

/** Track which entities have had their completion flourish shown */
const completedSet = new Set<Entity>();
/** Track active flourishes */
const flourishTimers = new Map<Entity, number>();

/**
 * Calculate the sprite alpha for a given construction progress percentage (0..100).
 */
export function constructionAlpha(progress: number): number {
	const clamped = Math.max(0, Math.min(100, progress));
	return MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * (clamped / 100);
}

/**
 * Get construction percentage for a building entity.
 * Returns null if the entity is not under construction.
 */
export function getConstructionPercent(entity: Entity): number | null {
	if (!entity.has(ConstructionProgress)) return null;
	const cp = entity.get(ConstructionProgress);
	if (!cp) return null;
	return cp.progress;
}

/**
 * Sync building sprite alpha to construction progress.
 * Call once per frame from the render loop.
 *
 * @param spriteMap Map of Entity -> Phaser Sprite from the sync layer
 * @param delta Time elapsed in seconds
 */
export function syncConstructionVisuals(
	world: World,
	spriteMap: Map<Entity, Phaser.GameObjects.Sprite>,
	delta: number,
): void {
	// Update buildings under construction
	const buildings = world.query(IsBuilding, PhaserSprite, ConstructionProgress);
	for (const entity of buildings) {
		const sprite = spriteMap.get(entity);
		if (!sprite) continue;

		const cp = entity.get(ConstructionProgress);
		if (!cp) continue;

		const alpha = constructionAlpha(cp.progress);
		sprite.setAlpha(alpha);

		// Check for completion
		if (cp.progress >= 100 && !completedSet.has(entity)) {
			completedSet.add(entity);
			flourishTimers.set(entity, FLOURISH_DURATION);
			sprite.setTint(0xffffff);
		}
	}

	// Update completed buildings (no longer have ConstructionProgress)
	// This catches the frame after ConstructionProgress is removed
	const completeBuildings = world.query(IsBuilding, PhaserSprite);
	for (const entity of completeBuildings) {
		if (entity.has(ConstructionProgress)) continue;

		const sprite = spriteMap.get(entity);
		if (!sprite) continue;

		// Ensure full alpha for completed buildings
		if (sprite.alpha < MAX_ALPHA) {
			sprite.setAlpha(MAX_ALPHA);
		}

		// Process flourish timer
		const remaining = flourishTimers.get(entity);
		if (remaining !== undefined) {
			const newRemaining = remaining - delta;
			if (newRemaining <= 0) {
				flourishTimers.delete(entity);
				sprite.clearTint();
			} else {
				flourishTimers.set(entity, newRemaining);
				// Fade tint from white back to normal
				const t = newRemaining / FLOURISH_DURATION;
				const brightness = Math.floor(128 + 127 * t);
				const tint = (brightness << 16) | (brightness << 8) | brightness;
				sprite.setTint(tint);
			}
		}
	}
}

/**
 * Reset tracking state. Call when leaving a scene.
 */
export function resetConstructionVisuals(): void {
	completedSet.clear();
	flourishTimers.clear();
}
