/**
 * Browser Integration Test — BootScene
 *
 * Verifies that BootScene loads without errors in a real Chromium environment,
 * generates placeholder textures, and transitions to MenuScene.
 */
import { afterEach, describe, expect, it } from "vitest";
import { BootScene } from "@/Scenes/BootScene";
import { MenuScene } from "@/Scenes/MenuScene";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

describe("BootScene (browser)", () => {
	let handle: TestGameHandle;

	afterEach(() => {
		handle?.destroy();
	});

	it("should load without errors and transition to Menu", async () => {
		handle = await createTestGame({ scenes: [BootScene, MenuScene] });

		// BootScene starts automatically (first in array), then transitions to Menu
		const menuScene = await handle.waitForScene("Menu");
		expect(menuScene).toBeDefined();
		expect(menuScene.scene.key).toBe("Menu");
	});

	it("should generate placeholder textures during preload", async () => {
		handle = await createTestGame({ scenes: [BootScene, MenuScene] });
		await handle.waitForScene("Menu");

		// BootScene generates textures for units, buildings, and terrain
		const textureManager = handle.game.textures;
		const expectedTextures = [
			"river-rat",
			"gator",
			"command-post",
			"barracks",
			"grass",
			"water",
			"mud",
			"bridge",
			"toxic-sludge",
			"portrait-foxhound",
		];

		for (const key of expectedTextures) {
			expect(textureManager.exists(key), `texture "${key}" should exist`).toBe(true);
		}
	});

	it("should have the Boot scene stopped after transitioning", async () => {
		handle = await createTestGame({ scenes: [BootScene, MenuScene] });
		await handle.waitForScene("Menu");

		// After scene.start("Menu"), BootScene should be stopped
		const bootScene = handle.game.scene.getScene("Boot");
		expect(bootScene.scene.isActive()).toBe(false);
	});
});
