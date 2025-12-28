/**
 * Particle System
 * Visual effects using strata ParticleEmitter.
 * Handles shell casings, blood splatters, explosions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ParticleEmitter, type ParticleEmitterRef } from "../lib/strata/core";
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

// Particle colors by type
const PARTICLE_COLORS = {
	shell: { start: 0xffd700, end: 0xaa8800 },
	blood: { start: 0x8b0000, end: 0x550000 },
	explosion: { start: 0xff4500, end: 0xff0000 },
};

/**
 * Particle effect component using strata ParticleEmitter.
 */
export function Particles({ particles, onExpire }: ParticlesProps) {
	const emitterRefs = useRef<Map<string, ParticleEmitterRef>>(new Map());
	const [activeParticles, setActiveParticles] = useState<ParticleData[]>([]);

	// Sync incoming particles with active particles
	useEffect(() => {
		const currentIds = new Set(particles.map((p) => p.id));
		const activeIds = new Set(activeParticles.map((p) => p.id));

		// Add new particles
		const newParticles = particles.filter((p) => !activeIds.has(p.id));
		if (newParticles.length > 0) {
			setActiveParticles((prev) => [...prev, ...newParticles]);
		}

		// Clean up expired particles
		const expiredIds = Array.from(activeIds).filter((id) => !currentIds.has(id));
		if (expiredIds.length > 0) {
			setActiveParticles((prev) => prev.filter((p) => !expiredIds.includes(p.id)));
			emitterRefs.current.forEach((_, id) => {
				if (expiredIds.includes(id)) {
					emitterRefs.current.delete(id);
				}
			});
		}
	}, [particles, activeParticles]);

	// Track lifetimes and trigger bursts
	useFrame((_, delta) => {
		const toExpire: string[] = [];

		setActiveParticles((prev) =>
			prev
				.map((p) => {
					const remaining = p.lifetime - delta;
					if (remaining <= 0) {
						toExpire.push(p.id);
						return null;
					}
					return { ...p, lifetime: remaining };
				})
				.filter((p): p is ParticleData => p !== null),
		);

		// Notify parent of expired particles
		toExpire.forEach((id) => {
			onExpire?.(id);
			emitterRefs.current.delete(id);
		});
	});

	const setEmitterRef = useCallback((id: string, ref: ParticleEmitterRef | null) => {
		if (ref) {
			emitterRefs.current.set(id, ref);
			// Trigger a burst when the emitter is created
			ref.burst(5);
		} else {
			emitterRefs.current.delete(id);
		}
	}, []);

	if (activeParticles.length === 0) return null;

	return (
		<>
			{activeParticles.map((particle) => {
				const colors = PARTICLE_COLORS[particle.type];
				return (
					<ParticleEmitter
						key={particle.id}
						ref={(ref) => setEmitterRef(particle.id, ref)}
						position={[particle.position.x, particle.position.y, particle.position.z]}
						velocity={[particle.velocity.x, particle.velocity.y, particle.velocity.z]}
						velocityVariance={[2, 2, 2]}
						maxParticles={20}
						emissionRate={0} // Burst only
						lifetime={particle.lifetime}
						lifetimeVariance={0.2}
						startColor={colors.start}
						endColor={colors.end}
						startSize={0.15}
						endSize={0.05}
						startOpacity={1}
						endOpacity={0}
						forces={{
							gravity: new THREE.Vector3(0, -9.8, 0),
						}}
						blending={THREE.AdditiveBlending}
						depthWrite={false}
					/>
				);
			})}
		</>
	);
}

/**
 * Standalone particle burst effect using strata.
 */
export function ParticleBurst({
	position,
	color = 0xff4500,
	count = 20,
	onComplete,
}: {
	position: [number, number, number];
	color?: number;
	count?: number;
	onComplete?: () => void;
}) {
	const emitterRef = useRef<ParticleEmitterRef>(null);
	const [active, setActive] = useState(true);

	useEffect(() => {
		if (emitterRef.current) {
			emitterRef.current.burst(count);
		}

		// Auto-remove after burst completes
		const timer = setTimeout(() => {
			setActive(false);
			onComplete?.();
		}, 1500);

		return () => clearTimeout(timer);
	}, [count, onComplete]);

	if (!active) return null;

	return (
		<ParticleEmitter
			ref={emitterRef}
			position={position}
			velocity={[0, 5, 0]}
			velocityVariance={[5, 5, 5]}
			maxParticles={count}
			emissionRate={0}
			lifetime={1}
			lifetimeVariance={0.3}
			startColor={color}
			endColor={0x000000}
			startSize={0.2}
			endSize={0}
			startOpacity={1}
			endOpacity={0}
			forces={{
				gravity: new THREE.Vector3(0, -15, 0),
			}}
			blending={THREE.AdditiveBlending}
		/>
	);
}
