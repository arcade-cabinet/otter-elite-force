/**
 * Browser Integration Test — Sync Layer
 *
 * Verifies that the Koota→Phaser sync layer creates sprites when entities
 * are spawned with Position + UnitType traits, updates positions, and
 * cleans up on removal.
 */
import Phaser from "phaser";
import { afterEach, describe, expect, it } from "vitest";
import { UnitType } from "@/ecs/traits/identity";
import { PhaserSprite } from "@/ecs/traits/phaser";
import { Position } from "@/ecs/traits/spatial";
import { world } from "@/ecs/world";
import {
	destroyAllSprites,
	spriteMap,
	syncNewEntities,
	syncPositions,
	syncRemovedEntities,
} from "@/systems/syncSystem";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

/**
 * Minimal scene that generates placeholder textures for sync targets.
 */
class SyncTestScene extends Phaser.Scene {
	constructor() {
		super({ key: "SyncTest" });
	}

	create(): void {
		const gfx = this.add.graphics();
		gfx.fillStyle(0x6b8e23, 1);
		gfx.fillRect(0, 0, 16, 16);
		gfx.generateTexture("river_rat", 16, 16);
		gfx.generateTexture("gator_grunt", 16, 16);
		gfx.destroy();
	}
}

describe("Sync Layer (browser)", () => {
	let handle: TestGameHandle;

	afterEach(() => {
		// Clean up all tracked sprites and ECS entities
		destroyAllSprites();
		world.query(Position).forEach((entity) => entity.destroy());
		handle?.destroy();
	});

	it("should create a Phaser sprite when entity gets Position + UnitType", async () => {
		handle = await createTestGame({ scenes: [SyncTestScene] });
		const scene = await handle.waitForScene("SyncTest");

		const entity = world.spawn(Position({ x: 5, y: 10 }), UnitType({ type: "river_rat" }));
		syncNewEntities(world, scene);

		// Entity should now have a PhaserSprite trait
		expect(entity.has(PhaserSprite)).toBe(true);

		// The sprite should be tracked in the spriteMap
		expect(spriteMap.has(entity)).toBe(true);

		// The sprite should be in the scene's display list
		const sprites = scene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Sprite,
		);
		expect(sprites.length).toBeGreaterThanOrEqual(1);
	});

	it("should position sprite at tile coordinates * TILE_SIZE", async () => {
		handle = await createTestGame({ scenes: [SyncTestScene] });
		const scene = await handle.waitForScene("SyncTest");

		const entity = world.spawn(Position({ x: 3, y: 7 }), UnitType({ type: "river_rat" }));
		syncNewEntities(world, scene);

		const sprite = spriteMap.get(entity);
		expect(sprite).toBeDefined();

		// Tile position * 32 + 16 (center of tile)
		expect(sprite!.x).toBe(3 * 32 + 16);
		expect(sprite!.y).toBe(7 * 32 + 16);
	});

	it("should update sprite position when entity Position changes", async () => {
		handle = await createTestGame({ scenes: [SyncTestScene] });
		const scene = await handle.waitForScene("SyncTest");

		const entity = world.spawn(Position({ x: 0, y: 0 }), UnitType({ type: "river_rat" }));
		syncNewEntities(world, scene);

		// Move the entity in ECS
		entity.set(Position, { x: 10, y: 5 });
		syncPositions(world);

		const sprite = spriteMap.get(entity);
		expect(sprite!.x).toBe(10 * 32 + 16);
		expect(sprite!.y).toBe(5 * 32 + 16);
	});

	it("should destroy sprite when entity is removed", async () => {
		handle = await createTestGame({ scenes: [SyncTestScene] });
		const scene = await handle.waitForScene("SyncTest");

		const entity = world.spawn(Position({ x: 1, y: 1 }), UnitType({ type: "river_rat" }));
		syncNewEntities(world, scene);

		const spritesBefore = scene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Sprite,
		).length;

		entity.destroy();
		syncRemovedEntities(world);

		const spritesAfter = scene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Sprite,
		).length;

		expect(spritesAfter).toBe(spritesBefore - 1);
	});
});
