import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";

interface BriefingData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
}

interface DialogueLine {
	speaker: string;
	text: string;
}

const MISSION_BRIEFINGS: Record<number, { title: string; lines: DialogueLine[] }> = {
	1: {
		title: "MISSION 1: BEACHHEAD",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Sgt. Bubbles, intel confirms Scale-Guard forces have established a foothold along the northern mangrove line.",
			},
			{
				speaker: "FOXHOUND",
				text: "Your primary objective: secure a beachhead and establish a forward operating base. Gather fish and timber to fund operations.",
			},
			{
				speaker: "FOXHOUND",
				text: "Enemy patrols are light — mostly Gator Grunts. But don't get cocky. The crocs fight dirty.",
			},
			{
				speaker: "SGT. BUBBLES",
				text: "Copy that, FOXHOUND. River Rats are locked and loaded. We'll have that FOB up before sundown.",
			},
		],
	},
	2: {
		title: "MISSION 2: THE CAUSEWAY",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Excellent work on the beachhead. Now we need to secure the supply line. A convoy is inbound along the jungle causeway.",
			},
			{
				speaker: "FOXHOUND",
				text: "Scale-Guard ambush teams have been spotted at three chokepoints along the road. Escort that convoy to the eastern outpost.",
			},
			{
				speaker: "SGT. BUBBLES",
				text: "Ambush alley. Wonderful. We'll set up overwatch positions and push through. Nobody touches our supplies.",
			},
		],
	},
	3: {
		title: "MISSION 3: FIREBASE DELTA",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Three strategic hilltops form a triangle north of our position. Scale-Guard has fortified the northern approaches.",
			},
			{
				speaker: "FOXHOUND",
				text: "Capture all three points and hold them for two minutes. Expect heavy counter-attacks once they realize what's happening.",
			},
			{
				speaker: "SGT. BUBBLES",
				text: "King of the hill, otter-style. We'll take them fast and dig in deep. Those crocs won't know what hit them.",
			},
		],
	},
	4: {
		title: "MISSION 4: PRISON BREAK",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "We've located Gen. Whiskers. He's being held in a Scale-Guard compound deep in hostile territory.",
			},
			{
				speaker: "FOXHOUND",
				text: "This is a stealth operation. Take a small team in through the mangrove route. Use tall grass for concealment.",
			},
			{
				speaker: "FOXHOUND",
				text: "Rescue the General and get to the extraction point in the northwest. If you're spotted, it gets ugly fast.",
			},
			{
				speaker: "SGT. BUBBLES",
				text: "Silent and deadly. The River Rats don't leave anyone behind. We're bringing the General home.",
			},
		],
	},
};

const DEFAULT_BRIEFING: { title: string; lines: DialogueLine[] } = {
	title: "MISSION BRIEFING",
	lines: [
		{
			speaker: "FOXHOUND",
			text: "Mission briefing data not yet available. Stand by for further intel.",
		},
	],
};

const TYPEWRITER_SPEED = 30;

export class BriefingScene extends Phaser.Scene {
	private missionData!: BriefingData;
	private dialogueLines: DialogueLine[] = [];
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

		const briefing = MISSION_BRIEFINGS[this.missionData.missionId] ?? DEFAULT_BRIEFING;
		this.dialogueLines = briefing.lines;

		this.createMissionHeader(briefing.title);
		this.createPortrait();
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

	private createPortrait(): void {
		const portraitBg = this.add.graphics();
		portraitBg.fillStyle(0x1a2332, 1);
		portraitBg.lineStyle(2, 0xc4a43a, 1);
		portraitBg.fillRect(60, 120, 160, 240);
		portraitBg.strokeRect(60, 120, 160, 240);

		// Placeholder portrait — will use compiled sprite atlas later
		if (this.textures.exists("portrait-foxhound")) {
			this.add.image(140, 240, "portrait-foxhound").setScale(2);
		}

		this.add
			.text(140, 380, "FOXHOUND", {
				fontFamily: "monospace",
				fontSize: "12px",
				color: "#c4a43a",
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
