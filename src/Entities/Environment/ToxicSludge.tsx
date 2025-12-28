/**
 * ToxicSludge Environmental Hazard
 * Scale-Guard industrial runoff that damages over time
 * Glowing green, bubbling, visually dangerous
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

interface ToxicSludgeProps {
	position: [number, number, number] | THREE.Vector3;
	size?: number;
}

export function ToxicSludge({ position, size = 3 }: ToxicSludgeProps) {
	const surfaceRef = useRef<THREE.Mesh>(null);
	const bubblesRef = useRef<THREE.Group>(null);
	const lightRef = useRef<THREE.PointLight>(null);

	// Generate toxic bubble data
	const bubbleData = useMemo(
		() =>
			[...Array(12)].map(() => ({
				x: (Math.random() - 0.5) * size * 0.9,
				z: (Math.random() - 0.5) * size * 0.9,
				speed: 1 + Math.random() * 2,
				phase: Math.random() * Math.PI * 2,
				maxSize: 0.1 + Math.random() * 0.15,
			})),
		[size],
	);

	useFrame((state) => {
		const t = state.clock.elapsedTime;

		// Pulsing surface
		if (surfaceRef.current) {
			const material = surfaceRef.current.material as THREE.MeshStandardMaterial;
			material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.15;
		}

		// Animate bubbles
		if (bubblesRef.current) {
			bubblesRef.current.children.forEach((bubble, i) => {
				const data = bubbleData[i];
				const cycle = (t * data.speed + data.phase) % 2.5;

				if (cycle < 2) {
					// Rising
					bubble.position.y = cycle * 0.2;
					bubble.scale.setScalar(data.maxSize * (1 + cycle * 0.5));
					(bubble as THREE.Mesh).visible = true;
				} else {
					// Popped, waiting to reset
					(bubble as THREE.Mesh).visible = false;
				}
			});
		}

		// Flickering toxic light
		if (lightRef.current) {
			lightRef.current.intensity = 1 + Math.sin(t * 5) * 0.3 + Math.sin(t * 7) * 0.2;
		}
	});

	return (
		<group position={position}>
			{/* Toxic surface - glowing green */}
			<mesh ref={surfaceRef} rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} receiveShadow>
				<circleGeometry args={[size, 32]} />
				<meshStandardMaterial
					color="#1a4a1a"
					emissive="#00ff00"
					emissiveIntensity={0.3}
					roughness={0.2}
					metalness={0.3}
					transparent
					opacity={0.9}
				/>
			</mesh>

			{/* Inner glow ring */}
			<mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
				<ringGeometry args={[size * 0.3, size * 0.7, 32]} />
				<meshBasicMaterial color="#7fff00" transparent opacity={0.2} />
			</mesh>

			{/* Toxic bubbles */}
			<group ref={bubblesRef}>
				{bubbleData.map((data, i) => (
					<mesh key={`bubble-${i}`} position={[data.x, 0.1, data.z]}>
						<sphereGeometry args={[data.maxSize, 8, 8]} />
						<meshBasicMaterial color="#7fff00" transparent opacity={0.6} />
					</mesh>
				))}
			</group>

			{/* Vapor/smoke effect */}
			<group position={[0, 0.3, 0]}>
				{[...Array(5)].map((_, i) => (
					<mesh
						key={`vapor-${i}`}
						position={[(Math.random() - 0.5) * size, i * 0.2, (Math.random() - 0.5) * size]}
					>
						<sphereGeometry args={[0.2 + i * 0.1, 8, 8]} />
						<meshBasicMaterial color="#4a7a4a" transparent opacity={0.15 - i * 0.02} />
					</mesh>
				))}
			</group>

			{/* Warning markers on edge */}
			{[0, 1, 2, 3].map((i) => {
				const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
				return (
					<group
						key={`warning-${i}`}
						position={[Math.cos(angle) * (size + 0.3), 0.1, Math.sin(angle) * (size + 0.3)]}
					>
						<mesh rotation-y={-angle}>
							<boxGeometry args={[0.3, 0.5, 0.05]} />
							<meshStandardMaterial color="#ffff00" />
						</mesh>
						{/* Skull symbol placeholder */}
						<mesh position={[0, 0, 0.03]} rotation-y={-angle}>
							<circleGeometry args={[0.1, 6]} />
							<meshBasicMaterial color="#000" />
						</mesh>
					</group>
				);
			})}

			{/* Toxic glow light */}
			<pointLight
				ref={lightRef}
				color="#7fff00"
				intensity={1}
				distance={size * 3}
				position={[0, 0.5, 0]}
			/>
		</group>
	);
}
