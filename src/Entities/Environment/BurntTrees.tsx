import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSeededRandom } from "../../utils/random";

const TREE_CONFIG = {
	minDistance: 30,
	maxDistance: 90,
	color: "#1a1a1a",
	minScale: 0.5,
	maxScale: 1.0,
	minHeight: 4,
	maxHeight: 10,
} as const;

const dummy = new THREE.Object3D();

export function BurntTrees({ count = 15, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const rand = createSeededRandom(seed, 3);

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = TREE_CONFIG.minDistance + rand() * (TREE_CONFIG.maxDistance - TREE_CONFIG.minDistance);
			dummy.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
			dummy.scale.set(
				TREE_CONFIG.minScale + rand() * (TREE_CONFIG.maxScale - TREE_CONFIG.minScale),
				TREE_CONFIG.minHeight + rand() * (TREE_CONFIG.maxHeight - TREE_CONFIG.minHeight),
				TREE_CONFIG.minScale + rand() * (TREE_CONFIG.maxScale - TREE_CONFIG.minScale)
			);
			dummy.rotation.set(rand() * 0.2, rand() * Math.PI, rand() * 0.2);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.3, 0.5, 1, 6]} />
			<meshStandardMaterial color={TREE_CONFIG.color} roughness={1} />
		</instancedMesh>
	);
}
