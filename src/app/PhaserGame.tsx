import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "@/game/config";
import { EventBus } from "@/game/EventBus";

export interface IRefPhaserGame {
	game: Phaser.Game | undefined;
	scene: Phaser.Scene | null;
}

interface PhaserGameProps {
	currentActiveScene?: (scene: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, PhaserGameProps>(function PhaserGame(
	{ currentActiveScene },
	ref,
) {
	const game = useRef<Phaser.Game | undefined>(undefined);

	useLayoutEffect(() => {
		if (game.current === undefined) {
			game.current = StartGame("game-container");

			if (ref !== null && typeof ref !== "function") {
				ref.current = { game: game.current, scene: null };
			}
		}

		return () => {
			if (game.current) {
				game.current.destroy(true);
				game.current = undefined;
			}
		};
	}, [ref]);

	useEffect(() => {
		EventBus.on("current-scene-ready", (currentScene: Phaser.Scene) => {
			if (currentActiveScene instanceof Function) {
				currentActiveScene(currentScene);
			}

			if (ref !== null && typeof ref !== "function" && ref.current) {
				ref.current.scene = currentScene;
			}
		});

		return () => {
			EventBus.removeListener("current-scene-ready");
		};
	}, [currentActiveScene, ref]);

	return <div id="game-container" />;
});
