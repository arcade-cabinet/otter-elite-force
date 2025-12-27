import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

const SIPHON_CONFIG = {
	smokeSpeed: 0.05,
	smokeGrowth: 0.01,
	smokeMaxHeight: 5,
	smokeInitialScale: 0.2,
	baseColor: "#111",
	securedColor: "#2d3d19",
	pipeColor: "#222",
	securedPipeColor: "#334422",
} as const;

export function Siphon({
	position,
	secured = false,
}: {
	position: [number, number, number] | THREE.Vector3;
	secured?: boolean;
}) {
	const smokeRef = useRef<THREE.Group>(null);

	useFrame((_state) => {
		if (smokeRef.current && !secured) {
			const children = smokeRef.current.children;
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				child.position.y += SIPHON_CONFIG.smokeSpeed;
				const newScale = child.scale.x + SIPHON_CONFIG.smokeGrowth;
				child.scale.set(newScale, newScale, newScale);
				if (child.position.y > SIPHON_CONFIG.smokeMaxHeight) {
					child.position.y = 0;
					child.scale.setScalar(SIPHON_CONFIG.smokeInitialScale);
				}
			}
		}
	});

	return (
		<group position={position}>
			{/* Main Siphon Structure */}
			<mesh castShadow receiveShadow>
				<cylinderGeometry args={[1.5, 2, 4, 8]} />
				<meshStandardMaterial color={secured ? SIPHON_CONFIG.securedColor : SIPHON_CONFIG.baseColor} metalness={0.8} />
			</mesh>
			{/* Pumping Pipes */}
			{[0, 1, 2].map((i) => (
				<mesh key={`pipe-${i}`} rotation-y={(i * Math.PI * 2) / 3} position={[0, -1, 0]}>
					<mesh rotation-z={Math.PI / 2.5}>
						<cylinderGeometry args={[0.3, 0.3, 5]} />
						<meshStandardMaterial color={secured ? SIPHON_CONFIG.securedPipeColor : SIPHON_CONFIG.pipeColor} />
					</mesh>
				</mesh>
			))}
			{/* Dirty Smoke Effect */}
			{!secured && (
				<group ref={smokeRef} position={[0, 2, 0]}>
					{[...Array(5)].map((_, i) => (
						<mesh key={`smoke-${i}`} position={[0, i * 1, 0]} scale={SIPHON_CONFIG.smokeInitialScale}>
							<sphereGeometry args={[0.5, 8, 8]} />
							<meshBasicMaterial color="#333" transparent opacity={0.4} />
						</mesh>
					))}
				</group>
			)}
			{/* Objective Light */}
			<pointLight color={secured ? "#00ff00" : "#ff0000"} intensity={2} distance={10} />
		</group>
	);
}
