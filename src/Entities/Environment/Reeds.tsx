import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Reeds({ count = 40, seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();

		const pseudoRandom = () => {
			let s = seed + 1; // Different seed than lilypads
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = 20 + rand() * 60;
			dummy.position.set(Math.cos(angle) * dist, 0.5, Math.sin(angle) * dist);
			dummy.scale.set(0.2, 1 + rand() * 2, 0.2);
			dummy.rotation.y = rand() * Math.PI;
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}, [count, seed]);

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
			<cylinderGeometry args={[0.5, 0.5, 1, 8]} />
			<meshStandardMaterial color="#4d7a2b" roughness={0.9} />
		</instancedMesh>
	);
}
