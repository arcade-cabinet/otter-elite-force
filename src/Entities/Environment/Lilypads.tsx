import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createSeededRandom } from "../../utils/random";

const LILYPAD_CONFIG = {
	minDistance: 10,
	maxDistance: 60,
	color: "#2a4d1a",
	minScale: 0.5,
	maxScale: 1.2,
	height: 0.15,
} as const;

const dummy = new THREE.Object3D();

export function Lilypads({ count = 20, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const rand = createSeededRandom(seed);

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist =
				LILYPAD_CONFIG.minDistance +
				rand() * (LILYPAD_CONFIG.maxDistance - LILYPAD_CONFIG.minDistance);
			dummy.position.set(Math.cos(angle) * dist, LILYPAD_CONFIG.height, Math.sin(angle) * dist);
			const size =
				LILYPAD_CONFIG.minScale + rand() * (LILYPAD_CONFIG.maxScale - LILYPAD_CONFIG.minScale);
			dummy.scale.set(size, 0.05, size);
			dummy.rotation.y = rand() * Math.PI;
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
			<cylinderGeometry args={[1, 1, 1, 12]} />
			<meshStandardMaterial color={LILYPAD_CONFIG.color} roughness={0.9} />
		</instancedMesh>
	);
}
