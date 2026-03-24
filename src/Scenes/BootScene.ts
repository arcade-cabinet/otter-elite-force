import Phaser from "phaser";
import { consumeDeployment } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";

/**
 * Select the best spritesheet scale based on device DPR and viewport width.
 * Returns "1x", "2x", or "3x".
 */
function selectScale(): string {
	const dpr = window.devicePixelRatio ?? 1;
	const width = window.innerWidth ?? 1024;
	if (width < 768) return "2x";
	if (dpr >= 2 && width >= 1440) return "3x";
	return "2x";
}

/** Spritesheet categories to load, with their asset subdirectory. */
const SHEETS = ["units", "buildings", "resources", "props", "terrain", "portraits"] as const;

export class BootScene extends Phaser.Scene {
	private loadingBar!: Phaser.GameObjects.Graphics;
	private progressBox!: Phaser.GameObjects.Graphics;
	private atlasScale = "2x";

	constructor() {
		super({ key: "Boot" });
	}

	preload(): void {
		this.createLoadingBar();

		this.load.on("progress", (value: number) => {
			this.loadingBar.clear();
			this.loadingBar.fillStyle(0x8b6914, 1);
			this.loadingBar.fillRect(
				this.cameras.main.centerX - 150,
				this.cameras.main.centerY - 15,
				300 * value,
				30,
			);
		});

		this.load.on("complete", () => {
			this.progressBox.destroy();
			this.loadingBar.destroy();
		});

		this.loadSpritesheets();
	}

	create(): void {
		EventBus.emit("boot-complete");
		this.registry.set("atlasScale", this.atlasScale);

		const deployment = consumeDeployment();
		if (deployment) {
			this.scene.start("Game", deployment);
			return;
		}

		EventBus.emit("current-scene-ready", this);
	}

	private createLoadingBar(): void {
		const centerX = this.cameras.main.centerX;
		const centerY = this.cameras.main.centerY;

		this.progressBox = this.add.graphics();
		this.progressBox.fillStyle(0x222222, 0.8);
		this.progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

		this.loadingBar = this.add.graphics();

		const loadingText = this.add.text(centerX, centerY - 50, "DEPLOYING...", {
			fontFamily: "monospace",
			fontSize: "20px",
			color: "#c4a43a",
		});
		loadingText.setOrigin(0.5);
	}

	/**
	 * Load pre-built spritesheet atlases from public/assets/.
	 * Selects the appropriate scale (1x/2x/3x) based on device.
	 * Atlas keys match entity IDs, so GameScene can reference frames
	 * as atlas.frame("mudfoot") or atlas.frame("mudfoot_walk_0").
	 */
	private loadSpritesheets(): void {
		this.atlasScale = selectScale();

		for (const category of SHEETS) {
			const key = `${category}_${this.atlasScale}`;
			const pngPath = `assets/${category}/${key}.png`;
			const jsonPath = `assets/${category}/${key}.json`;
			this.load.atlas(key, pngPath, jsonPath);
		}
	}
}
