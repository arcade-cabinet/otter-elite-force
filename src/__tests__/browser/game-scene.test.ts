/**
 * Browser Integration Test — GameScene
 *
 * Verifies that GameScene creates the tilemap, initializes fog of war,
 * sets up the weather system, and launches HUD in parallel.
 *
 * We use a minimal BootScene stub that generates the required placeholder
 * textures and transitions directly to GameScene with mission data.
 */
import Phaser from "phaser";
import { afterEach, describe, expect, it } from "vitest";
import { GameScene } from "@/Scenes/GameScene";
import { HUDScene } from "@/Scenes/HUDScene";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

/**
 * Stub BootScene — generates placeholder textures that GameScene's tilemap
 * renderer and HUDScene expect, then launches GameScene with mission 1 data.
 */
class TestBootScene extends Phaser.Scene {
	constructor() {
		super({ key: "TestBoot" });
	}

	create(): void {
		// Generate the same placeholder textures that the real BootScene creates
		const placeholders: Array<[string, number]> = [
			["river-rat", 0x6b8e23],
			["mudfoot", 0x556b2f],
			["shellcracker", 0x8b4513],
			["gator", 0x2f4f2f],
			["command-post", 0x8b6914],
			["barracks", 0x654321],
			["watchtower", 0x4a3728],
			["fish-trap", 0x2e8b57],
			["burrow", 0x3e2723],
			["sandbag-wall", 0x808080],
			["grass", 0x228b22],
			["water", 0x1e90ff],
			["mud", 0x8b7355],
			["dirt", 0xa0522d],
			["mangrove", 0x006400],
			["bridge", 0x8b7765],
			["toxic-sludge", 0x7cfc00],
			["tall-grass", 0x32cd32],
			["portrait-foxhound", 0x4a4a4a],
		];

		for (const [key, color] of placeholders) {
			const size = key.startsWith("portrait") ? 64 : 16;
			const gfx = this.add.graphics();
			gfx.fillStyle(color, 1);
			gfx.fillRect(0, 0, size, size);
			gfx.generateTexture(key, size, size);
			gfx.destroy();
		}

		this.scene.start("Game", { missionId: 1, difficulty: "support" });
	}
}

describe("GameScene (browser)", () => {
	let handle: TestGameHandle;

	afterEach(() => {
		handle?.destroy();
	});

	it("should create the tilemap for mission 1", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");

		// GameScene should have a tilemap created by loadMission()
		// The tilemap is added to the scene's display list as a TilemapLayer
		const tilemapLayers = gameScene.children.list.filter(
			(child) => child instanceof Phaser.Tilemaps.TilemapLayer,
		);
		expect(tilemapLayers.length).toBeGreaterThan(0);
	});

	it("should initialize fog of war system", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");

		// FogOfWarSystem creates a RenderTexture at depth 1000
		const fogOverlay = gameScene.children.list.find(
			(child) => child instanceof Phaser.GameObjects.RenderTexture && child.depth === 1000,
		);
		expect(fogOverlay).toBeDefined();
	});

	it("should launch HUD scene in parallel", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		await handle.waitForScene("Game");

		// HUD should be launched as a parallel scene
		const hudScene = await handle.waitForScene("HUD");
		expect(hudScene).toBeDefined();
		expect(hudScene.scene.isActive()).toBe(true);
	});

	it("should set camera bounds to match map dimensions", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");
		const cam = gameScene.cameras.main;

		// Mission 1 is 48x40 tiles at 32px each = 1536x1280
		const bounds = cam.getBounds();
		expect(bounds.width).toBe(48 * 32);
		expect(bounds.height).toBe(40 * 32);
	});
});
