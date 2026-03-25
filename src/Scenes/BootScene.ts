/**
 * BootScene — Military-themed loading screen with progress bar.
 *
 * US-090: Loading screen with progress bar
 * - Game logo and military-themed background
 * - Shows asset name being loaded and percentage complete
 * - Smooth progress animation with tweened fill
 * - Stamped/typewriter aesthetic matching the OEF visual bar
 * - Appears immediately before heavy asset loading
 */

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

// --- Military theme colors ---
const COLOR_BG_DARK = 0x0d1a0d; // Deep jungle green background
const COLOR_BG_PANEL = 0x1a2e1a; // Olive drab panel
const COLOR_BAR_BG = 0x2a3a2a; // Dark olive bar background
const COLOR_BAR_FILL = 0x8b6914; // Brass/gold bar fill
const COLOR_BAR_BORDER = 0x5a4a1a; // Dark brass border
const COLOR_TEXT_GOLD = "#c4a43a"; // Gold/brass text
const COLOR_TEXT_DIM = "#6a7a5a"; // Dim olive text
const COLOR_SCANLINE = 0x0a140a; // Scanline overlay color

/** Bar dimensions */
const BAR_WIDTH = 320;
const BAR_HEIGHT = 24;
const BAR_BORDER = 2;

export class BootScene extends Phaser.Scene {
	private loadingBar!: Phaser.GameObjects.Graphics;
	private progressBox!: Phaser.GameObjects.Graphics;
	private percentText!: Phaser.GameObjects.Text;
	private assetText!: Phaser.GameObjects.Text;
	private atlasScale = "2x";
	private displayProgress = 0;
	private targetProgress = 0;

	constructor() {
		super({ key: "Boot" });
	}

	preload(): void {
		this.createLoadingScreen();

		this.load.on("progress", (value: number) => {
			this.targetProgress = value;
		});

		this.load.on("fileprogress", (file: { key: string }) => {
			if (this.assetText) {
				this.assetText.setText(`Loading: ${file.key}`);
			}
		});

		this.load.on("complete", () => {
			this.targetProgress = 1;
			if (this.assetText) {
				this.assetText.setText("DEPLOYMENT READY");
			}
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

	update(): void {
		// Smooth progress animation — lerp toward target
		if (this.displayProgress < this.targetProgress) {
			this.displayProgress = Math.min(this.targetProgress, this.displayProgress + 0.02);
			this.drawProgressBar(this.displayProgress);
			this.percentText.setText(`${Math.floor(this.displayProgress * 100)}%`);
		}
	}

	private createLoadingScreen(): void {
		const { width, height } = this.cameras.main;
		const centerX = width / 2;
		const centerY = height / 2;

		// Dark military background
		this.cameras.main.setBackgroundColor(COLOR_BG_DARK);

		// Background panel (darker rectangle)
		const panel = this.add.graphics();
		panel.fillStyle(COLOR_BG_PANEL, 0.6);
		panel.fillRect(centerX - 200, centerY - 100, 400, 200);
		panel.lineStyle(1, COLOR_BAR_BORDER, 0.4);
		panel.strokeRect(centerX - 200, centerY - 100, 400, 200);

		// Scanline effect (subtle horizontal lines)
		const scanlines = this.add.graphics();
		scanlines.fillStyle(COLOR_SCANLINE, 0.08);
		for (let y = 0; y < height; y += 4) {
			scanlines.fillRect(0, y, width, 1);
		}
		scanlines.setDepth(10);

		// --- Title: Game logo text ---
		const logoText = this.add.text(centerX, centerY - 75, "OTTER ELITE FORCE", {
			fontFamily: '"Black Ops One", "Special Elite", monospace',
			fontSize: "28px",
			color: COLOR_TEXT_GOLD,
			letterSpacing: 4,
		});
		logoText.setOrigin(0.5);

		// Subtitle
		const subtitleText = this.add.text(centerX, centerY - 48, "OPERATIONAL DEPLOYMENT", {
			fontFamily: '"Share Tech Mono", monospace',
			fontSize: "11px",
			color: COLOR_TEXT_DIM,
			letterSpacing: 6,
		});
		subtitleText.setOrigin(0.5);

		// Decorative line under subtitle
		const divider = this.add.graphics();
		divider.lineStyle(1, COLOR_BAR_BORDER, 0.5);
		divider.lineBetween(centerX - 120, centerY - 35, centerX + 120, centerY - 35);

		// --- Progress bar background ---
		this.progressBox = this.add.graphics();
		const barX = centerX - BAR_WIDTH / 2;
		const barY = centerY - BAR_HEIGHT / 2;

		// Outer border
		this.progressBox.lineStyle(BAR_BORDER, COLOR_BAR_BORDER, 0.8);
		this.progressBox.strokeRect(
			barX - BAR_BORDER,
			barY - BAR_BORDER,
			BAR_WIDTH + BAR_BORDER * 2,
			BAR_HEIGHT + BAR_BORDER * 2,
		);

		// Inner background
		this.progressBox.fillStyle(COLOR_BAR_BG, 0.9);
		this.progressBox.fillRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);

		// --- Progress bar fill (drawn in drawProgressBar) ---
		this.loadingBar = this.add.graphics();

		// --- Percentage text ---
		this.percentText = this.add.text(centerX, centerY + 25, "0%", {
			fontFamily: '"Share Tech Mono", monospace',
			fontSize: "14px",
			color: COLOR_TEXT_GOLD,
		});
		this.percentText.setOrigin(0.5);

		// --- Asset name text (shows what's loading) ---
		this.assetText = this.add.text(centerX, centerY + 48, "Initializing...", {
			fontFamily: '"Share Tech Mono", monospace',
			fontSize: "10px",
			color: COLOR_TEXT_DIM,
			letterSpacing: 2,
		});
		this.assetText.setOrigin(0.5);

		// --- Bottom decorative text ---
		const bottomText = this.add.text(centerX, centerY + 80, "STAND BY FOR DEPLOYMENT", {
			fontFamily: '"Share Tech Mono", monospace',
			fontSize: "9px",
			color: COLOR_TEXT_DIM,
			letterSpacing: 3,
		});
		bottomText.setOrigin(0.5);

		// Pulsing animation on the bottom text
		this.tweens.add({
			targets: bottomText,
			alpha: { from: 0.4, to: 1 },
			duration: 1200,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});
	}

	private drawProgressBar(progress: number): void {
		const centerX = this.cameras.main.width / 2;
		const centerY = this.cameras.main.height / 2;
		const barX = centerX - BAR_WIDTH / 2;
		const barY = centerY - BAR_HEIGHT / 2;
		const fillWidth = BAR_WIDTH * progress;

		this.loadingBar.clear();

		if (fillWidth > 0) {
			// Main fill
			this.loadingBar.fillStyle(COLOR_BAR_FILL, 1);
			this.loadingBar.fillRect(barX, barY, fillWidth, BAR_HEIGHT);

			// Highlight strip on top (lighter brass)
			this.loadingBar.fillStyle(0xb08a24, 0.4);
			this.loadingBar.fillRect(barX, barY, fillWidth, 3);

			// Shadow strip on bottom
			this.loadingBar.fillStyle(0x5a3a0a, 0.3);
			this.loadingBar.fillRect(barX, barY + BAR_HEIGHT - 2, fillWidth, 2);
		}
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
