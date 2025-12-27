import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Debris({ count = 10, color = "#444", seed = 0 }) {
	const meshRef = useRef<THREE.InstancedMesh>(null);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		const dummy = new THREE.Object3D();

		const pseudoRandom = () => {
			let s = seed + 5;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		for (let i = 0; i < count; i++) {
			const angle = rand() * Math.PI * 2;
			const dist = 10 + rand() * 60;
			dummy.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);
			dummy.scale.set(0.5 + rand() * 1.5, 0.5 + rand() * 0.5, 0.5 + rand() * 1.5);
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
