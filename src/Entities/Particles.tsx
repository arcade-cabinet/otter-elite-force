/**
 * Particle System
 * Visual effects: shell casings, blood splatters, explosions
 * Babylon.js implementation using individual sphere meshes
 */

import { Color3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";

export interface ParticleData {
	id: string;
	position: { x: number; y: number; z: number };
	velocity: { x: number; y: number; z: number };
	lifetime: number;
	type: "shell" | "blood" | "explosion";
}

interface ParticlesProps {
	particles: ParticleData[];
	onExpire?: (id: string) => void;
}

// Pre-computed particle colors
const PARTICLE_COLORS: Record<ParticleData["type"], Color3> = {
	shell: new Color3(1.0, 0.843, 0.0),
	blood: new Color3(0.545, 0.0, 0.0),
	explosion: new Color3(1.0, 0.271, 0.0),
};

interface ParticleState {
	lifetime: number;
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	type: ParticleData["type"];
}

export function Particles({ particles, onExpire }: ParticlesProps) {
	const scene = useScene();

	// Track internal state for particles to avoid mutating props
	const particleStateRef = useRef<Map<string, ParticleState>>(new Map());

	// Sync internal state with new particles from props
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
					x: particle.position.x,
					y: particle.position.y,
					z: particle.position.z,
					vx: particle.velocity.x,
					vy: particle.velocity.y,
					vz: particle.velocity.z,
					type: particle.type,
				});
			}
		}
	}, [particles]);

	// Animate particles each frame via scene observable
	useEffect(() => {
		if (!scene) return;

		let lastTime = performance.now();

		const obs = scene.onBeforeRenderObservable.add(() => {
			const now = performance.now();
			const delta = (now - lastTime) / 1000;
			lastTime = now;

			if (particleStateRef.current.size === 0) return;

			const toRemove: string[] = [];

			for (const [id, state] of particleStateRef.current) {
				state.lifetime -= delta;

				if (state.lifetime <= 0) {
					toRemove.push(id);
					continue;
				}

				// Update position
				state.x += state.vx * delta;
				state.y += state.vy * delta;
				state.z += state.vz * delta;

				// Apply gravity
				state.vy -= 9.8 * delta;

				// Update Babylon.js mesh position directly
				const mesh = scene.getMeshByName(`particle-${id}`);
				if (mesh) {
					mesh.position.x = state.x;
					mesh.position.y = state.y;
					mesh.position.z = state.z;
				}
			}

			// Remove expired particles
			for (const id of toRemove) {
				particleStateRef.current.delete(id);
				onExpire?.(id);
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, onExpire]);

	if (particles.length === 0) return null;

	return (
		<transformNode name="particleSystem">
			{particles.map((p) => {
				const color = PARTICLE_COLORS[p.type];
				return (
					<sphere
						key={p.id}
						name={`particle-${p.id}`}
						options={{ diameter: 0.2, segments: 4 }}
						positionX={p.position.x}
						positionY={p.position.y}
						positionZ={p.position.z}
					>
						<standardMaterial
							name={`particleMat-${p.id}`}
							diffuseColor={color}
							emissiveColor={color}
							alpha={0.8}
						/>
					</sphere>
				);
			})}
		</transformNode>
	);
}
