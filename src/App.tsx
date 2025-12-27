/**
 * Main App Component
 * Root component that manages game state and renders appropriate screens
 */

import { useEffect } from "react";
import { useGameStore } from "./stores/gameStore";
import { MainMenu } from "./Scenes/MainMenu";
import { Level } from "./Scenes/Level";
import { Cutscene } from "./Scenes/Cutscene";
import { HUD } from "./UI/HUD";
import { audioEngine } from "./Core/AudioEngine";
import { inputSystem } from "./Core/InputSystem";

export function App() {
	const { mode, loadData } = useGameStore();

	// Initialize on mount
	useEffect(() => {
		// Load save data
		loadData();

		// Initialize audio on first user interaction
		const initAudio = async () => {
			await audioEngine.init();
			console.log("Audio initialized");
			audioEngine.playMusic("menu");
		};

		// Initialize input system
		inputSystem.init();

		// Setup audio initialization on first interaction
		const handleInteraction = () => {
			initAudio();
			document.removeEventListener("click", handleInteraction);
			document.removeEventListener("touchstart", handleInteraction);
		};

		document.addEventListener("click", handleInteraction);
		document.addEventListener("touchstart", handleInteraction);

		return () => {
			document.removeEventListener("click", handleInteraction);
			document.removeEventListener("touchstart", handleInteraction);
			inputSystem.destroy();
		};
	}, [loadData]);

	useEffect(() => {
		if (mode === "GAME") {
			audioEngine.playMusic("combat");
		} else if (mode === "MENU") {
			audioEngine.playMusic("menu");
		}
	}, [mode]);

	return (
		<div className="app">
			{/* Scanlines overlay */}
			<div className="scanlines" />

			{/* Main content based on mode */}
			{mode === "MENU" && <MainMenu />}
			{mode === "CUTSCENE" && <Cutscene />}

			{mode === "GAME" && (
				<>
					<Level />
					<HUD />
				</>
			)}

			{/* Flash effects */}
			<div id="flash" />
			<div id="damage" />
		</div>
	);
}
