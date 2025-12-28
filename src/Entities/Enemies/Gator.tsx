/**
 * Gator Predator
 * Gritty biological crocodilians with mud camo and ambush mechanics.
 * Uses strata YukaVehicle for AI and strata PredatorPreset for behavior.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import * as YUKA from "yuka";
import { createPredatorPreset } from "../../lib/strata/presets";
import { Weapon } from "../Weapon";
import type { EnemyProps, GatorData } from "./types";

const AMBUSH_TRIGGER_DISTANCE = 15;
const AMBUSH_DURATION_S = 3;
const AMBUSH_COOLDOWN_MIN_S = 5;
const AMBUSH_COOLDOWN_RANDOM_S = 5;

export function Gator({ data, targetPosition, onDeath }: EnemyProps<GatorData>) {
	const groupRef = useRef<Group>(null);
	const bodyRef = useRef<Group>(null);

	// Use strata PredatorPreset for AI behavior
	const predatorRef = useRef<ReturnType<typeof createPredatorPreset> | null>(null);

	// Ambush state (game-specific extension of predator behavior)
	const [isAmbushing, setIsAmbushing] = useState(false);
	const ambushCooldown = useRef(0);
	const ambushTimer = useRef(0);

	// Setup Yuka AI using strata PredatorPreset
	useEffect(() => {
		const predator = createPredatorPreset({
			pursuitSpeed: data.isHeavy ? 4 : 7,
			detectionRadius: 20,
			maxSpeed: data.isHeavy ? 4 : 7,
			maxForce: 15,
			mass: data.isHeavy ? 3 : 2,
		});

		predator.vehicle.position.set(data.position.x, data.position.y, data.position.z);
		predatorRef.current = predator;

		return () => {
			predator.vehicle.steering.clear();
		};
	}, [data.position.x, data.position.y, data.position.z, data.isHeavy]);

	// Update AI and sync with Three.js mesh
	useFrame((state, delta) => {
		if (!predatorRef.current || !groupRef.current || !bodyRef.current) return;

		const { vehicle, update } = predatorRef.current;
		const distanceToPlayer = groupRef.current.position.distanceTo(targetPosition);
		const baseSpeed = data.isHeavy ? 4 : 7;

		// Update strata predator AI with prey position
		update(delta, {
			preyPosition: new YUKA.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
		});

		// Ambush logic: Pop up when close, or at random
		ambushCooldown.current -= delta;
		if (!isAmbushing && distanceToPlayer < AMBUSH_TRIGGER_DISTANCE && ambushCooldown.current <= 0) {
			setIsAmbushing(true);
			ambushCooldown.current = AMBUSH_COOLDOWN_MIN_S + Math.random() * AMBUSH_COOLDOWN_RANDOM_S;
			ambushTimer.current = AMBUSH_DURATION_S;
		}

		if (isAmbushing) {
			ambushTimer.current -= delta;
			if (ambushTimer.current <= 0) {
				setIsAmbushing(false);
			}
		}

		// Calculate target speed and Y position based on state
		let targetY = 0.15;
		let targetSpeed = baseSpeed;

		if (isAmbushing) {
			targetY = 0.8;
			targetSpeed = 0;
		}

		// Handle Suppression (overrides normal behavior)
		if (data.suppression > 0.1) {
			targetY = -0.2;
			targetSpeed = baseSpeed * (1 - data.suppression * 0.5);
			if (isAmbushing) targetSpeed = 0;
		}

		// Apply movement and animation
		vehicle.maxSpeed = targetSpeed;
		bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, targetY, 0.1);

		// Tilt body up when ambushing
		const targetRotationX = isAmbushing ? -0.4 : 0;
		bodyRef.current.rotation.x = THREE.MathUtils.lerp(
			bodyRef.current.rotation.x,
			targetRotationX,
			0.1,
		);

		// Sync Three.js mesh with Yuka vehicle
		groupRef.current.position.set(vehicle.position.x, 0, vehicle.position.z);

		// Face direction of movement (or player if ambushing)
		if (isAmbushing) {
			const lookDir = targetPosition.clone().sub(groupRef.current.position);
			const targetAngle = Math.atan2(lookDir.x, lookDir.z);
			groupRef.current.rotation.y = THREE.MathUtils.lerp(
				groupRef.current.rotation.y,
				targetAngle,
				0.1,
			);
		} else if (vehicle.velocity.length() > 0.1) {
			const angle = Math.atan2(vehicle.velocity.x, vehicle.velocity.z);
			groupRef.current.rotation.y = angle;
		}

		// Procedural swimming animation
		const time = state.clock.elapsedTime;
		const swimSpeed = isAmbushing ? 2 : data.isHeavy ? 4 : 6;
		const swimAmount = isAmbushing ? 0.05 : data.isHeavy ? 0.15 : 0.25;

		bodyRef.current.children.forEach((child, i) => {
			if (child.name.startsWith("segment")) {
				child.rotation.y = Math.sin(time * swimSpeed - i * 0.4) * swimAmount;
			}
		});
	});

	// Check if dead
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const scale = data.isHeavy ? 1.6 : 1.1;
	const bodyColor = data.isHeavy ? "#1a241a" : "#2d3d2d";
	const strapColor = "#1a1a1a";

	return (
		<group ref={groupRef}>
			<group ref={bodyRef}>
				{/* Head / Jaws */}
				<group position={[0, 0.15 * scale, 1.2 * scale]} name="segment-0">
					{/* Skull */}
					<mesh castShadow receiveShadow>
						<sphereGeometry args={[0.35 * scale, 32, 24]} />
						<meshStandardMaterial color={bodyColor} roughness={0.9} />
					</mesh>
					{/* Snout */}
					<mesh position={[0, -0.05 * scale, 0.4 * scale]} castShadow>
						<capsuleGeometry args={[0.25 * scale, 0.6 * scale, 16, 24]} />
						<meshStandardMaterial color={bodyColor} roughness={0.9} />
					</mesh>
					{/* Eyes - raised on skull */}
					{[-1, 1].map((side) => (
						<mesh
							key={`${data.id}-eye-${side}`}
							position={[side * 0.18 * scale, 0.22 * scale, 0.1 * scale]}
						>
							<sphereGeometry args={[0.06 * scale, 16, 12]} />
							<meshBasicMaterial color="#ffaa00" />
						</mesh>
					))}

					{/* Armor Plate on head */}
					<mesh position={[0, 0.22 * scale, 0]}>
						<cylinderGeometry args={[0.3 * scale, 0.35 * scale, 0.1 * scale, 32]} />
						<meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
					</mesh>

					<group position={[0, 0.35 * scale, 0.1 * scale]} scale={isAmbushing ? 1 : 0}>
						<Weapon weaponId="fish-cannon" />
					</group>
				</group>

				{/* Body Segments - Tapered capsule segments */}
				{[...Array(5)].map((_, i) => (
					<group
						key={`${data.id}-segment-${i}`}
						position={[0, 0.15 * scale, (0.4 - i * 0.75) * scale]}
						name={`segment-${i + 1}`}
					>
						<mesh castShadow receiveShadow>
							<sphereGeometry args={[(0.45 - i * 0.05) * scale, 32, 24]} />
							<meshStandardMaterial color={bodyColor} roughness={0.9} />
						</mesh>
						{/* Back Scales/Scutes */}
						<mesh position={[0, (0.35 - i * 0.05) * scale, 0]}>
							<boxGeometry args={[(0.2 - i * 0.02) * scale, 0.1 * scale, 0.4 * scale]} />
							<meshStandardMaterial color="#111" roughness={1} />
						</mesh>
						{/* Gear Straps */}
						<mesh position={[0, 0, 0]} rotation-x={Math.PI / 2}>
							<torusGeometry args={[(0.47 - i * 0.05) * scale, 0.03 * scale, 12, 32]} />
							<meshStandardMaterial color={strapColor} />
						</mesh>
					</group>
				))}

				{/* Long Tapered Tail */}
				<group position={[0, 0.1 * scale, -3.2 * scale]} name="segment-6">
					<mesh castShadow>
						<capsuleGeometry args={[0.15 * scale, 2 * scale, 16, 24]} />
						<meshStandardMaterial color={bodyColor} />
					</mesh>
				</group>

				{/* Legs - 4 short crocodilian legs */}
				{[-1, 1].map((side) => (
					<group key={`legs-${side}`}>
						{/* Front Leg */}
						<mesh position={[side * 0.4 * scale, 0, 0.8 * scale]} rotation-z={side * 0.5}>
							<capsuleGeometry args={[0.12 * scale, 0.3 * scale, 12, 16]} />
							<meshStandardMaterial color={bodyColor} />
						</mesh>
						{/* Back Leg */}
						<mesh position={[side * 0.4 * scale, 0, -1 * scale]} rotation-z={side * 0.5}>
							<capsuleGeometry args={[0.12 * scale, 0.3 * scale, 12, 16]} />
							<meshStandardMaterial color={bodyColor} />
						</mesh>
					</group>
				))}
			</group>

			{/* Health bar */}
			<group position={[0, 2 * scale, 0]}>
				<mesh position={[0, 0, 0]}>
					<planeGeometry args={[1.4, 0.08]} />
					<meshBasicMaterial color="#000" transparent opacity={0.5} side={THREE.DoubleSide} />
				</mesh>
				<mesh
					position={[-(1 - data.hp / data.maxHp) * 0.7, 0, 0.01]}
					scale-x={data.hp / data.maxHp}
				>
					<planeGeometry args={[1.4, 0.08]} />
					<meshBasicMaterial color="#ff4400" side={THREE.DoubleSide} />
				</mesh>
			</group>
		</group>
	);
}
