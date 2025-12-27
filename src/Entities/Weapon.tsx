/**
 * Weapon Component
 * Procedural weapons that can be mounted on characters
 */

import * as THREE from "three";
import { useMemo } from "react";
import { WEAPONS, type WeaponData } from "../stores/gameStore";

interface WeaponProps {
	weaponId: string;
	level?: number;
	muzzleRef?: React.RefObject<THREE.Group>;
}

export function Weapon({ weaponId, muzzleRef }: WeaponProps) {
	const weapon = useMemo(() => WEAPONS[weaponId] || WEAPONS["service-pistol"], [weaponId]);

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
					<mesh position={[0, 0.08, 0.3]}>
						<cylinderGeometry args={[0.04, 0.04, 0.4, 8]} rotation-x={Math.PI / 2} />
						<meshStandardMaterial color="#111" metalness={0.9} />
					</mesh>
					<group ref={muzzleRef} position={[0, 0.08, 0.5]} />
				</group>
			)}

			{weapon.visualType === "FISH_CANNON" && (
				<group position={[0, -0.2, 0.8]} rotation-x={0.1}>
					{/* Main Barrel */}
					<mesh castShadow>
						<cylinderGeometry args={[0.15, 0.18, 1.2, 12]} rotation-x={Math.PI / 2} />
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
					<mesh position={[0, 0, 0.3]}>
						<cylinderGeometry args={[0.05, 0.1, 0.4]} rotation-x={Math.PI / 2} />
						<meshStandardMaterial color="#eee" />
					</mesh>
					<group ref={muzzleRef} position={[0, 0, 0.5]} />
				</group>
			)}
		</group>
	);
}
