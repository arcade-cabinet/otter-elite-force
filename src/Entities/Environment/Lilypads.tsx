import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Lilypads({ count = 20, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();

		// Use deterministic seed for this chunk
		const pseudoRandom = () => {
			let s = seed;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = 10 + rand() * 50;
			dummy.position.set(Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist);
			const size = 0.5 + rand() * 0.7;
			dummy.scale.set(size, 0.05, size);
			dummy.rotation.y = rand() * Math.PI;
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
			<cylinderGeometry args={[1, 1, 1, 32]} />
			<meshStandardMaterial color="#2a4d1a" roughness={0.9} />
		</instancedMesh>
	);
}
