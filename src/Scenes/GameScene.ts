import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/game.config";
import { world } from "@/ecs/world";
import { DesktopInput } from "@/input/desktopInput";
import { loadMission, TILE_SIZE } from "@/maps/loader";
import { mission01Beachhead } from "@/maps/missions/mission-01-beachhead";
import type { MissionMapData } from "@/maps/types";
import { FogOfWarSystem } from "@/systems/fogSystem";

interface GameData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
}

export class GameScene extends Phaser.Scene {
	private missionData!: GameData;
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
	private cameraPanSpeed = 400;
	private fogSystem?: FogOfWarSystem;

	constructor() {
		super({ key: "Game" });
	}

	init(data: GameData): void {
		this.missionData = data;
	}

	create(): void {
		this.cameras.main.setBackgroundColor("#1a2e1a");

		// Camera setup: enable panning and zooming
		this.cameras.main.setZoom(1);
		this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT * 2);

		// Keyboard input for camera pan
		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
			this.wasd = {
				W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
				A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
				S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
				D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
			};
		}

		// Mouse wheel zoom
		this.input.on(
			"wheel",
			(_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
				const cam = this.cameras.main;
				const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.5, 2.0);
				cam.setZoom(newZoom);
			},
		);

		// Load mission tilemap
		const missionMaps: Record<number, MissionMapData> = {
			1: mission01Beachhead,
		};
		const mapData = missionMaps[this.missionData.missionId];
		if (mapData) {
			const { tilemap } = loadMission(this, mapData);
			const mapWidth = tilemap.widthInPixels;
			const mapHeight = tilemap.heightInPixels;
			this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
			// Center camera on player start position
			this.cameras.main.scrollX = mapData.playerStart.tileX * TILE_SIZE - GAME_WIDTH / 2;
			this.cameras.main.scrollY = mapData.playerStart.tileY * TILE_SIZE - GAME_HEIGHT / 2;
			// Initialize fog of war overlay
			this.fogSystem = new FogOfWarSystem(this, world, mapData.cols, mapData.rows);
		} else {
			this.drawPlaceholderGrid();
		}

		// Desktop input: selection (left-click/drag) + commands (right-click)
		new DesktopInput(this, world);

		// Launch HUD scene in parallel
		this.scene.launch("HUD", {
			missionId: this.missionData.missionId,
			difficulty: this.missionData.difficulty,
		});

		// Pause input (ESC key)
		if (this.input.keyboard) {
			this.input.keyboard.on("keydown-ESC", () => {
				this.scene.launch("Pause");
				this.scene.pause();
			});
		}
	}

	update(_time: number, delta: number): void {
		this.handleCameraPan(delta);

		// Update fog of war
		this.fogSystem?.update();

		// ECS system ticking will be added here by the sync layer (Task #6).
		// Each frame: syncKootaToPhaser(world, this), combatSystem, economySystem, etc.
	}

	private handleCameraPan(delta: number): void {
		const cam = this.cameras.main;
		const speed = (this.cameraPanSpeed * delta) / 1000;

		if (!this.input.keyboard) return;

		// WASD + arrow keys
		if (this.wasd.A?.isDown || this.cursors?.left?.isDown) {
			cam.scrollX -= speed;
		}
		if (this.wasd.D?.isDown || this.cursors?.right?.isDown) {
			cam.scrollX += speed;
		}
		if (this.wasd.W?.isDown || this.cursors?.up?.isDown) {
			cam.scrollY -= speed;
		}
		if (this.wasd.S?.isDown || this.cursors?.down?.isDown) {
			cam.scrollY += speed;
		}

		// Edge scrolling: pan when mouse is near screen edge
		const pointer = this.input.activePointer;
		const edgeThreshold = 30;

		if (pointer.x < edgeThreshold) cam.scrollX -= speed;
		if (pointer.x > GAME_WIDTH - edgeThreshold) cam.scrollX += speed;
		if (pointer.y < edgeThreshold) cam.scrollY -= speed;
		if (pointer.y > GAME_HEIGHT - edgeThreshold) cam.scrollY += speed;
	}

	private drawPlaceholderGrid(): void {
		const cols = 50;
		const rows = 40;
		const gfx = this.add.graphics();
		gfx.lineStyle(1, 0x2a4a2a, 0.3);

		for (let x = 0; x <= cols; x++) {
			gfx.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, rows * TILE_SIZE);
		}
		for (let y = 0; y <= rows; y++) {
			gfx.lineBetween(0, y * TILE_SIZE, cols * TILE_SIZE, y * TILE_SIZE);
		}

		// Update camera bounds to match grid
		this.cameras.main.setBounds(0, 0, cols * TILE_SIZE, rows * TILE_SIZE);
	}
}
