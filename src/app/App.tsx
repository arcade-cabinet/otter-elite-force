import { useRef } from "react";
import { PhaserGame, type IRefPhaserGame } from "./PhaserGame";

function App() {
	const phaserRef = useRef<IRefPhaserGame>(null);

	const currentScene = (_scene: Phaser.Scene) => {
		// Future: update React state based on active Phaser scene
	};

	return (
		<div id="app">
			<PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
		</div>
	);
}

export default App;
