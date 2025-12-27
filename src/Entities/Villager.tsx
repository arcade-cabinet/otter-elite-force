/**
 * Villager Entity
 * Mustelid civilian living in the Copper-Silt Reach
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { Group } from "three";

const VILLAGER_CONFIG = {
	bodyColor: "#8D6E63",
	snoutColor: "#A1887F",
	eyeColor: "#111",
	hatColor: "#d4c4a8",
	swayAmplitude: 0.1,
	headLookAmplitude: 0.2,
	headBobAmplitude: 0.02,
} as const;

export function Villager({ position }: { position: [number, number, number] | THREE.Vector3 }) {
	const groupRef = useRef<Group>(null);
	const headRef = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (!groupRef.current || !headRef.current) return;
		const t = state.clock.elapsedTime;

		// Idle animation (sway and head look)
		groupRef.current.rotation.y = Math.sin(t * 0.5) * VILLAGER_CONFIG.swayAmplitude;
		headRef.current.rotation.y = Math.sin(t * 2) * VILLAGER_CONFIG.headLookAmplitude;
		headRef.current.position.y = 1.2 + Math.sin(t * 4) * VILLAGER_CONFIG.headBobAmplitude;
	});

	return (
		<group ref={groupRef} position={position}>
			{/* Simple Villager Body (No vest/gear) */}
			<mesh position={[0, 0.6, 0]} castShadow>
				<cylinderGeometry args={[0.4, 0.35, 1.2, 8]} />
				<meshStandardMaterial color={VILLAGER_CONFIG.bodyColor} roughness={1} />
			</mesh>

			{/* Head */}
			<mesh ref={headRef} position={[0, 1.2, 0]} castShadow>
				<sphereGeometry args={[0.35, 16, 16]} />
				<meshStandardMaterial color={VILLAGER_CONFIG.bodyColor} roughness={1} />
				{/* Snout */}
				<mesh position={[0, -0.05, 0.25]} scale={[1, 0.8, 1.2]}>
					<sphereGeometry args={[0.2, 12, 12]} />
					<meshStandardMaterial color={VILLAGER_CONFIG.snoutColor} />
				</mesh>
				{/* Eyes */}
				<mesh position={[-0.15, 0.1, 0.25]}>
					<sphereGeometry args={[0.04, 8, 8]} />
					<meshBasicMaterial color={VILLAGER_CONFIG.eyeColor} />
				</mesh>
				<mesh position={[0.15, 0.1, 0.25]}>
					<sphereGeometry args={[0.04, 8, 8]} />
					<meshBasicMaterial color={VILLAGER_CONFIG.eyeColor} />
				</mesh>
			</mesh>

			{/* Villager Straw Hat */}
			<mesh position={[0, 1.55, 0]} rotation-x={0.1}>
				<cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
				<meshStandardMaterial color={VILLAGER_CONFIG.hatColor} />
			</mesh>
		</group>
	);
}
