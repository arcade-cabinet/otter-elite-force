import type * as THREE from "three";

export function PrisonCage({
	position,
	rescued = false,
}: {
	position: [number, number, number] | THREE.Vector3;
	rescued?: boolean;
}) {
	return (
		<group position={position}>
			{!rescued && (
				<mesh castShadow>
					<boxGeometry args={[2, 3, 2]} />
					<meshStandardMaterial color="#222" wireframe />
				</mesh>
			)}
			<mesh position={[0, -0.1, 0]} receiveShadow>
				<boxGeometry args={[2.5, 0.2, 2.5]} />
				<meshStandardMaterial color="#111" />
			</mesh>
		</group>
	);
}
