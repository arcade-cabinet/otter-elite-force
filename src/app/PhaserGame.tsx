import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import type { DeploymentData } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";

export interface IRefPhaserGame {
	game: Phaser.Game | undefined;
	scene: Phaser.Scene | null;
}

interface PhaserGameProps {
	currentActiveScene?: (scene: Phaser.Scene) => void;
	deploymentData?: DeploymentData;
}

/**
 * PhaserGame — React wrapper that lazy-loads the Phaser game engine.
 *
 * US-089: Phaser is loaded via dynamic import() so it is NOT included
 * in the initial bundle. The game engine only loads when this component
 * mounts (i.e., when the user enters the game screen).
 */
export const PhaserGame = forwardRef<IRefPhaserGame, PhaserGameProps>(function PhaserGame(
	{ currentActiveScene, deploymentData },
	ref,
) {
	const game = useRef<Phaser.Game | undefined>(undefined);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (game.current !== undefined) return;

		// Lazy-load Phaser game config (and transitively, Phaser itself)
		let destroyed = false;
		import("@/game/config").then(({ default: StartGame }) => {
			if (destroyed) return;
			game.current = StartGame("game-container", deploymentData);

			if (ref !== null && typeof ref !== "function") {
				ref.current = { game: game.current, scene: null };
			}
		});

		return () => {
			destroyed = true;
			if (game.current) {
				game.current.destroy(true);
				game.current = undefined;
			}
		};
	}, [ref, deploymentData]);

	useEffect(() => {
		const refresh = () => game.current?.scale.refresh();
		window.addEventListener("resize", refresh);
		window.addEventListener("orientationchange", refresh);

		return () => {
			window.removeEventListener("resize", refresh);
			window.removeEventListener("orientationchange", refresh);
		};
	}, []);

	useEffect(() => {
		if (typeof ResizeObserver === "undefined") return;
		const node = containerRef.current;
		if (!node) return;

		const observer = new ResizeObserver(() => {
			game.current?.scale.refresh();
		});

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const onSceneReady = (currentScene: Phaser.Scene) => {
			if (currentActiveScene instanceof Function) {
				currentActiveScene(currentScene);
			}

			if (ref !== null && typeof ref !== "function" && ref.current) {
				ref.current.scene = currentScene;
			}
		};

		EventBus.on("current-scene-ready", onSceneReady);

		return () => {
			EventBus.off("current-scene-ready", onSceneReady);
		};
	}, [currentActiveScene, ref]);

	return <div id="game-container" ref={containerRef} className="game-container" />;
});
