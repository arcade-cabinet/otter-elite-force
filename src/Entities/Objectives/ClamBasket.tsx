import type * as THREE from "three";

export function ClamBasket({
	position,
	isTrap = false,
}: {
	position: [number, number, number] | THREE.Vector3;
	isTrap?: boolean;
}) {
	return (
		<group position={position}>
			<mesh castShadow receiveShadow>
				<cylinderGeometry args={[0.6, 0.5, 0.5, 8]} />
				<meshStandardMaterial color="#5d4037" />
			</mesh>
			{isTrap && <pointLight color="#ff0000" intensity={0.2} distance={2} />}
		</group>
	);
}
