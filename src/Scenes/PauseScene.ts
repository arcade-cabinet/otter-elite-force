import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";

export class PauseScene extends Phaser.Scene {
	constructor() {
		super({ key: "Pause" });
	}

	create(): void {
		// Semi-transparent overlay
		const overlay = this.add.graphics();
		overlay.fillStyle(0x000000, 0.7);
		overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

		// Pause panel
		const panelW = 300;
		const panelH = 320;
		const cx = GAME_WIDTH / 2;
		const cy = GAME_HEIGHT / 2;

		const panel = this.add.graphics();
		panel.fillStyle(0x0d1117, 0.95);
		panel.lineStyle(2, 0xc4a43a, 1);
		panel.fillRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);
		panel.strokeRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);

		this.add
			.text(cx, cy - panelH / 2 + 30, "MISSION PAUSED", {
				fontFamily: "monospace",
				fontSize: "24px",
				color: "#c4a43a",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		// Menu buttons
		const buttons = [
			{ label: "RESUME", y: cy - 40, callback: () => this.resumeGame() },
			{ label: "SAVE MISSION", y: cy + 20, callback: () => this.saveMission() },
			{ label: "QUIT TO MENU", y: cy + 80, callback: () => this.quitToMenu() },
		];

		for (const btn of buttons) {
			this.createPauseButton(cx, btn.y, btn.label, btn.callback);
		}

		// ESC to resume
		if (this.input.keyboard) {
			this.input.keyboard.on("keydown-ESC", () => {
				this.resumeGame();
			});
		}
	}

	private createPauseButton(x: number, y: number, label: string, callback: () => void): void {
		const w = 220;
		const h = 44;

		const bg = this.add.graphics();
		bg.fillStyle(0x1a2332, 1);
		bg.lineStyle(1, 0x4a5a6e, 1);
		bg.fillRect(x - w / 2, y - h / 2, w, h);
		bg.strokeRect(x - w / 2, y - h / 2, w, h);

		const text = this.add
			.text(x, y, label, {
				fontFamily: "monospace",
				fontSize: "16px",
				color: "#d1d5db",
			})
			.setOrigin(0.5);

		const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

		zone.on("pointerover", () => {
			bg.clear();
			bg.fillStyle(0x2a3a4e, 1);
			bg.lineStyle(1, 0xc4a43a, 1);
			bg.fillRect(x - w / 2, y - h / 2, w, h);
			bg.strokeRect(x - w / 2, y - h / 2, w, h);
			text.setColor("#c4a43a");
		});

		zone.on("pointerout", () => {
			bg.clear();
			bg.fillStyle(0x1a2332, 1);
			bg.lineStyle(1, 0x4a5a6e, 1);
			bg.fillRect(x - w / 2, y - h / 2, w, h);
			bg.strokeRect(x - w / 2, y - h / 2, w, h);
			text.setColor("#d1d5db");
		});

		zone.on("pointerdown", callback);
	}

	private resumeGame(): void {
		this.scene.resume("Game");
		this.scene.stop();
	}

	private saveMission(): void {
		// TODO: Serialize ECS world state via Zustand + SQLite persistence (Task #17)
	}

	private quitToMenu(): void {
		this.scene.stop("HUD");
		this.scene.stop("Game");
		this.scene.start("Menu");
	}
}
