import type * as THREE from "three";

export function SimpleHut({ position }: { position: [number, number, number] | THREE.Vector3 }) {
	return (
		<group position={position}>
			{/* Base */}
			<mesh position={[0, 1, 0]} castShadow receiveShadow>
				<boxGeometry args={[4, 2, 4]} />
				<meshStandardMaterial color="#3d2b1f" roughness={1} />
			</mesh>
			{/* Thatched Roof */}
			<mesh position={[0, 2.5, 0]}>
				<cylinderGeometry args={[0, 3, 1.5, 4]} />
				<meshStandardMaterial color="#d4c4a8" roughness={1} />
			</mesh>
			{/* Doorway */}
			<mesh position={[0, 0.8, 2.01]}>
				<planeGeometry args={[1, 1.6]} />
				<meshBasicMaterial color="#000" />
			</mesh>
		</group>
	);
}
