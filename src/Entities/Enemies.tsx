/**
 * Enemy entities (Iron Scale Cyborg Gators)
 * Procedurally generated with Yuka AI and mechanical armor plating
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Mesh, Group } from "three";
import * as THREE from "three";
import * as YUKA from "yuka";

export interface EnemyData {
	id: string;
	position: THREE.Vector3;
	hp: number;
	maxHp: number;
	isHeavy: boolean;
}

interface EnemyProps {
	data: EnemyData;
	targetPosition: THREE.Vector3;
	onDeath?: (id: string) => void;
}

export function Enemy({ data, targetPosition, onDeath }: EnemyProps) {
	const groupRef = useRef<Group>(null);
	const vehicleRef = useRef<YUKA.Vehicle | null>(null);
	const targetRef = useRef<YUKA.Vector3 | null>(null);

	// Setup Yuka AI
	useEffect(() => {
		const vehicle = new YUKA.Vehicle();
		vehicle.position.set(data.position.x, data.position.y, data.position.z);
		vehicle.maxSpeed = data.isHeavy ? 4 : 7;

		const seekBehavior = new YUKA.SeekBehavior();
		targetRef.current = new YUKA.Vector3();
		seekBehavior.target = targetRef.current;

		vehicle.steering.add(seekBehavior);
		vehicleRef.current = vehicle;

		return () => {
			vehicle.steering.clear();
		};
	}, [data.position.x, data.position.y, data.position.z, data.isHeavy]);

	// Update AI and sync with Three.js mesh
	useFrame((_state, delta) => {
		if (!vehicleRef.current || !groupRef.current) return;

		// Update target position
		if (targetRef.current) {
			targetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
		}

		// Update Yuka AI
		vehicleRef.current.update(delta);

		// Sync Three.js mesh with Yuka vehicle
		groupRef.current.position.set(vehicleRef.current.position.x, 0.2, vehicleRef.current.position.z);

		// Face direction of movement
		if (vehicleRef.current.velocity.length() > 0.1) {
			const angle = Math.atan2(vehicleRef.current.velocity.x, vehicleRef.current.velocity.z);
			groupRef.current.rotation.y = angle;
		}

		// Procedural animation (swimming snake-like)
		const time = _state.clock.elapsedTime;
		const swimSpeed = data.isHeavy ? 5 : 8;
		const swimAmount = data.isHeavy ? 0.1 : 0.2;
		
		// Body segments waddle
		groupRef.current.children.forEach((child, i) => {
			if (child.name.startsWith("segment")) {
				child.rotation.y = Math.sin(time * swimSpeed - i * 0.5) * swimAmount;
			}
		});
	});

	// Check if dead
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const scale = data.isHeavy ? 1.5 : 1;
	const bodyColor = data.isHeavy ? "#1a2a1a" : "#2d4d2d";
	const armorColor = "#444444";
	const eyeColor = "#ff0000";

	// Chronal glitch effect (Future-tech visual)
	const glitchRef = useRef<THREE.PointLight>(null);
	useFrame(({ clock }) => {
		if (glitchRef.current) {
			glitchRef.current.intensity = Math.random() > 0.95 ? 2 : 0.5;
		}
	});

	return (
		<group ref={groupRef}>
			{/* Chronal Distortion Light */}
			<pointLight ref={glitchRef} position={[0, 1, 0]} color="#00ffff" distance={3} />
			
			{/* --- CYBORG GATOR BODY --- */}
			
			{/* Head (Mechanical) */}
			<group position={[0, 0.2, 1.2 * scale]} name="segment-0">
				{/* Snout */}
				<mesh castShadow receiveShadow>
					<boxGeometry args={[0.6 * scale, 0.3 * scale, 1 * scale]} />
					<meshStandardMaterial color={bodyColor} roughness={0.8} />
				</mesh>
				{/* Jaw (Mechanical) */}
				<mesh position={[0, -0.15 * scale, 0.1 * scale]} castShadow>
					<boxGeometry args={[0.55 * scale, 0.15 * scale, 0.8 * scale]} />
					<meshStandardMaterial color={armorColor} metalness={0.8} roughness={0.2} />
				</mesh>
				{/* Cyber Eyes (Glowing Red) */}
				{[-1, 1].map((side) => (
					<mesh key={`eye-${side}`} position={[side * 0.25 * scale, 0.15 * scale, 0.3 * scale]}>
						<sphereGeometry args={[0.06 * scale, 8, 8]} />
						<meshBasicMaterial color={eyeColor} />
						<pointLight distance={1} intensity={0.5} color={eyeColor} />
					</mesh>
				))}
				{/* Head Armor Plate */}
				<mesh position={[0, 0.2 * scale, -0.1 * scale]}>
					<boxGeometry args={[0.7 * scale, 0.1 * scale, 0.6 * scale]} />
					<meshStandardMaterial color={armorColor} metalness={0.5} />
				</mesh>
			</group>

			{/* Main Body Segments */}
			{[...Array(4)].map((_, i) => (
				<group key={`segment-${i}`} position={[0, 0.2, (0.4 - i * 0.7) * scale]} name={`segment-${i+1}`}>
					<mesh castShadow receiveShadow>
						<boxGeometry args={[(0.8 - i * 0.1) * scale, 0.5 * scale, 0.8 * scale]} />
						<meshStandardMaterial color={bodyColor} roughness={0.8} />
					</mesh>
					{/* Back Armor Plating */}
					<mesh position={[0, 0.3 * scale, 0]}>
						<boxGeometry args={[(0.6 - i * 0.1) * scale, 0.15 * scale, 0.6 * scale]} />
						<meshStandardMaterial color={armorColor} metalness={0.7} roughness={0.3} />
					</mesh>
					{/* Spikes/Scales */}
					<mesh position={[0, 0.45 * scale, 0]} rotation-x={Math.PI / 4}>
						<boxGeometry args={[0.1 * scale, 0.2 * scale, 0.1 * scale]} />
						<meshStandardMaterial color={armorColor} />
					</mesh>
				</group>
			))}

			{/* Tail Tip */}
			<group position={[0, 0.2, -2.4 * scale]} name="segment-5">
				<mesh castShadow>
					<boxGeometry args={[0.2 * scale, 0.2 * scale, 1.2 * scale]} />
					<meshStandardMaterial color={bodyColor} />
				</mesh>
				{/* Tail Fin (Mechanical) */}
				<mesh position={[0, 0, -0.4 * scale]} rotation-x={Math.PI / 2}>
					<planeGeometry args={[0.6 * scale, 0.8 * scale]} />
					<meshStandardMaterial color={armorColor} metalness={0.8} side={THREE.DoubleSide} />
				</mesh>
			</group>

			{/* Health bar */}
			<group position={[0, 1.2 * scale, 0]}>
				<mesh position={[0, 0, 0]}>
					<planeGeometry args={[1.2, 0.12]} />
					<meshBasicMaterial color="#330000" side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[-(1 - data.hp / data.maxHp) * 0.6, 0, 0.01]} scale-x={data.hp / data.maxHp}>
					<planeGeometry args={[1.2, 0.12]} />
					<meshBasicMaterial color="#ff3300" side={THREE.DoubleSide} />
				</mesh>
			</group>
		</group>
	);
}
