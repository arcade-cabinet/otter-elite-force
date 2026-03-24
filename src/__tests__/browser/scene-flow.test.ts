/**
 * Browser Integration Test — Full Scene Flow
 *
 * Verifies the complete scene transition chain:
 *   Boot → Menu → Briefing → Game
 *
 * This is the highest-level integration test — it boots a real Phaser game
 * with all scenes and drives the UI through pointer events.
 */
import Phaser from "phaser";
import { afterEach, describe, expect, it } from "vitest";
import {
	BootScene,
	BriefingScene,
	CampaignMapScene,
	GameScene,
	HUDScene,
	MenuScene,
	PauseScene,
	VictoryScene,
} from "@/Scenes";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

/** All 8 production scenes in boot order. */
const ALL_SCENES = [
	BootScene,
	MenuScene,
	CampaignMapScene,
	BriefingScene,
	GameScene,
	HUDScene,
	PauseScene,
	VictoryScene,
];

/**
 * Helper — simulate a pointer click at (x, y) in a scene.
 * Fires pointerdown on the input plugin, which triggers Zone interactivity.
 */
function clickAt(scene: Phaser.Scene, x: number, y: number): void {
	scene.input.emit(
		"pointerdown",
		{
			x,
			y,
			worldX: x,
			worldY: y,
			downX: x,
			downY: y,
			isDown: true,
		} as Partial<Phaser.Input.Pointer>,
		[],
	);
}

describe("Scene Flow (browser)", () => {
	let handle: TestGameHandle;

	afterEach(() => {
		handle?.destroy();
	});

	it("should boot and reach Menu scene automatically", async () => {
		handle = await createTestGame({ scenes: ALL_SCENES, width: 1280, height: 720 });

		// Boot → Menu happens automatically (BootScene.create calls scene.start("Menu"))
		const menuScene = await handle.waitForScene("Menu");
		expect(menuScene.scene.key).toBe("Menu");
		expect(menuScene.scene.isActive()).toBe(true);
	});

	it("should transition from Menu to Briefing when NEW DEPLOYMENT is clicked", async () => {
		handle = await createTestGame({ scenes: ALL_SCENES, width: 1280, height: 720 });
		const menuScene = await handle.waitForScene("Menu");

		// "NEW DEPLOYMENT" button is at (640, 220) — center X, first button Y
		// The Zone interactive area is 280x50 centered at that point.
		// Use Phaser's input manager to emit a pointer event on the scene.
		const zones = menuScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Zone,
		) as Phaser.GameObjects.Zone[];

		// First zone is "NEW DEPLOYMENT"
		const newDeployZone = zones[0];
		expect(newDeployZone).toBeDefined();

		// Emit pointerdown on the zone to trigger the callback
		newDeployZone.emit("pointerdown");

		// Should transition to Briefing
		const briefingScene = await handle.waitForScene("Briefing");
		expect(briefingScene.scene.key).toBe("Briefing");
	});

	it("should transition from Briefing to Game when DEPLOY is clicked after dialogue", async () => {
		handle = await createTestGame({ scenes: ALL_SCENES, width: 1280, height: 720 });
		const menuScene = await handle.waitForScene("Menu");

		// Click NEW DEPLOYMENT
		const menuZones = menuScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Zone,
		) as Phaser.GameObjects.Zone[];
		menuZones[0].emit("pointerdown");

		const briefingScene = await handle.waitForScene("Briefing");

		// Mission 1 has 4 dialogue lines. We need to advance through all of them.
		// Each click either finishes the typewriter or advances to next line.
		// 4 lines × 2 clicks each (first to complete typewriter, second to advance) = 8 clicks
		// Plus one final click to finish the last line.
		for (let i = 0; i < 10; i++) {
			clickAt(briefingScene, 640, 300);
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		// Wait for the deploy button tween to complete (500ms)
		await new Promise((resolve) => setTimeout(resolve, 600));

		// Find the deploy button container and click it
		const containers = briefingScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Container,
		) as Phaser.GameObjects.Container[];

		// The deploy button is the last container added
		const deployButton = containers[containers.length - 1];
		expect(deployButton).toBeDefined();
		deployButton.emit("pointerdown");

		// Should transition to Game
		const gameScene = await handle.waitForScene("Game");
		expect(gameScene.scene.key).toBe("Game");
	});

	it("should have all 8 scenes registered in the game", async () => {
		handle = await createTestGame({ scenes: ALL_SCENES, width: 1280, height: 720 });
		await handle.waitForScene("Menu");

		const expectedKeys = [
			"Boot",
			"Menu",
			"CampaignMap",
			"Briefing",
			"Game",
			"HUD",
			"Pause",
			"Victory",
		];
		for (const key of expectedKeys) {
			const scene = handle.game.scene.getScene(key);
			expect(scene, `scene "${key}" should be registered`).toBeDefined();
		}
	});
});
