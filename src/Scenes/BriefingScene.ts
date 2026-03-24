import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";
import type { MissionDef } from "@/entities/types";
import { getPortrait } from "@/entities/registry";
import { mission01Beachhead } from "@/entities/missions/chapter1/mission-01-beachhead";
import { mission02Causeway } from "@/entities/missions/chapter1/mission-02-causeway";
import { mission03FirebaseDelta } from "@/entities/missions/chapter1/mission-03-firebase-delta";
import { mission04PrisonBreak } from "@/entities/missions/chapter1/mission-04-prison-break";

interface BriefingData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
}

/** Mission registry for briefing lookup. */
const MISSION_DEFS: Record<number, MissionDef> = {
	1: mission01Beachhead,
	2: mission02Causeway,
	3: mission03FirebaseDelta,
	4: mission04PrisonBreak,
};

const TYPEWRITER_SPEED = 30;

export class BriefingScene extends Phaser.Scene {
	private missionData!: BriefingData;
	private dialogueLines: MissionDef["briefing"]["lines"] = [];
	private currentLineIndex = 0;
	private dialogueText!: Phaser.GameObjects.Text;
	private speakerText!: Phaser.GameObjects.Text;
	private isTyping = false;
	private fullText = "";
	private typewriterTimer?: Phaser.Time.TimerEvent;
	private deployButton!: Phaser.GameObjects.Container;

	constructor() {
		super({ key: "Briefing" });
	}

	init(data: BriefingData): void {
		this.missionData = data;
		this.currentLineIndex = 0;
		this.isTyping = false;
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#0a0e14");

		const mission = MISSION_DEFS[this.missionData.missionId];
		if (mission) {
			this.dialogueLines = mission.briefing.lines;
			const title = `MISSION ${mission.mission}: ${mission.name.toUpperCase()}`;
			this.createMissionHeader(title);
			this.createPortrait(mission.briefing.portraitId);
		} else {
			this.dialogueLines = [
				{
					speaker: "FOXHOUND",
					text: "Mission briefing data not yet available. Stand by for further intel.",
				},
			];
			this.createMissionHeader("MISSION BRIEFING");
			this.createPortrait("foxhound");
		}

		this.createDialogueBox();
		this.createDeployButton();

		this.showLine(0);

		// Advance dialogue on click/tap
		this.input.on("pointerdown", () => this.advanceDialogue());
	}

	private createMissionHeader(title: string): void {
		this.add
			.text(GAME_WIDTH / 2, 40, title, {
				fontFamily: "monospace",
				fontSize: "28px",
				color: "#c4a43a",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		const diffColor =
			this.missionData.difficulty === "elite"
				? "#ef4444"
				: this.missionData.difficulty === "tactical"
					? "#facc15"
					: "#4ade80";

		this.add
			.text(GAME_WIDTH / 2, 75, `[${this.missionData.difficulty.toUpperCase()}]`, {
				fontFamily: "monospace",
				fontSize: "14px",
				color: diffColor,
			})
			.setOrigin(0.5);
	}

	private createPortrait(portraitId: string): void {
		const portraitBg = this.add.graphics();
		portraitBg.fillStyle(0x1a2332, 1);
		portraitBg.lineStyle(2, 0xc4a43a, 1);
		portraitBg.fillRect(60, 120, 160, 240);
		portraitBg.strokeRect(60, 120, 160, 240);

		// Use rendered portrait texture from BootScene
		if (this.textures.exists(portraitId)) {
			this.add.image(140, 240, portraitId).setScale(2);
		}

		// Speaker name label — use dialogueColor from portrait definition if available
		const portraitDef = getPortrait(portraitId);
		const nameColor = portraitDef?.dialogueColor ?? "#c4a43a";
		const displayName = portraitDef?.name ?? portraitId.toUpperCase();

		this.add
			.text(140, 380, displayName, {
				fontFamily: "monospace",
				fontSize: "12px",
				color: nameColor,
			})
			.setOrigin(0.5);
	}

	private createDialogueBox(): void {
		const boxX = 250;
		const boxY = 120;
		const boxW = GAME_WIDTH - 290;
		const boxH = 280;

		const bg = this.add.graphics();
		bg.fillStyle(0x111820, 0.9);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(boxX, boxY, boxW, boxH);
		bg.strokeRect(boxX, boxY, boxW, boxH);

		this.speakerText = this.add.text(boxX + 15, boxY + 12, "", {
			fontFamily: "monospace",
			fontSize: "14px",
			color: "#c4a43a",
			fontStyle: "bold",
		});

		this.dialogueText = this.add.text(boxX + 15, boxY + 40, "", {
			fontFamily: "monospace",
			fontSize: "16px",
			color: "#d1d5db",
			wordWrap: { width: boxW - 30 },
			lineSpacing: 6,
		});
	}

	private createDeployButton(): void {
		const cx = GAME_WIDTH / 2;
		const y = GAME_HEIGHT - 80;
		const w = 200;
		const h = 50;

		const bg = this.add.graphics();
		bg.fillStyle(0x2f4f2f, 1);
		bg.lineStyle(2, 0x4ade80, 1);
		bg.fillRect(-w / 2, -h / 2, w, h);
		bg.strokeRect(-w / 2, -h / 2, w, h);

		const text = this.add
			.text(0, 0, "DEPLOY >>", {
				fontFamily: "monospace",
				fontSize: "20px",
				color: "#4ade80",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		this.deployButton = this.add.container(cx, y, [bg, text]);
		this.deployButton.setSize(w, h);
		this.deployButton.setInteractive({ useHandCursor: true });
		this.deployButton.setAlpha(0);

		this.deployButton.on("pointerover", () => {
			text.setColor("#7cff7c");
		});
		this.deployButton.on("pointerout", () => {
			text.setColor("#4ade80");
		});
		this.deployButton.on("pointerdown", () => {
			this.launchMission();
		});
	}

	private showLine(index: number): void {
		if (index >= this.dialogueLines.length) {
			this.showDeployButton();
			return;
		}

		const line = this.dialogueLines[index];
		this.speakerText.setText(line.speaker);
		this.dialogueText.setText("");
		this.fullText = line.text;
		this.isTyping = true;

		let charIndex = 0;
		this.typewriterTimer = this.time.addEvent({
			delay: TYPEWRITER_SPEED,
			repeat: this.fullText.length - 1,
			callback: () => {
				charIndex++;
				this.dialogueText.setText(this.fullText.substring(0, charIndex));
				if (charIndex >= this.fullText.length) {
					this.isTyping = false;
				}
			},
		});
	}

	private advanceDialogue(): void {
		if (this.isTyping) {
			// Skip typewriter, show full text
			this.typewriterTimer?.remove();
			this.dialogueText.setText(this.fullText);
			this.isTyping = false;
			return;
		}

		this.currentLineIndex++;
		this.showLine(this.currentLineIndex);
	}

	private showDeployButton(): void {
		this.tweens.add({
			targets: this.deployButton,
			alpha: 1,
			duration: 500,
			ease: "Power2",
		});
	}

	private launchMission(): void {
		this.scene.start("Game", {
			missionId: this.missionData.missionId,
			difficulty: this.missionData.difficulty,
		});
	}
}
