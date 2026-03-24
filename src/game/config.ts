import Phaser from "phaser";
import { BootScene } from "@/Scenes/BootScene";
import { GameScene } from "@/Scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "@/config/constants";

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	parent: "game-container",
	backgroundColor: "#1a1a2e",
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	render: {
		pixelArt: true,
		antialias: false,
	},
	scene: [BootScene, GameScene],
};

/**
 * Create and return a new Phaser.Game instance.
 * Called by the PhaserGame React wrapper on mount.
 */
const StartGame = (parent: string): Phaser.Game => {
	return new Phaser.Game({ ...config, parent });
};

export default StartGame;
