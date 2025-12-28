/**
 * Snapper Bunker
 * Stationary, heavily armored turtles with mounted heavy weapons
 */

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import type { EnemyProps, SnapperData } from "./types";

export function Snapper({ data, targetPosition, onDeath }: EnemyProps<SnapperData>) {
	const groupRef = useRef<Group>(null);
	const turretRef = useRef<Group>(null);
	const [isFiring, setIsFiring] = useState(false);

	useFrame((state, _delta) => {
		if (!groupRef.current || !turretRef.current) return;

		const distanceToPlayer = groupRef.current.position.distanceTo(targetPosition);

		if (distanceToPlayer < 25) {
			const lookDir = targetPosition.clone().sub(groupRef.current.position);
			const targetAngle = Math.atan2(lookDir.x, lookDir.z);
			turretRef.current.rotation.y = THREE.MathUtils.lerp(
				turretRef.current.rotation.y,
				targetAngle,
				0.05,
			);

			setIsFiring(Math.sin(state.clock.elapsedTime * 10) > 0.8);
		} else {
			setIsFiring(false);
		}

		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}

		// Suppression logic for snappers
		if (data.suppression > 0.7) {
			setIsFiring(false); // Overheated/Suppressed
		}
	});

	const shellColor = "#3d3329";
	const bodyColor = "#2d3d19";

	return (
		<group ref={groupRef} position={[data.position.x, 0.2, data.position.z]}>
			<mesh castShadow receiveShadow>
				<sphereGeometry args={[1.5, 40, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color={shellColor} roughness={1} />
			</mesh>

			{[...Array(8)].map((_, i) => (
				<mesh
					key={`spike-${data.id}-${i}`}
					position={[
						Math.cos((i / 8) * Math.PI * 2) * 1.2,
						0.5,
						Math.sin((i / 8) * Math.PI * 2) * 1.2,
					]}
					rotation-x={-0.5}
				>
					<sphereGeometry args={[0.2, 16, 16]} />
					<meshStandardMaterial color={shellColor} />
				</mesh>
			))}

			<group ref={turretRef} position={[0, 0.8, 0]}>
				<mesh castShadow>
					<capsuleGeometry args={[0.2, 0.8, 12, 24]} />
					<meshStandardMaterial color="#111" metalness={0.8} />
				</mesh>
				<mesh position={[0, 0, 0.8]} rotation-x={Math.PI / 2}>
					<cylinderGeometry args={[0.1, 0.1, 1.5, 32]} />
					<meshStandardMaterial color="#222" metalness={0.9} />
				</mesh>
				{isFiring && (
					<mesh position={[0, 0, 1.6]}>
						<sphereGeometry args={[0.3, 24, 24]} />
						<meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
						<pointLight distance={5} intensity={2} color="#ffaa00" />
					</mesh>
				)}
			</group>

			<mesh position={[0, 0.3, 1.4]} rotation-x={0.2} scale={[1, 0.8, 1.2]}>
				<sphereGeometry args={[0.4, 24, 24]} />
				<meshStandardMaterial color={bodyColor} />
			</mesh>

			<group position={[0, 2.5, 0]}>
				<mesh>
					<planeGeometry args={[2, 0.1]} />
					<meshBasicMaterial color="#000" transparent opacity={0.5} />
				</mesh>
				<mesh position={[-(1 - data.hp / data.maxHp) * 1, 0, 0.01]} scale-x={data.hp / data.maxHp}>
					<planeGeometry args={[2, 0.1]} />
					<meshBasicMaterial color="#ffff00" />
				</mesh>
			</group>
		</group>
	);
}
