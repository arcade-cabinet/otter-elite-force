/**
 * Player Rig / Modular Otter System
 * High-detail procedural character with swappable gear and traits
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";
import type { CharacterGear, CharacterTraits } from "../stores/gameStore";
import { Weapon } from "./Weapon";

interface PlayerRigProps {
	traits?: CharacterTraits;
	gear?: CharacterGear;
	position?: [number, number, number];
	rotation?: number;
	isMoving?: boolean;
	isClimbing?: boolean;
	children?: React.ReactNode;
	muzzleRef?: React.RefObject<THREE.Group>;
	isFiring?: boolean;
}

export const PlayerRig = forwardRef<Group, PlayerRigProps>(
	(
		{
			traits = {
				id: "default",
				name: "OTTER",
				furColor: "#5D4037",
				eyeColor: "#111",
				whiskerLength: 0.3,
				grizzled: false,
				baseSpeed: 14,
				baseHealth: 100,
				climbSpeed: 10,
			},
			gear = {
				headgear: "none",
				vest: "tactical",
				backgear: "none",
				weaponId: "service-pistol",
			},
			position = [0, 0, 0],
			rotation = 0,
			isMoving = false,
			isClimbing = false,
			children,
			muzzleRef,
			isFiring = false,
		},
		ref,
	) => {
		const legLRef = useRef<THREE.Mesh>(null);
		const legRRef = useRef<THREE.Mesh>(null);
		const armLRef = useRef<THREE.Mesh>(null);
		const armRRef = useRef<THREE.Group>(null);
		const headRef = useRef<THREE.Group>(null);

		const matFur = useMemo(
			() => new THREE.MeshStandardMaterial({ color: traits.furColor, roughness: 1.0 }),
			[traits.furColor],
		);
		const matSnout = useMemo(
			() => new THREE.MeshStandardMaterial({ color: "#8D6E63", roughness: 0.9 }),
			[],
		);
		const matEye = useMemo(
			() => new THREE.MeshStandardMaterial({ color: traits.eyeColor, roughness: 0.1 }),
			[traits.eyeColor],
		);

		// Memoize whisker rotations to avoid jitter
		const whiskerRotations = useMemo(
			() => [...Array(6)].map((_, i) => (i % 2 === 0 ? 1 : -1) * (0.2 + Math.random() * 0.2)),
			[],
		);

		useFrame((state) => {
			const time = state.clock.elapsedTime;

			if (isClimbing) {
				if (legLRef.current && legRRef.current) {
					legLRef.current.rotation.x = -Math.PI / 4 + Math.sin(time * 10) * 0.2;
					legRRef.current.rotation.x = -Math.PI / 4 + Math.sin(time * 10 + Math.PI) * 0.2;
				}
				if (armLRef.current)
					armLRef.current.rotation.x = Math.PI / 4 + Math.sin(time * 10 + Math.PI) * 0.2;
				if (armRRef.current) armRRef.current.rotation.x = Math.PI / 4 + Math.sin(time * 10) * 0.2;
				return;
			}

			if (headRef.current) {
				headRef.current.position.y = 1.45 + Math.sin(time * 2) * 0.02;
				if (isMoving) {
					headRef.current.rotation.z = Math.sin(time * 10) * 0.05;
				} else {
					headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1);
				}
			}

			if (legLRef.current && legRRef.current) {
				if (isMoving) {
					legLRef.current.rotation.x = Math.sin(time * 15) * 0.8;
					legRRef.current.rotation.x = Math.sin(time * 15 + Math.PI) * 0.8;
				} else {
					legLRef.current.rotation.x = THREE.MathUtils.lerp(legLRef.current.rotation.x, 0, 0.1);
					legRRef.current.rotation.x = THREE.MathUtils.lerp(legRRef.current.rotation.x, 0, 0.1);
				}
			}

			if (armLRef.current) {
				if (isMoving) {
					armLRef.current.rotation.x = Math.sin(time * 15 + Math.PI) * 0.5;
				} else {
					armLRef.current.rotation.x = THREE.MathUtils.lerp(armLRef.current.rotation.x, 0, 0.1);
				}
			}
		});

		return (
			<group ref={ref} position={position} rotation-y={rotation}>
				{children}
				{/* --- BODY --- */}
				<mesh position={[0, 1.0, 0]} castShadow receiveShadow material={matFur}>
					<sphereGeometry args={[0.55, 16, 16]} />
				</mesh>
				<mesh position={[0, 0.6, 0]} castShadow receiveShadow material={matFur}>
					<sphereGeometry args={[0.5, 16, 16]} />
				</mesh>

				{/* --- GEAR: VEST --- */}
				{gear.vest === "tactical" && (
					<mesh position={[0, 0.8, 0]}>
						<cylinderGeometry args={[0.58, 0.55, 0.8, 12]} />
						<meshStandardMaterial color="#223344" roughness={0.6} />
					</mesh>
				)}
				{gear.vest === "heavy" && (
					<mesh position={[0, 0.8, 0]}>
						<cylinderGeometry args={[0.62, 0.6, 0.9, 12]} />
						<meshStandardMaterial color="#334422" metalness={0.3} roughness={0.4} />
					</mesh>
				)}

				{/* --- HEAD --- */}
				<group ref={headRef} position={[0, 1.45, 0]}>
					<mesh castShadow material={matFur}>
						<sphereGeometry args={[0.45, 24, 24]} />
					</mesh>
					<group position={[0, -0.05, 0.3]}>
						<mesh material={matSnout}>
							<sphereGeometry args={[0.25, 16, 16]} scale={[1, 0.8, 1.2]} />
						</mesh>
						<mesh position={[0, 0.1, 0.25]}>
							<sphereGeometry args={[0.06, 8, 8]} />
							<meshStandardMaterial color="#111" />
						</mesh>
						{[...Array(6)].map((_, i) => (
							<mesh
								key={`whisker-${traits.id}-${i}`}
								position={[(i % 2 === 0 ? 1 : -1) * 0.2, -0.05 + Math.floor(i / 2) * 0.05, 0.1]}
								rotation-z={whiskerRotations[i]}
								rotation-y={(i % 2 === 0 ? 1 : -1) * 0.5}
							>
								<cylinderGeometry args={[0.005, 0.005, traits.whiskerLength]} />
								<meshBasicMaterial color="#ccc" transparent opacity={0.6} />
							</mesh>
						))}
					</group>
					{[-1, 1].map((side) => (
						<group key={`eye-group-${side}`} position={[side * 0.22, 0.15, 0.35]}>
							<mesh position={[0, 0.1, -0.05]} rotation-z={side * 0.2}>
								<boxGeometry args={[0.15, 0.05, 0.1]} />
								<meshStandardMaterial color={traits.furColor} roughness={0.9} />
							</mesh>
							<mesh material={matEye}>
								<sphereGeometry args={[0.06, 12, 12]} />
							</mesh>
						</group>
					))}
					{[-1, 1].map((side) => (
						<mesh
							key={`ear-${side}`}
							position={[side * 0.38, 0.38, 0]}
							rotation-z={side * 0.5}
							material={matFur}
						>
							<sphereGeometry args={[0.12, 12, 12]} scale={[1, 1.2, 0.5]} />
						</mesh>
					))}
					{traits.grizzled && (
						<mesh position={[0.2, 0.3, 0.35]} rotation-z={0.5}>
							<boxGeometry args={[0.02, 0.15, 0.02]} />
							<meshBasicMaterial color="#885555" />
						</mesh>
					)}
					{gear.headgear === "bandana" && (
						<mesh position={[0, 0.25, 0]} rotation-x={Math.PI / 2}>
							<torusGeometry args={[0.42, 0.08, 8, 24]} />
							<meshStandardMaterial color="#ffaa00" />
						</mesh>
					)}
					{gear.headgear === "beret" && (
						<mesh position={[0, 0.35, 0]} rotation-z={-0.3}>
							<cylinderGeometry args={[0.45, 0.5, 0.2, 16]} />
							<meshStandardMaterial color="#880000" />
						</mesh>
					)}
					{gear.headgear === "helmet" && (
						<mesh position={[0, 0.35, 0]} rotation-x={0.1}>
							<sphereGeometry args={[0.48, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
							<meshStandardMaterial color="#3d4d29" roughness={0.8} />
						</mesh>
					)}
				</group>

				{/* --- GEAR: BACKGEAR --- */}
				{gear.backgear === "radio" && (
					<mesh position={[0, 1.0, -0.45]}>
						<boxGeometry args={[0.6, 0.8, 0.3]} />
						<meshStandardMaterial color="#332211" />
						<mesh position={[0.2, 0.6, 0]}>
							<cylinderGeometry args={[0.02, 0.02, 0.8]} />
							<meshStandardMaterial color="#111" />
						</mesh>
					</mesh>
				)}
				{gear.backgear === "scuba" && (
					<group position={[0, 1.0, -0.45]}>
						<mesh rotation-x={Math.PI / 2}>
							<cylinderGeometry args={[0.2, 0.2, 0.8, 12]} />
							<meshStandardMaterial color="#ffff00" metalness={0.5} />
						</mesh>
					</group>
				)}

				{/* --- ARMS --- */}
				<mesh ref={armLRef} position={[-0.7, 1.1, 0]} rotation-z={0.4} castShadow material={matFur}>
					<capsuleGeometry args={[0.14, 0.6, 4, 12]} />
				</mesh>
				<group ref={armRRef} position={[0.7, 1.1, 0]}>
					<mesh rotation-x={-Math.PI / 2.5} position={[0, -0.1, 0.3]} castShadow material={matFur}>
						<capsuleGeometry args={[0.14, 0.6, 4, 12]} />
					</mesh>
					<Weapon weaponId={gear.weaponId} muzzleRef={muzzleRef} isFiring={isFiring} />
				</group>

				{/* --- LEGS --- */}
				<mesh ref={legLRef} position={[-0.35, 0.35, 0]} castShadow material={matFur}>
					<capsuleGeometry args={[0.15, 0.5, 4, 12]} />
				</mesh>
				<mesh ref={legRRef} position={[0.35, 0.35, 0]} castShadow material={matFur}>
					<capsuleGeometry args={[0.15, 0.5, 4, 12]} />
				</mesh>
			</group>
		);
	},
);
