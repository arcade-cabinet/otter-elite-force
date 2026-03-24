/**
 * Browser Integration Test — HUDScene
 *
 * Verifies that HUDScene displays resource counts, minimap, unit info panel,
 * and action panel. Tests Zustand store subscription for live resource updates.
 */
import Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HUDScene } from "@/Scenes/HUDScene";
import { resourceStore } from "@/stores/resourceStore";
import { createTestGame, type TestGameHandle } from "./phaser-test-helper";

/**
 * Stub GameScene — minimal scene that HUDScene queries for camera bounds
 * (minimap needs game.scene.get("Game").cameras.main).
 */
class StubGameScene extends Phaser.Scene {
	constructor() {
		super({ key: "Game" });
	}

	create(): void {
		this.cameras.main.setBounds(0, 0, 1536, 1280);
		this.scene.launch("HUD", { missionId: 1, difficulty: "support" });
	}
}

/**
 * Stub BootScene — generates placeholder textures HUDScene may reference.
 */
class StubBootScene extends Phaser.Scene {
	constructor() {
		super({ key: "Boot" });
	}

	create(): void {
		const gfx = this.add.graphics();
		gfx.fillStyle(0x6b8e23, 1);
		gfx.fillRect(0, 0, 16, 16);
		gfx.generateTexture("river-rat", 16, 16);
		gfx.destroy();

		this.scene.start("Game");
	}
}

describe("HUDScene (browser)", () => {
	let handle: TestGameHandle;

	afterEach(() => {
		// Destroy the game FIRST — this triggers the HUD "shutdown" event
		// which unsubscribes from Zustand stores. Then reset the store safely.
		handle?.destroy();
		resourceStore.getState().reset();
	});

	it("should display resource labels", async () => {
		handle = await createTestGame({
			scenes: [StubBootScene, StubGameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		const hudScene = await handle.waitForScene("HUD");

		// Look for text objects containing resource labels
		const textObjects = hudScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Text,
		) as Phaser.GameObjects.Text[];

		const labels = textObjects.map((t) => t.text);
		expect(labels).toContain("FISH:");
		expect(labels).toContain("TIMBER:");
		expect(labels).toContain("SALVAGE:");
		expect(labels).toContain("POP:");
	});

	it("should display initial resource values as 0", async () => {
		handle = await createTestGame({
			scenes: [StubBootScene, StubGameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		const hudScene = await handle.waitForScene("HUD");

		const textObjects = hudScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Text,
		) as Phaser.GameObjects.Text[];

		// Fish, Timber, Salvage should show "0"
		const zeroTexts = textObjects.filter((t) => t.text === "0");
		expect(zeroTexts.length).toBeGreaterThanOrEqual(3);
	});

	it("should update when resourceStore changes", async () => {
		handle = await createTestGame({
			scenes: [StubBootScene, StubGameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		await handle.waitForScene("HUD");

		// Mutate the Zustand store
		resourceStore.getState().addResources({ fish: 150, timber: 75, salvage: 30 });

		// Wait a frame for the subscription to fire
		await new Promise((resolve) => setTimeout(resolve, 100));

		const hudScene = handle.game.scene.getScene("HUD") as HUDScene;
		const textObjects = hudScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Text,
		) as Phaser.GameObjects.Text[];

		const texts = textObjects.map((t) => t.text);
		expect(texts).toContain("150");
		expect(texts).toContain("75");
		expect(texts).toContain("30");
	});

	it("should display minimap area", async () => {
		handle = await createTestGame({
			scenes: [StubBootScene, StubGameScene, HUDScene],
			width: 1280,
			height: 720,
		});

		const hudScene = await handle.waitForScene("HUD");

		// Minimap has a "MAP" label text
		const textObjects = hudScene.children.list.filter(
			(child) => child instanceof Phaser.GameObjects.Text,
		) as Phaser.GameObjects.Text[];

		const mapLabel = textObjects.find((t) => t.text === "MAP");
		expect(mapLabel).toBeDefined();
	});
});
