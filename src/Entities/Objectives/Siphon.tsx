import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface SiphonProps {
	position: THREE.Vector3;
	secured?: boolean;
}

/**
 * Siphon - Scale-Guard Militia oil extraction point
 * When active: Pumps pollutants into the river, emits smoke, red warning light
 * When secured: Destroyed/disabled, no smoke, green "cleared" light
 */
export function Siphon({ position, secured = false }: SiphonProps) {
	const smokeRef = useRef<THREE.Group>(null);
	const structureRef = useRef<THREE.Mesh>(null);

	useFrame((_state, delta) => {
		// Only animate smoke when siphon is active (not secured)
		if (!secured && smokeRef.current) {
			smokeRef.current.children.forEach((child) => {
				child.position.y += 0.05;
				child.scale.setScalar(child.scale.x + 0.01);
				if (child.position.y > 5) {
					child.position.y = 0;
					child.scale.setScalar(0.2);
				}
			});
		}

		// Secured siphons slowly sink/tilt to show destruction
		if (secured && structureRef.current) {
			structureRef.current.rotation.z = THREE.MathUtils.lerp(
				structureRef.current.rotation.z,
				0.3,
				delta * 0.5
			);
			structureRef.current.position.y = THREE.MathUtils.lerp(
				structureRef.current.position.y,
				-1,
				delta * 0.5
			);
		}
	});

	return (
		<group position={position}>
			{/* Main Siphon Structure */}
			<mesh ref={structureRef} castShadow receiveShadow>
				<cylinderGeometry args={[1.5, 2, 4, 8]} />
				<meshStandardMaterial 
					color={secured ? "#1a1a1a" : "#111"} 
					metalness={0.8}
					roughness={secured ? 0.9 : 0.3}
				/>
			</mesh>

			{/* Pumping Pipes */}
			{[0, 1, 2].map((i) => (
				<mesh key={`pipe-${i}`} rotation-y={(i * Math.PI * 2) / 3} position={[0, -1, 0]}>
					<cylinderGeometry args={[0.3, 0.3, 5]} />
					<meshStandardMaterial color={secured ? "#333" : "#222"} />
				</mesh>
			))}

			{/* Dirty Smoke Effect - only when active */}
			{!secured && (
				<group ref={smokeRef} position={[0, 2, 0]}>
					{[...Array(5)].map((_, i) => (
						<mesh key={`smoke-${i}`} position={[0, i * 1, 0]} scale={0.2}>
							<sphereGeometry args={[0.5, 8, 8]} />
							<meshBasicMaterial color="#333" transparent opacity={0.4} />
						</mesh>
					))}
				</group>
			)}

			{/* Secured: Show wreckage debris */}
			{secured && (
				<group position={[0, 0.5, 0]}>
					{[...Array(4)].map((_, i) => (
						<mesh 
							key={`debris-${i}`} 
							position={[
								Math.cos(i * 1.5) * 2,
								Math.random() * 0.5,
								Math.sin(i * 1.5) * 2
							]}
							rotation={[Math.random(), Math.random(), Math.random()]}
						>
							<boxGeometry args={[0.4, 0.2, 0.3]} />
							<meshStandardMaterial color="#222" />
						</mesh>
					))}
				</group>
			)}

			{/* Status Light: Red = active threat, Green = secured */}
			<pointLight 
				color={secured ? "#00ff00" : "#ff0000"} 
				intensity={secured ? 0.5 : 2} 
				distance={secured ? 5 : 10} 
			/>
		</group>
	);
}
