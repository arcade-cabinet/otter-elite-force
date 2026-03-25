/**
 * Koota ↔ Phaser Sync Layer
 *
 * Bridges the Koota ECS world (authoritative game state) with Phaser sprites
 * (visual representation). Koota owns the data; Phaser owns the pixels.
 *
 * Lifecycle:
 * 1. Entity gains Position + UnitType → create Phaser Sprite, store in PhaserSprite trait
 * 2. Each frame: Koota Position → Phaser sprite (x, y)
 * 3. Entity destroyed / Position removed → destroy Phaser sprite
 * 4. Sprite click → resolve kootaEntity → toggle Selected trait
 *
 * Spec reference: §14 — Koota ↔ Phaser Sync Layer
 */

import type { Entity, World } from "koota";
import { createAdded, createRemoved } from "koota";
import type Phaser from "phaser";
import { getBuilding, getHero, getResource, getUnit } from "@/entities/registry";
import { Selected, UnitType } from "../ecs/traits/identity";
import { PhaserSprite } from "../ecs/traits/phaser";
import { Position } from "../ecs/traits/spatial";

/** Tile size in pixels — must match the tilemap renderer. */
const TILE_SIZE = 32;

// Change-detection trackers (one instance per sync system lifecycle).
const Added = createAdded();
const Removed = createRemoved();

function resolveAtlasCategory(entityId: string): "units" | "buildings" | "resources" | null {
	if (getUnit(entityId) || getHero(entityId)) return "units";
	if (getBuilding(entityId)) return "buildings";
	if (getResource(entityId)) return "resources";
	return null;
}

function createEntitySprite(
	scene: Phaser.Scene,
	textureKey: string,
	x: number,
	y: number,
): Phaser.GameObjects.Sprite | null {
	const category = resolveAtlasCategory(textureKey);
	const atlasScale = String(scene.registry.get("atlasScale") ?? "2x");

	if (category) {
		const atlasKey = `${category}_${atlasScale}`;
		if (scene.textures.exists(atlasKey) && scene.textures.get(atlasKey).has(textureKey)) {
			return scene.add.sprite(x, y, atlasKey, textureKey);
		}
	}

	if (scene.textures.exists(textureKey)) {
		return scene.add.sprite(x, y, textureKey);
	}

	console.warn(`[syncSystem] Missing sprite frame for entity '${textureKey}'`);
	return null;
}

/**
 * Create Phaser sprites for newly spawned Koota entities that have
 * Position + UnitType but no PhaserSprite yet.
 */
export function syncNewEntities(world: World, scene: Phaser.Scene): void {
	const newEntities = world.query(Added(Position), UnitType);
	for (const entity of newEntities) {
		if (entity.has(PhaserSprite)) continue;

		const pos = entity.get(Position);
		const unitType = entity.get(UnitType);
		if (!pos || !unitType) continue;

		const textureKey = unitType.type;

		const sprite = createEntitySprite(
			scene,
			textureKey,
			pos.x * TILE_SIZE + TILE_SIZE / 2,
			pos.y * TILE_SIZE + TILE_SIZE / 2,
		);
		if (!sprite) continue;
		sprite.setInteractive();
		sprite.setData("kootaEntity", entity);

		entity.add(PhaserSprite);
		// PhaserSprite is AoS — get returns a ref we can't reassign.
		// Instead we store the sprite in a WeakMap keyed by entity,
		// OR we can use set() which for AoS replaces the stored value.
		// Koota AoS trait(() => null) — the store slot holds the value directly.
		// We need to re-add with the sprite value. Let's use the world event approach.
		// Actually, for AoS traits initialized with a callback, the store is an array
		// of the callback return values. We can't pass initial data on add().
		// Solution: store sprite refs in a side Map, accessed by the sync system.
		spriteMap.set(entity, sprite);
	}
}

/**
 * External sprite map — maps Koota Entity → Phaser Sprite.
 * This is the canonical lookup for the sync layer since Koota AoS traits
 * initialized with `trait(() => null)` cannot receive initial data on add().
 */
export const spriteMap = new Map<Entity, Phaser.GameObjects.Sprite>();

/**
 * Sync Koota Position → Phaser sprite position each frame.
 */
export function syncPositions(world: World): void {
	const entities = world.query(Position, PhaserSprite);
	for (const entity of entities) {
		const sprite = spriteMap.get(entity);
		if (!sprite) continue;

		const pos = entity.get(Position);
		if (!pos) continue;
		sprite.x = pos.x * TILE_SIZE + TILE_SIZE / 2;
		sprite.y = pos.y * TILE_SIZE + TILE_SIZE / 2;
	}
}

/**
 * Clean up Phaser sprites for entities that lost Position or were destroyed.
 */
export function syncRemovedEntities(world: World): void {
	const removed = world.query(Removed(Position));
	for (const entity of removed) {
		const sprite = spriteMap.get(entity);
		if (sprite) {
			sprite.destroy();
			spriteMap.delete(entity);
		}
	}
}

/**
 * Handle a Phaser sprite click → resolve to Koota entity → toggle Selected.
 * Call this from the scene's pointerdown handler or attach to each sprite.
 */
export function handleSpriteClick(
	world: World,
	sprite: Phaser.GameObjects.Sprite,
	addToSelection: boolean,
): void {
	const entity = sprite.getData("kootaEntity") as Entity | undefined;
	if (!entity) return;

	if (!addToSelection) {
		// Deselect all currently selected entities
		const selected = world.query(Selected);
		for (const sel of selected) {
			sel.remove(Selected);
		}
	}

	if (entity.has(Selected)) {
		entity.remove(Selected);
	} else {
		entity.add(Selected);
	}
}

/**
 * Master sync function — call once per frame from GameScene.update().
 * Handles the full entity lifecycle: create → sync → destroy.
 */
export function syncKootaToPhaser(world: World, scene: Phaser.Scene): void {
	syncNewEntities(world, scene);
	syncPositions(world);
	syncRemovedEntities(world);
}

/**
 * Clean up all tracked sprites. Call when leaving the GameScene.
 */
export function destroyAllSprites(): void {
	for (const sprite of spriteMap.values()) {
		sprite.destroy();
	}
	spriteMap.clear();
}
