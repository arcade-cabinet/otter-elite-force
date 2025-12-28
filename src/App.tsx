/**
 * Main App Component
 * Root component that manages game state and renders appropriate screens
 */

import { useEffect, useRef } from "react";
import { audioEngine } from "./Core/AudioEngine";
import { inputSystem } from "./Core/InputSystem";
import { Canteen } from "./Scenes/Canteen";
import { Cutscene } from "./Scenes/Cutscene";
import { GameWorld } from "./Scenes/GameWorld";
import { MainMenu } from "./Scenes/MainMenu";
import { useGameStore } from "./stores/gameStore";
import { HUD } from "./UI/HUD";

export function App() {
	const { mode, loadData } = useGameStore();
	const inputInitialized = useRef(false);

	// Initialize on mount
	useEffect(() => {
		// Load save data
		loadData();

		// Initialize audio on first user interaction
		const initAudio = async () => {
			await audioEngine.init();
			audioEngine.playMusic("menu");
		};

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

	// Initialize input system when entering GAME mode (after HUD mounts with joystick zones)
	useEffect(() => {
		if (mode === "GAME" && !inputInitialized.current) {
			// Small delay to ensure HUD's joystick zones are in DOM
			const timer = setTimeout(() => {
				inputSystem.destroy(); // Clean up any previous instance
				inputSystem.init();
				inputInitialized.current = true;
			}, 100);
			return () => clearTimeout(timer);
		}
		if (mode !== "GAME") {
			inputInitialized.current = false;
		}
	}, [mode]);

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
			{mode === "CANTEEN" && <Canteen />}

			{mode === "GAME" && (
				<>
					<GameWorld />
					<HUD />
				</>
			)}

			{/* Flash effects */}
			<div id="flash" />
			<div id="damage" />
		</div>
	);
}
