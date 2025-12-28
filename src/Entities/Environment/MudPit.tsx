/**
 * MudPit Environmental Hazard
 * Slows movement significantly, authentic swamp aesthetic
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

interface MudPitProps {
	position: [number, number, number] | THREE.Vector3;
	size?: number;
}

export function MudPit({ position, size = 4 }: MudPitProps) {
	const bubblesRef = useRef<THREE.Group>(null);

	// Generate random bubble data
	const bubbleData = useMemo(
		() =>
			[...Array(8)].map(() => ({
				x: (Math.random() - 0.5) * size * 0.8,
				z: (Math.random() - 0.5) * size * 0.8,
				speed: 0.5 + Math.random() * 1.5,
				phase: Math.random() * Math.PI * 2,
				size: 0.08 + Math.random() * 0.1,
			})),
		[size],
	);

	useFrame((state) => {
		if (!bubblesRef.current) return;
		const t = state.clock.elapsedTime;

		bubblesRef.current.children.forEach((bubble, i) => {
			const data = bubbleData[i];
			// Bubbles rise and pop
			const cycle = (t * data.speed + data.phase) % 2;
			bubble.position.y = cycle < 1.5 ? cycle * 0.15 : 0;
			bubble.scale.setScalar(cycle < 1.5 ? data.size * (1 + cycle * 0.3) : 0.01);
		});
	});

	return (
		<group position={position}>
			{/* Main mud surface */}
			<mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
				<circleGeometry args={[size, 32]} />
				<meshStandardMaterial color="#3d2b1f" roughness={1} transparent opacity={0.95} />
			</mesh>

			{/* Darker center */}
			<mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
				<circleGeometry args={[size * 0.6, 24]} />
				<meshStandardMaterial color="#2a1f15" roughness={1} transparent opacity={0.7} />
			</mesh>

			{/* Mud ripples */}
			{[0.4, 0.6, 0.8].map((r, i) => (
				<mesh key={`ripple-${i}`} rotation-x={-Math.PI / 2} position={[0, 0.04 + i * 0.01, 0]}>
					<ringGeometry args={[size * r - 0.1, size * r, 24]} />
					<meshStandardMaterial color="#4a3828" roughness={1} transparent opacity={0.3} />
				</mesh>
			))}

			{/* Rising bubbles */}
			<group ref={bubblesRef}>
				{bubbleData.map((data, i) => (
					<mesh key={`bubble-${i}`} position={[data.x, 0.05, data.z]}>
						<sphereGeometry args={[data.size, 8, 8]} />
						<meshStandardMaterial color="#5d4037" roughness={0.8} transparent opacity={0.6} />
					</mesh>
				))}
			</group>

			{/* Edge debris */}
			{[...Array(6)].map((_, i) => {
				const angle = (i / 6) * Math.PI * 2;
				const dist = size * 0.85;
				return (
					<mesh
						key={`debris-${i}`}
						position={[Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist]}
						rotation={[Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3]}
					>
						<boxGeometry args={[0.3 + Math.random() * 0.2, 0.1, 0.15 + Math.random() * 0.1]} />
						<meshStandardMaterial color="#2d2015" roughness={1} />
					</mesh>
				);
			})}
		</group>
	);
}
