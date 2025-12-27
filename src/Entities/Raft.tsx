/**
 * Raft Vehicle
 * Tactical riverine transport for navigating fast-moving rapids.
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

interface RaftProps {
	position: [number, number, number];
	rotation?: number;
	velocity?: THREE.Vector3;
	isPiloted?: boolean;
}

export const Raft = forwardRef<Group, RaftProps>(({ position, rotation = 0, isPiloted = false }, ref) => {
	const groupRef = useRef<Group>(null);
	const propellerRef = useRef<Mesh>(null);

	useFrame((state) => {
		if (!groupRef.current) return;
		const t = state.clock.elapsedTime;

		// Gentle buoyancy oscillation
		groupRef.current.position.y = Math.sin(t * 2) * 0.05 + 0.1;
		groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.02;
		groupRef.current.rotation.x = Math.cos(t * 1.2) * 0.02;

		// Animate propeller when piloted
		if (isPiloted && propellerRef.current) {
			propellerRef.current.rotation.x = t * 20;
		}
	});

	return (
		<group ref={ref} position={position} rotation-y={rotation}>
			<group ref={groupRef}>
				{/* Main Logs */}
				{[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
					<mesh key={`log-${i}`} position={[x, 0, 0]} rotation-x={Math.PI / 2} castShadow receiveShadow>
						<cylinderGeometry args={[0.22, 0.22, 3, 8]} />
						<meshStandardMaterial color="#5d4037" roughness={0.8} />
					</mesh>
				))}

				{/* Crossbeams (Binding) */}
				<mesh position={[0, 0.15, 1]} receiveShadow>
					<boxGeometry args={[2, 0.1, 0.2]} />
					<meshStandardMaterial color="#332211" />
				</mesh>
				<mesh position={[0, 0.15, -1]} receiveShadow>
					<boxGeometry args={[2, 0.1, 0.2]} />
					<meshStandardMaterial color="#332211" />
				</mesh>

				{/* Tactical Gear: Crate/Seat */}
				<mesh position={[0, 0.4, -0.8]} castShadow>
					<boxGeometry args={[0.8, 0.6, 0.6]} />
					<meshStandardMaterial color="#2d3d19" />
				</mesh>

				{/* Outboard Propeller (Scavenged tech) */}
				<group position={[0, 0, -1.6]}>
					<mesh castShadow>
						<boxGeometry args={[0.2, 0.8, 0.2]} />
						<meshStandardMaterial color="#222" />
					</mesh>
					{isPiloted && (
						<mesh ref={propellerRef} position={[0, -0.4, 0]}>
							<boxGeometry args={[0.1, 0.6, 0.02]} />
							<meshBasicMaterial color="#111" />
						</mesh>
					)}
				</group>
			</group>
		</group>
	);
});
