/**
 * Particle System
 * Visual effects: shell casings, blood splatters, explosions
 */

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Points } from "three";

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

export function Particles({ particles, onExpire }: ParticlesProps) {
	const particlesRef = useRef<ParticleData[]>(particles);
	const pointsRef = useRef<Points>(null);
	const geometryRef = useRef<THREE.BufferGeometry>();

	// Update particle reference
	useEffect(() => {
		particlesRef.current = particles;
	}, [particles]);

	// Setup geometry
	useEffect(() => {
		const geometry = new THREE.BufferGeometry();
		geometryRef.current = geometry;

		return () => {
			geometry.dispose();
		};
	}, []);

	// Update particles
	useFrame((state, delta) => {
		if (!geometryRef.current || particlesRef.current.length === 0) return;

		const positions: number[] = [];
		const colors: number[] = [];
		const sizes: number[] = [];

		const toRemove: string[] = [];

		particlesRef.current.forEach((particle) => {
			// Update lifetime
			particle.lifetime -= delta;

			if (particle.lifetime <= 0) {
				toRemove.push(particle.id);
				return;
			}

			// Update position
			particle.position.add(particle.velocity.clone().multiplyScalar(delta));

			// Apply gravity
			particle.velocity.y -= 9.8 * delta;

			// Add to buffers
			positions.push(particle.position.x, particle.position.y, particle.position.z);

			// Color based on type
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
			}
			colors.push(color.r, color.g, color.b);

			// Size fades with lifetime
			const size = particle.lifetime * 0.5;
			sizes.push(size);
		});

		// Remove expired particles
		toRemove.forEach((id) => onExpire?.(id));

		// Update geometry
		geometryRef.current.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(positions, 3),
		);
		geometryRef.current.setAttribute(
			"color",
			new THREE.Float32BufferAttribute(colors, 3),
		);
		geometryRef.current.setAttribute(
			"size",
			new THREE.Float32BufferAttribute(sizes, 1),
		);
	});

	if (particles.length === 0) return null;

	return (
		<points ref={pointsRef}>
			<bufferGeometry ref={geometryRef as any} />
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
