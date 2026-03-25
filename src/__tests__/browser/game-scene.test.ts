/**
 * Browser Integration Test — GameScene
 *
 * Verifies that GameScene creates the tilemap, initializes fog of war,
 * and exposes the battlefield state expected by the React HUD shell.
 *
 * We use a minimal BootScene stub that generates the required placeholder
 * textures and transitions directly to GameScene with mission data.
 */
import Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createScenePlaytester } from "@/ai/playtester";
import { GameScene } from "@/Scenes/GameScene";
import { initSingletons } from "@/ecs/singletons";
import { Objectives, CurrentMission } from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

/**
 * Stub BootScene — generates placeholder textures that GameScene's tilemap
 * renderer expects, then launches GameScene with mission 1 data.
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

	beforeEach(() => {
		// Ensure singleton traits are present before GameScene.create() calls resetSessionState()
		if (!world.has(CurrentMission)) {
			initSingletons(world);
		}
	});

	afterEach(() => {
		handle?.destroy();
	});

	it("should paint the terrain background for mission 1", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");

		// GameScene paints terrain onto a Canvas and adds it as a Phaser.Image
		// with texture key "terrain-bg" — not a TilemapLayer.
		const terrainBg = gameScene.children.list.find(
			(child) => child instanceof Phaser.GameObjects.Image && child.texture.key === "terrain-bg",
		);
		expect(terrainBg).toBeDefined();
	});

	it("should initialize fog of war system", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
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

	it("should create a battlefield readability overlay layer", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");
		const readabilityOverlay = gameScene.children.list.find(
			(child) => child instanceof Phaser.GameObjects.Graphics && child.depth === 950,
		);

		expect(readabilityOverlay).toBeDefined();
	});

	it("should allow a playtester to attach to the live scene host", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");
		const ai = createScenePlaytester(gameScene, world, {
			errorRate: 0,
			maxMisclickOffset: 0,
		});

		await ai.tick(1000);

		expect(ai.getLastPerception()).not.toBeNull();
	});

	it("should expose current mission and directives through singleton state", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
			width: 1280,
			height: 720,
		});

		await handle.waitForScene("Game");
		expect(world.get(CurrentMission)?.missionId).toBe("mission_1");
		expect(world.get(Objectives)?.list.length ?? 0).toBeGreaterThan(0);
	});

	it("should seed current mission and directives into singleton state", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
			width: 1280,
			height: 720,
		});

		await handle.waitForScene("Game");

		expect(world.get(CurrentMission)?.missionId).toBe("mission_1");
		expect(world.get(Objectives)?.list.map((objective) => objective.id)).toEqual([
			"build-command-post",
			"build-barracks",
			"train-mudfoots",
			"gather-salvage",
		]);
	});

	it("should set camera bounds to match map dimensions", async () => {
		handle = await createTestGame({
			scenes: [TestBootScene, GameScene],
			width: 1280,
			height: 720,
		});

		const gameScene = await handle.waitForScene("Game");
		const cam = gameScene.cameras.main;

		// Mission 1 terrain is 48×44 tiles at 32px each = 1536×1408
		const bounds = cam.getBounds();
		expect(bounds.width).toBe(48 * 32);
		expect(bounds.height).toBe(44 * 32);
	});
});
