/**
 * Villager Entity
 * Mustelid civilian living in the Copper-Silt Reach
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { Group } from "three";

export function Villager({ position }: { position: THREE.Vector3 }) {
	const groupRef = useRef<Group>(null);
	const headRef = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (!groupRef.current || !headRef.current) return;
		const t = state.clock.elapsedTime;

		// Idle animation (sway and head look)
		groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
		headRef.current.rotation.y = Math.sin(t * 2) * 0.2;
		headRef.current.position.y = 1.2 + Math.sin(t * 4) * 0.02;
	});

	return (
		<group ref={groupRef} position={position}>
			{/* Simple Villager Body (No vest/gear) */}
			<mesh position={[0, 0.6, 0]} castShadow>
				<cylinderGeometry args={[0.4, 0.35, 1.2, 8]} />
				<meshStandardMaterial color="#8D6E63" roughness={1} />
			</mesh>

			{/* Head */}
			<mesh ref={headRef} position={[0, 1.2, 0]} castShadow>
				<sphereGeometry args={[0.35, 16, 16]} />
				<meshStandardMaterial color="#8D6E63" roughness={1} />
				{/* Snout */}
				<mesh position={[0, -0.05, 0.25]} scale={[1, 0.8, 1.2]}>
					<sphereGeometry args={[0.2, 12, 12]} />
					<meshStandardMaterial color="#A1887F" />
				</mesh>
				{/* Eyes */}
				<mesh position={[-0.15, 0.1, 0.25]}>
					<sphereGeometry args={[0.04, 8, 8]} />
					<meshBasicMaterial color="#111" />
				</mesh>
				<mesh position={[0.15, 0.1, 0.25]}>
					<sphereGeometry args={[0.04, 8, 8]} />
					<meshBasicMaterial color="#111" />
				</mesh>
			</mesh>

			{/* Villager Straw Hat */}
			<mesh position={[0, 1.55, 0]} rotation-x={0.1}>
				<cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
				<meshStandardMaterial color="#d4c4a8" />
			</mesh>
		</group>
	);
}

export function Hut({ position }: { position: THREE.Vector3 }) {
	return (
		<group position={position}>
			{/* Base */}
			<mesh position={[0, 1, 0]} castShadow receiveShadow>
				<boxGeometry args={[4, 2, 4]} />
				<meshStandardMaterial color="#3d2b1f" roughness={1} />
			</mesh>
			{/* Thatched Roof */}
			<mesh position={[0, 2.5, 0]}>
				<cylinderGeometry args={[0, 3, 1.5, 4]} />
				<meshStandardMaterial color="#d4c4a8" roughness={1} />
			</mesh>
			{/* Doorway */}
			<mesh position={[0, 0.8, 2.01]}>
				<planeGeometry args={[1, 1.6]} />
				<meshBasicMaterial color="#000" />
			</mesh>
		</group>
	);
}
