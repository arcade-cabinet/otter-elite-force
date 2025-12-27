/**
 * Ancestral Clam Entity
 * The "Flag" in our CTF scenario. A heavy, bioluminescent artifact.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function Clam({
	position,
	isCarried = false,
}: {
	position: THREE.Vector3;
	isCarried?: boolean;
}) {
	const groupRef = useRef<THREE.Group>(null);
	const lightRef = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		if (isCarried || !groupRef.current) return;
		const t = state.clock.elapsedTime;

		// Levitate and rotate if not carried
		groupRef.current.position.y = 0.5 + Math.sin(t * 2) * 0.1;
		groupRef.current.rotation.y = t * 0.5;

		if (lightRef.current) {
			lightRef.current.intensity = 1.5 + Math.sin(t * 4) * 0.5;
		}
	});

	return (
		<group ref={groupRef} position={position}>
			{/* Clam Shells */}
			<mesh rotation-x={Math.PI / 4}>
				<sphereGeometry args={[0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#fff" metalness={0.8} roughness={0.2} />
			</mesh>
			<mesh rotation-x={-Math.PI / 4} position={[0, -0.1, 0]}>
				<sphereGeometry args={[0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshStandardMaterial color="#fff" metalness={0.8} roughness={0.2} />
			</mesh>

			{/* Bioluminescent Pearl */}
			<mesh position={[0, 0, 0]}>
				<sphereGeometry args={[0.15, 16, 16]} />
				<meshBasicMaterial color="#00ccff" />
				<pointLight ref={lightRef} color="#00ccff" distance={5} />
			</mesh>
		</group>
	);
}

export function ExtractionPoint({ position }: { position: THREE.Vector3 }) {
	return (
		<group position={position}>
			{/* Signal Flare / Marker */}
			<mesh position={[0, 0.1, 0]}>
				<circleGeometry args={[3, 32]} />
				<meshBasicMaterial color="#ffaa00" transparent opacity={0.2} />
			</mesh>
			<mesh position={[0, 5, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 10]} />
				<meshBasicMaterial color="#ffaa00" transparent opacity={0.1} />
			</mesh>
			<pointLight position={[0, 1, 0]} color="#ffaa00" intensity={2} distance={10} />
		</group>
	);
}
