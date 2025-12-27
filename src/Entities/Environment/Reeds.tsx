import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSeededRandom } from "../../utils/random";

const REED_CONFIG = {
	minDistance: 20,
	maxDistance: 80,
	color: "#4d7a2b",
	baseScale: 0.2,
	heightVariation: [1, 3],
	height: 0.5,
} as const;

const dummy = new THREE.Object3D();

export function Reeds({ count = 40, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const rand = createSeededRandom(seed, 1);

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = REED_CONFIG.minDistance + rand() * (REED_CONFIG.maxDistance - REED_CONFIG.minDistance);
			dummy.position.set(Math.cos(angle) * dist, REED_CONFIG.height, Math.sin(angle) * dist);
			dummy.scale.set(REED_CONFIG.baseScale, REED_CONFIG.heightVariation[0] + rand() * (REED_CONFIG.heightVariation[1] - REED_CONFIG.heightVariation[0]), REED_CONFIG.baseScale);
			dummy.rotation.y = rand() * Math.PI;
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 8]} />
			<meshStandardMaterial color={REED_CONFIG.color} roughness={0.9} />
		</instancedMesh>
	);
}
