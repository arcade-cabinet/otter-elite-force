import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/game.config";

interface HUDData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
}

export class HUDScene extends Phaser.Scene {
	private resourceTexts!: {
		fish: Phaser.GameObjects.Text;
		timber: Phaser.GameObjects.Text;
		salvage: Phaser.GameObjects.Text;
		population: Phaser.GameObjects.Text;
	};
	private minimapGraphics!: Phaser.GameObjects.Graphics;
	private unitInfoContainer!: Phaser.GameObjects.Container;
	private actionContainer!: Phaser.GameObjects.Container;

	constructor() {
		super({ key: "HUD" });
	}

	create(_data: HUDData): void {
		// HUD runs in parallel with GameScene — don't capture input that
		// should pass through to the game layer below.
		this.createResourceBar();
		this.createMinimap();
		this.createUnitInfoPanel();
		this.createActionPanel();
	}

	private createResourceBar(): void {
		const barBg = this.add.graphics();
		barBg.fillStyle(0x0d1117, 0.85);
		barBg.fillRect(0, 0, GAME_WIDTH, 36);
		barBg.lineStyle(1, 0x2a3a4e, 1);
		barBg.lineBetween(0, 36, GAME_WIDTH, 36);

		const style: Phaser.Types.GameObjects.Text.TextStyle = {
			fontFamily: "monospace",
			fontSize: "14px",
			color: "#d1d5db",
		};

		const fishIcon = this.add.text(20, 8, "FISH:", { ...style, color: "#38bdf8" });
		const fishVal = this.add.text(fishIcon.x + fishIcon.width + 5, 8, "200", style);

		const timberIcon = this.add.text(fishVal.x + 80, 8, "TIMBER:", {
			...style,
			color: "#a3e635",
		});
		const timberVal = this.add.text(timberIcon.x + timberIcon.width + 5, 8, "100", style);

		const salvageIcon = this.add.text(timberVal.x + 80, 8, "SALVAGE:", {
			...style,
			color: "#fbbf24",
		});
		const salvageVal = this.add.text(salvageIcon.x + salvageIcon.width + 5, 8, "0", style);

		const popIcon = this.add.text(GAME_WIDTH - 160, 8, "POP:", {
			...style,
			color: "#c4a43a",
		});
		const popVal = this.add.text(popIcon.x + popIcon.width + 5, 8, "3/6", style);

		this.resourceTexts = {
			fish: fishVal,
			timber: timberVal,
			salvage: salvageVal,
			population: popVal,
		};
	}

	private createMinimap(): void {
		const mapSize = 160;
		const padding = 10;
		const x = padding;
		const y = GAME_HEIGHT - mapSize - padding;

		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.85);
		bg.lineStyle(1, 0xc4a43a, 1);
		bg.fillRect(x, y, mapSize, mapSize);
		bg.strokeRect(x, y, mapSize, mapSize);

		this.minimapGraphics = this.add.graphics();

		// Minimap label
		this.add
			.text(x + mapSize / 2, y - 8, "MAP", {
				fontFamily: "monospace",
				fontSize: "10px",
				color: "#6b7280",
			})
			.setOrigin(0.5);

		// Minimap will render a scaled-down camera view once the tilemap exists.
		// For now, draw a placeholder green rectangle.
		this.minimapGraphics.fillStyle(0x1a3a1a, 0.5);
		this.minimapGraphics.fillRect(x + 2, y + 2, mapSize - 4, mapSize - 4);
	}

	private createUnitInfoPanel(): void {
		const panelX = 10;
		const panelY = GAME_HEIGHT - 320;
		const panelW = 160;
		const panelH = 140;

		this.unitInfoContainer = this.add.container(panelX, panelY);

		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.85);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(0, 0, panelW, panelH);
		bg.strokeRect(0, 0, panelW, panelH);
		this.unitInfoContainer.add(bg);

		const noSelection = this.add.text(panelW / 2, panelH / 2, "NO UNIT\nSELECTED", {
			fontFamily: "monospace",
			fontSize: "11px",
			color: "#4a4a4a",
			align: "center",
		});
		noSelection.setOrigin(0.5);
		this.unitInfoContainer.add(noSelection);
	}

	private createActionPanel(): void {
		const panelW = 340;
		const panelH = 80;
		const panelX = GAME_WIDTH / 2 - panelW / 2;
		const panelY = GAME_HEIGHT - panelH - 10;

		this.actionContainer = this.add.container(panelX, panelY);

		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.85);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(0, 0, panelW, panelH);
		bg.strokeRect(0, 0, panelW, panelH);
		this.actionContainer.add(bg);

		// Action buttons will be populated contextually based on selection.
		// Placeholder buttons for now.
		const actions = ["MOVE", "ATTACK", "STOP", "PATROL", "BUILD"];
		const btnW = 58;
		const spacing = 6;
		const startX = 10;

		for (let i = 0; i < actions.length; i++) {
			const bx = startX + i * (btnW + spacing);
			const by = 15;

			const btnBg = this.add.graphics();
			btnBg.fillStyle(0x1a2332, 1);
			btnBg.lineStyle(1, 0x4a4a4a, 1);
			btnBg.fillRect(bx, by, btnW, 50);
			btnBg.strokeRect(bx, by, btnW, 50);
			this.actionContainer.add(btnBg);

			const label = this.add
				.text(bx + btnW / 2, by + 25, actions[i], {
					fontFamily: "monospace",
					fontSize: "10px",
					color: "#6b7280",
				})
				.setOrigin(0.5);
			this.actionContainer.add(label);
		}
	}

	/** Update resource display — called by game systems via Zustand subscribe or direct call. */
	updateResources(
		fish: number,
		timber: number,
		salvage: number,
		pop: number,
		maxPop: number,
	): void {
		this.resourceTexts.fish.setText(String(fish));
		this.resourceTexts.timber.setText(String(timber));
		this.resourceTexts.salvage.setText(String(salvage));
		this.resourceTexts.population.setText(`${pop}/${maxPop}`);
	}
}
