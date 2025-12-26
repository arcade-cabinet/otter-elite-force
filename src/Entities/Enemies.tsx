/**
 * Enemy entities (Gators)
 * Procedurally generated with Yuka AI
 */

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as YUKA from "yuka";
import type { Mesh } from "three";

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
	const meshRef = useRef<Mesh>(null);
	const vehicleRef = useRef<YUKA.Vehicle>();
	const targetRef = useRef<YUKA.Vector3>();

	// Setup Yuka AI
	useEffect(() => {
		const vehicle = new YUKA.Vehicle();
		vehicle.position.copy(data.position as any);
		vehicle.maxSpeed = data.isHeavy ? 4 : 7;

		const seekBehavior = new YUKA.SeekBehavior();
		targetRef.current = new YUKA.Vector3(
			targetPosition.x,
			targetPosition.y,
			targetPosition.z,
		);
		seekBehavior.target = targetRef.current;

		vehicle.steering.add(seekBehavior);
		vehicleRef.current = vehicle;

		return () => {
			vehicle.steering.clear();
		};
	}, [data.position, data.isHeavy, targetPosition]);

	// Update AI and sync with Three.js mesh
	useFrame((state, delta) => {
		if (!vehicleRef.current || !meshRef.current) return;

		// Update target position
		if (targetRef.current) {
			targetRef.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
		}

		// Update Yuka AI
		vehicleRef.current.update(delta);

		// Sync Three.js mesh with Yuka vehicle
		meshRef.current.position.set(
			vehicleRef.current.position.x,
			0.4,
			vehicleRef.current.position.z,
		);

		// Face direction of movement
		if (vehicleRef.current.velocity.length() > 0.1) {
			const angle = Math.atan2(
				vehicleRef.current.velocity.x,
				vehicleRef.current.velocity.z,
			);
			meshRef.current.rotation.y = angle;
		}
	});

	// Check if dead
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const size = data.isHeavy ? [1.5, 0.8, 3] : [1, 0.8, 2];
	const color = data.isHeavy ? "#112211" : "#335533";

	return (
		<mesh ref={meshRef} castShadow receiveShadow>
			<boxGeometry args={size as [number, number, number]} />
			<meshStandardMaterial color={color} roughness={0.7} />

			{/* Health bar */}
			<group position={[0, 1, 0]}>
				<mesh position={[0, 0, 0]}>
					<planeGeometry args={[1, 0.1]} />
					<meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} />
				</mesh>
				<mesh
					position={[-(1 - data.hp / data.maxHp) / 2, 0, 0.01]}
					scale-x={data.hp / data.maxHp}
				>
					<planeGeometry args={[1, 0.1]} />
					<meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} />
				</mesh>
			</group>
		</mesh>
	);
}
