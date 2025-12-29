/**
 * Projectile System
 * High-performance instanced bullets
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { GAME_CONFIG } from "../utils/constants";

export interface Projectile {
	id: string;
	position: THREE.Vector3;
	velocity: THREE.Vector3;
	lifetime: number;
}

export interface ProjectilesHandle {
	spawn: (position: THREE.Vector3, direction: THREE.Vector3) => void;
	getProjectiles: () => Projectile[];
	remove: (id: string) => void;
}

export const Projectiles = forwardRef<ProjectilesHandle, object>((_, ref) => {
	const projectiles = useRef<Projectile[]>([]);
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const dummy = useMemo(() => new THREE.Object3D(), []);
	const tempVec = useMemo(() => new THREE.Vector3(), []);

	useImperativeHandle(ref, () => ({
		spawn: (position, direction) => {
			projectiles.current.push({
				// NOSONAR: Math.random is appropriate for non-cryptographic projectile IDs
				id: Math.random().toString(36).substr(2, 9),
				position: position.clone(),
				velocity: direction.clone().multiplyScalar(GAME_CONFIG.BULLET_SPEED),
				lifetime: 2, // 2 seconds
			});
		},
		getProjectiles: () => projectiles.current,
		remove: (id) => {
			projectiles.current = projectiles.current.filter((p) => p.id !== id);
		},
	}));

	useFrame((_state, delta) => {
		if (!meshRef.current) return;

		// Update positions
		for (let i = projectiles.current.length - 1; i >= 0; i--) {
			const p = projectiles.current[i];
			// Optimization: Use reusable vector for velocity * delta calculation
			tempVec.copy(p.velocity).multiplyScalar(delta);
			p.position.add(tempVec);
			p.lifetime -= delta;

			if (p.lifetime <= 0) {
				projectiles.current.splice(i, 1);
			}
		}

		// Update instanced mesh
		const count = projectiles.current.length;
		meshRef.current.count = count;

		for (let i = 0; i < count; i++) {
			const p = projectiles.current[i];
			dummy.position.copy(p.position);
			// Optimization: Avoid clone() by using tempVec
			tempVec.copy(p.position).add(p.velocity);
			dummy.lookAt(tempVec);
			dummy.updateMatrix();
			meshRef.current.setMatrixAt(i, dummy.matrix);
		}
		meshRef.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={meshRef} args={[undefined, undefined, 100]}>
			<boxGeometry args={[0.1, 0.1, 0.5]} />
			<meshBasicMaterial color="#ffff00" />
		</instancedMesh>
	);
});
