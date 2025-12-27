/**
 * ExtractionPoint Entity
 * Landing zone / extraction area for completing missions
 * Helicopter landing pad aesthetic with beacon lights
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface ExtractionPointProps {
	position: [number, number, number] | THREE.Vector3;
	isActive?: boolean;
	isSecured?: boolean;
}

export function ExtractionPoint({
	position,
	isActive = true,
	isSecured = false,
}: ExtractionPointProps) {
	const ringsRef = useRef<THREE.Group>(null);
	const beaconRef = useRef<THREE.PointLight>(null);
	const smokeRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		const t = state.clock.elapsedTime;

		// Rotating beacon rings
		if (ringsRef.current) {
			ringsRef.current.rotation.y = t * 0.5;
		}

		// Pulsing beacon light
		if (beaconRef.current && isActive) {
			beaconRef.current.intensity = 2 + Math.sin(t * 3) * 1;
		}

		// Rising smoke for visual reference
		if (smokeRef.current) {
			smokeRef.current.children.forEach((smoke, i) => {
				const y = ((t * 0.5 + i * 0.3) % 3) * 2;
				smoke.position.y = y;
				smoke.scale.setScalar(0.5 + y * 0.3);
				(smoke as THREE.Mesh).material = new THREE.MeshBasicMaterial({
					color: isSecured ? "#aaffaa" : "#ffaa00",
					transparent: true,
					opacity: Math.max(0, 0.3 - y * 0.1),
				});
			});
		}
	});

	const padColor = isSecured ? "#2a4a2a" : "#2a3a2a";
	const markerColor = isSecured ? "#00ff00" : "#ffaa00";
	const beaconColor = isSecured ? "#00ff00" : "#ffaa00";

	return (
		<group position={position}>
			{/* Landing pad base */}
			<mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} receiveShadow>
				<circleGeometry args={[6, 32]} />
				<meshStandardMaterial color={padColor} roughness={0.8} />
			</mesh>

			{/* Outer ring marking */}
			<mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
				<ringGeometry args={[5, 5.5, 32]} />
				<meshBasicMaterial color={markerColor} />
			</mesh>

			{/* Inner H marking for helicopter */}
			<group position={[0, 0.07, 0]} rotation-x={-Math.PI / 2}>
				{/* H vertical bars */}
				{[-1.5, 1.5].map((x, i) => (
					<mesh key={`h-vert-${i}`} position={[x, 0, 0]}>
						<planeGeometry args={[0.5, 4]} />
						<meshBasicMaterial color={markerColor} side={THREE.DoubleSide} />
					</mesh>
				))}
				{/* H horizontal bar */}
				<mesh>
					<planeGeometry args={[3.5, 0.5]} />
					<meshBasicMaterial color={markerColor} side={THREE.DoubleSide} />
				</mesh>
			</group>

			{/* Corner markers */}
			{[0, 1, 2, 3].map((i) => {
				const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
				const dist = 5.2;
				return (
					<group
						key={`corner-${i}`}
						position={[Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist]}
					>
						{/* Corner post */}
						<mesh castShadow>
							<cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
							<meshStandardMaterial color="#333" metalness={0.5} />
						</mesh>
						{/* Corner light */}
						<mesh position={[0, 0.5, 0]}>
							<sphereGeometry args={[0.12, 8, 8]} />
							<meshBasicMaterial color={markerColor} />
						</mesh>
						<pointLight color={markerColor} intensity={0.5} distance={3} position={[0, 0.5, 0]} />
					</group>
				);
			})}

			{/* Rotating beacon rings */}
			{isActive && (
				<group ref={ringsRef} position={[0, 0.5, 0]}>
					{[0, 1, 2].map((i) => (
						<mesh key={`ring-${i}`} rotation-x={-Math.PI / 2} position={[0, i * 0.3, 0]}>
							<torusGeometry args={[4 - i * 0.5, 0.05, 8, 32]} />
							<meshBasicMaterial color={beaconColor} transparent opacity={0.5 - i * 0.15} />
						</mesh>
					))}
				</group>
			)}

			{/* Central beacon light */}
			<group position={[0, 0.1, 0]}>
				<mesh>
					<cylinderGeometry args={[0.3, 0.4, 0.3, 12]} />
					<meshStandardMaterial color="#222" metalness={0.7} />
				</mesh>
				<mesh position={[0, 0.3, 0]}>
					<sphereGeometry args={[0.25, 12, 12]} />
					<meshBasicMaterial color={beaconColor} transparent opacity={0.8} />
				</mesh>
				<pointLight
					ref={beaconRef}
					color={beaconColor}
					intensity={2}
					distance={20}
					position={[0, 1, 0]}
				/>
			</group>

			{/* Smoke signal */}
			<group ref={smokeRef} position={[3, 0, 0]}>
				{[...Array(5)].map((_, i) => (
					<mesh key={`smoke-${i}`}>
						<sphereGeometry args={[0.5, 8, 8]} />
						<meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
					</mesh>
				))}
			</group>

			{/* Status text prompt area (visual indicator) */}
			{isSecured && (
				<group position={[0, 3, 0]}>
					<mesh>
						<planeGeometry args={[3, 0.6]} />
						<meshBasicMaterial color="#000" transparent opacity={0.7} side={THREE.DoubleSide} />
					</mesh>
				</group>
			)}
		</group>
	);
}
