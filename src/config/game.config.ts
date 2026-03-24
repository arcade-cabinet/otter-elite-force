import Phaser from "phaser";
import {
	BootScene,
	BriefingScene,
	GameScene,
	HUDScene,
	MenuScene,
	PauseScene,
	VictoryScene,
} from "@/Scenes";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game-container",
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	backgroundColor: "#1a1a2e",
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	render: {
		pixelArt: true,
		antialias: false,
	},
	scene: [BootScene, MenuScene, BriefingScene, GameScene, HUDScene, PauseScene, VictoryScene],
};
