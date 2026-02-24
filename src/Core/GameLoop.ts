/**
 * Game Loop
 * Main game update loop using React Three Fiber's useFrame
 */

import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../stores/gameStore";

interface GameLoopProps {
	onUpdate?: (delta: number, elapsed: number) => void;
}

/**
 * Game Loop Component
 * Integrates with R3F's render loop
 */
export function GameLoop({ onUpdate }: GameLoopProps) {
	const mode = useGameStore((state) => state.mode);
	const comboTimer = useGameStore((state) => state.comboTimer);

	useFrame((state, delta) => {
		// Only run game updates when in GAME mode
		if (mode !== "GAME") return;

		// Cap delta time to prevent physics explosions from lag spikes
		// (Adapted from otters.html - prevents runaway physics on frame drops)
		const cappedDelta = Math.min(delta, 0.1);

		// Update combo timer
		if (comboTimer > 0) {
			const newTimer = Math.max(0, comboTimer - cappedDelta);
			useGameStore.setState({ comboTimer: newTimer });

			// Reset combo when timer expires
			if (newTimer === 0) {
				useGameStore.setState({ comboCount: 0 });
			}
		}

		// Call custom update handler with capped delta
		onUpdate?.(cappedDelta, state.clock.elapsedTime);
	});

	return null;
}
