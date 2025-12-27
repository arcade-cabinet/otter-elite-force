import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSeededRandom } from "../../utils/random";

const DEBRIS_CONFIG = {
	minDistance: 10,
	maxDistance: 70,
	minScale: 0.5,
	maxScale: 2.0,
	height: 0.2,
} as const;

const dummy = new THREE.Object3D();

export function Debris({ count = 10, color = "#444", seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const rand = createSeededRandom(seed, 5);

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = DEBRIS_CONFIG.minDistance + rand() * (DEBRIS_CONFIG.maxDistance - DEBRIS_CONFIG.minDistance);
			dummy.position.set(Math.cos(angle) * dist, DEBRIS_CONFIG.height, Math.sin(angle) * dist);
			dummy.scale.set(
				DEBRIS_CONFIG.minScale + rand() * 1.5,
				DEBRIS_CONFIG.minScale + rand() * 0.5,
				DEBRIS_CONFIG.minScale + rand() * 1.5
			);
			dummy.rotation.set(rand() * 0.2, rand() * Math.PI, rand() * 0.2);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
		</instancedMesh>
	);
}
