import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSeededRandom } from "../../utils/random";

const MANGROVE_CONFIG = {
	minDistance: 25,
	maxDistance: 80,
	color: "#2d3d19",
	minScale: 0.8,
	maxScale: 1.5,
	minHeight: 5,
	maxHeight: 12,
} as const;

const dummy = new THREE.Object3D();

export function Mangroves({ count = 30, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const rand = createSeededRandom(seed, 2);

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = MANGROVE_CONFIG.minDistance + rand() * (MANGROVE_CONFIG.maxDistance - MANGROVE_CONFIG.minDistance);
			dummy.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
			dummy.scale.set(
				MANGROVE_CONFIG.minScale + rand() * (MANGROVE_CONFIG.maxScale - MANGROVE_CONFIG.minScale),
				MANGROVE_CONFIG.minHeight + rand() * (MANGROVE_CONFIG.maxHeight - MANGROVE_CONFIG.minHeight),
				MANGROVE_CONFIG.minScale + rand() * (MANGROVE_CONFIG.maxScale - MANGROVE_CONFIG.minScale)
			);
			dummy.rotation.set(rand() * 0.2 - 0.1, rand() * Math.PI, rand() * 0.2 - 0.1);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.4, 0.8, 1, 8]} />
			<meshStandardMaterial color={MANGROVE_CONFIG.color} roughness={1} />
		</instancedMesh>
	);
}
