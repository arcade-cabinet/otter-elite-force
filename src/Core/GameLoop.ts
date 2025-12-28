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

		// Update combo timer
		if (comboTimer > 0) {
			const newTimer = Math.max(0, comboTimer - delta);
			useGameStore.setState({ comboTimer: newTimer });
			
			// Reset combo when timer expires
			if (newTimer === 0) {
				useGameStore.setState({ comboCount: 0 });
			}
		}

		// Call custom update handler
		onUpdate?.(delta, state.clock.elapsedTime);
	});

	return null;
}
