/**
 * Main App Component
 * Root component that manages game state and renders appropriate screens
 * USING NATIVEWIND for styling
 */

import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import type { useGameStore as GameStoreType } from "./stores/gameStore";

// Extend Window for E2E testing
declare global {
	interface Window {
		__gameStore?: typeof GameStoreType;
	}
}

import { audioEngine } from "./Core/AudioEngine";
import { inputSystem } from "./Core/InputSystem";
import { Canteen } from "./Scenes/Canteen";
import { Cutscene } from "./Scenes/Cutscene";
import { GameWorld } from "./Scenes/GameWorld";
import { MainMenu } from "./Scenes/MainMenu";
import { Victory } from "./Scenes/Victory";
import { useGameStore } from "./stores/gameStore";
import { DamageFeedback } from "./UI/DamageFeedback";
import { EnemyHealthBars } from "./UI/EnemyHealthBars";
import { HUD } from "./UI/HUD";

// Import global styles for web
if (Platform.OS === "web") {
	require("./global.css");
}

export function App() {
	const { mode, loadData, hudReady } = useGameStore();
	const inputInitialized = useRef(false);

	// Initialize on mount
	useEffect(() => {
		// Expose store to window for E2E testing
		if (Platform.OS === "web" && typeof window !== "undefined") {
			window.__gameStore = useGameStore;
		}

		// Load save data
		loadData();

		// Initialize audio on first user interaction
		const initAudio = async () => {
			await audioEngine.init();
			audioEngine.playMusic("menu");
		};

		if (Platform.OS === "web") {
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
			};
		}
	}, [loadData]);

	// Initialize input system when entering GAME mode and HUD is ready (deterministic)
	useEffect(() => {
		const shouldBeInitialized = mode === "GAME" && hudReady;

		if (shouldBeInitialized && !inputInitialized.current) {
			inputSystem.init();
			inputInitialized.current = true;
		} else if (!shouldBeInitialized && inputInitialized.current) {
			inputSystem.destroy();
			inputInitialized.current = false;
		}

		// Handle unmount - if we are still initialized, destroy
		return () => {
			if (inputInitialized.current) {
				inputSystem.destroy();
				inputInitialized.current = false;
			}
		};
	}, [mode, hudReady]);

	useEffect(() => {
		if (mode === "GAME") {
			audioEngine.playMusic("combat");
		} else if (mode === "MENU") {
			audioEngine.playMusic("menu");
		}
	}, [mode]);

	return (
		<View className="flex-1 bg-otter-bg">
			{/* Main content based on mode */}
			{mode === "MENU" && <MainMenu />}
			{mode === "CUTSCENE" && <Cutscene />}
			{mode === "CANTEEN" && <Canteen />}
			{mode === "VICTORY" && <Victory />}

			{mode === "GAME" && (
				<>
					<GameWorld />
					<HUD />
					<EnemyHealthBars showNumericHP={false} />
					<DamageFeedback />
				</>
			)}
		</View>
	);
}

export default App;
