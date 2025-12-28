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
	const headRef = useRef<THREE.Group>(null);
	const tailRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!groupRef.current || !headRef.current) return;
		const t = state.clock.elapsedTime;

		// Idle animation (sway and head look)
		groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
		headRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
		headRef.current.position.y = 0.5 + Math.sin(t * 3) * 0.01;

		if (tailRef.current) {
			tailRef.current.rotation.z = Math.sin(t * 2) * 0.1;
		}
	});

	const furColor = "#8D6E63";
	const snoutColor = "#A1887F";

	return (
		<group ref={groupRef} position={position}>
			{/* Quadrupedal Villager Body */}
			<group position={[0, 0.4, 0]}>
				{/* Torso */}
				<mesh rotation-x={Math.PI / 2} castShadow>
					<capsuleGeometry args={[0.28, 0.6, 16, 24]} />
					<meshStandardMaterial color={furColor} roughness={1} />
				</mesh>

				{/* 4 Simple Legs */}
				{[
					[-0.2, -0.2],
					[0.2, -0.2],
					[-0.2, 0.2],
					[0.2, 0.2],
				].map((pos, i) => (
					<mesh key={i} position={[pos[0], -0.2, pos[1]]} castShadow>
						<sphereGeometry args={[0.1, 12, 12]} />
						<meshStandardMaterial color={furColor} />
					</mesh>
				))}

				{/* Tail */}
				<group ref={tailRef} position={[0, 0, -0.4]}>
					<mesh rotation-x={Math.PI / 2} castShadow>
						<capsuleGeometry args={[0.12, 0.5, 12, 16]} />
						<meshStandardMaterial color={furColor} />
					</mesh>
				</group>

				{/* Head & Neck */}
				<group ref={headRef} position={[0, 0.1, 0.4]}>
					<mesh position={[0, 0.15, 0.1]} rotation-x={-Math.PI / 4} castShadow>
						<sphereGeometry args={[0.2, 16, 16]} />
						<meshStandardMaterial color={furColor} />
					</mesh>
					<group position={[0, 0.35, 0.15]}>
						<mesh castShadow>
							<sphereGeometry args={[0.22, 24, 24]} />
							<meshStandardMaterial color={furColor} />
						</mesh>
						{/* Snout */}
						<mesh position={[0, -0.05, 0.18]}>
							<sphereGeometry args={[0.12, 16, 16]} />
							<meshStandardMaterial color={snoutColor} />
						</mesh>
						{/* Eyes */}
						{[-1, 1].map((side) => (
							<mesh key={side} position={[side * 0.1, 0.08, 0.15]}>
								<sphereGeometry args={[0.03, 12, 12]} />
								<meshBasicMaterial color="#111" />
							</mesh>
						))}
						{/* Villager Straw Hat */}
						<mesh position={[0, 0.22, 0]} rotation-x={0.1}>
							<cylinderGeometry args={[0.45, 0.45, 0.04, 32]} />
							<meshStandardMaterial color="#d4c4a8" />
						</mesh>
					</group>
				</group>
			</group>
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
