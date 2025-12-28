/**
 * Main App Component
 * Root component that manages game state and renders appropriate screens.
 * Uses strata AudioSynthProvider for procedural audio.
 */

import { useEffect, useRef } from "react";
import { AudioSynthProvider, useAudioSynth } from "./lib/strata/audio-synth";
import { inputSystem } from "./Core/InputSystem";
import { Canteen } from "./Scenes/Canteen";
import { Cutscene } from "./Scenes/Cutscene";
import { GameWorld } from "./Scenes/GameWorld";
import { MainMenu } from "./Scenes/MainMenu";
import { useGameStore } from "./stores/gameStore";
import { DamageFeedback } from "./UI/DamageFeedback";
import { EnemyHealthBars } from "./UI/EnemyHealthBars";
import { HUD } from "./UI/HUD";

/**
 * Inner app component that has access to audio context.
 */
function AppContent() {
	const { mode, loadData, hudReady } = useGameStore();
	const { playMusic, isReady: audioReady } = useAudioSynth();
	const inputInitialized = useRef(false);

	// Initialize on mount
	useEffect(() => {
		// Expose store to window for E2E testing
		if (typeof window !== "undefined") {
			(window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore;
		}

		// Load save data
		loadData();
	}, [loadData]);

	// Initialize input system when entering GAME mode and HUD is ready
	useEffect(() => {
		const shouldBeInitialized = mode === "GAME" && hudReady;

		if (shouldBeInitialized && !inputInitialized.current) {
			inputSystem.init();
			inputInitialized.current = true;
		} else if (!shouldBeInitialized && inputInitialized.current) {
			inputSystem.destroy();
			inputInitialized.current = false;
		}

		return () => {
			if (inputInitialized.current) {
				inputSystem.destroy();
				inputInitialized.current = false;
			}
		};
	}, [mode, hudReady]);

	// Play appropriate music based on game mode
	useEffect(() => {
		if (!audioReady) return;

		if (mode === "GAME") {
			playMusic("combat");
		} else if (mode === "MENU") {
			playMusic("menu");
		} else if (mode === "CANTEEN") {
			playMusic("shop");
		} else if (mode === "VICTORY") {
			playMusic("victory");
		}
	}, [mode, audioReady, playMusic]);

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
					<EnemyHealthBars showNumericHP={false} />
					<DamageFeedback />
				</>
			)}

			{/* Flash effects */}
			<div id="flash" />
			<div id="damage" />
		</div>
	);
}

/**
 * Main App with AudioSynthProvider wrapper.
 */
export function App() {
	return (
		<AudioSynthProvider masterVolume={0.8} autoInit={true}>
			<AppContent />
		</AudioSynthProvider>
	);
}
