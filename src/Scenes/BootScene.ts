import Phaser from "phaser";

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

		// Sprite atlases will be loaded here once the sprite compiler
		// generates them. For now, generate placeholder textures.
		this.createPlaceholderTextures();
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

	private createPlaceholderTextures(): void {
		// Generate colored rectangle textures as placeholders until
		// the .sprite compiler pipeline produces real atlases.
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
			const size = key.startsWith("portrait")
				? 64
				: key.includes("-") &&
						!key.startsWith("tall") &&
						!key.startsWith("toxic") &&
						[
							"command-post",
							"barracks",
							"watchtower",
							"fish-trap",
							"burrow",
							"sandbag-wall",
						].includes(key)
					? 32
					: 16;
			const gfx = this.add.graphics();
			gfx.fillStyle(color, 1);
			gfx.fillRect(0, 0, size, size);
			gfx.generateTexture(key, size, size);
			gfx.destroy();
		}
	}
}
