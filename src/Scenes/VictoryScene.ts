import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";

/** Maximum mission ID in Chapter 1. */
const MAX_MISSION_ID = 4;

interface VictoryData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
	stars: number;
	stats: {
		unitsLost: number;
		enemiesDefeated: number;
		timeElapsed: number;
		resourcesGathered: number;
	};
}

export class VictoryScene extends Phaser.Scene {
	private victoryData!: VictoryData;

	constructor() {
		super({ key: "Victory" });
	}

	init(data: VictoryData): void {
		this.victoryData = data;
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#0a0e14");

		const cx = GAME_WIDTH / 2;

		// Mission complete header
		this.add
			.text(cx, 80, "MISSION COMPLETE", {
				fontFamily: "monospace",
				fontSize: "40px",
				color: "#4ade80",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		this.add
			.text(cx, 130, `MISSION ${this.victoryData.missionId}`, {
				fontFamily: "monospace",
				fontSize: "18px",
				color: "#6b7280",
			})
			.setOrigin(0.5);

		// Star rating display
		this.createStarRating(cx, 190, this.victoryData.stars);

		// Stats panel
		this.createStatsPanel(cx, 280);

		// Continue button
		this.createContinueButton(cx, GAME_HEIGHT - 100);
	}

	private createStarRating(x: number, y: number, stars: number): void {
		const starSpacing = 50;
		const startX = x - starSpacing;

		for (let i = 0; i < 3; i++) {
			const sx = startX + i * starSpacing;
			const filled = i < stars;

			const star = this.add.graphics();
			if (filled) {
				star.fillStyle(0xfbbf24, 1);
			} else {
				star.fillStyle(0x3a3a3a, 1);
			}

			// Draw a simple diamond shape as star placeholder
			star.fillTriangle(sx, y - 15, sx - 15, y + 5, sx + 15, y + 5);
			star.fillTriangle(sx, y + 20, sx - 15, y + 5, sx + 15, y + 5);
		}

		const ratingLabels = ["", "ADEQUATE", "COMMENDABLE", "EXEMPLARY"];
		this.add
			.text(x, y + 35, ratingLabels[stars] ?? "", {
				fontFamily: "monospace",
				fontSize: "14px",
				color: "#fbbf24",
			})
			.setOrigin(0.5);
	}

	private createStatsPanel(x: number, y: number): void {
		const panelW = 400;
		const panelH = 180;

		const bg = this.add.graphics();
		bg.fillStyle(0x111820, 0.9);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(x - panelW / 2, y, panelW, panelH);
		bg.strokeRect(x - panelW / 2, y, panelW, panelH);

		const stats = this.victoryData.stats;
		const minutes = Math.floor(stats.timeElapsed / 60);
		const seconds = stats.timeElapsed % 60;

		const lines = [
			`ENEMIES DEFEATED:    ${stats.enemiesDefeated}`,
			`UNITS LOST:          ${stats.unitsLost}`,
			`TIME ELAPSED:        ${minutes}m ${seconds.toString().padStart(2, "0")}s`,
			`RESOURCES GATHERED:  ${stats.resourcesGathered}`,
		];

		for (let i = 0; i < lines.length; i++) {
			this.add.text(x - panelW / 2 + 30, y + 25 + i * 38, lines[i], {
				fontFamily: "monospace",
				fontSize: "15px",
				color: "#d1d5db",
			});
		}
	}

	private createContinueButton(x: number, y: number): void {
		const hasNextMission = this.victoryData.missionId < MAX_MISSION_ID;
		const w = 240;
		const h = 50;

		if (hasNextMission) {
			// "NEXT MISSION" button — advances campaign
			this.createActionButton(x, y, w, h, "NEXT MISSION >>", "#4ade80", 0x2f4f2f, () => {
				this.scene.start("Briefing", {
					missionId: this.victoryData.missionId + 1,
					difficulty: this.victoryData.difficulty,
				});
			});

			// Smaller "RETURN TO HQ" link below
			const returnText = this.add
				.text(x, y + 45, "RETURN TO HQ", {
					fontFamily: "monospace",
					fontSize: "13px",
					color: "#6b7280",
				})
				.setOrigin(0.5)
				.setInteractive({ useHandCursor: true });

			returnText.on("pointerover", () => returnText.setColor("#9ca3af"));
			returnText.on("pointerout", () => returnText.setColor("#6b7280"));
			returnText.on("pointerdown", () => this.scene.start("Menu"));
		} else {
			// Final mission — return to menu
			this.createActionButton(x, y, w, h, "RETURN TO HQ >>", "#c4a43a", 0x1a2332, () => {
				this.scene.start("Menu");
			});
		}
	}

	private createActionButton(
		x: number,
		y: number,
		w: number,
		h: number,
		label: string,
		color: string,
		bgColor: number,
		callback: () => void,
	): void {
		const bg = this.add.graphics();
		bg.fillStyle(bgColor, 1);
		bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
		bg.fillRect(x - w / 2, y - h / 2, w, h);
		bg.strokeRect(x - w / 2, y - h / 2, w, h);

		const text = this.add
			.text(x, y, label, {
				fontFamily: "monospace",
				fontSize: "20px",
				color,
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

		zone.on("pointerover", () => text.setColor("#e0c060"));
		zone.on("pointerout", () => text.setColor(color));
		zone.on("pointerdown", callback);
	}
}
