/**
 * Healer Entity
 * A mustelid medic who can restore player health
 * Distinct from regular villagers with medical supplies and green cross markings
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { Group } from "three";

interface HealerProps {
	position: [number, number, number] | THREE.Vector3;
	isInteracting?: boolean;
}

export function Healer({ position, isInteracting = false }: HealerProps) {
	const groupRef = useRef<Group>(null);
	const headRef = useRef<THREE.Mesh>(null);
	const glowRef = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		if (!groupRef.current || !headRef.current) return;
		const t = state.clock.elapsedTime;

		// Gentle idle animation
		groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
		headRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
		headRef.current.position.y = 1.2 + Math.sin(t * 3) * 0.02;

		// Healing glow effect when interacting
		if (glowRef.current) {
			glowRef.current.intensity = isInteracting ? 2 + Math.sin(t * 8) * 0.5 : 0.5;
		}
	});

	return (
		<group ref={groupRef} position={position}>
			{/* Body - White/cream medical coat */}
			<mesh position={[0, 0.6, 0]} castShadow>
				<cylinderGeometry args={[0.4, 0.35, 1.2, 8]} />
				<meshStandardMaterial color="#e8e8e0" roughness={0.9} />
			</mesh>

			{/* Green cross on chest - Medical insignia */}
			<group position={[0, 0.7, 0.36]}>
				{/* Vertical bar */}
				<mesh>
					<boxGeometry args={[0.08, 0.25, 0.02]} />
					<meshStandardMaterial color="#2e7d32" />
				</mesh>
				{/* Horizontal bar */}
				<mesh>
					<boxGeometry args={[0.25, 0.08, 0.02]} />
					<meshStandardMaterial color="#2e7d32" />
				</mesh>
			</group>

			{/* Head - Otter features */}
			<mesh ref={headRef} position={[0, 1.2, 0]} castShadow>
				<sphereGeometry args={[0.35, 16, 16]} />
				<meshStandardMaterial color="#8D6E63" roughness={1} />
			</mesh>

			{/* Snout */}
			<mesh position={[0, 1.15, 0.25]} scale={[1, 0.8, 1.2]}>
				<sphereGeometry args={[0.2, 12, 12]} />
				<meshStandardMaterial color="#A1887F" />
			</mesh>

			{/* Eyes - Calm, caring */}
			{[-0.15, 0.15].map((x, i) => (
				<mesh key={`eye-${i}`} position={[x, 1.3, 0.25]}>
					<sphereGeometry args={[0.04, 8, 8]} />
					<meshBasicMaterial color="#2e7d32" />
				</mesh>
			))}

			{/* Medical headband with cross */}
			<mesh position={[0, 1.45, 0]} rotation-x={-0.1}>
				<torusGeometry args={[0.32, 0.04, 8, 24]} />
				<meshStandardMaterial color="#fff" />
			</mesh>
			<mesh position={[0, 1.52, 0.25]}>
				<boxGeometry args={[0.1, 0.1, 0.02]} />
				<meshStandardMaterial color="#c62828" />
			</mesh>

			{/* Medical satchel */}
			<group position={[-0.35, 0.5, 0.1]}>
				<mesh castShadow>
					<boxGeometry args={[0.25, 0.3, 0.15]} />
					<meshStandardMaterial color="#5d4037" roughness={0.9} />
				</mesh>
				{/* Cross on satchel */}
				<mesh position={[0, 0, 0.08]}>
					<boxGeometry args={[0.12, 0.04, 0.01]} />
					<meshStandardMaterial color="#c62828" />
				</mesh>
				<mesh position={[0, 0, 0.08]}>
					<boxGeometry args={[0.04, 0.12, 0.01]} />
					<meshStandardMaterial color="#c62828" />
				</mesh>
			</group>

			{/* Healing glow */}
			<pointLight ref={glowRef} color="#66bb6a" intensity={0.5} distance={3} position={[0, 1, 0]} />

			{/* Healing particles when interacting */}
			{isInteracting && (
				<group position={[0, 1, 0]}>
					{[...Array(6)].map((_, i) => (
						<mesh
							key={`particle-${i}`}
							position={[
								Math.cos(i * 1.05) * 0.5,
								Math.sin(Date.now() * 0.003 + i) * 0.3 + 0.5,
								Math.sin(i * 1.05) * 0.5,
							]}
						>
							<sphereGeometry args={[0.05, 6, 6]} />
							<meshBasicMaterial color="#66bb6a" transparent opacity={0.7} />
						</mesh>
					))}
				</group>
			)}
		</group>
	);
}
