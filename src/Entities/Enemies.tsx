/**
 * Enemy entities (Tactical River Predators)
 * Gritty biological crocodilians with mud camo and stolen tactical gear
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
		groupRef.current.position.set(vehicleRef.current.position.x, 0.15, vehicleRef.current.position.z);

		// Face direction of movement
		if (vehicleRef.current.velocity.length() > 0.1) {
			const angle = Math.atan2(vehicleRef.current.velocity.x, vehicleRef.current.velocity.z);
			groupRef.current.rotation.y = angle;
		}

		// Procedural swimming animation
		const time = _state.clock.elapsedTime;
		const swimSpeed = data.isHeavy ? 4 : 6;
		const swimAmount = data.isHeavy ? 0.15 : 0.25;
		
		groupRef.current.children.forEach((child, i) => {
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
	const strapColor = "#1a1a1a"; // Stolen black nylon straps

	return (
		<group ref={groupRef}>
			{/* Head */}
			<group position={[0, 0.1, 1.2 * scale]} name="segment-0">
				{/* Main Head / Snout */}
				<mesh castShadow receiveShadow>
					<boxGeometry args={[0.6 * scale, 0.3 * scale, 1.1 * scale]} />
					<meshStandardMaterial color={bodyColor} roughness={0.9} />
				</mesh>
				{/* Mud Camo Markings */}
				<mesh position={[0, 0.16 * scale, 0.2 * scale]}>
					<boxGeometry args={[0.4 * scale, 0.02, 0.6 * scale]} />
					<meshStandardMaterial color={mudColor} />
				</mesh>
				{/* Cold, calculating eyes */}
				{[-1, 1].map((side) => (
					<mesh key={`eye-${side}`} position={[side * 0.22 * scale, 0.12 * scale, 0.35 * scale]}>
						<sphereGeometry args={[0.05 * scale, 8, 8]} />
						<meshBasicMaterial color="#ffaa00" />
					</mesh>
				))}
				{/* Stolen muzzle/webbing strap */}
				<mesh position={[0, -0.05 * scale, 0.4 * scale]}>
					<boxGeometry args={[0.65 * scale, 0.1 * scale, 0.1 * scale]} />
					<meshStandardMaterial color={strapColor} roughness={1} />
				</mesh>
			</group>

			{/* Body Segments with Webbing */}
			{[...Array(5)].map((_, i) => (
				<group key={`segment-${i}`} position={[0, 0.1, (0.4 - i * 0.75) * scale]} name={`segment-${i+1}`}>
					<mesh castShadow receiveShadow>
						<boxGeometry args={[(0.85 - i * 0.1) * scale, 0.5 * scale, 0.85 * scale]} />
						<meshStandardMaterial color={bodyColor} roughness={0.9} />
					</mesh>
					{/* Tactical Straps / Webbing Loops */}
					<mesh position={[0, 0.2 * scale, 0]}>
						<boxGeometry args={[(0.9 - i * 0.1) * scale, 0.12 * scale, 0.15 * scale]} />
						<meshStandardMaterial color={strapColor} roughness={1} />
					</mesh>
					{/* Irregular mud patches */}
					<mesh position={[0, 0.26 * scale, (Math.random() - 0.5) * 0.2 * scale]}>
						<boxGeometry args={[0.4 * scale, 0.02, 0.4 * scale]} />
						<meshStandardMaterial color={mudColor} />
					</mesh>
				</group>
			))}

			{/* Tail */}
			<group position={[0, 0.1, -3.2 * scale]} name="segment-6">
				<mesh castShadow>
					<boxGeometry args={[0.2 * scale, 0.2 * scale, 1.5 * scale]} />
					<meshStandardMaterial color={bodyColor} />
				</mesh>
			</group>

			{/* Health bar (Modern Military UI style) */}
			<group position={[0, 1.3 * scale, 0]}>
				<mesh position={[0, 0, 0]}>
					<planeGeometry args={[1.4, 0.08]} />
					<meshBasicMaterial color="#000" transparent opacity={0.5} side={THREE.DoubleSide} />
				</mesh>
				<mesh position={[-(1 - data.hp / data.maxHp) * 0.7, 0, 0.01]} scale-x={data.hp / data.maxHp}>
					<planeGeometry args={[1.4, 0.08]} />
					<meshBasicMaterial color="#ff4400" side={THREE.DoubleSide} />
				</mesh>
			</group>
		</group>
	);
}
