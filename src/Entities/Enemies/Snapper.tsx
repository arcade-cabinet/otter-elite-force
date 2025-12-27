/**
 * Snapper Bunker
 * Stationary, heavily armored turtles with mounted heavy weapons
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import type { EnemyProps, SnapperData } from "./types";

const SNAPPER_CONFIG = {
	DETECTION_RANGE: 25,
	FIRING_THRESHOLD: 0.8,
	SUPPRESSION_THRESHOLD: 0.7,
	HEALTH_BAR_Y: 2.5,
};

export function Snapper({ data, targetPosition, onDeath }: EnemyProps<SnapperData>) {
	const groupRef = useRef<Group>(null);
	const turretRef = useRef<Group>(null);
	const [isFiring, setIsFiring] = useState(false);

	// Memoize materials
	const shellColor = "#3d3329";
	const bodyColor = "#2d3d19";
	const matShell = useMemo(
		() => new THREE.MeshStandardMaterial({ color: shellColor, roughness: 1 }),
		[],
	);
	const matBody = useMemo(() => new THREE.MeshStandardMaterial({ color: bodyColor }), []);
	const matMetal = useMemo(
		() => new THREE.MeshStandardMaterial({ color: "#111", metalness: 0.8 }),
		[],
	);
	const matBarrel = useMemo(
		() => new THREE.MeshStandardMaterial({ color: "#222", metalness: 0.9 }),
		[],
	);

	useFrame((state, _delta) => {
		if (!groupRef.current || !turretRef.current) return;

		const distanceToPlayer = groupRef.current.position.distanceTo(targetPosition);

		if (distanceToPlayer < SNAPPER_CONFIG.DETECTION_RANGE) {
			const lookDir = targetPosition.clone().sub(groupRef.current.position);
			const targetAngle = Math.atan2(lookDir.x, lookDir.z);
			turretRef.current.rotation.y = THREE.MathUtils.lerp(
				turretRef.current.rotation.y,
				targetAngle,
				0.05,
			);

			setIsFiring(Math.sin(state.clock.elapsedTime * 10) > SNAPPER_CONFIG.FIRING_THRESHOLD);
		} else {
			setIsFiring(false);
		}

		// Suppression logic for snappers
		if (data.suppression > SNAPPER_CONFIG.SUPPRESSION_THRESHOLD) {
			setIsFiring(false); // Overheated/Suppressed
		}
	});

	// Death logic
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	return (
		<group ref={groupRef} position={[data.position.x, 0.2, data.position.z]}>
			<mesh castShadow receiveShadow material={matShell}>
				<sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
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
					material={matShell}
				>
					<boxGeometry args={[0.3, 0.4, 0.3]} />
				</mesh>
			))}

			<group ref={turretRef} position={[0, 0.8, 0]}>
				<mesh castShadow material={matMetal}>
					<boxGeometry args={[0.4, 0.4, 1.2]} />
				</mesh>
				<mesh position={[0, 0, 0.8]} material={matBarrel}>
					<cylinderGeometry args={[0.1, 0.1, 1.5, 8]} rotation-x={Math.PI / 2} />
				</mesh>
				<group position={[0, 0, 1.6]}>
					{isFiring && (
						<mesh>
							<sphereGeometry args={[0.3, 8, 8]} />
							<meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
						</mesh>
					)}
					<pointLight distance={5} intensity={isFiring ? 2 : 0} color="#ffaa00" />
				</group>
			</group>

			<mesh position={[0, 0.3, 1.4]} rotation-x={0.2} material={matBody}>
				<sphereGeometry args={[0.4, 12, 12]} scale={[1, 0.8, 1.2]} />
			</mesh>

			<group position={[0, SNAPPER_CONFIG.HEALTH_BAR_Y, 0]}>
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
