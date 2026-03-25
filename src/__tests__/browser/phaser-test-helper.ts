/**
 * Phaser Test Helper — boots a real Phaser.Game in headless Chromium for integration tests.
 *
 * Provides:
 * - createTestGame(): configurable game factory that auto-registers cleanup
 * - waitForScene(): waits until a named scene fires its "create" event
 * - destroyGame(): tears down the Phaser instance
 *
 * Usage pattern in tests:
 *   const { game, waitForScene, destroy } = await createTestGame({ scenes });
 *   await waitForScene("Boot");
 *   // assertions...
 *   destroy();
 */
import Phaser from "phaser";

export interface TestGameOptions {
	/** Scene classes to register. First scene auto-starts. */
	scenes: Array<typeof Phaser.Scene>;
	/** Initial data to pass to the first scene. */
	initData?: Record<string, unknown>;
	/** Canvas width (default 640). */
	width?: number;
	/** Canvas height (default 480). */
	height?: number;
}

export interface TestGameHandle {
	game: Phaser.Game;
	/** Resolves when the named scene fires its "create" event. */
	waitForScene: (key: string, timeoutMs?: number) => Promise<Phaser.Scene>;
	/** Destroy the Phaser game and remove the DOM container. */
	destroy: () => void;
}

/**
 * Boot a Phaser game configured for integration testing.
 *
 * Uses CANVAS renderer (more reliable than WebGL in headless Chromium).
 * Creates a throwaway DOM container so each test is isolated.
 */
export function createTestGame(options: TestGameOptions): Promise<TestGameHandle> {
	const { scenes, width = 640, height = 480 } = options;

	// Create an isolated container per test
	const container = document.createElement("div");
	container.id = `phaser-test-${Date.now()}`;
	container.style.width = `${width}px`;
	container.style.height = `${height}px`;
	document.body.appendChild(container);

	const config: Phaser.Types.Core.GameConfig = {
		type: Phaser.CANVAS,
		parent: container,
		width,
		height,
		backgroundColor: "#000000",
		banner: false,
		audio: { noAudio: true },
		render: {
			pixelArt: true,
			antialias: false,
		},
		scene: scenes,
	};

	return new Promise<TestGameHandle>((resolve) => {
		const game = new Phaser.Game(config);

		const destroy = () => {
			game.destroy(true);
			container.remove();
		};

		const waitForScene = (key: string, timeoutMs = 10000): Promise<Phaser.Scene> => {
			return new Promise<Phaser.Scene>((res, rej) => {
				const scene = game.scene.getScene(key);
				if (scene && scene.scene.isActive()) {
					res(scene);
					return;
				}

				const timer = setTimeout(() => {
					rej(new Error(`Timed out waiting for scene "${key}" after ${timeoutMs}ms`));
				}, timeoutMs);

				// Poll for the scene becoming active — Phaser scene events can be missed
				// if we subscribe too late, so polling is more reliable.
				const interval = setInterval(() => {
					const s = game.scene.getScene(key);
					if (s && s.scene.isActive()) {
						clearTimeout(timer);
						clearInterval(interval);
						res(s);
					}
				}, 50);
			});
		};

		// Wait for the Phaser "ready" event before handing back
		game.events.once("ready", () => {
			resolve({ game, waitForScene, destroy });
		});
	});
}
