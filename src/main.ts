import Phaser from "phaser";
import { gameConfig } from "@/config/game.config";

const game = new Phaser.Game(gameConfig);

// Expose for dev tools playtesting / debugging
(window as any).__PHASER_GAME__ = game;

export default game;
