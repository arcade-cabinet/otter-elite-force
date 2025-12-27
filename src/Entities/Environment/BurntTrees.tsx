import { useEffect, useRef } from "react";
import * as THREE from "three";

export function BurntTrees({ count = 15, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();

		const pseudoRandom = () => {
			let s = seed + 3;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = 30 + rand() * 60;
			dummy.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
			dummy.scale.set(0.5 + rand() * 0.5, 4 + rand() * 6, 0.5 + rand() * 0.5);
			dummy.rotation.set(rand() * 0.2, rand() * Math.PI, rand() * 0.2);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.3, 0.5, 1, 6]} />
			<meshStandardMaterial color="#1a1a1a" roughness={1} />
		</instancedMesh>
	);
}
