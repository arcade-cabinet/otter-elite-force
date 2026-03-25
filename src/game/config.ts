import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";
import { type DeploymentData, queueDeployment } from "@/game/deployment";
import { BootScene } from "@/Scenes/BootScene";
import { GameScene } from "@/Scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	parent: "game-container",
	backgroundColor: "#1a1a2e",
	scale: {
		mode: Phaser.Scale.RESIZE,
		autoCenter: Phaser.Scale.NO_CENTER,
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
const StartGame = (parent: string, deploymentData?: DeploymentData): Phaser.Game => {
	queueDeployment(deploymentData);
	return new Phaser.Game({ ...config, parent });
};

export default StartGame;
