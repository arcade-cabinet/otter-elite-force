/**
 * Raft Vehicle
 * Tactical riverine transport for navigating fast-moving rapids.
 * Features authentic log construction, rope bindings, and proper propeller
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

interface RaftProps {
	position: [number, number, number];
	rotation?: number;
	velocity?: THREE.Vector3;
	isPiloted?: boolean;
}

export const Raft = forwardRef<Group, RaftProps>(
	({ position, rotation = 0, isPiloted = false }, ref) => {
		const groupRef = useRef<Group>(null);
		const propellerRef = useRef<Group>(null);

		// Materials
		const materials = useMemo(
			() => ({
				log: new THREE.MeshStandardMaterial({ color: "#5d4037", roughness: 0.9 }),
				logDark: new THREE.MeshStandardMaterial({ color: "#3d2a1f", roughness: 0.95 }),
				rope: new THREE.MeshStandardMaterial({ color: "#8b7355", roughness: 1.0 }),
				metal: new THREE.MeshStandardMaterial({ color: "#333", metalness: 0.7, roughness: 0.4 }),
				propBlade: new THREE.MeshStandardMaterial({
					color: "#444",
					metalness: 0.8,
					roughness: 0.3,
				}),
				crate: new THREE.MeshStandardMaterial({ color: "#2d3d19", roughness: 0.8 }),
			}),
			[],
		);

		useFrame((state) => {
			if (!groupRef.current) return;
			const t = state.clock.elapsedTime;

			// Realistic water bobbing - slight delay between roll and pitch
			groupRef.current.position.y = Math.sin(t * 1.8) * 0.06 + Math.sin(t * 2.5) * 0.03 + 0.1;
			groupRef.current.rotation.z = Math.sin(t * 1.4) * 0.025;
			groupRef.current.rotation.x = Math.cos(t * 1.1) * 0.02;

			// Animate propeller when piloted - realistic multi-blade spin
			if (isPiloted && propellerRef.current) {
				propellerRef.current.rotation.z = t * 25;
			}
		});

		return (
			<group ref={ref} position={position} rotation-y={rotation}>
				<group ref={groupRef}>
					{/* === MAIN LOG DECK === */}
					{/* Logs with slight variation for authenticity */}
					{[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => {
						const radiusVariation = 0.2 + (i % 2) * 0.03;
						const lengthVariation = 3 + (i === 2 ? 0.2 : 0);
						return (
							<mesh
								key={`log-${i}`}
								position={[x, 0, (i % 2) * 0.05]}
								rotation-x={Math.PI / 2}
								castShadow
								receiveShadow
								material={i % 2 === 0 ? materials.log : materials.logDark}
							>
								<cylinderGeometry
									args={[radiusVariation, radiusVariation * 0.95, lengthVariation, 12]}
								/>
							</mesh>
						);
					})}

					{/* === ROPE BINDINGS === */}
					{/* Front binding */}
					<group position={[0, 0.15, 1.1]}>
						{[-0.7, 0, 0.7].map((x, i) => (
							<mesh
								key={`rope-front-${i}`}
								position={[x, 0, 0]}
								rotation-z={Math.PI / 2}
								material={materials.rope}
							>
								<torusGeometry args={[0.25, 0.03, 6, 12]} />
							</mesh>
						))}
					</group>
					{/* Rear binding */}
					<group position={[0, 0.15, -1.1]}>
						{[-0.7, 0, 0.7].map((x, i) => (
							<mesh
								key={`rope-rear-${i}`}
								position={[x, 0, 0]}
								rotation-z={Math.PI / 2}
								material={materials.rope}
							>
								<torusGeometry args={[0.25, 0.03, 6, 12]} />
							</mesh>
						))}
					</group>
					{/* Cross rope pattern */}
					<mesh position={[0, 0.2, 0]} rotation-x={Math.PI / 2} material={materials.rope}>
						<cylinderGeometry args={[0.02, 0.02, 2.2, 6]} />
					</mesh>

					{/* === TACTICAL CARGO === */}
					{/* Ammo crate */}
					<group position={[0, 0.45, -0.6]}>
						<mesh castShadow material={materials.crate}>
							<boxGeometry args={[0.7, 0.5, 0.5]} />
						</mesh>
						{/* Crate straps */}
						<mesh position={[0, 0.26, 0]}>
							<boxGeometry args={[0.75, 0.02, 0.1]} />
							<meshStandardMaterial color="#1a1a1a" />
						</mesh>
						{/* Stenciled marking */}
						<mesh position={[0, 0, 0.26]}>
							<planeGeometry args={[0.3, 0.2]} />
							<meshBasicMaterial color="#111" />
						</mesh>
					</group>

					{/* === OUTBOARD MOTOR === */}
					<group position={[0, 0.1, -1.6]}>
						{/* Motor housing */}
						<mesh position={[0, 0.2, 0]} castShadow material={materials.metal}>
							<boxGeometry args={[0.25, 0.5, 0.25]} />
						</mesh>
						{/* Motor cowling */}
						<mesh position={[0, 0.5, 0]} castShadow>
							<cylinderGeometry args={[0.12, 0.15, 0.15, 8]} />
							<meshStandardMaterial color="#2a4a2a" roughness={0.7} />
						</mesh>
						{/* Drive shaft */}
						<mesh position={[0, -0.3, 0]} material={materials.metal}>
							<cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
						</mesh>

						{/* === PROPELLER - Realistic 3-blade === */}
						<group ref={propellerRef} position={[0, -0.55, 0]}>
							{/* Hub */}
							<mesh material={materials.metal}>
								<sphereGeometry args={[0.06, 8, 8]} />
							</mesh>
							{/* Three angled blades */}
							{[0, 1, 2].map((i) => (
								<group key={`blade-${i}`} rotation-z={(i * Math.PI * 2) / 3}>
									<mesh
										position={[0.18, 0, 0]}
										rotation-y={0.3}
										rotation-x={0.1}
										material={materials.propBlade}
									>
										{/* Blade shape - tapered and curved */}
										<boxGeometry args={[0.25, 0.02, 0.08]} />
									</mesh>
								</group>
							))}
						</group>

						{/* Tiller handle */}
						<mesh position={[0.3, 0.3, 0]} rotation-z={-0.5} material={materials.logDark}>
							<cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
						</mesh>
						{/* Grip */}
						<mesh position={[0.5, 0.15, 0]} rotation-z={-0.5}>
							<cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
							<meshStandardMaterial color="#111" roughness={0.9} />
						</mesh>
					</group>

					{/* Water spray effect when piloted */}
					{isPiloted && (
						<group position={[0, -0.1, -1.8]}>
							<mesh>
								<sphereGeometry args={[0.15, 8, 8]} />
								<meshBasicMaterial color="#8899aa" transparent opacity={0.3} />
							</mesh>
						</group>
					)}
				</group>
			</group>
		);
	},
);
