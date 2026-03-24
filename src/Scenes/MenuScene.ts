import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";

interface MenuButton {
	background: Phaser.GameObjects.Graphics;
	text: Phaser.GameObjects.Text;
	zone: Phaser.GameObjects.Zone;
}

export class MenuScene extends Phaser.Scene {
	private buttons: MenuButton[] = [];
	private selectedDifficulty: "support" | "tactical" | "elite" = "support";
	private difficultyTexts: Phaser.GameObjects.Text[] = [];

	constructor() {
		super({ key: "Menu" });
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#0d1117");
		this.buttons = [];
		this.difficultyTexts = [];

		this.createTitle();
		this.createCampaignButtons();
		this.createDifficultySelector();
		this.createFooter();
	}

	private createTitle(): void {
		const cx = GAME_WIDTH / 2;

		this.add
			.text(cx, 80, "OTTER: ELITE FORCE", {
				fontFamily: "monospace",
				fontSize: "48px",
				color: "#c4a43a",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		this.add
			.text(cx, 130, "CAMPAIGN COMMAND INTERFACE", {
				fontFamily: "monospace",
				fontSize: "16px",
				color: "#6b7280",
			})
			.setOrigin(0.5);
	}

	private createCampaignButtons(): void {
		const cx = GAME_WIDTH / 2;
		const startY = 220;
		const spacing = 70;

		const buttonDefs = [
			{ label: "NEW DEPLOYMENT", callback: () => this.startNewGame() },
			{ label: "CONTINUE MISSION", callback: () => this.continueMission() },
			{ label: "CANTEEN", callback: () => this.openCanteen() },
			{ label: "SETTINGS", callback: () => this.openSettings() },
		];

		for (let i = 0; i < buttonDefs.length; i++) {
			const def = buttonDefs[i];
			const y = startY + i * spacing;
			this.buttons.push(this.createButton(cx, y, 280, 50, def.label, def.callback));
		}
	}

	private createButton(
		x: number,
		y: number,
		w: number,
		h: number,
		label: string,
		callback: () => void,
	): MenuButton {
		const bg = this.add.graphics();
		bg.fillStyle(0x1a2332, 1);
		bg.lineStyle(2, 0xc4a43a, 1);
		bg.fillRect(x - w / 2, y - h / 2, w, h);
		bg.strokeRect(x - w / 2, y - h / 2, w, h);

		const text = this.add
			.text(x, y, label, {
				fontFamily: "monospace",
				fontSize: "18px",
				color: "#c4a43a",
			})
			.setOrigin(0.5);

		const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

		zone.on("pointerover", () => {
			bg.clear();
			bg.fillStyle(0x2a3a4e, 1);
			bg.lineStyle(2, 0xe0c060, 1);
			bg.fillRect(x - w / 2, y - h / 2, w, h);
			bg.strokeRect(x - w / 2, y - h / 2, w, h);
			text.setColor("#e0c060");
		});

		zone.on("pointerout", () => {
			bg.clear();
			bg.fillStyle(0x1a2332, 1);
			bg.lineStyle(2, 0xc4a43a, 1);
			bg.fillRect(x - w / 2, y - h / 2, w, h);
			bg.strokeRect(x - w / 2, y - h / 2, w, h);
			text.setColor("#c4a43a");
		});

		zone.on("pointerdown", callback);

		return { background: bg, text, zone };
	}

	private createDifficultySelector(): void {
		const cx = GAME_WIDTH / 2;
		const baseY = 540;

		this.add
			.text(cx, baseY, "DIFFICULTY", {
				fontFamily: "monospace",
				fontSize: "14px",
				color: "#6b7280",
			})
			.setOrigin(0.5);

		const difficulties: Array<{
			key: "support" | "tactical" | "elite";
			label: string;
			color: string;
		}> = [
			{ key: "support", label: "SUPPORT", color: "#4ade80" },
			{ key: "tactical", label: "TACTICAL", color: "#facc15" },
			{ key: "elite", label: "ELITE", color: "#ef4444" },
		];

		const spacing = 140;
		const startX = cx - spacing;

		for (let i = 0; i < difficulties.length; i++) {
			const diff = difficulties[i];
			const x = startX + i * spacing;
			const y = baseY + 35;

			const text = this.add
				.text(x, y, diff.label, {
					fontFamily: "monospace",
					fontSize: "16px",
					color: this.selectedDifficulty === diff.key ? diff.color : "#4a4a4a",
					fontStyle: this.selectedDifficulty === diff.key ? "bold" : "normal",
				})
				.setOrigin(0.5)
				.setInteractive({ useHandCursor: true });

			text.on("pointerdown", () => {
				this.selectDifficulty(diff.key);
			});

			this.difficultyTexts.push(text);
		}
	}

	private selectDifficulty(mode: "support" | "tactical" | "elite"): void {
		// Escalation only: can't downgrade
		const order = ["support", "tactical", "elite"] as const;
		if (order.indexOf(mode) < order.indexOf(this.selectedDifficulty)) {
			return;
		}
		this.selectedDifficulty = mode;
		this.refreshDifficultyDisplay();
	}

	private refreshDifficultyDisplay(): void {
		const colors = ["#4ade80", "#facc15", "#ef4444"];
		const keys: Array<"support" | "tactical" | "elite"> = ["support", "tactical", "elite"];

		for (let i = 0; i < this.difficultyTexts.length; i++) {
			const isSelected = keys[i] === this.selectedDifficulty;
			this.difficultyTexts[i].setColor(isSelected ? colors[i] : "#4a4a4a");
			this.difficultyTexts[i].setFontStyle(isSelected ? "bold" : "normal");
		}
	}

	private createFooter(): void {
		this.add
			.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "DEFEND THE RIVER. FEAR THE CLAM.", {
				fontFamily: "monospace",
				fontSize: "12px",
				color: "#3a3a3a",
			})
			.setOrigin(0.5);
	}

	private startNewGame(): void {
		this.scene.start("Briefing", {
			missionId: 1,
			difficulty: this.selectedDifficulty,
		});
	}

	private continueMission(): void {
		this.scene.start("CampaignMap", {
			difficulty: this.selectedDifficulty,
		});
	}

	private openCanteen(): void {
		// TODO: Implement canteen meta-progression scene
	}

	private openSettings(): void {
		// TODO: Implement settings scene
	}
}
