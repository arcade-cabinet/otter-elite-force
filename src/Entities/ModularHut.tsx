/**
 * Modular Building System
 * Algorithmic construction of river dwellings using floors, walls, and roofs.
 */

import * as THREE from "three";
import { useMemo } from "react";

interface HutProps {
	position: THREE.Vector3;
	seed: number;
	isHealerHut?: boolean;
}

export function ModularHut({ position, seed, isHealerHut = false }: HutProps) {
	const components = useMemo(() => {
		const pseudoRandom = () => {
			let s = seed;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		const width = 3 + Math.floor(rand() * 2);
		const depth = 3 + Math.floor(rand() * 2);
		const hasPorch = rand() > 0.5;
		
		return { width, depth, hasPorch };
	}, [seed]);

	const { width, depth, hasPorch } = components;
	const wallColor = isHealerHut ? "#4d4d4d" : "#3d2b1f";
	const roofColor = isHealerHut ? "#8d6e63" : "#d4c4a8";

	return (
		<group position={position}>
			{/* Stilt Foundation (Elevated above mud) */}
			{[[-width/2, -depth/2], [width/2, -depth/2], [-width/2, depth/2], [width/2, depth/2]].map((p, i) => (
				<mesh key={i} position={[p[0], 0, p[1]]}>
					<cylinderGeometry args={[0.1, 0.1, 2]} />
					<meshStandardMaterial color="#2d1f15" />
				</mesh>
			))}

			{/* Floor Platform */}
			<mesh position={[0, 1, 0]} receiveShadow>
				<boxGeometry args={[width + (hasPorch ? 2 : 0), 0.2, depth]} />
				<meshStandardMaterial color="#3d2b1f" roughness={1} />
			</mesh>

			{/* Walls */}
			<group position={[0, 2, 0]}>
				{/* Back Wall */}
				<mesh position={[0, 0, -depth/2]}>
					<boxGeometry args={[width, 2, 0.1]} />
					<meshStandardMaterial color={wallColor} />
				</mesh>
				{/* Side Walls */}
				<mesh position={[-width/2, 0, 0]} rotation-y={Math.PI/2}>
					<boxGeometry args={[depth, 2, 0.1]} />
					<meshStandardMaterial color={wallColor} />
				</mesh>
				<mesh position={[width/2, 0, 0]} rotation-y={Math.PI/2}>
					<boxGeometry args={[depth, 2, 0.1]} />
					<meshStandardMaterial color={wallColor} />
				</mesh>
				{/* Front Wall (with door) */}
				<group position={[0, 0, depth/2]}>
					<mesh position={[-width/4 - 0.5, 0, 0]}>
						<boxGeometry args={[width/2 - 1, 2, 0.1]} />
						<meshStandardMaterial color={wallColor} />
					</mesh>
					<mesh position={[width/4 + 0.5, 0, 0]}>
						<boxGeometry args={[width/2 - 1, 2, 0.1]} />
						<meshStandardMaterial color={wallColor} />
					</mesh>
					<mesh position={[0, 0.7, 0]}>
						<boxGeometry args={[1, 0.6, 0.1]} />
						<meshStandardMaterial color={wallColor} />
					</mesh>
				</group>
			</group>

			{/* Roof (A-Frame) */}
			<mesh position={[0, 3.5, 0]} rotation-y={Math.PI/2}>
				<cylinderGeometry args={[0, (width + 1) / 1.4, 2, 4]} scale={[1, 1, depth / width]} />
				<meshStandardMaterial color={roofColor} roughness={1} />
			</mesh>

			{/* Healer Signifier */}
			{isHealerHut && (
				<mesh position={[0, 4.5, 0]}>
					<boxGeometry args={[0.2, 1, 0.2]} />
					<meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
					<pointLight color="#ff0000" intensity={1} distance={5} />
				</mesh>
			)}
		</group>
	);
}
