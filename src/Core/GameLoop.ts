/**
 * Game Loop
 * Main game update loop using Babylon.js scene observation
 */

import { useEffect, useRef } from "react";
import { useScene } from "reactylon";
import { useGameStore } from "../stores/gameStore";

interface GameLoopProps {
	onUpdate?: (delta: number, elapsed: number) => void;
}

/**
 * Game Loop Component
 * Integrates with Babylon.js scene's onBeforeRenderObservable
 */
export function GameLoop({ onUpdate }: GameLoopProps) {
	const scene = useScene();
	const mode = useGameStore((state) => state.mode);
	// Reactive subscription ensures re-render when combo state changes
	const comboTimer = useGameStore((state) => state.comboTimer);
	// Ref holds latest value so the stable observer closure is always current
	const comboTimerRef = useRef(comboTimer);
	comboTimerRef.current = comboTimer;

	useEffect(() => {
		if (!scene) return;

		let elapsedTime = 0;
		let lastTime = performance.now();

		const observer = scene.onBeforeRenderObservable.add(() => {
			// Only run game updates when in GAME mode
			if (mode !== "GAME") return;

			const now = performance.now();
			const rawDelta = (now - lastTime) / 1000;
			lastTime = now;

			// Cap delta time to prevent physics explosions from lag spikes
			const cappedDelta = Math.min(rawDelta, 0.1);
			elapsedTime += cappedDelta;

			// Update combo timer using the ref for a fresh value without a stale closure
			if (comboTimerRef.current > 0) {
				const newTimer = Math.max(0, comboTimerRef.current - cappedDelta);
				useGameStore.setState({ comboTimer: newTimer });

				// Reset combo count when timer expires
				if (newTimer === 0) {
					useGameStore.setState({ comboCount: 0 });
				}
			}

			// Call custom update handler with capped delta
			onUpdate?.(cappedDelta, elapsedTime);
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene, mode, onUpdate]);

	return null;
}
