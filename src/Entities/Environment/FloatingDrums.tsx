import { useEffect, useRef } from "react";
import * as THREE from "three";

export function FloatingDrums({ count = 10, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();

		const pseudoRandom = () => {
			let s = seed + 4;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = 15 + rand() * 45;
			dummy.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
			dummy.scale.set(0.6, 0.9, 0.6);
			dummy.rotation.set(Math.PI / 2, 0, rand() * Math.PI);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 12]} />
			<meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
		</instancedMesh>
	);
}
