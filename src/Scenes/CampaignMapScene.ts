/**
 * Campaign Map Scene — between-missions screen showing the Copper-Silt Reach.
 *
 * Displays mission markers at landmark positions, star ratings for completed
 * missions, territory tinting (liberated=blue, occupied=red), and pulsing
 * marker for the next available mission.
 *
 * Flow: MenuScene "Continue" → CampaignMapScene → BriefingScene
 */

import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";
import { useCampaignStore } from "@/stores/campaignStore";
import { territoryStore } from "@/stores/territoryStore";

// ---------------------------------------------------------------------------
// Mission landmark positions on the campaign map (pixel coords at 1280x720)
// ---------------------------------------------------------------------------

interface MissionMarker {
	missionId: string;
	label: string;
	x: number;
	y: number;
	/** Chapter this mission belongs to (for territory tinting) */
	chapter: number;
}

const MISSION_MARKERS: MissionMarker[] = [
	// Chapter 1: Southern coast
	{ missionId: "ch1-m1", label: "1: Beachhead", x: 200, y: 580, chapter: 1 },
	{ missionId: "ch1-m2", label: "2: First Blood", x: 320, y: 520, chapter: 1 },
	{ missionId: "ch1-m3", label: "3: Supply Run", x: 440, y: 490, chapter: 1 },
	{ missionId: "ch1-m4", label: "4: Rescue", x: 560, y: 440, chapter: 1 },
	// Chapter 2: River interior
	{ missionId: "ch2-m5", label: "5: River Crossing", x: 650, y: 380, chapter: 2 },
	{ missionId: "ch2-m6", label: "6: Ambush Point", x: 730, y: 320, chapter: 2 },
	{ missionId: "ch2-m7", label: "7: Dock Assault", x: 820, y: 360, chapter: 2 },
	{ missionId: "ch2-m8", label: "8: Deep Dive", x: 900, y: 300, chapter: 2 },
	// Chapter 3: Northern territory
	{ missionId: "ch3-m9", label: "9: Dense Canopy", x: 750, y: 230, chapter: 3 },
	{ missionId: "ch3-m10", label: "10: Healer's Grove", x: 620, y: 200, chapter: 3 },
	{ missionId: "ch3-m11", label: "11: Entrenchment", x: 500, y: 180, chapter: 3 },
	{ missionId: "ch3-m12", label: "12: The Stronghold", x: 380, y: 160, chapter: 3 },
	// Chapter 4: Enemy heartland
	{ missionId: "ch4-m13", label: "13: Supply Lines", x: 900, y: 180, chapter: 4 },
	{ missionId: "ch4-m14", label: "14: Gas Depot", x: 1000, y: 150, chapter: 4 },
	{ missionId: "ch4-m15", label: "15: Sacred Sludge", x: 1080, y: 120, chapter: 4 },
	{ missionId: "ch4-m16", label: "16: The Reckoning", x: 1100, y: 60, chapter: 4 },
];

// Star colors: gold, silver, bronze
const STAR_COLORS = [0x3a3a3a, 0xcd7f32, 0xc0c0c0, 0xfbbf24]; // 0,1,2,3 stars

// Territory tint colors
const LIBERATED_TINT = 0x2563eb; // Blue
const OCCUPIED_TINT = 0xdc2626; // Red
const NEUTRAL_TINT = 0x4a4a4a; // Gray (locked)

interface CampaignMapData {
	difficulty: "support" | "tactical" | "elite";
}

export class CampaignMapScene extends Phaser.Scene {
	private difficulty: "support" | "tactical" | "elite" = "support";
	private markerObjects: Array<{
		marker: MissionMarker;
		dot: Phaser.GameObjects.Graphics;
		label: Phaser.GameObjects.Text;
		zone: Phaser.GameObjects.Zone;
		starDots: Phaser.GameObjects.Graphics[];
		pulse?: Phaser.Tweens.Tween;
	}> = [];

	constructor() {
		super({ key: "CampaignMap" });
	}

	init(data: CampaignMapData): void {
		this.difficulty = data?.difficulty ?? "support";
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#0a0e14");
		this.markerObjects = [];

		this.createBackground();
		this.createHeader();
		this.createTerritoryOverlay();
		this.createMissionMarkers();
		this.createBackButton();
		this.createLegend();
	}

	private createBackground(): void {
		// Use campaign-map sprite if loaded, otherwise draw a procedural map
		if (this.textures.exists("campaign-map")) {
			this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "campaign-map").setOrigin(0.5);
		} else {
			this.drawProceduralMap();
		}
	}

	private drawProceduralMap(): void {
		const gfx = this.add.graphics();

		// Water background
		gfx.fillStyle(0x0c1929, 1);
		gfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

		// River (winding from bottom-left to top-right)
		gfx.fillStyle(0x1e3a5f, 0.6);
		gfx.fillRect(100, 500, 200, 80);
		gfx.fillRect(250, 420, 200, 80);
		gfx.fillRect(400, 340, 200, 80);
		gfx.fillRect(550, 260, 200, 80);
		gfx.fillRect(700, 180, 200, 80);
		gfx.fillRect(850, 100, 250, 80);

		// Landmasses (dark green patches)
		gfx.fillStyle(0x1a3a1a, 0.5);
		gfx.fillRect(50, 400, 300, 200);
		gfx.fillRect(300, 300, 350, 200);
		gfx.fillRect(600, 150, 300, 250);
		gfx.fillRect(850, 50, 350, 200);
	}

	private createHeader(): void {
		this.add
			.text(GAME_WIDTH / 2, 30, "COPPER-SILT REACH — THEATER OF OPERATIONS", {
				fontFamily: "monospace",
				fontSize: "20px",
				color: "#c4a43a",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		// Territory summary
		const territory = territoryStore.getState();
		const total = territory.totalVillages || 1;
		const pct = Math.round((territory.liberatedCount / total) * 100);

		this.add
			.text(GAME_WIDTH / 2, 55, `TERRITORY LIBERATED: ${pct}%`, {
				fontFamily: "monospace",
				fontSize: "12px",
				color: "#6b7280",
			})
			.setOrigin(0.5);
	}

	private createTerritoryOverlay(): void {
		const campaign = useCampaignStore.getState();
		const gfx = this.add.graphics();

		// Draw territory zones per chapter — tint based on whether all missions
		// in that chapter are completed
		const chapterZones: Record<number, { x: number; y: number; w: number; h: number }> = {
			1: { x: 130, y: 400, w: 480, h: 250 },
			2: { x: 580, y: 260, w: 380, h: 200 },
			3: { x: 330, y: 120, w: 470, h: 200 },
			4: { x: 830, y: 30, w: 380, h: 220 },
		};

		for (const [chapterStr, zone] of Object.entries(chapterZones)) {
			const chapter = Number(chapterStr);
			const chapterMissions = MISSION_MARKERS.filter((m) => m.chapter === chapter);
			const allCompleted = chapterMissions.every(
				(m) => campaign.missions[m.missionId]?.status === "completed",
			);
			const anyAvailable = chapterMissions.some(
				(m) =>
					campaign.missions[m.missionId]?.status === "available" ||
					campaign.missions[m.missionId]?.status === "completed",
			);

			const color = allCompleted ? LIBERATED_TINT : anyAvailable ? OCCUPIED_TINT : NEUTRAL_TINT;
			gfx.fillStyle(color, 0.08);
			gfx.fillRoundedRect(zone.x, zone.y, zone.w, zone.h, 16);
			gfx.lineStyle(1, color, 0.25);
			gfx.strokeRoundedRect(zone.x, zone.y, zone.w, zone.h, 16);
		}
	}

	private createMissionMarkers(): void {
		const campaign = useCampaignStore.getState();

		for (const marker of MISSION_MARKERS) {
			const progress = campaign.missions[marker.missionId];
			const status = progress?.status ?? "locked";
			const stars = progress?.stars ?? 0;

			const { dot, label, zone, starDots, pulse } = this.createMarker(marker, status, stars);

			this.markerObjects.push({ marker, dot, label, zone, starDots, pulse });
		}
	}

	private createMarker(
		marker: MissionMarker,
		status: "locked" | "available" | "completed",
		stars: number,
	): {
		dot: Phaser.GameObjects.Graphics;
		label: Phaser.GameObjects.Text;
		zone: Phaser.GameObjects.Zone;
		starDots: Phaser.GameObjects.Graphics[];
		pulse?: Phaser.Tweens.Tween;
	} {
		const { x, y } = marker;
		const dotRadius = 10;
		const starDots: Phaser.GameObjects.Graphics[] = [];

		// Marker dot
		const dot = this.add.graphics();
		if (status === "completed") {
			dot.fillStyle(0x4ade80, 1); // Green
			dot.lineStyle(2, 0x22c55e, 1);
		} else if (status === "available") {
			dot.fillStyle(0xfbbf24, 1); // Gold
			dot.lineStyle(2, 0xf59e0b, 1);
		} else {
			dot.fillStyle(0x3a3a3a, 1); // Gray
			dot.lineStyle(1, 0x555555, 1);
		}
		dot.fillCircle(x, y, dotRadius);
		dot.strokeCircle(x, y, dotRadius);

		// Mission number inside dot
		this.add
			.text(x, y, marker.missionId.split("-")[1]?.replace("m", "") ?? "", {
				fontFamily: "monospace",
				fontSize: "11px",
				color: status === "locked" ? "#666666" : "#000000",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		// Label below marker
		const labelColor =
			status === "completed" ? "#4ade80" : status === "available" ? "#fbbf24" : "#4a4a4a";

		const label = this.add
			.text(x, y + 18, marker.label, {
				fontFamily: "monospace",
				fontSize: "10px",
				color: labelColor,
			})
			.setOrigin(0.5, 0);

		// Star rating dots for completed missions
		if (status === "completed" && stars > 0) {
			const starStartX = x - (stars - 1) * 7;
			for (let i = 0; i < stars; i++) {
				const starGfx = this.add.graphics();
				starGfx.fillStyle(STAR_COLORS[stars] ?? 0xfbbf24, 1);
				starGfx.fillCircle(starStartX + i * 14, y - 18, 4);
				starDots.push(starGfx);
			}
		}

		// Pulsing animation for available missions
		let pulse: Phaser.Tweens.Tween | undefined;
		if (status === "available") {
			pulse = this.tweens.add({
				targets: dot,
				alpha: { from: 1, to: 0.4 },
				duration: 800,
				yoyo: true,
				repeat: -1,
				ease: "Sine.easeInOut",
			});
		}

		// Interactive zone
		const zone = this.add
			.zone(x, y, dotRadius * 4, dotRadius * 4)
			.setInteractive({ useHandCursor: status !== "locked" });

		if (status !== "locked") {
			zone.on("pointerover", () => {
				label.setFontSize("12px");
				label.setColor("#ffffff");
			});

			zone.on("pointerout", () => {
				label.setFontSize("10px");
				label.setColor(labelColor);
			});

			zone.on("pointerdown", () => {
				this.selectMission(marker.missionId, status);
			});
		}

		return { dot, label, zone, starDots, pulse };
	}

	private selectMission(missionId: string, _status: "available" | "completed"): void {
		// Extract mission number from id (e.g. "ch1-m1" → 1)
		const match = missionId.match(/m(\d+)/);
		const missionNum = match ? Number.parseInt(match[1], 10) : 1;

		this.scene.start("Briefing", {
			missionId: missionNum,
			difficulty: this.difficulty,
		});
	}

	private createBackButton(): void {
		const x = 80;
		const y = GAME_HEIGHT - 40;

		const text = this.add
			.text(x, y, "<< MENU", {
				fontFamily: "monospace",
				fontSize: "16px",
				color: "#c4a43a",
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		text.on("pointerover", () => text.setColor("#e0c060"));
		text.on("pointerout", () => text.setColor("#c4a43a"));
		text.on("pointerdown", () => this.scene.start("Menu"));
	}

	private createLegend(): void {
		const x = GAME_WIDTH - 160;
		const y = GAME_HEIGHT - 90;

		const bg = this.add.graphics();
		bg.fillStyle(0x111820, 0.85);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRoundedRect(x - 10, y - 10, 150, 80, 6);
		bg.strokeRoundedRect(x - 10, y - 10, 150, 80, 6);

		const items = [
			{ color: 0x4ade80, label: "Completed" },
			{ color: 0xfbbf24, label: "Available" },
			{ color: 0x3a3a3a, label: "Locked" },
		];

		for (let i = 0; i < items.length; i++) {
			const iy = y + i * 22;
			const dotGfx = this.add.graphics();
			dotGfx.fillStyle(items[i].color, 1);
			dotGfx.fillCircle(x + 8, iy + 6, 5);

			this.add.text(x + 22, iy, items[i].label, {
				fontFamily: "monospace",
				fontSize: "11px",
				color: "#d1d5db",
			});
		}
	}
}
