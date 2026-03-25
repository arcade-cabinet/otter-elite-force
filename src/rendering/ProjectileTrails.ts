/**
 * Projectile Particle Trails — US-027
 *
 * Renders trailing particles behind projectiles in Phaser.
 *
 * - 2-3 trailing particles per frame per projectile
 * - Particles fade and shrink over 0.3 seconds
 * - Color matches projectile type
 * - Object pooling with max 100 particles
 */

import type { World } from "koota";
import type Phaser from "phaser";
import { IsProjectile } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";

const TILE_SIZE = 32;

/** Max particles in the pool */
const MAX_PARTICLES = 100;
/** Particle lifetime in seconds */
const PARTICLE_LIFETIME = 0.3;
/** Particles spawned per projectile per frame */
const PARTICLES_PER_FRAME = 2;
/** Starting radius of a particle */
const PARTICLE_START_RADIUS = 3;

/** Default projectile trail color (orange-ish for arrows/bolts) */
const DEFAULT_TRAIL_COLOR = 0xffaa44;

interface Particle {
	x: number;
	y: number;
	age: number;
	lifetime: number;
	color: number;
	active: boolean;
}

export class ProjectileTrailSystem {
	private particles: Particle[] = [];
	private poolIndex = 0;

	constructor() {
		// Pre-allocate particle pool
		for (let i = 0; i < MAX_PARTICLES; i++) {
			this.particles.push({
				x: 0,
				y: 0,
				age: 0,
				lifetime: PARTICLE_LIFETIME,
				color: DEFAULT_TRAIL_COLOR,
				active: false,
			});
		}
	}

	/**
	 * Spawn trail particles for all projectiles and advance existing particles.
	 *
	 * @param delta Time elapsed in seconds
	 */
	update(world: World, delta: number): void {
		// Spawn new particles for each projectile
		const projectiles = world.query(IsProjectile, Position);
		for (const entity of projectiles) {
			const pos = entity.get(Position);
			if (!pos) continue;

			const worldX = pos.x * TILE_SIZE + TILE_SIZE / 2;
			const worldY = pos.y * TILE_SIZE + TILE_SIZE / 2;

			for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
				this.spawnParticle(
					worldX + (Math.random() - 0.5) * 4,
					worldY + (Math.random() - 0.5) * 4,
					DEFAULT_TRAIL_COLOR,
				);
			}
		}

		// Age all active particles
		for (const particle of this.particles) {
			if (!particle.active) continue;
			particle.age += delta;
			if (particle.age >= particle.lifetime) {
				particle.active = false;
			}
		}
	}

	/**
	 * Render all active particles.
	 */
	render(graphics: Phaser.GameObjects.Graphics): void {
		for (const particle of this.particles) {
			if (!particle.active) continue;

			const progress = particle.age / particle.lifetime;
			const alpha = 1 - progress;
			const radius = PARTICLE_START_RADIUS * (1 - progress * 0.7);

			graphics.fillStyle(particle.color, alpha);
			graphics.fillCircle(particle.x, particle.y, Math.max(0.5, radius));
		}
	}

	/**
	 * Number of currently active particles.
	 */
	get activeCount(): number {
		return this.particles.filter((p) => p.active).length;
	}

	/**
	 * Total pool size.
	 */
	get poolSize(): number {
		return this.particles.length;
	}

	/**
	 * Reset all particles (call when leaving scene).
	 */
	reset(): void {
		for (const p of this.particles) {
			p.active = false;
		}
		this.poolIndex = 0;
	}

	private spawnParticle(x: number, y: number, color: number): void {
		// Find an inactive particle via round-robin
		const startIdx = this.poolIndex;
		let found = false;

		for (let i = 0; i < MAX_PARTICLES; i++) {
			const idx = (startIdx + i) % MAX_PARTICLES;
			if (!this.particles[idx].active) {
				this.activateParticle(this.particles[idx], x, y, color);
				this.poolIndex = (idx + 1) % MAX_PARTICLES;
				found = true;
				break;
			}
		}

		// If no inactive particle found, recycle the oldest (round-robin position)
		if (!found) {
			this.activateParticle(this.particles[this.poolIndex], x, y, color);
			this.poolIndex = (this.poolIndex + 1) % MAX_PARTICLES;
		}
	}

	private activateParticle(
		particle: Particle,
		x: number,
		y: number,
		color: number,
	): void {
		particle.x = x;
		particle.y = y;
		particle.age = 0;
		particle.lifetime = PARTICLE_LIFETIME;
		particle.color = color;
		particle.active = true;
	}
}
