/**
 * Weapon Component
 * Procedural weapons that can be mounted on characters
 * Each weapon has distinct silhouette and tactical aesthetic
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { WEAPONS } from "../stores/gameStore";

interface WeaponProps {
	weaponId: string;
	level?: number;
	muzzleRef?: React.RefObject<THREE.Group>;
	isFiring?: boolean;
}

export function Weapon({ weaponId, muzzleRef, isFiring = false }: WeaponProps) {
	const weapon = useMemo(() => WEAPONS[weaponId] || WEAPONS["service-pistol"], [weaponId]);
	const flashRef = useRef<THREE.Mesh>(null);
	const flashIntensity = useRef(0);

	// Muzzle flash animation
	useFrame((_, delta) => {
		if (isFiring) {
			flashIntensity.current = 1;
		} else {
			flashIntensity.current = Math.max(0, flashIntensity.current - delta * 15);
		}
		if (flashRef.current) {
			flashRef.current.scale.setScalar(flashIntensity.current * 0.3);
			(flashRef.current.material as THREE.MeshBasicMaterial).opacity = flashIntensity.current;
		}
	});

	return (
		<group>
			{weapon.visualType === "PISTOL_GRIP" && (
				<group position={[0, -0.1, 0.2]}>
					{/* Body */}
					<mesh castShadow>
						<boxGeometry args={[0.15, 0.25, 0.5]} />
						<meshStandardMaterial color="#222" metalness={0.8} />
					</mesh>
					{/* Barrel */}
					<mesh position={[0, 0.08, 0.3]} rotation-x={Math.PI / 2}>
						<cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
						<meshStandardMaterial color="#111" metalness={0.9} />
					</mesh>
					<group ref={muzzleRef} position={[0, 0.08, 0.5]} />
				</group>
			)}

			{weapon.visualType === "FISH_CANNON" && (
				<group position={[0, -0.2, 0.8]} rotation-x={0.1}>
					{/* Main Barrel */}
					<mesh castShadow rotation-x={Math.PI / 2}>
						<cylinderGeometry args={[0.15, 0.18, 1.2, 12]} />
						<meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
					</mesh>
					{/* Stock/Handle */}
					<mesh position={[0, -0.15, -0.4]}>
						<boxGeometry args={[0.1, 0.3, 0.4]} />
						<meshStandardMaterial color="#332211" />
					</mesh>
					<group ref={muzzleRef} position={[0, 0, 0.6]} />
				</group>
			)}

			{weapon.visualType === "BUBBLE_GUN" && (
				<group position={[0, -0.2, 0.7]}>
					<mesh castShadow>
						<sphereGeometry args={[0.25, 12, 12]} />
						<meshStandardMaterial color="#00ccff" transparent opacity={0.6} />
					</mesh>
					<mesh position={[0, 0, 0.3]} rotation-x={Math.PI / 2}>
						<cylinderGeometry args={[0.05, 0.1, 0.4]} />
						<meshStandardMaterial color="#eee" />
					</mesh>
					<group ref={muzzleRef} position={[0, 0, 0.5]} />
				</group>
			)}

			{/* Scatter Shell - Double barrel shotgun */}
			{weapon.visualType === "SHOTGUN" && (
				<group position={[0, -0.15, 0.5]} rotation-x={0.05}>
					{/* Double barrels */}
					{[-0.05, 0.05].map((x, i) => (
						<mesh key={`barrel-${i}`} position={[x, 0.05, 0]} rotation-x={Math.PI / 2} castShadow>
							<cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
							<meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
						</mesh>
					))}
					{/* Receiver */}
					<mesh position={[0, 0, -0.35]} castShadow>
						<boxGeometry args={[0.18, 0.15, 0.4]} />
						<meshStandardMaterial color="#222" metalness={0.8} />
					</mesh>
					{/* Stock */}
					<mesh position={[0, -0.08, -0.6]} rotation-x={0.1}>
						<boxGeometry args={[0.1, 0.2, 0.4]} />
						<meshStandardMaterial color="#4a3520" roughness={0.9} />
					</mesh>
					{/* Foregrip */}
					<mesh position={[0, -0.08, 0.1]}>
						<boxGeometry args={[0.12, 0.1, 0.25]} />
						<meshStandardMaterial color="#4a3520" roughness={0.9} />
					</mesh>
					<group ref={muzzleRef} position={[0, 0.05, 0.45]} />
				</group>
			)}

			{/* Clam Mortar - Grenade launcher */}
			{weapon.visualType === "MORTAR" && (
				<group position={[0, -0.2, 0.6]} rotation-x={0.15}>
					{/* Wide mortar tube */}
					<mesh castShadow rotation-x={Math.PI / 2}>
						<cylinderGeometry args={[0.2, 0.18, 0.8, 12]} />
						<meshStandardMaterial color="#3d3d29" metalness={0.6} roughness={0.5} />
					</mesh>
					{/* Muzzle ring */}
					<mesh position={[0, 0, 0.4]} rotation-x={Math.PI / 2}>
						<torusGeometry args={[0.18, 0.03, 8, 16]} />
						<meshStandardMaterial color="#222" metalness={0.8} />
					</mesh>
					{/* Handle/Grip */}
					<mesh position={[0, -0.2, -0.2]}>
						<boxGeometry args={[0.1, 0.25, 0.15]} />
						<meshStandardMaterial color="#2a2a1a" roughness={0.8} />
					</mesh>
					{/* Shoulder brace */}
					<mesh position={[0, 0, -0.5]} rotation-x={-0.2}>
						<boxGeometry args={[0.15, 0.12, 0.3]} />
						<meshStandardMaterial color="#222" roughness={0.9} />
					</mesh>
					<group ref={muzzleRef} position={[0, 0, 0.5]} />
				</group>
			)}

			{/* Silt Needle - Precision dart gun */}
			{weapon.visualType === "NEEDLE_GUN" && (
				<group position={[0, -0.1, 0.3]}>
					{/* Sleek barrel */}
					<mesh position={[0, 0.05, 0.15]} rotation-x={Math.PI / 2} castShadow>
						<cylinderGeometry args={[0.025, 0.03, 0.6, 8]} />
						<meshStandardMaterial color="#555" metalness={0.95} roughness={0.1} />
					</mesh>
					{/* Pressure chamber */}
					<mesh position={[0, 0, -0.1]} castShadow>
						<sphereGeometry args={[0.1, 12, 12]} />
						<meshStandardMaterial color="#2d4a2d" metalness={0.7} roughness={0.3} />
					</mesh>
					{/* Grip */}
					<mesh position={[0, -0.12, -0.05]}>
						<boxGeometry args={[0.08, 0.18, 0.12]} />
						<meshStandardMaterial color="#333" roughness={0.8} />
					</mesh>
					{/* Needle tip accent */}
					<mesh position={[0, 0.05, 0.45]} rotation-x={Math.PI / 2}>
						<coneGeometry args={[0.015, 0.08, 6]} />
						<meshStandardMaterial color="#aaffaa" metalness={0.9} />
					</mesh>
					<group ref={muzzleRef} position={[0, 0.05, 0.5]} />
				</group>
			)}
		</group>
	);
}
