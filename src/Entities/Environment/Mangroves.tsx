import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Mangroves({ count = 30, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();

		const pseudoRandom = () => {
			let s = seed + 2;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = 25 + rand() * 55;
			dummy.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
			dummy.scale.set(0.8 + rand() * 0.7, 5 + rand() * 7, 0.8 + rand() * 0.7);
			dummy.rotation.set(rand() * 0.2 - 0.1, rand() * Math.PI, rand() * 0.2 - 0.1);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.4, 0.8, 1, 32]} />
			<meshStandardMaterial color="#2d3d19" roughness={1} />
		</instancedMesh>
	);
}
