/**
 * Snake Predator
 * Tree-dwelling ambushers that hang from mangroves and strike from above
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";

export interface SnakeData {
	id: string;
	position: THREE.Vector3;
	hp: number;
	maxHp: number;
}

interface SnakeProps {
	data: SnakeData;
	targetPosition: THREE.Vector3;
	onDeath?: (id: string) => void;
}

export function Snake({ data, targetPosition, onDeath }: SnakeProps) {
	const groupRef = useRef<Group>(null);
	const headRef = useRef<THREE.Mesh>(null);
	const segmentsRef = useRef<THREE.Mesh[]>([]);
	
	const [isStriking, setIsAmbushing] = useState(false);
	const strikeTimer = useRef(0);
	const initialY = data.position.y + randomRange(4, 7); // Hang high in the trees

	useEffect(() => {
		// Initialize segment positions
		segmentsRef.current.forEach((seg, i) => {
			seg.position.y = initialY - i * 0.4;
		});
	}, [initialY]);

	useFrame((state, delta) => {
		if (!groupRef.current) return;

		const t = state.clock.elapsedTime;
		const distanceToPlayer = new THREE.Vector2(groupRef.current.position.x, groupRef.current.position.z)
			.distanceTo(new THREE.Vector2(targetPosition.x, targetPosition.z));

		// Strike logic
		if (distanceToPlayer < 8 && strikeTimer.current <= 0) {
			setIsAmbushing(true);
			strikeTimer.current = 4; // Reset strike cycle
		}

		if (strikeTimer.current > 0) {
			strikeTimer.current -= delta;
			if (strikeTimer.current < 2) setIsAmbushing(false);
		}

		// Procedural sway (hanging from tree)
		const swayX = Math.sin(t * 0.5) * 0.2;
		const swayZ = Math.cos(t * 0.7) * 0.2;

		segmentsRef.current.forEach((seg, i) => {
			// Hanging physics: top segment is fixed, others follow with delay
			const targetSegY = isStriking 
				? initialY - i * 0.8  // Stretch out during strike
				: initialY - i * 0.35; // Coil up normally
			
			seg.position.y = THREE.MathUtils.lerp(seg.position.y, targetSegY, 0.1);
			seg.position.x = swayX * (i * 0.5);
			seg.position.z = swayZ * (i * 0.5);
			
			// Face the player during strike
			if (isStriking) {
				const lookDir = targetPosition.clone().sub(groupRef.current!.position.clone().add(seg.position));
				seg.rotation.y = Math.atan2(lookDir.x, lookDir.z);
			}
		});

		// Check death
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	});

	const bodyColor = "#1a331a"; // Jungle green
	const patternColor = "#3d4d29"; // Muddy pattern

	return (
		<group ref={groupRef} position={[data.position.x, 0, data.position.z]}>
			{/* Anchor to tree (Fixed top) */}
			<mesh position={[0, initialY + 0.5, 0]}>
				<boxGeometry args={[0.2, 0.2, 0.2]} />
				<meshStandardMaterial color="#332211" />
			</mesh>

			{/* Segmented Body */}
			{[...Array(12)].map((_, i) => (
				<mesh 
					key={`seg-${i}`}
					ref={(el) => { if(el) segmentsRef.current[i] = el; }}
					castShadow
				>
					<sphereGeometry args={[0.15 - i * 0.005, 8, 8]} />
					<meshStandardMaterial color={i % 2 === 0 ? bodyColor : patternColor} roughness={0.5} />
					
					{/* Head features on first segment */}
					{i === 11 && (
						<group>
							{/* Glowing amber eyes */}
							{[-1, 1].map(side => (
								<mesh key={`eye-${side}`} position={[side * 0.08, 0.05, 0.1]}>
									<sphereGeometry args={[0.02, 4, 4]} />
									<meshBasicMaterial color="#ffaa00" />
								</mesh>
							))}
							{/* Fangs (Biological but rugged) */}
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

function randomRange(min: number, max: number) {
	return min + Math.random() * (max - min);
}
