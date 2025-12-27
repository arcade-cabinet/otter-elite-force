/**
 * Ancestral Clam Entity
 * The "Flag" in our CTF scenario. A heavy, bioluminescent artifact.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

const CLAM_CONFIG = {
	levitationHeight: 0.5,
	levitationAmplitude: 0.1,
	rotationSpeed: 0.5,
	lightIntensityBase: 1.5,
	lightIntensityAmplitude: 0.5,
	color: "#fff",
	pearlColor: "#00ccff",
} as const;

export function Clam({
	position,
	isCarried = false,
}: {
	position: [number, number, number] | THREE.Vector3;
	isCarried?: boolean;
}) {
	const animationRef = useRef<THREE.Group>(null);
	const lightRef = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		if (isCarried || !animationRef.current) return;
		const t = state.clock.elapsedTime;

		// Levitate and rotate if not carried
		animationRef.current.position.y =
			CLAM_CONFIG.levitationHeight + Math.sin(t * 2) * CLAM_CONFIG.levitationAmplitude;
		animationRef.current.rotation.y = t * CLAM_CONFIG.rotationSpeed;

		if (lightRef.current) {
			lightRef.current.intensity =
				CLAM_CONFIG.lightIntensityBase + Math.sin(t * 4) * CLAM_CONFIG.lightIntensityAmplitude;
		}
	});

	return (
		<group position={position}>
			<group ref={animationRef}>
				{/* Clam Shells */}
				<mesh rotation-x={Math.PI / 4}>
					<sphereGeometry args={[0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
					<meshStandardMaterial color={CLAM_CONFIG.color} metalness={0.8} roughness={0.2} />
				</mesh>
				<mesh rotation-x={-Math.PI / 4} position={[0, -0.1, 0]}>
					<sphereGeometry args={[0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
					<meshStandardMaterial color={CLAM_CONFIG.color} metalness={0.8} roughness={0.2} />
				</mesh>

				{/* Bioluminescent Pearl */}
				<mesh position={[0, 0, 0]}>
					<sphereGeometry args={[0.15, 16, 16]} />
					<meshBasicMaterial color={CLAM_CONFIG.pearlColor} />
					<pointLight ref={lightRef} color={CLAM_CONFIG.pearlColor} distance={5} />
				</mesh>
			</group>
		</group>
	);
}

export function ExtractionPoint({
	position,
}: {
	position: [number, number, number] | THREE.Vector3;
}) {
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
