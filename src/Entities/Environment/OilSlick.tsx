import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

interface OilSlickProps {
	position: [number, number, number] | THREE.Vector3;
	size?: number;
	isIgnited?: boolean;
	onIgnite?: () => void;
}

/**
 * OilSlick - Environmental hazard that can be ignited
 * When shot, ignites and deals area damage
 */
export function OilSlick({ position, size = 3, isIgnited = false, onIgnite }: OilSlickProps) {
	const [isLit, setIsLit] = useState(isIgnited);
	const fireRef = useRef<THREE.Group>(null);
	const lightRef = useRef<THREE.PointLight>(null);
	const burnTimeRef = useRef(0);

	// Sync with external ignition state
	useEffect(() => {
		if (isIgnited && !isLit) {
			setIsLit(true);
		}
	}, [isIgnited, isLit]);

	// Handle player/projectile ignition
	const handlePointerDown = () => {
		if (!isLit) {
			setIsLit(true);
			onIgnite?.();
		}
	};

	useFrame((state) => {
		const t = state.clock.elapsedTime;

		if (isLit && fireRef.current) {
			// Animate fire particles
			fireRef.current.children.forEach((child, i) => {
				const offset = i * 0.5;
				child.position.y = 0.2 + Math.sin(t * 4 + offset) * 0.1;
				child.scale.setScalar(0.8 + Math.sin(t * 8 + offset) * 0.2);
			});

			if (lightRef.current) {
				lightRef.current.intensity = 2 + Math.sin(t * 10) * 0.5;
			}
		}
	});

	return (
		<group position={position} onPointerDown={handlePointerDown}>
			{/* The Slick */}
			<mesh rotation-x={-Math.PI / 2} receiveShadow>
				<circleGeometry args={[size, 16]} />
				<meshStandardMaterial
					color={isLit ? "#222" : "#111"}
					roughness={0.1}
					metalness={0.8}
					transparent
					opacity={0.8}
				/>
			</mesh>

			{/* Fire Visual Effect */}
			{isLit && (
				<group position={[0, 0.5, 0]}>
					<group ref={fireRef}>
						{[...Array(4)].map((_, i) => (
							<mesh key={i} position={[Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5]}>
								<sphereGeometry args={[0.4, 8, 8]} />
								<meshBasicMaterial color="#ff4400" transparent opacity={0.6} />
							</mesh>
						))}
					</group>
					<pointLight ref={lightRef} color="#ffaa00" intensity={2} distance={10} />
				</group>
			)}
		</group>
	);
}
