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
		Map<
			string,
			{
				lifetime: number;
				position: THREE.Vector3;
				velocity: THREE.Vector3;
				type: "shell" | "blood" | "explosion";
			}
		>
	>(new Map());

	// Reusable buffers to avoid allocation every frame
	const buffersRef = useRef({
		positions: new Float32Array(3000), // Start with capacity for 1000 particles
		colors: new Float32Array(3000),
		sizes: new Float32Array(1000),
	});

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
					type: particle.type, // Store type to avoid O(N) lookup in useFrame
				});
			}
		}
	}, [particles]);

	// Update particles
	useFrame((_state, delta) => {
		if (!pointsRef.current || particleStateRef.current.size === 0) return;

		const geometry = pointsRef.current.geometry as THREE.BufferGeometry;
		const count = particleStateRef.current.size;

		// Resize buffers if needed
		if (buffersRef.current.sizes.length < count) {
			const newCapacity = count * 2; // Double capacity
			buffersRef.current.positions = new Float32Array(newCapacity * 3);
			buffersRef.current.colors = new Float32Array(newCapacity * 3);
			buffersRef.current.sizes = new Float32Array(newCapacity);
		}

		const { positions, colors, sizes } = buffersRef.current;
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

			// Color based on type (using stored type, O(1) lookup)
			const color = PARTICLE_COLORS[state.type];
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

		// Update geometry with reused typed arrays
		// We use setAttribute with new BufferAttribute because the underlying array might have changed (resizing)
		// but usually it is the same array instance, just updated content.
		// Note: BufferAttribute takes the array and length.
		// If we didn't resize, we could technically just update the existing attribute's array content.
		// However, for simplicity and safety against resizing, we set the attribute.
		// Since we pass the SAME Float32Array instance (mostly), this is efficient enough.
		// The key optimization is that we didn't create new Float32Array(count * 3) this frame.
		// And we didn't use .slice().

		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
		geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

		// Set draw range to only render active particles
		geometry.setDrawRange(0, i);

		geometry.attributes.position.needsUpdate = true;
		geometry.attributes.color.needsUpdate = true;
		geometry.attributes.size.needsUpdate = true;
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
