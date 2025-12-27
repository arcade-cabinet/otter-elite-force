/**
 * Snake Predator
 * Tree-dwelling ambushers that hang from mangroves and strike from above
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { randomRange } from "../../utils/math";
import type { EnemyProps, SnakeData } from "./types";

export function Snake({ data, targetPosition, onDeath }: EnemyProps<SnakeData>) {
	const groupRef = useRef<Group>(null);
	const segmentsRef = useRef<THREE.Mesh[]>([]);

	const [isStriking, setIsStriking] = useState(false);
	const strikeTimer = useRef(0);
	const initialY = useMemo(() => data.position.y + randomRange(4, 7), [data.position.y]);

	useEffect(() => {
		for (let i = 0; i < 12; i++) {
			if (segmentsRef.current[i]) {
				segmentsRef.current[i].position.y = initialY - i * 0.4;
			}
		}
	}, [initialY]);

	useFrame((state, delta) => {
		if (!groupRef.current) return;

		const t = state.clock.elapsedTime;
		const dx = groupRef.current.position.x - targetPosition.x;
		const dz = groupRef.current.position.z - targetPosition.z;
		const distanceSq = dx * dx + dz * dz;

		if (distanceSq < 64 && strikeTimer.current <= 0) {
			// 8^2 = 64
			setIsStriking(true);
			strikeTimer.current = 4;
		}

		if (strikeTimer.current > 0) {
			strikeTimer.current -= delta;
			if (strikeTimer.current < 2) setIsStriking(false);
		}

		const swayX = Math.sin(t * 0.5) * 0.2;
		const swayZ = Math.cos(t * 0.7) * 0.2;

		// Calculate look direction once for the whole snake if striking
		let strikeRotation = 0;
		if (isStriking) {
			strikeRotation = Math.atan2(
				targetPosition.x - groupRef.current.position.x,
				targetPosition.z - groupRef.current.position.z,
			);
		}

		segmentsRef.current.forEach((seg, i) => {
			const targetSegY = isStriking ? initialY - i * 0.8 : initialY - i * 0.35;

			seg.position.y = THREE.MathUtils.lerp(seg.position.y, targetSegY, 0.1);
			seg.position.x = swayX * (i * 0.5);
			seg.position.z = swayZ * (i * 0.5);

			if (isStriking) {
				seg.rotation.y = strikeRotation;
			}
		});

		// Suppression logic for snakes
		if (data.suppression > 0.5) {
			setIsStriking(false); // Can't strike if suppressed
		}
	});

	// Death logic
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const bodyColor = "#1a331a";
	const patternColor = "#3d4d29";

	return (
		<group ref={groupRef} position={[data.position.x, 0, data.position.z]}>
			<mesh position={[0, initialY + 0.5, 0]}>
				<boxGeometry args={[0.2, 0.2, 0.2]} />
				<meshStandardMaterial color="#332211" />
			</mesh>

			{[...Array(12)].map((_, i) => (
				<mesh
					key={`seg-${data.id}-${i}`}
					ref={(el) => {
						if (el) segmentsRef.current[i] = el;
					}}
					castShadow
				>
					<sphereGeometry args={[0.15 - i * 0.005, 8, 8]} />
					<meshStandardMaterial color={i % 2 === 0 ? bodyColor : patternColor} roughness={0.5} />

					{i === 11 && (
						<group>
							{[-1, 1].map((side) => (
								<mesh key={`${data.id}-eye-${side}`} position={[side * 0.08, 0.05, 0.1]}>
									<sphereGeometry args={[0.02, 4, 4]} />
									<meshBasicMaterial color="#ffaa00" />
								</mesh>
							))}
							<mesh position={[0, -0.05, 0.12]} rotation-x={0.5}>
								<boxGeometry args={[0.1, 0.02, 0.05]} />
								<meshStandardMaterial color="#eee" />
							</mesh>
						</group>
					)}
				</mesh>
			))}
		</group>
	);
}
