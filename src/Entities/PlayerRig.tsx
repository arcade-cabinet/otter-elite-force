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

		useFrame((state) => {
			const time = state.clock.elapsedTime;

			// Tail always has subtle movement - otters use it for balance
			if (tailRef.current) {
				tailRef.current.rotation.x = -0.3 + Math.sin(time * 2) * 0.1;
				tailRef.current.rotation.z = Math.sin(time * 3) * 0.15;
			}

			if (isClimbing) {
				if (legLRef.current && legRRef.current) {
					legLRef.current.rotation.x = -Math.PI / 4 + Math.sin(time * 10) * 0.3;
					legRRef.current.rotation.x = -Math.PI / 4 + Math.sin(time * 10 + Math.PI) * 0.3;
				}
				if (armLRef.current)
					armLRef.current.rotation.x = Math.PI / 4 + Math.sin(time * 10 + Math.PI) * 0.3;
				if (armRRef.current) armRRef.current.rotation.x = Math.PI / 4 + Math.sin(time * 10) * 0.3;
				return;
			}

			if (headRef.current) {
				// Subtle breathing/idle head bob
				headRef.current.position.y = 1.5 + Math.sin(time * 2.5) * 0.015;
				if (isMoving) {
					headRef.current.rotation.z = Math.sin(time * 12) * 0.04;
					headRef.current.rotation.x = Math.sin(time * 6) * 0.02;
				} else {
					headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1);
					headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1);
				}
			}

			if (legLRef.current && legRRef.current) {
				if (isMoving) {
					// Natural quadruped-like gait
					legLRef.current.rotation.x = Math.sin(time * 14) * 0.7;
					legRRef.current.rotation.x = Math.sin(time * 14 + Math.PI) * 0.7;
				} else {
					legLRef.current.rotation.x = THREE.MathUtils.lerp(legLRef.current.rotation.x, 0, 0.1);
					legRRef.current.rotation.x = THREE.MathUtils.lerp(legRRef.current.rotation.x, 0, 0.1);
				}
			}

			if (armLRef.current) {
				if (isMoving) {
					armLRef.current.rotation.x = Math.sin(time * 14 + Math.PI) * 0.4;
				} else {
					armLRef.current.rotation.x = THREE.MathUtils.lerp(armLRef.current.rotation.x, 0, 0.1);
				}
			}

			// Tail swishes more when moving
			if (tailRef.current && isMoving) {
				tailRef.current.rotation.z = Math.sin(time * 8) * 0.25;
			}
		});

		// Webbed paw component - realistic otter foot with webbing
		const WebbedPaw = ({ scale = 1 }: { scale?: number }) => (
			<group scale={scale}>
				{/* Main paw pad */}
				<mesh position={[0, -0.15, 0.05]} material={materials.snout}>
					<sphereGeometry args={[0.12, 8, 8]} />
				</mesh>
				{/* Toes with webbing */}
				{[-0.08, -0.03, 0.03, 0.08].map((x, i) => (
					<group key={`toe-${i}`}>
						{/* Individual toe */}
						<mesh position={[x, -0.2, 0.12]} material={materials.fur}>
							<sphereGeometry args={[0.04, 6, 6]} />
						</mesh>
						{/* Webbing between toes */}
						{i < 3 && (
							<mesh
								position={[(x + (x + 0.05)) / 2, -0.18, 0.1]}
								rotation-x={-0.3}
								material={materials.webbing}
							>
								<planeGeometry args={[0.05, 0.08]} />
							</mesh>
						)}
					</group>
				))}
			</group>
		);

		return (
			<group ref={ref} position={position} rotation-y={rotation}>
				{children}

				{/* === BODY - Sleek elongated otter torso === */}
				{/* Upper torso - slightly compressed for streamlined look */}
				<mesh position={[0, 1.05, 0]} castShadow receiveShadow material={materials.fur}>
					<sphereGeometry args={[0.48, 16, 16]} />
				</mesh>
				{/* Mid torso - elongated core */}
				<mesh position={[0, 0.7, 0]} castShadow receiveShadow material={materials.fur}>
					<capsuleGeometry args={[0.4, 0.4, 8, 16]} />
				</mesh>
				{/* Lower torso connecting to tail */}
				<mesh position={[0, 0.4, -0.1]} castShadow receiveShadow material={materials.fur}>
					<sphereGeometry args={[0.35, 12, 12]} />
				</mesh>
				{/* Underbelly - lighter coloration */}
				<mesh position={[0, 0.7, 0.2]} material={materials.underFur}>
					<sphereGeometry args={[0.32, 12, 12]} />
				</mesh>

				{/* === THICK RUDDER TAIL - Otter's iconic feature === */}
				<group ref={tailRef} position={[0, 0.35, -0.4]} rotation-x={-0.3}>
					{/* Tail base - thick and muscular */}
					<mesh position={[0, 0, 0]} rotation-x={Math.PI / 2} castShadow material={materials.fur}>
						<capsuleGeometry args={[0.18, 0.5, 8, 12]} />
					</mesh>
					{/* Tail mid - tapered */}
					<mesh
						position={[0, 0, -0.5]}
						rotation-x={Math.PI / 2}
						castShadow
						material={materials.fur}
					>
						<capsuleGeometry args={[0.14, 0.4, 8, 12]} />
					</mesh>
					{/* Tail tip - slightly flattened like a rudder */}
					<mesh
						position={[0, 0, -0.9]}
						rotation-x={Math.PI / 2}
						castShadow
						material={materials.fur}
					>
						<capsuleGeometry args={[0.08, 0.3, 8, 12]} />
					</mesh>
				</group>

				{/* === GEAR: TACTICAL VEST === */}
				{gear.vest === "tactical" && (
					<group position={[0, 0.85, 0]}>
						<mesh>
							<cylinderGeometry args={[0.52, 0.48, 0.6, 12]} />
							<meshStandardMaterial color="#2a3a4a" roughness={0.7} />
						</mesh>
						{/* Vest pockets/pouches */}
						{[-0.35, 0.35].map((x) => (
							<mesh key={`pouch-${x}`} position={[x, -0.1, 0.35]}>
								<boxGeometry args={[0.15, 0.2, 0.1]} />
								<meshStandardMaterial color="#1a2a3a" />
							</mesh>
						))}
					</group>
				)}
				{gear.vest === "heavy" && (
					<group position={[0, 0.85, 0]}>
						<mesh>
							<cylinderGeometry args={[0.56, 0.52, 0.7, 12]} />
							<meshStandardMaterial color="#3a4a2a" metalness={0.2} roughness={0.5} />
						</mesh>
						{/* Armor plates */}
						<mesh position={[0, 0, 0.4]}>
							<boxGeometry args={[0.4, 0.5, 0.08]} />
							<meshStandardMaterial color="#4a5a3a" metalness={0.4} />
						</mesh>
					</group>
				)}

				{/* === HEAD - Realistic otter head === */}
				<group ref={headRef} position={[0, 1.5, 0]}>
					{/* Main skull - slightly flattened */}
					<mesh castShadow material={materials.fur}>
						<sphereGeometry args={[0.38, 24, 24]} />
					</mesh>
					{/* Forehead ridge */}
					<mesh position={[0, 0.15, 0.1]} material={materials.fur}>
						<sphereGeometry args={[0.25, 12, 12]} />
					</mesh>

					{/* === SNOUT === */}
					<group position={[0, -0.08, 0.28]}>
						{/* Main snout - broad and flat like otter */}
						<mesh material={materials.snout}>
							<sphereGeometry args={[0.22, 16, 16]} />
						</mesh>
						{/* Nose pad - wet look */}
						<mesh position={[0, 0.05, 0.2]}>
							<sphereGeometry args={[0.08, 12, 12]} />
							<meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
						</mesh>
						{/* Nostrils */}
						{[-0.03, 0.03].map((x) => (
							<mesh key={`nostril-${x}`} position={[x, 0.05, 0.25]}>
								<sphereGeometry args={[0.015, 6, 6]} />
								<meshBasicMaterial color="#000" />
							</mesh>
						))}

						{/* === WHISKERS - 3 rows on each side === */}
						{[-1, 1].map((side) => (
							<group key={`whiskers-${side}`} position={[side * 0.15, 0, 0.1]}>
								{[0, 1, 2].map((row) => (
									<mesh
										key={`whisker-${side}-${row}`}
										position={[side * 0.03, -0.02 + row * 0.04, 0]}
										rotation-z={side * (0.15 + row * 0.1)}
										rotation-y={side * 0.3}
									>
										<cylinderGeometry args={[0.003, 0.001, traits.whiskerLength + row * 0.05, 4]} />
										<meshBasicMaterial color="#ddd" transparent opacity={0.7} />
									</mesh>
								))}
							</group>
						))}
					</group>

					{/* === EYES - Bright, intelligent === */}
					{[-1, 1].map((side) => (
						<group key={`eye-${side}`} position={[side * 0.18, 0.08, 0.28]}>
							{/* Eye socket/brow */}
							<mesh position={[0, 0.06, -0.02]} rotation-z={side * 0.15} material={materials.fur}>
								<sphereGeometry args={[0.08, 8, 8]} />
							</mesh>
							{/* Eyeball */}
							<mesh material={materials.eye}>
								<sphereGeometry args={[0.055, 12, 12]} />
							</mesh>
							{/* Pupil */}
							<mesh position={[0, 0, 0.04]}>
								<sphereGeometry args={[0.03, 8, 8]} />
								<meshBasicMaterial color="#000" />
							</mesh>
							{/* Eye highlight/glint */}
							<mesh position={[side * 0.02, 0.02, 0.05]} material={materials.eyeHighlight}>
								<sphereGeometry args={[0.012, 6, 6]} />
							</mesh>
						</group>
					))}

					{/* === EARS - Small, rounded, close to head === */}
					{[-1, 1].map((side) => (
						<group key={`ear-${side}`} position={[side * 0.32, 0.25, -0.05]}>
							{/* Outer ear */}
							<mesh rotation-z={side * 0.4} material={materials.fur}>
								<sphereGeometry args={[0.1, 10, 10]} />
							</mesh>
							{/* Inner ear (pink) */}
							<mesh position={[side * 0.02, 0, 0.03]} rotation-z={side * 0.4}>
								<sphereGeometry args={[0.06, 8, 8]} />
								<meshStandardMaterial color="#c4a088" roughness={0.8} />
							</mesh>
						</group>
					))}

					{/* Scar for grizzled veterans */}
					{traits.grizzled && (
						<mesh position={[0.15, 0.2, 0.3]} rotation-z={0.6}>
							<boxGeometry args={[0.015, 0.12, 0.01]} />
							<meshBasicMaterial color="#8a6060" />
						</mesh>
					)}

					{/* === HEADGEAR === */}
					{gear.headgear === "bandana" && (
						<mesh position={[0, 0.2, 0]} rotation-x={Math.PI / 2}>
							<torusGeometry args={[0.36, 0.06, 8, 24]} />
							<meshStandardMaterial color="#cc8800" roughness={0.8} />
						</mesh>
					)}
					{gear.headgear === "beret" && (
						<group position={[0.1, 0.32, 0]} rotation-z={-0.25}>
							<mesh>
								<cylinderGeometry args={[0.35, 0.4, 0.12, 16]} />
								<meshStandardMaterial color="#8b0000" roughness={0.9} />
							</mesh>
							{/* Beret badge */}
							<mesh position={[-0.15, 0.02, 0.3]}>
								<circleGeometry args={[0.06, 8]} />
								<meshStandardMaterial color="#d4af37" metalness={0.7} />
							</mesh>
						</group>
					)}
					{gear.headgear === "helmet" && (
						<mesh position={[0, 0.28, 0]} rotation-x={0.15}>
							<sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
							<meshStandardMaterial color="#3d4d29" roughness={0.7} metalness={0.1} />
						</mesh>
					)}
				</group>

				{/* === BACKGEAR === */}
				{gear.backgear === "radio" && (
					<group position={[0, 0.95, -0.4]}>
						<mesh>
							<boxGeometry args={[0.5, 0.7, 0.25]} />
							<meshStandardMaterial color="#2a2a1a" roughness={0.8} />
						</mesh>
						{/* Antenna */}
						<mesh position={[0.15, 0.5, 0]}>
							<cylinderGeometry args={[0.015, 0.01, 0.7, 6]} />
							<meshStandardMaterial color="#111" metalness={0.5} />
						</mesh>
					</group>
				)}
				{gear.backgear === "scuba" && (
					<group position={[0, 0.9, -0.4]}>
						<mesh rotation-x={Math.PI / 2}>
							<cylinderGeometry args={[0.15, 0.15, 0.6, 12]} />
							<meshStandardMaterial color="#ffdd00" metalness={0.6} roughness={0.3} />
						</mesh>
						{/* Regulator hose */}
						<mesh position={[0.1, 0.3, 0.2]} rotation-z={0.5}>
							<cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
							<meshStandardMaterial color="#333" />
						</mesh>
					</group>
				)}

				{/* === ARMS with webbed paws === */}
				<group ref={armLRef} position={[-0.55, 1.0, 0.1]}>
					{/* Upper arm */}
					<mesh rotation-z={0.3} castShadow material={materials.fur}>
						<capsuleGeometry args={[0.12, 0.35, 6, 12]} />
					</mesh>
					{/* Forearm */}
					<mesh position={[-0.1, -0.35, 0.1]} rotation-z={0.1} castShadow material={materials.fur}>
						<capsuleGeometry args={[0.1, 0.3, 6, 12]} />
					</mesh>
					{/* Webbed paw */}
					<group position={[-0.1, -0.55, 0.15]}>
						<WebbedPaw scale={0.8} />
					</group>
				</group>

				<group ref={armRRef} position={[0.55, 1.0, 0.1]}>
					{/* Weapon arm - posed for holding */}
					<mesh
						rotation-x={-Math.PI / 3}
						position={[0, -0.1, 0.25]}
						castShadow
						material={materials.fur}
					>
						<capsuleGeometry args={[0.12, 0.5, 6, 12]} />
					</mesh>
					<Weapon weaponId={gear.weaponId} muzzleRef={muzzleRef} />
				</group>

				{/* === LEGS with webbed feet === */}
				<group ref={legLRef} position={[-0.28, 0.3, 0]}>
					{/* Thigh */}
					<mesh castShadow material={materials.fur}>
						<capsuleGeometry args={[0.14, 0.35, 6, 12]} />
					</mesh>
					{/* Lower leg */}
					<mesh position={[0, -0.35, 0.05]} castShadow material={materials.fur}>
						<capsuleGeometry args={[0.11, 0.25, 6, 12]} />
					</mesh>
					{/* Webbed foot */}
					<group position={[0, -0.55, 0.1]}>
						<WebbedPaw scale={1} />
					</group>
				</group>

				<group ref={legRRef} position={[0.28, 0.3, 0]}>
					{/* Thigh */}
					<mesh castShadow material={materials.fur}>
						<capsuleGeometry args={[0.14, 0.35, 6, 12]} />
					</mesh>
					{/* Lower leg */}
					<mesh position={[0, -0.35, 0.05]} castShadow material={materials.fur}>
						<capsuleGeometry args={[0.11, 0.25, 6, 12]} />
					</mesh>
					{/* Webbed foot */}
					<group position={[0, -0.55, 0.1]}>
						<WebbedPaw scale={1} />
					</group>
				</group>
			</group>
		);
	},
);
