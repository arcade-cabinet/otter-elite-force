/**
 * Browser Integration Test — BootScene
 *
 * Verifies that BootScene loads without errors in a real Chromium environment,
 * exposes atlas scale metadata, and transitions to Game when a deployment is queued.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initSingletons } from "@/ecs/singletons";
import { CurrentMission } from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { queueDeployment } from "@/game/deployment";
import { BootScene } from "@/Scenes/BootScene";
import { GameScene } from "@/Scenes/GameScene";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

describe("BootScene (browser)", () => {
	let handle: TestGameHandle;

	beforeEach(() => {
		if (!world.has(CurrentMission)) {
			initSingletons(world);
		}
	});

	afterEach(() => {
		handle?.destroy();
	});

	it("should load without errors and stay on Boot when no deployment is queued", async () => {
		queueDeployment();
		handle = await createTestGame({ scenes: [BootScene] });

		const bootScene = await handle.waitForScene("Boot");
		expect(bootScene).toBeDefined();
		expect(bootScene.scene.key).toBe("Boot");
	});

	it("should register the selected atlas scale in the scene registry", async () => {
		queueDeployment();
		handle = await createTestGame({ scenes: [BootScene] });
		const bootScene = await handle.waitForScene("Boot");

		expect(bootScene.registry.get("atlasScale")).toMatch(/1x|2x|3x/);
	});

	it("should transition to Game when a deployment is queued", async () => {
		queueDeployment({ missionId: 1, difficulty: "support" });
		handle = await createTestGame({ scenes: [BootScene, GameScene], width: 1280, height: 720 });
		const gameScene = await handle.waitForScene("Game");

		const bootScene = handle.game.scene.getScene("Boot");
		expect(gameScene.scene.key).toBe("Game");
		expect(bootScene.scene.isActive()).toBe(false);
	});
});
