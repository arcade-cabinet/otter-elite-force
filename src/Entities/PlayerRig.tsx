/**
 * Player Rig
 * Procedurally generated player character (Sgt. Bubbles)
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

interface PlayerRigProps {
	playerRole?: "player" | "commander";
	position?: [number, number, number];
	rotation?: number;
	isMoving?: boolean;
	velocity?: number;
}

export const PlayerRig = forwardRef<Group, PlayerRigProps>(
	({ playerRole = "player", position = [0, 0, 0], rotation = 0, isMoving = false }, ref) => {
		const legLRef = useRef<THREE.Mesh>(null);
		const legRRef = useRef<THREE.Mesh>(null);
		const headRef = useRef<THREE.Mesh>(null);

		// Materials
		const matFur = new THREE.MeshStandardMaterial({ color: "#5D4037", roughness: 0.9 });
		const matSnout = new THREE.MeshStandardMaterial({ color: "#8D6E63", roughness: 0.8 });
		const matVest = new THREE.MeshStandardMaterial({
			color: playerRole === "player" ? "#223344" : "#334422",
			roughness: 0.6,
		});

		// Animate limbs
		useFrame((state) => {
			const time = state.clock.elapsedTime;

			if (headRef.current) {
				// Gentle head bob
				headRef.current.position.y = 1.45 + Math.sin(time * 2) * 0.02;
			}

			if (!legLRef.current || !legRRef.current) return;

			if (isMoving) {
				legLRef.current.rotation.x = Math.sin(time * 15) * 0.8;
				legRRef.current.rotation.x = Math.sin(time * 15 + Math.PI) * 0.8;
			} else {
				legLRef.current.rotation.x = 0;
				legRRef.current.rotation.x = 0;
			}
		});

		return (
			<group ref={ref} position={position} rotation-y={rotation}>
				{/* Torso - Main body */}
				<mesh position={[0, 0.7, 0]} castShadow receiveShadow material={matFur}>
					<cylinderGeometry args={[0.5, 0.45, 1.4, 8]} />

					{/* Vest overlay */}
					<mesh material={matVest}>
						<cylinderGeometry args={[0.52, 0.5, 0.8, 8]} />
					</mesh>
				</mesh>

				{/* Head */}
				<mesh ref={headRef} position={[0, 1.45, 0]} castShadow material={matFur}>
					<sphereGeometry args={[0.45, 16, 16]} />

					{/* Snout */}
					<mesh position={[0, -0.1, 0.35]} scale={[1, 0.8, 1.2]} material={matSnout}>
						<sphereGeometry args={[0.25, 12, 12]} />
					</mesh>

					{/* Eyes */}
					<mesh position={[-0.2, 0.1, 0.35]}>
						<sphereGeometry args={[0.05, 8, 8]} />
						<meshStandardMaterial color="#111" />
					</mesh>
					<mesh position={[0.2, 0.1, 0.35]}>
						<sphereGeometry args={[0.05, 8, 8]} />
						<meshStandardMaterial color="#111" />
					</mesh>

					{/* Ears */}
					<mesh position={[-0.35, 0.35, 0]} rotation-z={0.5} material={matFur}>
						<sphereGeometry args={[0.12, 8, 8]} />
					</mesh>
					<mesh position={[0.35, 0.35, 0]} rotation-z={-0.5} material={matFur}>
						<sphereGeometry args={[0.12, 8, 8]} />
					</mesh>

					{/* Bandana (Player only) */}
					{playerRole === "player" && (
						<mesh position={[0, 0.25, 0]} rotation-x={Math.PI / 2}>
							<torusGeometry args={[0.42, 0.08, 6, 12]} />
							<meshStandardMaterial color="#ffaa00" />
						</mesh>
					)}

					{/* Beret (Commander only) */}
					{playerRole === "commander" && (
						<mesh position={[0, 0.35, 0]} rotation-z={-0.2}>
							<cylinderGeometry args={[0.45, 0.5, 0.2, 8]} />
							<meshStandardMaterial color="#880000" />
						</mesh>
					)}
				</mesh>

				{/* Radio Pack (Player only) */}
				{playerRole === "player" && (
					<mesh position={[0, 0.9, -0.4]}>
						<boxGeometry args={[0.6, 0.8, 0.3]} />
						<meshStandardMaterial color="#332211" />
					</mesh>
				)}

				{/* Arms */}
				<mesh position={[-0.65, 1, 0]} rotation-z={0.4} castShadow material={matFur}>
					<capsuleGeometry args={[0.13, 0.6, 4, 8]} />
				</mesh>

				{/* Right arm with gun (Player only) */}
				<group position={[0.65, 1, 0]}>
					<mesh rotation-x={-Math.PI / 2} position={[0, 0, 0.3]} castShadow material={matFur}>
						<capsuleGeometry args={[0.13, 0.6, 4, 8]} />
					</mesh>

					{playerRole === "player" && (
						<mesh position={[0, 0, 0.8]}>
							<boxGeometry args={[0.2, 0.2, 1]} />
							<meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
						</mesh>
					)}
				</group>

				{/* Legs */}
				<mesh ref={legLRef} position={[-0.3, 0.3, 0]} castShadow>
					<capsuleGeometry args={[0.13, 0.6, 4, 8]} />
					<meshStandardMaterial color="#5D4037" roughness={0.9} />
				</mesh>

				<mesh ref={legRRef} position={[0.3, 0.3, 0]} castShadow>
					<capsuleGeometry args={[0.13, 0.6, 4, 8]} />
					<meshStandardMaterial color="#5D4037" roughness={0.9} />
				</mesh>
			</group>
		);
	},
);
