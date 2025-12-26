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

	useFrame((state, delta) => {
		// Only run game updates when in GAME mode
		if (mode !== "GAME") return;

		// Call custom update handler
		onUpdate?.(delta, state.clock.elapsedTime);
	});

	return null;
}
