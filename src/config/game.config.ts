import Phaser from "phaser";
import {
	BootScene,
	BriefingScene,
	CampaignMapScene,
	GameScene,
	HUDScene,
	MenuScene,
	PauseScene,
	VictoryScene,
} from "@/Scenes";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";

export { GAME_HEIGHT, GAME_WIDTH };

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
