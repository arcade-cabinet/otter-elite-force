/**
 * Platform Entity
 * Elevated wooden platform for tactical positioning
 * Authentic Vietnam-era stilted construction
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

interface PlatformProps {
	position: [number, number, number] | THREE.Vector3;
	width?: number;
	depth?: number;
	height?: number;
}

export function Platform({ position, width = 5, depth = 5, height = 2 }: PlatformProps) {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!groupRef.current) return;
		// Subtle sway in wind
		const t = state.clock.elapsedTime;
		groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.003;
		groupRef.current.rotation.z = Math.cos(t * 0.7) * 0.003;
	});

	const plankColor = "#5d4037";
	const stiltColor = "#3d2a1f";
	const ropeColor = "#8b7355";

	return (
		<group ref={groupRef} position={position}>
			{/* Main deck - individual planks */}
			<group position={[0, height, 0]}>
				{[...Array(Math.ceil(width / 0.4))].map((_, i) => (
					<mesh
						key={`plank-${i}`}
						position={[-width / 2 + i * 0.4 + 0.2, 0, 0]}
						castShadow
						receiveShadow
					>
						<boxGeometry args={[0.35, 0.08, depth]} />
						<meshStandardMaterial
							color={plankColor}
							roughness={0.95}
							// Alternate slightly darker planks
							// for visual variety
						/>
					</mesh>
				))}

				{/* Support beams underneath */}
				{[-depth / 3, 0, depth / 3].map((z, i) => (
					<mesh key={`beam-${i}`} position={[0, -0.1, z]} castShadow>
						<boxGeometry args={[width, 0.12, 0.2]} />
						<meshStandardMaterial color={stiltColor} roughness={1} />
					</mesh>
				))}
			</group>

			{/* Corner stilts */}
			{[
				[-width / 2 + 0.2, -depth / 2 + 0.2],
				[width / 2 - 0.2, -depth / 2 + 0.2],
				[-width / 2 + 0.2, depth / 2 - 0.2],
				[width / 2 - 0.2, depth / 2 - 0.2],
			].map(([x, z], i) => (
				<group key={`stilt-${i}`} position={[x, height / 2, z]}>
					{/* Main stilt */}
					<mesh castShadow>
						<cylinderGeometry args={[0.12, 0.15, height, 8]} />
						<meshStandardMaterial color={stiltColor} roughness={1} />
					</mesh>
					{/* Cross bracing */}
					{i < 2 && (
						<mesh position={[0, 0, depth / 2 - 0.2]} rotation-x={Math.PI / 6}>
							<cylinderGeometry args={[0.04, 0.04, height * 0.7, 6]} />
							<meshStandardMaterial color={stiltColor} roughness={1} />
						</mesh>
					)}
				</group>
			))}

			{/* Rope bindings at top of stilts */}
			{[
				[-width / 2 + 0.2, -depth / 2 + 0.2],
				[width / 2 - 0.2, -depth / 2 + 0.2],
				[-width / 2 + 0.2, depth / 2 - 0.2],
				[width / 2 - 0.2, depth / 2 - 0.2],
			].map(([x, z], i) => (
				<mesh key={`rope-${i}`} position={[x, height - 0.1, z]} rotation-x={Math.PI / 2}>
					<torusGeometry args={[0.14, 0.025, 6, 12]} />
					<meshStandardMaterial color={ropeColor} roughness={1} />
				</mesh>
			))}

			{/* Ladder */}
			<group position={[width / 2 + 0.15, height / 2, 0]} rotation-z={0.15}>
				{/* Rails */}
				{[-0.15, 0.15].map((x, i) => (
					<mesh key={`rail-${i}`} position={[x, 0, 0]}>
						<boxGeometry args={[0.06, height + 0.5, 0.06]} />
						<meshStandardMaterial color={stiltColor} roughness={1} />
					</mesh>
				))}
				{/* Rungs */}
				{[...Array(Math.ceil(height / 0.4))].map((_, i) => (
					<mesh key={`rung-${i}`} position={[0, -height / 2 + 0.3 + i * 0.4, 0]}>
						<boxGeometry args={[0.3, 0.05, 0.05]} />
						<meshStandardMaterial color={plankColor} roughness={1} />
					</mesh>
				))}
			</group>

			{/* Railing on one side */}
			<group position={[0, height + 0.5, -depth / 2 + 0.1]}>
				{/* Posts */}
				{[-width / 2 + 0.3, 0, width / 2 - 0.3].map((x, i) => (
					<mesh key={`post-${i}`} position={[x, 0, 0]}>
						<boxGeometry args={[0.08, 0.6, 0.08]} />
						<meshStandardMaterial color={stiltColor} roughness={1} />
					</mesh>
				))}
				{/* Top rail */}
				<mesh position={[0, 0.25, 0]}>
					<boxGeometry args={[width - 0.3, 0.06, 0.06]} />
					<meshStandardMaterial color={plankColor} roughness={1} />
				</mesh>
			</group>
		</group>
	);
}
