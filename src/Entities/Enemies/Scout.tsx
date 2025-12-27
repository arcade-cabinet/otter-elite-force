/**
 * Scout Predator
 * Light, fast reconnaissance lizard that signals heavy units when spotting players
 * Vietnam-era aesthetic: radio-equipped, darting movements, creates "alert" state
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import * as YUKA from "yuka";
import type { EnemyProps, ScoutData } from "./types";

/**
 * Behavior tuning constants for Scout predators.
 *
 * All distances are in world units (matching Three.js scene scale).
 * Time values are in seconds of simulation time.
 *
 * - DETECTION_RANGE: How far ahead the Scout can "see" the player to trigger
 *   an alert. Tuned so Scouts pick up players just beyond typical engagement
 *   range, giving heavies time to respond without feeling omniscient.
 * - SIGNAL_COOLDOWN: Minimum time between radio calls / alert signals.
 *   Prevents constant spam; 8s keeps tension without overwhelming the player.
 * - FLEE_DISTANCE: Panic radius used by Yuka's FleeBehavior. When the player
 *   gets inside this radius, the Scout prioritizes evasive movement to keep
 *   its "eyes on" role instead of trading damage.
 */
const DETECTION_RANGE = 30;
const SIGNAL_COOLDOWN = 8;
const FLEE_DISTANCE = 12;

export function Scout({ data, targetPosition, onDeath, onSignal }: EnemyProps<ScoutData>) {
	const groupRef = useRef<Group>(null);
	const bodyRef = useRef<Group>(null);
	const antennaRef = useRef<THREE.Mesh>(null);
	const vehicleRef = useRef<YUKA.Vehicle | null>(null);
	const targetRef = useRef<YUKA.Vector3 | null>(null);

	const [isSignaling, setIsSignaling] = useState(false);
	const [hasSpottedPlayer, setHasSpottedPlayer] = useState(false);
	const signalCooldown = useRef(0);
	const signalTimer = useRef(0);

	// Setup Yuka AI
	useEffect(() => {
		const vehicle = new YUKA.Vehicle();
		vehicle.position.set(data.position.x, data.position.y, data.position.z);
		vehicle.maxSpeed = 10; // Fast, agile

		const fleeBehavior = new YUKA.FleeBehavior();
		targetRef.current = new YUKA.Vector3();
		fleeBehavior.target = targetRef.current;
		fleeBehavior.panicDistance = FLEE_DISTANCE;

		vehicle.steering.add(fleeBehavior);
		vehicleRef.current = vehicle;

		return () => {
			vehicle.steering.clear();
		};
	}, [data.position.x, data.position.y, data.position.z]);

	useFrame((state, delta) => {
		if (!vehicleRef.current || !groupRef.current || !bodyRef.current) return;

		const t = state.clock.elapsedTime;
		const distanceToPlayer = groupRef.current.position.distanceTo(targetPosition);

		// Cooldown management
		signalCooldown.current = Math.max(0, signalCooldown.current - delta);

		// Detection logic
		if (distanceToPlayer < DETECTION_RANGE && !hasSpottedPlayer) {
			setHasSpottedPlayer(true);
		}

		// Signaling logic
		if (hasSpottedPlayer && signalCooldown.current <= 0 && !isSignaling) {
			setIsSignaling(true);
			signalTimer.current = 2; // Signal for 2 seconds
			signalCooldown.current = SIGNAL_COOLDOWN;
			onSignal?.(data.id, groupRef.current.position.clone());
		}

		// Signal animation timer
		if (isSignaling) {
			signalTimer.current -= delta;
			if (signalTimer.current <= 0) {
				setIsSignaling(false);
			}
		}

		// Update flee target (run from player)
		if (targetRef.current) {
			targetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
		}

		// Update vehicle based on distance
		if (distanceToPlayer < FLEE_DISTANCE) {
			vehicleRef.current.maxSpeed = 12; // Panic speed
		} else {
			vehicleRef.current.maxSpeed = hasSpottedPlayer ? 8 : 3; // Patrol vs alert
		}

		// Suppression reduces speed significantly
		vehicleRef.current.maxSpeed *= 1 - data.suppression * 0.8;

		// Update Yuka AI
		vehicleRef.current.update(delta);

		// Sync position
		groupRef.current.position.set(vehicleRef.current.position.x, 0, vehicleRef.current.position.z);

		// Face movement direction
		if (vehicleRef.current.velocity.length() > 0.1) {
			const angle = Math.atan2(vehicleRef.current.velocity.x, vehicleRef.current.velocity.z);
			groupRef.current.rotation.y = angle;
		}

		// Darting body animation - quick, nervous movements
		bodyRef.current.position.y = Math.sin(t * 15) * 0.03 + 0.4;
		bodyRef.current.rotation.z = Math.sin(t * 8) * 0.1;

		// Antenna pulses when signaling
		if (antennaRef.current) {
			if (isSignaling) {
				antennaRef.current.scale.y = 1 + Math.sin(t * 30) * 0.3;
			} else {
				antennaRef.current.scale.y = 1;
			}
		}
	});

	// Handle death callback - use useEffect to fire only once when hp changes
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const bodyColor = "#4a5a3a"; // Camouflage green
	const underbellyColor = "#6a7a5a";
	const radioColor = "#2a2a1a";

	return (
		<group ref={groupRef}>
			<group ref={bodyRef}>
				{/* Sleek, lizard-like body */}
				<mesh position={[0, 0, 0]} castShadow receiveShadow>
					<capsuleGeometry args={[0.25, 0.8, 8, 12]} />
					<meshStandardMaterial color={bodyColor} roughness={0.85} />
				</mesh>

				{/* Underbelly */}
				<mesh position={[0, -0.1, 0]}>
					<capsuleGeometry args={[0.2, 0.6, 8, 12]} />
					<meshStandardMaterial color={underbellyColor} roughness={0.9} />
				</mesh>

				{/* Head - small, pointed */}
				<group position={[0, 0.1, 0.6]}>
					<mesh castShadow>
						<sphereGeometry args={[0.18, 12, 12]} />
						<meshStandardMaterial color={bodyColor} roughness={0.85} />
					</mesh>
					{/* Snout */}
					<mesh position={[0, 0, 0.15]} rotation-x={0.2}>
						<coneGeometry args={[0.1, 0.2, 8]} />
						<meshStandardMaterial color={bodyColor} />
					</mesh>
					{/* Alert eyes */}
					{[-1, 1].map((side) => (
						<mesh key={`eye-${side}`} position={[side * 0.1, 0.08, 0.1]}>
							<sphereGeometry args={[0.04, 8, 8]} />
							<meshBasicMaterial color={hasSpottedPlayer ? "#ff6600" : "#ffcc00"} />
						</mesh>
					))}
				</group>

				{/* Tail - long and whip-like */}
				<group position={[0, 0, -0.5]} rotation-x={0.2}>
					<mesh castShadow>
						<coneGeometry args={[0.12, 0.8, 8]} />
						<meshStandardMaterial color={bodyColor} />
					</mesh>
				</group>

				{/* Radio Pack - tactical signaling equipment */}
				<group position={[0, 0.25, -0.1]}>
					<mesh castShadow>
						<boxGeometry args={[0.25, 0.15, 0.2]} />
						<meshStandardMaterial color={radioColor} roughness={0.7} />
					</mesh>
					{/* Antenna */}
					<mesh ref={antennaRef} position={[0.08, 0.2, 0]}>
						<cylinderGeometry args={[0.01, 0.008, 0.4, 6]} />
						<meshStandardMaterial
							color={isSignaling ? "#ff4400" : "#333"}
							emissive={isSignaling ? "#ff2200" : "#000"}
							emissiveIntensity={isSignaling ? 0.5 : 0}
						/>
					</mesh>
				</group>

				{/* Legs - quick, darting */}
				{[-1, 1].map((side) => (
					<group key={`legs-${side}`} position={[side * 0.2, -0.15, 0]}>
						{/* Front leg */}
						<mesh position={[0, 0, 0.3]} rotation-z={side * 0.5}>
							<capsuleGeometry args={[0.05, 0.25, 4, 8]} />
							<meshStandardMaterial color={bodyColor} />
						</mesh>
						{/* Back leg */}
						<mesh position={[0, 0, -0.3]} rotation-z={side * 0.4}>
							<capsuleGeometry args={[0.05, 0.3, 4, 8]} />
							<meshStandardMaterial color={bodyColor} />
						</mesh>
					</group>
				))}
			</group>

			{/* Signal effect - radio wave rings when signaling */}
			{isSignaling && (
				<group position={[0, 0.6, 0]}>
					{[0, 1, 2].map((i) => (
						<mesh
							key={`wave-${i}`}
							rotation-x={-Math.PI / 2}
							scale={1 + i * 0.5}
							position={[0, i * 0.1, 0]}
						>
							<torusGeometry args={[0.3, 0.02, 8, 24]} />
							<meshBasicMaterial color="#ff4400" transparent opacity={0.6 - i * 0.2} />
						</mesh>
					))}
					<pointLight color="#ff4400" intensity={2} distance={8} />
				</group>
			)}

			{/* Health bar */}
			<group position={[0, 1.2, 0]}>
				<mesh>
					<planeGeometry args={[0.8, 0.06]} />
					<meshBasicMaterial color="#000" transparent opacity={0.5} side={THREE.DoubleSide} />
				</mesh>
				<mesh
					position={[-(1 - data.hp / data.maxHp) * 0.4, 0, 0.01]}
					scale-x={data.hp / data.maxHp}
				>
					<planeGeometry args={[0.8, 0.06]} />
					<meshBasicMaterial color="#88ff88" side={THREE.DoubleSide} />
				</mesh>
			</group>
		</group>
	);
}
