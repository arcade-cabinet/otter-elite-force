import Phaser from "phaser";
import { renderSprite, registerTextures, getScaleFactor } from "@/entities/renderer";
import {
	ALL_UNIT_ENTITIES,
	ALL_HERO_ENTITIES,
	ALL_BUILDING_ENTITIES,
	ALL_RESOURCES,
	ALL_PROPS,
	ALL_PORTRAIT_ENTITIES,
} from "@/entities/registry";

export class BootScene extends Phaser.Scene {
	private loadingBar!: Phaser.GameObjects.Graphics;
	private progressBox!: Phaser.GameObjects.Graphics;

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

		this.renderAllTextures();
	}

	create(): void {
		this.scene.start("Menu");
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
	 * Render all entity sprites from definitions and register them with Phaser.
	 * Replaces the old createPlaceholderTextures() — real pixel art instead of
	 * colored rectangles.
	 */
	private renderAllTextures(): void {
		const unitScale = getScaleFactor(16);
		const buildingScale = getScaleFactor(32);
		const portraitScale = getScaleFactor(64);

		// Units (14 definitions, 16px sprites)
		for (const [id, def] of Object.entries(ALL_UNIT_ENTITIES)) {
			const rendered = renderSprite(id, def.sprite, unitScale);
			registerTextures(this.textures, rendered);
		}

		// Heroes (6 definitions, 16px sprites)
		for (const [id, def] of Object.entries(ALL_HERO_ENTITIES)) {
			const rendered = renderSprite(id, def.sprite, unitScale);
			registerTextures(this.textures, rendered);
		}

		// Buildings (17 definitions, 32px sprites)
		for (const [id, def] of Object.entries(ALL_BUILDING_ENTITIES)) {
			const rendered = renderSprite(id, def.sprite, buildingScale);
			registerTextures(this.textures, rendered);
		}

		// Resources (3 definitions, 16px sprites)
		for (const [id, def] of Object.entries(ALL_RESOURCES)) {
			const rendered = renderSprite(id, def.sprite, unitScale);
			registerTextures(this.textures, rendered);
		}

		// Props (2 definitions, 16px sprites)
		for (const [id, def] of Object.entries(ALL_PROPS)) {
			const rendered = renderSprite(id, def.sprite, unitScale);
			registerTextures(this.textures, rendered);
		}

		// Portraits (7 definitions, 64x96 sprites)
		for (const [id, def] of Object.entries(ALL_PORTRAIT_ENTITIES)) {
			const rendered = renderSprite(id, def.sprite, portraitScale);
			registerTextures(this.textures, rendered);
		}
	}
}
