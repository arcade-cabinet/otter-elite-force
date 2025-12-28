/**
 * Player Rig / Modular Otter System
 * High-detail procedural character with authentic otter anatomy
 *
 * Real otter features:
 * - Elongated, sleek streamlined body built for swimming
 * - Dense brown fur with lighter cream/tan underbelly
 * - Thick, muscular rudder tail (tapered, slightly flattened)
 * - Webbed paws with visible webbing between toes
 * - Small rounded ears close to head
 * - Prominent sensitive whiskers
 * - Bright, intelligent beady eyes
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useEffect, useMemo, useRef } from "react";
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
	velocity?: number;
	children?: React.ReactNode;
	muzzleRef?: React.RefObject<THREE.Group>;
}

export const PlayerRig = forwardRef<Group, PlayerRigProps>(
	(
		{
			traits = {
				id: "default",
				name: "OTTER",
				furColor: "#5D4037",
				eyeColor: "#111",
				whiskerLength: 0.35,
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
		},
		ref,
	) => {
		const legLRef = useRef<THREE.Group>(null);
		const legRRef = useRef<THREE.Group>(null);
		const armLRef = useRef<THREE.Group>(null);
		const armRRef = useRef<THREE.Group>(null);
		const headRef = useRef<THREE.Group>(null);
		const tailRef = useRef<THREE.Group>(null);

		// Memoize materials to prevent recreation every render
		const materials = useMemo(
			() => ({
				fur: new THREE.MeshStandardMaterial({ color: traits.furColor, roughness: 0.95 }),
				underFur: new THREE.MeshStandardMaterial({ color: "#a08060", roughness: 0.9 }), // Lighter underbelly
				snout: new THREE.MeshStandardMaterial({ color: "#9D7E63", roughness: 0.85 }),
				nose: new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.3 }),
				eye: new THREE.MeshStandardMaterial({
					color: traits.eyeColor,
					roughness: 0.1,
					metalness: 0.3,
				}),
				eyeHighlight: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
				webbing: new THREE.MeshStandardMaterial({
					color: "#6d5040",
					roughness: 0.7,
					transparent: true,
					opacity: 0.9,
				}),
			}),
			[traits.furColor, traits.eyeColor],
		);

		// Cleanup materials on unmount
		useEffect(() => {
			return () => {
				Object.values(materials).forEach((material) => {
					material.dispose();
				});
			};
		}, [materials]);

		useFrame((state) => {
			const time = state.clock.elapsedTime;

			// Tail always has subtle movement - otters use it for balance
			if (tailRef.current) {
				// Smooth serpentine tail movement
				tailRef.current.children.forEach((segment, i) => {
					segment.rotation.y = Math.sin(time * 3 - i * 0.5) * 0.1;
					segment.rotation.x = Math.sin(time * 2 - i * 0.3) * 0.05;
				});
			}

			if (isClimbing) {
				// Climbing gait
				const speed = time * 10;
				if (legLRef.current) legLRef.current.rotation.x = -Math.PI / 4 + Math.sin(speed) * 0.4;
				if (legRRef.current)
					legRRef.current.rotation.x = -Math.PI / 4 + Math.sin(speed + Math.PI) * 0.4;
				if (armLRef.current)
					armLRef.current.rotation.x = Math.PI / 4 + Math.sin(speed + Math.PI) * 0.4;
				if (armRRef.current) armRRef.current.rotation.x = Math.PI / 4 + Math.sin(speed) * 0.4;
				return;
			}

			if (headRef.current) {
				// Subtle breathing/idle head bob
				headRef.current.position.y = 0.55 + Math.sin(time * 2.5) * 0.01;
				if (isMoving) {
					headRef.current.rotation.z = Math.sin(time * 12) * 0.03;
					headRef.current.rotation.x = Math.sin(time * 6) * 0.02;
				} else {
					headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1);
					headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1);
				}
			}

			if (isMoving) {
				// Natural quadruped gait - diagonal pairs move together
				const walkSpeed = time * 14;
				if (legLRef.current) legLRef.current.rotation.x = Math.sin(walkSpeed) * 0.6;
				if (armRRef.current) armRRef.current.rotation.x = Math.sin(walkSpeed) * 0.6;

				if (legRRef.current) legRRef.current.rotation.x = Math.sin(walkSpeed + Math.PI) * 0.6;
				if (armLRef.current) armLRef.current.rotation.x = Math.sin(walkSpeed + Math.PI) * 0.6;
			} else {
				[legLRef, legRRef, armLRef, armRRef].forEach((ref) => {
					if (ref.current)
						ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.1);
				});
			}

			// Tail swishes more when moving
			if (tailRef.current && isMoving) {
				tailRef.current.rotation.z = Math.sin(time * 8) * 0.15;
			}
		});

		// Webbed paw component - high detail realistic otter foot
		const WebbedPaw = ({ scale = 1 }: { scale?: number }) => (
			<group scale={scale}>
				{/* Main paw pad */}
				<mesh position={[0, -0.1, 0.02]} material={materials.snout}>
					<sphereGeometry args={[0.1, 16, 16]} />
				</mesh>
				{/* Toes with webbing */}
				{[-0.07, -0.025, 0.025, 0.07].map((x, i) => (
					<group key={`toe-${i}`}>
						{/* Individual toe */}
						<mesh position={[x, -0.12, 0.08]} material={materials.fur}>
							<sphereGeometry args={[0.035, 12, 12]} />
						</mesh>
						{/* Webbing between toes */}
						{i < 3 && (
							<mesh
								position={[(x + (x + 0.05)) / 2, -0.11, 0.06]}
								rotation-x={-0.2}
								material={materials.webbing}
							>
								<planeGeometry args={[0.04, 0.06]} />
							</mesh>
						)}
					</group>
				))}
			</group>
		);

		return (
			<group ref={ref} position={position} rotation-y={rotation}>
				{children}

				{/* === QUADRUPEDAL BODY - Horizontal streamlined otter torso === */}
				<group position={[0, 0.45, 0]}>
					{/* Lower torso / Hips */}
					<mesh position={[0, 0, -0.4]} castShadow receiveShadow material={materials.fur}>
						<sphereGeometry args={[0.35, 32, 32]} />
					</mesh>

					{/* Main elongated body capsule */}
					<mesh
						position={[0, 0, 0]}
						rotation-x={Math.PI / 2}
						castShadow
						receiveShadow
						material={materials.fur}
					>
						<capsuleGeometry args={[0.32, 0.8, 24, 32]} />
					</mesh>

					{/* Upper torso / Shoulders */}
					<mesh position={[0, 0.05, 0.4]} castShadow receiveShadow material={materials.fur}>
						<sphereGeometry args={[0.36, 32, 32]} />
					</mesh>

					{/* Underbelly - lighter coloration */}
					<mesh position={[0, -0.15, 0]} rotation-x={Math.PI / 2} material={materials.underFur}>
						<capsuleGeometry args={[0.25, 0.7, 16, 24]} />
					</mesh>

					{/* === TACTICAL GEAR === */}
					{gear.vest === "tactical" && (
						<group position={[0, 0.1, 0]}>
							<mesh rotation-x={Math.PI / 2}>
								<cylinderGeometry args={[0.38, 0.38, 0.6, 32]} />
								<meshStandardMaterial color="#2a3a4a" roughness={0.7} />
							</mesh>
							{/* Side pouches */}
							{[-0.35, 0.35].map((x) => (
								<mesh key={`pouch-${x}`} position={[x, 0.15, 0]}>
									<boxGeometry args={[0.1, 0.2, 0.3]} />
									<meshStandardMaterial color="#1a2a3a" />
								</mesh>
							))}
						</group>
					)}

					{/* === TAIL - Iconically thick and tapered === */}
					<group ref={tailRef} position={[0, -0.05, -0.65]} rotation-x={-0.1}>
						{[0.2, 0.15, 0.1, 0.05].map((radius, i) => (
							<mesh
								key={`tail-seg-${i}`}
								position={[0, 0, -i * 0.4]}
								rotation-x={Math.PI / 2}
								castShadow
								material={materials.fur}
							>
								<capsuleGeometry args={[radius, 0.4, 16, 24]} />
							</mesh>
						))}
					</group>

					{/* === LEGS - Quadrupedal arrangement === */}
					{/* Back Legs */}
					<group ref={legLRef} position={[-0.25, -0.1, -0.4]}>
						<mesh position={[0, -0.15, 0]} material={materials.fur} castShadow>
							<capsuleGeometry args={[0.12, 0.3, 12, 16]} />
						</mesh>
						<group position={[0, -0.3, 0.05]}>
							<WebbedPaw scale={0.9} />
						</group>
					</group>
					<group ref={legRRef} position={[0.25, -0.1, -0.4]}>
						<mesh position={[0, -0.15, 0]} material={materials.fur} castShadow>
							<capsuleGeometry args={[0.12, 0.3, 12, 16]} />
						</mesh>
						<group position={[0, -0.3, 0.05]}>
							<WebbedPaw scale={0.9} />
						</group>
					</group>

					{/* Front Legs */}
					<group ref={armLRef} position={[-0.25, -0.1, 0.4]}>
						<mesh position={[0, -0.15, 0]} material={materials.fur} castShadow>
							<capsuleGeometry args={[0.11, 0.28, 12, 16]} />
						</mesh>
						<group position={[0, -0.3, 0.05]}>
							<WebbedPaw scale={0.8} />
						</group>
					</group>
					<group ref={armRRef} position={[0.25, -0.1, 0.4]}>
						<mesh position={[0, -0.15, 0]} material={materials.fur} castShadow>
							<capsuleGeometry args={[0.11, 0.28, 12, 16]} />
						</mesh>
						<group position={[0, -0.3, 0.05]}>
							<WebbedPaw scale={0.8} />
						</group>
						{/* Weapon remains attached to front right leg area for now */}
						<group position={[0.1, 0, 0.1]}>
							<Weapon weaponId={gear.weaponId} muzzleRef={muzzleRef} />
						</group>
					</group>

					{/* === NECK & HEAD === */}
					<group ref={headRef} position={[0, 0.1, 0.55]}>
						{/* Neck */}
						<mesh
							position={[0, 0.15, 0.1]}
							rotation-x={-Math.PI / 4}
							material={materials.fur}
							castShadow
						>
							<capsuleGeometry args={[0.18, 0.3, 16, 24]} />
						</mesh>

						{/* Head Group */}
						<group position={[0, 0.45, 0.2]}>
							{/* Skull */}
							<mesh castShadow material={materials.fur}>
								<sphereGeometry args={[0.3, 32, 32]} />
							</mesh>

							{/* Snout */}
							<group position={[0, -0.1, 0.22]}>
								<mesh material={materials.snout}>
									<sphereGeometry args={[0.18, 24, 24]} />
								</mesh>
								{/* Nose */}
								<mesh position={[0, 0.05, 0.15]}>
									<sphereGeometry args={[0.06, 16, 16]} />
									<meshStandardMaterial color="#111" roughness={0.2} />
								</mesh>
								{/* Whiskers */}
								{[-1, 1].map((side) => (
									<group key={`whiskers-${side}`} position={[side * 0.12, 0, 0.1]}>
										{[0, 1, 2].map((row) => (
											<mesh
												key={`whisker-${side}-${row}`}
												position={[side * 0.02, -0.02 + row * 0.03, 0]}
												rotation-z={side * (0.2 + row * 0.1)}
												rotation-y={side * 0.3}
											>
												<cylinderGeometry
													args={[0.002, 0.0005, traits.whiskerLength + row * 0.04, 8]}
												/>
												<meshBasicMaterial color="#ddd" transparent opacity={0.6} />
											</mesh>
										))}
									</group>
								))}
							</group>

							{/* Eyes */}
							{[-1, 1].map((side) => (
								<group key={`eye-${side}`} position={[side * 0.15, 0.1, 0.22]}>
									<mesh material={materials.eye}>
										<sphereGeometry args={[0.045, 16, 16]} />
									</mesh>
									<mesh position={[0, 0, 0.035]} material={materials.eyeHighlight}>
										<sphereGeometry args={[0.01, 8, 8]} />
									</mesh>
								</group>
							))}

							{/* Ears */}
							{[-1, 1].map((side) => (
								<mesh
									key={`ear-${side}`}
									position={[side * 0.28, 0.2, -0.05]}
									rotation-z={side * 0.3}
									material={materials.fur}
								>
									<sphereGeometry args={[0.08, 16, 16]} />
								</mesh>
							))}

							{/* Headgear */}
							{gear.headgear === "helmet" && (
								<mesh position={[0, 0.2, 0]} rotation-x={0.1}>
									<sphereGeometry args={[0.35, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
									<meshStandardMaterial color="#3d4d29" roughness={0.7} />
								</mesh>
							)}
						</group>
					</group>
				</group>
			</group>
		);
	},
);
