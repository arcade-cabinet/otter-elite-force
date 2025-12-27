/**
 * Particle System
 * Visual effects: shell casings, blood splatters, explosions
 */

import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

export interface ParticleData {
	id: string;
	position: THREE.Vector3;
	velocity: THREE.Vector3;
	lifetime: number;
	maxLifetime: number;
	type: "shell" | "blood" | "explosion" | "oil";
}

export interface ParticlesHandle {
	spawn: (config: Omit<ParticleData, "id" | "lifetime">) => void;
}

const MAX_PARTICLES = 1000;

export const Particles = forwardRef<ParticlesHandle, { onExpire?: (id: string) => void }>(
	({ onExpire }, ref) => {
		const pointsRef = useRef<THREE.Points>(null);
		const internalParticles = useRef<ParticleData[]>([]);

		const [positions, colors, sizes] = useMemo(() => {
			return [
				new Float32Array(MAX_PARTICLES * 3),
				new Float32Array(MAX_PARTICLES * 3),
				new Float32Array(MAX_PARTICLES),
			];
		}, []);

		useImperativeHandle(ref, () => ({
			spawn: (config) => {
				if (internalParticles.current.length >= MAX_PARTICLES) return;
				internalParticles.current.push({
					...config,
					id: crypto.randomUUID(),
					lifetime: config.maxLifetime,
					position: config.position.clone(),
					velocity: config.velocity.clone(),
				});
			},
		}));

		useFrame((_state, delta) => {
			if (!pointsRef.current) return;

			const particles = internalParticles.current;
			let activeCount = 0;

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.lifetime -= delta;

				if (p.lifetime <= 0) {
					onExpire?.(p.id);
					particles.splice(i, 1);
					continue;
				}

				p.position.add(p.velocity.clone().multiplyScalar(delta));
				if (p.type !== "oil") {
					p.velocity.y -= 9.8 * delta; // Gravity
				}

				const idx3 = activeCount * 3;
				positions[idx3] = p.position.x;
				positions[idx3 + 1] = p.position.y;
				positions[idx3 + 2] = p.position.z;

				let r = 1, g = 1, b = 1;
				switch (p.type) {
					case "shell":
						[r, g, b] = [1, 0.84, 0]; // #FFD700
						break;
					case "blood":
						[r, g, b] = [0.55, 0, 0]; // #8B0000
						break;
					case "explosion":
						[r, g, b] = [1, 0.27, 0]; // #FF4500
						break;
					case "oil":
						[r, g, b] = [0.1, 0.1, 0.1]; // #1a1a1a
						break;
				}
				colors[idx3] = r;
				colors[idx3 + 1] = g;
				colors[idx3 + 2] = b;

				sizes[activeCount] = (p.lifetime / p.maxLifetime) * 0.3;
				activeCount++;
			}

			const geometry = pointsRef.current.geometry;
			geometry.setAttribute("position", new THREE.BufferAttribute(positions.subarray(0, activeCount * 3), 3));
			geometry.setAttribute("color", new THREE.BufferAttribute(colors.subarray(0, activeCount * 3), 3));
			geometry.setAttribute("size", new THREE.BufferAttribute(sizes.subarray(0, activeCount), 1));
			
			// Use setDrawRange to only render active particles
			geometry.setDrawRange(0, activeCount);
		});

		return (
			<points ref={pointsRef}>
				<bufferGeometry />
				<pointsMaterial
					size={1}
					vertexColors
					sizeAttenuation
					transparent
					opacity={0.8}
					depthWrite={false}
				/>
			</points>
		);
	},
);
