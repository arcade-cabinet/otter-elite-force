/**
 * Particle System
 * Visual effects: shell casings, blood splatters, explosions
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Points } from "three";
import * as THREE from "three";

export interface ParticleData {
	id: string;
	position: THREE.Vector3;
	velocity: THREE.Vector3;
	lifetime: number;
	type: "shell" | "blood" | "explosion";
}

interface ParticlesProps {
	particles: ParticleData[];
	onExpire?: (id: string) => void;
}

// Pre-computed particle colors to avoid recreation
const PARTICLE_COLORS = {
	shell: new THREE.Color("#FFD700"),
	blood: new THREE.Color("#8B0000"),
	explosion: new THREE.Color("#FF4500"),
};

export function Particles({ particles, onExpire }: ParticlesProps) {
	const pointsRef = useRef<Points>(null);
	// Track internal state for particles to avoid mutating props
	const particleStateRef = useRef<
		Map<string, { lifetime: number; position: THREE.Vector3; velocity: THREE.Vector3 }>
	>(new Map());

	// Sync internal state with new particles
	useEffect(() => {
		const currentIds = new Set(particles.map((p) => p.id));
		// Remove particles no longer in props
		for (const id of particleStateRef.current.keys()) {
			if (!currentIds.has(id)) {
				particleStateRef.current.delete(id);
			}
		}
		// Add new particles
		for (const particle of particles) {
			if (!particleStateRef.current.has(particle.id)) {
				particleStateRef.current.set(particle.id, {
					lifetime: particle.lifetime,
					position: particle.position.clone(),
					velocity: particle.velocity.clone(),
				});
			}
		}
	}, [particles]);

	// Update particles
	useFrame((_state, delta) => {
		if (!pointsRef.current || particleStateRef.current.size === 0) return;

		const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
		const count = particleStateRef.current.size;

		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);
		const sizes = new Float32Array(count);

		const toRemove: string[] = [];
		let i = 0;

		for (const [id, state] of particleStateRef.current) {
			// Update lifetime
			state.lifetime -= delta;

			if (state.lifetime <= 0) {
				toRemove.push(id);
				continue;
			}

			// Update position (using internal cloned state, not props)
			state.position.x += state.velocity.x * delta;
			state.position.y += state.velocity.y * delta;
			state.position.z += state.velocity.z * delta;

			// Apply gravity
			state.velocity.y -= 9.8 * delta;

			// Add to buffers
			positions[i * 3] = state.position.x;
			positions[i * 3 + 1] = state.position.y;
			positions[i * 3 + 2] = state.position.z;

			// Color based on type (find particle type from props)
			const particle = particles.find((p) => p.id === id);
			const color = PARTICLE_COLORS[particle?.type ?? "shell"];
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;

			// Size fades with lifetime
			sizes[i] = state.lifetime * 0.5;
			i++;
		}

		// Remove expired particles
		for (const id of toRemove) {
			particleStateRef.current.delete(id);
			onExpire?.(id);
		}

		// Update geometry with pre-allocated typed arrays
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(positions.slice(0, i * 3), 3),
		);
		geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors.slice(0, i * 3), 3));
		geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes.slice(0, i), 1));
	});

	if (particles.length === 0) return null;

	return (
		<points ref={pointsRef}>
			<bufferGeometry />
			<pointsMaterial
				size={0.2}
				vertexColors
				sizeAttenuation
				transparent
				opacity={0.8}
				depthWrite={false}
			/>
		</points>
	);
}
