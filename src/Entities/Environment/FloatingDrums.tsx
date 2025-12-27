import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSeededRandom } from "../../utils/random";

const DRUM_CONFIG = {
	minDistance: 15,
	maxDistance: 60,
	color: "#555",
	scale: [0.6, 0.9, 0.6],
	height: 0.1,
} as const;

const dummy = new THREE.Object3D();

export function FloatingDrums({ count = 10, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const rand = createSeededRandom(seed, 4);

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = DRUM_CONFIG.minDistance + rand() * (DRUM_CONFIG.maxDistance - DRUM_CONFIG.minDistance);
			dummy.position.set(Math.cos(angle) * dist, DRUM_CONFIG.height, Math.sin(angle) * dist);
			dummy.scale.set(DRUM_CONFIG.scale[0], DRUM_CONFIG.scale[1], DRUM_CONFIG.scale[2]);
			dummy.rotation.set(Math.PI / 2, 0, rand() * Math.PI);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 12]} />
			<meshStandardMaterial color={DRUM_CONFIG.color} metalness={0.7} roughness={0.3} />
		</instancedMesh>
	);
}
