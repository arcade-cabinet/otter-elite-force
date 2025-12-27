/**
 * Gator Predator
 * Gritty biological crocodilians with mud camo and ambush mechanics
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";
import * as YUKA from "yuka";
import { Weapon } from "../Weapon";
import { GatorAI } from "./GatorAI";
import type { EnemyProps, GatorData } from "./types";

export function Gator({ data, targetPosition, onDeath }: EnemyProps<GatorData>) {
	const groupRef = useRef<Group>(null);
	const bodyRef = useRef<Group>(null);
	const vehicleRef = useRef<YUKA.Vehicle | null>(null);
	const aiRef = useRef<GatorAI | null>(null);
	const ambushTimer = useRef(0);

	// Setup Yuka AI
	useEffect(() => {
		const vehicle = new YUKA.Vehicle();
		vehicle.position.set(data.position.x, data.position.y, data.position.z);

		const entityManager = new YUKA.EntityManager();
		aiRef.current = new GatorAI(vehicle, entityManager);
		vehicleRef.current = vehicle;

		return () => {
			vehicle.steering.clear();
			entityManager.clear();
		};
	}, [data.position.x, data.position.y, data.position.z]);

	// Update AI and sync with Three.js mesh
	useFrame((_state, delta) => {
		if (!vehicleRef.current || !groupRef.current || !bodyRef.current || !aiRef.current) return;

		aiRef.current.update(delta, targetPosition, data.hp, data.suppression);
		const currentState = aiRef.current.getState();

		// Manage Ambush timer within frame loop
		if (currentState === "AMBUSH" && ambushTimer.current <= 0) {
			ambushTimer.current = 3; // 3 seconds
		} else if (currentState !== "AMBUSH") {
			ambushTimer.current = 0;
		}

		if (ambushTimer.current > 0) {
			ambushTimer.current -= delta;
			if (ambushTimer.current <= 0) {
				// Transition logic handled by GatorAI.ts based on distance/suppression
			}
		}

		const isAmbushing = currentState === "AMBUSH";

		// Animate rising/submerging based on state
		const targetY = isAmbushing ? 0.8 : currentState === "SUPPRESSED" ? -0.2 : 0.15;
		bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, targetY, 0.1);

		// Tilt body up when ambushing
		const targetRotationX = isAmbushing ? -0.4 : 0;
		bodyRef.current.rotation.x = THREE.MathUtils.lerp(
			bodyRef.current.rotation.x,
			targetRotationX,
			0.1,
		);

		// Sync Three.js mesh with Yuka vehicle
		groupRef.current.position.set(vehicleRef.current.position.x, 0, vehicleRef.current.position.z);

		// Face direction of movement (or player if ambushing)
		if (isAmbushing) {
			const lookDir = targetPosition.clone().sub(groupRef.current.position);
			const targetAngle = Math.atan2(lookDir.x, lookDir.z);
			groupRef.current.rotation.y = THREE.MathUtils.lerp(
				groupRef.current.rotation.y,
				targetAngle,
				0.1,
			);
		} else if (vehicleRef.current.velocity.length() > 0.1) {
			const angle = Math.atan2(vehicleRef.current.velocity.x, vehicleRef.current.velocity.z);
			groupRef.current.rotation.y = angle;
		}

		// Procedural swimming animation
		const time = _state.clock.elapsedTime;
		const swimSpeed = currentState === "RETREAT" ? 10 : isAmbushing ? 2 : data.isHeavy ? 4 : 6;
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
	const mudColor = "#3d3329";
	const strapColor = "#1a1a1a";

	return (
		<group ref={groupRef}>
			<group ref={bodyRef}>
				{/* Head / Chest */}
				<group position={[0, 0.1, 1.2 * scale]} name="segment-0">
					<mesh castShadow receiveShadow>
						<boxGeometry args={[0.6 * scale, 0.3 * scale, 1.1 * scale]} />
						<meshStandardMaterial color={bodyColor} roughness={0.9} />
					</mesh>
					<mesh position={[0, 0.2 * scale, 0]}>
						<boxGeometry args={[0.7 * scale, 0.15 * scale, 0.8 * scale]} />
						<meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
					</mesh>
					<mesh position={[0, 0.3 * scale, 0.2 * scale]}>
						<boxGeometry args={[0.4 * scale, 0.02, 0.6 * scale]} />
						<meshStandardMaterial color={mudColor} />
					</mesh>
					{[-1, 1].map((side) => (
						<mesh
							key={`${data.id}-eye-${side}`}
							position={[side * 0.22 * scale, 0.12 * scale, 0.35 * scale]}
						>
							<sphereGeometry args={[0.05 * scale, 8, 8]} />
							<meshBasicMaterial color="#ffaa00" />
						</mesh>
					))}

					<group position={[0, 0.4 * scale, 0.2 * scale]} scale={isAmbushing ? 1 : 0}>
						<Weapon weaponId="fish-cannon" />
					</group>
				</group>

				{[...Array(5)].map((_, i) => (
					<group
						key={`${data.id}-segment-${i}`}
						position={[0, 0.1, (0.4 - i * 0.75) * scale]}
						name={`segment-${i + 1}`}
					>
						<mesh castShadow receiveShadow>
							<boxGeometry args={[(0.85 - i * 0.1) * scale, 0.5 * scale, 0.85 * scale]} />
							<meshStandardMaterial color={bodyColor} roughness={0.9} />
						</mesh>
						<mesh position={[0, 0.3 * scale, 0]}>
							<boxGeometry args={[(0.75 - i * 0.1) * scale, 0.1 * scale, 0.6 * scale]} />
							<meshStandardMaterial color="#333" metalness={0.5} />
						</mesh>
						<mesh position={[0, 0.2 * scale, 0]}>
							<boxGeometry args={[(0.9 - i * 0.1) * scale, 0.12 * scale, 0.15 * scale]} />
							<meshStandardMaterial color={strapColor} roughness={1} />
						</mesh>
					</group>
				))}

				<group position={[0, 0.1, -3.2 * scale]} name="segment-6">
					<mesh castShadow>
						<boxGeometry args={[0.2 * scale, 0.2 * scale, 1.5 * scale]} />
						<meshStandardMaterial color={bodyColor} />
					</mesh>
				</group>
			</group>

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
