import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

export function Siphon({ position }: { position: THREE.Vector3 }) {
	const smokeRef = useRef<THREE.Group>(null);

	useFrame((_state) => {
		if (smokeRef.current) {
			smokeRef.current.children.forEach((child) => {
				child.position.y += 0.05;
				child.scale.setScalar(child.scale.x + 0.01);
				if (child.position.y > 5) {
					child.position.y = 0;
					child.scale.setScalar(0.2);
				}
			});
		}
	});

	return (
		<group position={position}>
			{/* Main Siphon Structure */}
			<mesh castShadow receiveShadow>
				<cylinderGeometry args={[1.5, 2, 4, 8]} />
				<meshStandardMaterial color="#111" metalness={0.8} />
			</mesh>
			{/* Pumping Pipes */}
			{[0, 1, 2].map((i) => (
				<mesh key={i} rotation-y={(i * Math.PI * 2) / 3} position={[0, -1, 0]}>
					<cylinderGeometry args={[0.3, 0.3, 5]} rotation-z={Math.PI / 2.5} />
					<meshStandardMaterial color="#222" />
				</mesh>
			))}
			{/* Dirty Smoke Effect */}
			<group ref={smokeRef} position={[0, 2, 0]}>
				{[...Array(5)].map((_, i) => (
					<mesh key={i} position={[0, i * 1, 0]}>
						<sphereGeometry args={[0.5, 8, 8]} />
						<meshBasicMaterial color="#333" transparent opacity={0.4} />
					</mesh>
				))}
			</group>
			{/* Objective Light */}
			<pointLight color="#ff0000" intensity={2} distance={10} />
		</group>
	);
}
