import type * as THREE from "three";

export function GasStockpile({
	position,
	secured = false,
}: {
	position: [number, number, number] | THREE.Vector3;
	secured?: boolean;
}) {
	return (
		<group position={position}>
			{[
				[-0.5, 0, 0],
				[0.5, 0, 0],
				[0, 0, 0.5],
			].map((pos, i) => (
				<mesh key={`gas-${i}`} position={pos as [number, number, number]} castShadow receiveShadow>
					<cylinderGeometry args={[0.4, 0.4, 1.2, 8]} />
					<meshStandardMaterial color={secured ? "#2d3d19" : "#d32f2f"} metalness={0.5} />
				</mesh>
			))}
			<mesh position={[0, -0.5, 0]} receiveShadow>
				<boxGeometry args={[2, 0.2, 2]} />
				<meshStandardMaterial color="#3d2b1f" />
			</mesh>
		</group>
	);
}
