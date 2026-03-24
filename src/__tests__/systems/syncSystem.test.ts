import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createWorld } from "koota";
import { UnitType, IsBuilding, Selected } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { PhaserSprite } from "@/ecs/traits/phaser";
import {
	syncKootaToPhaser,
	syncNewEntities,
	syncPositions,
	syncRemovedEntities,
	handleSpriteClick,
	spriteMap,
	destroyAllSprites,
} from "@/systems/syncSystem";

/** Minimal mock for Phaser.GameObjects.Sprite */
function createMockSprite(x = 0, y = 0) {
	return {
		x,
		y,
		setInteractive: vi.fn().mockReturnThis(),
		setData: vi.fn().mockReturnThis(),
		getData: vi.fn(),
		destroy: vi.fn(),
		_data: {} as Record<string, unknown>,
	};
}

/** Minimal mock for Phaser.Scene */
function createMockScene() {
	const sprites: ReturnType<typeof createMockSprite>[] = [];
	return {
		add: {
			sprite: vi.fn((x: number, y: number, _texture: string) => {
				const s = createMockSprite(x, y);
				// Wire up getData to return stored data
				s.setData.mockImplementation((key: string, value: unknown) => {
					s._data[key] = value;
					return s;
				});
				s.getData.mockImplementation((key: string) => s._data[key]);
				sprites.push(s);
				return s;
			}),
		},
		_sprites: sprites,
	};
}

type MockScene = ReturnType<typeof createMockScene>;

describe("Koota↔Phaser Sync System", () => {
	let world: ReturnType<typeof createWorld>;
	let scene: MockScene;

	beforeEach(() => {
		world = createWorld();
		scene = createMockScene();
		spriteMap.clear();
	});

	afterEach(() => {
		destroyAllSprites();
		world.destroy();
	});

	describe("syncNewEntities", () => {
		it("should create a Phaser sprite when entity gains Position + UnitType", () => {
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "mudfoot" });
			entity.set(Position, { x: 3, y: 7 });

			syncNewEntities(world, scene as unknown as Phaser.Scene);

			// Sprite should have been created
			expect(scene.add.sprite).toHaveBeenCalledOnce();
			expect(scene.add.sprite).toHaveBeenCalledWith(3 * 32 + 16, 7 * 32 + 16, "mudfoot");

			// Entity should have PhaserSprite trait
			expect(entity.has(PhaserSprite)).toBe(true);

			// Sprite should be in the spriteMap
			expect(spriteMap.has(entity)).toBe(true);

			// Sprite should have back-reference to entity
			const sprite = scene._sprites[0];
			expect(sprite.setData).toHaveBeenCalledWith("kootaEntity", entity);
			expect(sprite.setInteractive).toHaveBeenCalled();
		});

		it("should create sprite for building entities using UnitType as texture key", () => {
			const entity = world.spawn(Position, UnitType, IsBuilding);
			entity.set(UnitType, { type: "barracks" });

			syncNewEntities(world, scene as unknown as Phaser.Scene);

			expect(scene.add.sprite).toHaveBeenCalledWith(
				expect.any(Number),
				expect.any(Number),
				"barracks",
			);
		});

		it("should not create duplicate sprites on repeated calls", () => {
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "mudfoot" });

			syncNewEntities(world, scene as unknown as Phaser.Scene);
			syncNewEntities(world, scene as unknown as Phaser.Scene);

			// Only one sprite should exist
			expect(scene._sprites).toHaveLength(1);
		});
	});

	describe("syncPositions", () => {
		it("should update Phaser sprite position from Koota Position", () => {
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "river_rat" });
			entity.set(Position, { x: 1, y: 2 });

			// Create sprite via sync
			syncNewEntities(world, scene as unknown as Phaser.Scene);
			const sprite = spriteMap.get(entity)!;

			// Move entity in ECS
			entity.set(Position, { x: 5, y: 10 });

			// Sync positions
			syncPositions(world);

			expect(sprite.x).toBe(5 * 32 + 16);
			expect(sprite.y).toBe(10 * 32 + 16);
		});
	});

	describe("syncRemovedEntities", () => {
		it("should destroy Phaser sprite when entity is destroyed", () => {
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "gator" });

			syncNewEntities(world, scene as unknown as Phaser.Scene);
			const sprite = spriteMap.get(entity)!;
			expect(sprite).toBeDefined();

			// Destroy the entity
			entity.destroy();

			// Run removal sync
			syncRemovedEntities(world);

			expect(sprite.destroy).toHaveBeenCalled();
			expect(spriteMap.has(entity)).toBe(false);
		});

		it("should destroy Phaser sprite when Position trait is removed", () => {
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "mudfoot" });

			syncNewEntities(world, scene as unknown as Phaser.Scene);
			const sprite = spriteMap.get(entity)!;

			// Remove Position trait
			entity.remove(Position);

			syncRemovedEntities(world);

			expect(sprite.destroy).toHaveBeenCalled();
			expect(spriteMap.has(entity)).toBe(false);
		});
	});

	describe("handleSpriteClick", () => {
		it("should add Selected trait to clicked entity", () => {
			const entity = world.spawn(Position, UnitType);

			const mockSprite = createMockSprite();
			mockSprite.getData.mockReturnValue(entity);

			handleSpriteClick(world, mockSprite as unknown as Phaser.GameObjects.Sprite, false);

			expect(entity.has(Selected)).toBe(true);
		});

		it("should deselect all others when addToSelection is false", () => {
			const entity1 = world.spawn(Position, UnitType, Selected);
			const entity2 = world.spawn(Position, UnitType);

			const mockSprite = createMockSprite();
			mockSprite.getData.mockReturnValue(entity2);

			handleSpriteClick(world, mockSprite as unknown as Phaser.GameObjects.Sprite, false);

			expect(entity1.has(Selected)).toBe(false);
			expect(entity2.has(Selected)).toBe(true);
		});

		it("should add to selection when addToSelection is true", () => {
			const entity1 = world.spawn(Position, UnitType, Selected);
			const entity2 = world.spawn(Position, UnitType);

			const mockSprite = createMockSprite();
			mockSprite.getData.mockReturnValue(entity2);

			handleSpriteClick(world, mockSprite as unknown as Phaser.GameObjects.Sprite, true);

			expect(entity1.has(Selected)).toBe(true);
			expect(entity2.has(Selected)).toBe(true);
		});

		it("should toggle off when clicking an already selected entity", () => {
			const entity = world.spawn(Position, UnitType, Selected);

			const mockSprite = createMockSprite();
			mockSprite.getData.mockReturnValue(entity);

			handleSpriteClick(world, mockSprite as unknown as Phaser.GameObjects.Sprite, true);

			expect(entity.has(Selected)).toBe(false);
		});
	});

	describe("syncKootaToPhaser (master function)", () => {
		it("should handle full lifecycle: create → sync → destroy", () => {
			// Step 1: spawn entity
			const entity = world.spawn(Position, UnitType);
			entity.set(UnitType, { type: "shellcracker" });
			entity.set(Position, { x: 2, y: 3 });

			// First frame: creates sprite
			syncKootaToPhaser(world, scene as unknown as Phaser.Scene);
			expect(scene._sprites).toHaveLength(1);
			const sprite = spriteMap.get(entity)!;
			expect(sprite.x).toBe(2 * 32 + 16);
			expect(sprite.y).toBe(3 * 32 + 16);

			// Step 2: move entity
			entity.set(Position, { x: 8, y: 4 });
			syncKootaToPhaser(world, scene as unknown as Phaser.Scene);
			expect(sprite.x).toBe(8 * 32 + 16);
			expect(sprite.y).toBe(4 * 32 + 16);

			// Step 3: destroy entity
			entity.destroy();
			syncKootaToPhaser(world, scene as unknown as Phaser.Scene);
			expect(sprite.destroy).toHaveBeenCalled();
			expect(spriteMap.size).toBe(0);
		});
	});

	describe("destroyAllSprites", () => {
		it("should clean up all tracked sprites", () => {
			world.spawn(Position, UnitType).set(UnitType, { type: "a" });
			world.spawn(Position, UnitType).set(UnitType, { type: "b" });

			syncNewEntities(world, scene as unknown as Phaser.Scene);
			expect(spriteMap.size).toBe(2);

			destroyAllSprites();

			expect(spriteMap.size).toBe(0);
			for (const s of scene._sprites) {
				expect(s.destroy).toHaveBeenCalled();
			}
		});
	});
});
