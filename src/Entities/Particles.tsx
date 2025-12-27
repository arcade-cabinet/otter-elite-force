/**
 * Particle System
 * Visual effects: shell casings, blood splatters, explosions
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface ParticleData {
	id: string;
	position: THREE.Vector3;
	velocity: THREE.Vector3;
	lifetime: number;
	type: "shell" | "blood" | "explosion" | "oil";
}

interface ParticlesProps {
	particles: ParticleData[];
	onExpire?: (id: string) => void;
}

export function Particles({ particles, onExpire }: ParticlesProps) {
	const pointsRef = useRef<THREE.Points>(null);
	// Use a ref to store internal state of particles to avoid prop mutation
	const internalParticles = useRef<ParticleData[]>([]);

	// Sync internal particles with props when they are added
	useEffect(() => {
		// Only add new particles that aren't already in internal state
		const currentIds = new Set(internalParticles.current.map((p) => p.id));
		const newParticles = particles.filter((p) => !currentIds.has(p.id));

		if (newParticles.length > 0) {
			// Clone new particles to avoid mutation of external state
			const cloned = newParticles.map((p) => ({
				...p,
				position: p.position.clone(),
				velocity: p.velocity.clone(),
			}));
			internalParticles.current = [...internalParticles.current, ...cloned];
		}

		// Remove particles that are no longer in props
		const propIds = new Set(particles.map((p) => p.id));
		internalParticles.current = internalParticles.current.filter((p) => propIds.has(p.id));
	}, [particles]);

	useFrame((_state, delta) => {
		if (!pointsRef.current) return;
		if (internalParticles.current.length === 0) {
			// Clear attributes if no particles
			pointsRef.current.geometry.deleteAttribute("position");
			pointsRef.current.geometry.deleteAttribute("color");
			pointsRef.current.geometry.deleteAttribute("size");
			return;
		}

		const geometry = pointsRef.current.geometry;
		const positions: number[] = [];
		const colors: number[] = [];
		const sizes: number[] = [];

		const toRemove: string[] = [];

		for (const particle of internalParticles.current) {
			particle.lifetime -= delta;
			if (particle.lifetime <= 0) {
				toRemove.push(particle.id);
				continue;
			}

			particle.position.add(particle.velocity.clone().multiplyScalar(delta));
			if (particle.type !== "oil") {
				particle.velocity.y -= 9.8 * delta; // Gravity
			}

			positions.push(particle.position.x, particle.position.y, particle.position.z);

			let color: THREE.Color;
			switch (particle.type) {
				case "shell":
					color = new THREE.Color("#FFD700");
					break;
				case "blood":
					color = new THREE.Color("#8B0000");
					break;
				case "explosion":
					color = new THREE.Color("#FF4500");
					break;
				case "oil":
					color = new THREE.Color("#1a1a1a");
					break;
				default:
					color = new THREE.Color("#fff");
			}
			colors.push(color.r, color.g, color.b);
			sizes.push(particle.lifetime * 0.5);
		}

		if (toRemove.length > 0) {
			// Notify parent about expired particles
			for (const id of toRemove) {
				onExpire?.(id);
			}
			// Update internal state
			internalParticles.current = internalParticles.current.filter((p) => !toRemove.includes(p.id));
		}

		geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
		geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
		geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
	});

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
